-- Track course completion + issued certificates
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS course_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  certificate_code text NOT NULL UNIQUE,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  course_title text NOT NULL DEFAULT 'AI For Everyone',
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid,
  email_status text NOT NULL DEFAULT 'pending',
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert certificates"
  ON public.certificates FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update certificates"
  ON public.certificates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_certificates_enrollment ON public.certificates(enrollment_id);
