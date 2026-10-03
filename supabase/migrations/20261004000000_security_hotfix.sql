-- ─────────────────────────────────────────────────────────────────────────────
-- Security hotfix (security-audit.md: C2, C3, C4, H1, M5, M7, M10, L8, L9, L14)
-- Plan items: 0.2, 0.3, 2.4 (template trigger), 2.8, 2.9, 2.11, Fase 3 (L9, L14)
--
-- Ringkasan:
--   1. has_role ditulis ulang (SQL murni, STABLE) untuk semua overload; policy
--      admin yang memanggil has_role dibatasi ke role `authenticated` supaya
--      `anon` tidak perlu EXECUTE pada has_role.
--   2. Fungsi internal/admin/cron/trigger SECURITY DEFINER dicabut dari
--      PUBLIC/anon/authenticated (tetap untuk service_role).
--   3. Default privileges: fungsi baru tidak otomatis bisa dieksekusi
--      PUBLIC/anon/authenticated. Fungsi yang dipanggil client di-GRANT eksplisit.
--   4. C4: policy "Anyone view shared cvs" dihapus; CV yang dibagikan hanya bisa
--      dibaca lewat RPC get_shared_cv / get_shared_portfolio (tepat 1 token).
--      Token share baru = 32 karakter base64url acak.
--   5. M7: tabel referral read-only untuk client; atribusi referral lewat
--      trigger signup (metadata `referral_code`) atau RPC yang hanya bertindak
--      untuk auth.uid().
--   6. L8: visitor_events hanya lewat log_visitor_event (user_id dipaksa
--      auth.uid(), panjang teks & ukuran metadata dibatasi).
--   7. L9: protect_profile_quotas juga berjalan saat INSERT.
--   8. L14: policy UPDATE cv-photos diberi USING; cv_reviews dicabut dari anon;
--      set_updated_at diberi search_path.
--   9. M5: trigger cvs.template_id sesuai akses template tier.
--
-- Migration ini ditulis defensif (IF EXISTS, cek pg_proc/pg_policies) karena
-- database produksi bisa berbeda dari riwayat migration.
-- ─────────────────────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. has_role (M10) — tulis ulang tanpa mengubah signature/nama parameter
-- ═════════════════════════════════════════════════════════════════════════════
-- Policy & trigger bergantung pada has_role, jadi fungsi tidak di-DROP.
-- Nama parameter diambil dari pg_proc (CREATE OR REPLACE menolak rename),
-- body memakai $1/$2 agar tidak bentrok dengan nama kolom user_roles.
DO $do$
DECLARE
  r record;
  v_arg1 text;
  v_arg2 text;
  v_type2 text;
BEGIN
  IF to_regprocedure('public.has_role(uuid, text)') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION public.has_role(_user_id uuid, _role text)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = $1 AND ur.role::text = $2::text
        );
      $body$
    $fn$;
  END IF;

  FOR r IN
    SELECT p.oid, p.proargnames, format_type(p.proargtypes[1], NULL) AS type2
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'has_role'
      AND p.pronargs = 2
      AND p.proargtypes[0] = 'uuid'::regtype
      AND p.prorettype = 'boolean'::regtype
  LOOP
    v_arg1 := COALESCE(r.proargnames[1], '_user_id');
    v_arg2 := COALESCE(r.proargnames[2], '_role');
    v_type2 := r.type2;

    EXECUTE format(
      $fn$
        CREATE OR REPLACE FUNCTION public.has_role(%I uuid, %I %s)
        RETURNS boolean
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        SET search_path = public
        AS $body$
          SELECT EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = $1 AND ur.role::text = $2::text
          );
        $body$
      $fn$,
      v_arg1, v_arg2, v_type2
    );
  END LOOP;
END
$do$;

