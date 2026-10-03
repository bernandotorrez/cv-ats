-- Catat kapan email detail pembayaran terakhir terkirim, agar email tidak
-- dikirim berulang saat user mengklik beli beberapa kali untuk order yang sama.
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS payment_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.payment_orders.payment_email_sent_at IS
  'Waktu terakhir email detail pembayaran (Menunggu Pembayaran) berhasil dikirim.';
