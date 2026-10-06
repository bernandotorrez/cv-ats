import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { VoiceAnswerPanel } from "@/components/interview/VoiceAnswerPanel";
import { normalizeQuestions } from "../../../supabase/functions/_shared/interview-questions";
import {
  analyzeDelivery,
  formatDuration,
  paceLabel,
  summarizeDelivery,
} from "@/lib/interview-delivery";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Banknote,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  Lightbulb,
  Loader2,
  MessageSquare,
  Mic,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { scoreTone } from "@/components/cv-review/review-utils";

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

/** Jawaban + data cara bicara (hanya ada untuk jawaban yang direkam dengan suara). */
interface SessionAnswer {
  id: string;
  answer: string;
  durationSec?: number;
  wpm?: number;
  fillerCount?: number;
}

interface SessionData {
  id: string;
  position: string;
  level: string;
  industry: string | null;
  questions: Question[];
  answers: SessionAnswer[];
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
  const [generateError, setGenerateError] = useState<string | null>(null);
  const speechBaseTextRef = useRef("");
  const activeSpeechQuestionIdRef = useRef<string | null>(null);
  const previousQuestionIndexRef = useRef(currentQ);

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({ lang: "id-ID" });
  const [listeningStartedAt, setListeningStartedAt] = useState<number | null>(null);
  const recordStartRef = useRef<number | null>(null);
  // Total detik merekam per pertanyaan (untuk menghitung tempo bicara)
  const durationsRef = useRef<Record<string, number>>({});
  const answersRef = useRef<Record<string, string>>({});

