import type { SensitivityLevel, TimelineUrgency } from './database';

export type BriefStatus =
  | 'Draft'
  | 'Advisor Draft'
  | 'Client Review'
  | 'In Review'
  | 'Locked'
  | 'Matching'
  | 'Shortlisted'
  | 'Selected'
  | 'In Execution'
  | 'Completed'
  | 'Cancelled';

export interface BusinessContext {
  companyName: string;
  companySize: string;
  industry: string;
  currentState: string;
  desiredOutcome: string;
  keyStakeholders: string;
  decisionTimeline: string;
}

export interface BriefRequirement {
  id: string;
  category: 'Functional' | 'Technical' | 'Integration' | 'Training' | 'Support';
  priority: 'Must Have' | 'Should Have' | 'Nice to Have';
  description: string;
  acceptanceCriteria?: string;
  source: 'User' | 'AI Suggested' | 'Template';
}

export interface SuccessCriterion {
  id: string;
  metric: string;
  baseline?: string;
  target: string;
  measurementMethod: string;
  timeframe: string;
  source?: 'client' | 'advisor' | 'ai';
  confirmedByClient?: boolean;
  weight: number; // 1-10, importance for matching. Default 5.
}

export interface BriefConstraints {
  budget: { min?: number; max?: number; flexibility: 'Firm' | 'Flexible' };
  timeline: { urgency: TimelineUrgency; hardDeadline?: string; reason?: string };
  sensitivity: { level: SensitivityLevel; concerns?: string[] };
  technical: { mustIntegrate: string[]; cannotChange: string[]; preferences?: string[] };
}

export interface RiskFactor {
  id: string;
  category: 'Technical' | 'Organizational' | 'Commercial' | 'Timeline';
  description: string;
  likelihood: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  mitigation?: string;
  source: 'User' | 'AI Identified' | 'Sablecrest Identified';
}

export interface FieldSource {
  source: 'advisor' | 'client' | 'document' | 'ai';
  confirmedByClient: boolean;
  confirmedAt?: string;
  clientNotes?: string;
  markedForClientInput: boolean;
}

export interface ImplementationBrief {
  id: string;
  workspaceId: string;
  title: string;
  projectTypeId: string;
  status: BriefStatus;
  currentVersion: number;
  businessContext: BusinessContext;
  requirements: BriefRequirement[];
  successCriteria: SuccessCriterion[];
  constraints: BriefConstraints;
  riskFactors: RiskFactor[];
  intakeResponses: Record<string, any>;
  advisorId?: string;
  advisorNotes?: string;
  discoveryDate?: string;
  discoveryNotes?: string;
  clientReviewStartedAt?: string;
  clientReviewCompletedAt?: string;
  fieldSources?: Record<string, FieldSource>;
  clientNotes?: Record<string, string>;
  lockedAt?: string;
  lockedBy?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BriefVersion {
  id: string;
  briefId: string;
  versionNumber: number;
  snapshot: Omit<ImplementationBrief, 'id' | 'currentVersion'>;
  changeNotes?: string;
  createdAt: string;
  createdBy: string;
}

export const BRIEF_STATUS_ORDER: BriefStatus[] = [
  'Draft',
  'Advisor Draft',
  'Client Review',
  'In Review',
  'Locked',
  'Matching',
  'Shortlisted',
  'Selected',
  'In Execution',
  'Completed',
  'Cancelled',
];
