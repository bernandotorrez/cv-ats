-- Shorten share token to 16 chars (from 32)
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
BEGIN
  new_token := encode(gen_random_bytes(12), 'base64');
  new_token := replace(replace(replace(new_token, '+', '-'), '/', '_'), '=', '');
  RETURN new_token;
END;
$$;

-- Add updated_at trigger for cvs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_cvs_updated_at'
  ) THEN
    CREATE TRIGGER set_cvs_updated_at
      BEFORE UPDATE ON public.cvs
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;
