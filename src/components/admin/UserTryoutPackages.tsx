/**
 * Panel "Paket Tryout" di dialog edit user (Admin → User).
 *
 * - Berikan paket tryout secara manual (mis. saat payment gateway bermasalah).
 *   Memakai edge function `tryout-activate-credit` yang sama dengan Admin → Tryout,
 *   sehingga hasilnya identik dengan pembelian: satu baris `tryout_credits` baru
 *   dengan paket aslinya (fitur pembahasan & leaderboard mengikuti flag paket).
 * - Lihat riwayat paket user, ubah jumlah kredit per paket, atau batalkan paket
 *   yang salah diberikan (status → refunded). Ditulis langsung lewat RLS admin.
 */
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Ban, Check, Gift, Loader2, Pencil, Trophy, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

type PackageOption = {
  id: string;
  slug: string;
  name: string;
  credits: number;
  price: number;
  has_pembahasan: boolean;
  has_leaderboard: boolean;
};

type CreditRow = {
  id: string;
  total_credits: number;
  used_credits: number;
  status: string;
  payment_method: string | null;
  payment_ref: string | null;
  created_at: string;
  expired_at: string | null;
  tryout_packages: { name: string; slug: string; has_pembahasan: boolean } | null;
};

const PAYMENT_METHODS = [
  { value: "sumopod", label: "QRIS (SumoPod) — gateway gagal" },
  { value: "transfer", label: "Transfer Bank" },
  { value: "manual", label: "Manual (WA) / Bonus" },
] as const;

