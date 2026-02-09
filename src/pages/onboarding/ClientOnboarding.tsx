import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, Loader2, MessageSquareText } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BriefRow {
  id: string;
  title: string;
  project_type_id: string;
  status: string;
  field_sources: Json | null;
  advisor_id: string | null;
  updated_at: string;
}

interface ClientProfileRow {
  assigned_advisor_id: string | null;
}

interface AdvisorProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ReviewBrief {
  id: string;
  title: string;
  projectTypeName: string;
  fieldsNeedingInput: number;
  advisorId: string | null;
}

const FALLBACK_ADVISOR_NAME = 'Your advisor';

const getFirstName = (user: ReturnType<typeof useAuth>['user']): string => {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const firstName = typeof metadata?.first_name === 'string' ? metadata.first_name.trim() : '';
  if (firstName) return firstName;

  const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';
  if (fullName) return fullName.split(' ')[0] ?? fullName;

  const emailPrefix = user?.email?.split('@')[0]?.trim();
  return emailPrefix || 'there';
};

const countFieldsNeedingInput = (fieldSources: Json | null): number => {
  if (!fieldSources || typeof fieldSources !== 'object' || Array.isArray(fieldSources)) {
    return 0;
  }

  return Object.values(fieldSources as Record<string, unknown>).reduce((count, sourceValue) => {
    if (!sourceValue || typeof sourceValue !== 'object' || Array.isArray(sourceValue)) {
      return count;
    }

    const markedForClientInput = (sourceValue as Record<string, unknown>).markedForClientInput;
    return markedForClientInput === true ? count + 1 : count;
  }, 0);
};

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading, hasRole, currentWorkspace, workspaces } = useAuth();

  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<ReviewBrief[]>([]);
  const [advisorName, setAdvisorName] = useState(FALLBACK_ADVISOR_NAME);
  const [primaryAdvisorId, setPrimaryAdvisorId] = useState<string | null>(null);

  const projectTypeLookup = useMemo(
    () => new Map(aecProjectTypes.map((type) => [type.id, type.name])),
    []
  );

  const firstName = useMemo(() => getFirstName(user), [user]);
  const isClient = hasRole(['client']);

  useEffect(() => {
    if (authLoading) return;

    if (!isClient) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let isMounted = true;

    const fetchOnboardingData = async () => {
      setLoading(true);

      try {
        const db = supabase as any;
        let workspaceId: string | null = currentWorkspace?.id ?? workspaces[0]?.id ?? null;

        if (!workspaceId && user?.id) {
          const { data: membershipData } = await db
            .from('memberships')
            .select('workspace_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          workspaceId = membershipData?.workspace_id ?? null;
        }

        if (!workspaceId) {
          if (!isMounted) return;
          setBriefs([]);
          setAdvisorName(FALLBACK_ADVISOR_NAME);
          setPrimaryAdvisorId(null);
          setLoading(false);
          return;
        }

        const { data: briefData, error: briefError } = await db
          .from('implementation_briefs')
          .select('id,title,project_type_id,status,field_sources,advisor_id,updated_at')
          .eq('workspace_id', workspaceId)
          .eq('status', 'Client Review')
          .order('updated_at', { ascending: false });

        if (briefError) throw briefError;

        const briefRows = (briefData ?? []) as BriefRow[];

        const { data: clientProfileData } = await db
          .from('client_profiles')
          .select('assigned_advisor_id')
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        const assignedAdvisorId = (clientProfileData as ClientProfileRow | null)?.assigned_advisor_id ?? null;

        const reviewBriefs: ReviewBrief[] = briefRows.map((brief) => ({
          id: brief.id,
          title: brief.title,
          projectTypeName: projectTypeLookup.get(brief.project_type_id) || 'Implementation Project',
          fieldsNeedingInput: countFieldsNeedingInput(brief.field_sources),
          advisorId: brief.advisor_id,
        }));

        const advisorIds = Array.from(
          new Set(
            [
              assignedAdvisorId,
              ...reviewBriefs.map((brief) => brief.advisorId),
            ].filter((id): id is string => typeof id === 'string' && id.length > 0)
          )
        );

        const advisorLookup = new Map<string, string>();

        if (advisorIds.length > 0) {
          const { data: advisorData } = await db
            .from('profiles')
            .select('id,full_name,email')
            .in('id', advisorIds);

          (advisorData as AdvisorProfileRow[] | null | undefined)?.forEach((advisor) => {
            advisorLookup.set(
              advisor.id,
              advisor.full_name?.trim() || advisor.email?.trim() || FALLBACK_ADVISOR_NAME
            );
          });
        }

        const resolvedAdvisorId = assignedAdvisorId ?? reviewBriefs[0]?.advisorId ?? null;
        const resolvedAdvisorName = resolvedAdvisorId
          ? advisorLookup.get(resolvedAdvisorId) || FALLBACK_ADVISOR_NAME
          : FALLBACK_ADVISOR_NAME;

        if (!isMounted) return;

        setBriefs(reviewBriefs);
        setPrimaryAdvisorId(resolvedAdvisorId);
        setAdvisorName(resolvedAdvisorName);
      } catch (error) {
        console.error('Failed to load client onboarding data', error);
        if (!isMounted) return;
        setBriefs([]);
        setPrimaryAdvisorId(null);
        setAdvisorName(FALLBACK_ADVISOR_NAME);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchOnboardingData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, currentWorkspace?.id, isClient, navigate, projectTypeLookup, user?.id, workspaces]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-20">
        <div className="mx-auto flex max-w-2xl items-center justify-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your onboarding experience...
          </div>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return null;
  }

  const messageHref = primaryAdvisorId ? `/messages?to=${primaryAdvisorId}` : '/messages';
  const singleBrief = briefs.length === 1 ? briefs[0] : null;

  return (
    <div className="min-h-screen bg-background px-6 py-12 md:py-20">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Welcome to Sablecrest, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {advisorName} has prepared your implementation brief based on your discovery conversation.
          </p>
          <p className="text-sm text-muted-foreground md:text-base">
            We have captured what we understood about your needs and have a few items that need your input.
          </p>
        </header>

        {briefs.length === 0 ? (
          <Card className="border-border/80 bg-card/80">
            <CardContent className="space-y-4 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Your advisor is still preparing your brief. You will be notified when it is ready.
              </p>
              <Button asChild variant="outline">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {singleBrief ? (
          <>
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="space-y-3 pb-4">
                <CardTitle className="text-xl font-semibold">{singleBrief.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{singleBrief.projectTypeName}</Badge>
                  <Badge variant="secondary">Ready for your review</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-sm text-muted-foreground">
                  {singleBrief.fieldsNeedingInput} field{singleBrief.fieldsNeedingInput === 1 ? '' : 's'} need your input
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              This should take about 10-15 minutes.
            </div>

            <div className="space-y-3 text-center">
              <Button
                size="lg"
                className="h-12 w-full text-base"
                onClick={() => navigate(`/briefs/${singleBrief.id}/review`)}
              >
                Review Your Brief
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button asChild variant="link" className="text-muted-foreground">
                <Link to={messageHref}>
                  <MessageSquareText className="mr-1 h-4 w-4" />
                  I have questions first
                </Link>
              </Button>
            </div>
          </>
        ) : null}

        {briefs.length > 1 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Each brief should take about 10-15 minutes.
            </div>

            {briefs.map((brief) => (
              <Card key={brief.id} className="border-border/80 bg-card shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{brief.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{brief.projectTypeName}</Badge>
                      <Badge variant="secondary">Ready for your review</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {brief.fieldsNeedingInput} field{brief.fieldsNeedingInput === 1 ? '' : 's'} need your input
                    </p>
                  </div>
                  <Button onClick={() => navigate(`/briefs/${brief.id}/review`)}>
                    Review
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            <div className="text-center">
              <Button asChild variant="link" className="text-muted-foreground">
                <Link to={messageHref}>
                  <MessageSquareText className="mr-1 h-4 w-4" />
                  I have questions first
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
