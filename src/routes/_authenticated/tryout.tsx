/**
 * /tryout — Dashboard tryout (auth required).
 *
 * Urutan informasi: ujian berjalan (aksi paling penting) → ringkasan progres
 * → pilih set → riwayat. Sidebar: kredit & leaderboard ringkas.
 */
import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, GraduationCap, History, Info, Plus, Sparkles, Trophy } from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import type { TryoutRpcClient } from "@/lib/tryout-types";
import {
  ATTEMPT_SUMMARY_COLUMNS,
  remainingSecondsOf,
  summarizeProgress,
  type TryoutAttemptSummary,
} from "@/lib/tryout-display";
import {
  AttemptHistoryList,
  AttemptListSkeleton,
  CreditBalance,
  CreditBalanceSkeleton,
  EmptyState,
  ExamSetCard,
  ExamSetGridSkeleton,
  LeaderboardTable,
  PageHeaderSkeleton,
  ProgressStats,
  ProgressStatsSkeleton,
  ResumeBanner,
  SectionTitle,
  TryoutPageHeader,
  type ExamSetSummary,
  type LeaderboardEntry,
} from "@/components/tryout";

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

type Credits = { total: number; used: number; remaining: number };

function TryoutDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isExactTryout = pathname === "/tryout" || pathname === "/tryout/";

  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<Credits>({ total: 0, used: 0, remaining: 0 });
  const [examSets, setExamSets] = useState<ExamSetSummary[]>([]);
  const [attempts, setAttempts] = useState<TryoutAttemptSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLocked, setLeaderboardLocked] = useState(false);

  useEffect(() => {
    if (!user?.id || !isExactTryout) return;
    void loadAll(user.id);
  }, [user?.id, isExactTryout]);

  async function loadAll(userId: string) {
    setLoading(true);
    const nowIso = new Date().toISOString();
    // Paralel. Hanya kolom yang dibutuhkan (tanpa answers/stats).
    const [creditsRes, setsRes, attemptsRes, lbRes] = await Promise.all([
      supabase
        .from("tryout_credits")
        .select("total_credits, used_credits, remaining_credits, expired_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .or(`expired_at.is.null,expired_at.gt.${nowIso}`),
      supabase
        .from("tryout_exam_sets")
        .select(
          "id, name, description, total_questions, duration_minutes, twk_count, tiu_count, tkp_count, is_free_preview",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tryout_attempts")
        .select(
          `${ATTEMPT_SUMMARY_COLUMNS}, tryout_exam_sets(name, duration_minutes, twk_count, tiu_count, tkp_count)`,
        )
        .eq("user_id", userId)
        .in("status", ["in_progress", "completed", "timed_out"])
        .order("created_at", { ascending: false })
        .limit(30),
      (supabase as unknown as TryoutRpcClient).rpc("get_tryout_leaderboard", {
        p_exam_set_id: null,
        p_limit: 5,
      }),
    ]);

    const rows = creditsRes.data || [];
    setCredits({
      total: rows.reduce((s, c) => s + c.total_credits, 0),
      used: rows.reduce((s, c) => s + c.used_credits, 0),
      remaining: rows.reduce((s, c) => s + c.remaining_credits, 0),
    });
    setExamSets((setsRes.data as ExamSetSummary[]) || []);
    setAttempts(
      (
        (attemptsRes.data || []) as Array<
          TryoutAttemptSummary & {
            tryout_exam_sets?: {
              name: string;
              duration_minutes: number;
              twk_count: number;
              tiu_count: number;
              tkp_count: number;
            } | null;
          }
        >
      ).map((a) => ({
        ...a,
        exam_name: a.tryout_exam_sets?.name ?? null,
        _duration: a.tryout_exam_sets?.duration_minutes ?? 100,
        max_total: a.tryout_exam_sets
          ? 5 *
            (a.tryout_exam_sets.twk_count +
              a.tryout_exam_sets.tiu_count +
              a.tryout_exam_sets.tkp_count)
          : 550,
      })),
    );

    if (lbRes.error) {
      setLeaderboard([]);
      setLeaderboardLocked(false);
    } else {
      const lb = (lbRes.data || {}) as { entitled?: boolean; entries?: LeaderboardEntry[] };
      setLeaderboardLocked(lb.entitled === false);
      setLeaderboard(lb.entries || []);
    }
    setLoading(false);
  }

  const summary = useMemo(() => summarizeProgress(attempts), [attempts]);
  const running = attempts.find((a) => a.status === "in_progress") as
    | (TryoutAttemptSummary & { _duration?: number })
    | undefined;
  const hasCredits = credits.remaining > 0;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0];

  if (!isExactTryout) return <Outlet />;

  const openSet = (id: string) =>
    navigate({ to: "/tryout/$examId" as never, params: { examId: id } as never });

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      {loading ? (
        <PageHeaderSkeleton />
      ) : (
        <TryoutPageHeader
          eyebrow="Tryout SKD CPNS"
          icon={<Trophy className="h-3.5 w-3.5" aria-hidden />}
          title={`Halo, ${firstName || "Pejuang SKD"}! 👋`}
          description={
            summary.finished > 0
              ? "Lanjutkan latihanmu — fokus pada subtes yang belum lulus passing grade."
              : "Simulasi SKD 110 soal dengan timer 100 menit. Mulai tryout pertamamu hari ini."
          }
          actions={
            <>
              <Button asChild variant="outline" className="h-10 gap-2 rounded-xl">
                <Link to="/belajar-skd">
                  <GraduationCap className="h-4 w-4" aria-hidden /> Modul belajar
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 gap-2 rounded-xl">
                <Link to={"/tryout-cpns" as never}>
                  <Info className="h-4 w-4" aria-hidden /> Info tryout
                </Link>
              </Button>
              <Button asChild className="h-10 gap-2 rounded-xl">
                <Link to={"/tryout/beli" as never}>
                  <Plus className="h-4 w-4" aria-hidden /> Beli kredit
                </Link>
              </Button>
            </>
          }
        />
      )}

      {!loading && running && (
        <ResumeBanner
          examId={running.exam_set_id}
          examName={running.exam_name || "Tryout SKD"}
          remainingSeconds={remainingSecondsOf(running.started_at, running._duration ?? 100)}
        />
      )}

      {loading ? (
        <ProgressStatsSkeleton />
      ) : summary.finished > 0 ? (
        <ProgressStats summary={summary} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="sets-heading">
            <SectionTitle
              id="sets-heading"
              icon={<BookOpenCheck className="h-4 w-4" aria-hidden />}
              title="Pilih set tryout"
            />
            {loading ? (
              <ExamSetGridSkeleton />
            ) : examSets.length === 0 ? (
              <EmptyState
                icon={<BookOpenCheck className="h-6 w-6" aria-hidden />}
                title="Belum ada set tryout"
                description="Set tryout baru sedang disiapkan. Cek lagi nanti, ya."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {examSets.map((es) => (
                  <ExamSetCard
                    key={es.id}
                    set={es}
                    attempts={attempts.filter((a) => a.exam_set_id === es.id)}
                    hasCredits={hasCredits}
                    onOpen={() => openSet(es.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="history-heading">
            <SectionTitle
              id="history-heading"
              icon={<History className="h-4 w-4" aria-hidden />}
              title="Riwayat tryout"
            />
            {loading ? (
              <AttemptListSkeleton />
            ) : (
              <AttemptHistoryList
                attempts={attempts.slice(0, 6)}
                emptyAction={
                  examSets[0] ? (
                    <Button className="gap-2 rounded-xl" onClick={() => openSet(examSets[0].id)}>
                      <Sparkles className="h-4 w-4" aria-hidden /> Mulai tryout pertama
                    </Button>
                  ) : undefined
                }
              />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {loading ? (
            <CreditBalanceSkeleton />
          ) : (
            <CreditBalance
              totalCredits={credits.total}
              usedCredits={credits.used}
              remainingCredits={credits.remaining}
            />
          )}

          <section aria-labelledby="lb-heading">
            <SectionTitle
              id="lb-heading"
              icon={<Trophy className="h-4 w-4" aria-hidden />}
              title="Leaderboard"
              action={{ to: "/tryout/leaderboard", label: "Lihat semua" }}
            />
            <LeaderboardTable
              entries={leaderboard}
              loading={loading}
              limit={5}
              locked={leaderboardLocked}
              variant="compact"
              showExamName
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
