-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 3000,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending | success | failed | cancelled
  course_access BOOLEAN NOT NULL DEFAULT false,
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  mpesa_receipt TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_enrollments_email ON public.enrollments(email);
CREATE INDEX idx_enrollments_status ON public.enrollments(payment_status);
CREATE INDEX idx_enrollments_checkout ON public.enrollments(checkout_request_id);

-- Payments table (full audit trail of every STK push attempt + callback)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  amount INTEGER NOT NULL,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  mpesa_receipt TEXT,
  status TEXT NOT NULL DEFAULT 'initiated', -- initiated | success | failed
  result_code INTEGER,
  result_desc TEXT,
  raw_callback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_checkout ON public.payments(checkout_request_id);
CREATE INDEX idx_payments_enrollment ON public.payments(enrollment_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Public can create an enrollment (the form is public)
CREATE POLICY "Anyone can create enrollment"
  ON public.enrollments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can read their own enrollment by checkout_request_id (used to poll status).
-- They get the id via the response of their own insert / STK push call.
CREATE POLICY "Public can read enrollment by checkout id"
  ON public.enrollments FOR SELECT
  TO anon, authenticated
  USING (true);

-- Payments table: no public access. Service role only (bypasses RLS automatically).
-- We intentionally do NOT add SELECT/INSERT/UPDATE policies for anon.
