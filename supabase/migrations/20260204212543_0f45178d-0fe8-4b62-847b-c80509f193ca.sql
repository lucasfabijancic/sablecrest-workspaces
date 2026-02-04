-- Create implementation_briefs table
CREATE TABLE public.implementation_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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