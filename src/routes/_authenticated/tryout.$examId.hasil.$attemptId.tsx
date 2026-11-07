/**
 * /tryout/$examId/hasil/$attemptId — Hasil, analisis, dan pembahasan.
 *
 * Bagian:
 * 1. Kesiapan + skor per subtes vs passing grade (jarak poin & soal).
 * 2. Posisi di antara peserta (rank, persentil, rata-rata) + progres.
 * 3. Rekomendasi belajar & analisis per kategori / kesulitan.
 * 4. Pembahasan (paket dengan pembahasan) dengan filter Salah/Kosong/Ragu.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Home,
  Lock,
  RotateCcw,
  Trophy,
  Calendar,
  AlertCircle,
  Dumbbell,
  Printer,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  ScoreBreakdown,
  QuestionResultCard,
  ReadinessBanner,
  PeerComparison,
  RecommendationList,
  HistoryTrend,
  PracticeMode,
  ResultPageSkeleton,
} from "@/components/tryout";
import { questionOutcome } from "@/lib/tryout-options";
import { formatDuration } from "@/lib/tryout-scoring";
import { buildRecommendations, readiness, subtestGaps } from "@/lib/tryout-analysis";
import { callTryoutFunction, TryoutApiError } from "@/lib/tryout-api";
import type {
  TryoutExplanationDetail,
  TryoutAttempt,
  TryoutAttemptStats,
  TryoutExamSet,
  TryoutResultResponse,
  TryoutSubtest,
} from "@/lib/tryout-types";
import { SUBTEST_INFO } from "@/lib/tryout-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tryout/$examId/hasil/$attemptId")({
  head: () =>
    buildSeo({
      title: "Hasil Tryout SKD - CV Pintar",
      description: "Skor dan pembahasan tryout SKD.",
      path: "/tryout",
      noindex: true,
    }),
  component: TryoutResultPage,
});

type Filter = "all" | "wrong" | "empty" | "flagged" | "correct";

const FILTER_LABEL: Record<Filter, string> = {
  all: "Semua",
  wrong: "Salah",
  empty: "Kosong",
  flagged: "Ragu",
  correct: "Benar",
};

function TryoutResultPage() {
  const { user } = useAuth();
  const { examId, attemptId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TryoutResultResponse | null>(null);
  const [partial, setPartial] = useState(false);
  const [subtest, setSubtest] = useState<TryoutSubtest>("twk");
  const [filter, setFilter] = useState<Filter>("all");
  const [practiceOpen, setPracticeOpen] = useState(false);

  // Simpan pembahasan detail yang sudah dimuat agar tidak diminta ulang saat
  // filter/tab berganti atau saat dibuka di mode latihan.
  const handleDetailLoaded = useCallback((questionId: string, detail: TryoutExplanationDetail) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === questionId ? { ...q, explanation_detail: detail } : q,
            ),
          }
        : prev,
    );
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, user?.id]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await callTryoutFunction<TryoutResultResponse>("tryout-result", {
        attempt_id: attemptId,
      });
      setData(res);
      setPartial(false);
    } catch (err) {
      if (err instanceof TryoutApiError && err.status === 404) {
        setData(null);
        setError("Hasil tidak ditemukan.");
        return;
      }
      // Fallback: skor dari attempt milik sendiri (RLS SELECT). Soal, kunci &
      // pembahasan HANYA lewat edge function tryout-result.
      const { data: att } = await supabase
        .from("tryout_attempts")
        .select("*, tryout_exam_sets(*)")
        .eq("id", attemptId)
        .neq("status", "in_progress")
        .maybeSingle();
      if (att) {
        const row = att as unknown as TryoutAttempt & { tryout_exam_sets: TryoutExamSet };
        setData({
          attempt: row,
          exam_set: row.tryout_exam_sets,
          questions: [],
          has_pembahasan: false,
          insights: null,
          history: [],
        });
        setPartial(true);
      } else {
        setError(err instanceof Error ? err.message : "Gagal memuat hasil");
      }
    } finally {
      setLoading(false);
    }
  }

  const derived = useMemo(() => {
    if (!data) return null;
    const { attempt, exam_set } = data;
    const stats = (attempt.stats || {}) as TryoutAttemptStats;
    const gaps = subtestGaps(attempt, exam_set);
    return {
      stats,
      gaps,
      readiness: readiness(attempt, gaps),
      recommendations: buildRecommendations({ attempt, examSet: exam_set, stats, gaps }),
    };
  }, [data]);

  if (loading) {
    return <ResultPageSkeleton />;
  }

  if (!data || !derived) {
    return (
      <div className="container-page py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">{error || "Hasil Tidak Ditemukan"}</h1>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link to={"/tryout" as never}>Kembali ke Dashboard</Link>
          </Button>
          <Button onClick={() => void load()}>Muat ulang</Button>
        </div>
      </div>
    );
  }

  const { attempt, exam_set: examSet, questions, has_pembahasan: hasPembahasan } = data;
  const answers = attempt.answers || {};
  const flaggedSet = new Set(attempt.flagged_questions || []);

  // Nomor tampilan = urutan saat ujian (TWK → TIU → TKP).
  const numbered = questions.map((q, i) => ({ q, no: i + 1 }));
  const inSubtest = numbered.filter(({ q }) => q.subtest === subtest);
  const matches = (q: (typeof questions)[number], f: Filter) => {
    const outcome = questionOutcome(
      { subtest: q.subtest, correct_answer: q.correct_answer ?? null },
      answers[q.id],
    );
    // TKP: "belum maksimal" = dijawab tapi bukan opsi skor tertinggi.
    const tkpLow = outcome === "tkp" && (q.scores?.[answers[q.id]] ?? 5) < 5;
    switch (f) {
      case "wrong":
        return outcome === "wrong" || tkpLow;
      case "empty":
        return outcome === "empty";
      case "flagged":
        return flaggedSet.has(q.id);
      case "correct":
        return outcome === "correct" || (outcome === "tkp" && !tkpLow);
      default:
        return true;
    }
  };
  const filtered = inSubtest.filter(({ q }) => matches(q, filter));
  const filterCounts = Object.fromEntries(
    (Object.keys(FILTER_LABEL) as Filter[]).map((f) => [
      f,
      inSubtest.filter(({ q }) => matches(q, f)).length,
    ]),
  ) as Record<Filter, number>;

  return (
    <div className="container-page space-y-5 py-5 md:py-8">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to={"/tryout" as never}>
            <ArrowLeft className="h-4 w-4" /> Dashboard Tryout
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.print()}
            title="Cetak atau simpan sebagai PDF"
          >
            <Printer className="h-4 w-4" /> Cetak / PDF
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={"/tryout/leaderboard" as never}>
              <Trophy className="h-4 w-4" /> Leaderboard
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link to={"/tryout/$examId" as never} params={{ examId } as never}>
              <RotateCcw className="h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>

      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-2 gap-1.5 bg-primary/10 text-primary">
          <Trophy className="h-3 w-3" /> {examSet.name}
        </Badge>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Hasil Tryout SKD</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(attempt.finished_at || attempt.started_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(attempt.duration_seconds)} dari {examSet.duration_minutes} menit
          </span>
          {attempt.status === "timed_out" && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Dikumpulkan otomatis (waktu habis)
            </span>
          )}
        </div>
      </header>

      {partial && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Sebagian data hasil gagal dimuat (koneksi). Skor tetap ditampilkan.{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Muat ulang
          </button>
        </div>
      )}

      <ReadinessBanner
        readiness={derived.readiness}
        total={attempt.score_total}
        gaps={derived.gaps}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {data.insights ? (
          <PeerComparison
            insights={data.insights}
            scores={{
              total: attempt.score_total,
              twk: attempt.score_twk,
              tiu: attempt.score_tiu,
              tkp: attempt.score_tkp,
            }}
          />
        ) : null}
        <RecommendationList items={derived.recommendations} />
        <HistoryTrend history={data.history} currentId={attempt.id} />
      </div>

      {(derived.stats.twk || derived.stats.tiu || derived.stats.tkp) && (
        <ScoreBreakdown stats={derived.stats} />
      )}

      {/* Pembahasan */}
      {hasPembahasan && questions.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <BookOpen className="h-4 w-4 text-primary" /> Pembahasan Soal
            </h2>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 print:hidden"
              onClick={() => setPracticeOpen(true)}
            >
              <Dumbbell className="h-4 w-4" /> Latihan ulang soal salah
            </Button>
          </div>

          <div className="sticky top-0 z-20 -mx-1 space-y-2 bg-background/95 px-1 py-2 backdrop-blur print:hidden">
            <div className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1">
              {(["twk", "tiu", "tkp"] as const).map((s) => {
                const count = numbered.filter(({ q }) => q.subtest === s).length;
                if (!count) return null;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSubtest(s);
                      setFilter("all");
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                      subtest === s
                        ? cn(SUBTEST_INFO[s].color, "border dark:bg-muted")
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {SUBTEST_INFO[s].label}{" "}
                    <span className="text-xs font-normal opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(Object.keys(FILTER_LABEL) as Filter[])
                .filter((f) => !(subtest === "tkp" && f === "correct"))
                .map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition",
                      filter === f
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {subtest === "tkp" && f === "wrong" ? "Belum maksimal" : FILTER_LABEL[f]}{" "}
                    <span className="opacity-80">{filterCounts[f]}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Versi cetak: semua soal semua subtes, tanpa filter. */}
          <div className="hidden space-y-3 print:block">
            {numbered.map(({ q, no }) => (
              <QuestionResultCard
                key={`print-${q.id}`}
                question={q}
                displayNumber={no}
                userAnswer={answers[q.id]}
                isFlagged={flaggedSet.has(q.id)}
                showExplanation
              />
            ))}
          </div>

          <div className="print:hidden">
            {filtered.length === 0 ? (
              <p className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Tidak ada soal untuk filter ini. 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map(({ q, no }) => (
                  <QuestionResultCard
                    key={q.id}
                    question={q}
                    displayNumber={no}
                    userAnswer={answers[q.id]}
                    isFlagged={flaggedSet.has(q.id)}
                    showExplanation
                    attemptId={attempt.id}
                    onDetailLoaded={handleDetailLoaded}
                    canReport
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        !partial && (
          <section className="rounded-2xl border-2 border-dashed p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-display text-lg font-bold">Pembahasan terkunci</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Lihat kunci jawaban, skor tiap opsi TKP, dan pembahasan lengkap setiap soal dengan
              Paket Lengkap.
            </p>
            <Button asChild className="mt-4">
              <Link to={"/tryout/beli" as never}>Lihat Paket Lengkap</Link>
            </Button>
          </section>
        )
      )}

      {hasPembahasan && questions.length > 0 && (
        <PracticeMode
          open={practiceOpen}
          onOpenChange={setPracticeOpen}
          items={numbered}
          answers={answers}
          flagged={attempt.flagged_questions || []}
          attemptId={attempt.id}
          onDetailLoaded={handleDetailLoaded}
        />
      )}

      <section className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center print:hidden">
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link to={"/tryout" as never}>
            <Home className="h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <Button asChild size="lg" className="gap-2">
          <Link to={"/tryout/$examId" as never} params={{ examId } as never}>
            <RotateCcw className="h-4 w-4" /> Coba Set Ini Lagi
          </Link>
        </Button>
      </section>
    </div>
  );
}
