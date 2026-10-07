-- ═════════════════════════════════════════════════════════════════════════════
-- Job listings: tanggal posting asli, masa berlaku, dan auto-nonaktif harian
-- ═════════════════════════════════════════════════════════════════════════════
-- Sebelumnya lowongan hasil scraping tetap is_active = true selamanya: tidak ada
-- tanggal posting asli (created_at = waktu scrape), deadline jarang terisi, dan
-- tidak ada job yang menonaktifkan lowongan lama. Akibatnya /lowongan berisi
-- lowongan yang sudah lama ditutup.
--
-- admin-job-search sekarang mengisi:
--   posted_at    : tanggal posting dari sumber (JSON-LD / "3 hari yang lalu")
--   expires_at   : deadline, atau posted_at + 45 hari, atau terakhir terlihat + 30 hari
--   last_seen_at : terakhir kali lowongan ditemukan masih dibuka


-- 1. Kolom baru
ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_job_listings_expires_at
  ON public.job_listings(expires_at)
  WHERE is_active = true AND expires_at IS NOT NULL;


-- 2. Backfill lowongan hasil scraping lama (punya source_url, belum punya expires_at):
--    berlaku sampai deadline, atau 30 hari sejak terakhir di-update scraper.
--    Lowongan manual tanpa source_url tidak disentuh.
UPDATE public.job_listings
SET expires_at = COALESCE(
      (deadline::timestamp + interval '23 hours 59 minutes 59 seconds') AT TIME ZONE 'Asia/Jakarta',
      updated_at + interval '30 days'
    ),
    last_seen_at = COALESCE(last_seen_at, updated_at)
WHERE expires_at IS NULL
  AND source_url IS NOT NULL;


-- 3. Nonaktifkan lowongan yang sudah lewat deadline / masa berlaku.
CREATE OR REPLACE FUNCTION public.deactivate_expired_job_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.job_listings
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND (
      deadline < (now() AT TIME ZONE 'Asia/Jakarta')::date
      OR expires_at < now()
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_expired_job_listings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_expired_job_listings() TO postgres, service_role;


-- 4. Bersihkan data scraping lama yang jelas rusak: perusahaan berisi nama job
--    board / placeholder. Hanya is_active = false (bisa diaktifkan lagi dari admin).
UPDATE public.job_listings
SET is_active = false,
    updated_at = now()
WHERE is_active = true
  AND source_url IS NOT NULL
  AND lower(trim(company)) IN (
    'jobstreet', 'glints', 'kalibrr', 'dealls', 'linkedin', 'indeed', 'glassdoor',
    'tidak disebutkan', 'tidak diketahui', 'employer provided', 'private advertiser',
    'pengiklan anonim', 'confidential', 'unknown', 'n/a', '-'
  );

SELECT public.deactivate_expired_job_listings();


-- 5. Jadwalkan tiap jam (menit ke-20).
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'deactivate-expired-job-listings') THEN
    PERFORM cron.unschedule('deactivate-expired-job-listings');
  END IF;
END
$do$;

SELECT cron.schedule(
  'deactivate-expired-job-listings',
  '20 * * * *',
  'SELECT public.deactivate_expired_job_listings()'
);
