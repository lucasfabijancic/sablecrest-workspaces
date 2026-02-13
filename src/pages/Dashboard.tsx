import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus, Users, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockBriefs } from '@/data/mockBriefs';
import type { BriefStatus, ImplementationBrief } from '@/types/brief';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type BriefRow = Database['public']['Tables']['implementation_briefs']['Row'];
type ClientProfileRow = Database['public']['Tables']['client_profiles']['Row'];
type WorkspaceRow = Database['public']['Tables']['workspaces']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type PipelineStatus = 'Advisor Draft' | 'Client Review' | 'In Review' | 'Locked' | 'In Execution';

type DashboardBrief = Pick<
  ImplementationBrief,
  'id' | 'workspaceId' | 'title' | 'status' | 'updatedAt' | 'clientReviewStartedAt' | 'advisorId'
> & {
  businessCompanyName?: string;
};

interface ClientProfileSummary {
  companyLegalName: string;
  assignedAdvisorId?: string;
}

const PIPELINE_STATUSES: PipelineStatus[] = [
  'Advisor Draft',
  'Client Review',
  'In Review',
  'Locked',
  'In Execution',
];

const CLIENT_STATUS_PRIORITY: Record<BriefStatus, number> = {
  Draft: 99,
  'Advisor Draft': 99,
  'Client Review': 1,
  'In Review': 2,
  Locked: 3,
  Matching: 4,
  Shortlisted: 5,
  Selected: 6,
  'In Execution': 7,
  Completed: 8,
  Cancelled: 98,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mapRowToDashboardBrief = (row: BriefRow): DashboardBrief => {
  const businessContext = isPlainObject(row.business_context) ? row.business_context : undefined;
  const businessCompanyName =
    businessContext && typeof businessContext.companyName === 'string' ? businessContext.companyName : undefined;

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title ?? 'Untitled Brief',
    status: row.status as BriefStatus,
    updatedAt: row.updated_at,
    clientReviewStartedAt: row.client_review_started_at ?? undefined,
    advisorId: row.advisor_id ?? undefined,
    businessCompanyName,
  };
};

