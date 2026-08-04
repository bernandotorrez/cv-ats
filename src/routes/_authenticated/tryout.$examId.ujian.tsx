/**
 * /tryout/$examId/ujian — Halaman ujian mode fullscreen.
 *
 * Flow:
 * 1. Mount → panggil tryout-start (auto-resume kalau ada in_progress).
 * 2. Timer countdown 100 menit.
 * 3. Auto-save jawaban ke server setiap ada perubahan (debounce).
 * 4. Submit manual atau auto saat waktu habis.
 * 5. Redirect ke /hasil/$attemptId setelah submit.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  Loader2,
  AlertTriangle,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useTryoutTimer } from "@/hooks/use-tryout-timer";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import {
  ExamTimer,
  QuestionCard,
  QuestionNavigation,
  SubtestTabs,
  ExamConfirmDialog,
} from "@/components/tryout";
import type {
  TryoutQuestionPublic,
  TryoutExamSet,
  TryoutSubtest,
} from "@/lib/tryout-types";

export const Route = createFileRoute("/_authenticated/tryout/$examId/ujian")({
  head: () =>
    buildSeo({
      title: "Ujian Tryout SKD - CV Pintar",
      description: "Sedang mengerjakan tryout SKD.",
      path: "/tryout",
      noindex: true,
    }),
  component: TryoutExamPage,
});

type StartResponse = {
  resumed: boolean;
  attempt_id: string;
  exam_set: TryoutExamSet;
  questions: TryoutQuestionPublic[];
  answers: Record<string, string>;
  flagged: string[];
  started_at: string;
  expires_at: string;
  duration_minutes: number;
  remaining_seconds: number;
};

const LOCAL_STORAGE_PREFIX = "tryout_answers_";
const LOCAL_FLAGGED_PREFIX = "tryout_flagged_";

function TryoutExamPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { examId } = Route.useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examSet, setExamSet] = useState<TryoutExamSet | null>(null);
  const [questions, setQuestions] = useState<TryoutQuestionPublic[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSubtest, setActiveSubtest] = useState<TryoutSubtest | "all">("all");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(100);

  // Refs for debounced save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

  // 1. Init: panggil tryout-start
  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${supabaseUrl}/functions/v1/tryout-start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exam_set_id: examId }),
      });
      const data: StartResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          (data as any).error || "Gagal memulai tryout",
        );
      }

      setAttemptId(data.attempt_id);
      setExamSet(data.exam_set);
      setQuestions(data.questions || []);
      setStartedAt(data.started_at);
      setDurationMinutes(data.duration_minutes);

      // Load jawaban: prefer localStorage (faster) > server
      const localAnswers = safeParseLocal(
        `${LOCAL_STORAGE_PREFIX}${data.attempt_id}`,
      ) as Record<string, string> | null;
      const localFlagged = safeParseLocal(
        `${LOCAL_FLAGGED_PREFIX}${data.attempt_id}`,
      ) as string[] | null;

      const serverAnswers = (data.answers || {}) as Record<string, string>;
      const merged = { ...serverAnswers, ...(localAnswers || {}) };
      setAnswers(merged);
      setFlagged(localFlagged || data.flagged || []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memulai tryout";
      toast.error(msg);
      navigate({ to: "/tryout" as never });
    } finally {
      setLoading(false);
    }
  }

  // 2. Timer
  const timer = useTryoutTimer({
    startedAt: startedAt || new Date().toISOString(),
    durationMinutes,
    onExpire: () => {
      if (submittingRef.current) return;
      toast.warning("Waktu habis! Submit otomatis...", { duration: 5000 });
      void handleSubmit(true);
    },
  });

  // 3. Prevent navigation
  useBeforeUnload({
    enabled: !!attemptId && !confirmOpen,
    message: "Ujian sedang berlangsung. Yakin keluar?",
  });

  // 4. Handlers
  const handleAnswer = useCallback(
    (questionId: string, key: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: key };
        scheduleSave(attemptId, next, flagged);
        return next;
      });
    },
    [attemptId, flagged],
  );

  const handleToggleFlag = useCallback(
    (questionId: string) => {
      setFlagged((prev) => {
        const next = prev.includes(questionId)
          ? prev.filter((id) => id !== questionId)
          : [...prev, questionId];
        localStorage.setItem(
          `${LOCAL_FLAGGED_PREFIX}${attemptId}`,
          JSON.stringify(next),
        );
        return next;
      });
    },
    [attemptId],
  );

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!attemptId) return;
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        // Flush latest local answers before submit
        const latestAnswers = safeParseLocal(
          `${LOCAL_STORAGE_PREFIX}${attemptId}`,
        ) as Record<string, string> | null;
        const finalAnswers = latestAnswers || answers;

        const res = await fetch(`${supabaseUrl}/functions/v1/tryout-submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attempt_id: attemptId,
            answers: finalAnswers,
            flagged_questions: flagged,
            auto_submit: autoSubmit,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal submit");
        }

        // Clean local storage
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${attemptId}`);
        localStorage.removeItem(`${LOCAL_FLAGGED_PREFIX}${attemptId}`);

        toast.success(autoSubmit ? "Waktu habis. Ujian disubmit." : "Ujian disubmit!");
        navigate({
          to: "/tryout/$examId/hasil/$attemptId" as never,
          params: { examId, attemptId } as never,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Gagal submit";
        toast.error(msg);
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [attemptId, answers, flagged, navigate, examId],
  );

  // Filtered questions
  const visibleQuestions =
    activeSubtest === "all"
      ? questions
      : questions.filter((q) => q.subtest === activeSubtest);

  const subtestCounts = {
    all: { total: questions.length, answered: Object.keys(answers).length },
    twk: {
      total: questions.filter((q) => q.subtest === "twk").length,
      answered: Object.keys(answers).filter(
        (id) => questions.find((q) => q.id === id)?.subtest === "twk",
      ).length,
    },
    tiu: {
      total: questions.filter((q) => q.subtest === "tiu").length,
      answered: Object.keys(answers).filter(
        (id) => questions.find((q) => q.id === id)?.subtest === "tiu",
      ).length,
    },
    tkp: {
      total: questions.filter((q) => q.subtest === "tkp").length,
      answered: Object.keys(answers).filter(
        (id) => questions.find((q) => q.id === id)?.subtest === "tkp",
      ).length,
    },
  };

  const currentQuestion = visibleQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Menyiapkan ujian...</p>
        </div>
      </div>
    );
  }

  if (!examSet || questions.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 font-display text-2xl font-bold">Soal Tidak Tersedia</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set tryout ini belum memiliki soal. Hubungi admin.
        </p>
        <Button asChild className="mt-6">
          <Link to={"/tryout" as never}>Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to={"/tryout" as never}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {examSet.name}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Soal {currentIndex + 1} dari {visibleQuestions.length}
                {activeSubtest !== "all" ? ` · ${activeSubtest.toUpperCase()}` : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-right text-[11px] sm:block">
              <div className="font-medium text-foreground">
                {answeredCount} / {questions.length} dijawab
              </div>
              <div className="text-muted-foreground">
                {Math.round((answeredCount / questions.length) * 100)}% progress
              </div>
            </div>
            <ExamTimer
              display={timer.display}
              isWarning={timer.isWarning}
              isCritical={timer.isCritical}
            />
          </div>
        </div>
      </div>

      <div className="container-page space-y-4 py-5 md:py-6">
        {/* Subtest tabs */}
        <SubtestTabs
          activeSubtest={activeSubtest}
          counts={subtestCounts}
          onChange={(s) => {
            setActiveSubtest(s);
            setCurrentIndex(0);
          }}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Question column */}
          <div className="min-w-0">
            {currentQuestion ? (
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                questionNumber={currentQuestion.question_number}
                totalQuestions={visibleQuestions.length}
                selectedAnswer={answers[currentQuestion.id]}
                isFlagged={flagged.includes(currentQuestion.id)}
                onAnswer={(key) => handleAnswer(currentQuestion.id, key)}
                onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
              />
            ) : null}

            {/* Navigation buttons */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </Button>
              {currentIndex === visibleQuestions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Send className="h-4 w-4" /> Submit Ujian
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() =>
                    setCurrentIndex((i) => Math.min(visibleQuestions.length - 1, i + 1))
                  }
                  className="gap-1.5"
                >
                  Selanjutnya <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <QuestionNavigation
              questions={questions.map((q) => ({
                id: q.id,
                subtest: q.subtest,
                question_number: q.question_number,
              }))}
              currentIndex={
                activeSubtest === "all"
                  ? currentIndex
                  : questions.findIndex((q) => q.id === currentQuestion?.id)
              }
              answers={answers}
              flagged={flagged}
              onJump={(idx) => {
                const q = questions[idx];
                if (q) {
                  setActiveSubtest("all");
                  setCurrentIndex(questions.findIndex((qq) => qq.id === q.id));
                }
              }}
            />

            <Button
              onClick={() => setConfirmOpen(true)}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              <Send className="h-4 w-4" /> Submit Ujian
            </Button>

            <div className="rounded-xl border bg-muted/30 p-3 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">💡 Tips</p>
              <p className="mt-1">
                Tandai soal ragu, submit tepat waktu. Jawaban tersimpan otomatis.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <ExamConfirmDialog
        open={confirmOpen}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        flaggedCount={flagged.length}
        isSubmitting={submitting}
        onConfirm={() => {
          setConfirmOpen(false);
          void handleSubmit(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );

  function scheduleSave(
    attemptId: string | null,
    nextAnswers: Record<string, string>,
    currentFlagged: string[],
  ) {
    if (!attemptId) return;
    // LocalStorage selalu diupdate untuk backup
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_PREFIX}${attemptId}`,
        JSON.stringify(nextAnswers),
      );
      localStorage.setItem(
        `${LOCAL_FLAGGED_PREFIX}${attemptId}`,
        JSON.stringify(currentFlagged),
      );
    } catch {}

    // Debounced server save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void supabase
        .from("tryout_attempts")
        .update({ answers: nextAnswers, flagged_questions: currentFlagged })
        .eq("id", attemptId)
        .then(({ error }) => {
          if (error) console.warn("Auto-save error:", error.message);
        });
    }, 3000);
  }
}

function safeParseLocal(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}