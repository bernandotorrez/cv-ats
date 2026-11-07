/**
 * PaymentResult — status order setelah kembali dari halaman bayar SumoPod.
 * Status diambil dari tabel `payment_orders` (RLS: hanya order milik user),
 * yang di-update oleh webhook. Return URL BUKAN bukti pembayaran.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Coins, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { isPaymentLinkOpen, type PaymentOrderStatus } from "@/lib/payment";

type Order = {
  order_id: string;
  product_type: string;
  product_name: string;
  amount_idr: number;
  gateway_amount_idr: number | null;
  status: PaymentOrderStatus;
  payment_link_url: string | null;
  expires_at: string | null;
};

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 3 * 60 * 1000;

const NEXT_STEP: Record<string, { to: string; label: string }> = {
  tier: { to: "/dashboard", label: "Ke Dashboard" },
  addon_upload_cv: { to: "/cv", label: "Ke CV Saya" },
  addon_pro_photo: { to: "/cv", label: "Ke CV Saya" },
  tryout: { to: "/tryout", label: "Mulai Tryout" },
};

/** Tujuan "beli lagi" per jenis produk (tryout punya halaman paket sendiri). */
const RETRY: Record<string, { to: string; label: string }> = {
  tryout: { to: "/tryout/beli", label: "Lihat Paket Tryout" },
};
const DEFAULT_RETRY = { to: "/harga", label: "Lihat Paket & Harga" };

type TryoutCreditInfo = { added: number | null; available: number };

