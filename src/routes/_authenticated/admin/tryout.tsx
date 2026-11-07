/**
 * /admin/tryout — Admin panel untuk mengelola tryout (kredit user, set, soal).
 * Mendukung pembuatan set tryout baru (Set 2, 3, dst) dan generate soal AI
 * sesuai format CAT BKN (TWK/TIU/TKP) dengan komposisi per subtes.
 *
 * Statistik & jumlah soal per set dihitung di database lewat RPC
 * `admin_tryout_overview()` — bukan agregasi di browser — karena PostgREST
 * membatasi respons 1.000 baris sehingga angka akan salah begitu data tumbuh.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Brain,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  CircleSlash,
  Clock,
  Coins,
  Eye,
  FileCheck,
  Flag,
  Gauge,
  Layers,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { QuestionQualityPanel } from "@/components/admin/tryout/QuestionQualityPanel";
import { EmptyState, TryoutPageHeader } from "@/components/tryout/TryoutLayout";
import { CompositionBar } from "@/components/tryout/DashboardWidgets";

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

/* ────────────────────────────────────────────────────────────────────────────
 * Tipe & helper data
 * ──────────────────────────────────────────────────────────────────────────── */

/** Jumlah baris kredit terbaru yang dimuat di tab Kredit User. */
const CREDITS_LIMIT = 100;

