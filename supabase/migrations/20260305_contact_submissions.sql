-- Contact form submissions from accredilinkcare.co.uk
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text DEFAULT 'general',
  message text,
  form_type text DEFAULT 'contact', -- 'contact' or 'callback'
  best_time text, -- for callback requests
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public contact form — no auth required)
DROP POLICY IF EXISTS "contact_submissions_public_insert" ON contact_submissions;
CREATE POLICY "contact_submissions_public_insert" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can read/update/delete
DROP POLICY IF EXISTS "contact_submissions_auth_read" ON contact_submissions;
CREATE POLICY "contact_submissions_auth_read" ON contact_submissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contact_submissions_auth_update" ON contact_submissions;
CREATE POLICY "contact_submissions_auth_update" ON contact_submissions
  FOR UPDATE USING (auth.uid() IS NOT NULL);