COMMENT ON FUNCTION public.has_role(uuid, text) IS
  'Cek apakah user memiliki role tertentu (user_roles.role::text = _role). SECURITY DEFINER, hanya untuk authenticated/service_role.';


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Policy admin yang memanggil has_role → hanya TO authenticated
-- ═════════════════════════════════════════════════════════════════════════════
-- Fungsi di dalam ekspresi RLS dieksekusi dengan hak role pemanggil. Agar
-- EXECUTE has_role bisa dicabut dari anon tanpa membuat query anon (mis.
-- job_listings, tryout_packages → subquery user_roles) error "permission
-- denied for function has_role", policy admin dibatasi ke `authenticated`.
-- Aman secara semantik: anon tidak pernah admin (auth.uid() NULL), dan hanya
-- policy yang semua panggilan has_role-nya berbentuk has_role(auth.uid(), …)
-- serta tanpa OR yang diubah. Sisanya diberi WARNING untuk ditinjau manual.
DO $do$
DECLARE
  r record;
  v_expr text;
  v_total int;
  v_self int;
  v_roles text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (COALESCE(qual, '') || ' ' || COALESCE(with_check, '')) LIKE '%has_role(%'
      AND roles && ARRAY['public', 'anon']::name[]
  LOOP
    v_expr := COALESCE(r.qual, '') || ' ' || COALESCE(r.with_check, '');
    v_total := (length(v_expr) - length(replace(v_expr, 'has_role(', ''))) / length('has_role(');
    v_self := (length(v_expr) - length(replace(v_expr, 'has_role(auth.uid()', ''))) / length('has_role(auth.uid()');

    IF r.schemaname = 'public' AND v_total = v_self AND v_expr !~* '\mor\M' THEN
      SELECT string_agg(quote_ident(x), ', ')
      INTO v_roles
      FROM (
        SELECT DISTINCT unnest(
          array_remove(array_remove(r.roles, 'public'::name), 'anon'::name)
          || ARRAY['authenticated']::name[]
        )::text AS x
      ) s;

      EXECUTE format('ALTER POLICY %I ON %I.%I TO %s',
                     r.policyname, r.schemaname, r.tablename, v_roles);
    ELSE
      RAISE WARNING 'Policy %.%."%" memanggil has_role dan berlaku untuk anon/public, tinjau manual sebelum mencabut has_role dari anon',
        r.schemaname, r.tablename, r.policyname;
    END IF;
  END LOOP;
END
$do$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Cabut EXECUTE fungsi internal / admin / cron (C2, C3, H1)
-- ═════════════════════════════════════════════════════════════════════════════
-- admin-users hanya memakai overload 5 argumen (dengan sort_order).
DROP FUNCTION IF EXISTS public.admin_list_users_page(text, text, integer, integer);

-- Semua overload fungsi berikut: cabut dari PUBLIC/anon/authenticated,
-- tetap bisa dipanggil service_role (edge function) dan owner (pg_cron).
DO $do$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'admin_list_users_page',
        'get_job_search_cron_secret',
        'expire_subscription',
        'trigger_monthly_quota_reset',
        'enqueue_viral_job_search_cron',
        'check_rate_limit',
        'cleanup_rate_limits',
        'fulfill_payment_order',
        'handle_new_user',
        'handle_new_subscription'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
                   r.nspname, r.proname, r.args);
  END LOOP;

  -- Semua fungsi trigger SECURITY DEFINER di schema public (bukan milik
  -- extension). Trigger tetap berjalan: EXECUTE hanya dicek saat CREATE TRIGGER.
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype = 'trigger'::regtype
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
  END LOOP;
END
$do$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. expire_subscription: search_path + perbaiki date_end NULL (H1)
-- ═════════════════════════════════════════════════════════════════════════════
-- user_subscriptions.date_end NOT NULL; free tier disimpan dengan
-- date_end = now() + 100 tahun (sama seperti handle_new_user).
DROP FUNCTION IF EXISTS public.expire_subscription(uuid);

CREATE FUNCTION public.expire_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_tier_id uuid;
  v_current_tier_id uuid;
