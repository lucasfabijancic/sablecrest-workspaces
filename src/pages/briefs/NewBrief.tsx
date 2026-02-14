import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { TimelineUrgency } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ClientProfileAdvisorRow {
  assigned_advisor_id: string | null;
}

type UrgencyOption = 'Urgent' | 'Next quarter' | 'Next fiscal year' | 'Just exploring';

interface RequestFormData {
  projectTypeId: string;
  otherProjectType: string;
  whatNeed: string;
  budgetMin: string;
  budgetMax: string;
  urgency: UrgencyOption | '';
  additionalContext: string;
}

const URGENCY_OPTIONS: UrgencyOption[] = [
  'Urgent',
  'Next quarter',
  'Next fiscal year',
  'Just exploring',
];

const INITIAL_FORM_DATA: RequestFormData = {
  projectTypeId: '',
  otherProjectType: '',
  whatNeed: '',
  budgetMin: '',
  budgetMax: '',
  urgency: '',
  additionalContext: '',
};

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
};

const mapUrgencyToTimeline = (urgency: UrgencyOption | ''): TimelineUrgency => {
  switch (urgency) {
    case 'Urgent':
      return 'Within 2 weeks';
    case 'Next quarter':
      return 'Within 3 months';
    case 'Next fiscal year':
      return 'Flexible';
    case 'Just exploring':
      return 'Flexible';
    default:
      return 'Flexible';
  }
};

