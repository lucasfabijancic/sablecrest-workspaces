-- Phase A: Clean legacy schema

ALTER TABLE public.implementation_briefs
  DROP CONSTRAINT IF EXISTS implementation_briefs_status_check;

ALTER TABLE public.implementation_briefs
  ADD CONSTRAINT implementation_briefs_status_check
  CHECK (status IN (
    'Draft', 'Advisor Draft', 'Client Review', 'In Review', 'Locked',
    'Shortlisted', 'Selected', 'In Execution', 'Completed', 'Cancelled'
  ));
