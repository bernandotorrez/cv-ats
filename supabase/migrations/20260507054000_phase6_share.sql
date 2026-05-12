-- Phase 6: Share links, comparison support

-- Add share_token to cvs table
ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cvs_share_token ON public.cvs(share_token) WHERE share_token IS NOT NULL;

-- Drop existing RLS policies for cvs and recreate to include share access
DROP POLICY IF EXISTS "Users view own cvs" ON public.cvs;
DROP POLICY IF EXISTS "Users insert own cvs" ON public.cvs;
DROP POLICY IF EXISTS "Users update own cvs" ON public.cvs;
DROP POLICY IF EXISTS "Users delete own cvs" ON public.cvs;

CREATE POLICY "Users view own cvs" ON public.cvs
  FOR SELECT USING (auth.uid() = user_id);

-- Allow public read for shared CVs
CREATE POLICY "Anyone view shared cvs" ON public.cvs
  FOR SELECT USING (share_enabled = true AND share_token IS NOT NULL);

CREATE POLICY "Users insert own cvs" ON public.cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own cvs" ON public.cvs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own cvs" ON public.cvs
  FOR DELETE USING (auth.uid() = user_id);

-- Function to generate share token (no pgcrypto needed)
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  raw_hex TEXT;
BEGIN
  raw_hex := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  RETURN substr(raw_hex, 1, 16);
END;
$$;
