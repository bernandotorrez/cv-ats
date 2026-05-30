CREATE TABLE IF NOT EXISTS public.saved_job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_listing_id)
);

ALTER TABLE public.saved_job_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved job listings" ON public.saved_job_listings;
DROP POLICY IF EXISTS "Users can save own job listings" ON public.saved_job_listings;
DROP POLICY IF EXISTS "Users can remove own saved job listings" ON public.saved_job_listings;

CREATE POLICY "Users can view own saved job listings"
  ON public.saved_job_listings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save own job listings"
  ON public.saved_job_listings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own saved job listings"
  ON public.saved_job_listings
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_job_listings_user_id
  ON public.saved_job_listings(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_job_listings_job_listing_id
  ON public.saved_job_listings(job_listing_id);
