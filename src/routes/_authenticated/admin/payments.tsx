/**
 * /admin/payments — Semua pembayaran SumoPod + invoice + cek aktivasi produk.
 * Data dari RPC admin_list_payment_orders (menolak non-admin di database).
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Zap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Search,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { downloadInvoicePdf, formatDateTimeShort, formatIdr } from "@/lib/invoice";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/_authenticated/admin/payments")({
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/login", search: {} as any });
    }
    const { data } = await supabase.rpc("has_role", {
      _user_id: sessionData.session.user.id,
      _role: "admin",
    });
    if (!data) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () =>
    buildSeo({
      title: "Admin Pembayaran — CV Pintar",
      description: "Semua pembayaran dan invoice.",
      path: "/admin/payments",
      noindex: true,
    }),
  component: AdminPaymentsPage,
});

type DisplayStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";
type Filter = "all" | "paid" | "pending" | "issue" | "other";

interface PaymentRow {
  id: string;
  order_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string;
  product_type: "tier" | "addon_upload_cv" | "addon_pro_photo" | "tryout";
  product_ref: string;
  product_name: string;
  quantity: number;
  amount_idr: number;
  gateway_amount_idr: number | null;
  fee_idr: number | null;
  net_amount_idr: number | null;
  status: DisplayStatus;
  display_status: DisplayStatus;
  payment_method: string | null;
  gateway_payment_id: string | null;
  expires_at: string | null;
  paid_at: string | null;
  fulfilled_at: string | null;
  fulfillment_result: Record<string, unknown> | null;
  last_event: string | null;
  webhook_count: number;
  webhook_error: string | null;
  current_state: Record<string, unknown> | null;
  attention_reason: string | null;
  created_at: string;
}

interface Summary {
  paid_count: number;
  paid_gross: number;
  paid_net: number;
  pending_count: number;
  issue_count: number;
}

interface RpcResponse {
  rows: PaymentRow[];
  total: number;
  summary: Summary;
}

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "paid", label: "Lunas" },
  { key: "pending", label: "Menunggu" },
  { key: "issue", label: "Perlu dicek" },
  { key: "other", label: "Gagal / Kedaluwarsa" },
];

const STATUS_UI: Record<DisplayStatus, { label: string; className: string }> = {
  paid: {
    label: "Lunas",
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  pending: {
    label: "Menunggu",
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

const PRODUCT_TYPE_LABEL: Record<PaymentRow["product_type"], string> = {
  tier: "Paket",
  addon_upload_cv: "Add-on Upload CV",
  addon_pro_photo: "Add-on Foto Pro",
  tryout: "Tryout",
};

const formatDay = (iso: unknown) =>
  typeof iso === "string" && iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      })
    : "-";

/** Ringkasan hasil aktivasi + kondisi produk di akun pembeli saat ini. */
function describeActivation(o: PaymentRow): { activated: string | null; now: string | null } {
  const r = o.fulfillment_result ?? {};
  const s = o.current_state ?? {};
  switch (o.product_type) {
    case "tier":
      return {
        activated: o.fulfilled_at
          ? `Tier ${String(r.tier ?? o.product_ref)} s/d ${formatDay(r.date_end)}`
          : null,
        now: o.current_state
          ? `Tier aktif: ${String(s.tier ?? "-")} s/d ${formatDay(s.date_end)}`
          : "Tidak ada langganan aktif",
      };
    case "addon_upload_cv":
      return {
        activated: o.fulfilled_at ? `Upload CV s/d ${formatDay(r.upload_cv_end_date)}` : null,
        now: s.has_upload_cv
          ? `Upload CV aktif s/d ${formatDay(s.upload_cv_end_date)}`
          : "Upload CV tidak aktif",
      };
    case "addon_pro_photo":
      return {
        activated: o.fulfilled_at
          ? `+${o.quantity} kuota → total dibeli ${String(r.quota_pro_photo_purchased ?? "-")}`
          : null,
        now: `Sisa kuota Foto Pro: ${String(s.quota_pro_photo ?? 0)} tier + ${String(
          s.quota_pro_photo_purchased ?? 0,
        )} dibeli`,
      };
    case "tryout":
      return {
        activated: o.fulfilled_at ? `${String(r.credits ?? "-")} kredit tryout` : null,
        now: o.current_state
          ? `Kredit order ini: ${String(s.used_credits ?? 0)}/${String(s.total_credits ?? 0)} terpakai`
          : "Kredit order ini tidak ditemukan",
      };
    default:
      return { activated: null, now: null };
  }
}

