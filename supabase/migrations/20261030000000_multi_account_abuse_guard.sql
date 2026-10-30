-- =====================================================
-- Anti-abuse: satu orang membuat banyak akun Free untuk mengulang
-- jatah 1x download PDF gratis.
-- Created: 2026-10-30
--
-- Sinyal:
-- - device : cvp_visitor_id (localStorage) yang dipakai login oleh >1 akun.
--            Dipakai untuk MEMBLOKIR download PDF gratis dan untuk alert.
-- - ip     : >1 akun dibuat dalam 24 jam dan terlihat dari IP yang sama.
--            HANYA alert — IP seluler (CGNAT), kantor, dan kampus dipakai
--            bersama oleh banyak orang, jadi tidak aman untuk blokir.
--
-- Alert disimpan di abuse_alerts (hanya lewat RPC admin) dan dikirim
-- sebagai email ringkasan ke ADMIN_NOTIFY_EMAIL oleh edge function
-- abuse-alert-digest (pg_cron tiap 30 menit).
--
-- Kuota download sekarang dicek di database (record_cv_download);
-- INSERT langsung ke cv_downloads dari client ditutup.
-- =====================================================

-- ─── Tabel ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_device_links (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('device', 'ip')),
  value TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, value)
);

CREATE INDEX IF NOT EXISTS idx_user_device_links_kind_value
  ON public.user_device_links(kind, value);

CREATE TABLE IF NOT EXISTS public.abuse_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal TEXT NOT NULL CHECK (signal IN ('device', 'ip')),
  signal_value TEXT NOT NULL,
  user_ids UUID[] NOT NULL,
  -- true jika sinyal ini pernah dipakai untuk menolak download PDF gratis
  blocked_download BOOLEAN NOT NULL DEFAULT false,
  -- open: perlu dicek | reviewed: sudah dicek (dibuka lagi jika ada akun baru)
  -- ignored: device/IP memang dipakai bersama — tidak di-alert & tidak memblokir lagi
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'ignored')),
  emailed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (signal, signal_value)
);

CREATE INDEX IF NOT EXISTS idx_abuse_alerts_status_updated
  ON public.abuse_alerts(status, updated_at DESC);

-- Hanya diakses lewat fungsi SECURITY DEFINER di bawah.
ALTER TABLE public.user_device_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_device_links FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.abuse_alerts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.user_device_links TO service_role;
GRANT ALL ON public.abuse_alerts TO service_role;

-- Backfill device dari visitor_events: akun lama yang sudah memakai jatah
-- download langsung ikut terhubung ke device-nya.
INSERT INTO public.user_device_links (user_id, kind, value, first_seen_at, last_seen_at)
SELECT ve.user_id, 'device', ve.visitor_id, min(ve.created_at), max(ve.created_at)
FROM public.visitor_events ve
WHERE ve.user_id IS NOT NULL
  AND ve.visitor_id ~ '^[A-Za-z0-9-]{16,64}$'
GROUP BY ve.user_id, ve.visitor_id
ON CONFLICT (user_id, kind, value) DO NOTHING;

-- ─── Helper ──────────────────────────────────────────────────────────

-- IP klien dari header request PostgREST. cf-connecting-ip di-set ulang oleh
-- Cloudflare sehingga tidak bisa dipalsukan client; x-forwarded-for hanya fallback.
CREATE OR REPLACE FUNCTION public.request_client_ip()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_headers JSONB;
  v_raw TEXT;
