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

-- Indexes for performance
CREATE INDEX implementation_briefs_workspace_status_idx
  ON public.implementation_briefs (workspace_id, status);

CREATE INDEX brief_versions_brief_id_idx
  ON public.brief_versions (brief_id);