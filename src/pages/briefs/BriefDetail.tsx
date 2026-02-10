import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { aecProjectTypes, type AECProjectType } from '@/data/aecProjectTypes';
import { mockBriefs } from '@/data/mockBriefs';
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
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type BriefRow = Database['public']['Tables']['implementation_briefs']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type AdminTabKey =
  | 'overview'
  | 'requirements'
  | 'success'
  | 'constraints'
  | 'audit'
  | 'matches'
  | 'history';

type ClientTabKey = 'overview' | 'requirements' | 'success' | 'constraints' | 'shortlist';
type BriefTabKey = AdminTabKey | ClientTabKey;

type ActionKey =
  | 'sendToClient'
  | 'recall'
  | 'lock'
  | 'sendBack'
  | 'unlock'
  | 'generateMatches'
  | 'markInExecution'
  | 'markCompleted'
  | 'delete';

interface StatusUpdateOptions {
  clientReviewStartedAt?: string | null;
  clientReviewCompletedAt?: string | null;
  lockedAt?: string | null;
  lockedBy?: string | null;
  successTitle?: string;
  successDescription?: string;
  nextTab?: BriefTabKey;
}

interface AuditRow {
  path: string;
  label: string;
  value: unknown;
  source: FieldSource['source'];
  confirmedByClient: boolean;
  markedForClientInput: boolean;
  clientNote?: string;
}

const MATCH_READY_STATUSES: BriefStatus[] = [
  'Locked',
  'Matching',
  'Shortlisted',
  'Selected',
  'In Execution',
  'Completed',
];

const CLIENT_SHORTLIST_STATUSES: BriefStatus[] = ['Shortlisted', 'Selected', 'In Execution', 'Completed'];

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

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  'businessContext.companyName': 'Company',
  'businessContext.companySize': 'Company Size',
  'businessContext.industry': 'Industry Segment',
  'businessContext.currentState': 'Current State',
  'businessContext.desiredOutcome': 'Desired Outcome',
  'businessContext.keyStakeholders': 'Key Stakeholders',
  'businessContext.decisionTimeline': 'Decision Timeline',
  'constraints.budget.min': 'Budget Minimum',
  'constraints.budget.max': 'Budget Maximum',
  'constraints.budget.flexibility': 'Budget Flexibility',
  'constraints.timeline.urgency': 'Timeline Urgency',
  'constraints.timeline.hardDeadline': 'Hard Deadline',
  'constraints.timeline.reason': 'Timeline Rationale',
  'constraints.sensitivity.level': 'Sensitivity Level',
  'constraints.sensitivity.concerns': 'Sensitivity Concerns',
  'constraints.technical.mustIntegrate': 'Must Integrate Systems',
  'constraints.technical.cannotChange': 'Cannot Change Systems',
  'constraints.technical.preferences': 'Technical Preferences',
};