BEGIN
  v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  IF v_headers IS NULL THEN
    RETURN NULL;
  END IF;

  v_raw := trim(coalesce(
    nullif(v_headers ->> 'cf-connecting-ip', ''),
    nullif(v_headers ->> 'x-real-ip', ''),
    nullif(split_part(v_headers ->> 'x-forwarded-for', ',', 1), '')
  ));
  IF v_raw IS NULL OR v_raw = '' THEN
    RETURN NULL;
  END IF;

  RETURN host(v_raw::inet);
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- visitor_id dari client: UUID acak dari getVisitorId(). Nilai lain diabaikan.
CREATE OR REPLACE FUNCTION public.abuse_normalize_visitor_id(p_visitor_id TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_visitor_id ~ '^[A-Za-z0-9-]{16,64}$' THEN p_visitor_id
    ELSE NULL
  END;
$$;

-- Tanpa langganan aktif dianggap Free (sama seperti check_cv_limit).
CREATE OR REPLACE FUNCTION public.abuse_is_free_tier(p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((
    SELECT st.slug = 'free'
    FROM public.user_subscriptions us
    JOIN public.subscription_tiers st ON st.id = us.tier_id
    WHERE us.user_id = p_user AND us.status = 'active'
    ORDER BY us.created_at DESC
    LIMIT 1
  ), true);
$$;

-- Satu alert per (signal, value); akun baru digabung ke user_ids.
CREATE OR REPLACE FUNCTION public.abuse_upsert_alert(
  p_signal TEXT,
  p_value TEXT,
  p_user_ids UUID[],
  p_blocked BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.abuse_alerts AS a (signal, signal_value, user_ids, blocked_download)
  VALUES (
    p_signal,
    p_value,
    ARRAY(SELECT DISTINCT u FROM unnest(p_user_ids) u ORDER BY u),
    p_blocked
  )
  ON CONFLICT (signal, signal_value) DO UPDATE SET
    user_ids = ARRAY(SELECT DISTINCT u FROM unnest(a.user_ids || EXCLUDED.user_ids) u ORDER BY u),
    blocked_download = a.blocked_download OR EXCLUDED.blocked_download,
    -- Akun baru muncul di alert yang sudah "ditinjau" → buka lagi & kirim email lagi.
    -- Alert "diabaikan" tetap diam.
    status = CASE
      WHEN a.status = 'reviewed' AND NOT a.user_ids @> EXCLUDED.user_ids THEN 'open'
      ELSE a.status
    END,
    emailed_at = CASE
      WHEN a.status <> 'ignored' AND NOT a.user_ids @> EXCLUDED.user_ids THEN NULL
      ELSE a.emailed_at
    END,
    updated_at = CASE
      WHEN NOT a.user_ids @> EXCLUDED.user_ids
        OR (EXCLUDED.blocked_download AND NOT a.blocked_download) THEN now()
      ELSE a.updated_at
    END;
END;
$$;

REVOKE ALL ON FUNCTION public.request_client_ip() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.abuse_is_free_tier(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.abuse_upsert_alert(TEXT, TEXT, UUID[], BOOLEAN)
  FROM PUBLIC, anon, authenticated;

-- ─── register_device: dipanggil client sekali per sesi setelah login ─

CREATE OR REPLACE FUNCTION public.register_device(p_visitor_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  -- Jendela waktu pendaftaran untuk sinyal IP. Ubah di sini jika perlu.
  c_ip_signup_window CONSTANT INTERVAL := interval '24 hours';
  v_uid UUID := auth.uid();
  v_visitor TEXT := public.abuse_normalize_visitor_id(p_visitor_id);
  v_ip TEXT := public.request_client_ip();
  v_created TIMESTAMPTZ;
  v_users UUID[];
BEGIN
  -- Admin tidak dilacak (sering login ke banyak akun untuk support/testing)
  IF v_uid IS NULL OR public.has_role(v_uid, 'admin') THEN
    RETURN;
  END IF;

  IF v_visitor IS NOT NULL THEN
    INSERT INTO public.user_device_links (user_id, kind, value)
    VALUES (v_uid, 'device', v_visitor)
    ON CONFLICT (user_id, kind, value) DO UPDATE SET last_seen_at = now();

    SELECT array_agg(l.user_id) INTO v_users
    FROM public.user_device_links l
    WHERE l.kind = 'device' AND l.value = v_visitor
      AND NOT public.has_role(l.user_id, 'admin');

    IF cardinality(v_users) > 1
      AND EXISTS (SELECT 1 FROM unnest(v_users) u WHERE public.abuse_is_free_tier(u)) THEN
      PERFORM public.abuse_upsert_alert('device', v_visitor, v_users);
    END IF;
  END IF;

  IF v_ip IS NOT NULL THEN
    INSERT INTO public.user_device_links (user_id, kind, value)
    VALUES (v_uid, 'ip', v_ip)
    ON CONFLICT (user_id, kind, value) DO UPDATE SET last_seen_at = now();

    SELECT created_at INTO v_created FROM auth.users WHERE id = v_uid;

    -- Hanya akun baru: cari akun lain di IP ini yang dibuat berdekatan.
    IF v_created > now() - c_ip_signup_window THEN
      SELECT array_agg(DISTINCT l.user_id) INTO v_users
      FROM public.user_device_links l
      JOIN auth.users au ON au.id = l.user_id
      WHERE l.kind = 'ip' AND l.value = v_ip
        AND au.created_at BETWEEN v_created - c_ip_signup_window
                              AND v_created + c_ip_signup_window
        AND NOT public.has_role(l.user_id, 'admin');

      IF cardinality(v_users) > 1
        AND EXISTS (SELECT 1 FROM unnest(v_users) u WHERE public.abuse_is_free_tier(u)) THEN
        PERFORM public.abuse_upsert_alert('ip', v_ip, v_users);
      END IF;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.register_device(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_device(TEXT) TO authenticated;

-- ─── record_cv_download: cek kuota + catat download secara atomik ────
-- Return: { allowed, reason?: 'quota' | 'device' | 'docx_locked', count, quota }

CREATE OR REPLACE FUNCTION public.record_cv_download(
  p_cv_id UUID,
  p_download_type TEXT,
  p_template_id TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_visitor TEXT := public.abuse_normalize_visitor_id(p_visitor_id);
  v_slug TEXT;
  v_quota INTEGER;
  v_is_free BOOLEAN;
  v_count INTEGER := 0;
  v_device TEXT;
  v_device_users UUID[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_download_type NOT IN ('pdf', 'docx') THEN
    RAISE EXCEPTION 'invalid download type: %', p_download_type;
  END IF;

  IF p_cv_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.cvs WHERE id = p_cv_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'cv not found' USING ERRCODE = '42501';
  END IF;

  SELECT st.slug, st.quota_cv_downloads INTO v_slug, v_quota
  FROM public.user_subscriptions us
  JOIN public.subscription_tiers st ON st.id = us.tier_id
  WHERE us.user_id = v_uid AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  v_is_free := v_slug IS NULL OR v_slug = 'free';
  IF v_is_free THEN
    v_slug := 'free';
    v_quota := coalesce(v_quota, 1);
  END IF;

  IF p_download_type = 'docx' AND v_is_free THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'docx_locked', 'quota', v_quota);
  END IF;

  IF p_download_type = 'pdf' AND v_quota IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('cv_download:' || v_uid::text));

    SELECT count(*) INTO v_count
    FROM public.cv_downloads
    WHERE user_id = v_uid AND download_type = 'pdf';

    IF v_count >= v_quota THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'quota', 'count', v_count, 'quota', v_quota);
    END IF;

    IF v_is_free AND NOT public.has_role(v_uid, 'admin') THEN
      IF v_visitor IS NOT NULL THEN
        INSERT INTO public.user_device_links (user_id, kind, value)
        VALUES (v_uid, 'device', v_visitor)
        ON CONFLICT (user_id, kind, value) DO UPDATE SET last_seen_at = now();
      END IF;

      -- Akun Free lain di device yang sama sudah memakai jatah download gratis?
      -- Device yang alert-nya "diabaikan" admin (dipakai bersama) tidak memblokir.
      SELECT l.value, array_agg(DISTINCT other.user_id) || v_uid
        INTO v_device, v_device_users
      FROM public.user_device_links l
      JOIN public.user_device_links other
        ON other.kind = 'device' AND other.value = l.value AND other.user_id <> v_uid
      WHERE l.user_id = v_uid
        AND l.kind = 'device'
        AND NOT public.has_role(other.user_id, 'admin')
        AND EXISTS (
          SELECT 1 FROM public.cv_downloads d
          WHERE d.user_id = other.user_id
            AND d.download_type = 'pdf'
            AND (d.user_tier = 'free' OR public.abuse_is_free_tier(other.user_id))
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.abuse_alerts a
          WHERE a.signal = 'device' AND a.signal_value = l.value AND a.status = 'ignored'
        )
      GROUP BY l.value
      LIMIT 1;

      IF v_device IS NOT NULL THEN
        PERFORM public.abuse_upsert_alert('device', v_device, v_device_users, true);
        RETURN jsonb_build_object('allowed', false, 'reason', 'device', 'count', v_count, 'quota', v_quota);
      END IF;
    END IF;
  END IF;

  INSERT INTO public.cv_downloads (cv_id, user_id, download_type, template_id, file_name, user_tier)
  VALUES (p_cv_id, v_uid, p_download_type, left(p_template_id, 64), left(p_file_name, 255), v_slug);

  RETURN jsonb_build_object(
    'allowed', true,
    'count', CASE WHEN p_download_type = 'pdf' THEN v_count + 1 ELSE v_count END,
    'quota', v_quota
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_cv_download(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_cv_download(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Download hanya bisa dicatat lewat record_cv_download (kuota dicek di database).
DROP POLICY IF EXISTS "Users can insert own cv downloads" ON public.cv_downloads;
REVOKE INSERT, UPDATE, DELETE ON public.cv_downloads FROM anon, authenticated;

-- ─── Admin ───────────────────────────────────────────────────────────

-- Detail akun untuk alert (admin page & email).
CREATE OR REPLACE FUNCTION public.abuse_alert_accounts(p_user_ids UUID[])
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'user_id', au.id,
    'email', au.email::text,
    'name', coalesce(
      nullif(p.full_name, ''),
      nullif(au.raw_user_meta_data ->> 'full_name', ''),
      nullif(au.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    'created_at', au.created_at,
    'tier', coalesce((
      SELECT st.slug
      FROM public.user_subscriptions us
      JOIN public.subscription_tiers st ON st.id = us.tier_id
      WHERE us.user_id = au.id AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    ), 'free'),
    'pdf_downloads', (
      SELECT count(*) FROM public.cv_downloads d
      WHERE d.user_id = au.id AND d.download_type = 'pdf'
    )
  ) ORDER BY au.created_at), '[]'::jsonb)
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.id = ANY(p_user_ids);
$$;

REVOKE ALL ON FUNCTION public.abuse_alert_accounts(UUID[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_abuse_alerts(p_status TEXT DEFAULT 'open')
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT := lower(trim(coalesce(p_status, 'open')));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'rows', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id,
        'signal', a.signal,
        'signal_value', a.signal_value,
        'status', a.status,
        'blocked_download', a.blocked_download,
        'emailed_at', a.emailed_at,
        'reviewed_at', a.reviewed_at,
        'created_at', a.created_at,
        'updated_at', a.updated_at,
        'accounts', public.abuse_alert_accounts(a.user_ids)
      ) ORDER BY a.updated_at DESC)
      FROM (
        SELECT * FROM public.abuse_alerts
        WHERE v_status = 'all' OR status = v_status
        ORDER BY updated_at DESC
        LIMIT 200
      ) a
    ), '[]'::jsonb),
    'counts', (
      SELECT jsonb_build_object(
        'open', count(*) FILTER (WHERE status = 'open'),
        'reviewed', count(*) FILTER (WHERE status = 'reviewed'),
        'ignored', count(*) FILTER (WHERE status = 'ignored'),
        'all', count(*)
      )
      FROM public.abuse_alerts
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_abuse_alerts(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_abuse_alerts(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_abuse_alert_status(p_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('open', 'reviewed', 'ignored') THEN
    RAISE EXCEPTION 'invalid status: %', p_status;
  END IF;

  UPDATE public.abuse_alerts
  SET status = p_status,
      reviewed_by = CASE WHEN p_status = 'open' THEN NULL ELSE auth.uid() END,
      reviewed_at = CASE WHEN p_status = 'open' THEN NULL ELSE now() END
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_abuse_alert_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_abuse_alert_status(UUID, TEXT) TO authenticated;

-- ─── Email ringkasan (edge function abuse-alert-digest) ──────────────

-- Ambil alert terbuka yang belum di-email dan tandai sudah di-email.
-- Jika kirim email gagal, edge function mengosongkan lagi emailed_at.
CREATE OR REPLACE FUNCTION public.claim_abuse_alert_digest()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH claimed AS (
    UPDATE public.abuse_alerts
    SET emailed_at = now()
    WHERE status = 'open' AND emailed_at IS NULL
    RETURNING *
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'signal', c.signal,
    'signal_value', c.signal_value,
    'blocked_download', c.blocked_download,
    'updated_at', c.updated_at,
    'accounts', public.abuse_alert_accounts(c.user_ids)
  ) ORDER BY c.updated_at DESC), '[]'::jsonb)
  INTO v_result
  FROM claimed c;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_abuse_alert_digest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_abuse_alert_digest() TO service_role;

CREATE OR REPLACE FUNCTION public.trigger_abuse_alert_digest()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  function_url text := 'https://nfdrkuvyowaydjkhfvrr.supabase.co/functions/v1/abuse-alert-digest';
  cron_secret text;
BEGIN
  -- Tidak ada alert baru → tidak perlu memanggil edge function
  IF NOT EXISTS (
    SELECT 1 FROM public.abuse_alerts WHERE status = 'open' AND emailed_at IS NULL
  ) THEN
    RETURN;
  END IF;

  SELECT decrypted_secret
  INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'CRON_SECRET'
  LIMIT 1;

  IF cron_secret IS NULL OR length(cron_secret) < 16 THEN
    RAISE EXCEPTION 'CRON_SECRET belum diset di Supabase Vault.';
  END IF;

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_abuse_alert_digest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_abuse_alert_digest() TO postgres;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'abuse-alert-digest') THEN
    PERFORM cron.unschedule('abuse-alert-digest');
  END IF;
END
$do$;

SELECT cron.schedule(
  'abuse-alert-digest',
  '*/30 * * * *',
  'SELECT public.trigger_abuse_alert_digest()'
);
