-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'ops', 'client');

-- Create status enums
CREATE TYPE public.request_status AS ENUM ('Draft', 'Submitted', 'Scoping', 'Shortlisting', 'In Execution', 'Delivered', 'Closed');
CREATE TYPE public.timeline_urgency AS ENUM ('Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months', 'Flexible');
CREATE TYPE public.sensitivity_level AS ENUM ('Standard', 'Confidential', 'Highly Confidential');
CREATE TYPE public.budget_band AS ENUM ('Under $10K', '$10K-$50K', '$50K-$150K', '$150K-$500K', 'Over $500K');
CREATE TYPE public.shortlist_status AS ENUM ('Proposed', 'Contacted', 'Interested', 'Declined', 'Selected');
CREATE TYPE public.file_category AS ENUM ('Brief', 'Security', 'SOW', 'Other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create memberships table
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  desired_outcome TEXT,
  context TEXT,
  timeline_urgency public.timeline_urgency,
  sensitivity public.sensitivity_level,
  budget_band public.budget_band,
  status public.request_status NOT NULL DEFAULT 'Draft',
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create request_versions table
CREATE TABLE public.request_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  summary_snapshot JSONB,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID REFERENCES auth.users(id)
);

-- Create providers table
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  regions TEXT[],
  capabilities TEXT[],
  typical_budget_band public.budget_band,
  notes_internal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shortlist_entries table
CREATE TABLE public.shortlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  fit_notes TEXT,
  est_cost_band public.budget_band,
  status public.shortlist_status NOT NULL DEFAULT 'Proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, provider_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  uploader_user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  category public.file_category NOT NULL DEFAULT 'Other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activity_events table
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_workspace_role(_user_id UUID, _workspace_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id
    AND workspace_id = _workspace_id
    AND role = ANY(_roles)
  )
$$;

-- Create function to check if user is member of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id
    AND workspace_id = _workspace_id
  )
$$;

-- Create function to get user's workspace role
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(_user_id UUID, _workspace_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.memberships
  WHERE user_id = _user_id
  AND workspace_id = _workspace_id
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view profiles in same workspace" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m1
      WHERE m1.user_id = auth.uid()
      AND m1.workspace_id IN (
        SELECT m2.workspace_id FROM public.memberships m2
        WHERE m2.user_id = profiles.id
      )
    )
  );

-- Workspaces policies
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Admin can update workspace" ON public.workspaces
  FOR UPDATE USING (public.has_workspace_role(auth.uid(), id, ARRAY['admin']::app_role[]));

CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (true);

-- Memberships policies
CREATE POLICY "Users can view memberships in their workspaces" ON public.memberships
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admin can insert memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    public.has_workspace_role(auth.uid(), workspace_id, ARRAY['admin']::app_role[])
    OR NOT EXISTS (SELECT 1 FROM public.memberships WHERE workspace_id = memberships.workspace_id)
  );

CREATE POLICY "Admin can update memberships" ON public.memberships
  FOR UPDATE USING (public.has_workspace_role(auth.uid(), workspace_id, ARRAY['admin']::app_role[]));

CREATE POLICY "Admin can delete memberships" ON public.memberships
  FOR DELETE USING (public.has_workspace_role(auth.uid(), workspace_id, ARRAY['admin']::app_role[]));

-- Requests policies
CREATE POLICY "Users can view requests in their workspaces" ON public.requests
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can create requests in their workspaces" ON public.requests
  FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Ops/Admin can update requests" ON public.requests
  FOR UPDATE USING (public.has_workspace_role(auth.uid(), workspace_id, ARRAY['admin', 'ops']::app_role[]));

CREATE POLICY "Client can update own draft requests" ON public.requests
  FOR UPDATE USING (
    public.is_workspace_member(auth.uid(), workspace_id)
    AND status = 'Draft'
  );

-- Request versions policies
CREATE POLICY "Users can view versions in their workspace requests" ON public.request_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_versions.request_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

CREATE POLICY "Ops/Admin can create versions" ON public.request_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_versions.request_id
      AND public.has_workspace_role(auth.uid(), r.workspace_id, ARRAY['admin', 'ops']::app_role[])
    )
  );

