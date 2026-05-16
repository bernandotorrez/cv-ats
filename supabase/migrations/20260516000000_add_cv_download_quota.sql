-- Add CV download quota and persistent download history.

ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS quota_cv_downloads INTEGER DEFAULT NULL;

UPDATE public.subscription_tiers
SET quota_cv_downloads = 1
WHERE slug = 'free';

UPDATE public.subscription_tiers
SET quota_cv_downloads = NULL
WHERE slug IN ('starter', 'pro', 'pro_plus');

CREATE TABLE IF NOT EXISTS public.cv_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID REFERENCES public.cvs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  download_type TEXT NOT NULL DEFAULT 'pdf' CHECK (download_type IN ('pdf', 'docx')),
  template_id TEXT,
  file_name TEXT,
  user_tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cv_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cv downloads" ON public.cv_downloads;
DROP POLICY IF EXISTS "Users can insert own cv downloads" ON public.cv_downloads;

CREATE POLICY "Users can view own cv downloads"
  ON public.cv_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cv downloads"
  ON public.cv_downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cv_downloads_user_type_created
  ON public.cv_downloads(user_id, download_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_downloads_cv_created
  ON public.cv_downloads(cv_id, created_at DESC);

INSERT INTO public.cv_downloads (cv_id, user_id, download_type, created_at)
SELECT cv_id, user_id, 'pdf', created_at
FROM public.cv_analytics
WHERE event_type = 'download'
  AND NOT EXISTS (
    SELECT 1
    FROM public.cv_downloads d
    WHERE d.cv_id = cv_analytics.cv_id
      AND d.user_id = cv_analytics.user_id
      AND d.download_type = 'pdf'
      AND d.created_at = cv_analytics.created_at
  );
