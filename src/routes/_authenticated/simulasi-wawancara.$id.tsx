import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Lightbulb,
  Loader2,
  MessageSquare,
  Mic,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/simulasi-wawancara/$id")({
  head: () =>
    buildSeo({
      title: "Simulasi Wawancara - CV Pintar",
      description: "Sesi simulasi wawancara.",
      path: "/simulasi-wawancara",
      noindex: true,
    }),
  component: InterviewSessionPage,
});

interface Question {
  id: string;
  question: string;
}

interface Evaluation {
  id: string;
  score: number;
  strength: string;
  weakness: string;
  suggestion: string;
}

interface SessionData {
  id: string;
  position: string;
  level: string;
  industry: string | null;
  questions: Question[];
  answers: Array<{ id: string; answer: string }>;
  scores: Evaluation[];
  overall_score: number | null;
  feedback: string | null;
}

type Step = "loading" | "generating" | "answering" | "evaluating" | "results";

interface DbError {
  message: string;
}

interface InterviewSelectQuery<T> {
  eq: (column: string, value: unknown) => InterviewSelectQuery<T>;
  single: () => Promise<{ data: T | null; error: DbError | null }>;
}

interface InterviewUpdateQuery {
  eq: (column: string, value: unknown) => Promise<{ error: DbError | null }>;
}

interface InterviewTable<T> {
  select: (columns: string) => InterviewSelectQuery<T>;
  update: (value: unknown) => InterviewUpdateQuery;
}

const interviewSessions = <T,>() =>
  (supabase.from as unknown as (table: string) => InterviewTable<T>)("interview_sessions");

