ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS salary_period TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT,
  ADD COLUMN IF NOT EXISTS tech_stack TEXT,
  ADD COLUMN IF NOT EXISTS work_mode TEXT,
  ADD COLUMN IF NOT EXISTS deadline DATE;

ALTER TABLE public.job_listings
  DROP CONSTRAINT IF EXISTS job_listings_salary_period_check,
  ADD CONSTRAINT job_listings_salary_period_check
    CHECK (salary_period IS NULL OR salary_period IN ('monthly', 'yearly'));

ALTER TABLE public.job_listings
  DROP CONSTRAINT IF EXISTS job_listings_work_mode_check,
  ADD CONSTRAINT job_listings_work_mode_check
    CHECK (work_mode IS NULL OR work_mode IN ('onsite', 'remote', 'hybrid'));

CREATE INDEX IF NOT EXISTS idx_job_listings_work_mode
  ON public.job_listings(work_mode)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_job_listings_deadline
  ON public.job_listings(deadline)
  WHERE is_active = true AND deadline IS NOT NULL;
