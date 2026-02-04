-- Create implementation_briefs table
CREATE TABLE public.implementation_briefs (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  title TEXT NOT NULL,
  project_type_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN (
      'Draft',
      'In Review',
      'Locked',
      'Matching',
      'Shortlisted',
      'Selected',
      'In Execution',
      'Completed',
      'Cancelled'
    )),
  current_version INTEGER NOT NULL DEFAULT 1,
  business_context JSONB,
  requirements JSONB DEFAULT '[]'::jsonb,
  success_criteria JSONB DEFAULT '[]'::jsonb,
  constraints JSONB,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  intake_responses JSONB DEFAULT '{}'::jsonb,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id),
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create brief_versions table
CREATE TABLE public.brief_versions (
  id UUID PRIMARY KEY,
  brief_id UUID NOT NULL REFERENCES public.implementation_briefs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(brief_id, version_number)
);

-- Enable RLS
ALTER TABLE public.implementation_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_versions ENABLE ROW LEVEL SECURITY;

-- Implementation briefs policies
CREATE POLICY "Users can view briefs in their workspace" ON public.implementation_briefs
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can create briefs in their workspace" ON public.implementation_briefs
  FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can update own draft briefs" ON public.implementation_briefs
  FOR UPDATE USING (
    public.is_workspace_member(auth.uid(), workspace_id)
    AND owner_id = auth.uid()
    AND status = 'Draft'
  );

CREATE POLICY "Ops/Admin can update briefs" ON public.implementation_briefs
  FOR UPDATE USING (
    public.has_workspace_role(auth.uid(), workspace_id, ARRAY['admin', 'ops']::app_role[])
  );

-- Brief versions policies
CREATE POLICY "Users can view versions in their workspace briefs" ON public.brief_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.implementation_briefs b
      WHERE b.id = brief_versions.brief_id
      AND public.is_workspace_member(auth.uid(), b.workspace_id)
    )
  );

CREATE POLICY "Users can create versions in their workspace briefs" ON public.brief_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.implementation_briefs b
      WHERE b.id = brief_versions.brief_id
      AND public.is_workspace_member(auth.uid(), b.workspace_id)
    )
  );

CREATE POLICY "Users can update versions for own draft briefs" ON public.brief_versions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.implementation_briefs b
      WHERE b.id = brief_versions.brief_id
      AND public.is_workspace_member(auth.uid(), b.workspace_id)
      AND b.owner_id = auth.uid()
      AND b.status = 'Draft'
    )
  );

CREATE POLICY "Ops/Admin can update versions in workspace" ON public.brief_versions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.implementation_briefs b
      WHERE b.id = brief_versions.brief_id
      AND public.has_workspace_role(auth.uid(), b.workspace_id, ARRAY['admin', 'ops']::app_role[])
    )
  );

-- updated_at trigger for implementation_briefs
CREATE TRIGGER update_implementation_briefs_updated_at
  BEFORE UPDATE ON public.implementation_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX implementation_briefs_workspace_status_idx
  ON public.implementation_briefs (workspace_id, status);