BEGIN
  SELECT id INTO v_free_tier_id
  FROM public.subscription_tiers
  WHERE slug = 'free'
  LIMIT 1;

  IF v_free_tier_id IS NULL OR p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT tier_id INTO v_current_tier_id
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_tier_id IS NOT NULL AND v_current_tier_id <> v_free_tier_id THEN
    UPDATE public.user_subscriptions
    SET status = 'expired'
    WHERE user_id = p_user_id
      AND status = 'active';

    INSERT INTO public.user_subscriptions (
      user_id, tier_id, status, date_start, date_end, provider
    ) VALUES (
      p_user_id, v_free_tier_id, 'active', now(), now() + interval '100 years', 'auto_downgrade'
    );

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_subscription(uuid) TO service_role;


-- set_updated_at (tryout) tanpa search_path (L14)
DO $do$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    ALTER FUNCTION public.set_updated_at() SET search_path = public;
  END IF;
END
$do$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. Default privileges: fungsi baru tidak otomatis bisa dipanggil client
-- ═════════════════════════════════════════════════════════════════════════════
-- Grant default Supabase ke anon/authenticated adalah per-schema; grant
-- EXECUTE ke PUBLIC adalah default global PostgreSQL dan hanya bisa dicabut
-- lewat ALTER DEFAULT PRIVILEGES tanpa IN SCHEMA. Keduanya berlaku untuk
-- fungsi yang dibuat role yang menjalankan migration (postgres).
-- Konsekuensi: setiap fungsi baru yang dipanggil client WAJIB diberi
-- GRANT EXECUTE eksplisit. service_role tetap mendapat default grant Supabase.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. C4: CV yang dibagikan hanya lewat RPC per-token
-- ═════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone view shared cvs" ON public.cvs;

