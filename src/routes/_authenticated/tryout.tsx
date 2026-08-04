/**
 * /tryout — Dashboard utama tryout user (auth required).
 * Menampilkan kredit, daftar set tryout, dan riwayat.
 */
import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ArrowRight, Trophy, History, ListChecks } from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditBalance,
  AttemptHistoryList,
  LeaderboardTable,
  type LeaderboardEntry,
} from "@/components/tryout";
import { BackButton } from "@/components/ui/back-button";

export const Route = createFileRoute("/_authenticated/tryout")({
  head: () =>
    buildSeo({
      title: "Dashboard Tryout SKD - CV Pintar",
      description: "Pilih set tryout, lihat skor, dan riwayat ujian SKD.",
      path: "/tryout",
      noindex: true,
    }),
  component: TryoutDashboardPage,
});

type TryoutCreditRow = {
  id: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  status: string;
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

type AttemptRow = {
  id: string;
  exam_set_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  answers: any;
  score_total: number;
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  pass_overall: boolean;
  pass_twk: boolean;
  pass_tiu: boolean;
  pass_tkp: boolean;
  stats: any;
  created_at: string;
  exam_sets?: { id: string; slug: string; name: string } | null;
};

function TryoutDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isExactTryout = pathname === "/tryout" || pathname === "/tryout/";
  const [loading, setLoading] = useState(true);
  const [credit, setCredit] = useState<TryoutCreditRow | null>(null);
  const [examSets, setExamSets] = useState<ExamSetRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadAll() {
    if (!user?.id) return;
    setLoading(true);

    // Fetch kredit (aggregate remaining)
    const { data: creditsData } = await supabase
      .from("tryout_credits")
      .select("id, total_credits, used_credits, remaining_credits, status")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (creditsData && creditsData.length > 0) {
      const total = creditsData.reduce((s, c) => s + c.total_credits, 0);
      const used = creditsData.reduce((s, c) => s + c.used_credits, 0);
      const remaining = creditsData.reduce((s, c) => s + c.remaining_credits, 0);
      setCredit({
        id: creditsData[0].id,
        total_credits: total,
        used_credits: used,
        remaining_credits: remaining,
        status: "active",
      });
    } else {
      setCredit({
        id: "",
        total_credits: 0,
        used_credits: 0,
        remaining_credits: 0,
        status: "active",
      });
    }

    // Fetch exam sets
    const { data: setsData } = await supabase
      .from("tryout_exam_sets")
      .select("id, slug, name, description, total_questions, duration_minutes, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    setExamSets((setsData as ExamSetRow[]) || []);

    // Fetch attempts user (10 terakhir)
    const { data: attemptsData } = await supabase
      .from("tryout_attempts")
      .select("*, exam_sets:tryout_exam_sets(id, slug, name)")
      .eq("user_id", user.id)
      .in("status", ["completed", "timed_out"])
      .order("created_at", { ascending: false })
      .limit(10);
    setAttempts((attemptsData as AttemptRow[]) || []);

    // Fetch leaderboard (global top 10)
    const { data: lbData } = await supabase
      .from("tryout_leaderboard")
      .select("*")
      .order("ranking", { ascending: true })
      .limit(10);
    setLeaderboard((lbData as unknown as LeaderboardEntry[]) || []);

    setLoading(false);
  }

  const hasCredits = (credit?.remaining_credits ?? 0) > 0;

  // Jika ini child route (misal /tryout/beli), render Outlet saja
  if (!isExactTryout) {
    return <Outlet />;
  }

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <BackButton />

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Trophy className="h-3.5 w-3.5" />
              Tryout SKD
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Halo, {user?.user_metadata?.full_name?.split(" ")[0] || "Pejuang SKD"}! 👋
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Simulasi ujian SKD yang realistis. Mulai tryout, cek skor, dan
              bersaing di leaderboard.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to={"/tryout-cpns" as never}>
                Info Lengkap <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to={"/tryout/beli" as never}>
                <Plus className="h-3.5 w-3.5" /> Beli Kredit
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-6 min-w-0">
          {/* Exam Sets */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <ListChecks className="h-4 w-4 text-primary" /> Pilih Set Tryout
              </h2>
            </div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            ) : examSets.length === 0 ? (
              <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
                Belum ada set tryout yang tersedia.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {examSets.map((es) => {
                  const lastAttempt = attempts.find((a) => a.exam_set_id === es.id);
                  const status =
                    lastAttempt?.status === "completed" || lastAttempt?.status === "timed_out"
                      ? `Selesai · ${lastAttempt.score_total}/550`
                      : lastAttempt?.status === "in_progress"
                        ? "Sedang berjalan"
                        : "Belum dikerjakan";

                  return (
                    <article
                      key={es.id}
                      className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <span
                          className={
                            "rounded-md px-2 py-0.5 text-[10px] font-bold " +
                            (lastAttempt?.pass_overall
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : lastAttempt?.score_total
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-muted text-muted-foreground")
                          }
                        >
                          {status}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 font-display text-lg font-bold text-foreground">
                        {es.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {es.description || `${es.total_questions} soal · ${es.duration_minutes} menit`}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <Button
                          size="sm"
                          disabled={!hasCredits && !lastAttempt?.id}
                          onClick={() => navigate({ to: "/tryout/$examId" as never, params: { examId: es.id } as never })}
                          className="gap-1.5"
                        >
                          {lastAttempt?.pass_overall
                            ? "Coba Lagi"
                            : lastAttempt?.id
                              ? "Lihat Hasil"
                              : "Mulai Tryout"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Riwayat */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <History className="h-4 w-4 text-primary" /> Riwayat Tryout
              </h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <AttemptHistoryList attempts={attempts as any} />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {loading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : (
            <CreditBalance
              totalCredits={credit?.total_credits ?? 0}
              usedCredits={credit?.used_credits ?? 0}
              remainingCredits={credit?.remaining_credits ?? 0}
            />
          )}

          {/* Leaderboard */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
              </h2>
              <Link
                to={"/tryout/leaderboard" as never}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Lihat semua →
              </Link>
            </div>
            <LeaderboardTable
              entries={leaderboard}
              currentUserId={user?.id}
              loading={loading}
              limit={5}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}