/** Panggil edge function admin dengan JWT sesi saat ini. */
async function callAdminFunction<T>(name: string, body: unknown): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!token || !supabaseUrl) {
    throw new Error("Session admin tidak valid. Silakan login ulang.");
  }
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error ?? response.statusText);
  }
  return data;
}

interface ReconcileResponse {
  checked: number;
  counts: Record<string, number>;
  results: Array<{
    order_id: string;
    action: string;
    gateway_status: string | null;
    error?: string;
  }>;
}

function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [fulfillTarget, setFulfillTarget] = useState<PaymentRow | null>(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("admin_list_payment_orders", {
      p_search: search,
      p_status: filter,
      p_page: page,
      p_page_size: PAGE_SIZE,
    });
    setLoading(false);
    if (error) {
      toast.error(`Gagal memuat pembayaran: ${error.message}`);
      return;
    }
    const res = data as RpcResponse;
    setRows(res.rows ?? []);
    setTotal(res.total ?? 0);
    setSummary(res.summary ?? null);
  }, [search, filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce input pencarian
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFulfill = async () => {
    if (!fulfillTarget) return;
    setFulfilling(true);
    try {
      // Lewat edge function agar email ke pembeli & CS ikut terkirim
      const data = await callAdminFunction<{ already_fulfilled?: boolean }>(
        "admin-payment-fulfill",
        { order_id: fulfillTarget.order_id },
      );
      toast.success(
        data.already_fulfilled
          ? `${fulfillTarget.order_id} sudah aktif sebelumnya.`
          : `Produk untuk ${fulfillTarget.order_id} sudah diaktifkan & email terkirim.`,
      );
      setFulfillTarget(null);
      void load();
    } catch (e) {
      toast.error(`Gagal mengaktifkan: ${e instanceof Error ? e.message : "server error"}`);
    } finally {
      setFulfilling(false);
    }
  };

  // Cek order "Menunggu" ke SumoPod untuk pembayaran yang webhook-nya tidak masuk
  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const data = await callAdminFunction<ReconcileResponse>("payment-reconcile", {});
      const c = data.counts;
      if (data.checked === 0) {
        toast.info("Tidak ada order menunggu yang perlu dicek.");
      } else {
        const summary = [
          `${data.checked} order dicek`,
          c.fulfilled && `${c.fulfilled} diaktifkan`,
          (c.expired || c.failed) && `${(c.expired ?? 0) + (c.failed ?? 0)} kedaluwarsa/gagal`,
          c.unchanged && `${c.unchanged} masih menunggu`,
          c.error && `${c.error} error`,
        ]
          .filter(Boolean)
          .join(" · ");
        const firstError = data.results.find((r) => r.action === "error")?.error;
        if (c.error) toast.warning(summary, { description: firstError });
        else toast.success(summary);
      }
      void load();
    } catch (e) {
      toast.error(`Gagal cek status: ${e instanceof Error ? e.message : "server error"}`);
    } finally {
      setReconciling(false);
    }
  };

  const handleInvoice = async (o: PaymentRow) => {
    setDownloading(o.order_id);
    try {
      await downloadInvoicePdf(o, { name: o.user_name, email: o.user_email ?? "" });
    } catch (e) {
      console.error("Invoice error:", e);
      toast.error("Gagal membuat invoice.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Order lunas", value: summary ? String(summary.paid_count) : "-" },
          {
            label: "Pendapatan bersih",
            value: summary ? formatIdr(summary.paid_net) : "-",
            hint: summary ? `Kotor ${formatIdr(summary.paid_gross)}` : undefined,
          },
          { label: "Menunggu bayar", value: summary ? String(summary.pending_count) : "-" },
          {
            label: "Perlu dicek",
            value: summary ? String(summary.issue_count) : "-",
            danger: (summary?.issue_count ?? 0) > 0,
          },
        ].map((s) => (
          <Card key={s.label} className={cn(s.danger && "border-destructive")}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p
                className={cn(
                  "mt-1 font-display text-xl font-bold",
                  s.danger && "text-destructive",
                )}
              >
                {s.value}
              </p>
              {s.hint && <p className="text-xs text-muted-foreground">{s.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari order ID, email, nama, produk…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleReconcile()}
            disabled={reconciling}
            title="Cek order Menunggu ke SumoPod; yang sudah Completed langsung diaktifkan"
          >
            {reconciling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Cek status ke SumoPod
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Muat ulang
          </Button>
        </div>
      </div>

      <div role="tablist" aria-label="Filter status" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {f.key === "issue" && (summary?.issue_count ?? 0) > 0 && ` (${summary!.issue_count})`}
          </button>
        ))}
      </div>

      {/* Daftar */}
      <div className="space-y-3">
        {loading && rows.length === 0 ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada pembayaran ditemukan.
          </p>
        ) : (
          rows.map((o) => {
            const status = STATUS_UI[o.display_status] ?? STATUS_UI.pending;
            const charged = o.gateway_amount_idr ?? o.amount_idr;
            const fee = Math.max(charged - o.amount_idr, 0);
            const act = describeActivation(o);
            return (
              <Card
                key={o.id}
                className={cn("rounded-xl", o.attention_reason && "border-destructive")}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{o.product_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {PRODUCT_TYPE_LABEL[o.product_type] ?? o.product_type}
                          {o.quantity > 1 && ` ×${o.quantity}`}
                        </Badge>
                        <Badge className={cn("text-xs", status.className)}>{status.label}</Badge>
                      </div>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {o.order_id}
                      </p>
                      <p className="mt-1 text-sm">
                        {o.user_name || (
                          <span className="italic text-muted-foreground">Tanpa nama</span>
                        )}
                        {o.user_email && (
                          <span className="text-muted-foreground"> · {o.user_email}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold">{formatIdr(charged)}</p>
                      <p className="text-xs text-muted-foreground">
                        Harga {formatIdr(o.amount_idr)}
                        {fee > 0 && ` + fee ${formatIdr(fee)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.payment_method?.toUpperCase() ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-lg bg-muted/60 p-3 text-xs sm:grid-cols-2">
                    <div className="space-y-0.5">
                      <p>
                        <span className="text-muted-foreground">Dibuat: </span>
                        {formatDateTimeShort(o.created_at)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Dibayar: </span>
                        {formatDateTimeShort(o.paid_at)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Webhook: </span>
                        {o.webhook_count} event
                        {o.last_event && ` · terakhir ${o.last_event.slice(0, 60)}`}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="flex items-start gap-1">
                        {o.fulfilled_at ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span>
                          {o.fulfilled_at
                            ? `Aktif ${formatDateTimeShort(o.fulfilled_at)} — ${act.activated}`
                            : "Belum diaktifkan"}
                        </span>
                      </p>
                      {act.now && (
                        <p>
                          <span className="text-muted-foreground">Kondisi akun sekarang: </span>
                          {act.now}
                        </p>
                      )}
                    </div>
                  </div>

                  {o.attention_reason && (
                    <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {o.attention_reason}
                    </p>
                  )}

                  {(o.display_status === "paid" || !o.fulfilled_at) && (
                    <div className="flex flex-wrap justify-end gap-2">
                      {!o.fulfilled_at && (
                        <Button size="sm" variant="outline" onClick={() => setFulfillTarget(o)}>
                          <Zap className="mr-2 h-4 w-4" />
                          Aktifkan manual
                        </Button>
                      )}
                      {o.display_status === "paid" && (
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
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-2 py-4">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} dari {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!fulfillTarget}
        onOpenChange={(v) => {
          if (!v && !fulfilling) setFulfillTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan produk secara manual?</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan order <span className="font-mono">{fulfillTarget?.order_id}</span> sudah
              berstatus <strong>Completed</strong> di dashboard SumoPod. Produk{" "}
              <strong>{fulfillTarget?.product_name}</strong> akan diaktifkan untuk{" "}
              {fulfillTarget?.user_email || fulfillTarget?.user_name}, order ditandai lunas, lalu
              email konfirmasi dikirim ke pembeli dan ke CS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={fulfilling}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={fulfilling}
              onClick={(e) => {
                e.preventDefault();
                void handleFulfill();
              }}
            >
              {fulfilling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
