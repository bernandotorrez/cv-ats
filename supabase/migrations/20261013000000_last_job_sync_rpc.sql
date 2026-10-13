-- ═════════════════════════════════════════════════════════════════════════════
-- /lowongan: "Update terakhir" = kapan cron scraping lowongan terakhir jalan
-- ═════════════════════════════════════════════════════════════════════════════
-- Sebelumnya halaman memakai tanggal lowongan terbaru, sehingga tampak usang
-- walau cron tetap jalan. pg_cron menyimpan riwayat run di cron.job_run_details
-- yang tidak bisa dibaca anon, jadi dibuka lewat fungsi SECURITY DEFINER sempit
-- yang hanya mengembalikan satu timestamp.

CREATE OR REPLACE FUNCTION public.get_last_job_sync()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT COALESCE(
    (
      SELECT max(d.start_time)
      FROM cron.job_run_details d
      JOIN cron.job j ON j.jobid = d.jobid
      WHERE j.jobname = 'cvpintar-viral-job-search-every-3-hours'
        AND d.status = 'succeeded'
    ),
    (SELECT max(last_seen_at) FROM public.job_listings)
  );
$$;

REVOKE ALL ON FUNCTION public.get_last_job_sync() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_last_job_sync() TO anon, authenticated, service_role;
