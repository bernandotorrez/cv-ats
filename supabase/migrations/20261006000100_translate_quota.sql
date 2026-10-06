-- Terjemahan CV (ID <-> EN) punya gerbang fitur & kuota bulanan sendiri per paket.
-- Sebelumnya numpang pada "Perbaiki Teks" (quota_ai_polish): terjemahan memakai AI jauh lebih berat
-- dan tidak boleh gratis tanpa batas. NULL pada kuota = tanpa batas.
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS enable_cv_translate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quota_ai_translate INTEGER DEFAULT 0;

-- Free: terkunci (insentif upgrade). Starter: 3x/bulan. Pro: 15x/bulan.
-- Sengaja tidak ada paket "tanpa batas": biaya AI per terjemahan nyata, dan ini mencegah penyalahgunaan.
UPDATE public.subscription_tiers SET enable_cv_translate = false, quota_ai_translate = 0
WHERE slug = 'free';

UPDATE public.subscription_tiers SET enable_cv_translate = true, quota_ai_translate = 3
WHERE slug = 'starter';

UPDATE public.subscription_tiers SET enable_cv_translate = true, quota_ai_translate = 15
WHERE slug IN ('pro', 'pro_plus');
