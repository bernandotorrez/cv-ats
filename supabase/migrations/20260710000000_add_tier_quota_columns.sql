ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS quota_upload_cv INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quota_upload_cv_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quota_pro_photo_reset_at TIMESTAMPTZ;