const formatRelativeTime = (value?: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

const daysSince = (value?: string): number => {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;

  const diffMs = Date.now() - parsed.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const advisorNameFromProfile = (profile: Pick<ProfileRow, 'full_name' | 'email'> | undefined): string => {
  if (!profile) return 'Sablecrest Advisor';
  if (profile.full_name && profile.full_name.trim().length > 0) return profile.full_name;
  if (profile.email && profile.email.trim().length > 0) return profile.email;
  return 'Sablecrest Advisor';
};

const getClientNextStep = (brief: DashboardBrief): { description: string; ctaLabel?: string; ctaPath?: string } => {
  switch (brief.status) {
    case 'Client Review':
      return {
        description: 'Your advisor prepared this brief. Review and confirm details so matching can begin.',
        ctaLabel: 'Review Your Brief',
        ctaPath: `/briefs/${brief.id}/review`,
      };
    case 'In Review':
      return {
        description: 'Your advisor is reviewing your updates. No action needed right now.',
      };
    case 'Locked':
    case 'Matching':
      return {
        description: 'Provider matching is in progress. Your advisor will share recommendations shortly.',
      };
    case 'Shortlisted':
      return {
        description: 'Your shortlist is ready. Review curated provider recommendations.',
        ctaLabel: 'View Your Shortlist',
        ctaPath: `/briefs/${brief.id}`,
      };
    case 'Selected':
      return {
        description: 'Provider selected. Engagement setup is underway.',
      };
    case 'In Execution':
      return {
        description: 'Implementation is underway. Your advisor is tracking execution progress.',
      };
    case 'Completed':
      return {
        description: 'This implementation brief is complete.',
      };
    default:
      return {
        description: 'Your advisor is preparing next steps for this brief.',
      };
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { hasRole, currentWorkspace, isUiShellMode } = useAuth();

  const isOpsOrAdmin = hasRole(['admin', 'ops']);
  const isClient = hasRole(['client']) && !isOpsOrAdmin;

  const [briefs, setBriefs] = useState<DashboardBrief[]>([]);
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [clientProfilesByWorkspace, setClientProfilesByWorkspace] = useState<Record<string, ClientProfileSummary>>({});
  const [advisorNames, setAdvisorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isUiShellMode) {
          const shellBriefs: DashboardBrief[] = mockBriefs
            .filter((brief) => (isClient ? brief.status !== 'Advisor Draft' : true))
            .map((brief) => ({
              id: brief.id,
              workspaceId: brief.workspaceId,
              title: brief.title,
              status: brief.status,
              updatedAt: brief.updatedAt,
              clientReviewStartedAt: brief.clientReviewStartedAt,
              advisorId: brief.advisorId,
              businessCompanyName: brief.businessContext.companyName,
            }));

          const mockAdvisorNames: Record<string, string> = {
            'mock-advisor-001': 'Alex Carter',
            'mock-advisor-002': 'Jordan Lee',
          };

          const profileMap: Record<string, ClientProfileSummary> = {};
          shellBriefs.forEach((brief) => {
            if (!profileMap[brief.workspaceId]) {
              profileMap[brief.workspaceId] = {
                companyLegalName: brief.businessCompanyName || 'Demo Client',
                assignedAdvisorId: brief.advisorId,
              };
            }
          });

          if (!cancelled) {
            setBriefs(shellBriefs);
            setAdvisorNames(mockAdvisorNames);
            setClientProfilesByWorkspace(profileMap);
            setWorkspaceNames(
              Object.keys(profileMap).reduce<Record<string, string>>((acc, workspaceId) => {
                acc[workspaceId] = 'Demo Workspace';
                return acc;
              }, {})
            );
          }

          return;
        }

        if (!isOpsOrAdmin && !currentWorkspace) {
          if (!cancelled) {
            setBriefs([]);
            setClientProfilesByWorkspace({});
            setWorkspaceNames({});
            setAdvisorNames({});
          }
          return;
        }

        let briefQuery = supabase
          .from('implementation_briefs')
          .select('id, workspace_id, title, status, updated_at, client_review_started_at, business_context, advisor_id')
          .order('updated_at', { ascending: false });

        if (!isOpsOrAdmin && currentWorkspace) {
          briefQuery = briefQuery.eq('workspace_id', currentWorkspace.id);
        }

        const { data: briefRows, error: briefError } = await briefQuery;

        if (briefError) throw briefError;

        const mappedBriefs = ((briefRows ?? []) as BriefRow[])
          .map(mapRowToDashboardBrief)
          .filter((brief) => (isClient ? brief.status !== 'Advisor Draft' : true));

        const workspaceIds = Array.from(new Set(mappedBriefs.map((brief) => brief.workspaceId)));

        let clientProfiles: ClientProfileRow[] = [];
        if (workspaceIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from('client_profiles')
            .select('workspace_id, company_legal_name, assigned_advisor_id')
            .in('workspace_id', workspaceIds);

          if (profileError) throw profileError;
          clientProfiles = (profileRows ?? []) as ClientProfileRow[];
        }

        let workspaceRows: WorkspaceRow[] = [];
        if (isOpsOrAdmin && workspaceIds.length > 0) {
          const { data: wsRows, error: wsError } = await supabase
            .from('workspaces')
            .select('id, name')
            .in('id', workspaceIds);

          if (wsError) throw wsError;
          workspaceRows = (wsRows ?? []) as WorkspaceRow[];
        }

        const clientProfileMap = clientProfiles.reduce<Record<string, ClientProfileSummary>>((acc, profile) => {
          if (!acc[profile.workspace_id]) {
            acc[profile.workspace_id] = {
              companyLegalName: profile.company_legal_name,
              assignedAdvisorId: profile.assigned_advisor_id ?? undefined,
            };
          }
          return acc;
        }, {});

        const workspaceNameMap = workspaceRows.reduce<Record<string, string>>((acc, workspace) => {
          acc[workspace.id] = workspace.name;
          return acc;
        }, {});

        const advisorIds = Array.from(
          new Set(
            [
              ...mappedBriefs.map((brief) => brief.advisorId),
              ...clientProfiles.map((profile) => profile.assigned_advisor_id ?? undefined),
            ].filter((value): value is string => Boolean(value))
          )
        );

        let advisorMap: Record<string, string> = {};
        if (advisorIds.length > 0) {
          const { data: advisorRows, error: advisorError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', advisorIds);

          if (advisorError) throw advisorError;

          advisorMap = ((advisorRows ?? []) as Pick<ProfileRow, 'id' | 'full_name' | 'email'>[]).reduce<Record<string, string>>(
            (acc, profile) => {
              acc[profile.id] = advisorNameFromProfile(profile);
              return acc;
            },
            {}
          );
        }

        if (!cancelled) {
          setBriefs(mappedBriefs);
          setClientProfilesByWorkspace(clientProfileMap);
          setWorkspaceNames(workspaceNameMap);
          setAdvisorNames(advisorMap);
        }
      } catch (fetchError: any) {
        if (!cancelled) {
          setError(fetchError?.message ?? 'Unable to load dashboard data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [currentWorkspace, isClient, isOpsOrAdmin, isUiShellMode]);

  const pipelineCounts = useMemo(() => {
    return PIPELINE_STATUSES.reduce<Record<PipelineStatus, number>>((acc, status) => {
      acc[status] = briefs.filter((brief) => brief.status === status).length;
      return acc;
    }, {
      'Advisor Draft': 0,
      'Client Review': 0,
      'In Review': 0,
      'Locked': 0,
      'In Execution': 0,
    });
  }, [briefs]);

  const recentBriefs = useMemo(() => {
    return [...briefs]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [briefs]);

  const attentionBriefs = useMemo(() => {
    return briefs.filter((brief) => {
      if (brief.status === 'In Review') return true;

      if (brief.status === 'Client Review') {
        const ageDays = daysSince(brief.clientReviewStartedAt || brief.updatedAt);
        return ageDays > 3;
      }

      return false;
    });
  }, [briefs]);

  const clientFacingBriefs = useMemo(() => {
    return briefs.filter((brief) => brief.status !== 'Advisor Draft' && brief.status !== 'Cancelled');
  }, [briefs]);

  const activeClientBrief = useMemo(() => {
    if (clientFacingBriefs.length === 0) return null;

    const sorted = [...clientFacingBriefs].sort((a, b) => {
      const priorityDiff = CLIENT_STATUS_PRIORITY[a.status] - CLIENT_STATUS_PRIORITY[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return sorted[0] ?? null;
  }, [clientFacingBriefs]);

  const activeClientNextStep = useMemo(() => {
    if (!activeClientBrief) return null;
    return getClientNextStep(activeClientBrief);
  }, [activeClientBrief]);

  const activeClientName = useMemo(() => {
    if (!activeClientBrief) return '';

    const profileName = clientProfilesByWorkspace[activeClientBrief.workspaceId]?.companyLegalName;
    if (profileName && profileName.trim().length > 0) return profileName;

    if (activeClientBrief.businessCompanyName && activeClientBrief.businessCompanyName.trim().length > 0) {
      return activeClientBrief.businessCompanyName;
    }

    return 'Your company';
  }, [activeClientBrief, clientProfilesByWorkspace]);

  const assignedAdvisorName = useMemo(() => {
    const workspaceAdvisorId = currentWorkspace
      ? clientProfilesByWorkspace[currentWorkspace.id]?.assignedAdvisorId
      : undefined;

    const activeBriefAdvisorId = activeClientBrief?.advisorId;
    const advisorId = activeBriefAdvisorId || workspaceAdvisorId;

    if (!advisorId) return 'Sablecrest Advisor';
    return advisorNames[advisorId] ?? 'Sablecrest Advisor';
  }, [activeClientBrief?.advisorId, advisorNames, clientProfilesByWorkspace, currentWorkspace]);

  const getClientNameForBrief = (brief: DashboardBrief): string => {
    const fromProfile = clientProfilesByWorkspace[brief.workspaceId]?.companyLegalName;
    if (fromProfile && fromProfile.trim().length > 0) return fromProfile;

    const fromWorkspace = workspaceNames[brief.workspaceId];
    if (fromWorkspace && fromWorkspace.trim().length > 0) return fromWorkspace;

    if (brief.businessCompanyName && brief.businessCompanyName.trim().length > 0) return brief.businessCompanyName;

    return 'Unknown client';
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader title="Dashboard" description="Loading dashboard..." />
        <div className="page-content">
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">Loading dashboard data...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load dashboard"
          description={error}
          action={{ label: 'Go to Briefs', onClick: () => navigate('/briefs') }}
        />
      </div>
    );
  }

  if (!isOpsOrAdmin && !isClient) {
    return (
      <div className="page-content">
        <EmptyState
          icon={FileText}
          title="Dashboard unavailable"
          description="Your role does not currently have a dashboard view assigned."
          action={{ label: 'Open Briefs', onClick: () => navigate('/briefs') }}
        />
      </div>
    );
  }

  if (isOpsOrAdmin) {
    return (
      <div className="page-container">
        <PageHeader title="Dashboard" description="Advisory pipeline and brief operations" />

        <div className="page-content space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Pipeline Summary</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PIPELINE_STATUSES.map((status) => (
                <Card key={status}>
                  <CardContent className="py-4 space-y-2">
                    <StatusBadge status={status} variant="brief" />
                    <p className="text-2xl font-semibold tabular-nums">{pipelineCounts[status]}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Recent Briefs</CardTitle>
                <CardDescription>Most recently updated implementation briefs.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentBriefs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No briefs yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-3 font-medium">Client</th>
                          <th className="py-2 pr-3 font-medium">Title</th>
                          <th className="py-2 pr-3 font-medium">Status</th>
                          <th className="py-2 font-medium">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBriefs.map((brief) => (
                          <tr
                            key={brief.id}
                            className="border-b border-border/70 hover:bg-muted/30 cursor-pointer"
                            onClick={() => navigate(`/briefs/${brief.id}`)}
                          >
                            <td className="py-3 pr-3">{getClientNameForBrief(brief)}</td>
                            <td className="py-3 pr-3 font-medium">{brief.title}</td>
                            <td className="py-3 pr-3">
                              <StatusBadge status={brief.status} variant="brief" />
                            </td>
                            <td className="py-3 text-muted-foreground">{formatRelativeTime(brief.updatedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clients Needing Attention</CardTitle>
                  <CardDescription>Briefs awaiting client or advisor action.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attentionBriefs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No immediate blockers.</p>
                  ) : (
                    attentionBriefs.slice(0, 8).map((brief) => {
                      const staleClientReview =
                        brief.status === 'Client Review' &&
                        daysSince(brief.clientReviewStartedAt || brief.updatedAt) > 3;

                      return (
                        <div key={brief.id} className="rounded-md border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{getClientNameForBrief(brief)}</p>
                            <StatusBadge status={brief.status} variant="brief" />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{brief.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {staleClientReview
                              ? `Client Review pending ${daysSince(brief.clientReviewStartedAt || brief.updatedAt)} days`
                              : 'In Review waiting advisor action'}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" onClick={() => navigate('/admin/clients/new')}>
                    <Users className="h-4 w-4 mr-2" />
                    New Client Setup
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/briefs/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Brief
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/briefs')}>
                    <FileText className="h-4 w-4 mr-2" />
                    View All Briefs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader title="Dashboard" description="Your active Sablecrest engagement" />

      <div className="page-content max-w-3xl space-y-6">
        {activeClientBrief ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{activeClientName}</CardTitle>
              <CardDescription>{activeClientBrief.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={activeClientBrief.status} variant="brief" />
                <span className="text-xs text-muted-foreground">Updated {formatRelativeTime(activeClientBrief.updatedAt)}</span>
              </div>

              <p className="text-sm text-muted-foreground">{activeClientNextStep?.description}</p>

              {activeClientNextStep?.ctaLabel && activeClientNextStep.ctaPath ? (
                <Button onClick={() => navigate(activeClientNextStep.ctaPath)}>
                  {activeClientNextStep.ctaLabel}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10">
              <p className="text-sm text-muted-foreground">
                Your Sablecrest advisor is preparing your implementation brief. You will be notified when it is ready
                for review.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Advisor Contact</CardTitle>
            <CardDescription>{assignedAdvisorName}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/messages')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
