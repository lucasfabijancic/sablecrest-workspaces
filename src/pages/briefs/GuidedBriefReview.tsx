import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { aecProjectTypes, type AECProjectType } from '@/data/aecProjectTypes';
import { getMockBriefById } from '@/data/mockBriefs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type {
  BriefConstraints,
  BriefRequirement,
  BriefStatus,
  BusinessContext,
  FieldSource,
  ImplementationBrief,
  RiskFactor,
  SuccessCriterion,
} from '@/types/brief';
import ConfirmSituation from '@/components/briefs/review/ConfirmSituation';
import DefineSuccess from '@/components/briefs/review/DefineSuccess';
import FillDetails from '@/components/briefs/review/FillDetails';
import ReviewSubmit from '@/components/briefs/review/ReviewSubmit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type BriefRow = Database['public']['Tables']['implementation_briefs']['Row'];
type IntakeQuestion = AECProjectType['intakeQuestions'][number];

const REQUIRED_BUSINESS_CONTEXT_FIELDS: Array<{ key: keyof BusinessContext; label: string }> = [
  { key: 'companyName', label: 'Company' },
  { key: 'companySize', label: 'Size' },
  { key: 'industry', label: 'Segment' },
  { key: 'currentState', label: 'Current State' },
  { key: 'desiredOutcome', label: 'Desired Outcome' },
  { key: 'keyStakeholders', label: 'Key Stakeholders' },
  { key: 'decisionTimeline', label: 'Decision Timeline' },
];

const EMPTY_BUSINESS_CONTEXT: BusinessContext = {
  companyName: '',
  companySize: '',
  industry: '',
  currentState: '',
  desiredOutcome: '',
  keyStakeholders: '',
  decisionTimeline: '',
};

const EMPTY_CONSTRAINTS: BriefConstraints = {
  budget: {
    min: undefined,
    max: undefined,
    flexibility: 'Flexible',
  },
  timeline: {
    urgency: 'Flexible',
    hardDeadline: '',
    reason: '',
  },
  sensitivity: {
    level: 'Standard',
    concerns: [],
  },
  technical: {
    mustIntegrate: [],
    cannotChange: [],
    preferences: [],
  },
};

const EMPTY_INTAKE_RESPONSES: Record<string, any> = {};
const OTHER_OPTION = 'Other';
const OTHER_PREFIX = 'Other: ';

const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return value;
  if (isPlainObject(value)) return Object.values(value).some(hasMeaningfulValue);
  return Boolean(value);
};

const isOtherValue = (value: string) => value.startsWith(OTHER_PREFIX);
const extractOtherText = (value: string) => (isOtherValue(value) ? value.slice(OTHER_PREFIX.length) : '');

const isQuestionAnswered = (question: IntakeQuestion, value: unknown) => {
  switch (question.type) {
    case 'multiselect': {
      const selectedValues = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];

      if (selectedValues.length === 0) return false;

      return selectedValues.some((item) => {
        if (item === OTHER_OPTION || isOtherValue(item)) {
          const otherText = extractOtherText(item === OTHER_OPTION ? `${OTHER_PREFIX}` : item);
          return otherText.trim().length > 0;
        }

        return item.trim().length > 0;
      });
    }
    case 'number':
      if (value === '' || value === null || value === undefined) return false;
      if (typeof value === 'number') return !Number.isNaN(value);
      if (typeof value === 'string') return value.trim().length > 0 && !Number.isNaN(Number(value));
      return false;
    case 'select': {
      if (typeof value !== 'string') return false;
      if (value === OTHER_OPTION) return false;
      if (isOtherValue(value)) return extractOtherText(value).trim().length > 0;
      return value.trim().length > 0;
    }
    case 'text':
    case 'textarea':
      return typeof value === 'string' && value.trim().length > 0;
    default:
      return hasMeaningfulValue(value);
  }
};

const toBusinessContext = (value: unknown): BusinessContext => {
  if (!isPlainObject(value)) return EMPTY_BUSINESS_CONTEXT;

  return {
    companyName: typeof value.companyName === 'string' ? value.companyName : '',
    companySize: typeof value.companySize === 'string' ? value.companySize : '',
    industry: typeof value.industry === 'string' ? value.industry : '',
    currentState: typeof value.currentState === 'string' ? value.currentState : '',
    desiredOutcome: typeof value.desiredOutcome === 'string' ? value.desiredOutcome : '',
    keyStakeholders: typeof value.keyStakeholders === 'string' ? value.keyStakeholders : '',
    decisionTimeline: typeof value.decisionTimeline === 'string' ? value.decisionTimeline : '',
  };
};

