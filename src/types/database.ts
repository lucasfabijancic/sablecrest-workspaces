export type AppRole = 'admin' | 'ops' | 'client';

export type RequestStatus = 'Draft' | 'Submitted' | 'Scoping' | 'Shortlisting' | 'In Execution' | 'Delivered' | 'Closed';

export type TimelineUrgency = 'Immediate' | 'Within 2 weeks' | 'Within 1 month' | 'Within 3 months' | 'Flexible';

export type SensitivityLevel = 'Standard' | 'Confidential' | 'Highly Confidential';

export type BudgetBand = 'Under $10K' | '$10K-$50K' | '$50K-$150K' | '$150K-$500K' | 'Over $500K';

export type ShortlistStatus = 'Proposed' | 'Contacted' | 'Interested' | 'Declined' | 'Selected';

export type FileCategory = 'Brief' | 'Security' | 'SOW' | 'Other';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface Membership {
  id: string;
  workspace_id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  workspace?: Workspace;
  profile?: Profile;
}

export interface Request {
  id: string;
  workspace_id: string;
  title: string;
  desired_outcome: string | null;
  context: string | null;
  timeline_urgency: TimelineUrgency | null;
  sensitivity: SensitivityLevel | null;
  budget_band: BudgetBand | null;
  status: RequestStatus;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  workspace?: Workspace;
  owner?: Profile;
}

export interface RequestVersion {
  id: string;
  request_id: string;
  version_number: number;
  summary_snapshot: any;
  locked: boolean;
  created_at: string;
  created_by_user_id: string | null;
  creator?: Profile;
}

export interface Provider {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  regions: string[] | null;
  capabilities: string[] | null;
  typical_budget_band: BudgetBand | null;
  notes_internal: string | null;
  created_at: string;
}

export interface ShortlistEntry {
  id: string;
  request_id: string;
  provider_id: string;
  fit_notes: string | null;
  est_cost_band: BudgetBand | null;
  status: ShortlistStatus;
  created_at: string;
  provider?: Provider;
}

export interface Conversation {
  id: string;
  request_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender?: Profile;
}

export interface FileRecord {
  id: string;
  request_id: string;
  uploader_user_id: string;
  filename: string;
  storage_url: string;
  category: FileCategory;
  created_at: string;
  uploader?: Profile;
}

export interface ActivityEvent {
  id: string;
  workspace_id: string;
  request_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  event_payload: any;
  created_at: string;
  actor?: Profile;
}