const formatRelativeTime = (isoDate?: string): string => {
  if (!isoDate) return '-';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '-';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

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

const formatValueForDisplay = (value: unknown): string => {
  if (value === null || value === undefined) return 'Not provided';
  if (typeof value === 'string') return value.trim().length > 0 ? value : 'Not provided';
  if (typeof value === 'number') return Number.isNaN(value) ? 'Not provided' : String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? value.map(String).join(', ') : 'Not provided';
  if (isPlainObject(value)) return JSON.stringify(value);
  return String(value);
};

const makeFieldLabel = (path: string, projectType: AECProjectType | null, brief: ImplementationBrief): string => {
  if (FIELD_LABEL_OVERRIDES[path]) return FIELD_LABEL_OVERRIDES[path];

  if (path.startsWith('intakeResponses.')) {
    const questionId = path.replace('intakeResponses.', '');
    const question = projectType?.intakeQuestions.find((candidate) => candidate.id === questionId);
    return question?.question ?? `Intake: ${questionId}`;
  }

  if (path.startsWith('successCriteria.')) {
    const index = Number(path.replace('successCriteria.', '').split('.')[0]);
    if (!Number.isNaN(index)) {
      const criterion = brief.successCriteria[index];
      if (criterion?.metric) return `Success Criterion: ${criterion.metric}`;
      return `Success Criterion ${index + 1}`;
    }
  }

  if (path.startsWith('requirements.')) {
    const index = Number(path.replace('requirements.', '').split('.')[0]);
    if (!Number.isNaN(index)) {
      const requirement = brief.requirements[index];
      if (requirement?.description) return `Requirement: ${requirement.description}`;
      return `Requirement ${index + 1}`;
    }
  }

  return path
    .replace(/\./g, ' > ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const sourceBadgeClass = (source: FieldSource['source']) => {
  switch (source) {
    case 'advisor':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    case 'client':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
    case 'document':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'ai':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const sourceBadgeLabel = (source: FieldSource['source']) => {
  switch (source) {
    case 'advisor':
      return 'Advisor';
    case 'client':
      return 'Client';
    case 'document':
      return 'Document';
    case 'ai':
      return 'AI';
    default:
      return source;
  }
};

const isMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.values(value).some(isMeaningfulValue);
  return Boolean(value);
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

export default function BriefDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { user, loading: authLoading, hasRole, isOpsOrAdmin, isUiShellMode, currentWorkspace } = useAuth();

  const isAdmin = isOpsOrAdmin || hasRole(['admin', 'ops']);
  const isClient = hasRole(['client']) && !isAdmin;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [brief, setBrief] = useState<ImplementationBrief | null>(null);
  const [advisorName, setAdvisorName] = useState<string>('Unassigned');
  const [activeTab, setActiveTab] = useState<BriefTabKey>('overview');
  const [actionInProgress, setActionInProgress] = useState<ActionKey | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditMode, setAuditMode] = useState<'all' | 'changes'>('all');

  const projectType = useMemo(() => {
    if (!brief) return null;
    return aecProjectTypes.find((candidate) => candidate.id === brief.projectTypeId) ?? null;
  }, [brief]);

  const showClientShortlistTab = useMemo(() => {
    if (!brief) return false;
    return CLIENT_SHORTLIST_STATUSES.includes(brief.status);
  }, [brief]);

  const hasMatchesAccess = useMemo(() => {
    if (!brief) return false;
    return MATCH_READY_STATUSES.includes(brief.status);
  }, [brief]);

  const auditRows = useMemo<AuditRow[]>(() => {
    if (!brief || !isAdmin) return [];

    const fieldSources = brief.fieldSources ?? {};
    const clientNotes = brief.clientNotes ?? {};

    const allPaths = new Set<string>([
      ...Object.keys(fieldSources),
      ...Object.keys(clientNotes),
    ]);

    if (allPaths.size === 0) {
      Object.entries(brief.businessContext).forEach(([key, value]) => {
        if (isMeaningfulValue(value)) allPaths.add(`businessContext.${key}`);
      });
      Object.entries(brief.intakeResponses).forEach(([key, value]) => {
        if (isMeaningfulValue(value)) allPaths.add(`intakeResponses.${key}`);
      });
      allPaths.add('constraints.budget.min');
      allPaths.add('constraints.budget.max');
      allPaths.add('constraints.budget.flexibility');
      allPaths.add('constraints.timeline.urgency');
      allPaths.add('constraints.timeline.hardDeadline');
      allPaths.add('constraints.timeline.reason');
      allPaths.add('constraints.sensitivity.level');
      allPaths.add('constraints.sensitivity.concerns');
      allPaths.add('constraints.technical.mustIntegrate');
      allPaths.add('constraints.technical.cannotChange');
      allPaths.add('constraints.technical.preferences');
    }

    return Array.from(allPaths)
      .map((path) => {
        const sourceRecord = fieldSources[path];

        return {
          path,
          label: makeFieldLabel(path, projectType, brief),
          value: getValueAtPath(brief, path),
          source: sourceRecord?.source ?? 'advisor',
          confirmedByClient: sourceRecord?.confirmedByClient ?? false,
          markedForClientInput: sourceRecord?.markedForClientInput ?? false,
          clientNote: clientNotes[path] ?? sourceRecord?.clientNotes,
        } satisfies AuditRow;
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [brief, isAdmin, projectType]);

  const filteredAuditRows = useMemo(() => {
    if (auditMode === 'all') return auditRows;
    return auditRows.filter((row) => row.source === 'client' || Boolean(row.clientNote));
  }, [auditMode, auditRows]);

  const clientChangedCount = useMemo(
    () => auditRows.filter((row) => row.source === 'client' || Boolean(row.clientNote)).length,
    [auditRows]
  );

  const clientConfirmedCount = useMemo(
    () => auditRows.filter((row) => row.confirmedByClient).length,
    [auditRows]
  );

  const pendingClientInputCount = useMemo(
    () => auditRows.filter((row) => row.markedForClientInput && !row.confirmedByClient).length,
    [auditRows]
  );

  const highRiskFlags = useMemo(() => {
    if (!brief) return [] as RiskFactor[];
    return brief.riskFactors.filter((risk) => risk.likelihood === 'High' || risk.impact === 'High');
  }, [brief]);

  const intakeEntries = useMemo(() => {
    if (!brief) return [] as Array<{ id: string; label: string; value: unknown }>;

    return Object.entries(brief.intakeResponses ?? {}).map(([questionId, value]) => {
      const questionLabel =
        projectType?.intakeQuestions.find((question) => question.id === questionId)?.question ?? questionId;

      return {
        id: questionId,
        label: questionLabel,
        value,
      };
    });
  }, [brief, projectType]);

  useEffect(() => {
    if (!brief) return;

    const allowedTabs: BriefTabKey[] = isAdmin
      ? ['overview', 'requirements', 'success', 'constraints', 'audit', 'matches', 'history']
      : [
          'overview',
          'requirements',
          'success',
          'constraints',
          ...(showClientShortlistTab ? (['shortlist'] as const) : []),
        ];

    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, brief, isAdmin, showClientShortlistTab]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAdmin && !isClient && !isUiShellMode) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAdmin, isClient, isUiShellMode, navigate]);

  useEffect(() => {
    if (authLoading) return;

    if (!id) {
      setLoading(false);
      setNotFound(true);
      setLoadError('Brief id is missing from the URL.');
      return;
    }

    let cancelled = false;

    const fetchBrief = async () => {
      setLoading(true);
      setLoadError(null);
      setNotFound(false);

      try {
        if (isUiShellMode) {
          const shellBrief = mockBriefs.find((candidate) => candidate.id === id);

          if (!shellBrief) {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('Brief not found.');
              setBrief(null);
            }
            return;
          }

          if (isClient && currentWorkspace && shellBrief.workspaceId !== currentWorkspace.id) {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('You do not have access to this brief.');
              setBrief(null);
            }
            return;
          }

          const mockAdvisorNameMap: Record<string, string> = {
            'mock-advisor-001': 'Alex Carter',
            'mock-advisor-002': 'Jordan Lee',
          };

          if (!cancelled) {
            setBrief(shellBrief);
            setAdvisorName(
              shellBrief.advisorId ? mockAdvisorNameMap[shellBrief.advisorId] ?? shellBrief.advisorId : 'Unassigned'
            );
          }
          return;
        }

        const { data, error } = await supabase
          .from('implementation_briefs')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          if (!cancelled) {
            setNotFound(true);
            setLoadError('Brief not found.');
            setBrief(null);
          }
          return;
        }

        const mappedBrief = mapRowToBrief(data as BriefRow);

        if (isClient) {
          if (!currentWorkspace || mappedBrief.workspaceId !== currentWorkspace.id) {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('You do not have access to this brief.');
              setBrief(null);
            }
            return;
          }

          if (mappedBrief.status === 'Advisor Draft') {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('This brief has not been shared with you yet.');
              setBrief(null);
            }
            return;
          }
        }

        if (!cancelled) {
          setBrief(mappedBrief);
        }

        if (mappedBrief.advisorId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', mappedBrief.advisorId)
            .maybeSingle();

          if (!cancelled) {
            const advisorProfile = profileData as Pick<ProfileRow, 'id' | 'full_name' | 'email'> | null;
            const displayName =
              advisorProfile?.full_name?.trim() ||
              advisorProfile?.email?.trim() ||
              mappedBrief.advisorId ||
              'Unassigned';
            setAdvisorName(displayName);
          }
        } else if (!cancelled) {
          setAdvisorName('Unassigned');
        }
      } catch (error: any) {
        if (!cancelled) {
          setLoadError(error?.message ?? 'Unable to load the implementation brief.');
          setBrief(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchBrief();

    return () => {
      cancelled = true;
    };
  }, [authLoading, currentWorkspace, id, isClient, isUiShellMode]);

  const applyLocalBriefUpdates = useCallback((updates: Partial<ImplementationBrief>) => {
    setBrief((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const persistBriefUpdate = useCallback(
    async (
      actionKey: ActionKey,
      dbUpdates: Database['public']['Tables']['implementation_briefs']['Update'],
      localUpdates: Partial<ImplementationBrief>,
      successTitle: string,
      successDescription: string
    ) => {
      if (!brief) return false;

      setActionInProgress(actionKey);

      try {
        if (isUiShellMode) {
          applyLocalBriefUpdates(localUpdates);
          toast({
            title: successTitle,
            description: successDescription,
          });
          return true;
        }

        const { data, error } = await supabase
          .from('implementation_briefs')
          .update(dbUpdates)
          .eq('id', brief.id)
          .select('*')
          .single();

        if (error) throw error;

        setBrief(mapRowToBrief(data as BriefRow));
        toast({
          title: successTitle,
          description: successDescription,
        });
        return true;
      } catch (error: any) {
        toast({
          title: 'Update failed',
          description: error?.message ?? 'Unable to update this brief right now.',
          variant: 'destructive',
        });
        return false;
      } finally {
        setActionInProgress(null);
      }
    },
    [applyLocalBriefUpdates, brief, isUiShellMode, toast]
  );

  const updateBriefStatus = useCallback(
    async (actionKey: ActionKey, status: BriefStatus, options: StatusUpdateOptions = {}) => {
      const dbUpdates: Database['public']['Tables']['implementation_briefs']['Update'] = {
        status,
      };

      const localUpdates: Partial<ImplementationBrief> = {
        status,
      };

      if ('clientReviewStartedAt' in options) {
        dbUpdates.client_review_started_at = options.clientReviewStartedAt ?? null;
        localUpdates.clientReviewStartedAt = options.clientReviewStartedAt ?? undefined;
      }

      if ('clientReviewCompletedAt' in options) {
        dbUpdates.client_review_completed_at = options.clientReviewCompletedAt ?? null;
        localUpdates.clientReviewCompletedAt = options.clientReviewCompletedAt ?? undefined;
      }

      if ('lockedAt' in options) {
        dbUpdates.locked_at = options.lockedAt ?? null;
        localUpdates.lockedAt = options.lockedAt ?? undefined;
      }

      if ('lockedBy' in options) {
        dbUpdates.locked_by = options.lockedBy ?? null;
        localUpdates.lockedBy = options.lockedBy ?? undefined;
      }

      const successTitle = options.successTitle ?? 'Brief updated';
      const successDescription = options.successDescription ?? `Status changed to ${status}.`;

      const updated = await persistBriefUpdate(actionKey, dbUpdates, localUpdates, successTitle, successDescription);

      if (updated && options.nextTab) {
        setActiveTab(options.nextTab);
      }

      return updated;
    },
    [persistBriefUpdate]
  );

  const handleDelete = useCallback(async () => {
    if (!brief) return;

    setActionInProgress('delete');

    try {
      if (!isUiShellMode) {
        const { error } = await supabase.from('implementation_briefs').delete().eq('id', brief.id);
        if (error) throw error;
      }

      toast({
        title: 'Brief deleted',
        description: 'The advisor draft has been deleted.',
      });

      setDeleteDialogOpen(false);
      navigate('/briefs');
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message ?? 'Unable to delete this brief.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(null);
    }
  }, [brief, isUiShellMode, navigate, toast]);

  const handleSendToClient = useCallback(async () => {
    const now = new Date().toISOString();
    await updateBriefStatus('sendToClient', 'Client Review', {
      clientReviewStartedAt: now,
      clientReviewCompletedAt: null,
      successTitle: 'Sent to client',
      successDescription: 'The brief is now visible to the client for guided review.',
    });
  }, [updateBriefStatus]);

  const handleRecallToDraft = useCallback(async () => {
    await updateBriefStatus('recall', 'Advisor Draft', {
      clientReviewStartedAt: null,
      clientReviewCompletedAt: null,
      successTitle: 'Brief recalled',
      successDescription: 'This brief is back in advisor draft mode.',
    });
  }, [updateBriefStatus]);

  const handleSendBackToClient = useCallback(async () => {
    await updateBriefStatus('sendBack', 'Client Review', {
      clientReviewCompletedAt: null,
      successTitle: 'Sent back to client',
      successDescription: 'The client can continue reviewing the brief.',
    });
  }, [updateBriefStatus]);

  const handleLockBrief = useCallback(async () => {
    const now = new Date().toISOString();
    await updateBriefStatus('lock', 'Locked', {
      lockedAt: now,
      lockedBy: user?.id ?? null,
      successTitle: 'Brief locked',
      successDescription: 'The brief is locked and ready for matching.',
    });
  }, [updateBriefStatus, user?.id]);

  const handleUnlockBrief = useCallback(async () => {
    await updateBriefStatus('unlock', 'In Review', {
      lockedAt: null,
      lockedBy: null,
      successTitle: 'Brief unlocked',
      successDescription: 'The brief is now editable for additional review changes.',
    });
  }, [updateBriefStatus]);

  const handleGenerateMatches = useCallback(async () => {
    await updateBriefStatus('generateMatches', 'Matching', {
      successTitle: 'Matching started',
      successDescription: 'Provider matching has been queued for this brief.',
      nextTab: 'matches',
    });
  }, [updateBriefStatus]);

  const handleMarkInExecution = useCallback(async () => {
    await updateBriefStatus('markInExecution', 'In Execution', {
      successTitle: 'Moved to execution',
      successDescription: 'This engagement is now in execution tracking.',
    });
  }, [updateBriefStatus]);

  const handleMarkCompleted = useCallback(async () => {
    await updateBriefStatus('markCompleted', 'Completed', {
      successTitle: 'Brief completed',
      successDescription: 'The implementation lifecycle is now marked completed.',
    });
  }, [updateBriefStatus]);

  const runAdminProgressView = useCallback(() => {
    setAuditMode('all');
    setActiveTab('audit');
  }, []);

  const runAdminReviewChanges = useCallback(() => {
    setAuditMode('changes');
    setActiveTab('audit');
  }, []);

  const getProjectSubtitle = useMemo(() => {
    if (!projectType) {
      if (!brief?.projectTypeId || brief?.projectTypeId === 'other') return 'Custom project type';
      return brief.projectTypeId;
    }

    return `${projectType.name} (${projectType.category})`;
  }, [brief?.projectTypeId, projectType]);

  const clientStatusMessage = useMemo(() => {
    if (!brief || isAdmin) return null;

    switch (brief.status) {
      case 'In Review':
        return 'Your advisor is reviewing your brief.';
      case 'Locked':
      case 'Matching':
        return 'Your advisor is matching providers.';
      case 'Shortlisted':
        return 'Your shortlist is ready to review.';
      case 'Selected':
        return 'Your selected provider is now tracked in this brief.';
      case 'In Execution':
        return 'Your implementation is in execution.';
      case 'Completed':
        return 'This implementation brief is complete.';
      default:
        return null;
    }
  }, [brief, isAdmin]);

  const renderActionButton = (
    key: ActionKey,
    label: string,
    onClick: () => void,
    variant: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' = 'default',
    disabled?: boolean
  ) => (
    <Button key={key} variant={variant} size="sm" onClick={onClick} disabled={disabled || actionInProgress !== null}>
      {actionInProgress === key && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
      {label}
    </Button>
  );

  const adminActions = useMemo(() => {
    if (!brief || !isAdmin) return null;

    switch (brief.status) {
      case 'Advisor Draft':
        return (
          <>
            {renderActionButton('sendToClient', 'Send to Client', handleSendToClient, 'default')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/admin/briefs/create?briefId=${brief.id}`)}
              disabled={actionInProgress !== null}
            >
              Continue Editing
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={actionInProgress !== null}
            >
              Delete
            </Button>
          </>
        );

      case 'Client Review':
        return (
          <>
            <Button size="sm" variant="outline" onClick={runAdminProgressView} disabled={actionInProgress !== null}>
              View Client Progress
            </Button>
            {renderActionButton('recall', 'Recall', handleRecallToDraft, 'secondary')}
          </>
        );

      case 'In Review':
        return (
          <>
            <Button size="sm" variant="outline" onClick={runAdminReviewChanges} disabled={actionInProgress !== null}>
              Review Changes
            </Button>
            {renderActionButton('lock', 'Lock Brief', handleLockBrief, 'default')}
            {renderActionButton('sendBack', 'Send Back to Client', handleSendBackToClient, 'secondary')}
          </>
        );

      case 'Locked':
        return (
          <>
            {renderActionButton('generateMatches', 'Generate Matches', handleGenerateMatches, 'default')}
            {renderActionButton('unlock', 'Unlock', handleUnlockBrief, 'secondary')}
          </>
        );

      case 'Matching':
      case 'Shortlisted':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('matches')} disabled={actionInProgress !== null}>
            View Matches
          </Button>
        );

      case 'Selected':
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('matches')} disabled={actionInProgress !== null}>
              View Selection
            </Button>
            {renderActionButton('markInExecution', 'Move to In Execution', handleMarkInExecution, 'default')}
          </>
        );

      case 'In Execution':
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('history')} disabled={actionInProgress !== null}>
              View Progress
            </Button>
            {renderActionButton('markCompleted', 'Mark Completed', handleMarkCompleted, 'default')}
          </>
        );

      case 'Completed':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('history')} disabled={actionInProgress !== null}>
            View History
          </Button>
        );

      default:
        return null;
    }
  }, [
    actionInProgress,
    brief,
    handleGenerateMatches,
    handleLockBrief,
    handleMarkCompleted,
    handleMarkInExecution,
    handleRecallToDraft,
    handleSendBackToClient,
    handleSendToClient,
    handleUnlockBrief,
    isAdmin,
    navigate,
    runAdminProgressView,
    runAdminReviewChanges,
  ]);

  const clientActions = useMemo(() => {
    if (!brief || isAdmin) return null;

    switch (brief.status) {
      case 'Client Review':
        return (
          <Button size="sm" onClick={() => navigate(`/briefs/${brief.id}/review`)}>
            Continue Review
          </Button>
        );
      case 'Shortlisted':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('shortlist')}>
            View Your Shortlist
          </Button>
        );
      case 'Selected':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('shortlist')}>
            View Selection
          </Button>
        );
      case 'In Execution':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('overview')}>
            View Progress
          </Button>
        );
      default:
        return null;
    }
  }, [brief, isAdmin, navigate]);

  if (loading || authLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Implementation Brief" description="Loading brief details..." showBack />
        <div className="page-content">
          <Card>
            <CardContent className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading brief details...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (notFound || !brief) {
    return (
      <div className="page-content">
        <EmptyState
          icon={AlertCircle}
          title="Brief not found"
          description={loadError ?? 'This brief may have been removed or you do not have access.'}
          action={{ label: 'Back to Briefs', onClick: () => navigate('/briefs') }}
        />
      </div>
    );
  }

  if (loadError && !notFound) {
    return (
      <div className="page-content">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load brief"
          description={loadError}
          action={{ label: 'Back to Briefs', onClick: () => navigate('/briefs') }}
        />
      </div>
    );
  }

  const title = brief.title?.trim() || 'Untitled Brief';

  return (
    <div className="page-container">
      <PageHeader
        title={title}
        description={isAdmin ? `${getProjectSubtitle} • Advisor: ${advisorName}` : getProjectSubtitle}
        showBack
        actions={
          <div className="flex items-center gap-2">
            {isAdmin ? adminActions : clientActions}
          </div>
        }
      />

      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/40">
        <StatusBadge status={brief.status} variant="brief" />
        <span className="text-xs text-muted-foreground">Updated {formatRelativeTime(brief.updatedAt)}</span>
      </div>

      {!isAdmin && clientStatusMessage ? (
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">{clientStatusMessage}</p>
        </div>
      ) : null}

      <div className={cn('page-content', isAdmin ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6' : 'space-y-4')}>
        <div>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BriefTabKey)}>
            <TabsList className="mb-4 flex-wrap h-auto bg-muted/60 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="success">Success Criteria</TabsTrigger>
              <TabsTrigger value="constraints">Constraints</TabsTrigger>

              {isAdmin ? (
                <>
                  <TabsTrigger value="audit">Field Audit</TabsTrigger>
                  <TabsTrigger value="matches">Matches</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </>
              ) : (
                showClientShortlistTab && <TabsTrigger value="shortlist">Shortlist</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Business Context</CardTitle>
                  <CardDescription>What Sablecrest understands about your current situation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Company</p>
                    <p className="text-sm">{brief.businessContext.companyName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Size</p>
                    <p className="text-sm">{brief.businessContext.companySize || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Segment</p>
                    <p className="text-sm">{brief.businessContext.industry || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Decision Timeline</p>
                    <p className="text-sm">{brief.businessContext.decisionTimeline || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Current State</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.businessContext.currentState || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Desired Outcome</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.businessContext.desiredOutcome || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Key Stakeholders</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.businessContext.keyStakeholders || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">{projectType?.name ?? brief.projectTypeId}</p>
                  {projectType && (
                    <>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{projectType.category}</p>
                      <p className="text-sm text-muted-foreground">{projectType.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {isAdmin ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Assessment</CardTitle>
                      <CardDescription>Advisor-only risk factors used for matching and planning.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {brief.riskFactors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No risk factors captured yet.</p>
                      ) : (
                        brief.riskFactors.map((risk) => (
                          <div key={risk.id} className="rounded-md border border-border p-3 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{risk.category}</Badge>
                              <Badge variant="secondary">Likelihood: {risk.likelihood}</Badge>
                              <Badge variant="secondary">Impact: {risk.impact}</Badge>
                            </div>
                            <p className="text-sm">{risk.description}</p>
                            {risk.mitigation ? (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Mitigation:</span> {risk.mitigation}
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Advisor Notes</CardTitle>
                      <CardDescription>Internal assessment and discovery context.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Discovery Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{brief.discoveryNotes || 'No discovery notes recorded.'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Advisor Assessment</p>
                        <p className="text-sm whitespace-pre-wrap">{brief.advisorNotes || 'No advisor assessment recorded.'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Intake Responses</CardTitle>
                  <CardDescription>Detailed inputs collected for this implementation brief.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {intakeEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No intake responses have been captured yet.</p>
                  ) : (
                    intakeEntries.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{entry.label}</p>
                        <p className="text-sm whitespace-pre-wrap">{formatValueForDisplay(entry.value)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="success" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Success Criteria</CardTitle>
                  <CardDescription>
                    {isAdmin
                      ? 'Criteria used to evaluate implementation outcomes and provider fit.'
                      : 'How success will be measured for your implementation.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {brief.successCriteria.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No success criteria are defined yet.</p>
                  ) : (
                    brief.successCriteria.map((criterion, index) => (
                      <div key={criterion.id || `criterion-${index}`} className="rounded-md border border-border p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{criterion.metric || `Criterion ${index + 1}`}</p>
                          {isAdmin && criterion.source ? (
                            <Badge
                              variant="secondary"
                              className={
                                criterion.source === 'advisor'
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                  : criterion.source === 'client'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              }
                            >
                              {criterion.source === 'advisor'
                                ? 'Suggested by Sablecrest'
                                : criterion.source === 'client'
                                ? 'Client Added'
                                : 'AI Suggested'}
                            </Badge>
                          ) : null}
                          {isAdmin && criterion.confirmedByClient ? (
                            <Badge variant="outline">Confirmed by client</Badge>
                          ) : null}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Baseline</p>
                            <p className="text-sm">{criterion.baseline || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Target</p>
                            <p className="text-sm">{criterion.target || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Measurement Method</p>
                            <p className="text-sm">{criterion.measurementMethod || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Timeframe</p>
                            <p className="text-sm">{criterion.timeframe || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Weight</p>
                            <p className="text-sm">{criterion.weight ?? 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Budget</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Minimum</p>
                    <p className="text-sm">
                      {typeof brief.constraints.budget.min === 'number'
                        ? `$${brief.constraints.budget.min.toLocaleString()}`
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Maximum</p>
                    <p className="text-sm">
                      {typeof brief.constraints.budget.max === 'number'
                        ? `$${brief.constraints.budget.max.toLocaleString()}`
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Flexibility</p>
                    <p className="text-sm">{brief.constraints.budget.flexibility}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Urgency</p>
                    <p className="text-sm">{brief.constraints.timeline.urgency || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Hard Deadline</p>
                    <p className="text-sm">{brief.constraints.timeline.hardDeadline || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Reason</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.constraints.timeline.reason || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Level</p>
                    <p className="text-sm">{brief.constraints.sensitivity.level || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Concerns</p>
                    <p className="text-sm">
                      {brief.constraints.sensitivity.concerns?.length
                        ? brief.constraints.sensitivity.concerns.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Must Integrate</p>
                    <p className="text-sm">
                      {brief.constraints.technical.mustIntegrate?.length
                        ? brief.constraints.technical.mustIntegrate.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Cannot Change</p>
                    <p className="text-sm">
                      {brief.constraints.technical.cannotChange?.length
                        ? brief.constraints.technical.cannotChange.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Preferences</p>
                    <p className="text-sm">
                      {brief.constraints.technical.preferences?.length
                        ? brief.constraints.technical.preferences.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin ? (
              <TabsContent value="audit" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Field Audit</CardTitle>
                    <CardDescription>
                      Track field source, client confirmations, and client notes across this brief.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {clientConfirmedCount} confirmed by client
                      </Badge>
                      <Badge variant="secondary">
                        {clientChangedCount} changed by client
                      </Badge>
                      <Badge variant="secondary">
                        {pendingClientInputCount} pending {pluralize(pendingClientInputCount, 'field')}
                      </Badge>

                      <div className="ml-auto flex gap-2">
                        <Button
                          size="sm"
                          variant={auditMode === 'all' ? 'default' : 'outline'}
                          onClick={() => setAuditMode('all')}
                        >
                          All Fields
                        </Button>
                        <Button
                          size="sm"
                          variant={auditMode === 'changes' ? 'default' : 'outline'}
                          onClick={() => setAuditMode('changes')}
                        >
                          Client Changes
                        </Button>
                      </div>
                    </div>

                    {filteredAuditRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {auditMode === 'changes'
                          ? 'No client-originated field changes detected yet.'
                          : 'No field audit data available yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredAuditRows.map((row) => (
                          <div key={row.path} className="rounded-md border border-border p-3 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{row.label}</p>
                              <Badge variant="secondary" className={sourceBadgeClass(row.source)}>
                                {sourceBadgeLabel(row.source)}
                              </Badge>
                              {row.confirmedByClient ? (
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Confirmed
                                </Badge>
                              ) : null}
                              {row.markedForClientInput ? (
                                <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-700">
                                  Needs client input
                                </Badge>
                              ) : null}
                            </div>

                            <p className="text-sm whitespace-pre-wrap">{formatValueForDisplay(row.value)}</p>

                            {row.clientNote ? (
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                <span className="font-medium">Client note:</span> {row.clientNote}
                              </p>
                            ) : null}

                            <p className="text-[11px] text-muted-foreground">{row.path}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {isAdmin ? (
              <TabsContent value="matches" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Provider Matches</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hasMatchesAccess ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Matching and shortlist workflows are coming in Phase 5. This tab will show scored
                          recommendations, advisor shortlist rationale, and engagement readiness.
                        </p>
                        {brief.status === 'Locked' ? (
                          <Button size="sm" onClick={handleGenerateMatches} disabled={actionInProgress !== null}>
                            {actionInProgress === 'generateMatches' ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : null}
                            Generate Matches
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Lock brief to generate matches.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {isAdmin ? (
              <TabsContent value="history" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>Versioning and activity timeline placeholder.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Created:</span> {formatRelativeTime(brief.createdAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last updated:</span> {formatRelativeTime(brief.updatedAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Client review started:</span>{' '}
                      {formatRelativeTime(brief.clientReviewStartedAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Client review completed:</span>{' '}
                      {formatRelativeTime(brief.clientReviewCompletedAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Locked:</span> {formatRelativeTime(brief.lockedAt)}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {!isAdmin && showClientShortlistTab ? (
              <TabsContent value="shortlist" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Curated Shortlist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Your advisor-curated shortlist will appear here, including provider rationale and recommendation notes.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>

        {isAdmin ? (
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Advisor Notes Panel</CardTitle>
                <CardDescription>Internal context visible to admin and ops only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Discovery Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{brief.discoveryNotes || 'No discovery notes recorded.'}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Advisor Assessment</p>
                  <p className="text-sm whitespace-pre-wrap">{brief.advisorNotes || 'No advisor assessment recorded.'}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Risk Flags</p>
                  {highRiskFlags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No high-risk flags identified.</p>
                  ) : (
                    <ul className="space-y-2">
                      {highRiskFlags.map((risk) => (
                        <li key={risk.id} className="text-sm rounded-md border border-border px-2.5 py-2">
                          <p className="font-medium">{risk.category}</p>
                          <p className="text-muted-foreground">{risk.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Internal Notes</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {brief.advisorNotes || 'No additional internal notes have been captured yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete advisor draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently deletes the brief and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress === 'delete'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionInProgress === 'delete'}
            >
              {actionInProgress === 'delete' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