const toBriefConstraints = (value: unknown): BriefConstraints => {
  if (!isPlainObject(value)) return EMPTY_CONSTRAINTS;

  const budget = isPlainObject(value.budget) ? value.budget : {};
  const timeline = isPlainObject(value.timeline) ? value.timeline : {};
  const sensitivity = isPlainObject(value.sensitivity) ? value.sensitivity : {};
  const technical = isPlainObject(value.technical) ? value.technical : {};

  return {
    budget: {
      min: typeof budget.min === 'number' ? budget.min : undefined,
      max: typeof budget.max === 'number' ? budget.max : undefined,
      flexibility:
        typeof budget.flexibility === 'string' && budget.flexibility === 'Firm'
          ? 'Firm'
          : 'Flexible',
    },
    timeline: {
      urgency:
        typeof timeline.urgency === 'string' && timeline.urgency
          ? (timeline.urgency as BriefConstraints['timeline']['urgency'])
          : 'Flexible',
      hardDeadline: typeof timeline.hardDeadline === 'string' ? timeline.hardDeadline : '',
      reason: typeof timeline.reason === 'string' ? timeline.reason : '',
    },
    sensitivity: {
      level:
        typeof sensitivity.level === 'string' && sensitivity.level
          ? (sensitivity.level as BriefConstraints['sensitivity']['level'])
          : 'Standard',
      concerns: toStringArray(sensitivity.concerns),
    },
    technical: {
      mustIntegrate: toStringArray(technical.mustIntegrate),
      cannotChange: toStringArray(technical.cannotChange),
      preferences: toStringArray(technical.preferences),
    },
  };
};

const toFieldSources = (value: unknown): Record<string, FieldSource> | undefined => {
  if (!isPlainObject(value)) return undefined;

  const result: Record<string, FieldSource> = {};

  Object.entries(value).forEach(([fieldPath, sourceValue]) => {
    if (!isPlainObject(sourceValue)) return;

    const source = sourceValue.source;
    const normalizedSource: FieldSource['source'] =
      source === 'client' || source === 'document' || source === 'ai' || source === 'advisor'
        ? source
        : 'advisor';

    result[fieldPath] = {
      source: normalizedSource,
      confirmedByClient: sourceValue.confirmedByClient === true,
      confirmedAt: typeof sourceValue.confirmedAt === 'string' ? sourceValue.confirmedAt : undefined,
      clientNotes: typeof sourceValue.clientNotes === 'string' ? sourceValue.clientNotes : undefined,
      markedForClientInput: sourceValue.markedForClientInput === true,
    };
  });

  return Object.keys(result).length > 0 ? result : undefined;
};

const toClientNotes = (value: unknown): Record<string, string> | undefined => {
  if (!isPlainObject(value)) return undefined;

  const notes: Record<string, string> = {};

  Object.entries(value).forEach(([path, note]) => {
    if (typeof note !== 'string') return;
    if (note.trim().length === 0) return;
    notes[path] = note;
  });

  return Object.keys(notes).length > 0 ? notes : undefined;
};

const mapRowToBrief = (row: BriefRow): ImplementationBrief => ({
  id: row.id,
  workspaceId: row.workspace_id,
  title: row.title ?? '',
  projectTypeId: row.project_type_id,
  status: row.status as BriefStatus,
  currentVersion: row.current_version ?? 1,
  businessContext: toBusinessContext(row.business_context),
  requirements: toArray<BriefRequirement>(row.requirements),
  successCriteria: toArray<SuccessCriterion>(row.success_criteria),
  constraints: toBriefConstraints(row.constraints),
  riskFactors: toArray<RiskFactor>(row.risk_factors),
  intakeResponses: isPlainObject(row.intake_responses) ? row.intake_responses : EMPTY_INTAKE_RESPONSES,
  advisorId: row.advisor_id ?? undefined,
  advisorNotes: row.advisor_notes ?? undefined,
  discoveryDate: row.discovery_date ?? undefined,
  discoveryNotes: row.discovery_notes ?? undefined,
  clientReviewStartedAt: row.client_review_started_at ?? undefined,
  clientReviewCompletedAt: row.client_review_completed_at ?? undefined,
  fieldSources: toFieldSources(row.field_sources),
  clientNotes: toClientNotes(row.client_notes),
  lockedAt: row.locked_at ?? undefined,
  lockedBy: row.locked_by ?? undefined,
  ownerId: row.owner_id ?? row.advisor_id ?? 'unknown-owner',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getValueAtPath = (source: unknown, path: string): unknown => {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const numericIndex = Number(segment);
      if (Number.isNaN(numericIndex)) return undefined;
      return current[numericIndex];
    }

    if (isPlainObject(current)) {
      return current[segment];
    }

    return undefined;
  }, source);
};

