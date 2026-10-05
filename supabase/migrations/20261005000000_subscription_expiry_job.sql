-- ═════════════════════════════════════════════════════════════════════════════
-- Subscription expiry: proses langganan berbayar yang lewat date_end tiap jam
-- ═════════════════════════════════════════════════════════════════════════════
-- Sebelumnya expire hanya dijalankan cron bulanan (tanggal 1), jadi langganan
-- yang habis tanggal 5 tetap aktif sampai tanggal 1 bulan berikutnya. Cron itu
-- juga hanya menandai 'expired' tanpa membuat baris Free pengganti.


-- 1. Trigger pengaman: izinkan koneksi internal (pg_cron / SQL Editor).
--    auth.uid() IS NULL hanya terjadi untuk service_role / koneksi internal;
--    anon tidak punya policy UPDATE di user_subscriptions sehingga tetap ditolak RLS.
CREATE OR REPLACE FUNCTION public.protect_user_subscriptions_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.tier_id IS DISTINCT FROM OLD.tier_id THEN
    RAISE EXCEPTION 'Not authorized to change subscription tier';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not authorized to change subscription status';
  END IF;

  IF NEW.date_end IS DISTINCT FROM OLD.date_end THEN
    RAISE EXCEPTION 'Not authorized to change subscription end date';
  END IF;

  RETURN NEW;
END;
$$;


-- 2. Expire semua langganan berbayar yang sudah lewat date_end, lalu buat
--    baris Free pengganti (date_end +100 tahun, sama seperti handle_new_user).
CREATE OR REPLACE FUNCTION public.expire_due_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_tier_id uuid;
  v_expired integer;
BEGIN
  SELECT id INTO v_free_tier_id
  FROM public.subscription_tiers
  WHERE slug = 'free'
  LIMIT 1;

  IF v_free_tier_id IS NULL THEN
    RAISE EXCEPTION 'Free tier not found in subscription_tiers';
  END IF;

  WITH expired AS (
    UPDATE public.user_subscriptions
    SET status = 'expired'
    WHERE status = 'active'
      AND tier_id <> v_free_tier_id
      AND date_end <= now()
    RETURNING id, user_id
  ), downgraded AS (
    INSERT INTO public.user_subscriptions (
      user_id, tier_id, status, date_start, date_end, provider
    )
    SELECT DISTINCT e.user_id, v_free_tier_id, 'active'::public.subscription_status_new, now(), now() + interval '100 years', 'auto_downgrade'
    FROM expired e
    -- CTE melihat snapshot sebelum UPDATE, jadi baris yang baru di-expire dikecualikan manual.
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = e.user_id
        AND us.status = 'active'
        AND us.id NOT IN (SELECT id FROM expired)
    )
    RETURNING user_id
  )
  SELECT count(*) INTO v_expired FROM expired;

  RETURN v_expired;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_due_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO service_role, postgres;


-- 3. Backfill: user yang di-expire cron bulanan lama tidak punya baris aktif sama sekali.
INSERT INTO public.user_subscriptions (user_id, tier_id, status, date_start, date_end, provider)
SELECT DISTINCT us.user_id, st.id, 'active'::public.subscription_status_new, now(), now() + interval '100 years', 'auto_downgrade'
FROM public.user_subscriptions us
CROSS JOIN (SELECT id FROM public.subscription_tiers WHERE slug = 'free' LIMIT 1) st
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions a
  WHERE a.user_id = us.user_id AND a.status = 'active'
);


-- 4. Jadwalkan tiap jam (menit ke-10).
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-due-subscriptions') THEN
    PERFORM cron.unschedule('expire-due-subscriptions');
  END IF;
END
$do$;

SELECT cron.schedule(
  'expire-due-subscriptions',
  '10 * * * *',
  'SELECT public.expire_due_subscriptions()'
);
