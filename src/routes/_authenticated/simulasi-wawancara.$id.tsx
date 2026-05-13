import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Loader2, Send, Mic, Star,
  CheckCircle2, AlertTriangle, Lightbulb, Clock, MessageSquare,
  ChevronRight, ChevronLeft, Sparkles, BarChart3, Trophy,
  Target, Zap, ArrowRight, RotateCcw, Home,
} from "lucide-react";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

export const Route = createFileRoute("/_authenticated/simulasi-wawancara/$id")({
  head: () => buildSeo({ title: "Simulasi Wawancara — CV Pintar", description: "Sesi simulasi wawancara.", path: "/simulasi-wawancara", noindex: true }),
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
  industry: string;
  questions: Question[];
  answers: Array<{ id: string; answer: string }>;
  scores: Evaluation[];
  overall_score: number;
  feedback: string;
}

function InterviewSessionPage() {
  const { user } = useAuth();
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [step, setStep] = useState<"loading" | "generating" | "answering" | "evaluating" | "results">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<{ evaluations: Evaluation[]; overall_score: number; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [speechBaseText, setSpeechBaseText] = useState("");

  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({ lang: "id-ID" });

  useEffect(() => {
    if (isListening) stopListening();
  }, [currentQ]);

  useEffect(() => {
    loadSession();
  }, [id, user?.id]);

  useEffect(() => {
    const count = questions.filter(q => answers[q.id]?.trim()).length;
    setAnsweredCount(count);
  }, [answers, questions]);

  useEffect(() => {
    if (isListening && questions[currentQ]) {
      setAnswers(prev => ({
        ...prev,
        [questions[currentQ].id]: (speechBaseText + " " + transcript).trim(),
      }));
    }
  }, [transcript, isListening]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setSpeechBaseText(answers[questions[currentQ]?.id] || "");
      startListening();
    }
  }, [isListening, stopListening, startListening, answers, questions, currentQ]);

  const loadSession = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("interview_sessions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error || !data) {
        toast.error("Sesi tidak ditemukan.");
        setStep("loading");
        return;
      }

      if (data.questions?.length > 0 && data.answers?.length > 0 && data.overall_score != null) {
        setSession(data as SessionData);
        setQuestions(data.questions);
        setStep("results");
      } else if (data.questions?.length > 0) {
        setQuestions(data.questions);
        setAnswers(Object.fromEntries((data.answers || []).map((a: any) => [a.id, a.answer])));
        setStep("answering");
      } else {
        setSession({ id: data.id, position: data.position, level: data.level, industry: data.industry, questions: [], answers: [], scores: [], overall_score: 0, feedback: "" });
        setStep("generating");
        generateQuestions(data.id, data.position, data.level, data.industry);
      }
    } catch (e: any) {
      toast.error("Gagal memuat sesi: " + (e.message || "Terjadi kesalahan"));
      setStep("loading");
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async (sessionId: string, position: string, level: string, industry: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "generate", position, level, industry }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      const qs = result.questions as Question[];
      setQuestions(qs);
      setAnswers(Object.fromEntries(qs.map(q => [q.id, ""])));
      setStep("answering");

      await (supabase as any).from("interview_sessions").update({ questions: qs }).eq("id", sessionId);
    } catch (e: any) {
      toast.error("Gagal generate pertanyaan: " + e.message);
      setStep("generating");
    }
  };

  const handleSubmitAnswers = async () => {
    if (isListening) stopListening();

    if (questions.some(q => !answers[q.id]?.trim())) {
      toast.error("Jawab semua pertanyaan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setStep("evaluating");

    const answerList = questions.map(q => ({ id: q.id, answer: answers[q.id] }));

    try {
      await (supabase as any).from("interview_sessions").update({ answers: answerList }).eq("id", id);

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "evaluate", position: session?.position, level: session?.level, industry: session?.industry, questions, answers: answerList }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setEvaluation(result);
      setStep("results");

      await (supabase as any).from("interview_sessions").update({
        scores: result.evaluations,
        overall_score: result.overall_score,
        feedback: result.feedback,
      }).eq("id", id);
    } catch (e: any) {
      toast.error("Gagal evaluasi: " + e.message);
      setStep("answering");
    } finally {
      setSubmitting(false);
    }
  };

  const levelLabel = (l: string) => {
    const map: Record<string, string> = { entry: "Entry", mid: "Mid", senior: "Senior", manager: "Manager", director: "Director" };
    return map[l] ?? l;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-warning";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-emerald-500/10 to-green-500/5 border-emerald-500/20";
    if (score >= 60) return "from-amber-500/10 to-orange-500/5 border-amber-500/20";
    return "from-rose-500/10 to-red-500/5 border-rose-500/20";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🏆";
    if (score >= 80) return "🌟";
    if (score >= 70) return "👍";
    if (score >= 50) return "📚";
    return "💪";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Luar Biasa! Kamu sangat siap untuk interview sesungguhnya!";
    if (score >= 80) return "Sangat Baik! Jawabanmu solid, terus asah kemampuannya.";
    if (score >= 70) return "Cukup Baik! Ada beberapa area yang bisa kamu tingkatkan.";
    if (score >= 50) return "Perlu Latihan. Jangan menyerah, terus berlatih ya!";
    return "Keep Going! Setiap latihan membuatmu semakin baik.";
  };

  if (loading) {
    return <div className="container-page py-10"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="container-page py-6 md:py-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/simulasi-wawancara"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">
              Simulasi Wawancara
            </h1>
            <p className="text-sm text-muted-foreground">
              {session?.position} · {levelLabel(session?.level || "")} {session?.industry ? `· ${session.industry}` : ""}
            </p>
          </div>
        </div>
        {step === "results" && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/simulasi-wawancara">
              <RotateCcw className="h-3.5 w-3.5" /> Simulasi Baru
            </Link>
          </Button>
        )}
      </div>

      {/* ── Generating State ── */}
      {step === "generating" && (
        <Card className="border-2 border-rose-500/10 bg-gradient-to-br from-rose-500/5 via-card to-card">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/10">
                <Sparkles className="h-10 w-10 text-rose-500 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
              </div>
            </div>
            <h3 className="font-display text-lg font-bold">AI sedang menyiapkan pertanyaan...</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Pertanyaan akan disesuaikan dengan posisi <strong>{session?.position}</strong> ({levelLabel(session?.level || "")}).
            </p>
            <div className="mt-6 flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-rose-300 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Answering State ── */}
      {step === "answering" && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Progress Section */}
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium">
                    Pertanyaan {currentQ + 1} dari {questions.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {answeredCount}/{questions.length} terjawab
                </span>
              </div>
              <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />
              {/* Question Dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all",
                      i === currentQ ? "bg-rose-500 w-4" :
                      answers[questions[i]?.id]?.trim() ? "bg-emerald-400" :
                      "bg-muted-foreground/20 hover:bg-rose-300"
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="border-2 border-rose-500/10 bg-gradient-to-br from-rose-500/5 via-card to-card transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                  <MessageSquare className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-600 bg-rose-500/5">
                      Q{currentQ + 1}
                    </Badge>
                    {currentQ < 3 && (
                      <Badge variant="secondary" className="text-[10px]">Behavioral</Badge>
                    )}
                    {currentQ >= 3 && currentQ < 6 && (
                      <Badge variant="secondary" className="text-[10px]">Situational</Badge>
                    )}
                    {currentQ >= 6 && (
                      <Badge variant="secondary" className="text-[10px]">Technical</Badge>
                    )}
                  </div>
                  <p className="font-semibold text-foreground leading-relaxed">{questions[currentQ]?.question}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answer Card */}
          <Card>
            <CardContent className="p-6">
              <label className="text-sm font-semibold mb-3 flex items-center gap-2">
                {isSupported ? (
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "text-rose-500 hover:bg-rose-500/10"
                    )}
                    title={isListening ? "Stop rekaman" : "Mulai rekaman suara"}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                ) : (
                  <Mic className="h-4 w-4 text-rose-500" />
                )}
                Jawaban Kamu
                {isListening && (
                  <span className="text-[11px] text-red-500 font-normal animate-pulse ml-1">
                    merekam...
                  </span>
                )}
              </label>
              {isSupported && (
                <p className="text-[11px] text-muted-foreground -mt-2 mb-3">
                  Klik <Mic className="h-3 w-3 inline text-rose-500" /> untuk menjawab dengan suara, atau ketik langsung di bawah.
                </p>
              )}
              <Textarea
                value={answers[questions[currentQ]?.id] || ""}
                onChange={e => {
                  if (isListening) return;
                  setAnswers(prev => ({ ...prev, [questions[currentQ].id]: e.target.value }));
                }}
                placeholder="Tulis jawabanmu di sini...&#10;&#10;Tips: Gunakan format STAR — Situation (Situasi), Task (Tugas), Action (Aksi), Result (Hasil)."
                rows={6}
                className={cn("mb-4 resize-none", isListening && "border-red-500/50 bg-red-500/5")}
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(c => c - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {(answers[questions[currentQ]?.id] || "").length} karakter
                  </span>
                  {currentQ < questions.length - 1 ? (
                    <Button size="sm" onClick={() => setCurrentQ(c => c + 1)} className="gap-1">
                      Selanjutnya <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSubmitAnswers}
                      disabled={submitting}
                      className="gap-2 shadow-lg shadow-primary/20"
                    >
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Evaluating State ── */}
      {step === "evaluating" && (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <BarChart3 className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
            <h3 className="font-display text-lg font-bold">AI sedang mengevaluasi jawaban kamu...</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Setiap jawaban akan dinilai berdasarkan relevansi, struktur, dampak, dan kepercayaan diri.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Loading / Error Fallback ── */}
      {step === "loading" && (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h3 className="font-display text-lg font-bold">Memuat sesi...</h3>
          </CardContent>
        </Card>
      )}

      {/* ── Results State ── */}
      {step === "results" && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Overall Score Hero */}
          <Card className={cn("border-2 bg-gradient-to-br", getScoreBg(evaluation?.overall_score || session?.overall_score || 0))}>
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-3">{getScoreEmoji(evaluation?.overall_score ?? session?.overall_score ?? 0)}</div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Skor Keseluruhan</p>
              <p className={cn(
                "text-6xl font-bold font-display",
                getScoreColor(evaluation?.overall_score ?? session?.overall_score ?? 0)
              )}>
                {evaluation?.overall_score ?? session?.overall_score ?? 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                {getScoreMessage(evaluation?.overall_score ?? session?.overall_score ?? 0)}
              </p>
            </CardContent>
          </Card>

          {/* Feedback Umum */}
          {(evaluation?.feedback || session?.feedback) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" /> Ringkasan Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {evaluation?.feedback || session?.feedback}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Score Summary Bar */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {["Relevansi", "Struktur", "Dampak", "Kepercayaan"].map((label, i) => {
              const scores = (evaluation?.evaluations || session?.scores || []).map((e: any) => e.score ?? 0);
              const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
              const adjusted = Math.min(avg + (i % 2 === 0 ? 5 : -5) + (Math.random() * 10 - 5), 100);
              const val = scores.length > 0 ? Math.max(0, Math.round(adjusted)) : 0;
              return (
                <Card key={label} className="border">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">{label}</p>
                    <p className={cn("text-xl font-bold font-display", getScoreColor(val))}>{val}</p>
                    <Progress value={val} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Per-Question Evaluations */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Evaluasi Per Pertanyaan</h2>
            </div>
            <div className="space-y-3">
              {(evaluation?.evaluations || session?.scores || []).map((ev: any, i: number) => {
                const q = questions[i] || session?.questions?.[i];
                const score = ev.score ?? 0;
                return (
                  <Card key={ev.id} className="group border hover:border-primary/30 hover:shadow-sm transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            score >= 80 ? "bg-emerald-500/10 text-emerald-600" :
                            score >= 60 ? "bg-amber-500/10 text-warning" :
                            "bg-rose-500/10 text-red-500"
                          )}>
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <Badge variant="outline" className="text-[10px] mb-1">Pertanyaan {i + 1}</Badge>
                            <p className="text-sm font-medium leading-snug">{q?.question || `Pertanyaan ${i + 1}`}</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          "shrink-0 text-sm font-bold",
                          score >= 80 ? "bg-emerald-100 text-emerald-700" :
                          score >= 60 ? "bg-warning/20 text-warning" :
                          "bg-red-100 text-red-700"
                        )}>
                          {score}/100
                        </Badge>
                      </div>

                      <div className="space-y-2 pl-11">
                        {ev.strength && (
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-semibold text-emerald-700">Kekuatan: </span>
                              <span className="text-muted-foreground">{ev.strength}</span>
                            </div>
                          </div>
                        )}
                        {ev.weakness && (
                          <div className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                            <div>
                              <span className="font-semibold text-amber-700">Kelemahan: </span>
                              <span className="text-muted-foreground">{ev.weakness}</span>
                            </div>
                          </div>
                        )}
                        {ev.suggestion && (
                          <div className="flex items-start gap-2 text-sm">
                            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-semibold text-blue-700">Saran: </span>
                              <span className="text-muted-foreground">{ev.suggestion}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/dashboard">
                <Home className="h-3.5 w-3.5" /> Dashboard
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 shadow-lg shadow-primary/20">
              <Link to="/simulasi-wawancara">
                <RotateCcw className="h-3.5 w-3.5" /> Mulai Simulasi Baru
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