const METHOD_LABEL: Record<string, string> = {
  sumopod: "QRIS (SumoPod)",
  transfer: "Transfer Bank",
  manual: "Manual",
  lynk: "Lynk",
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

function statusOf(c: CreditRow): { label: string; cls: string; active: boolean } {
  if (c.status === "refunded")
    return { label: "Dibatalkan", cls: "bg-red-50 text-red-700 border-red-200", active: false };
  if (c.status === "expired" || (c.expired_at && new Date(c.expired_at).getTime() < Date.now()))
    return { label: "Kedaluwarsa", cls: "bg-muted text-muted-foreground", active: false };
  if (c.used_credits >= c.total_credits)
    return { label: "Habis", cls: "bg-muted text-muted-foreground", active: true };
  return {
    label: "Aktif",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: true,
  };
}

export function UserTryoutPackages({
  userId,
  userLabel,
  onChanged,
}: {
  userId: string;
  userLabel: string;
  /** Dipanggil setelah data kredit berubah (untuk memuat ulang daftar user). */
  onChanged: () => void;
}) {
  const fieldId = useId();
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [packageSlug, setPackageSlug] = useState("");
  const [method, setMethod] = useState<string>("sumopod");
  const [paymentRef, setPaymentRef] = useState("");
  const [confirmGrant, setConfirmGrant] = useState(false);
  const [granting, setGranting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState(0);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<CreditRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [pkgRes, creditRes] = await Promise.all([
      supabase
        .from("tryout_packages")
        .select("id, slug, name, credits, price, has_pembahasan, has_leaderboard")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tryout_credits")
        .select(
          "id, total_credits, used_credits, status, payment_method, payment_ref, created_at, expired_at, tryout_packages(name, slug, has_pembahasan)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    if (pkgRes.error || creditRes.error) {
      toast.error("Gagal memuat data paket tryout user");
    }
    const pkgs = (pkgRes.data || []) as PackageOption[];
    setPackages(pkgs);
    setCredits((creditRes.data || []) as unknown as CreditRow[]);
    setPackageSlug(
      (prev) =>
        prev ||
        pkgs.find((p) => p.slug === "lengkap")?.slug ||
        pkgs.find((p) => p.has_pembahasan)?.slug ||
        pkgs[0]?.slug ||
        "",
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = packages.find((p) => p.slug === packageSlug);
  const activeRows = credits.filter((c) => statusOf(c).active);
  const totalActive = activeRows.reduce((s, c) => s + c.total_credits, 0);
  const usedActive = activeRows.reduce((s, c) => s + c.used_credits, 0);

  async function grant() {
    if (!selected) return;
    setGranting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryout-activate-credit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            user_id: userId,
            package_slug: selected.slug,
            payment_method: method,
            payment_ref: paymentRef.trim().slice(0, 120) || null,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Gagal memberikan paket");
      toast.success(`${selected.name} (${selected.credits} kredit) diberikan ke ${userLabel}`);
      setPaymentRef("");
      setConfirmGrant(false);
      await load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memberikan paket");
    } finally {
      setGranting(false);
    }
  }

  async function saveTotal(row: CreditRow) {
    const next = Math.round(editTotal);
    if (!Number.isFinite(next) || next < row.used_credits || next > 100) {
      toast.error(`Jumlah kredit harus antara ${row.used_credits} (sudah terpakai) dan 100`);
      return;
    }
    setRowBusy(row.id);
    const { error } = await supabase
      .from("tryout_credits")
      .update({ total_credits: next })
      .eq("id", row.id);
    setRowBusy(null);
    if (error) {
      toast.error(`Gagal mengubah kredit: ${error.message}`);
      return;
    }
    toast.success("Jumlah kredit diperbarui");
    setEditingId(null);
    await load();
    onChanged();
  }

  async function revoke(row: CreditRow) {
    setRowBusy(row.id);
    const { error } = await supabase
      .from("tryout_credits")
      .update({ status: "refunded" })
      .eq("id", row.id);
    setRowBusy(null);
    setRevokeTarget(null);
    if (error) {
      toast.error(`Gagal membatalkan paket: ${error.message}`);
      return;
    }
    toast.success("Paket dibatalkan. Sisa kredit paket ini tidak bisa dipakai lagi.");
    await load();
    onChanged();
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      <div>
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-amber-500" />
          Paket Tryout SKD
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {loading
            ? "Memuat…"
            : `Kredit aktif: ${totalActive - usedActive} sisa dari ${totalActive} (terpakai ${usedActive}).`}{" "}
          Perubahan di bagian ini langsung tersimpan.
        </p>
      </div>

      {/* Berikan paket */}
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Gift className="h-4 w-4 text-primary" /> Berikan paket manual
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-pkg`} className="text-xs">
              Paket
            </Label>
            <Select value={packageSlug} onValueChange={setPackageSlug} disabled={loading}>
              <SelectTrigger id={`${fieldId}-pkg`} className="h-9">
                <SelectValue placeholder="Pilih paket" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.name} · {p.credits} kredit · {rupiah(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-method`} className="text-xs">
              Sumber pembayaran
            </Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id={`${fieldId}-method`} className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${fieldId}-ref`} className="text-xs">
              ID order / bukti transfer / catatan (disarankan)
            </Label>
            <Input
              id={`${fieldId}-ref`}
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              maxLength={120}
              placeholder="mis. ID order SumoPod atau no. referensi transfer"
              className="h-9"
            />
          </div>
        </div>
        {selected && (
          <p className="mt-2 text-xs text-muted-foreground">
            Isi paket: {selected.credits} kredit tryout
            {selected.has_pembahasan ? " + pembahasan" : ""}
            {selected.has_leaderboard ? " + leaderboard" : ""}.
          </p>
        )}
        <Button
          type="button"
          size="sm"
          className="mt-3 gap-1.5"
          disabled={!selected || granting || loading}
          onClick={() => setConfirmGrant(true)}
        >
          {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
          Berikan paket
        </Button>
      </div>

      {/* Riwayat paket */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Riwayat paket user</p>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat…
          </div>
        ) : credits.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            User ini belum punya paket tryout.
          </p>
        ) : (
          <ul className="space-y-2">
            {credits.map((c) => {
              const st = statusOf(c);
              const editing = editingId === c.id;
              const busy = rowBusy === c.id;
              return (
                <li key={c.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {c.tryout_packages?.name ?? "Paket tidak diketahui"}
                    </span>
                    <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", st.cls)}>
                      {st.label}
                    </Badge>
                    {c.tryout_packages?.has_pembahasan && (
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                        Pembahasan
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      Terpakai {c.used_credits}/{c.total_credits}
                    </span>
                    <span>{METHOD_LABEL[c.payment_method || "manual"] ?? c.payment_method}</span>
                    <span>{formatDate(c.created_at)}</span>
                    {c.payment_ref && (
                      <span className="max-w-full truncate font-mono" title={c.payment_ref}>
                        {c.payment_ref}
                      </span>
                    )}
                  </div>

                  {c.status !== "refunded" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {editing ? (
                        <>
                          <Input
                            type="number"
                            min={c.used_credits}
                            max={100}
                            value={editTotal}
                            onChange={(e) => setEditTotal(parseInt(e.target.value) || 0)}
                            className="h-8 w-20 text-center"
                            aria-label="Total kredit paket"
                          />
                          <span className="text-xs text-muted-foreground">
                            total kredit (min. {c.used_credits})
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 gap-1"
                            disabled={busy}
                            onClick={() => void saveTotal(c)}
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Simpan
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" /> Batal
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(c.id);
                              setEditTotal(c.total_credits);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Ubah kredit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={busy}
                            onClick={() => setRevokeTarget(c)}
                          >
                            <Ban className="h-3.5 w-3.5" /> Batalkan
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={confirmGrant} onOpenChange={(o) => !granting && setConfirmGrant(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Berikan {selected?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {userLabel} akan menerima {selected?.credits} kredit tryout
              {selected?.has_pembahasan ? " dengan pembahasan" : ""}. Pastikan pembayarannya sudah
              dicek, karena kredit langsung bisa dipakai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={granting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={granting}
              onClick={(e) => {
                e.preventDefault();
                void grant();
              }}
            >
              {granting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Ya, berikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(o) => !o && rowBusy === null && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan paket ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.tryout_packages?.name}: sisa{" "}
              {revokeTarget ? revokeTarget.total_credits - revokeTarget.used_credits : 0} kredit
              tidak bisa dipakai lagi. Riwayat tryout yang sudah dikerjakan tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rowBusy !== null}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              disabled={rowBusy !== null}
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                if (revokeTarget) void revoke(revokeTarget);
              }}
            >
              Ya, batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
