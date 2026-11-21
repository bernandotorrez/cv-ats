-- ─────────────────────────────────────────────────────────────────────────────
-- Atribusi iklan per order (untuk Meta Conversions API)
--
-- Saat checkout, client mengirim fbp/fbc/UTM; edge function `payment-create` juga
-- mencatat IP & user agent pembeli. Saat pembayaran lunas, `payment-webhook`
-- memakai data ini untuk mengirim event Purchase ke Meta (server-side), karena
-- QRIS dibayar di luar situs dan browser belum tentu kembali ke halaman sukses.
--
-- Berisi IP & user agent, jadi sengaja TANPA policy: hanya service_role (edge
-- functions) yang bisa membaca/menulis. Aman dijalankan ulang.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_order_tracking (
  order_id TEXT PRIMARY KEY REFERENCES public.payment_orders(order_id) ON DELETE CASCADE,
  fbp TEXT,
  fbc TEXT,
  event_source_url TEXT,
  utm JSONB,
  client_ip TEXT,
  client_user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_order_tracking ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_payment_order_tracking_updated_at ON public.payment_order_tracking;
CREATE TRIGGER update_payment_order_tracking_updated_at
  BEFORE UPDATE ON public.payment_order_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON public.payment_order_tracking FROM anon, authenticated;
