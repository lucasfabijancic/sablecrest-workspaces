export type AppRole = 'admin' | 'ops' | 'client';

export type TimelineUrgency = 'Immediate' | 'Within 2 weeks' | 'Within 1 month' | 'Within 3 months' | 'Flexible';

export type SensitivityLevel = 'Standard' | 'Confidential' | 'Highly Confidential';

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