const formatIdr = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export function PaymentResult({
  orderId,
  variant,
}: {
  orderId?: string;
  variant: "success" | "cancel";
}) {
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [tryoutCredit, setTryoutCredit] = useState<TryoutCreditInfo | null>(null);

  // Order tryout yang sudah lunas: tampilkan kredit yang masuk & total tersedia
  // (RLS: hanya kredit milik user sendiri).
  useEffect(() => {
    if (!user || order?.status !== "paid" || order.product_type !== "tryout") return;
    let cancelled = false;
    const nowIso = new Date().toISOString();
    void Promise.all([
      supabase
        .from("tryout_credits")
        .select("total_credits")
        .eq("user_id", user.id)
        .eq("payment_ref", order.order_id)
        .maybeSingle(),
      supabase
        .from("tryout_credits")
        .select("remaining_credits")
        .eq("user_id", user.id)
        .eq("status", "active")
        .or(`expired_at.is.null,expired_at.gt.${nowIso}`),
    ]).then(([added, all]) => {
      if (cancelled) return;
      setTryoutCredit({
        added: added.data?.total_credits ?? null,
        available: (all.data || []).reduce((s, c) => s + c.remaining_credits, 0),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [user, order?.status, order?.product_type, order?.order_id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const load = async () => {
      const { data } = await supabase
        .from("payment_orders")
        .select(
          "order_id, product_type, product_name, amount_idr, gateway_amount_idr, status, payment_link_url, expires_at",
        )
        .eq("order_id", orderId)
        .maybeSingle();
      if (cancelled) return;
      setOrder((data as Order | null) ?? null);
      setLoading(false);

      // Halaman sukses: tunggu webhook mengonfirmasi pembayaran
      if (variant === "success" && data?.status === "pending") {
        if (Date.now() - startedAt < POLL_MAX_MS) {
          timer = setTimeout(load, POLL_INTERVAL_MS);
        } else {
          setTimedOut(true);
        }
      }
    };
    void load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [authLoading, user, orderId, variant]);

  const canContinuePaying = !!order && isPaymentLinkOpen(order);

  let icon = <Loader2 className="h-7 w-7 animate-spin" />;
  let tone = "bg-primary/10 text-primary";
  let title = "Memuat status pembayaran…";
  let desc = "";

  if (!loading) {
    if (!orderId) {
      icon = <XCircle className="h-7 w-7" />;
      tone = "bg-muted text-muted-foreground";
      title = "Order tidak ditemukan";
      desc = "Link ini tidak memuat nomor order.";
    } else if (!user) {
      icon = <Clock className="h-7 w-7" />;
      tone = "bg-muted text-muted-foreground";
      title = "Masuk untuk melihat status";
      desc = "Silakan login dengan akun yang dipakai saat membeli.";
    } else if (!order) {
      icon = <XCircle className="h-7 w-7" />;
      tone = "bg-muted text-muted-foreground";
      title = "Order tidak ditemukan";
      desc = "Pastikan kamu login dengan akun yang sama saat membeli.";
    } else if (order.status === "paid") {
      icon = <CheckCircle2 className="h-7 w-7" />;
      tone = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
      title = "Pembayaran Berhasil!";
      desc =
        order.product_type === "tryout"
          ? `${order.product_name} sudah aktif. Kredit tryout siap dipakai.`
          : `${order.product_name} sudah aktif di akunmu.`;
    } else if (order.status === "pending" && variant === "success") {
      icon = timedOut ? (
        <Clock className="h-7 w-7" />
      ) : (
        <Loader2 className="h-7 w-7 animate-spin" />
      );
      tone = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
      title = "Menunggu Konfirmasi Pembayaran";
      desc = timedOut
        ? "Pembayaran belum terkonfirmasi. Jika kamu sudah membayar, aktivasi akan berjalan otomatis begitu konfirmasi diterima. Muat ulang halaman ini beberapa saat lagi."
        : "Kami sedang menunggu konfirmasi dari payment gateway. Halaman ini akan diperbarui otomatis.";
    } else if (order.status === "pending") {
      icon = <XCircle className="h-7 w-7" />;
      tone = "bg-muted text-muted-foreground";
      title = "Pembayaran Dibatalkan";
      desc =
        "Kamu belum menyelesaikan pembayaran. Kamu bisa melanjutkan selama link masih berlaku.";
    } else {
      icon = <XCircle className="h-7 w-7" />;
      tone = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
      title =
        order.status === "expired"
          ? "Pembayaran Kedaluwarsa"
          : order.status === "failed"
            ? "Pembayaran Gagal"
            : "Pembayaran Dibatalkan";
      desc = "Tidak ada dana yang ditarik. Silakan buat pembayaran baru.";
    }
  }

  const next = order ? NEXT_STEP[order.product_type] : undefined;
  const retry = (order && RETRY[order.product_type]) || DEFAULT_RETRY;

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${tone}`}>
            {icon}
          </div>
          <CardTitle className="mt-4 font-display text-2xl">{title}</CardTitle>
          {desc && <CardDescription>{desc}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          {order && (
            <dl className="rounded-lg border border-border bg-muted/30 p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Produk</dt>
                <dd className="text-right font-medium">{order.product_name}</dd>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium">
                  {formatIdr(order.gateway_amount_idr ?? order.amount_idr)}
                </dd>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <dt className="text-muted-foreground">No. Order</dt>
                <dd className="break-all font-mono text-xs">{order.order_id}</dd>
              </div>
            </dl>
          )}

          {order?.status === "paid" && order.product_type === "tryout" && tryoutCredit && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left dark:border-emerald-900 dark:bg-emerald-950/40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                <Coins className="h-5 w-5" aria-hidden />
              </span>
              <div className="text-sm">
                {tryoutCredit.added != null && (
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    +{tryoutCredit.added} kredit tryout masuk
                  </p>
                )}
                <p className="text-emerald-700 dark:text-emerald-400">
                  Total kredit tersedia: <b>{tryoutCredit.available}</b> · 1 kredit = 1 tryout
                </p>
              </div>
            </div>
          )}

          {order?.status === "paid" && next && (
            <Button asChild size="lg" className="w-full">
              <Link to={next.to as never}>
                {next.label} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}

          {canContinuePaying && (
            <Button asChild size="lg" className="w-full">
              <a href={order!.payment_link_url!}>Lanjutkan Pembayaran</a>
            </Button>
          )}

          {!loading && !user && orderId && (
            <Button asChild size="lg" className="w-full">
              <Link
                to="/login"
                search={{ redirect: window.location.pathname + window.location.search }}
              >
                Masuk
              </Link>
            </Button>
          )}

          {(!order || (order.status !== "paid" && !canContinuePaying)) && !loading && user && (
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link to={retry.to as never}>{retry.label}</Link>
            </Button>
          )}

          {user && order && (
            <Button asChild size="sm" variant="ghost" className="w-full">
              <Link to="/pembayaran">
                {order.status === "paid"
                  ? "Lihat riwayat & unduh invoice"
                  : "Lihat riwayat pembayaran"}
              </Link>
            </Button>
          )}

          <p className="pt-1 text-xs text-muted-foreground">
            Ada kendala?{" "}
            <Link to="/kontak" className="text-primary underline">
              Hubungi kami
            </Link>{" "}
            dan sertakan nomor order.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