  answersRef.current = answers;

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

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Kamu sudah sangat siap. Pertahankan struktur dan bukti dampaknya.";
    if (score >= 80) return "Jawabanmu kuat. Poles sedikit agar terdengar lebih natural.";
    if (score >= 70) return "Fondasinya baik. Tambahkan contoh dan hasil yang lebih konkret.";
    if (score >= 50) return "Masih perlu latihan. Fokus pada struktur STAR dan angka dampak.";
    return "Mulai dari jawaban singkat yang jelas, lalu tambah konteks dan hasil.";
  };

  const toErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Terjadi kesalahan";

  const normalizeSession = (data: Record<string, unknown>): SessionData => ({
    id: String(data.id ?? ""),
    position: String(data.position ?? ""),
    level: String(data.level ?? ""),
    industry: typeof data.industry === "string" ? data.industry : null,
    questions: normalizeQuestions(data.questions),
    answers: Array.isArray(data.answers) ? (data.answers as SessionAnswer[]) : [],
    scores: Array.isArray(data.scores) ? (data.scores as Evaluation[]) : [],
    overall_score: typeof data.overall_score === "number" ? data.overall_score : null,
    feedback: typeof data.feedback === "string" ? data.feedback : null,
  });

  const generateQuestions = useCallback(
    async (sessionId: string, position: string, level: string, industry: string | null) => {
      setGenerateError(null);
      setStep("generating");
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "generate", position, level, industry }),
        });
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        // Jangan percaya bentuk balasan: daftar kosong/rusak dulu membuat sesi tampil kosong
        const nextQuestions = normalizeQuestions(result.questions);
        if (nextQuestions.length === 0) {
          throw new Error("AI belum menghasilkan pertanyaan yang valid.");
        }
        setQuestions(nextQuestions);
        setAnswers(Object.fromEntries(nextQuestions.map((q) => [q.id, ""])));
        setCurrentQ(0);
        setStep("answering");

        await interviewSessions<SessionData>()
          .update({ questions: nextQuestions })
          .eq("id", sessionId);
      } catch (error: unknown) {
        setGenerateError(toErrorMessage(error));
      }
    },
    [],
  );

  const retryGenerate = () => {
    if (!session) return;
    generateQuestions(session.id, session.position, session.level, session.industry);
  };

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

  const stopRecording = useCallback(() => {
    const questionId = activeSpeechQuestionIdRef.current;
    if (questionId && recordStartRef.current) {
      const elapsed = (Date.now() - recordStartRef.current) / 1000;
      durationsRef.current[questionId] = (durationsRef.current[questionId] ?? 0) + elapsed;
    }
    recordStartRef.current = null;
    setListeningStartedAt(null);
    activeSpeechQuestionIdRef.current = null;
    stopListening();
  }, [stopListening]);

  const startRecording = useCallback(
    (questionId: string) => {
      activeSpeechQuestionIdRef.current = questionId;
      speechBaseTextRef.current = answersRef.current[questionId] || "";
      recordStartRef.current = Date.now();
      setListeningStartedAt(Date.now());
      startListening();
    },
    [startListening],
  );

  // Pindah pertanyaan saat merekam: hentikan rekaman, waktunya dihitung ke pertanyaan sebelumnya
  useEffect(() => {
    if (previousQuestionIndexRef.current !== currentQ && activeSpeechQuestionIdRef.current) {
      stopRecording();
    }
    previousQuestionIndexRef.current = currentQ;
  }, [currentQ, stopRecording]);

  // Mikrofon ditolak / error recognizer: tampilkan pesan dan reset status rekam
  useEffect(() => {
    if (!speechError) return;
    toast.error(speechError);
    stopRecording();
  }, [speechError, stopRecording]);

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

  const handleSubmitAnswers = async () => {
    if (isListening) stopListening();

    if (questions.some((question) => !answers[question.id]?.trim())) {
      toast.error("Jawab semua pertanyaan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setStep("evaluating");

    const answerList: SessionAnswer[] = questions.map((question) => {
      const answer = answers[question.id];
      const recordedSec = durationsRef.current[question.id] ?? 0;
      // Hanya jawaban yang direkam dengan suara (>= 3 detik) punya data cara bicara
      if (recordedSec < 3) return { id: question.id, answer };
      const stats = analyzeDelivery(answer, recordedSec);
      return {
        id: question.id,
        answer,
        durationSec: stats.durationSec,
        wpm: stats.wpm,
        fillerCount: stats.fillerCount,
      };
    });

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

  if (loading) {
    return <InterviewSessionSkeleton />;
  }

  const delivery = summarizeDelivery(session?.answers ?? []);
  const unanswered = questions.length - answeredCount;

  return (
    <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/simulasi-wawancara"
            className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Simulasi wawancara
          </Link>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {session?.position ?? "Simulasi wawancara"}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-900 ring-1 ring-green-200">
              {levelLabel(session?.level || "")} level
            </span>
            {session?.industry && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                {session.industry}
              </span>
            )}
          </p>
        </div>

        {step === "results" && (
          <Link
            to="/simulasi-wawancara"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Simulasi baru
          </Link>
        )}
      </header>

      {(generateError || (step === "answering" && !currentQuestion)) && (
        <section
          role="alert"
          className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center md:p-12"
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-red-700 ring-1 ring-red-200">
            <AlertTriangle aria-hidden="true" className="h-8 w-8" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-extrabold text-gray-900">
            Pertanyaan belum berhasil dibuat
          </h2>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-gray-700">
            {generateError ?? "Sesi ini belum punya pertanyaan yang valid."} Kuotamu tidak terpotong
            untuk percobaan yang gagal.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={retryGenerate}
              className="h-12 gap-2 rounded-xl bg-green-700 px-6 font-extrabold text-white hover:bg-green-800"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Coba lagi
            </Button>
            <Link
              to="/simulasi-wawancara"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-6 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50"
            >
              Kembali
            </Link>
          </div>
        </section>
      )}

      {step === "generating" && !generateError && (
        <ProcessCard
          icon={Sparkles}
          title="AI sedang menyusun pertanyaan"
          description={`Pertanyaan disesuaikan dengan ${session?.position ?? "posisi"} dan level ${levelLabel(session?.level || "")}.`}
        />
      )}

      {step === "evaluating" && (
        <ProcessCard
          icon={BarChart3}
          title="AI sedang membaca jawabanmu"
          description="Evaluasi melihat relevansi, struktur cerita, bukti dampak, dan cara bicara, lalu menyiapkan saran yang bisa langsung dicoba."
        />
      )}

      {step === "loading" && (
        <ProcessCard
          icon={Loader2}
          spin
          title="Memuat sesi"
          description="Sebentar, kami sedang mengambil data latihanmu."
        />
      )}

      {step === "answering" && currentQuestion && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-4">
            {/* Navigator */}
            <section
              aria-label="Navigasi pertanyaan"
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-base font-extrabold text-gray-900">
                  Pertanyaan {currentQ + 1} dari {questions.length}
                </p>
                <p className="text-sm text-gray-600">
                  {answeredCount}/{questions.length} terjawab
                </p>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-label="Jawaban terisi"
                aria-valuenow={Math.round(completionPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-green-700 transition-[width] duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {questions.map((question, index) => {
                  const done = Boolean(answers[question.id]?.trim());
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentQ(index)}
                      aria-label={`Buka pertanyaan ${index + 1}${done ? " (sudah dijawab)" : ""}`}
                      aria-current={index === currentQ ? "step" : undefined}
                      className={cn(
                        "flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border-2 px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                        index === currentQ
                          ? "border-green-700 bg-green-700 text-white"
                          : done
                            ? "border-green-200 bg-green-50 text-green-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-green-700",
                      )}
                    >
                      {done && index !== currentQ ? (
                        <Check aria-hidden="true" className="h-3.5 w-3.5" />
                      ) : null}
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Pertanyaan */}
            <article className="rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-800">
                <MessageSquare aria-hidden="true" className="h-4 w-4" />
                Pertanyaan {currentQ + 1}
              </p>
              <h2 className="mt-2 font-display text-xl font-extrabold leading-snug text-gray-900 sm:text-2xl">
                {currentQuestion.question}
              </h2>
            </article>

            {/* Jawaban */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <label
                htmlFor="interview-answer"
                className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900"
              >
                Jawabanmu
              </label>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Ketik, atau jawab dengan suara supaya kamu juga mendapat analisis tempo dan kata
                pengisi. Teks yang sudah ada tetap dipertahankan saat rekaman.
              </p>

              <div className="mt-4">
                {isSupported ? (
                  <VoiceAnswerPanel
                    recording={listeningStartedAt !== null}
                    startedAt={listeningStartedAt}
                    answer={answerText}
                    onStart={() => startRecording(currentQuestion.id)}
                    onStop={stopRecording}
                  />
                ) : (
                  <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                    Browser ini belum mendukung rekam suara. Gunakan Chrome atau Edge untuk menjawab
                    dengan suara, atau ketik jawabanmu di bawah.
                  </p>
                )}
              </div>

              <Textarea
                id="interview-answer"
                value={answerText}
                onChange={(event) => {
                  if (isListening) return;
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: event.target.value }));
                }}
                placeholder="Tulis jawabanmu di sini. Coba format STAR: situasi, tugas, aksi, hasil."
                rows={8}
                readOnly={isListening}
                className={cn(
                  "mt-4 resize-y rounded-xl border-gray-300 px-4 py-3 text-base placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:ring-2 focus-visible:ring-green-700/20",
                  isListening && "border-red-400 bg-red-50",
                )}
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm tabular-nums text-gray-600">
                  {answerText.length.toLocaleString("id-ID")} karakter
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    disabled={currentQ === 0}
                    onClick={() => setCurrentQ((value) => value - 1)}
                    className="h-11 gap-2 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50"
                  >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  {currentQ < questions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQ((value) => value + 1)}
                      className="h-11 gap-2 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
                    >
                      Selanjutnya
                      <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitAnswers}
                      disabled={submitting}
                      className="h-11 gap-2 rounded-xl bg-green-700 font-extrabold text-white hover:bg-green-800"
                    >
                      {submitting ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles aria-hidden="true" className="h-4 w-4" />
                      )}
                      Kumpulkan & evaluasi
                    </Button>
                  )}
                </div>
              </div>
              {currentQ === questions.length - 1 && unanswered > 0 && (
                <p role="status" className="mt-3 text-sm font-medium text-amber-900">
                  Masih ada {unanswered} pertanyaan yang belum dijawab. Semua harus terisi sebelum
                  dievaluasi.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900">
                <Lightbulb aria-hidden="true" className="h-4 w-4 text-green-700" />
                Kerangka jawaban STAR
              </h2>
              <dl className="mt-3 space-y-3">
                {[
                  ["S", "Situasi", "Konteks singkat: di mana dan kapan."],
                  ["T", "Tugas", "Tanggung jawab atau targetmu."],
                  ["A", "Aksi", "Apa yang kamu lakukan, secara pribadi."],
                  ["R", "Hasil", "Dampak terukur: angka, waktu, biaya."],
                ].map(([letter, title, hint]) => (
                  <div key={letter} className="flex gap-3">
                    <dt
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-700 font-display text-sm font-extrabold text-white"
                    >
                      {letter}
                    </dt>
                    <dd className="text-sm leading-snug text-gray-800">
                      <span className="font-bold">{title}.</span> {hint}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="font-display text-base font-extrabold text-gray-900">Progres sesi</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                  <p className="font-display text-2xl font-extrabold text-gray-900">
                    {answeredCount}
                  </p>
                  <p className="text-xs text-gray-600">Terjawab</p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                  <p className="font-display text-2xl font-extrabold text-gray-900">{unanswered}</p>
                  <p className="text-xs text-gray-600">Tersisa</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          <ScoreHero score={overallScore} message={getScoreMessage(overallScore)} />

          {feedback && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-gray-900">
                <Lightbulb aria-hidden="true" className="h-5 w-5 text-green-700" />
                Ringkasan feedback
              </h2>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-gray-800">
                {feedback}
              </p>
            </section>
          )}

          {delivery && <DeliveryCard summary={delivery} />}

          {evaluations.length > 0 && (
            <section aria-labelledby="per-pertanyaan-heading" className="space-y-4">
              <div>
                <h2
                  id="per-pertanyaan-heading"
                  className="font-display text-xl font-extrabold tracking-tight text-gray-900"
                >
                  Perbaikan per pertanyaan
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Buka tiap pertanyaan untuk melihat jawabanmu dan saran yang bisa langsung dicoba.
                </p>
              </div>

              <ul className="space-y-3">
                {evaluations.map((item, index) => {
                  const question = questions[index] || session?.questions?.[index];
                  const score = item.score ?? 0;
                  const tone = scoreTone(score);
                  const userAnswer =
                    answers[item.id] ??
                    session?.answers?.find((a) => a.id === item.id)?.answer ??
                    "";
                  return (
                    <li
                      key={item.id || index}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-extrabold ring-1",
                            tone.pill,
                          )}
                        >
                          {score}
                          <span className="sr-only"> dari 100</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-green-800">
                            Pertanyaan {index + 1}
                          </p>
                          <h3 className="mt-0.5 text-base font-bold leading-snug text-gray-900">
                            {question?.question || `Pertanyaan ${index + 1}`}
                          </h3>
                          <div
                            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
                            role="presentation"
                          >
                            <div
                              className={cn("h-full rounded-full", tone.bar)}
                              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {userAnswer && (
                        <details className="mt-4 rounded-xl bg-gray-50 p-3">
                          <summary className="cursor-pointer text-sm font-bold text-gray-800">
                            Lihat jawabanmu
                          </summary>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                            {userAnswer}
                          </p>
                        </details>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <FeedbackBlock
                          icon={CheckCircle2}
                          title="Kekuatan"
                          text={item.strength}
                          tone="good"
                        />
                        <FeedbackBlock
                          icon={AlertTriangle}
                          title="Area perbaikan"
                          text={item.weakness}
                          tone="warn"
                        />
                        <FeedbackBlock
                          icon={Zap}
                          title="Coba ini"
                          text={item.suggestion}
                          tone="tip"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              to="/simulasi-wawancara"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 text-base font-extrabold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Latihan lagi
            </Link>
            <Link
              to="/simulasi-wawancara/negosiasi"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            >
              <Banknote aria-hidden="true" className="h-4 w-4" />
              Latih negosiasi gaji
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold text-gray-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreHero({ score, message }: { score: number; message: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const tone = scoreTone(clamped);
  return (
    <section
      aria-label="Skor keseluruhan"
      className="relative overflow-hidden rounded-3xl bg-green-700 p-6 text-white shadow-xl shadow-green-900/15 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-green-600/50 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-yellow-300/15 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              className="stroke-white/20"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - clamped / 100)}
              className="stroke-yellow-300 transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-extrabold leading-none">{clamped}</span>
            <span className="mt-1 text-xs font-semibold text-green-100">dari 100</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">
            Skor keseluruhan
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold">{tone.label}</p>
          <p className="mt-2 max-w-md text-base leading-relaxed text-green-50">{message}</p>
        </div>
      </div>
    </section>
  );
}

function DeliveryCard({ summary }: { summary: NonNullable<ReturnType<typeof summarizeDelivery>> }) {
  const pace = paceLabel(summary.avgWpm);
  const tips: string[] = [];
  if (summary.avgWpm > 170)
    tips.push("Bicaramu cukup cepat. Beri jeda sejenak di akhir tiap poin.");
  else if (summary.avgWpm > 0 && summary.avgWpm < 100)
    tips.push("Tempomu pelan. Latih jawaban agar lebih padat dan mengalir.");
  if (summary.fillersPer100Words >= 5)
    tips.push("Banyak kata pengisi. Ganti dengan jeda singkat saat berpikir.");
  if (summary.avgDurationSec < 20)
    tips.push("Jawabanmu singkat. Untuk pertanyaan perilaku, 45–90 detik biasanya ideal.");
  else if (summary.avgDurationSec > 120)
    tips.push("Jawabanmu cukup panjang. Ringkas ke inti: situasi, aksi, hasil.");
  if (tips.length === 0)
    tips.push("Cara bicaramu sudah baik. Pertahankan tempo dan kejelasan ini.");

  return (
    <section
      aria-labelledby="cara-bicara-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 ring-1 ring-green-200">
          <Mic aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2
            id="cara-bicara-heading"
            className="font-display text-lg font-extrabold text-gray-900"
          >
            Cara bicara
          </h2>
          <p className="text-sm text-gray-600">
            Dari {summary.answersWithVoice} jawaban yang kamu rekam dengan suara.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <dt className="text-sm font-medium text-gray-600">Tempo rata-rata</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold text-gray-900">
            {summary.avgWpm > 0 ? summary.avgWpm : "–"}
            <span className="ml-1 text-sm font-medium text-gray-600">kata/menit</span>
          </dd>
          <dd
            className={cn(
              "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
              pace.tone === "good" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900",
            )}
          >
            {pace.label}
          </dd>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <dt className="text-sm font-medium text-gray-600">Kata pengisi</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold text-gray-900">
            {summary.totalFillers}
            <span className="ml-1 text-sm font-medium text-gray-600">
              ({summary.fillersPer100Words}/100 kata)
            </span>
          </dd>
          <dd className="mt-2 text-sm text-gray-700">
            {summary.topFillers.length > 0
              ? summary.topFillers.map((f) => `${f.label} ×${f.count}`).join(", ")
              : "Tidak terdeteksi"}
          </dd>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <dt className="text-sm font-medium text-gray-600">Durasi rata-rata</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold text-gray-900">
            {formatDuration(summary.avgDurationSec)}
            <span className="ml-1 text-sm font-medium text-gray-600">per jawaban</span>
          </dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-2">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-gray-800">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
            {tip}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-gray-600">
        Ini perkiraan dari transkrip browser. Suara seperti “eee” atau “umm” sering tidak ikut
        tertranskrip, jadi kata pengisi sebenarnya bisa lebih banyak dari yang terdeteksi.
      </p>
    </section>
  );
}

function ProcessCard({
  icon: Icon,
  title,
  description,
  spin = false,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  spin?: boolean;
}) {
  return (
    <section
      role="status"
      className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm md:p-12"
    >
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
        <Icon aria-hidden="true" className={cn("h-8 w-8", spin && "motion-safe:animate-spin")} />
      </span>
      <h2 className="mt-5 font-display text-2xl font-extrabold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-gray-600">{description}</p>
      <div
        aria-hidden="true"
        className="mx-auto mt-6 h-2 w-48 overflow-hidden rounded-full bg-gray-100"
      >
        <div className="h-full w-1/3 rounded-full bg-green-700 motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]" />
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
  tone: "good" | "warn" | "tip";
}) {
  const styles = {
    good: { box: "border-green-200 bg-green-50/60", icon: "bg-green-100 text-green-800" },
    warn: { box: "border-amber-200 bg-amber-50/60", icon: "bg-amber-100 text-amber-900" },
    tip: { box: "border-sky-200 bg-sky-50/60", icon: "bg-sky-100 text-sky-800" },
  }[tone];

  return (
    <div className={cn("rounded-xl border p-4", styles.box)}>
      <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            styles.icon,
          )}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        {title}
      </p>
      <p className="mt-2.5 text-sm leading-relaxed text-gray-800">{text || "Belum ada catatan."}</p>
    </div>
  );
}

function InterviewSessionSkeleton() {
  return (
    <div
      className="container-page space-y-6 py-6 md:space-y-8 md:py-10"
      role="status"
      aria-label="Memuat sesi wawancara"
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-7 w-48 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
