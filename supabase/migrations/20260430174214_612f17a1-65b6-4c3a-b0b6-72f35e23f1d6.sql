CREATE POLICY "Users can view their own enrollments by email"
ON public.enrollments
FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Users can view their own payments by enrollment"
ON public.payments
FOR SELECT
TO authenticated
USING (
  enrollment_id IN (
    SELECT id FROM public.enrollments
    WHERE lower(email) = lower((auth.jwt() ->> 'email'))
  )
);