type CreditRow = {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string | null;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  status: string;
  payment_method: string | null;
  payment_ref: string | null;
  expired_at: string | null;
  created_at: string;
  full_name: string | null;
  email: string | null;
  role: string;
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
type QuestionCounts = SubtestCounts & { with_detail: number };

type OverviewStats = {
  total_attempts: number;
  total_completed: number;
  in_progress: number;
  attempts_7d: number;
  avg_score: number;
  pass_rate: number;
  participants: number;
  total_credits_active: number;
  users_with_credits: number;
};

type Overview = {
  stats: OverviewStats;
  questionCounts: Record<string, QuestionCounts>;
  openReports: number;
};

type AdminUser = { id: string; email: string; full_name: string; role?: string };

const OVERVIEW_STAT_KEYS: ReadonlyArray<keyof OverviewStats> = [
  "total_attempts",
  "total_completed",
  "in_progress",
  "attempts_7d",
  "avg_score",
  "pass_rate",
  "participants",
  "total_credits_active",
  "users_with_credits",
];

const EMPTY_COUNTS: QuestionCounts = { twk: 0, tiu: 0, tkp: 0, with_detail: 0 };
const EMPTY_COUNTS_MAP: Record<string, QuestionCounts> = {};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Validasi ringan hasil RPC (jsonb) agar UI tidak pecah bila bentuknya berubah. */
function parseOverview(data: unknown): Overview {
  const root = isRecord(data) ? data : {};
  const rawStats = isRecord(root.stats) ? root.stats : {};
  const stats = {} as OverviewStats;
  for (const key of OVERVIEW_STAT_KEYS) stats[key] = toNum(rawStats[key]);

  const questionCounts: Record<string, QuestionCounts> = {};
  if (isRecord(root.question_counts)) {
    for (const [setId, raw] of Object.entries(root.question_counts)) {
      const c = isRecord(raw) ? raw : {};
      questionCounts[setId] = {
        twk: toNum(c.twk),
        tiu: toNum(c.tiu),
        tkp: toNum(c.tkp),
        with_detail: toNum(c.with_detail),
      };
    }
  }
  return { stats, questionCounts, openReports: toNum(root.open_reports) };
}

type OverviewRpcClient = {
  rpc: (
    fn: "admin_tryout_overview",
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

/** RPC belum ada di types.ts hasil generate → cast sempit khusus fungsi ini. */
function fetchOverview() {
  return (supabase as unknown as OverviewRpcClient).rpc("admin_tryout_overview");
}

/** Email, nama, & role user dari edge function admin-users (auth.users tidak bisa di-join). */
async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return [];
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-users?perPage=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as { users?: unknown };
    return Array.isArray(json.users) ? (json.users as AdminUser[]) : [];
  } catch {
    return [];
  }
}

const fmtNum = (n: number) => n.toLocaleString("id-ID");

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── Status kredit ───────────────────────────────────────────────────────── */

type CreditStatusKey = "active" | "depleted" | "expired" | "refunded";
type CreditFilter = "all" | CreditStatusKey;

const CREDIT_STATUS_META: Record<
  CreditStatusKey,
  { label: string; icon: typeof Coins; cls: string }
> = {
  active: {
    label: "Aktif",
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  depleted: {
    label: "Habis",
    icon: CircleSlash,
    cls: "bg-muted text-muted-foreground",
  },
  expired: {
    label: "Expired",
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  refunded: {
    label: "Refunded",
    icon: Undo2,
    cls: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  },
};

const CREDIT_FILTERS: Array<{ value: CreditFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "depleted", label: "Habis" },
  { value: "expired", label: "Expired" },
  { value: "refunded", label: "Refunded" },
];

/** Status turunan: refunded > expired (status / tanggal lewat) > habis (sisa 0) > aktif. */
function creditStatusOf(c: CreditRow): CreditStatusKey {
  if (c.status === "refunded") return "refunded";
  if (c.status === "expired" || (c.expired_at && new Date(c.expired_at).getTime() < Date.now())) {
    return "expired";
  }
  if (c.remaining_credits <= 0) return "depleted";
  return "active";
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  manual: "Manual (WA)",
  transfer: "Transfer Bank",
  sumopod: "QRIS (SumoPod)",
  lynk: "Lynk",
};

/* ────────────────────────────────────────────────────────────────────────────
 * Halaman
 * ──────────────────────────────────────────────────────────────────────────── */

function AdminTryoutPage() {
  const [tab, setTab] = useState("credits");
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [examSets, setExamSets] = useState<ExamSetRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [creditFilter, setCreditFilter] = useState<CreditFilter>("all");
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [examSetDialog, setExamSetDialog] = useState<{
    open: boolean;
    editing: ExamSetRow | null;
  }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<ExamSetRow | null>(null);
  const [deletingSet, setDeletingSet] = useState(false);
  const [togglingSetId, setTogglingSetId] = useState<string | null>(null);
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
    try {
      // Semua request independen dijalankan paralel
      const [creditsRes, adminUsers, setsRes, overviewRes] = await Promise.all([
        supabase
          .from("tryout_credits")
          .select(
            "id, user_id, package_id, total_credits, used_credits, remaining_credits, status, payment_method, payment_ref, expired_at, created_at, tryout_packages(name)",
          )
          .order("created_at", { ascending: false })
          .limit(CREDITS_LIMIT),
        fetchAdminUsers(),
        supabase.from("tryout_exam_sets").select("*").order("sort_order", { ascending: true }),
        fetchOverview(),
      ]);

      // ── Kredit user (+ email/nama/role dari admin-users) ──
      if (creditsRes.error) {
        toast.error(`Gagal memuat kredit user: ${creditsRes.error.message}`);
      }
      const creditsData = creditsRes.data ?? [];
      const userMap = new Map(adminUsers.map((u) => [u.id, u]));

      // Role cadangan dari user_roles untuk user yang tidak ada di respons admin-users
      const missingRoleIds = Array.from(
        new Set(creditsData.map((c) => c.user_id).filter((id) => !userMap.get(id)?.role)),
      );
      const roleMap = new Map<string, string>();
      if (missingRoleIds.length > 0) {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", missingRoleIds);
        rolesData?.forEach((r) => {
          if (r.role === "admin" || !roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role);
        });
      }

      setCredits(
        creditsData.map((c): CreditRow => {
          const info = userMap.get(c.user_id);
          return {
            id: c.id,
            user_id: c.user_id,
            package_id: c.package_id,
            package_name: c.tryout_packages?.name ?? null,
            total_credits: c.total_credits,
            used_credits: c.used_credits,
            remaining_credits: c.remaining_credits,
            status: c.status,
            payment_method: c.payment_method,
            payment_ref: c.payment_ref,
            expired_at: c.expired_at,
            created_at: c.created_at,
            full_name: info?.full_name || null,
            email: info?.email || null,
            role: info?.role || roleMap.get(c.user_id) || "user",
          };
        }),
      );

      // ── Exam set (lengkap, termasuk komposisi subtes & passing grade) ──
      if (setsRes.error) {
        toast.error(`Gagal memuat exam set: ${setsRes.error.message}`);
      } else {
        setExamSets(setsRes.data ?? []);
      }

      // ── Statistik + jumlah soal per set + laporan terbuka (agregat di DB) ──
      if (overviewRes.error) {
        toast.error(`Gagal memuat ringkasan tryout: ${overviewRes.error.message}`);
      } else {
        setOverview(parseOverview(overviewRes.data));
      }
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }

  const questionCounts = overview?.questionCounts ?? EMPTY_COUNTS_MAP;
  const showSkeleton = loading && !hasLoaded;

  // Pencarian dulu, lalu hitung jumlah per status untuk chip filter
  const searchedCredits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return credits;
    return credits.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.payment_ref?.toLowerCase().includes(q) ||
        c.package_name?.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.user_id.toLowerCase().includes(q),
    );
  }, [credits, search]);

  const creditStatusCounts = useMemo(() => {
    const counts: Record<CreditFilter, number> = {
      all: searchedCredits.length,
      active: 0,
      depleted: 0,
      expired: 0,
      refunded: 0,
    };
    for (const c of searchedCredits) counts[creditStatusOf(c)] += 1;
    return counts;
  }, [searchedCredits]);

  const filteredCredits =
    creditFilter === "all"
      ? searchedCredits
      : searchedCredits.filter((c) => creditStatusOf(c) === creditFilter);

  const incompleteSets = examSets.filter((es) => {
    const c = questionCounts[es.id] ?? EMPTY_COUNTS;
    return c.twk < es.twk_count || c.tiu < es.tiu_count || c.tkp < es.tkp_count;
  }).length;

  async function toggleActive(es: ExamSetRow) {
    setTogglingSetId(es.id);
    const { error } = await supabase
      .from("tryout_exam_sets")
      .update({ is_active: !es.is_active })
      .eq("id", es.id);
    setTogglingSetId(null);
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

  function resetCreditFilters() {
    setSearch("");
    setCreditFilter("all");
  }

  const deleteTargetCounts = deleteTarget ? questionCounts[deleteTarget.id] : undefined;

  return (
    <div className="space-y-6">
      <TryoutPageHeader
        as="h2"
        eyebrow="Admin · Tryout"
        icon={<Shield className="h-3.5 w-3.5" aria-hidden />}
        title="Kelola Tryout"
        description="Aktivasi kredit user, kelola exam set & soal, dan pantau statistik tryout SKD."
        actions={
          <Button
            variant="outline"
            onClick={() => void loadAll()}
            disabled={loading}
            className="gap-1.5 rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            {loading ? "Memuat..." : "Muat ulang"}
          </Button>
        }
      />

      {/* Ringkasan statistik */}
      {showSkeleton ? (
        <OverviewStatsSkeleton />
      ) : overview ? (
        <OverviewStatsGrid stats={overview.stats} />
      ) : (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Ringkasan statistik belum tersedia. Pastikan migrasi{" "}
            <code className="font-mono text-xs">admin_tryout_overview</code> sudah dijalankan, lalu
            klik <b>Muat ulang</b>.
          </p>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1 sm:w-auto">
          <TabsTrigger value="credits" className="gap-1.5 rounded-lg px-3 py-2">
            <Coins className="h-4 w-4" aria-hidden /> Kredit User
            {hasLoaded && (
              <TabBadge
                value={credits.length >= CREDITS_LIMIT ? `${CREDITS_LIMIT}+` : credits.length}
                srLabel={`${credits.length} data kredit`}
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="sets" className="gap-1.5 rounded-lg px-3 py-2">
            <FileCheck className="h-4 w-4" aria-hidden /> Exam Set
            {hasLoaded && (
              <TabBadge value={examSets.length} srLabel={`${examSets.length} exam set`} />
            )}
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-1.5 rounded-lg px-3 py-2">
            <Sparkles className="h-4 w-4" aria-hidden /> Generate AI
            {hasLoaded && overview && incompleteSets > 0 && (
              <TabBadge
                value={incompleteSets}
                tone="amber"
                srLabel={`${incompleteSets} set belum lengkap`}
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-1.5 rounded-lg px-3 py-2">
            <Flag className="h-4 w-4" aria-hidden /> Laporan &amp; Pembahasan
            {overview && overview.openReports > 0 && (
              <TabBadge
                value={overview.openReports > 99 ? "99+" : overview.openReports}
                tone="red"
                srLabel={`${overview.openReports} laporan terbuka`}
              />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ Tab Kredit User ═══════════ */}
        <TabsContent value="credits" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, email, paket, ref..."
                  aria-label="Cari kredit user"
                  className="pl-9"
                />
              </div>
              <div
                role="group"
                aria-label="Filter status kredit"
                className="flex flex-wrap items-center gap-1.5"
              >
                {CREDIT_FILTERS.map((f) => {
                  const active = creditFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCreditFilter(f.value)}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {f.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] tabular-nums",
                          active ? "bg-primary-foreground/20" : "bg-muted",
                        )}
                      >
                        {hasLoaded ? creditStatusCounts[f.value] : "–"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={() => setActivateDialogOpen(true)}
              className="w-full gap-1.5 rounded-xl sm:w-auto lg:ml-auto"
            >
              <Plus className="h-4 w-4" aria-hidden /> Aktivasi Kredit
            </Button>
          </div>

          {showSkeleton ? (
            <CreditsSkeleton />
          ) : credits.length === 0 ? (
            <EmptyState
              icon={<Coins className="h-6 w-6" aria-hidden />}
              title="Belum ada data kredit"
              description="Kredit muncul di sini setelah user membayar atau kamu mengaktivasinya secara manual."
              action={
                <Button onClick={() => setActivateDialogOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden /> Aktivasi Kredit
                </Button>
              }
            />
          ) : filteredCredits.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" aria-hidden />}
              title="Tidak ada kredit yang cocok"
              description="Coba kata kunci lain atau ubah filter status."
              action={
                <Button variant="outline" onClick={resetCreditFilters} className="gap-1.5">
                  <RotateCcw className="h-4 w-4" aria-hidden /> Reset pencarian &amp; filter
                </Button>
              }
            />
          ) : (
            <>
              <CreditsTable rows={filteredCredits} />
              <CreditCardList rows={filteredCredits} />
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                Menampilkan {filteredCredits.length} dari {credits.length} kredit
                {credits.length >= CREDITS_LIMIT ? ` (${CREDITS_LIMIT} terbaru)` : ""}.
              </p>
            </>
          )}
        </TabsContent>

        {/* ═══════════ Tab Exam Set ═══════════ */}
        <TabsContent value="sets" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm text-muted-foreground">
              Buat set tryout baru (Set 2, Set 3, dst.), lalu generate soalnya lewat tab{" "}
              <b className="text-foreground">Generate AI</b>. Setiap set punya paket soal sendiri.
            </p>
            <Button
              onClick={() => setExamSetDialog({ open: true, editing: null })}
              className="w-full shrink-0 gap-1.5 rounded-xl sm:w-auto"
            >
              <Plus className="h-4 w-4" aria-hidden /> Tambah Set Baru
            </Button>
          </div>

          {showSkeleton ? (
            <ExamSetGridSkeleton />
          ) : examSets.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="h-6 w-6" aria-hidden />}
              title="Belum ada exam set"
              description="Buat set pertama, lalu isi soalnya lewat tab Generate AI."
              action={
                <Button
                  onClick={() => setExamSetDialog({ open: true, editing: null })}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" aria-hidden /> Tambah Set Baru
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3" aria-label="Daftar exam set">
              {examSets.map((es) => (
                <li key={es.id} className="flex">
                  <ExamSetCard
                    es={es}
                    counts={questionCounts[es.id] ?? EMPTY_COUNTS}
                    countsKnown={!!overview}
                    toggling={togglingSetId === es.id}
                    onEdit={() => setExamSetDialog({ open: true, editing: es })}
                    onToggleActive={() => void toggleActive(es)}
                    onDelete={() => setDeleteTarget(es)}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="generate" className="mt-4 space-y-4">
          <GenerateSoalPanel
            examSets={examSets}
            questionCounts={questionCounts}
            selectedSetId={generateExamSetId}
            onSelectSet={setGenerateExamSetId}
            onGenerated={() => void loadAll()}
          />
        </TabsContent>

        <TabsContent value="quality" className="mt-4 space-y-4">
          <QuestionQualityPanel examSets={examSets} />
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
        questionCount={
          deleteTargetCounts
            ? deleteTargetCounts.twk + deleteTargetCounts.tiu + deleteTargetCounts.tkp
            : undefined
        }
        deleting={deletingSet}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteSet()}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Primitif kecil
 * ──────────────────────────────────────────────────────────────────────────── */

const cardCls = "rounded-2xl border bg-card shadow-sm";

/** Blok skeleton (pola sama dengan components/tryout/skeletons.tsx). */
function Bone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
    />
  );
}

function Busy({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function TabBadge({
  value,
  srLabel,
  tone = "muted",
}: {
  value: string | number;
  srLabel: string;
  tone?: "muted" | "amber" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
        tone === "muted" && "bg-muted-foreground/15 text-muted-foreground",
        tone === "amber" && "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        tone === "red" && "bg-red-600 text-white dark:bg-red-500",
      )}
    >
      <span aria-hidden>{value}</span>
      <span className="sr-only">({srLabel})</span>
    </span>
  );
}

function AdminBadge() {
  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-400"
    >
      <Shield className="h-2.5 w-2.5" aria-hidden /> Admin
    </Badge>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Ringkasan statistik
 * ──────────────────────────────────────────────────────────────────────────── */

function OverviewStatsGrid({ stats }: { stats: OverviewStats }) {
  const hasCompleted = stats.total_completed > 0;
  const tiles: Array<{ icon: ReactNode; label: string; value: string; sub: string }> = [
    {
      icon: <Activity className="h-4 w-4" aria-hidden />,
      label: "Total attempt",
      value: fmtNum(stats.total_attempts),
      sub: `+${fmtNum(stats.attempts_7d)} dalam 7 hari terakhir`,
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
      label: "Selesai",
      value: fmtNum(stats.total_completed),
      sub: `${fmtNum(stats.participants)} peserta unik`,
    },
    {
      icon: <Timer className="h-4 w-4" aria-hidden />,
      label: "Sedang berjalan",
      value: fmtNum(stats.in_progress),
      sub: "ujian belum dikumpulkan",
    },
    {
      icon: <Target className="h-4 w-4" aria-hidden />,
      label: "Rata-rata skor",
      value: hasCompleted ? fmtNum(stats.avg_score) : "–",
      sub: "dari 550",
    },
    {
      icon: <Gauge className="h-4 w-4" aria-hidden />,
      label: "Tingkat lulus PG",
      value: hasCompleted ? `${stats.pass_rate}%` : "–",
      sub: "lulus ketiga subtes",
    },
    {
      icon: <Coins className="h-4 w-4" aria-hidden />,
      label: "Kredit aktif",
      value: fmtNum(stats.total_credits_active),
      sub: `${fmtNum(stats.users_with_credits)} user punya kredit`,
    },
  ];

  return (
    <ul
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      aria-label="Ringkasan statistik tryout"
    >
      {tiles.map((t) => (
        <li key={t.label} className={cn(cardCls, "min-w-0 p-4")}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="text-primary">{t.icon}</span>
            <span className="truncate">{t.label}</span>
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">
            {t.value}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{t.sub}</div>
        </li>
      ))}
    </ul>
  );
}

function OverviewStatsSkeleton() {
  return (
    <Busy
      label="Memuat ringkasan statistik"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(cardCls, "p-4")}>
          <Bone className="h-3 w-20" />
          <Bone className="mt-3 h-7 w-16 sm:h-9" />
          <Bone className="mt-2 h-3 w-24" />
        </div>
      ))}
    </Busy>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Tab Kredit User
 * ──────────────────────────────────────────────────────────────────────────── */

function CreditStatusPill({ credit }: { credit: CreditRow }) {
  const meta = CREDIT_STATUS_META[creditStatusOf(credit)];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        meta.cls,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  );
}

function CreditUsage({ credit }: { credit: CreditRow }) {
  const { used_credits: used, total_credits: total, remaining_credits: remaining } = credit;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span>
          <b className="font-display text-sm font-bold tabular-nums text-foreground">{used}</b>
          <span className="text-muted-foreground">/{total} terpakai</span>
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">sisa {remaining}</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={used}
        aria-label={`${used} dari ${total} kredit terpakai`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            remaining <= 0 ? "bg-muted-foreground/40" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CreditUserCell({ credit }: { credit: CreditRow }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-medium text-foreground">
        <span className="truncate">{credit.full_name || "(tanpa nama)"}</span>
        {credit.role === "admin" && <AdminBadge />}
      </div>
      <div
        className="truncate text-[11px] text-muted-foreground"
        title={credit.email ?? credit.user_id}
      >
        {credit.email ? credit.email : `${credit.user_id.slice(0, 8)}…`}
      </div>
    </div>
  );
}

function CreditPaymentCell({ credit }: { credit: CreditRow }) {
  const method = credit.payment_method || "manual";
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-foreground">
        {credit.package_name || "Paket tidak diketahui"}
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px] font-medium">
          {PAYMENT_METHOD_LABEL[method] ?? method}
        </Badge>
        {credit.payment_ref && (
          <span
            className="min-w-0 truncate font-mono text-[11px] text-muted-foreground"
            title={credit.payment_ref}
          >
            {credit.payment_ref}
          </span>
        )}
      </div>
    </div>
  );
}

function CreditsTable({ rows }: { rows: CreditRow[] }) {
  return (
    <div className={cn(cardCls, "hidden overflow-x-auto md:block")}>
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">Daftar kredit tryout user</caption>
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[26%]" />
          <col className="w-[20%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
        </colgroup>
        <thead className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">
              User
            </th>
            <th scope="col" className="px-4 py-3">
              Paket &amp; pembayaran
            </th>
            <th scope="col" className="px-4 py-3">
              Pemakaian
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Tanggal
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((c) => (
            <tr key={c.id} className="align-top transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <CreditUserCell credit={c} />
              </td>
              <td className="px-4 py-3">
                <CreditPaymentCell credit={c} />
              </td>
              <td className="px-4 py-3">
                <CreditUsage credit={c} />
              </td>
              <td className="px-4 py-3">
                <CreditStatusPill credit={c} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted-foreground">
                <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreditCardList({ rows }: { rows: CreditRow[] }) {
  return (
    <ul className="space-y-3 md:hidden" aria-label="Daftar kredit tryout user">
      {rows.map((c) => (
        <li key={c.id} className={cn(cardCls, "p-4")}>
          <div className="flex items-start justify-between gap-3">
            <CreditUserCell credit={c} />
            <CreditStatusPill credit={c} />
          </div>
          <div className="mt-3 rounded-xl border bg-muted/20 p-3">
            <CreditPaymentCell credit={c} />
            <div className="mt-3">
              <CreditUsage credit={c} />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Dibuat <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CreditsSkeleton() {
  return (
    <Busy label="Memuat data kredit">
      {/* md+: bentuk tabel */}
      <div className={cn(cardCls, "hidden overflow-hidden md:block")}>
        <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
          {["w-[28%]", "w-[26%]", "w-[20%]", "w-[13%]", "w-[13%]"].map((w, i) => (
            <div key={i} className={w}>
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 border-b px-4 py-3 last:border-0">
            <div className="w-[28%] space-y-1.5">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-40 max-w-full" />
            </div>
            <div className="w-[26%] space-y-1.5">
              <Bone className="h-4 w-24" />
              <Bone className="h-4 w-20 rounded-full" />
            </div>
            <div className="w-[20%] space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-1.5 w-full rounded-full" />
            </div>
            <div className="w-[13%]">
              <Bone className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex w-[13%] justify-end">
              <Bone className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      {/* mobile: bentuk kartu */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(cardCls, "p-4")}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-44" />
              </div>
              <Bone className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-3 space-y-2 rounded-xl border p-3">
              <Bone className="h-4 w-28" />
              <Bone className="h-4 w-24 rounded-full" />
              <Bone className="mt-1 h-3.5 w-full" />
              <Bone className="h-1.5 w-full rounded-full" />
            </div>
            <Bone className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    </Busy>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Exam Set Card
 * ──────────────────────────────────────────────────────────────────────────── */

function ExamSetCard({
  es,
  counts,
  countsKnown,
  toggling,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  es: ExamSetRow;
  counts: QuestionCounts;
  /** false bila ringkasan (RPC) gagal dimuat — jumlah soal tidak diketahui. */
  countsKnown: boolean;
  toggling: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const switchId = useId();
  const titleId = useId();
  const subtests = [
    { key: "twk", label: "TWK", current: counts.twk, target: es.twk_count, bar: "bg-amber-400" },
    { key: "tiu", label: "TIU", current: counts.tiu, target: es.tiu_count, bar: "bg-sky-400" },
    { key: "tkp", label: "TKP", current: counts.tkp, target: es.tkp_count, bar: "bg-emerald-500" },
  ];
  const filled = counts.twk + counts.tiu + counts.tkp;
  const target = es.twk_count + es.tiu_count + es.tkp_count;
  const complete = subtests.every((s) => s.current >= s.target);
  const detailPct = filled > 0 ? Math.round((counts.with_detail / filled) * 100) : 0;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        cardCls,
        "flex w-full flex-col p-5 transition hover:border-primary/40",
        !es.is_active && "bg-card/70",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
            es.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <FileCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                es.is_active
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  es.is_active ? "bg-emerald-500" : "bg-muted-foreground/50",
                )}
                aria-hidden
              />
              {es.is_active ? "Aktif" : "Nonaktif"}
            </span>
            {es.is_free_preview && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                <Eye className="h-3 w-3" aria-hidden /> Preview gratis
              </span>
            )}
            <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
              Urutan {es.sort_order}
            </span>
          </div>
          <h3
            id={titleId}
            className="mt-1.5 line-clamp-2 font-display text-lg font-bold leading-snug text-foreground"
          >
            {es.name}
          </h3>
          <p className="truncate font-mono text-[11px] text-muted-foreground">/{es.slug}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {es.description || "Belum ada deskripsi."}
      </p>

      {/* Chip info */}
      <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px]" aria-label="Info set">
        <li className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          <b className="font-semibold text-foreground">{es.total_questions}</b> soal
        </li>
        <li className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          <b className="font-semibold text-foreground">{es.duration_minutes}</b> menit
        </li>
        <li
          className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-muted-foreground"
          aria-label={`Passing grade TWK ${es.passing_grade_twk}, TIU ${es.passing_grade_tiu}, TKP ${es.passing_grade_tkp}`}
        >
          <Gauge className="h-3.5 w-3.5" aria-hidden />
          PG
          <span className="text-amber-700 dark:text-amber-400">{es.passing_grade_twk}</span>/
          <span className="text-sky-700 dark:text-sky-400">{es.passing_grade_tiu}</span>/
          <span className="text-emerald-700 dark:text-emerald-400">{es.passing_grade_tkp}</span>
        </li>
      </ul>

      {/* Target komposisi */}
      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Target komposisi
        </p>
        <CompositionBar twk={es.twk_count} tiu={es.tiu_count} tkp={es.tkp_count} />
      </div>

      {/* Pengisian soal per subtes */}
      <div className="mt-4 rounded-xl border bg-muted/20 p-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            Pengisian soal{" "}
            {countsKnown && (
              <span className="font-normal tabular-nums text-muted-foreground">
                · {filled}/{target}
              </span>
            )}
          </span>
          {countsKnown ? (
            complete ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" aria-hidden /> Lengkap
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" aria-hidden /> Belum lengkap
              </span>
            )
          ) : (
            <span className="text-[10px] text-muted-foreground">Jumlah tidak tersedia</span>
          )}
        </div>
        {countsKnown && (
          <div className="space-y-2">
            {subtests.map((s) => (
              <SubtestProgress
                key={s.key}
                label={s.label}
                current={s.current}
                target={s.target}
                barClass={s.bar}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cakupan pembahasan detail */}
      {countsKnown && (
        <div className="mt-3 flex items-center gap-3">
          <BookOpenCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              {filled > 0 ? (
                <>
                  <b className="tabular-nums text-foreground">
                    {counts.with_detail}/{filled}
                  </b>{" "}
                  soal punya pembahasan detail
                </>
              ) : (
                "Belum ada soal di set ini."
              )}
            </p>
            {filled > 0 && (
              <div
                className="mt-1 h-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={detailPct}
                aria-label={`Cakupan pembahasan detail ${detailPct}%`}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${detailPct}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aksi */}
      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <Switch
              id={switchId}
              checked={es.is_active}
              disabled={toggling}
              onCheckedChange={() => onToggleActive()}
              aria-label={`${es.is_active ? "Nonaktifkan" : "Aktifkan"} set ${es.name}`}
            />
            <Label htmlFor={switchId} className="cursor-pointer text-xs font-medium">
              {es.is_active ? "Aktif" : "Nonaktif"}
            </Label>
            {toggling && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-9 gap-1.5 rounded-lg"
              aria-label={`Edit set ${es.name}`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-9 gap-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
              aria-label={`Hapus set ${es.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Hapus
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SubtestProgress({
  label,
  current,
  target,
  barClass,
}: {
  label: string;
  current: number;
  target: number;
  barClass: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = target > 0 ? current >= target : true;
  const excess = target > 0 && current > target ? current - target : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-foreground">{label}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 tabular-nums",
            done
              ? "font-bold text-emerald-700 dark:text-emerald-400"
              : "font-medium text-muted-foreground",
          )}
        >
          {current}/{target}
          {done && <Check className="h-3 w-3" aria-hidden />}
          <span className="sr-only">{done ? "lengkap" : "belum lengkap"}</span>
          {excess > 0 && (
            <span className="font-medium text-amber-700 dark:text-amber-400">
              (+{excess} lebih)
            </span>
          )}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Pengisian soal ${label} ${pct}%`}
      >
        <div
          className={cn("h-full rounded-full transition-all", done ? "bg-emerald-500" : barClass)}
          style={{ width: `${target > 0 ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}

function ExamSetGridSkeleton() {
  return (
    <Busy label="Memuat exam set" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn(cardCls, "flex flex-col p-5")}>
          <div className="flex items-start gap-3">
            <Bone className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-16 rounded-full" />
              <Bone className="h-5 w-3/4" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
          <Bone className="mt-3 h-3.5 w-full" />
          <Bone className="mt-1.5 h-3.5 w-2/3" />
          <div className="mt-3 flex gap-1.5">
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="h-5 w-20 rounded-full" />
            <Bone className="h-5 w-24 rounded-full" />
          </div>
          <Bone className="mt-4 h-3 w-28" />
          <Bone className="mt-2 h-2 w-full rounded-full" />
          <div className="mt-4 space-y-3 rounded-xl border p-3">
            <Bone className="h-3.5 w-32" />
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="space-y-1">
                <Bone className="h-3 w-full" />
                <Bone className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
          <Bone className="mt-3 h-3.5 w-48" />
          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <Bone className="h-5 w-20 rounded-full" />
            <div className="flex gap-1.5">
              <Bone className="h-9 w-16 rounded-lg" />
              <Bone className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </Busy>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Exam Set Dialog (buat / edit set)
 * ──────────────────────────────────────────────────────────────────────────── */

function FormSection({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      {children}
    </p>
  );
}

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
  const [showErrors, setShowErrors] = useState(false);
  const fieldId = useId();

  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
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
  const nameError = showErrors && !name.trim() ? "Nama set wajib diisi." : null;
  const durationHint =
    !duration || duration < 1 ? "Durasi kosong/0 akan disimpan sebagai 100 menit." : null;

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
      setShowErrors(true);
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

  const ids = {
    name: `${fieldId}-name`,
    nameErr: `${fieldId}-name-err`,
    slug: `${fieldId}-slug`,
    slugHint: `${fieldId}-slug-hint`,
    desc: `${fieldId}-desc`,
    duration: `${fieldId}-duration`,
    durationHint: `${fieldId}-duration-hint`,
    sort: `${fieldId}-sort`,
    active: `${fieldId}-active`,
    preview: `${fieldId}-preview`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? `Edit Set — ${editing.name}` : "Tambah Set Tryout Baru"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Perbarui konfigurasi set. Perubahan langsung berlaku untuk user."
              : "Buat set baru (misal Set 2) dengan komposisi soal sesuai format CAT BKN. Jumlah soal bisa diubah sesuai kebutuhan."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <FormSection title="Info dasar">
            <div>
              <Label htmlFor={ids.name}>
                Nama set <span className="text-destructive">*</span>
              </Label>
              <Input
                id={ids.name}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Tryout SKD Set 2"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? ids.nameErr : undefined}
                className={cn("mt-1", nameError && "border-destructive")}
              />
              {nameError && <FieldError id={ids.nameErr}>{nameError}</FieldError>}
            </div>

            <div>
              <Label htmlFor={ids.slug}>Slug (URL)</Label>
              <Input
                id={ids.slug}
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
                aria-describedby={ids.slugHint}
                className="mt-1 font-mono text-sm"
              />
              <p id={ids.slugHint} className="mt-1 text-[11px] text-muted-foreground">
                Otomatis dibuat dari nama. Hanya huruf kecil, angka, dan tanda hubung; harus unik.
              </p>
            </div>

            <div>
              <Label htmlFor={ids.desc}>Deskripsi</Label>
              <Textarea
                id={ids.desc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat yang ditampilkan ke user."
                rows={2}
                className="mt-1"
              />
            </div>
          </FormSection>

          <FormSection
            title="Komposisi soal"
            description="Format CAT BKN standar: 30 TWK, 35 TIU, 45 TKP."
            aside={
              <Badge variant="outline" className="shrink-0 text-[10px] tabular-nums">
                Total {total} soal
              </Badge>
            }
          >
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="TWK"
                value={twkCount}
                onChange={setTwkCount}
                accent="text-amber-700 dark:text-amber-400"
              />
              <NumberField
                label="TIU"
                value={tiuCount}
                onChange={setTiuCount}
                accent="text-sky-700 dark:text-sky-400"
              />
              <NumberField
                label="TKP"
                value={tkpCount}
                onChange={setTkpCount}
                accent="text-emerald-700 dark:text-emerald-400"
              />
            </div>
            {total > 0 ? (
              <CompositionBar twk={twkCount} tiu={tiuCount} tkp={tkpCount} showLegend={false} />
            ) : (
              <p className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" aria-hidden /> Komposisi masih 0 soal — set belum
                bisa di-generate.
              </p>
            )}
          </FormSection>

          <FormSection
            title="Waktu & passing grade"
            description="Nilai ambang batas minimal per subtes (default SKD: 65 / 80 / 166)."
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={ids.duration}>Durasi (menit)</Label>
                <Input
                  id={ids.duration}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  aria-describedby={durationHint ? ids.durationHint : undefined}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={ids.sort}>Urutan tampil</Label>
                <Input
                  id={ids.sort}
                  type="number"
                  inputMode="numeric"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            {durationHint && (
              <p
                id={ids.durationHint}
                className="text-[11px] font-medium text-amber-700 dark:text-amber-400"
              >
                {durationHint}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="PG TWK"
                value={pgTwk}
                onChange={setPgTwk}
                accent="text-amber-700 dark:text-amber-400"
              />
              <NumberField
                label="PG TIU"
                value={pgTiu}
                onChange={setPgTiu}
                accent="text-sky-700 dark:text-sky-400"
              />
              <NumberField
                label="PG TKP"
                value={pgTkp}
                onChange={setPgTkp}
                accent="text-emerald-700 dark:text-emerald-400"
              />
            </div>
          </FormSection>

          <FormSection title="Visibilitas">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor={ids.active} className="text-sm font-medium">
                  Set aktif
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Terlihat dan bisa dikerjakan user.
                </p>
              </div>
              <Switch id={ids.active} checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor={ids.preview} className="text-sm font-medium">
                  Preview gratis
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Ditandai sebagai set gratis (opsional).
                </p>
              </div>
              <Switch id={ids.preview} checked={isFreePreview} onCheckedChange={setIsFreePreview} />
            </div>
          </FormSection>

          <DialogFooter className="gap-2 pt-1 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : editing ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Set"}
            </Button>
          </DialogFooter>
        </form>
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
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} className={cn("text-[11px] font-bold", accent)}>
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="mt-1 tabular-nums"
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Delete Exam Set Dialog
 * ──────────────────────────────────────────────────────────────────────────── */

function DeleteExamSetDialog({
  target,
  questionCount,
  deleting,
  onClose,
  onConfirm,
}: {
  target: ExamSetRow | null;
  /** Jumlah soal di set (dari ringkasan); undefined bila tidak diketahui. */
  questionCount?: number;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-display">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <Trash2 className="h-4 w-4" aria-hidden />
            </span>
            Hapus set ini?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                Set <b className="text-foreground">{target?.name}</b> beserta{" "}
                <b className="text-foreground">
                  {questionCount != null ? `${questionCount} soalnya` : "semua soalnya"}
                </b>{" "}
                akan dihapus permanen dan tidak bisa dikembalikan.
              </p>
              <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  Jika set sudah punya riwayat ujian user, set tidak bisa dihapus — cukup
                  nonaktifkan saja agar tidak terlihat oleh user.
                </span>
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
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            {deleting ? "Menghapus..." : "Hapus Set"}
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(
        res.status === 429
          ? data.error || "Terlalu banyak request generate soal. Coba lagi nanti."
          : data.error || "Gagal generate soal",
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return data as {
      success: boolean;
      generated: number;
      start_number: number;
      skipped?: number;
      rejected_by_review?: number;
      duplicates?: number;
      verified?: boolean;
      questions: Array<{ id: string; question_number: number; question_text: string }>;
    };
  }

  /** Hitung ulang jumlah soal per subtes langsung dari DB (untuk menghitung kekurangan). */
  async function fetchSubtestCounts(): Promise<SubtestCounts | null> {
    const results = await Promise.all(
      (["twk", "tiu", "tkp"] as const).map((st) =>
        supabase
          .from("tryout_questions")
          .select("id", { count: "exact", head: true })
          .eq("exam_set_id", selectedSetId)
          .eq("subtest", st),
      ),
    );
    if (results.some((r) => r.error || typeof r.count !== "number")) return null;
    return { twk: results[0].count ?? 0, tiu: results[1].count ?? 0, tkp: results[2].count ?? 0 };
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
      // Info tambahan: soal yang dibuang validasi/reviewer AI/duplikat
      const dropped =
        (Number(data.skipped) || 0) +
        (Number(data.rejected_by_review) || 0) +
        (Number(data.duplicates) || 0);
      const notes = [
        dropped > 0 ? `${dropped} kandidat dibuang` : "",
        data.verified === false ? "tanpa verifikasi AI" : "",
      ].filter(Boolean);
      toast.success(
        `${data.generated} soal ${subtest.toUpperCase()} berhasil di-generate!${
          notes.length > 0 ? ` (${notes.join(", ")})` : ""
        }`,
      );
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

    // Pecah jadi batch kecil supaya respons AI cepat dan tidak kelewatan token
    // (server meminta ~1.3x lalu memverifikasi, jadi batch kecil lebih aman dari timeout)
    const BATCH_SIZE = 10;
    const splitBatches = (items: Array<{ subtest: SubtestKey; count: number }>) => {
      const out: Array<{ subtest: SubtestKey; count: number }> = [];
      for (const t of items) {
        let remaining = t.count;
        while (remaining > 0) {
          out.push({ subtest: t.subtest, count: Math.min(BATCH_SIZE, remaining) });
          remaining -= BATCH_SIZE;
        }
      }
      return out;
    };
    const batches = splitBatches(targets);

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
    const baseline: SubtestCounts = { ...currentCounts };
    const perSubtest: Record<SubtestKey, number> = { twk: 0, tiu: 0, tkp: 0 };
    let generated = 0;
    const failedBatches: string[] = [];
    let rateLimited = false;

    // Jalankan satu putaran batch; berhenti total bila terkena rate limit
    async function runBatches(
      list: Array<{ subtest: SubtestKey; count: number }>,
      labelPrefix: string,
    ) {
      for (let i = 0; i < list.length; i++) {
        if (rateLimited) return;
        const b = list[i];
        setFullProgress({
          done: i,
          total: list.length,
          label: `${labelPrefix}${b.subtest.toUpperCase()} — ${b.count} soal (batch ${i + 1}/${list.length})`,
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
          const status = (error as { status?: number })?.status;
          if (status === 429) rateLimited = true;
          failedBatches.push(`${b.subtest.toUpperCase()} ${b.count} soal`);
          toast.error(
            `Batch gagal: ${b.subtest.toUpperCase()} ${b.count} soal — ${
              error instanceof Error ? error.message : "error tidak diketahui"
            }`,
          );
          // Lanjut ke batch berikutnya, jangan berhenti di tengah (kecuali rate limit)
        }
      }
    }

    await runBatches(batches, "Membuat ");

    // Top-up: soal yang ditolak verifier/duplikat/batch gagal membuat set belum lengkap.
    // Hitung kekurangan per subtes terhadap target set, lalu generate ulang (maks 2 putaran).
    const MAX_TOPUP_ROUNDS = 2;
    for (let round = 1; round <= MAX_TOPUP_ROUNDS && !rateLimited; round++) {
      setFullProgress({
        done: 0,
        total: 1,
        label: `Mengecek kekurangan soal (top-up ${round}/${MAX_TOPUP_ROUNDS})...`,
        generated,
      });
      const fresh = await fetchSubtestCounts();
      // Fallback bila hitung ulang gagal: jumlah awal + yang berhasil di-generate
      const counts: SubtestCounts = fresh ?? {
        twk: baseline.twk + perSubtest.twk,
        tiu: baseline.tiu + perSubtest.tiu,
        tkp: baseline.tkp + perSubtest.tkp,
      };
      const deficits = targets
        .map((t) => ({ subtest: t.subtest, count: Math.max(0, t.count - counts[t.subtest]) }))
        .filter((d) => d.count > 0);
      if (deficits.length === 0) break;
      await runBatches(splitBatches(deficits), `Top-up ${round}/${MAX_TOPUP_ROUNDS}: melengkapi `);
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

  // Kategori resmi kisi-kisi SKD (harus sama dengan BLUEPRINT di edge function
  // tryout-generate-questions). Kosongkan kategori agar server menyeimbangkan otomatis.
  const subtestCategories: Record<string, string[]> = {
    twk: ["Nasionalisme", "Integritas", "Bela Negara", "Pilar Negara", "Bahasa Negara"],
    tiu: [
      "Verbal - Analogi",
      "Verbal - Silogisme",
      "Verbal - Analitis",
      "Numerik - Berhitung",
      "Numerik - Deret Angka",
      "Numerik - Perbandingan Kuantitatif",
      "Numerik - Soal Cerita",
      "Figural",
    ],
    tkp: [
      "Pelayanan Publik",
      "Jejaring Kerja",
      "Sosial Budaya",
      "Teknologi Informasi dan Komunikasi",
      "Profesionalisme",
      "Anti Radikalisme",
    ],
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
              max={30}
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
 * Activate Credit Dialog (logika aktivasi tidak berubah)
 * ──────────────────────────────────────────────────────────────────────────── */

type UserOption = AdminUser;
type PaymentMethod = "manual" | "lynk" | "sumopod" | "transfer";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("manual");
  const [paymentRef, setPaymentRef] = useState("");
  const [credits, setCredits] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState<Array<{ slug: string; name: string; credits: number }>>(
    [],
  );
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fieldId = useId();

  useEffect(() => {
    if (open) {
      setShowErrors(false);
      void supabase
        .from("tryout_packages")
        .select("slug, name, credits")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .then(({ data }) => setPackages(data || []));

      // Fetch users for dropdown
      setLoadingUsers(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      void supabase.auth.getSession().then(({ data: sessionData }) => {
        const token = sessionData.session?.access_token;
        fetch(`${supabaseUrl}/functions/v1/admin-users?perPage=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data: { users?: UserOption[] }) => {
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
  const selectedPackage = packages.find((p) => p.slug === packageSlug);
  const userError = showErrors && !selectedUserId ? "Pilih user terlebih dahulu." : null;

  async function handleActivate() {
    if (!selectedUserId) {
      setShowErrors(true);
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

      const data = (await res.json()) as { error?: string };
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

  const ids = {
    user: `${fieldId}-user`,
    userErr: `${fieldId}-user-err`,
    pkg: `${fieldId}-package`,
    credits: `${fieldId}-credits`,
    creditsHint: `${fieldId}-credits-hint`,
    pm: `${fieldId}-pm`,
    ref: `${fieldId}-ref`,
    refHint: `${fieldId}-ref-hint`,
  };
  const selectCls =
    "mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Aktivasi Kredit User</DialogTitle>
          <DialogDescription>
            Tambahkan kredit tryout untuk user setelah pembayaran diterima.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormSection title="Penerima">
            <div>
              <Label htmlFor={ids.user}>
                User <span className="text-destructive">*</span>
              </Label>
              {loadingUsers ? (
                <div
                  role="status"
                  className="mt-1 flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memuat daftar user...
                </div>
              ) : (
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id={ids.user}
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      aria-invalid={!!userError}
                      aria-describedby={userError ? ids.userErr : undefined}
                      className={cn(
                        "mt-1 w-full justify-between font-normal",
                        userError && "border-destructive",
                      )}
                    >
                      {selectedUser ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="truncate font-medium">
                            {selectedUser.full_name || "(tanpa nama)"}
                          </span>
                          {selectedUser.role === "admin" && <AdminBadge />}
                          <span className="hidden truncate text-muted-foreground sm:inline">
                            {selectedUser.email}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Cari dan pilih user...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
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
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  u.id === selectedUserId ? "opacity-100" : "opacity-0",
                                )}
                                aria-hidden
                              />
                              <div className="flex min-w-0 flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate font-medium">
                                    {u.full_name || "(tanpa nama)"}
                                  </span>
                                  {u.role === "admin" && <AdminBadge />}
                                </div>
                                <span className="truncate text-xs text-muted-foreground">
                                  {u.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {userError ? (
                <FieldError id={ids.userErr}>{userError}</FieldError>
              ) : (
                selectedUser && (
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    Kredit dikirim ke {selectedUser.email}
                  </p>
                )
              )}
            </div>
          </FormSection>

          <FormSection title="Paket & kredit">
            <div>
              <Label htmlFor={ids.pkg}>Paket</Label>
              <select
                id={ids.pkg}
                value={packageSlug}
                onChange={(e) => setPackageSlug(e.target.value)}
                className={selectCls}
              >
                {packages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} ({p.credits}x kredit)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={ids.credits}>Jumlah kredit</Label>
              <Input
                id={ids.credits}
                type="number"
                inputMode="numeric"
                min={1}
                value={credits}
                onChange={(e) => setCredits(Math.max(1, Number(e.target.value)))}
                aria-describedby={ids.creditsHint}
                className="mt-1 tabular-nums"
              />
              <p id={ids.creditsHint} className="mt-1 text-[11px] text-muted-foreground">
                Otomatis mengikuti paket
                {selectedPackage ? ` (${selectedPackage.credits}x)` : ""}; ubah bila perlu. Minimal
                1.
              </p>
            </div>
          </FormSection>

          <FormSection title="Pembayaran">
            <div>
              <Label htmlFor={ids.pm}>Metode bayar</Label>
              <select
                id={ids.pm}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className={selectCls}
              >
                <option value="manual">Manual (WA)</option>
                <option value="transfer">Transfer Bank</option>
                <option value="sumopod">QRIS (SumoPod)</option>
                <option value="lynk">Lynk</option>
              </select>
            </div>
            <div>
              <Label htmlFor={ids.ref}>Payment ref / catatan</Label>
              <Textarea
                id={ids.ref}
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Contoh: TRX-20261107-001 / bukti transfer via WA"
                rows={2}
                aria-describedby={ids.refHint}
                className="mt-1"
              />
              <p id={ids.refHint} className="mt-1 text-[11px] text-muted-foreground">
                Opsional, tapi membantu menelusuri pembayaran di tab Kredit User.
              </p>
            </div>
          </FormSection>

          <DialogFooter className="gap-2 pt-1 sm:space-x-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={() => void handleActivate()} disabled={submitting} className="gap-1.5">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {submitting ? "Mengaktivasi..." : `Aktivasi ${credits} Kredit`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
