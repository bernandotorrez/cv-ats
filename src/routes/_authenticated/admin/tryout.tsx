/**
 * /admin/tryout — Admin panel untuk mengelola tryout (kredit user, set, soal).
 */
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Coins,
  FileCheck,
  Search,
  Shield,
  Trophy,
  Loader2,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton-loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin/tryout")({
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/login" as never });
    }
    const { data } = await supabase
      .rpc("has_role", { _user_id: sessionData.session.user.id, _role: "admin" });
    if (!data) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () =>
    buildSeo({
      title: "Admin Tryout - CV Pintar",
      description: "Kelola tryout, soal, dan kredit user.",
      path: "/admin/tryout",
      noindex: true,
    }),
  component: AdminTryoutPage,
});

type CreditRow = {
  id: string;
  user_id: string;
  package_id: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  status: string;
  payment_method: string | null;
  payment_ref: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
  auth?: { email: string | null } | null;
};

type ExamSetRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
};

type Stats = {
  total_attempts: number;
  total_completed: number;
  avg_score: number;
  total_credits_active: number;
};

function AdminTryoutPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("credits");
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [examSets, setExamSets] = useState<ExamSetRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);

    // Credits (with profile)
    const { data: creditsData } = await supabase
      .from("tryout_credits")
      .select(
        "id, user_id, package_id, total_credits, used_credits, remaining_credits, status, payment_method, payment_ref, created_at, profiles(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    setCredits((creditsData as unknown as CreditRow[]) || []);

    // Exam sets
    const { data: setsData } = await supabase
      .from("tryout_exam_sets")
      .select("*")
      .order("sort_order", { ascending: true });
    setExamSets((setsData as ExamSetRow[]) || []);

    // Stats
    const { count: totalAttempts } = await supabase
      .from("tryout_attempts")
      .select("*", { count: "exact", head: true });
    const { count: totalCompleted } = await supabase
      .from("tryout_attempts")
      .select("*", { count: "exact", head: true })
      .in("status", ["completed", "timed_out"]);
    const { data: avgData } = await supabase
      .from("tryout_attempts")
      .select("score_total")
      .in("status", ["completed", "timed_out"]);
    const avg =
      avgData && avgData.length > 0
        ? Math.round(
            avgData.reduce((s, a) => s + a.score_total, 0) / avgData.length,
          )
        : 0;
    const { data: creditsActive } = await supabase
      .from("tryout_credits")
      .select("remaining_credits")
      .eq("status", "active");
    const totalActiveCredits =
      creditsActive?.reduce((s, c) => s + c.remaining_credits, 0) || 0;

    setStats({
      total_attempts: totalAttempts ?? 0,
      total_completed: totalCompleted ?? 0,
      avg_score: avg,
      total_credits_active: totalActiveCredits,
    });

    setLoading(false);
  }

  const filteredCredits = credits.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.profiles?.full_name?.toLowerCase().includes(q) ||
      c.payment_ref?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Trophy className="h-5 w-5 text-primary" /> Kelola Tryout
        </h1>
        <p className="text-sm text-muted-foreground">
          Aktivasi kredit user, kelola exam set, dan monitor statistik.
        </p>
      </div>

      {/* Stats */}
      {loading || !stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Trophy} label="Total Attempt" value={stats.total_attempts} tone="amber" />
          <StatCard icon={FileCheck} label="Selesai" value={stats.total_completed} tone="emerald" />
          <StatCard icon={Trophy} label="Rata-rata Skor" value={`${stats.avg_score} / 550`} tone="sky" />
          <StatCard icon={Coins} label="Kredit Aktif" value={stats.total_credits_active} tone="violet" />
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="credits">
            <Coins className="mr-1.5 h-4 w-4" /> Kredit User
          </TabsTrigger>
          <TabsTrigger value="sets">
            <FileCheck className="mr-1.5 h-4 w-4" /> Exam Set
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credits" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / payment ref..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => setActivateDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Aktivasi Kredit
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : (
            <div className="rounded-2xl border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Payment</th>
                    <th className="px-4 py-3 text-right">Total / Sisa</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCredits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        Belum ada data kredit.
                      </td>
                    </tr>
                  ) : (
                    filteredCredits.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {c.profiles?.full_name || "(tanpa nama)"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {c.user_id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">
                            {c.payment_method || "manual"}
                          </Badge>
                          {c.payment_ref && (
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {c.payment_ref}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {c.used_credits}/{c.total_credits}
                          <div className="text-[11px] font-normal text-muted-foreground">
                            sisa {c.remaining_credits}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              c.status === "active"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            }
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sets" className="space-y-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {examSets.map((es) => (
                <div key={es.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <Badge
                      variant={es.is_active ? "default" : "outline"}
                      className={es.is_active ? "bg-emerald-500" : ""}
                    >
                      {es.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display font-bold">{es.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {es.total_questions} soal · {es.duration_minutes} menit
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {es.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ActivateCreditDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        onSuccess={() => {
          setActivateDialogOpen(false);
          void loadAll();
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Coins;
  label: string;
  value: string | number;
  tone: "amber" | "emerald" | "sky" | "violet";
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  }[tone];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className={`inline-grid h-10 w-10 place-items-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ActivateCreditDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [packageSlug, setPackageSlug] = useState("satuan");
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "lynk" | "transfer">("manual");
  const [paymentRef, setPaymentRef] = useState("");
  const [credits, setCredits] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState<Array<{ slug: string; name: string; credits: number }>>([]);

  useEffect(() => {
    if (open) {
      void supabase
        .from("tryout_packages")
        .select("slug, name, credits")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .then(({ data }) => setPackages(data || []));
    }
  }, [open]);

  useEffect(() => {
    const pkg = packages.find((p) => p.slug === packageSlug);
    if (pkg) setCredits(pkg.credits);
  }, [packageSlug, packages]);

  async function handleActivate() {
    if (!email.trim()) {
      toast.error("Email wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${supabaseUrl}/functions/v1/tryout-activate-credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_email: email.trim(),
          package_slug: packageSlug,
          credits,
          payment_method: paymentMethod,
          payment_ref: paymentRef.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal aktivasi");

      toast.success(`Kredit berhasil diaktivasi untuk ${email}`);
      setEmail("");
      setPaymentRef("");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal aktivasi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aktivasi Kredit User</DialogTitle>
          <DialogDescription>
            Aktivasi kredit tryout untuk user setelah pembayaran diterima.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="email">Email User</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <Label htmlFor="package">Paket</Label>
            <select
              id="package"
              value={packageSlug}
              onChange={(e) => setPackageSlug(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {packages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({p.credits}x kredit)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="credits">Jumlah Kredit</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                value={credits}
                onChange={(e) => setCredits(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div>
              <Label htmlFor="pm">Metode Bayar</Label>
              <select
                id="pm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="manual">Manual (WA)</option>
                <option value="transfer">Transfer Bank</option>
                <option value="lynk">Lynk</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="ref">Payment Ref / Catatan</Label>
            <Textarea
              id="ref"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Catatan / referensi transfer"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleActivate} disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Aktivasi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}