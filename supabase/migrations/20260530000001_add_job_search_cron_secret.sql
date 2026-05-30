CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'JOB_SEARCH_CRON_SECRET'
  ) THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'JOB_SEARCH_CRON_SECRET',
      'Cron secret for admin job search edge function'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_job_search_cron_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'JOB_SEARCH_CRON_SECRET'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_job_search_cron_secret() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_job_search_cron_secret() TO service_role;
