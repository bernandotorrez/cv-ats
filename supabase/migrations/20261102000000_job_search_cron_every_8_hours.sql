-- ═════════════════════════════════════════════════════════════════════════════
-- Cron scraping lowongan: tiap 3 jam → tiap 8 jam
-- ═════════════════════════════════════════════════════════════════════════════
-- Nama job sengaja tidak diganti: get_last_job_sync() mencari job berdasarkan
-- nama 'cvpintar-viral-job-search-every-3-hours'. cron.alter_job mempertahankan
-- jobid sehingga riwayat cron.job_run_details tetap tersambung.
-- Jalan pada 00:17, 08:17, 16:17 UTC (07:17, 15:17, 23:17 WIB).

DO $do$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid
  FROM cron.job
  WHERE jobname = 'cvpintar-viral-job-search-every-3-hours';

  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id := v_jobid, schedule := '17 */8 * * *');
  ELSE
    PERFORM cron.schedule(
      'cvpintar-viral-job-search-every-3-hours',
      '17 */8 * * *',
      'SELECT public.enqueue_viral_job_search_cron();'
    );
  END IF;
END
$do$;