export default function GuidedBriefReview() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const {
    user,
    loading: authLoading,
    hasRole,
    isOpsOrAdmin,
    isUiShellMode,
    currentWorkspace,
    memberships,
    workspaces,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [brief, setBrief] = useState<ImplementationBrief | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const briefRef = useRef<ImplementationBrief | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const changeCounterRef = useRef(0);

  useEffect(() => {
    briefRef.current = brief;
  }, [brief]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const isClient = hasRole(['client']);

  const projectType = useMemo(() => {
    if (!brief) return null;
    return aecProjectTypes.find((candidate) => candidate.id === brief.projectTypeId) ?? null;
  }, [brief]);

  const completionStatus = useMemo(() => {
    if (!brief) return [] as { section: string; complete: boolean; issues: string[] }[];

    const missingBusinessFields = REQUIRED_BUSINESS_CONTEXT_FIELDS.filter(
      (field) => !hasMeaningfulValue(brief.businessContext[field.key])
    );

    const sectionA = {
      section: 'Confirm Your Situation',
      complete: missingBusinessFields.length === 0,
      issues:
        missingBusinessFields.length === 0
          ? []
          : [`Missing: ${missingBusinessFields.map((field) => field.label).join(', ')}`],
    };

    const sectionBIssues: string[] = [];

    if (brief.projectTypeId === 'other' || !projectType) {
      const hasGeneralRequirements = hasMeaningfulValue(brief.intakeResponses?.['general-requirements']);
      if (!hasGeneralRequirements) {
        sectionBIssues.push('Describe your project requirements.');
      }
    } else {
      const missingQuestions = projectType.intakeQuestions.filter((question) => {
        if (!question.required) return false;
        return !isQuestionAnswered(question, brief.intakeResponses?.[question.id]);
      });

      if (missingQuestions.length > 0) {
        sectionBIssues.push(`${missingQuestions.length} required item${missingQuestions.length === 1 ? '' : 's'} need your input.`);
      }
    }

    const sectionB = {
      section: 'Fill In the Details',
      complete: sectionBIssues.length === 0,
      issues: sectionBIssues,
    };

    const completedCriteria = brief.successCriteria.filter(
      (criterion) => hasMeaningfulValue(criterion.metric) && hasMeaningfulValue(criterion.target)
    );

    const sectionC = {
      section: 'Define Success',
      complete: completedCriteria.length > 0,
      issues:
        completedCriteria.length > 0
          ? []
          : ['Add at least one success criterion with both metric and target.'],
    };

    const sectionDIssues: string[] = [];
    if (!hasMeaningfulValue(brief.constraints.timeline.urgency)) {
      sectionDIssues.push('Set timeline urgency.');
    }
    if (!hasMeaningfulValue(brief.constraints.sensitivity.level)) {
      sectionDIssues.push('Set sensitivity level.');
    }

    const sectionD = {
      section: 'Review & Submit',
      complete: sectionDIssues.length === 0,
      issues: sectionDIssues,
    };

    return [sectionA, sectionB, sectionC, sectionD];
  }, [brief, projectType]);

  const progressSummary = useMemo(() => {
    const total = completionStatus.length;
    const completed = completionStatus.filter((item) => item.complete).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, progress };
  }, [completionStatus]);

  const markDirty = useCallback(() => {
    changeCounterRef.current += 1;
    setHasUnsavedChanges(true);
  }, []);

  const handleUpdate = useCallback(
    (updates: Partial<ImplementationBrief>) => {
      setBrief((previous) => (previous ? { ...previous, ...updates } : previous));
      markDirty();
    },
    [markDirty]
  );

  const handleConfirmField = useCallback(
    (fieldPath: string) => {
      setBrief((previous) => {
        if (!previous) return previous;

        const currentValue = getValueAtPath(previous, fieldPath);
        const valueExists = hasMeaningfulValue(currentValue);
        const existing = previous.fieldSources?.[fieldPath];

        const nextSource: FieldSource = {
          source: existing?.source ?? (valueExists ? 'advisor' : 'client'),
          confirmedByClient: valueExists ? true : existing?.confirmedByClient ?? false,
          confirmedAt: valueExists ? new Date().toISOString() : existing?.confirmedAt,
          clientNotes: existing?.clientNotes,
          markedForClientInput: valueExists ? false : existing?.markedForClientInput ?? true,
        };

        return {
          ...previous,
          fieldSources: {
            ...(previous.fieldSources ?? {}),
            [fieldPath]: nextSource,
          },
        };
      });

      markDirty();
    },
    [markDirty]
  );

  const persistBrief = useCallback(
    async (
      status: Extract<BriefStatus, 'Client Review' | 'In Review'>,
      options?: { silent?: boolean; skipIfUnchanged?: boolean }
    ): Promise<boolean> => {
      const activeBrief = briefRef.current;

      if (!activeBrief) return false;
      if (options?.skipIfUnchanged && !hasUnsavedChangesRef.current) return true;
      if (saveInFlightRef.current) return false;

      const startChangeCounter = changeCounterRef.current;
      saveInFlightRef.current = true;

      try {
        const completedAt =
          status === 'In Review'
            ? new Date().toISOString()
            : activeBrief.clientReviewCompletedAt ?? null;

        if (isUiShellMode) {
          setBrief((previous) => {
            if (!previous) return previous;

            return {
              ...previous,
              status,
              clientReviewCompletedAt: completedAt ?? undefined,
              updatedAt: new Date().toISOString(),
            };
          });

          if (changeCounterRef.current === startChangeCounter) {
            setHasUnsavedChanges(false);
          }

          return true;
        }

        const payload = {
          title: activeBrief.title,
          project_type_id: activeBrief.projectTypeId,
          status,
          current_version: activeBrief.currentVersion,
          business_context: activeBrief.businessContext,
          requirements: activeBrief.requirements,
          success_criteria: activeBrief.successCriteria,
          constraints: activeBrief.constraints,
          risk_factors: activeBrief.riskFactors,
          intake_responses: activeBrief.intakeResponses,
          advisor_id: activeBrief.advisorId ?? null,
          advisor_notes: activeBrief.advisorNotes ?? null,
          discovery_date: activeBrief.discoveryDate ?? null,
          discovery_notes: activeBrief.discoveryNotes ?? null,
          client_review_started_at: activeBrief.clientReviewStartedAt ?? null,
          client_review_completed_at: completedAt,
          field_sources: activeBrief.fieldSources ?? {},
          client_notes: activeBrief.clientNotes ?? {},
          locked_at: activeBrief.lockedAt ?? null,
          locked_by: activeBrief.lockedBy ?? null,
          owner_id: activeBrief.ownerId,
          workspace_id: activeBrief.workspaceId,
        };

        const { data, error } = await supabase
          .from('implementation_briefs')
          .update(payload)
          .eq('id', activeBrief.id)
          .select('*')
          .single();

        if (error) throw error;

        const mapped = mapRowToBrief(data as BriefRow);

        if (changeCounterRef.current === startChangeCounter) {
          setBrief(mapped);
          setHasUnsavedChanges(false);
        } else {
          setBrief((previous) => {
            if (!previous) return previous;
            return {
              ...previous,
              status: mapped.status,
              clientReviewCompletedAt: mapped.clientReviewCompletedAt,
              updatedAt: mapped.updatedAt,
            };
          });
        }

        return true;
      } catch (error: any) {
        if (!options?.silent) {
          toast({
            title: 'Unable to save brief',
            description: error?.message ?? 'Please try again.',
            variant: 'destructive',
          });
        }

        return false;
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [isUiShellMode, toast]
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    const success = await persistBrief('In Review');

    setIsSubmitting(false);

    if (!success) return;

    toast({
      title: 'Brief submitted. Your Sablecrest advisor will review and begin provider matching.',
    });

    navigate('/dashboard');
  }, [navigate, persistBrief, toast]);

  const handleSaveProgress = useCallback(async () => {
    const success = await persistBrief('Client Review');
    if (!success) return;

    toast({
      title: 'Progress saved.',
    });
  }, [persistBrief, toast]);

  const handleSilentAutoSave = useCallback(async () => {
    await persistBrief('Client Review', { silent: true, skipIfUnchanged: true });
  }, [persistBrief]);

  const handleAskQuestion = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  useEffect(() => {
    if (authLoading) return;

    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    if (isOpsOrAdmin) {
      navigate(`/briefs/${id}`, { replace: true });
      return;
    }

    if (!isClient) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let isMounted = true;

    const fetchBrief = async () => {
      setLoading(true);
      setLoadError(null);
      setNotFound(false);

      try {
        if (isUiShellMode) {
          const mockBrief = getMockBriefById(id);

          if (!mockBrief) {
            if (!isMounted) return;
            setNotFound(true);
            return;
          }

          if (mockBrief.status !== 'Client Review') {
            toast({
              title: 'Brief is not in review state',
              description: 'This brief is not currently in Client Review.',
            });
            navigate(`/briefs/${id}`, { replace: true });
            return;
          }

          if (!isMounted) return;
          setBrief(mockBrief);
          setHasUnsavedChanges(false);
          return;
        }

        const { data, error } = await supabase
          .from('implementation_briefs')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          if (!isMounted) return;
          setNotFound(true);
          return;
        }

        let accessibleWorkspaceIds = new Set<string>([
          ...workspaces.map((workspace) => workspace.id),
          ...memberships.map((membership) => membership.workspace_id),
        ]);

        if (currentWorkspace?.id) {
          accessibleWorkspaceIds.add(currentWorkspace.id);
        }

        if (accessibleWorkspaceIds.size === 0 && user?.id) {
          const { data: membershipRows } = await supabase
            .from('memberships')
            .select('workspace_id')
            .eq('user_id', user.id);

          accessibleWorkspaceIds = new Set(
            (membershipRows ?? []).map((membership) => membership.workspace_id)
          );
        }

        if (!accessibleWorkspaceIds.has(data.workspace_id)) {
          if (!isMounted) return;
          setNotFound(true);
          return;
        }

        const mapped = mapRowToBrief(data as BriefRow);

        if (mapped.status !== 'Client Review') {
          toast({
            title: 'Brief is not in review state',
            description: 'This brief is not currently in Client Review.',
          });
          navigate(`/briefs/${id}`, { replace: true });
          return;
        }

        if (!isMounted) return;

        setBrief(mapped);
        setHasUnsavedChanges(false);
      } catch (error: any) {
        if (!isMounted) return;
        setLoadError(error?.message ?? 'Failed to load this brief.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchBrief();

    return () => {
      isMounted = false;
    };
  }, [
    authLoading,
    currentWorkspace?.id,
    id,
    isClient,
    isOpsOrAdmin,
    isUiShellMode,
    memberships,
    navigate,
    toast,
    user?.id,
    workspaces,
  ]);

  useEffect(() => {
    if (!brief) return;

    const intervalId = window.setInterval(() => {
      if (!hasUnsavedChangesRef.current) return;
      if (saveInFlightRef.current) return;
      if (isSubmitting) return;

      void handleSilentAutoSave();
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [brief, handleSilentAutoSave, isSubmitting]);

  if (authLoading || loading) {
    return (
      <div className="page-container">
        <div className="page-content flex min-h-[320px] items-center justify-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading guided review...
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-container">
        <Card className="mx-auto mt-6 max-w-2xl border-destructive/40">
          <CardHeader>
            <CardTitle className="text-xl">Unable to load brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={() => navigate('/briefs')}>
              Back to Briefs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound || !brief) {
    return (
      <div className="page-container">
        <Card className="mx-auto mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Brief not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We could not find this brief in your workspace.
            </p>
            <Button variant="outline" onClick={() => navigate('/briefs')}>
              Back to Briefs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 pb-16">
      <Card className="border-border/80">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Guided Brief Review</CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
              <span>Progress</span>
              <span>
                {progressSummary.completed}/{progressSummary.total} complete
              </span>
            </div>
            <Progress value={progressSummary.progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pt-0">
          {completionStatus.map((item) => (
            <div key={item.section} className="flex items-center gap-2 text-sm">
              {item.complete ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={item.complete ? 'text-foreground' : 'text-muted-foreground'}>{item.section}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">A.</span>
          Confirm Your Situation
        </div>
        <ConfirmSituation
          brief={brief}
          projectType={projectType}
          onUpdate={handleUpdate}
          onConfirmField={handleConfirmField}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">B.</span>
          Fill In the Details
        </div>
        <FillDetails brief={brief} projectType={projectType} onUpdate={handleUpdate} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">C.</span>
          Define Success
        </div>
        <DefineSuccess brief={brief} projectType={projectType} onUpdate={handleUpdate} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">D.</span>
          Review & Submit
        </div>
        <ReviewSubmit
          brief={brief}
          projectType={projectType}
          onUpdate={handleUpdate}
          onSubmit={handleSubmit}
          onSaveProgress={handleSaveProgress}
          onAskQuestion={handleAskQuestion}
          isSubmitting={isSubmitting}
          completionStatus={completionStatus}
        />
      </section>

      {hasUnsavedChanges ? (
        <div className="inline-flex items-center gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5" />
          Unsaved changes. Progress autosaves every 60 seconds.
        </div>
      ) : null}
    </div>
  );
}