-- Halaman /share/$token: linkedin & website disamarkan di server (dulu
-- dilakukan di client). user_id hanya dikembalikan ke pemilik CV sendiri
-- (dipakai untuk insert cv_analytics yang memang hanya lolos untuk pemilik).
CREATE OR REPLACE FUNCTION public.get_shared_cv(p_token text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  template_id text,
  data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    CASE WHEN auth.uid() IS NOT NULL AND c.user_id = auth.uid() THEN c.user_id END,
    c.title,
    c.template_id,
    CASE
      WHEN jsonb_typeof(c.data -> 'personal') = 'object' THEN
        jsonb_set(
          jsonb_set(c.data, '{personal,linkedin}', '""'::jsonb, true),
          '{personal,website}', '""'::jsonb, true
        )
      ELSE c.data
    END,
    c.created_at,
    c.updated_at
  FROM public.cvs c
  WHERE p_token IS NOT NULL
    AND length(p_token) BETWEEN 16 AND 128
    AND c.share_enabled = true
    AND c.share_token = p_token
  LIMIT 1;
$$;

-- Halaman /portfolio/$token: menampilkan kontak lengkap (perilaku sama seperti
-- sebelumnya), tetap hanya untuk tepat satu token yang valid.
CREATE OR REPLACE FUNCTION public.get_shared_portfolio(p_token text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  template_id text,
  data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    CASE WHEN auth.uid() IS NOT NULL AND c.user_id = auth.uid() THEN c.user_id END,
    c.title,
    c.template_id,
    c.data,
    c.created_at,
    c.updated_at
  FROM public.cvs c
  WHERE p_token IS NOT NULL
    AND length(p_token) BETWEEN 16 AND 128
    AND c.share_enabled = true
    AND c.share_token = p_token
  LIMIT 1;
$$;

-- Token share baru: 24 byte acak → 32 karakter base64url (192 bit).
-- Token lama (16 hex) tetap berlaku. Fallback ke gen_random_uuid() jika
-- pgcrypto tidak tersedia.
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_raw text;
BEGIN
  BEGIN
    v_raw := encode(extensions.gen_random_bytes(24), 'base64');
  EXCEPTION WHEN undefined_function OR invalid_schema_name THEN
    v_raw := encode(
      decode(
        replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
        'hex'
      ),
      'base64'
    );
  END;
  -- base64 → base64url, tanpa padding / newline
  RETURN translate(v_raw, E'+/=\n', '-_');
END;
$$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 7. M7: Referral
-- ═════════════════════════════════════════════════════════════════════════════
-- 7a. Client hanya boleh SELECT data referral miliknya; semua penulisan lewat
--     fungsi SECURITY DEFINER.
DROP POLICY IF EXISTS "Anyone can create referral signup" ON public.referral_signups;
DROP POLICY IF EXISTS "Authenticated can create referral signup" ON public.referral_signups;
DROP POLICY IF EXISTS "Public can insert referral clicks" ON public.referral_tracking;
DROP POLICY IF EXISTS "Authenticated can insert referral clicks" ON public.referral_tracking;
DROP POLICY IF EXISTS "Users can update own referral tracking" ON public.referral_tracking;
DROP POLICY IF EXISTS "Users can insert own referral code" ON public.referral_codes;

DO $do$
DECLARE
  r record;
BEGIN
  -- Hapus policy tulis lain (drift) yang tidak khusus service_role
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('referral_codes', 'referral_signups', 'referral_tracking')
      AND cmd <> 'SELECT'
      AND roles <> ARRAY['service_role']::name[]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  IF to_regclass('public.referral_codes') IS NOT NULL THEN
    REVOKE ALL ON public.referral_codes FROM anon;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.referral_codes FROM PUBLIC, authenticated;
  END IF;
  IF to_regclass('public.referral_signups') IS NOT NULL THEN
    REVOKE ALL ON public.referral_signups FROM anon;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.referral_signups FROM PUBLIC, authenticated;
  END IF;
  IF to_regclass('public.referral_tracking') IS NOT NULL THEN
    REVOKE ALL ON public.referral_tracking FROM anon;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.referral_tracking FROM PUBLIC, authenticated;
  END IF;
END
$do$;

-- 7b. generate_referral_code: argumen diabaikan, selalu untuk auth.uid().
--     Signature (user_id_input uuid) dipertahankan untuk referral.tsx.
--     Versi lama memakai gen_random_bytes dengan search_path '' (gagal jika
--     pgcrypto tidak di search_path) — diganti gen_random_uuid().
DROP FUNCTION IF EXISTS public.generate_referral_code(uuid);

CREATE FUNCTION public.generate_referral_code(user_id_input uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
  v_try int := 0;
BEGIN
  -- user_id_input sengaja diabaikan (dulu bisa dipakai membaca/membuat kode user lain)
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT rc.code INTO v_code
  FROM public.referral_codes rc
  WHERE rc.user_id = v_uid
  ORDER BY rc.created_at
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_try := v_try + 1;
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    BEGIN
      INSERT INTO public.referral_codes (user_id, code) VALUES (v_uid, v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- Bisa karena kode bentrok atau request paralel user yang sama
      SELECT rc.code INTO v_code
      FROM public.referral_codes rc
      WHERE rc.user_id = v_uid
      LIMIT 1;
      IF v_code IS NOT NULL THEN
        RETURN v_code;
      END IF;
      IF v_try >= 10 THEN
        RAISE EXCEPTION 'Gagal membuat kode referral';
      END IF;
    END;
  END LOOP;
END;
$$;

-- 7c. Logika atribusi (internal, service_role only). Skema aktual:
--     referral_codes(user_id, code, total_referrals, successful_referrals, rewards_earned)
--     referral_signups(referrer_id, referred_id UNIQUE, code)
--     referral_tracking(referrer_id, referred_user_id, referral_code, status, reward_granted)
--     Hanya untuk akun baru (≤ 7 hari), tidak boleh self-referral, satu kali per user.
CREATE OR REPLACE FUNCTION public.apply_referral_signup(p_code text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(btrim(COALESCE(p_code, '')));
  v_referrer uuid;
  v_rows int;
BEGIN
  IF p_user_id IS NULL OR v_code !~ '^[A-Z0-9_-]{6,20}$' THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = p_user_id AND u.created_at > now() - interval '7 days'
  ) THEN
    RETURN false;
  END IF;

  SELECT rc.user_id INTO v_referrer
  FROM public.referral_codes rc
  WHERE rc.code = v_code
  LIMIT 1;

  IF v_referrer IS NULL OR v_referrer = p_user_id THEN
    RETURN false;
  END IF;

  INSERT INTO public.referral_signups (referrer_id, referred_id, code)
  VALUES (v_referrer, p_user_id, v_code)
  ON CONFLICT (referred_id) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN false; -- sudah pernah direferensikan
  END IF;

  INSERT INTO public.referral_tracking (referrer_id, referred_user_id, referral_code, status)
  VALUES (v_referrer, p_user_id, v_code, 'signed_up');

  UPDATE public.referral_codes
  SET total_referrals = COALESCE(total_referrals, 0) + 1
  WHERE user_id = v_referrer;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_referral_signup(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_signup(text, uuid) TO service_role;

-- 7d. track_referral_signup: signature lama dipertahankan (client lama),
--     tapi hanya bertindak untuk auth.uid() dan tidak pernah melempar error.
DROP FUNCTION IF EXISTS public.track_referral_signup(text, uuid);

CREATE FUNCTION public.track_referral_signup(p_code text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_user_id IS DISTINCT FROM v_uid THEN
    RETURN;
  END IF;

  PERFORM public.apply_referral_signup(p_code, v_uid);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'track_referral_signup gagal: %', SQLSTATE;
END;
$$;

-- 7e. Atribusi utama: saat signup, dari raw_user_meta_data->>'referral_code'
--     (register.tsx mengirim kode lewat options.data). Bekerja juga saat
--     konfirmasi email aktif (belum ada session). Tidak pernah menggagalkan
--     signup. Nama trigger diurutkan setelah on_auth_user_created sehingga
--     baris profiles (FK referral_signups) sudah ada.
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  v_code := NEW.raw_user_meta_data ->> 'referral_code';
  IF v_code IS NOT NULL AND length(v_code) BETWEEN 6 AND 20 THEN
    BEGIN
      PERFORM public.apply_referral_signup(v_code, NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Referral attribution gagal: %', SQLSTATE;
    END;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_referral() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral();


-- ═════════════════════════════════════════════════════════════════════════════
-- 8. L8: visitor_events hanya lewat log_visitor_event
-- ═════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Allow public insert visitor_events" ON public.visitor_events;

DO $do$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'visitor_events' AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.visitor_events', r.policyname);
  END LOOP;

  IF to_regclass('public.visitor_events') IS NOT NULL THEN
    REVOKE ALL ON public.visitor_events FROM anon;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.visitor_events FROM PUBLIC, authenticated;
  END IF;
END
$do$;

-- Signature sama dengan versi lama (dipanggil src/lib/analytics.ts).
-- user_id selalu auth.uid(); teks dipotong; metadata maks 2 KB & harus object.
DROP FUNCTION IF EXISTS public.log_visitor_event(text, text, text, text, text, text, text, text, text, text, integer, jsonb);

CREATE FUNCTION public.log_visitor_event(
  p_visitor_id text,
  p_session_id text,
  p_event_name text,
  p_page_path text,
  p_page_title text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_referrer_channel text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_os text DEFAULT NULL,
  p_duration_seconds integer DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
  v_visitor text := left(btrim(COALESCE(p_visitor_id, '')), 64);
  v_session text := left(btrim(COALESCE(p_session_id, '')), 64);
  v_event text := left(btrim(COALESCE(p_event_name, '')), 64);
  v_path text := left(btrim(COALESCE(p_page_path, '')), 512);
  v_metadata jsonb := COALESCE(p_metadata, '{}'::jsonb);
BEGIN
  IF v_visitor = '' OR v_session = '' OR v_event = '' OR v_path = '' THEN
    RETURN NULL;
  END IF;

  -- Jangan lacak path admin internal
  IF v_path LIKE '/admin%' OR v_path LIKE '/api/admin%' THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(v_metadata) <> 'object' OR octet_length(v_metadata::text) > 2048 THEN
    v_metadata := '{}'::jsonb;
  END IF;

  INSERT INTO public.visitor_events (
    visitor_id, session_id, event_name, page_path, page_title, referrer,
    referrer_channel, device_type, browser, os, duration_seconds, user_id,
    metadata, created_at
  ) VALUES (
    v_visitor,
    v_session,
    v_event,
    v_path,
    left(COALESCE(p_page_title, v_path), 300),
    left(p_referrer, 500),
    left(COALESCE(p_referrer_channel, 'Direct / Akses Langsung'), 64),
    left(COALESCE(p_device_type, 'desktop'), 32),
    left(COALESCE(p_browser, 'Other'), 32),
    left(COALESCE(p_os, 'Other'), 32),
    LEAST(GREATEST(COALESCE(p_duration_seconds, 0), 0), 86400),
    auth.uid(),
    v_metadata,
    now()
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 9. L9: protect_profile_quotas juga untuk INSERT
-- ═════════════════════════════════════════════════════════════════════════════
-- Kolom yang dilindungi sama dengan versi 20261003000000. Saat INSERT oleh
-- user biasa, kolom kuota harus bernilai default (0 / false / NULL).
-- INSERT tanpa JWT (auth.uid() NULL, mis. handle_new_user dari GoTrue) dilewati;
-- INSERT anon lewat API tetap ditolak RLS (WITH CHECK auth.uid() = id).
CREATE OR REPLACE FUNCTION public.protect_profile_quotas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    IF COALESCE(NEW.quota_upload_cv, 0) <> 0 OR
       COALESCE(NEW.quota_pro_photo, 0) <> 0 OR
       COALESCE(NEW.quota_pro_photo_purchased, 0) <> 0 OR
       NEW.quota_upload_cv_reset_at IS NOT NULL OR
       NEW.quota_pro_photo_reset_at IS NOT NULL OR
       COALESCE(NEW.has_upload_cv, false) OR
       COALESCE(NEW.has_pro_photo, false) OR
       NEW.upload_cv_end_date IS NOT NULL OR
       NEW.pro_photo_end_date IS NOT NULL
    THEN
      RAISE EXCEPTION 'Not authorized to modify quota or subscription fields';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.quota_upload_cv IS DISTINCT FROM OLD.quota_upload_cv OR
     NEW.quota_pro_photo IS DISTINCT FROM OLD.quota_pro_photo OR
     NEW.quota_pro_photo_purchased IS DISTINCT FROM OLD.quota_pro_photo_purchased OR
     NEW.quota_upload_cv_reset_at IS DISTINCT FROM OLD.quota_upload_cv_reset_at OR
     NEW.quota_pro_photo_reset_at IS DISTINCT FROM OLD.quota_pro_photo_reset_at OR
     NEW.has_upload_cv IS DISTINCT FROM OLD.has_upload_cv OR
     NEW.has_pro_photo IS DISTINCT FROM OLD.has_pro_photo OR
     NEW.upload_cv_end_date IS DISTINCT FROM OLD.upload_cv_end_date OR
     NEW.pro_photo_end_date IS DISTINCT FROM OLD.pro_photo_end_date
  THEN
    RAISE EXCEPTION 'Not authorized to modify quota or subscription fields';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_quotas() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_quotas_trigger ON public.profiles;
CREATE TRIGGER protect_profile_quotas_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_quotas();


-- ═════════════════════════════════════════════════════════════════════════════
-- 10. M5: template CV sesuai akses tier (server-side)
-- ═════════════════════════════════════════════════════════════════════════════
-- Model akses (sama dengan cv.index.tsx / cv.$id.tsx):
--   subscription aktif → subscription_tiers.template_access_detail
--   NULL = semua template; array JSON = daftar template yang boleh;
--   tanpa subscription aktif → ["jakarta","bandung"].
-- UPDATE hanya dicek bila template_id benar-benar berubah, sehingga user yang
-- turun tier tetap bisa menyimpan CV dengan template lamanya.
CREATE OR REPLACE FUNCTION public.enforce_cv_template_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed jsonb;
  v_found boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.template_id IS NOT DISTINCT FROM OLD.template_id THEN
    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    -- service_role / koneksi internal. Request anon tetap ditolak RLS cvs.
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT st.template_access_detail, true
  INTO v_allowed, v_found
  FROM public.user_subscriptions us
  JOIN public.subscription_tiers st ON st.id = us.tier_id
  WHERE us.user_id = NEW.user_id
    AND us.status = 'active'
  ORDER BY us.date_end DESC NULLS LAST, us.created_at DESC
  LIMIT 1;

  IF NOT COALESCE(v_found, false) THEN
    v_allowed := '["jakarta", "bandung"]'::jsonb;
  END IF;

  IF v_allowed IS NULL OR jsonb_typeof(v_allowed) = 'null' THEN
    RETURN NEW; -- semua template diizinkan
  END IF;

  IF jsonb_typeof(v_allowed) = 'array' AND v_allowed ? NEW.template_id THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Template "%" tidak tersedia untuk paket kamu. Upgrade untuk memakai template ini.', NEW.template_id
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_cv_template_access() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_cv_template_access_trigger ON public.cvs;
CREATE TRIGGER enforce_cv_template_access_trigger
  BEFORE INSERT OR UPDATE OF template_id ON public.cvs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_cv_template_access();


-- ═════════════════════════════════════════════════════════════════════════════
-- 11. L14: storage cv-photos UPDATE + cv_reviews
-- ═════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Allow users to update their own cv-photos" ON storage.objects;
CREATE POLICY "Allow users to update their own cv-photos" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DO $do$
BEGIN
  IF to_regclass('public.cv_reviews') IS NOT NULL THEN
    REVOKE ALL ON public.cv_reviews FROM anon;
  END IF;
END
$do$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 12. GRANT eksplisit untuk fungsi yang dipanggil client (supabase.rpc)
-- ═════════════════════════════════════════════════════════════════════════════
DO $do$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- signature                                                     , roles yang boleh
      ('public.has_role(uuid, text)',                                    'authenticated, service_role'),
      ('public.has_role(uuid, public.app_role)',                         'authenticated, service_role'),
      ('public.generate_share_token()',                                  'authenticated, service_role'),
      ('public.get_shared_cv(text)',                                     'anon, authenticated, service_role'),
      ('public.get_shared_portfolio(text)',                              'anon, authenticated, service_role'),
      ('public.log_visitor_event(text, text, text, text, text, text, text, text, text, text, integer, jsonb)',
                                                                         'anon, authenticated, service_role'),
      ('public.admin_dashboard_stats()',                                 'authenticated, service_role'),
      ('public.get_visitor_analytics(timestamptz, timestamptz)',         'authenticated, service_role'),
      ('public.generate_referral_code(uuid)',                            'authenticated, service_role'),
      ('public.track_referral_signup(text, uuid)',                       'authenticated, service_role')
    ) AS t(sig, roles)
  LOOP
    IF to_regprocedure(r.sig) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %s', r.sig, r.roles);
    END IF;
  END LOOP;
END
$do$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 13. Laporan: fungsi SECURITY DEFINER yang masih bisa dipanggil anon /
--     authenticated di luar daftar di atas → WARNING untuk ditinjau manual.
-- ═════════════════════════════════════════════════════════════════════════════
DO $do$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn,
           has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname NOT IN (
        'has_role', 'get_shared_cv', 'get_shared_portfolio', 'log_visitor_event',
        'admin_dashboard_stats', 'get_visitor_analytics', 'generate_referral_code',
        'track_referral_signup'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    IF r.anon_exec OR r.auth_exec THEN
      RAISE WARNING 'SECURITY DEFINER % masih executable (anon=%, authenticated=%), tinjau manual',
        r.fn, r.anon_exec, r.auth_exec;
    END IF;
  END LOOP;
END
$do$;

-- =====================================================================
-- Bucket cv-pdfs → private
-- Hanya dipakai edge function generate-pdf (sudah dihapus). Fitur share
-- (/share, /portfolio) merender CV dari tabel cvs, tidak dari bucket ini.
-- File lama berisi data pribadi; link publik lama akan berhenti berfungsi.
-- =====================================================================
UPDATE storage.buckets SET public = false WHERE id = 'cv-pdfs';

-- Hapus policy storage yang memberi akses baca ke bucket ini (jika ada,
-- mis. dibuat lewat dashboard). service_role tetap bisa mengakses.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%cv-pdfs%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Dropped storage policy for cv-pdfs: %', pol.policyname;
  END LOOP;
END $$;
