/**
 * /pembayaran — Riwayat pembayaran + download invoice (butuh login).
 * Data dari tabel payment_orders (RLS: hanya order milik user sendiri).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Download, ExternalLink, Loader2, Receipt } from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { BackButton } from "@/components/ui/back-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { downloadInvoicePdf, formatDate, formatIdr } from "@/lib/invoice";

export const Route = createFileRoute("/_authenticated/pembayaran")({
  head: () =>
    buildSeo({
      title: "Riwayat Pembayaran — CV Pintar",
      description: "Daftar pembayaran dan invoice.",
      path: "/pembayaran",
      noindex: true,
    }),
  component: PembayaranPage,
});

type OrderStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";

interface Order {
  id: string;
  order_id: string;
  product_name: string;
  product_type: string;
  quantity: number;
  amount_idr: number;
  gateway_amount_idr: number | null;
  status: OrderStatus;
  payment_method: string | null;
  payment_link_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
}

type Filter = "all" | "paid" | "pending" | "other";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "paid", label: "Lunas" },
  { key: "pending", label: "Menunggu" },
  { key: "other", label: "Gagal / Kedaluwarsa" },
];

/** Status tampilan: pending yang sudah lewat expires_at dianggap kedaluwarsa. */
function displayStatus(o: Order): OrderStatus {
  if (o.status === "pending" && o.expires_at && new Date(o.expires_at) <= new Date()) {
    return "expired";
  }
  return o.status;
}

const STATUS_UI: Record<OrderStatus, { label: string; className: string }> = {
  paid: {
    label: "Lunas",
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  pending: {
    label: "Menunggu pembayaran",
    className:
      "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  expired: { label: "Kedaluwarsa", className: "border-transparent bg-muted text-muted-foreground" },
  failed: {
    label: "Gagal",
    className: "border-transparent bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "border-transparent bg-muted text-muted-foreground",
  },
};

function PembayaranPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("payment_orders")
      .select(
        "id, order_id, product_name, product_type, quantity, amount_idr, gateway_amount_idr, status, payment_method, payment_link_url, expires_at, paid_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(true);
          return;
        }
        // Order yang gagal dibuat di gateway (tanpa link bayar) tidak pernah dilihat user
        const visible = ((data ?? []) as Order[]).filter(
          (o) => !(o.status === "cancelled" && !o.payment_link_url),
        );
        setOrders(visible);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const s = displayStatus(o);
      if (filter === "paid") return s === "paid";
      if (filter === "pending") return s === "pending";
      if (filter === "other") return s !== "paid" && s !== "pending";
      return true;
    });
  }, [orders, filter]);

  const totalPaid = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + (o.gateway_amount_idr ?? o.amount_idr), 0),
    [orders],
  );

  const handleInvoice = async (o: Order) => {
    setDownloading(o.order_id);
    try {
      await downloadInvoicePdf(o, {
        name: (user?.user_metadata?.full_name as string | undefined) || "",
        email: user?.email || "",
      });
    } catch (e) {
      console.error("Invoice error:", e);
      toast.error("Gagal membuat invoice. Coba lagi.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="container-page max-w-3xl space-y-6 py-5 md:py-8">
      <BackButton />

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Riwayat Pembayaran</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua pembelianmu di CV Pintar. Invoice tersedia untuk pembayaran yang sudah lunas.
          </p>
        </div>
        <Receipt aria-hidden="true" className="hidden h-8 w-8 shrink-0 text-primary sm:block" />
      </header>

      {orders && orders.some((o) => o.status === "paid") && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <span className="text-sm text-muted-foreground">Total pembayaran lunas</span>
            <span className="font-display text-xl font-bold">{formatIdr(totalPaid)}</span>
          </CardContent>
        </Card>
      )}

      <div role="tablist" aria-label="Filter status" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Gagal memuat riwayat pembayaran. Muat ulang halaman ini beberapa saat lagi.
          </CardContent>
        </Card>
      ) : orders === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <CreditCard aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {orders.length === 0
                ? "Belum ada pembayaran."
                : "Tidak ada pembayaran dengan status ini."}
            </p>
            {orders.length === 0 && (
              <Button asChild size="sm">
                <Link to="/harga">Lihat Paket & Harga</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const status = displayStatus(o);
            const ui = STATUS_UI[status];
            const total = o.gateway_amount_idr ?? o.amount_idr;
            const canPay = status === "pending" && !!o.payment_link_url;
            return (
              <li key={o.id}>
                <Card className="rounded-2xl">
                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{o.product_name}</p>
                        <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                          {o.order_id}
                        </p>
                      </div>
                      <Badge className={cn("shrink-0", ui.className)}>{ui.label}</Badge>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-bold">{formatIdr(total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {status === "paid"
                            ? `Dibayar ${formatDate(o.paid_at, true)} WIB`
                            : `Dibuat ${formatDate(o.created_at, true)} WIB`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {status === "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={downloading === o.order_id}
                            onClick={() => handleInvoice(o)}
                          >
                            {downloading === o.order_id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Invoice
                          </Button>
                        )}
                        {canPay && (
                          <Button asChild size="sm">
                            <a href={o.payment_link_url!}>
                              Bayar Sekarang
                              <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Ada kendala pembayaran?{" "}
        <Link to="/kontak" className="text-primary underline">
          Hubungi kami
        </Link>{" "}
        dan sertakan nomor order.
      </p>
    </div>
  );
}
