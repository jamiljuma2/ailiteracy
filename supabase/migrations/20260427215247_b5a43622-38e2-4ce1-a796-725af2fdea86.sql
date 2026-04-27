-- Remove the overly-permissive public policies. All writes go through the
-- server route using the service role key. Status polling also goes through
-- the server route which validates the checkout_request_id.
DROP POLICY IF EXISTS "Anyone can create enrollment" ON public.enrollments;
DROP POLICY IF EXISTS "Public can read enrollment by checkout id" ON public.enrollments;

-- Add an explicit deny-all stance for payments (no policies = no access for anon).
-- Service role bypasses RLS so the server route still works.
-- (No new policies needed — RLS enabled with no policies blocks all anon access.)

-- Fix function search_path warning
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