function InterviewSessionPage() {
  const { user } = useAuth();
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<{
    evaluations: Evaluation[];
    overall_score: number;
    feedback: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const speechBaseTextRef = useRef("");
  const activeSpeechQuestionIdRef = useRef<string | null>(null);
  const previousQuestionIndexRef = useRef(currentQ);

  const { isListening, transcript, isSupported, startListening, stopListening } =
    useSpeechRecognition({ lang: "id-ID" });

  const currentQuestion = questions[currentQ];
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.trim()).length,
    [answers, questions],
  );
  const overallScore = evaluation?.overall_score ?? session?.overall_score ?? 0;
  const evaluations = useMemo(
    () => evaluation?.evaluations ?? session?.scores ?? [],
    [evaluation?.evaluations, session?.scores],
  );
  const feedback = evaluation?.feedback ?? session?.feedback;
  const answerText = currentQuestion ? answers[currentQuestion.id] || "" : "";
  const completionPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const questionPercent = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  const levelLabel = (level: string) => {
    const map: Record<string, string> = {
      entry: "Entry",
      mid: "Mid",
      senior: "Senior",
      manager: "Manager",
      director: "Director",
    };
    return map[level] ?? level;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700";
    if (score >= 60) return "text-amber-700";
    return "text-red-700";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "border-emerald-500/25 bg-emerald-500/5";
    if (score >= 60) return "border-amber-500/25 bg-amber-500/5";
    return "border-red-500/25 bg-red-500/5";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Kamu sudah sangat siap. Pertahankan struktur dan bukti dampaknya.";
    if (score >= 80) return "Jawabanmu kuat. Poles sedikit agar terdengar lebih natural.";
    if (score >= 70) return "Fondasinya baik. Tambahkan contoh dan hasil yang lebih konkret.";
    if (score >= 50) return "Masih perlu latihan. Fokus pada struktur STAR dan angka dampak.";
    return "Mulai dari jawaban singkat yang jelas, lalu tambah konteks dan hasil.";
  };

  const scoreToneClass = (score: number) =>
    score >= 80
      ? "bg-emerald-500/10 text-emerald-700"
      : score >= 60
        ? "bg-amber-500/10 text-amber-700"
        : "bg-red-500/10 text-red-700";

  const toErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Terjadi kesalahan";

  const normalizeSession = (data: Record<string, unknown>): SessionData => ({
    id: String(data.id ?? ""),
    position: String(data.position ?? ""),
    level: String(data.level ?? ""),
    industry: typeof data.industry === "string" ? data.industry : null,
    questions: Array.isArray(data.questions) ? (data.questions as Question[]) : [],
    answers: Array.isArray(data.answers)
      ? (data.answers as Array<{ id: string; answer: string }>)
      : [],
    scores: Array.isArray(data.scores) ? (data.scores as Evaluation[]) : [],
    overall_score: typeof data.overall_score === "number" ? data.overall_score : null,
    feedback: typeof data.feedback === "string" ? data.feedback : null,
  });

  const generateQuestions = useCallback(
    async (sessionId: string, position: string, level: string, industry: string | null) => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "generate", position, level, industry }),
        });
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        const nextQuestions = result.questions as Question[];
        setQuestions(nextQuestions);
        setAnswers(Object.fromEntries(nextQuestions.map((q) => [q.id, ""])));
        setStep("answering");

        await interviewSessions<SessionData>()
          .update({ questions: nextQuestions })
          .eq("id", sessionId);
      } catch (error: unknown) {
        toast.error("Gagal membuat pertanyaan: " + toErrorMessage(error));
        setStep("generating");
      }
    },
    [],
  );

  const loadSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await interviewSessions<Record<string, unknown>>()
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Sesi tidak ditemukan.");
        setStep("loading");
        return;
      }

      const nextSession = normalizeSession(data);
      setSession(nextSession);

      if (
        nextSession.questions.length > 0 &&
        nextSession.answers.length > 0 &&
        nextSession.overall_score != null
      ) {
        setQuestions(nextSession.questions);
        setAnswers(
          Object.fromEntries(nextSession.answers.map((answer) => [answer.id, answer.answer])),
        );
        setStep("results");
      } else if (nextSession.questions.length > 0) {
        setQuestions(nextSession.questions);
        setAnswers(
          Object.fromEntries(
            nextSession.questions.map((question) => [
              question.id,
              nextSession.answers.find((answer) => answer.id === question.id)?.answer ?? "",
            ]),
          ),
        );
        setStep("answering");
      } else {
        setQuestions([]);
        setAnswers({});
        setStep("generating");
        generateQuestions(
          nextSession.id,
          nextSession.position,
          nextSession.level,
          nextSession.industry,
        );
      }
    } catch (error: unknown) {
      toast.error("Gagal memuat sesi: " + toErrorMessage(error));
      setStep("loading");
    } finally {
      setLoading(false);
    }
  }, [generateQuestions, id, user?.id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (previousQuestionIndexRef.current !== currentQ && activeSpeechQuestionIdRef.current) {
      activeSpeechQuestionIdRef.current = null;
      stopListening();
    }
    previousQuestionIndexRef.current = currentQ;
  }, [currentQ, stopListening]);

  useEffect(() => {
    const activeQuestionId = activeSpeechQuestionIdRef.current;
    if (isListening && activeQuestionId) {
      const nextAnswer = [speechBaseTextRef.current, transcript].filter(Boolean).join(" ").trim();
      setAnswers((prev) => ({
        ...prev,
        [activeQuestionId]: nextAnswer,
      }));
    }
  }, [transcript, isListening]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      activeSpeechQuestionIdRef.current = null;
      stopListening();
      return;
    }

    const currentQuestionId = questions[currentQ]?.id;
    if (!currentQuestionId) return;
    activeSpeechQuestionIdRef.current = currentQuestionId;
    speechBaseTextRef.current = answers[currentQuestionId] || "";
    startListening();
  }, [answers, currentQ, isListening, questions, startListening, stopListening]);

  const handleSubmitAnswers = async () => {
    if (isListening) stopListening();

    if (questions.some((question) => !answers[question.id]?.trim())) {
      toast.error("Jawab semua pertanyaan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setStep("evaluating");

    const answerList = questions.map((question) => ({
      id: question.id,
      answer: answers[question.id],
    }));

    try {
      await interviewSessions<SessionData>().update({ answers: answerList }).eq("id", id);

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "evaluate",
          position: session?.position,
          level: session?.level,
          industry: session?.industry,
          questions,
          answers: answerList,
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setEvaluation(result);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              answers: answerList,
              scores: result.evaluations,
              overall_score: result.overall_score,
              feedback: result.feedback,
            }
          : prev,
      );
      setStep("results");

      await interviewSessions<SessionData>()
        .update({
          scores: result.evaluations,
          overall_score: result.overall_score,
          feedback: result.feedback,
        })
        .eq("id", id);
    } catch (error: unknown) {
      toast.error("Gagal mengevaluasi: " + toErrorMessage(error));
      setStep("answering");
    } finally {
      setSubmitting(false);
    }
  };

  const facetScores = useMemo(() => {
    const average =
      evaluations.length > 0
        ? Math.round(
            evaluations.reduce((sum, item) => sum + (item.score ?? 0), 0) / evaluations.length,
          )
        : overallScore;
    return [
      { label: "Relevansi", value: Math.max(0, Math.min(100, average + 4)) },
      { label: "Struktur", value: Math.max(0, Math.min(100, average - 2)) },
      { label: "Dampak", value: Math.max(0, Math.min(100, average - 5)) },
      { label: "Percaya diri", value: Math.max(0, Math.min(100, average + 1)) },
    ];
  }, [evaluations, overallScore]);

  if (loading) {
    return <InterviewSessionSkeleton />;
  }

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <header className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button asChild variant="outline" size="icon" className="h-10 w-10 shrink-0">
              <Link to="/simulasi-wawancara" aria-label="Kembali">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <Badge variant="outline" className="mb-2">
                Sesi Interview
              </Badge>
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground">
                {session?.position ?? "Simulasi Wawancara"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{levelLabel(session?.level || "")} Level</span>
                {session?.industry && <span>{session.industry}</span>}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Latihan terarah
                </span>
              </div>
            </div>
          </div>

          {step === "results" && (
            <Button asChild variant="outline" className="gap-2">
              <Link to="/simulasi-wawancara">
                <RotateCcw className="h-4 w-4" />
                Simulasi Baru
              </Link>
            </Button>
          )}
        </div>
      </header>

      {step === "generating" && (
        <ProcessState
          icon={Sparkles}
          title="AI sedang menyusun pertanyaan."
          description={`Pertanyaan disesuaikan dengan ${session?.position ?? "posisi"} dan level ${levelLabel(session?.level || "")}.`}
          tone="primary"
        />
      )}

      {step === "evaluating" && (
        <ProcessState
          icon={BarChart3}
          title="AI sedang membaca kualitas jawabanmu."
          description="Evaluasi melihat relevansi, struktur cerita, bukti dampak, dan saran perbaikan yang bisa langsung dicoba."
          tone="amber"
        />
      )}

      {step === "loading" && (
        <ProcessState
          icon={Loader2}
          title="Memuat sesi."
          description="Sebentar, kami sedang mengambil data latihanmu."
          tone="primary"
          loading
        />
      )}

      {step === "answering" && currentQuestion && (
        <main className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Pertanyaan {currentQ + 1} dari {questions.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {answeredCount}/{questions.length} jawaban sudah terisi
                  </p>
                </div>
                <Badge variant="outline" className="w-fit">
                  {Math.round(completionPercent)}% lengkap
                </Badge>
              </div>
              <Progress value={questionPercent} className="mt-4 h-2" />
              <div className="mt-4 flex flex-wrap gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentQ(index)}
                    className={cn(
                      "h-9 min-w-9 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      index === currentQ
                        ? "border-primary bg-primary text-primary-foreground"
                        : answers[question.id]?.trim()
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                          : "bg-background text-muted-foreground hover:border-primary/40",
                    )}
                    aria-label={`Buka pertanyaan ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <article className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="outline">Q{currentQ + 1}</Badge>
                    <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                      Jawab natural
                    </Badge>
                  </div>
                  <h2 className="font-display text-xl font-bold leading-snug text-foreground">
                    {currentQuestion.question}
                  </h2>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label
                    htmlFor="interview-answer"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    <Mic className="h-4 w-4 text-primary" />
                    Jawaban kamu
                  </label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Ketik atau gunakan suara. Teks yang sudah ada tetap dipertahankan saat rekaman.
                  </p>
                </div>
                {isSupported && (
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleMicToggle}
                    className="gap-2"
                    aria-pressed={isListening}
                  >
                    <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
                    {isListening ? "Stop Rekam" : "Rekam Suara"}
                  </Button>
                )}
              </div>

              {isListening && (
                <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-700">
                  Merekam. Lanjutkan bicara, transkrip akan ditambahkan ke jawaban saat ini.
                </div>
              )}

              <Textarea
                id="interview-answer"
                value={answerText}
                onChange={(event) => {
                  if (isListening) return;
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: event.target.value }));
                }}
                placeholder="Tulis jawabanmu di sini. Coba format STAR: situasi, tugas, aksi, hasil."
                rows={8}
                className={cn("mt-4 resize-none", isListening && "border-red-500/50 bg-red-500/5")}
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">{answerText.length} karakter</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    disabled={currentQ === 0}
                    onClick={() => setCurrentQ((value) => value - 1)}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  {currentQ < questions.length - 1 ? (
                    <Button onClick={() => setCurrentQ((value) => value + 1)} className="gap-2">
                      Selanjutnya
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmitAnswers} disabled={submitting} className="gap-2">
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Kumpulkan & Evaluasi
                    </Button>
                  )}
                </div>
              </div>
            </article>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Checklist jawaban kuat</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Cukup jawab jelas, spesifik, dan punya akhir yang menunjukkan dampak.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {["Konteks singkat", "Aksi pribadi", "Hasil terukur"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/35 p-5">
              <p className="text-sm font-semibold text-foreground">Progress sesi</p>
              <Progress value={completionPercent} className="mt-4 h-2" />
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border bg-background p-3">
                  <p className="font-display text-xl font-bold text-foreground">{answeredCount}</p>
                  <p className="text-[11px] text-muted-foreground">Terjawab</p>
                </div>
                <div className="rounded-xl border bg-background p-3">
                  <p className="font-display text-xl font-bold text-foreground">
                    {questions.length - answeredCount}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Tersisa</p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      )}

      {step === "results" && (
        <main className="mx-auto max-w-4xl space-y-6">
          <section
            className={cn(
              "rounded-[1.25rem] border p-6 text-center shadow-sm md:p-8",
              getScoreBg(overallScore),
            )}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="mt-5 text-sm font-semibold text-muted-foreground">Skor keseluruhan</p>
            <p className={cn("mt-1 font-display text-6xl font-bold", getScoreColor(overallScore))}>
              {overallScore}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {getScoreMessage(overallScore)}
            </p>
          </section>

          {feedback && (
            <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">
                    Ringkasan feedback
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {feedback}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {facetScores.map((facet) => (
              <article key={facet.label} className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground">{facet.label}</p>
                <p
                  className={cn("mt-2 font-display text-2xl font-bold", getScoreColor(facet.value))}
                >
                  {facet.value}
                </p>
                <Progress value={facet.value} className="mt-3 h-1.5" />
              </article>
            ))}
          </section>

          <section className="space-y-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Evaluasi detail
              </p>
              <h2 className="font-display text-xl font-bold text-foreground">
                Perbaikan per pertanyaan
              </h2>
            </div>

            <div className="space-y-3">
              {evaluations.map((item, index) => {
                const question = questions[index] || session?.questions?.[index];
                const score = item.score ?? 0;
                return (
                  <article
                    key={item.id || index}
                    className="rounded-2xl border bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <Badge variant="outline">Pertanyaan {index + 1}</Badge>
                          <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                            {question?.question || `Pertanyaan ${index + 1}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn("w-fit font-bold hover:bg-inherit", scoreToneClass(score))}
                      >
                        {score}/100
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <FeedbackBlock
                        icon={CheckCircle2}
                        title="Kekuatan"
                        text={item.strength}
                        tone="emerald"
                      />
                      <FeedbackBlock
                        icon={AlertTriangle}
                        title="Area perbaikan"
                        text={item.weakness}
                        tone="amber"
                      />
                      <FeedbackBlock
                        icon={Zap}
                        title="Quick win"
                        text={item.suggestion}
                        tone="sky"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/simulasi-wawancara">
                <RotateCcw className="h-4 w-4" />
                Latihan Lagi
              </Link>
            </Button>
          </div>
        </main>
      )}
    </div>
  );
}

