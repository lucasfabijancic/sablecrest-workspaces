-- Fix security definer view issue by dropping the view
-- We'll handle the internal notes filtering in application code instead
DROP VIEW IF EXISTS public.providers_public;