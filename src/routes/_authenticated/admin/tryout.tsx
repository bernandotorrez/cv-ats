/**
 * /admin/tryout — Admin panel untuk mengelola tryout (kredit user, set, soal).
 * Mendukung pembuatan set tryout baru (Set 2, 3, dst) dan generate soal AI
 * sesuai format CAT BKN (TWK/TIU/TKP) dengan komposisi per subtes.
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
  Sparkles,
  Brain,
  Check,
  ChevronsUpDown,
  User,
  Pencil,
  Power,
  Eye,
  Clock,
  Gauge,
  Layers,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin/tryout")({
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/login" as never });
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
  email?: string | null;
  role?: string | null;
};

type ExamSetRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  twk_count: number;
  tiu_count: number;
  tkp_count: number;
  passing_grade_twk: number;
  passing_grade_tiu: number;
  passing_grade_tkp: number;
  is_active: boolean;
  is_free_preview: boolean;
  sort_order: number;
};

type SubtestCounts = { twk: number; tiu: number; tkp: number };

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
  const [questionCounts, setQuestionCounts] = useState<Record<string, SubtestCounts>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [examSetDialog, setExamSetDialog] = useState<{
    open: boolean;
    editing: ExamSetRow | null;
  }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<ExamSetRow | null>(null);
  const [deletingSet, setDeletingSet] = useState(false);
  const [generateExamSetId, setGenerateExamSetId] = useState("");

  useEffect(() => {
    void loadAll();
  }, []);

  // Default pilih set pertama di tab Generate setelah data set dimuat
  useEffect(() => {
    if (examSets.length > 0 && !generateExamSetId) {
      setGenerateExamSetId(examSets[0].id);
    }
  }, [examSets, generateExamSetId]);

  async function loadAll() {
    setLoading(true);

    // Credits (with profile)
    const { data: creditsData } = await supabase
      .from("tryout_credits")
      .select(
        "id, user_id, package_id, total_credits, used_credits, remaining_credits, status, payment_method, payment_ref, created_at, profiles(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    const userIds = Array.from(new Set((creditsData || []).map((c) => c.user_id)));

    const roleMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      if (rolesData) {
        rolesData.forEach((r) => roleMap.set(r.user_id, r.role));
      }
    }

    const userEmailMap = new Map<string, { email: string; full_name: string; role: string }>();
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token) {
        const res = await fetch(`${supabaseUrl}/functions/v1/admin-users?perPage=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.users) {
          json.users.forEach(
            (u: { id: string; email: string; full_name: string; role: string }) => {
              userEmailMap.set(u.id, u);
            },
          );
        }
      }
    } catch {
      // ignore
    }

    const mergedCredits: CreditRow[] = ((creditsData as any) || []).map((c: any) => {
      const userInfo = userEmailMap.get(c.user_id);
      return {
        id: c.id,
        user_id: c.user_id,
        package_id: c.package_id,
        total_credits: c.total_credits,
        used_credits: c.used_credits,
        remaining_credits: c.remaining_credits,
        status: c.status,
        payment_method: c.payment_method,
        payment_ref: c.payment_ref,
        created_at: c.created_at,
        email: userInfo?.email || null,
        role: userInfo?.role || roleMap.get(c.user_id) || "user",
        profiles: c.profiles || (userInfo?.full_name ? { full_name: userInfo.full_name } : null),
      };
    });

    setCredits(mergedCredits);

    // Exam sets (lengkap, termasuk komposisi subtes & passing grade)
    const { data: setsData } = await supabase
      .from("tryout_exam_sets")
      .select("*")
      .order("sort_order", { ascending: true });
    setExamSets((setsData as ExamSetRow[]) || []);

    // Jumlah soal per subtes per set (untuk progres pengisian soal)
    const { data: qRows } = await supabase.from("tryout_questions").select("exam_set_id, subtest");
    const counts: Record<string, SubtestCounts> = {};
    for (const r of (qRows || []) as Array<{ exam_set_id: string; subtest: string }>) {
      if (!counts[r.exam_set_id]) counts[r.exam_set_id] = { twk: 0, tiu: 0, tkp: 0 };
      if (r.subtest === "twk" || r.subtest === "tiu" || r.subtest === "tkp") {
        counts[r.exam_set_id][r.subtest] += 1;
      }
    }
    setQuestionCounts(counts);

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
        ? Math.round(avgData.reduce((s, a) => s + a.score_total, 0) / avgData.length)
        : 0;
    const { data: creditsActive } = await supabase
      .from("tryout_credits")
      .select("remaining_credits")
      .eq("status", "active");
    const totalActiveCredits = creditsActive?.reduce((s, c) => s + c.remaining_credits, 0) || 0;

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
      c.email?.toLowerCase().includes(q) ||
      c.payment_ref?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.user_id.toLowerCase().includes(q)
    );
  });

  async function toggleActive(es: ExamSetRow) {
    const { error } = await supabase
      .from("tryout_exam_sets")
      .update({ is_active: !es.is_active })
      .eq("id", es.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Set "${es.name}" ${es.is_active ? "dinonaktifkan" : "diaktifkan"}.`);
      void loadAll();
    }
  }

  async function handleDeleteSet() {
    if (!deleteTarget) return;
    setDeletingSet(true);
    const { error } = await supabase.from("tryout_exam_sets").delete().eq("id", deleteTarget.id);
    setDeletingSet(false);
    if (error) {
      // FK constraint: set sudah punya riwayat attempt
      toast.error(
        `Set "${deleteTarget.name}" sudah memiliki riwayat ujian sehingga tidak bisa dihapus. Nonaktifkan saja agar tidak terlihat oleh user.`,
      );
      setDeleteTarget(null);
      return;
    }
    toast.success(`Set "${deleteTarget.name}" beserta semua soalnya dihapus.`);
    setDeleteTarget(null);
    void loadAll();
  }

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
          <StatCard
            icon={Trophy}
            label="Rata-rata Skor"
            value={`${stats.avg_score} / 550`}
            tone="sky"
          />
          <StatCard
            icon={Coins}
            label="Kredit Aktif"
            value={stats.total_credits_active}
            tone="violet"
          />
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
          <TabsTrigger value="generate">
            <Sparkles className="mr-1.5 h-4 w-4" /> Generate AI
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
                          <div className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                            <span>{c.profiles?.full_name || "(tanpa nama)"}</span>
                            {c.role === "admin" && (
                              <Badge
                                variant="outline"
                                className="gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
                              >
                                <Shield className="h-3 w-3" /> Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {c.email ? c.email : `${c.user_id.slice(0, 8)}...`}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Buat set tryout baru (Set 2, Set 3, dst.), lalu generate soalnya lewat tab{" "}
              <b>Generate AI</b>. Setiap set punya paket soal sendiri.
            </p>
            <Button
              onClick={() => setExamSetDialog({ open: true, editing: null })}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Tambah Set Baru
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : examSets.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
              Belum ada exam set. Klik <b>Tambah Set Baru</b> untuk membuat set pertama.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {examSets.map((es) => (
                <ExamSetCard
                  key={es.id}
                  es={es}
                  counts={questionCounts[es.id] || { twk: 0, tiu: 0, tkp: 0 }}
                  onEdit={() => setExamSetDialog({ open: true, editing: es })}
                  onToggleActive={() => void toggleActive(es)}
                  onDelete={() => setDeleteTarget(es)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <GenerateSoalPanel
            examSets={examSets}
            questionCounts={questionCounts}
            selectedSetId={generateExamSetId}
            onSelectSet={setGenerateExamSetId}
            onGenerated={() => void loadAll()}
          />
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

      <ExamSetDialog
        open={examSetDialog.open}
        editing={examSetDialog.editing}
        onOpenChange={(v) => setExamSetDialog((s) => ({ ...s, open: v }))}
        onSuccess={(newId) => {
          setExamSetDialog({ open: false, editing: null });
          if (newId) setGenerateExamSetId(newId);
          void loadAll();
        }}
      />

      <DeleteExamSetDialog
        target={deleteTarget}
        deleting={deletingSet}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteSet()}
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

/* ────────────────────────────────────────────────────────────────────────────
 * Exam Set Card
 * ──────────────────────────────────────────────────────────────────────────── */

