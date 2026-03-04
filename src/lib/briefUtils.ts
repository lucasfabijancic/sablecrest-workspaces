import { formatDistanceToNow } from 'date-fns';
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
import type { MatchingResult, ShortlistEntry } from '@/types/matching';
import type { AECProjectType } from '@/data/aecProjectTypes';
import type { ClientPreference } from '@/components/matching/ClientShortlistView';

export type BriefRow = Database['public']['Tables']['implementation_briefs']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type AdminTabKey =
  | 'overview'
  | 'requirements'
  | 'success'
  | 'constraints'
  | 'audit'
  | 'matches'
  | 'history';

export type ClientTabKey = 'overview' | 'requirements' | 'success' | 'constraints' | 'shortlist';
export type BriefTabKey = AdminTabKey | ClientTabKey;

export type ActionKey =
  | 'sendToClient'
  | 'recall'
  | 'lock'
  | 'sendBack'
  | 'unlock'
  | 'generateMatches'
  | 'markInExecution'
  | 'markCompleted'
  | 'presentShortlist'
  | 'selectProvider'
  | 'delete';

export interface StatusUpdateOptions {
  clientReviewStartedAt?: string | null;
  clientReviewCompletedAt?: string | null;
  lockedAt?: string | null;
  lockedBy?: string | null;
  successTitle?: string;
  successDescription?: string;
  nextTab?: BriefTabKey;
}

export interface AuditRow {
  path: string;
  label: string;
  value: unknown;
  source: FieldSource['source'];
  confirmedByClient: boolean;
  markedForClientInput: boolean;
  clientNote?: string;
}

export const CLIENT_SHORTLIST_STATUSES: BriefStatus[] = [
  'Shortlisted',
  'Selected',
  'In Execution',
  'Completed',
];
export const MATCHING_RESULT_META_KEY = '__matchingResult';
export const SHORTLIST_META_KEY = '__shortlistEntries';
export const SHORTLIST_PREFERENCES_META_KEY = '__shortlistClientPreferences';

export const EMPTY_BUSINESS_CONTEXT: BusinessContext = {
  companyName: '',
  companySize: '',
  industry: '',
  currentState: '',
  desiredOutcome: '',
  keyStakeholders: '',
  decisionTimeline: '',
};

export const EMPTY_CONSTRAINTS: BriefConstraints = {
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

export const EMPTY_INTAKE_RESPONSES: Record<string, any> = {};

export const FIELD_LABEL_OVERRIDES: Record<string, string> = {
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

export const formatRelativeTime = (isoDate?: string): string => {
  if (!isoDate) return '-';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '-';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

export const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const toBusinessContext = (value: unknown): BusinessContext => {
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

export const toBriefConstraints = (value: unknown): BriefConstraints => {
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

export const toFieldSources = (value: unknown): Record<string, FieldSource> | undefined => {
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

export const toClientNotes = (value: unknown): Record<string, string> | undefined => {
  if (!isPlainObject(value)) return undefined;

  const notes: Record<string, string> = {};

  Object.entries(value).forEach(([path, note]) => {
    if (typeof note !== 'string') return;
    if (note.trim().length === 0) return;
    notes[path] = note;
  });

  return Object.keys(notes).length > 0 ? notes : undefined;
};

export const mapRowToBrief = (row: BriefRow): ImplementationBrief => ({
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

export const getValueAtPath = (source: unknown, path: string): unknown => {
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

export const formatValueForDisplay = (value: unknown): string => {
  if (value === null || value === undefined) return 'Not provided';
  if (typeof value === 'string') return value.trim().length > 0 ? value : 'Not provided';
  if (typeof value === 'number') return Number.isNaN(value) ? 'Not provided' : String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? value.map(String).join(', ') : 'Not provided';
  if (isPlainObject(value)) return JSON.stringify(value);
  return String(value);
};

export const makeFieldLabel = (
  path: string,
  projectType: AECProjectType | null,
  brief: ImplementationBrief
): string => {
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

export const sourceBadgeClass = (source: FieldSource['source']) => {
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

export const sourceBadgeLabel = (source: FieldSource['source']) => {
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

export const isMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.values(value).some(isMeaningfulValue);
  return Boolean(value);
};

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

export const toClientPreferenceMap = (value: unknown): Record<string, ClientPreference> => {
  if (!isPlainObject(value)) return {};

  const result: Record<string, ClientPreference> = {};

  Object.entries(value).forEach(([providerId, preference]) => {
    if (
      preference === 'Interested' ||
      preference === 'Not Interested' ||
      preference === 'Questions'
    ) {
      result[providerId] = preference;
    }
  });

  return result;
};

export const toShortlistEntries = (value: unknown): ShortlistEntry[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is ShortlistEntry => {
    if (!isPlainObject(entry)) return false;
    if (typeof entry.id !== 'string' || typeof entry.providerId !== 'string') return false;
    if (!isPlainObject(entry.matchScore)) return false;

    return (
      typeof entry.matchScore.providerId === 'string' &&
      typeof entry.matchScore.briefId === 'string' &&
      typeof entry.matchScore.overallScore === 'number'
    );
  });
};

export const toMatchingResult = (value: unknown): MatchingResult | null => {
  if (!isPlainObject(value)) return null;
  if (typeof value.briefId !== 'string') return null;
  if (!Array.isArray(value.matches)) return null;
  if (typeof value.totalCandidatesEvaluated !== 'number') return null;
  if (typeof value.algorithmVersion !== 'string') return null;
  if (typeof value.generatedAt !== 'string') return null;

  const hasValidMatches = value.matches.every((match) => {
    if (!isPlainObject(match)) return false;
    return (
      typeof match.providerId === 'string' &&
      typeof match.briefId === 'string' &&
      typeof match.overallScore === 'number'
    );
  });

  if (!hasValidMatches) return null;

  return value as MatchingResult;
};

export const buildIntakeResponsesWithMatchingResult = (
  currentResponses: Record<string, any> | undefined,
  result: MatchingResult
): Record<string, any> => {
  const nextResponses: Record<string, any> = { ...(currentResponses ?? {}) };
  nextResponses[MATCHING_RESULT_META_KEY] = result;
  return nextResponses;
};

export const buildIntakeResponsesWithShortlist = (
  currentResponses: Record<string, any> | undefined,
  shortlist: ShortlistEntry[],
  preferences: Record<string, ClientPreference>
): Record<string, any> => {
  const nextResponses: Record<string, any> = { ...(currentResponses ?? {}) };
  nextResponses[SHORTLIST_META_KEY] = shortlist;

  if (Object.keys(preferences).length > 0) {
    nextResponses[SHORTLIST_PREFERENCES_META_KEY] = preferences;
  } else {
    delete nextResponses[SHORTLIST_PREFERENCES_META_KEY];
  }

  return nextResponses;
};
