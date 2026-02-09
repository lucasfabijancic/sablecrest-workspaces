ALTER TABLE public.implementation_briefs
  ADD COLUMN IF NOT EXISTS advisor_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS advisor_notes TEXT,
  ADD COLUMN IF NOT EXISTS discovery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discovery_notes TEXT,
  ADD COLUMN IF NOT EXISTS client_review_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_review_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS field_sources JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS client_notes JSONB DEFAULT '{}';

ALTER TABLE public.implementation_briefs
  DROP CONSTRAINT IF EXISTS implementation_briefs_status_check;

ALTER TABLE public.implementation_briefs
  ADD CONSTRAINT implementation_briefs_status_check
  CHECK (status IN (
    'Draft', 'Advisor Draft', 'Client Review', 'In Review', 'Locked',
    'Matching', 'Shortlisted', 'Selected', 'In Execution', 'Completed', 'Cancelled'
  ));

CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_legal_name TEXT NOT NULL,
  company_dba TEXT,
  annual_revenue_range TEXT,
  employee_count INTEGER,
  office_field_split TEXT,
  active_project_count INTEGER,
  geographic_footprint TEXT,
  growth_trajectory TEXT,
  current_systems JSONB DEFAULT '[]',
  it_maturity TEXT,
  previous_implementations TEXT,
  assigned_advisor_id UUID REFERENCES auth.users(id),
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_role TEXT,
  discovery_call_date TIMESTAMPTZ,
  discovery_call_notes TEXT,
  documents_received JSONB DEFAULT '[]',
  onboarding_status TEXT NOT NULL DEFAULT 'Pending Setup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  email TEXT NOT NULL,
  brief_id UUID NOT NULL REFERENCES public.implementation_briefs(id),
  status TEXT NOT NULL DEFAULT 'Pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  welcome_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/ops can manage client profiles" ON public.client_profiles FOR ALL USING (public.has_workspace_role(auth.uid(), workspace_id, ARRAY['admin', 'ops']::app_role[]));

CREATE POLICY "Clients can view own workspace profile" ON public.client_profiles FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admin/ops can manage invitations" ON public.client_invitations FOR ALL USING (public.has_workspace_role(auth.uid(), workspace_id, ARRAY['admin', 'ops']::app_role[]));

CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON public.client_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS client_profiles_workspace_id_idx ON public.client_profiles (workspace_id);
CREATE INDEX IF NOT EXISTS client_profiles_assigned_advisor_id_idx ON public.client_profiles (assigned_advisor_id);
CREATE INDEX IF NOT EXISTS client_invitations_brief_id_idx ON public.client_invitations (brief_id);