function ExamSetCard({
  es,
  counts,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  es: ExamSetRow;
  counts: SubtestCounts;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition",
        !es.is_active && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              es.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-display font-bold">{es.name}</h3>
              {es.is_free_preview && (
                <Badge
                  variant="outline"
                  className="gap-1 border-sky-400/40 bg-sky-500/10 px-1.5 py-0 text-[10px] text-sky-600 dark:text-sky-400"
                >
                  <Eye className="h-3 w-3" /> Preview Gratis
                </Badge>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              <span className="font-mono">/{es.slug}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit set" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={es.is_active ? "Nonaktifkan" : "Aktifkan"}
            onClick={onToggleActive}
          >
            <Power
              className={cn(
                "h-4 w-4",
                es.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            title="Hapus set"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
        {es.description || "Belum ada deskripsi."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ListChecks className="h-3.5 w-3.5" /> {es.total_questions} soal
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {es.duration_minutes} menit
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" /> PG {es.passing_grade_twk}/{es.passing_grade_tiu}/
          {es.passing_grade_tkp}
        </span>
      </div>

      {/* Progress pengisian soal per subtes */}
      <div className="mt-4 space-y-2 rounded-xl border bg-muted/20 p-3">
        <SubtestProgress
          label="TWK"
          current={counts.twk}
          target={es.twk_count}
          color="bg-amber-500"
        />
        <SubtestProgress
          label="TIU"
          current={counts.tiu}
          target={es.tiu_count}
          color="bg-sky-500"
        />
        <SubtestProgress
          label="TKP"
          current={counts.tkp}
          target={es.tkp_count}
          color="bg-emerald-500"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Badge
          variant={es.is_active ? "default" : "outline"}
          className={es.is_active ? "bg-emerald-500" : ""}
        >
          {es.is_active ? "Aktif" : "Nonaktif"}
        </Badge>
        <span className="text-[10px] text-muted-foreground">Urutan: {es.sort_order}</span>
      </div>
    </div>
  );
}

function SubtestProgress({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = target > 0 && current >= target;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-foreground">{label}</span>
        <span
          className={cn(
            "font-medium",
            done ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {current}/{target} {done && "✓"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Exam Set Dialog (buat / edit set)
 * ──────────────────────────────────────────────────────────────────────────── */

function ExamSetDialog({
  open,
  editing,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  editing: ExamSetRow | null;
  onOpenChange: (v: boolean) => void;
  onSuccess: (newId?: string) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(100);
  const [twkCount, setTwkCount] = useState(30);
  const [tiuCount, setTiuCount] = useState(35);
  const [tkpCount, setTkpCount] = useState(45);
  const [pgTwk, setPgTwk] = useState(65);
  const [pgTiu, setPgTiu] = useState(80);
  const [pgTkp, setPgTkp] = useState(166);
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setSlug(editing.slug);
      setSlugTouched(true);
      setDescription(editing.description || "");
      setDuration(editing.duration_minutes);
      setTwkCount(editing.twk_count);
      setTiuCount(editing.tiu_count);
      setTkpCount(editing.tkp_count);
      setPgTwk(editing.passing_grade_twk);
      setPgTiu(editing.passing_grade_tiu);
      setPgTkp(editing.passing_grade_tkp);
      setSortOrder(editing.sort_order);
      setIsActive(editing.is_active);
      setIsFreePreview(editing.is_free_preview);
    } else {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setDuration(100);
      setTwkCount(30);
      setTiuCount(35);
      setTkpCount(45);
      setPgTwk(65);
      setPgTiu(80);
      setPgTkp(166);
      setSortOrder(1);
      setIsActive(true);
      setIsFreePreview(false);
    }
  }, [open, editing]);

  const total = twkCount + tiuCount + tkpCount;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  }

  async function handleSave() {
    const finalName = name.trim();
    if (!finalName) {
      toast.error("Nama set wajib diisi");
      return;
    }
    const finalSlug =
      slug.trim() ||
      finalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    setSubmitting(true);
    const payload = {
      slug: finalSlug,
      name: finalName,
      description: description.trim() || null,
      total_questions: total,
      duration_minutes: Math.max(1, duration || 100),
      twk_count: Math.max(0, twkCount),
      tiu_count: Math.max(0, tiuCount),
      tkp_count: Math.max(0, tkpCount),
      passing_grade_twk: pgTwk,
      passing_grade_tiu: pgTiu,
      passing_grade_tkp: pgTkp,
      is_active: isActive,
      is_free_preview: isFreePreview,
      sort_order: sortOrder,
    };

    if (editing) {
      const { error } = await supabase
        .from("tryout_exam_sets")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      toast.success(`Set "${finalName}" berhasil diperbarui.`);
      setSubmitting(false);
      onSuccess();
    } else {
      const { data, error } = await supabase
        .from("tryout_exam_sets")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      toast.success(
        `Set "${finalName}" berhasil dibuat! Sekarang generate soalnya di tab Generate AI.`,
      );
      setSubmitting(false);
      onSuccess(data?.id);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit Set — ${editing.name}` : "Tambah Set Tryout Baru"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Perbarui konfigurasi set. Perubahan langsung berlaku."
              : "Buat set baru (misal Set 2) dengan komposisi soal sesuai format CAT BKN. Jumlah soal bisa diubah sesuai kebutuhan."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="set-name">Nama Set</Label>
            <Input
              id="set-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Tryout SKD Set 2"
            />
          </div>

          <div>
            <Label htmlFor="set-slug">Slug (URL)</Label>
            <Input
              id="set-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                );
              }}
              placeholder="tryout-skd-set-2"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Otomatis dibuat dari nama. Harus unik.
            </p>
          </div>

          <div>
            <Label htmlFor="set-desc">Deskripsi</Label>
            <Textarea
              id="set-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat yang ditampilkan ke user."
              rows={2}
            />
          </div>

          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Komposisi Soal (Format CAT BKN)
              </span>
              <Badge variant="outline" className="text-[10px]">
                Total: {total} soal
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="TWK"
                value={twkCount}
                onChange={setTwkCount}
                accent="text-amber-600 dark:text-amber-400"
              />
              <NumberField
                label="TIU"
                value={tiuCount}
                onChange={setTiuCount}
                accent="text-sky-600 dark:text-sky-400"
              />
              <NumberField
                label="TKP"
                value={tkpCount}
                onChange={setTkpCount}
                accent="text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Durasi (menit)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Urutan (sort)</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="PG TWK"
              value={pgTwk}
              onChange={setPgTwk}
              accent="text-amber-600 dark:text-amber-400"
            />
            <NumberField
              label="PG TIU"
              value={pgTiu}
              onChange={setPgTiu}
              accent="text-sky-600 dark:text-sky-400"
            />
            <NumberField
              label="PG TKP"
              value={pgTkp}
              onChange={setPgTkp}
              accent="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div className="space-y-2 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Set Aktif</div>
                <div className="text-[11px] text-muted-foreground">
                  Terlihat dan bisa dikerjakan user.
                </div>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Preview Gratis</div>
                <div className="text-[11px] text-muted-foreground">
                  Ditandai sebagai set gratis (opsional).
                </div>
              </div>
              <Switch checked={isFreePreview} onCheckedChange={setIsFreePreview} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={() => void handleSave()} disabled={submitting} className="gap-1.5">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editing ? "Simpan Perubahan" : "Buat Set"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent?: string;
}) {
  return (
    <div>
      <Label className={cn("text-[11px]", accent)}>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Delete Exam Set Dialog
 * ──────────────────────────────────────────────────────────────────────────── */

function DeleteExamSetDialog({
  target,
  deleting,
  onClose,
  onConfirm,
}: {
  target: ExamSetRow | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Hapus set ini?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                Set <b className="text-foreground">{target?.name}</b> beserta{" "}
                <b className="text-foreground">semua soalnya</b> akan dihapus permanen.
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                ⚠️ Jika set sudah punya riwayat ujian user, set tidak bisa dihapus — cukup
                nonaktifkan saja.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Hapus Set
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Generate Soal Panel
 * ──────────────────────────────────────────────────────────────────────────── */

type SubtestKey = "twk" | "tiu" | "tkp";
type Difficulty = "easy" | "medium" | "hard";

function GenerateSoalPanel({
  examSets,
  questionCounts,
  selectedSetId,
  onSelectSet,
  onGenerated,
}: {
  examSets: ExamSetRow[];
  questionCounts: Record<string, SubtestCounts>;
  selectedSetId: string;
  onSelectSet: (id: string) => void;
  onGenerated?: () => void;
}) {
  const [subtest, setSubtest] = useState<SubtestKey>("twk");
  const [count, setCount] = useState(10);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [fullDifficulty, setFullDifficulty] = useState<Difficulty>("medium");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    generated: number;
    questions: Array<{ id: string; question_number: number; question_text: string }>;
  } | null>(null);
  const [fullProgress, setFullProgress] = useState<{
    done: number;
    total: number;
    label: string;
    generated: number;
  } | null>(null);
  const [fullResult, setFullResult] = useState<{
    generated: number;
    perSubtest: Record<SubtestKey, number>;
  } | null>(null);

  const selectedSet = examSets.find((s) => s.id === selectedSetId) || null;
  const currentCounts = questionCounts[selectedSetId] || { twk: 0, tiu: 0, tkp: 0 };
  const isSetComplete =
    !!selectedSet &&
    (["twk", "tiu", "tkp"] as const).every((st) => {
      const target = selectedSet[`${st}_count`] ?? 0;
      return target <= 0 || currentCounts[st] >= target;
    });
  const totalExisting = currentCounts.twk + currentCounts.tiu + currentCounts.tkp;
  const hasExistingQuestions = totalExisting > 0;

  async function callGenerate(opts: {
    subtest: SubtestKey;
    count: number;
    difficulty: Difficulty;
    category?: string;
  }) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`${supabaseUrl}/functions/v1/tryout-generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        exam_set_id: selectedSetId,
        subtest: opts.subtest,
        count: opts.count,
        difficulty: opts.difficulty,
        category: opts.category || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal generate soal");
    return data;
  }

  async function handleGenerate() {
    if (!selectedSetId) {
      toast.error("Pilih exam set");
      return;
    }
    setGenerating(true);
    setResult(null);
    setFullResult(null);
    try {
      const data = await callGenerate({
        subtest,
        count,
        difficulty,
        category: category || undefined,
      });
      setResult(data);
      toast.success(`${data.generated} soal ${subtest.toUpperCase()} berhasil di-generate!`);
      onGenerated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal generate soal");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateFullSet() {
    if (!selectedSetId) {
      toast.error("Pilih exam set");
      return;
    }
    if (!selectedSet) return;

    const targets: Array<{ subtest: SubtestKey; count: number }> = [
      { subtest: "twk", count: Math.max(0, selectedSet.twk_count) },
      { subtest: "tiu", count: Math.max(0, selectedSet.tiu_count) },
      { subtest: "tkp", count: Math.max(0, selectedSet.tkp_count) },
    ];

    // Pecah jadi batch kecil (max 15 soal/call) supaya tidak kelewatan token AI
    const batches: Array<{ subtest: SubtestKey; count: number }> = [];
    for (const t of targets) {
      let remaining = t.count;
      while (remaining > 0) {
        batches.push({ subtest: t.subtest, count: Math.min(15, remaining) });
        remaining -= 15;
      }
    }

    if (batches.length === 0) {
      toast.error("Komposisi soal set masih kosong. Edit set untuk mengatur jumlah soal.");
      return;
    }

    // Guard: jangan double-generate ke set yang sudah lengkap (misal Set 1 yang sudah 110 soal)
    if (isSetComplete) {
      toast.error(
        `Set "${selectedSet.name}" sudah lengkap (${selectedSet.twk_count} TWK + ${selectedSet.tiu_count} TIU + ${selectedSet.tkp_count} TKP). Buat set baru di tab Exam Set untuk paket soal baru.`,
      );
      return;
    }

    // Set sudah punya sebagian soal → konfirmasi sebelum menambah
    if (hasExistingQuestions) {
      const ok = window.confirm(
        `Set "${selectedSet.name}" sudah memiliki ${totalExisting} soal. Generate ini akan MENAMBAH ${fullTarget} soal lagi (total jadi ${totalExisting + fullTarget}). Lanjutkan?`,
      );
      if (!ok) return;
    }

    setGenerating(true);
    setResult(null);
    setFullResult(null);
    const perSubtest: Record<SubtestKey, number> = { twk: 0, tiu: 0, tkp: 0 };
    let generated = 0;
    const failedBatches: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      setFullProgress({
        done: i,
        total: batches.length,
        label: `Membuat ${b.subtest.toUpperCase()} — ${b.count} soal (batch ${i + 1}/${batches.length})`,
        generated,
      });
      try {
        const data = await callGenerate({
          subtest: b.subtest,
          count: b.count,
          difficulty: fullDifficulty,
        });
        const n = Number(data?.generated) || 0;
        generated += n;
        perSubtest[b.subtest] += n;
      } catch (error) {
        failedBatches.push(`${b.subtest.toUpperCase()} ${b.count} soal`);
        toast.error(
          `Batch gagal: ${b.subtest.toUpperCase()} ${b.count} soal — ${
            error instanceof Error ? error.message : "error tidak diketahui"
          }`,
        );
        // Lanjut ke batch berikutnya, jangan berhenti di tengah
      }
    }

    setFullProgress(null);
    setFullResult({ generated, perSubtest });
    setGenerating(false);

    if (generated > 0) {
      toast.success(
        failedBatches.length > 0
          ? `${generated} soal berhasil, ${failedBatches.length} batch gagal: ${failedBatches.join(", ")}`
          : `${generated} soal berhasil di-generate untuk ${selectedSet.name}!`,
      );
      onGenerated?.();
    } else if (failedBatches.length > 0) {
      toast.error("Tidak ada soal yang berhasil di-generate.");
    }
  }

  const fullTarget = selectedSet
    ? selectedSet.twk_count + selectedSet.tiu_count + selectedSet.tkp_count
    : 110;

  const subtestCategories: Record<string, string[]> = {
    twk: ["Pancasila", "UUD 1945", "NKRI", "Bhinneka Tunggal Ika", "Peristiwa Bersejarah"],
    tiu: ["Verbal", "Numerik", "Figural", "Logis"],
    tkp: ["Pelayanan Publik", "Jejaring Kerja", "Profesionalisme", "Integritas"],
  };

  return (
    <div className="space-y-4">
      {/* ═══════════ Generate Set Lengkap (Format CAT BKN) ═══════════ */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Generate Set Lengkap — Format CAT BKN</h3>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Buat seluruh paket soal set sekaligus: TWK, TIU, dan TKP sesuai komposisi di bawah. Soal
          otomatis diusahakan <b>berbeda dari set lain</b> dan disimpan langsung ke set ini.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Exam Set</Label>
            <select
              value={selectedSetId}
              onChange={(e) => onSelectSet(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {examSets.length === 0 && <option value="">Belum ada exam set</option>}
              {examSets.map((es) => (
                <option key={es.id} value={es.id}>
                  {es.name} ({es.total_questions} soal)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tingkat Kesulitan</Label>
            <select
              value={fullDifficulty}
              onChange={(e) => setFullDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="easy">Mudah</option>
              <option value="medium">Sedang (standar ujian)</option>
              <option value="hard">Sulit</option>
            </select>
          </div>
        </div>

        {selectedSet && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-muted/30 px-3 py-2.5 text-xs">
            <span className="font-semibold text-foreground">Akan di-generate:</span>
            <span className="text-amber-700 dark:text-amber-400">TWK {selectedSet.twk_count}</span>
            <span className="text-sky-700 dark:text-sky-400">TIU {selectedSet.tiu_count}</span>
            <span className="text-emerald-700 dark:text-emerald-400">
              TKP {selectedSet.tkp_count}
            </span>
            <span className="ml-auto font-display text-sm font-bold text-primary">
              {fullTarget} soal total
            </span>
          </div>
        )}

        {selectedSet && isSetComplete && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            ⚠️ Set ini sudah lengkap (TWK {currentCounts.twk}/{selectedSet.twk_count} · TIU{" "}
            {currentCounts.tiu}/{selectedSet.tiu_count} · TKP {currentCounts.tkp}/
            {selectedSet.tkp_count}). Buat set baru di tab <b>Exam Set</b> untuk paket soal baru.
          </div>
        )}
        {selectedSet && hasExistingQuestions && !isSetComplete && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            Set ini sudah memiliki {totalExisting} soal. Generate akan <b>menambah</b> soal lagi
            (penomoran melanjutkan).
          </div>
        )}

        <Button
          onClick={() => void handleGenerateFullSet()}
          disabled={generating || !selectedSet || isSetComplete}
          className="mt-4 w-full gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-md transition hover:from-primary/90 hover:to-primary"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating
            ? "Menggenerate set lengkap..."
            : `Generate ${fullTarget} Soal Lengkap (TWK + TIU + TKP)`}
        </Button>

        {fullProgress && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">{fullProgress.label}</span>
              <span className="font-bold text-foreground">{fullProgress.generated} soal jadi</span>
            </div>
            <Progress value={(fullProgress.done / fullProgress.total) * 100} />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              Batch {fullProgress.done}/{fullProgress.total}
            </p>
          </div>
        )}

        {fullResult && fullResult.generated > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <h4 className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
              <Check className="h-4 w-4" /> Set lengkap berhasil di-generate!
            </h4>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge className="bg-amber-500/90 text-white">TWK +{fullResult.perSubtest.twk}</Badge>
              <Badge className="bg-sky-500/90 text-white">TIU +{fullResult.perSubtest.tiu}</Badge>
              <Badge className="bg-emerald-500/90 text-white">
                TKP +{fullResult.perSubtest.tkp}
              </Badge>
              <Badge className="bg-primary text-primary-foreground">
                Total +{fullResult.generated}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ Generate Per Subtes (tambahan manual) ═══════════ */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Generate Per Subtes (Tambahan)</h3>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Tambahkan soal tambahan ke subtes tertentu, misalnya menambah TWK ke set yang sudah berisi
          soal. Untuk set baru, gunakan tombol <b>Generate Set Lengkap</b> di atas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Exam Set</Label>
            <select
              value={selectedSetId}
              onChange={(e) => onSelectSet(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {examSets.length === 0 && <option value="">Belum ada exam set</option>}
              {examSets.map((es) => (
                <option key={es.id} value={es.id}>
                  {es.name} ({es.total_questions} soal)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Subtes</Label>
            <select
              value={subtest}
              onChange={(e) => {
                setSubtest(e.target.value as SubtestKey);
                setCategory("");
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="twk">TWK - Tes Wawasan Kebangsaan</option>
              <option value="tiu">TIU - Tes Intelegensi Umum</option>
              <option value="tkp">TKP - Tes Karakteristik Pribadi</option>
            </select>
          </div>
          <div>
            <Label>Jumlah Soal</Label>
            <Input
              type="number"
              min={1}
              max={45}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Tingkat Kesulitan</Label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="easy">Mudah</option>
              <option value="medium">Sedang</option>
              <option value="hard">Sulit</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Kategori (opsional)</Label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {subtestCategories[subtest]?.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat === category ? "" : cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Atau ketik kategori sendiri..."
            />
          </div>
        </div>

        <Button
          onClick={() => void handleGenerate()}
          disabled={generating}
          className="mt-5 w-full gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? "Menggenerate..." : `Generate ${count} Soal ${subtest.toUpperCase()}`}
        </Button>

        {result && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400">✓ Berhasil!</h4>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
              {result.generated} soal berhasil di-generate dan disimpan ke database.
            </p>
            {result.questions && (
              <div className="mt-3 space-y-1">
                {result.questions.slice(0, 3).map((q) => (
                  <p key={q.id} className="line-clamp-1 text-xs text-muted-foreground">
                    {q.question_number}. {q.question_text}
                  </p>
                ))}
                {result.questions.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    ...dan {result.questions.length - 3} soal lainnya
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Activate Credit Dialog (tidak berubah)
 * ──────────────────────────────────────────────────────────────────────────── */

type UserOption = { id: string; email: string; full_name: string; role?: string };

function ActivateCreditDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [packageSlug, setPackageSlug] = useState("satuan");
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "lynk" | "transfer">("manual");
  const [paymentRef, setPaymentRef] = useState("");
  const [credits, setCredits] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState<Array<{ slug: string; name: string; credits: number }>>(
    [],
  );
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  useEffect(() => {
    if (open) {
      void supabase
        .from("tryout_packages")
        .select("slug, name, credits")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .then(({ data }) => setPackages(data || []));

      // Fetch users for dropdown
      setLoadingUsers(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      supabase.auth.getSession().then(({ data: sessionData }) => {
        const token = sessionData.session?.access_token;
        fetch(`${supabaseUrl}/functions/v1/admin-users?perPage=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.users) setUsers(data.users);
          })
          .catch(() => {})
          .finally(() => setLoadingUsers(false));
      });
    }
  }, [open]);

  useEffect(() => {
    const pkg = packages.find((p) => p.slug === packageSlug);
    if (pkg) setCredits(pkg.credits);
  }, [packageSlug, packages]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  async function handleActivate() {
    if (!selectedUserId) {
      toast.error("Pilih user terlebih dahulu");
      return;
    }
    if (!selectedUser?.email) {
      toast.error("Email user tidak ditemukan");
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
          user_email: selectedUser.email,
          package_slug: packageSlug,
          credits,
          payment_method: paymentMethod,
          payment_ref: paymentRef.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal aktivasi");

      toast.success(`Kredit berhasil diaktivasi untuk ${selectedUser.email}`);
      setSelectedUserId("");
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
            <Label htmlFor="email">User</Label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar user...
              </div>
            ) : (
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="email"
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedUser ? (
                      <span className="flex items-center gap-2 overflow-hidden text-ellipsis">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedUser.full_name || "(tanpa nama)"}
                        </span>
                        {selectedUser.role === "admin" && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 shrink-0 dark:text-amber-400"
                          >
                            <Shield className="h-2.5 w-2.5" /> Admin
                          </Badge>
                        )}
                        <span className="text-muted-foreground truncate">{selectedUser.email}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Cari dan pilih user...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 z-[60]"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Cari nama, email, atau admin..." />
                    <CommandList
                      className="max-h-60 overflow-y-auto overscroll-contain"
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty>Tidak ada user ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {users.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={`${u.full_name || ""} ${u.email || ""} ${u.role === "admin" ? "admin" : ""} ${u.id}`}
                            onSelect={() => {
                              setSelectedUserId(u.id);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={
                                "mr-2 h-4 w-4 " +
                                (u.id === selectedUserId ? "opacity-100" : "opacity-0")
                              }
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{u.full_name || "(tanpa nama)"}</span>
                                {u.role === "admin" && (
                                  <Badge
                                    variant="outline"
                                    className="gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
                                  >
                                    <Shield className="h-2.5 w-2.5" /> Admin
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
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
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Aktivasi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
