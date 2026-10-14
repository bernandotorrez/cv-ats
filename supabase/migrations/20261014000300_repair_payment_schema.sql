-- ═════════════════════════════════════════════════════════════════════════════
-- Repair: skema produksi tidak punya kolom/tabel dari migration pembayaran
-- ═════════════════════════════════════════════════════════════════════════════
-- /admin/payments gagal dengan "column p.quota_pro_photo_purchased does not
-- exist": migration 20261003000000 tercatat tapi sebagian isinya tidak ada di
-- database produksi. Kolom yang hilang juga membuat:
--   - cv.$id.tsx & admin-users gagal membaca profiles → Upload CV tampak
--     terkunci untuk semua user (termasuk yang sudah membeli add-on),
--   - aktivasi add-on Foto Pro & konsumsi kuotanya gagal,
--   - trigger protect_profile_quotas error saat user mengubah profilnya.
--
-- Semua perintah idempotent (IF NOT EXISTS): aman dijalankan walau sebagian
-- sudah ada. Tipe & default sama dengan migration aslinya.

-- ─── profiles: kolom add-on & kuota ──────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_upload_cv BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS upload_cv_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS has_pro_photo BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pro_photo_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quota_pro_photo INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quota_upload_cv INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quota_upload_cv_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quota_pro_photo_reset_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quota_pro_photo_purchased INTEGER NOT NULL DEFAULT 0
  CHECK (quota_pro_photo_purchased >= 0);

COMMENT ON COLUMN public.profiles.quota_pro_photo_purchased IS
  'Kuota Foto Pro yang dibeli (add-on). Tidak di-reset bulanan; dipakai setelah kuota tier (quota_pro_photo) habis.';

-- ─── payment_orders: kolom tambahan ──────────────────────────────────
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS fee_idr INTEGER,
  ADD COLUMN IF NOT EXISTS net_amount_idr INTEGER,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfillment_result JSONB,
  ADD COLUMN IF NOT EXISTS last_event TEXT,
  ADD COLUMN IF NOT EXISTS gateway_amount_idr INTEGER,
  ADD COLUMN IF NOT EXISTS payment_email_sent_at TIMESTAMPTZ;

-- ─── Webhook log (audit + dedupe by svix-id) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  svix_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  order_id TEXT,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_order
  ON public.payment_webhook_events(order_id);

-- RLS on, no policies: hanya service_role yang bisa akses.
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- PostgREST perlu tahu kolom baru tanpa menunggu restart
NOTIFY pgrst, 'reload schema';