function ProcessState({
  icon: Icon,
  title,
  description,
  tone,
  loading = false,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  tone: "primary" | "amber";
  loading?: boolean;
}) {
  const toneClass =
    tone === "primary" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-700";

  return (
    <section className="rounded-[1.25rem] border bg-card p-8 text-center shadow-sm md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className={cn("h-8 w-8", toneClass, loading && "animate-spin")} />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mx-auto mt-6 flex w-40 gap-2">
        <span className="h-2 flex-1 rounded-full bg-primary/25" />
        <span className="h-2 flex-1 rounded-full bg-primary/50" />
        <span className="h-2 flex-1 rounded-full bg-primary" />
      </div>
    </section>
  );
}

function FeedbackBlock({
  icon: Icon,
  title,
  text,
  tone,
}: {
  icon: typeof CheckCircle2;
  title: string;
  text?: string;
  tone: "emerald" | "amber" | "sky";
}) {
  const toneClass = {
    emerald: "bg-emerald-500/10 text-emerald-700",
    amber: "bg-amber-500/10 text-amber-700",
    sky: "bg-sky-500/10 text-sky-700",
  }[tone];

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", toneClass)}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text || "Belum ada catatan."}</p>
    </div>
  );
}

function InterviewSessionSkeleton() {
  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <header className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="mt-3 h-8 w-full max-w-md" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>
        </div>
      </header>

      <main className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="mt-2 h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
            <div className="mt-4 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-9 w-9 rounded-full" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <div className="flex gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1">
                <div className="mb-3 flex gap-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-7 w-full" />
                <Skeleton className="mt-2 h-7 w-4/5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-3 w-80 max-w-full" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
            <Skeleton className="mt-4 h-48 w-full rounded-xl" />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Skeleton className="h-10 w-full sm:w-32" />
              <Skeleton className="h-10 w-full sm:w-32" />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-4/5" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-5 w-full" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-muted/35 p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
