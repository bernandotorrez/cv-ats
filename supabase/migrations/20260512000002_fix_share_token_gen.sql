-- Fix generate_share_token: use gen_random_uuid() instead of gen_random_bytes()
-- gen_random_bytes requires pgcrypto extension which may not be enabled
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  raw_hex TEXT;
BEGIN
  raw_hex := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  RETURN substr(raw_hex, 1, 16);
END;
$$;