export default function NewBrief() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace, user, loading: authLoading, isOpsOrAdmin, isUiShellMode } = useAuth();

  const [formData, setFormData] = useState<RequestFormData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProjectType = useMemo(
    () => aecProjectTypes.find((projectType) => projectType.id === formData.projectTypeId),
    [formData.projectTypeId]
  );

  useEffect(() => {
    if (authLoading) return;

    if (isOpsOrAdmin) {
      navigate('/admin/briefs/create', { replace: true });
    }
  }, [authLoading, isOpsOrAdmin, navigate]);

  const updateField = <K extends keyof RequestFormData>(field: K, value: RequestFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.projectTypeId) {
      nextErrors.projectTypeId = 'Select a project type.';
    }

    if (formData.projectTypeId === 'other' && !formData.otherProjectType.trim()) {
      nextErrors.otherProjectType = 'Describe the project type.';
    }

    if (!formData.whatNeed.trim()) {
      nextErrors.whatNeed = 'Tell your advisor what you need.';
    }

    if (!formData.urgency) {
      nextErrors.urgency = 'Select how urgent this request is.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    if (!user || !currentWorkspace) {
      toast({
        title: 'Missing account context',
        description: 'Please select a workspace and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (isUiShellMode) {
      toast({
        title: 'Request submitted',
        description:
          'UI shell mode is active. No data was persisted, but this flow works as expected.',
      });
      navigate('/dashboard');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: clientProfileRow, error: clientProfileError } = await supabase
        .from('client_profiles')
        .select('assigned_advisor_id')
        .eq('workspace_id', currentWorkspace.id)
        .maybeSingle();

      if (clientProfileError) throw clientProfileError;

      const assignedAdvisorId = (clientProfileRow as ClientProfileAdvisorRow | null)?.assigned_advisor_id ?? null;

      if (!assignedAdvisorId) {
        toast({
          title: 'Advisor assignment missing',
          description: 'Your workspace does not have an assigned advisor yet. Please contact Sablecrest support.',
          variant: 'destructive',
        });
        return;
      }

      const budgetMin = parseOptionalNumber(formData.budgetMin);
      const budgetMax = parseOptionalNumber(formData.budgetMax);
      const timelineUrgency = mapUrgencyToTimeline(formData.urgency);
      const projectTypeId = formData.projectTypeId === 'other' ? 'other' : formData.projectTypeId;
      const projectTypeLabel =
        formData.projectTypeId === 'other'
          ? formData.otherProjectType.trim()
          : selectedProjectType?.name ?? 'Implementation Project';

      const businessContext = {
        companyName: currentWorkspace.name,
        companySize: '',
        industry: '',
        currentState: formData.additionalContext.trim(),
        desiredOutcome: formData.whatNeed.trim(),
        keyStakeholders: '',
        decisionTimeline: formData.urgency,
      };

      const constraints = {
        budget: {
          min: budgetMin,
          max: budgetMax,
          flexibility: 'Flexible' as const,
        },
        timeline: {
          urgency: timelineUrgency,
          reason: `Client requested timeline: ${formData.urgency}`,
        },
        sensitivity: {
          level: 'Standard' as const,
          concerns: [],
        },
        technical: {
          mustIntegrate: [],
          cannotChange: [],
          preferences: [],
        },
      };

      const intakeResponses: Record<string, string> = {
        requestSummary: formData.whatNeed.trim(),
        requestedUrgency: formData.urgency,
      };

      if (formData.projectTypeId === 'other' && formData.otherProjectType.trim()) {
        intakeResponses.otherProjectType = formData.otherProjectType.trim();
      }

      if (formData.additionalContext.trim()) {
        intakeResponses.additionalContext = formData.additionalContext.trim();
      }

      const { error: insertError } = await supabase.from('implementation_briefs').insert({
        workspace_id: currentWorkspace.id,
        title: `${currentWorkspace.name} — ${projectTypeLabel}`,
        project_type_id: projectTypeId,
        status: 'Advisor Draft',
        business_context: businessContext,
        requirements: [],
        success_criteria: [],
        constraints,
        risk_factors: [],
        intake_responses: intakeResponses,
        owner_id: user.id,
        advisor_id: assignedAdvisorId,
      });

      if (insertError) throw insertError;

      toast({
        title: 'Request submitted. Your Sablecrest advisor will reach out within 1 business day.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Unable to submit request',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 text-muted-foreground">Loading...</div>
    );
  }

  if (isOpsOrAdmin) {
    return null;
  }

  if (!currentWorkspace) {
    return <div className="p-6 text-center text-muted-foreground">Please select a workspace first.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/briefs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to briefs
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Request a New Implementation Brief</CardTitle>
          <CardDescription>
            Tell your Sablecrest advisor what you need, and they will build your brief.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectType">What kind of project?</Label>
              <Select
                value={formData.projectTypeId || undefined}
                onValueChange={(value) => updateField('projectTypeId', value)}
              >
                <SelectTrigger id="projectType">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {aecProjectTypes.map((projectType) => (
                    <SelectItem key={projectType.id} value={projectType.id}>
                      {projectType.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.projectTypeId ? (
                <p className="text-sm text-destructive">{validationErrors.projectTypeId}</p>
              ) : null}
            </div>

            {formData.projectTypeId === 'other' ? (
              <div className="space-y-2">
                <Label htmlFor="otherProjectType">Describe the project type</Label>
                <Textarea
                  id="otherProjectType"
                  rows={3}
                  value={formData.otherProjectType}
                  onChange={(event) => updateField('otherProjectType', event.target.value)}
                  placeholder="Describe the type of implementation you need."
                />
                {validationErrors.otherProjectType ? (
                  <p className="text-sm text-destructive">{validationErrors.otherProjectType}</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="whatNeed">What do you need?</Label>
              <Textarea
                id="whatNeed"
                rows={5}
                value={formData.whatNeed}
                onChange={(event) => updateField('whatNeed', event.target.value)}
                placeholder="Describe what you are trying to accomplish. Your advisor will follow up with detailed questions."
              />
              {validationErrors.whatNeed ? (
                <p className="text-sm text-destructive">{validationErrors.whatNeed}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Rough budget range (optional)</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.budgetMin}
                  onChange={(event) => updateField('budgetMin', event.target.value)}
                  placeholder="Minimum budget"
                />
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.budgetMax}
                  onChange={(event) => updateField('budgetMax', event.target.value)}
                  placeholder="Maximum budget"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">How urgent is this?</Label>
              <Select
                value={formData.urgency || undefined}
                onValueChange={(value) => updateField('urgency', value as UrgencyOption)}
              >
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.urgency ? (
                <p className="text-sm text-destructive">{validationErrors.urgency}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalContext">Any additional context</Label>
              <Textarea
                id="additionalContext"
                rows={4}
                value={formData.additionalContext}
                onChange={(event) => updateField('additionalContext', event.target.value)}
                placeholder="Anything else your advisor should know before follow-up."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/briefs')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
