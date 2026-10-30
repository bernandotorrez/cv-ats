/**
 * /admin/abuse — Akun Free ganda (device / IP sama) untuk mengulang jatah download gratis.
 * Data dari RPC admin_list_abuse_alerts (menolak non-admin di database).
 * Device yang "Diabaikan" tidak lagi memblokir download PDF gratis.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  EyeOff,
  Globe,
  Loader2,
  RefreshCw,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDateTimeShort } from "@/lib/invoice";

export const Route = createFileRoute("/_authenticated/admin/abuse")({
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      title: "Admin Akun Ganda — CV Pintar",
      description: "Deteksi akun Free ganda berdasarkan device dan IP.",
      path: "/admin/abuse",
      noindex: true,
    }),
  component: AdminAbusePage,
});

type AlertStatus = "open" | "reviewed" | "ignored";
type Filter = AlertStatus | "all";

interface AlertAccount {
  user_id: string;
  email: string | null;
  name: string;
  created_at: string;
  tier: string;
  pdf_downloads: number;
}

interface AbuseAlert {
  id: string;
  signal: "device" | "ip";
  signal_value: string;
  status: AlertStatus;
  blocked_download: boolean;
  emailed_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  accounts: AlertAccount[];
}

interface RpcResponse {
  rows: AbuseAlert[];
  counts: Record<Filter, number>;
}

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "open", label: "Perlu dicek" },
  { key: "reviewed", label: "Sudah ditinjau" },
  { key: "ignored", label: "Diabaikan" },
  { key: "all", label: "Semua" },
];

const STATUS_UI: Record<AlertStatus, { label: string; className: string }> = {
  open: {
    label: "Perlu dicek",
    className: "border-transparent bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  reviewed: {
    label: "Sudah ditinjau",
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  ignored: { label: "Diabaikan", className: "border-transparent bg-muted text-muted-foreground" },
};

function AdminAbusePage() {
  const [rows, setRows] = useState<AbuseAlert[]>([]);
  const [counts, setCounts] = useState<RpcResponse["counts"] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // RPC admin belum ada di generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("admin_list_abuse_alerts", {
      p_status: filter,
    });
    setLoading(false);
    if (error) {
      toast.error(`Gagal memuat alert: ${error.message}`);
      return;
    }
    const res = data as RpcResponse;
    setRows(res.rows ?? []);
    setCounts(res.counts ?? null);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (alert: AbuseAlert, status: AlertStatus) => {
    setUpdating(alert.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("admin_set_abuse_alert_status", {
      p_id: alert.id,
      p_status: status,
    });
    setUpdating(null);
    if (error) {
      toast.error(`Gagal mengubah status: ${error.message}`);
      return;
    }
    toast.success(
      status === "ignored"
        ? alert.signal === "device"
          ? "Diabaikan — device ini tidak lagi memblokir download gratis."
          : "Diabaikan — IP ini tidak akan di-alert lagi."
        : status === "reviewed"
          ? "Ditandai sudah ditinjau."
          : "Alert dibuka lagi.",
    );
    void load();
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-1 p-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Device sama</strong> — beberapa akun login dari
            browser yang sama. Akun Free kedua otomatis tidak bisa download PDF gratis.
          </p>
          <p>
            <strong className="text-foreground">IP sama</strong> — beberapa akun dibuat dalam 24 jam
            dari IP yang sama. Hanya sinyal: IP seluler, kantor, dan kampus sering dipakai bersama.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              {counts && ` (${counts[f.key] ?? 0})`}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Muat ulang
        </Button>
      </div>

      <div className="space-y-3">
        {loading && rows.length === 0 ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada alert akun ganda.
          </p>
        ) : (
          rows.map((alert) => {
            const status = STATUS_UI[alert.status];
            const SignalIcon = alert.signal === "device" ? Smartphone : Globe;
            const busy = updating === alert.id;
            return (
              <Card
                key={alert.id}
                className={cn("rounded-xl", alert.status === "open" && "border-destructive")}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <SignalIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-semibold">
                          {alert.signal === "device" ? "Device sama" : "IP sama"}
                        </span>
                        <Badge className={cn("text-xs", status.className)}>{status.label}</Badge>
                        {alert.blocked_download && (
                          <Badge variant="secondary" className="text-xs">
                            Download diblokir
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {alert.signal_value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Terakhir aktif {formatDateTimeShort(alert.updated_at)} · pertama{" "}
                        {formatDateTimeShort(alert.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {alert.status !== "reviewed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void setStatus(alert, "reviewed")}
                        >
                          {busy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Sudah ditinjau
                        </Button>
                      )}
                      {alert.status !== "ignored" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          title={
                            alert.signal === "device"
                              ? "Device dipakai bersama: izinkan download gratis lagi"
                              : "IP dipakai bersama: jangan alert lagi"
                          }
                          onClick={() => void setStatus(alert, "ignored")}
                        >
                          <EyeOff className="mr-2 h-4 w-4" />
                          {alert.signal === "device" ? "Abaikan (izinkan)" : "Abaikan"}
                        </Button>
                      )}
                      {alert.status !== "open" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => void setStatus(alert, "open")}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Buka lagi
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Akun</th>
                          <th className="px-3 py-2 text-left font-medium">Paket</th>
                          <th className="px-3 py-2 text-right font-medium">PDF</th>
                          <th className="px-3 py-2 text-right font-medium">Daftar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alert.accounts.map((acc) => (
                          <tr key={acc.user_id} className="border-t">
                            <td className="px-3 py-2">
                              <div className="font-medium break-all">
                                {acc.email || acc.user_id}
                              </div>
                              {acc.name && (
                                <div className="text-xs text-muted-foreground">{acc.name}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 capitalize">{acc.tier}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {acc.pdf_downloads}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-muted-foreground">
                              {formatDateTimeShort(acc.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
