/**
 * /tryout/$examId/hasil/$attemptId — Halaman hasil + pembahasan.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Trophy,
  RotateCcw,
  Home,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  ScoreCard,
  ScoreBreakdown,
  QuestionResultCard,
} from "@/components/tryout";
import { formatDuration } from "@/lib/tryout-scoring";
import type {
  TryoutAttempt,
  TryoutExamSet,
  TryoutQuestionFull,
  TryoutAttemptStats,
} from "@/lib/tryout-types";

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

function TryoutResultPage() {
  const { user } = useAuth();
  const { examId, attemptId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<TryoutAttempt | null>(null);
  const [examSet, setExamSet] = useState<TryoutExamSet | null>(null);
  const [questions, setQuestions] = useState<TryoutQuestionFull[]>([]);
  const [hasPembahasan, setHasPembahasan] = useState(false);
  const [expandedSubtest, setExpandedSubtest] = useState<"twk" | "tiu" | "tkp" | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  async function load() {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${supabaseUrl}/functions/v1/tryout-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attempt_id: attemptId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat hasil");
      }

      setAttempt(data.attempt as TryoutAttempt);
      setExamSet(data.exam_set as TryoutExamSet);
      setQuestions((data.questions || []) as TryoutQuestionFull[]);
      setHasPembahasan(!!data.has_pembahasan);
    } catch (error) {
      console.error("Load result error:", error);

      // Fallback: load attempt langsung dari DB (untuk attempt lama)
      const { data: att } = await supabase
        .from("tryout_attempts")
        .select("*, tryout_exam_sets(*)")
        .eq("id", attemptId)
        .maybeSingle();

      if (att) {
        setAttempt(att as unknown as TryoutAttempt);
        setExamSet((att as any).tryout_exam_sets as TryoutExamSet);

        const { data: qs } = await supabase
          .from("tryout_questions")
          .select("*")
          .eq("exam_set_id", examId)
          .order("question_number", { ascending: true });
        setQuestions((qs as unknown as TryoutQuestionFull[]) || []);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-72 w-full rounded-2xl mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!attempt || !examSet) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Hasil Tidak Ditemukan</h1>
        <Button asChild className="mt-6">
          <Link to={"/tryout" as never}>Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  const stats: TryoutAttemptStats = (attempt.stats || {}) as TryoutAttemptStats;
  const grouped = {
    twk: questions.filter((q) => q.subtest === "twk"),
    tiu: questions.filter((q) => q.subtest === "tiu"),
    tkp: questions.filter((q) => q.subtest === "tkp"),
  };

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to={"/tryout" as never}>
            <ArrowLeft className="h-4 w-4" /> Dashboard Tryout
          </Link>
        </Button>
        <div className="flex gap-2">
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

      {/* Hero result */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <Badge variant="secondary" className="mb-3 gap-1.5 bg-primary/10 text-primary">
          <Trophy className="h-3 w-3" /> {examSet.name}
        </Badge>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Hasil Tryout
          </h1>
          <span className="text-sm text-muted-foreground">
            {new Date(attempt.started_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" · "}
            {formatDuration(attempt.duration_seconds)}
          </span>
        </div>
      </section>

      {/* Score Card */}
      <ScoreCard
        total={attempt.score_total}
        maxTotal={550}
        twk={attempt.score_twk}
        tiu={attempt.score_tiu}
        tkp={attempt.score_tkp}
        passOverall={attempt.pass_overall}
        passTwk={attempt.pass_twk}
        passTiu={attempt.pass_tiu}
        passTkp={attempt.pass_tkp}
        passingGrade={{
          twk: examSet.passing_grade_twk,
          tiu: examSet.passing_grade_tiu,
          tkp: examSet.passing_grade_tkp,
        }}
      />

      {/* Analytics Breakdown */}
      {stats && (stats.twk || stats.tiu || stats.tkp) && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">Analisis Detail</h2>
          <ScoreBreakdown stats={stats} />
        </section>
      )}

      {/* Pembahasan (Paket Lengkap) */}
      {hasPembahasan && questions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <BookOpen className="h-4 w-4 text-primary" /> Pembahasan
            </h2>
            <span className="text-xs text-muted-foreground">
              Klik untuk membuka
            </span>
          </div>

          <div className="space-y-3">
            {(["twk", "tiu", "tkp"] as const).map((sub) => {
              const isOpen = expandedSubtest === sub;
              const subQuestions = grouped[sub];
              const correct = subQuestions.filter(
                (q) => attempt.answers[q.id] === q.correct_answer,
              ).length;
              return (
                <div key={sub} className="overflow-hidden rounded-2xl border bg-card">
                  <button
                    type="button"
                    onClick={() => setExpandedSubtest(isOpen ? null : sub)}
                    className="flex w-full items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-bold uppercase">
                        {sub}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {subQuestions.length} soal · {correct} benar
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t bg-muted/10 p-3 sm:p-4">
                      {subQuestions.map((q, idx) => (
                        <QuestionResultCard
                          key={q.id}
                          question={q}
                          questionNumber={idx + 1}
                          userAnswer={attempt.answers[q.id]}
                          showExplanation
                          isTkp={q.subtest === "tkp"}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer actions */}
      <section className="flex flex-col gap-3 sm:flex-row sm:justify-center">
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