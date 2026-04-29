-- Private bucket for certificate PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Admin can view files in the bucket (download is via server route w/ service role)
CREATE POLICY "Admins can read certificate files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'certificates' AND public.has_role(auth.uid(), 'admin'));

-- Add download token + expiry + storage path to certificates
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS download_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS storage_path text;

CREATE INDEX IF NOT EXISTS idx_certificates_download_token
  ON public.certificates(download_token);
