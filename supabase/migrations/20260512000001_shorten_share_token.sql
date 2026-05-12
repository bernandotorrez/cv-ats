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