CREATE POLICY "Ops/Admin can update versions" ON public.request_versions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_versions.request_id
      AND public.has_workspace_role(auth.uid(), r.workspace_id, ARRAY['admin', 'ops']::app_role[])
    )
  );

-- Providers policies (visible to all authenticated users, but internal notes only to ops/admin)
CREATE POLICY "Authenticated users can view providers" ON public.providers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Ops/Admin can insert providers" ON public.providers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ops')
    )
  );

CREATE POLICY "Ops/Admin can update providers" ON public.providers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ops')
    )
  );

-- Shortlist entries policies
CREATE POLICY "Users can view shortlist in their workspace requests" ON public.shortlist_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = shortlist_entries.request_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

CREATE POLICY "Ops/Admin can manage shortlist" ON public.shortlist_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = shortlist_entries.request_id
      AND public.has_workspace_role(auth.uid(), r.workspace_id, ARRAY['admin', 'ops']::app_role[])
    )
  );

-- Conversations policies
CREATE POLICY "Users can view conversations in their workspace requests" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = conversations.request_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

CREATE POLICY "Users can create conversations in their workspace requests" ON public.conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = conversations.request_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their workspace conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.requests r ON r.id = c.request_id
      WHERE c.id = messages.conversation_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

CREATE POLICY "Users can send messages in their workspace conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.requests r ON r.id = c.request_id
      WHERE c.id = messages.conversation_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

-- Files policies
CREATE POLICY "Users can view files in their workspace requests" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = files.request_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

CREATE POLICY "Users can upload files to their workspace requests" ON public.files
  FOR INSERT WITH CHECK (
    uploader_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = files.request_id
      AND public.is_workspace_member(auth.uid(), r.workspace_id)
    )
  );

-- Activity events policies
CREATE POLICY "Users can view activity in their workspaces" ON public.activity_events
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "System can insert activity events" ON public.activity_events
  FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- Create trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('request-files', 'request-files', false);

-- Storage policies
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'request-files' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view files in their workspaces" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'request-files'
    AND auth.uid() IS NOT NULL
  );

-- Seed providers
INSERT INTO public.providers (name, description, website, regions, capabilities, typical_budget_band, notes_internal) VALUES
('Meridian Systems', 'Enterprise architecture and digital transformation consultancy specializing in complex integrations.', 'https://meridian-systems.example.com', ARRAY['North America', 'Europe'], ARRAY['Enterprise Architecture', 'System Integration', 'Cloud Migration', 'SAP'], '$150K-$500K', 'Strong track record with Fortune 500. Lead contact: Sarah Chen.'),
('BuildForge AI', 'AI/ML implementation specialists with focus on practical enterprise deployments.', 'https://buildforge.example.com', ARRAY['North America', 'Asia Pacific'], ARRAY['AI/ML', 'Data Engineering', 'Computer Vision', 'NLP'], '$50K-$150K', 'Excellent technical depth. Fast turnaround. Prefer fixed-scope engagements.'),
('Constructiv Digital', 'AEC-focused technology consulting. BIM integration and construction tech specialists.', 'https://constructiv.example.com', ARRAY['North America', 'Europe', 'Middle East'], ARRAY['BIM', 'Construction Tech', 'IoT', 'Digital Twin'], '$50K-$150K', 'Deep AEC domain expertise. Good for complex site deployments.'),
('Velocity Partners', 'Agile delivery and product development for enterprise software.', 'https://velocity-partners.example.com', ARRAY['Europe', 'South America'], ARRAY['Product Development', 'Agile Coaching', 'DevOps', 'Cloud Native'], '$10K-$50K', 'Good bench depth. Can scale teams quickly. Timezone flexible.'),
('Apex Security Group', 'Cybersecurity and compliance implementation. SOC 2, ISO 27001 specialists.', 'https://apex-security.example.com', ARRAY['North America', 'Europe'], ARRAY['Cybersecurity', 'Compliance', 'Penetration Testing', 'Security Architecture'], '$50K-$150K', 'Premium pricing but thorough. Good for regulated industries.');