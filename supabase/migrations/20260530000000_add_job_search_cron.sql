CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

CREATE OR REPLACE FUNCTION public.enqueue_viral_job_search_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  function_url text := 'https://nfdrkuvyowaydjkhfvrr.supabase.co/functions/v1/admin-job-search';
  cron_secret text;
  keywords text[] := ARRAY[
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Mobile Developer',
    'Data Analyst',
    'UI UX Designer',
    'Product Manager',
    'Digital Marketing',
    'Social Media Specialist',
    'Content Creator',
    'HR Recruitment',
    'Talent Acquisition',
    'Accounting',
    'Finance Staff',
    'Customer Service',
    'Sales Executive',
    'Business Development',
    'Admin Staff',
    'Remote Developer'
  ];
  keyword text;
BEGIN
  SELECT decrypted_secret
  INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'JOB_SEARCH_CRON_SECRET'
  LIMIT 1;

  IF cron_secret IS NULL OR length(cron_secret) < 16 THEN
    RAISE EXCEPTION 'JOB_SEARCH_CRON_SECRET belum diset di Supabase Vault.';
  END IF;

  keyword := keywords[
    (
      (
        (EXTRACT(DOY FROM now())::int * 24)
        + EXTRACT(HOUR FROM now())::int
      )
      % array_length(keywords, 1)
    ) + 1
  ];

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := jsonb_build_object(
      'query', keyword,
      'location', 'Indonesia',
      'limit', 8,
      'sources', jsonb_build_array('linkedin', 'jobstreet', 'glints', 'kalibrr')
    ),
    timeout_milliseconds := 30000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_viral_job_search_cron() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_viral_job_search_cron() TO postgres;

DO $$
BEGIN
  PERFORM cron.unschedule('cvpintar-viral-job-search-every-3-hours');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

SELECT cron.schedule(
  'cvpintar-viral-job-search-every-3-hours',
  '17 */3 * * *',
  'SELECT public.enqueue_viral_job_search_cron();'
);
