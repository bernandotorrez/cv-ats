/**
 * /tryout/$examId/ujian — Halaman ujian (simulasi CAT BKN).
 *
 * Flow:
 * 1. Mount → tryout-start (auto-resume kalau ada attempt in_progress).
 * 2. Timer dari started_at server, dikoreksi selisih jam perangkat.
 * 3. Autosave: localStorage instan + RPC save_tryout_answers (debounce,
 *    retry otomatis, flush saat tab disembunyikan & sebelum submit).
 * 4. Submit manual atau otomatis saat waktu habis → halaman hasil.
 *
 * Pintasan keyboard: A–E / 1–5 pilih jawaban, ←/→ pindah soal,
 * R tandai ragu, Backspace hapus jawaban.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Cloud,
  Grid3X3,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { normalizeOptions } from "@/lib/tryout-options";
import { callTryoutFunction, TryoutApiError } from "@/lib/tryout-api";
import type {
  TryoutExamSet,
  TryoutQuestionPublic,
  TryoutRpcClient,
  TryoutStartResponse,
  TryoutSubmitResponse,
  TryoutSubtest,
} from "@/lib/tryout-types";
import { cn } from "@/lib/utils";

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

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const LOCAL_PREFIX = "tryout_state_v2_";
const SAVE_DEBOUNCE_MS = 1500;
const SAVE_RETRY_MS = 5000;
const WARN_AT_SECONDS = [600, 300, 60];

type LocalState = { answers: Record<string, string>; flagged: string[]; savedAt: number };

function TryoutExamPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { examId } = Route.useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examSet, setExamSet] = useState<TryoutExamSet | null>(null);
  const [questions, setQuestions] = useState<TryoutQuestionPublic[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(100);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  // Refs: selalu berisi state terbaru untuk autosave/submit di luar render.
  const answersRef = useRef(answers);
  const flaggedRef = useRef(flagged);
  const attemptIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const dirtyRef = useRef(false);
  const submittingRef = useRef(false);
  const initRef = useRef(false);
  const warnedRef = useRef(new Set<number>());

  const localKey = attemptId && user?.id ? `${LOCAL_PREFIX}${user.id}_${attemptId}` : null;

  // ─── 1. Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initRef.current || !user?.id) return;
    initRef.current = true;
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function init() {
    setLoading(true);
    setLoadError(null);
    try {
      const requestedAt = Date.now();
      const data = await callTryoutFunction<TryoutStartResponse>("tryout-start", {
        exam_set_id: examId,
      });
      const receivedAt = Date.now();
      if (data.server_now) {
        // Asumsi latensi simetris: jam server ≈ titik tengah request.
        const serverMs = new Date(data.server_now).getTime();
        const offset = serverMs - (requestedAt + receivedAt) / 2;
        // Abaikan selisih kecil (< 2 detik) agar timer tidak "melompat".
        setClockOffsetMs(Math.abs(offset) > 2000 ? offset : 0);
      }

      const qs = (data.questions || []).map((q) => ({
        ...q,
        options: normalizeOptions(q.options),
      }));
      const validIds = new Set(qs.map((q) => q.id));
      const local = user?.id ? readLocal(`${LOCAL_PREFIX}${user.id}_${data.attempt_id}`) : null;

      // Jawaban lokal (perangkat ini) lebih baru dari autosave server.
      const merged: Record<string, string> = {};
      for (const [k, v] of Object.entries({ ...(data.answers || {}), ...(local?.answers || {}) })) {
        if (validIds.has(k) && /^[A-E]$/.test(v)) merged[k] = v;
      }
      const mergedFlagged = (local?.flagged ?? data.flagged ?? []).filter((id) => validIds.has(id));

      attemptIdRef.current = data.attempt_id;
      answersRef.current = merged;
      flaggedRef.current = mergedFlagged;
      setAttemptId(data.attempt_id);
      setExamSet(data.exam_set);
      setQuestions(qs);
      setAnswers(merged);
      setFlagged(mergedFlagged);
      setDurationMinutes(data.duration_minutes);
      setStartedAt(data.started_at);

      // Lanjutkan dari soal kosong pertama saat resume.
      if (data.resumed) {
        const firstEmpty = qs.findIndex((q) => !merged[q.id]);
        setCurrentIndex(firstEmpty >= 0 ? firstEmpty : 0);
        toast.info("Melanjutkan ujian. Jawaban sebelumnya sudah dipulihkan.");
        // Sinkronkan jawaban lokal yang mungkin belum sempat tersimpan ke server.
        if (local && Object.keys(local.answers).length > Object.keys(data.answers || {}).length) {
          dirtyRef.current = true;
          scheduleSave(0);
        }
      }
    } catch (error) {
      if (error instanceof TryoutApiError && error.code === "NO_CREDITS") {
        toast.error(error.message);
        navigate({ to: "/tryout/beli" as never });
        return;
      }
      setLoadError(error instanceof Error ? error.message : "Gagal memulai tryout");
    } finally {
      setLoading(false);
    }
  }

  // ─── 2. Autosave ─────────────────────────────────────────────────────────
  const writeLocal = useCallback(() => {
    if (!localKey) return;
    try {
      const state: LocalState = {
        answers: answersRef.current,
        flagged: flaggedRef.current,
        savedAt: Date.now(),
      };
      localStorage.setItem(localKey, JSON.stringify(state));
    } catch {
      /* storage penuh / private mode — server autosave tetap jalan */
    }
  }, [localKey]);

  const saveNow = useCallback(async (): Promise<boolean> => {
    const id = attemptIdRef.current;
    if (!id) return false;
    if (saveInFlightRef.current) await saveInFlightRef.current;
    if (!dirtyRef.current) return true;
    dirtyRef.current = false;
    setSaveStatus("saving");
    const p = (async () => {
      try {
        const { data, error } = await (supabase as unknown as TryoutRpcClient).rpc(
          "save_tryout_answers",
          {
            p_attempt_id: id,
            p_answers: answersRef.current,
            p_flagged: flaggedRef.current,
          },
        );
        if (error) throw new Error(error.message);
        if (data === false) {
          // Attempt sudah selesai / lewat batas waktu — tidak perlu retry.
          setSaveStatus("error");
          return false;
        }
        setSaveStatus(dirtyRef.current ? "pending" : "saved");
        return true;
      } catch {
        dirtyRef.current = true;
        setSaveStatus("error");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => void saveNow(), SAVE_RETRY_MS);
        return false;
      }
    })();
    saveInFlightRef.current = p;
    const ok = await p;
    saveInFlightRef.current = null;
    return ok;
  }, []);

  const scheduleSave = useCallback(
    (delay = SAVE_DEBOUNCE_MS) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => void saveNow(), delay);
    },
    [saveNow],
  );

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus("pending");
    writeLocal();
    scheduleSave();
  }, [scheduleSave, writeLocal]);

  // Flush saat tab disembunyikan / koneksi kembali.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && dirtyRef.current) void saveNow();
    };
    const onOnline = () => {
      setOnline(true);
      if (dirtyRef.current) void saveNow();
    };
    const onOffline = () => setOnline(false);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [saveNow]);

  // ─── 3. Submit ───────────────────────────────────────────────────────────
  const goToResult = useCallback(
    (id: string) => {
      if (localKey) {
        try {
          localStorage.removeItem(localKey);
        } catch {
          /* ignore */
        }
      }
      navigate({
        to: "/tryout/$examId/hasil/$attemptId" as never,
        params: { examId, attemptId: id } as never,
        replace: true,
      });
    },
    [examId, localKey, navigate],
  );

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      const id = attemptIdRef.current;
      if (!id || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      // Simpan dulu lewat autosave: jika submit gagal karena jaringan saat waktu
      // habis, server tetap menilai jawaban yang sudah tersimpan.
      dirtyRef.current = true;
      await saveNow().catch(() => false);

      const maxTries = autoSubmit ? 4 : 1;
      for (let i = 0; i < maxTries; i++) {
        try {
          const data = await callTryoutFunction<TryoutSubmitResponse>(
            "tryout-submit",
            {
              attempt_id: id,
              answers: answersRef.current,
              flagged_questions: flaggedRef.current,
              auto_submit: autoSubmit,
            },
            { timeoutMs: 45_000 },
          );
          toast.success(
            data.answers_source === "autosave"
              ? "Waktu habis. Jawaban yang tersimpan telah dinilai."
              : autoSubmit
                ? "Waktu habis — ujian dikumpulkan otomatis."
                : "Ujian berhasil dikumpulkan!",
          );
          goToResult(id);
          return;
        } catch (error) {
          if (error instanceof TryoutApiError && error.status === 409) {
            goToResult(id); // sudah disubmit sebelumnya
            return;
          }
          const retryable =
            !(error instanceof TryoutApiError) || error.status === 0 || error.status >= 500;
          if (i < maxTries - 1 && retryable) {
            await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
            continue;
          }
          toast.error(
            error instanceof Error ? error.message : "Gagal mengumpulkan ujian. Coba lagi.",
            { duration: 8000 },
          );
        }
      }
      submittingRef.current = false;
      setSubmitting(false);
    },
    [goToResult, saveNow],
  );

  // ─── 4. Timer ────────────────────────────────────────────────────────────
  const timer = useTryoutTimer({
    startedAt,
    durationMinutes,
    clockOffsetMs,
    onExpire: () => {
      if (submittingRef.current) return;
      setConfirmOpen(false);
      toast.warning("Waktu habis! Ujian dikumpulkan otomatis…", { duration: 5000 });
      void handleSubmit(true);
    },
  });

  useEffect(() => {
    if (!startedAt) return;
    for (const t of WARN_AT_SECONDS) {
      if (
        timer.remainingSeconds <= t &&
        timer.remainingSeconds > t - 5 &&
        !warnedRef.current.has(t)
      ) {
        warnedRef.current.add(t);
        toast.warning(
          t >= 60 ? `Sisa waktu ${Math.round(t / 60)} menit.` : "Sisa waktu kurang dari 1 menit!",
        );
      }
    }
  }, [timer.remainingSeconds, startedAt]);

  useBeforeUnload({
    enabled: !!attemptId && !submitting,
    message: "Ujian sedang berlangsung. Timer tetap berjalan walau halaman ditutup.",
  });

  // ─── 5. Handlers ─────────────────────────────────────────────────────────
  const total = questions.length;
  const currentQuestion = questions[currentIndex];

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= total) return;
      setCurrentIndex(idx);
      setNavOpen(false);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [total],
  );

  const handleAnswer = useCallback(
    (questionId: string, key: string) => {
      if (submittingRef.current) return;
      const next = { ...answersRef.current, [questionId]: key };
      answersRef.current = next;
      setAnswers(next);
      markDirty();
    },
    [markDirty],
  );

  const handleClear = useCallback(
    (questionId: string) => {
      if (submittingRef.current || !answersRef.current[questionId]) return;
      const next = { ...answersRef.current };
      delete next[questionId];
      answersRef.current = next;
      setAnswers(next);
      markDirty();
    },
    [markDirty],
  );

  const handleToggleFlag = useCallback(
    (questionId: string) => {
      if (submittingRef.current) return;
      const prev = flaggedRef.current;
      const next = prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId];
      flaggedRef.current = next;
      setFlagged(next);
      markDirty();
    },
    [markDirty],
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentQuestion) return;
    const onKey = (e: KeyboardEvent) => {
      if (confirmOpen || navOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
        return;
      const k = e.key.toUpperCase();
      const keys = normalizeOptions(currentQuestion.options).map((o) => o.key);
      if (/^[A-E]$/.test(k) && keys.includes(k)) {
        e.preventDefault();
        handleAnswer(currentQuestion.id, k);
      } else if (/^[1-5]$/.test(k) && keys[Number(k) - 1]) {
        e.preventDefault();
        handleAnswer(currentQuestion.id, keys[Number(k) - 1]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(currentIndex - 1);
      } else if (k === "R") {
        e.preventDefault();
        handleToggleFlag(currentQuestion.id);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleClear(currentQuestion.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    confirmOpen,
    navOpen,
    currentQuestion,
    currentIndex,
    goTo,
    handleAnswer,
    handleClear,
    handleToggleFlag,
  ]);

  // Fullscreen (mode fokus)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  const perSubtest = useMemo(() => {
    const out: Record<TryoutSubtest, { total: number; answered: number; firstIndex: number }> = {
      twk: { total: 0, answered: 0, firstIndex: -1 },
      tiu: { total: 0, answered: 0, firstIndex: -1 },
      tkp: { total: 0, answered: 0, firstIndex: -1 },
    };
    questions.forEach((q, idx) => {
      const s = out[q.subtest];
      if (!s) return;
      s.total += 1;
      if (answers[q.id]) s.answered += 1;
      if (s.firstIndex < 0) s.firstIndex = idx;
    });
    return out;
  }, [questions, answers]);

  const answeredCount = perSubtest.twk.answered + perSubtest.tiu.answered + perSubtest.tkp.answered;
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const firstEmptyIndex = questions.findIndex((q) => !answers[q.id]);
  const flaggedSet = new Set(flagged);
  const firstFlaggedIndex = questions.findIndex((q) => flaggedSet.has(q.id));

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Menyiapkan ujian…</p>
          <p className="text-xs text-muted-foreground">
            Memuat soal & memulihkan jawaban tersimpan
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !examSet || questions.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          {loadError ? "Ujian Gagal Dimuat" : "Soal Tidak Tersedia"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {loadError || "Set tryout ini belum memiliki soal. Kredit kamu tidak terpakai."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link to={"/tryout" as never}>Kembali</Link>
          </Button>
          {loadError && (
            <Button
              onClick={() => {
                initRef.current = true;
                void init();
              }}
            >
              Coba lagi
            </Button>
          )}
        </div>
      </div>
    );
  }

  const activeSubtest = currentQuestion?.subtest ?? "twk";

  return (
    <>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container-page flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Kembali">
              <Link to={"/tryout" as never}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {examSet.name}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>
                  {answeredCount}/{total} dijawab
                </span>
                <SaveIndicator status={saveStatus} online={online} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => setShowShortcuts((v) => !v)}
              aria-label="Pintasan keyboard"
              title="Pintasan keyboard"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Keluar mode fokus" : "Mode fokus (layar penuh)"}
              title={isFullscreen ? "Keluar mode fokus" : "Mode fokus (layar penuh)"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <ExamTimer
              display={timer.display}
              isWarning={timer.isWarning}
              isCritical={timer.isCritical}
            />
          </div>
        </div>
        {/* Progress jawaban */}
        <div className="h-1 w-full bg-muted" aria-hidden>
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {!online && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          Koneksi terputus. Jawaban disimpan di perangkat dan akan dikirim otomatis saat online.
        </div>
      )}

      <div className="container-page space-y-4 py-4 pb-28 md:py-6 lg:pb-6">
        <SubtestTabs
          activeSubtest={activeSubtest}
          counts={{
            twk: perSubtest.twk,
            tiu: perSubtest.tiu,
            tkp: perSubtest.tkp,
          }}
          onChange={(s) => {
            const idx = perSubtest[s].firstIndex;
            if (idx >= 0) goTo(idx);
          }}
        />

        {showShortcuts && (
          <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Pintasan:</span> <Kbd>A</Kbd>–
            <Kbd>E</Kbd> pilih jawaban · <Kbd>←</Kbd> <Kbd>→</Kbd> pindah soal · <Kbd>R</Kbd> tandai
            ragu · <Kbd>Backspace</Kbd> hapus jawaban
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            {currentQuestion && (
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                displayNumber={currentIndex + 1}
                totalQuestions={total}
                selectedAnswer={answers[currentQuestion.id]}
                isFlagged={flaggedSet.has(currentQuestion.id)}
                onAnswer={(key) => handleAnswer(currentQuestion.id, key)}
                onClear={() => handleClear(currentQuestion.id)}
                onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
              />
            )}

            {/* Navigasi desktop */}
            <div className="mt-4 hidden items-center justify-between gap-2 lg:flex">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => goTo(currentIndex - 1)}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </Button>
              {currentIndex === total - 1 ? (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Send className="h-4 w-4" /> Kumpulkan Ujian
                </Button>
              ) : (
                <Button onClick={() => goTo(currentIndex + 1)} className="gap-1.5">
                  Selanjutnya <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar desktop */}
          <aside className="hidden space-y-4 lg:block">
            <div className="sticky top-24 space-y-4">
              <QuestionNavigation
                questions={questions}
                currentIndex={currentIndex}
                answers={answers}
                flagged={flagged}
                onJump={goTo}
              />
              <Button
                onClick={() => setConfirmOpen(true)}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Kumpulkan Ujian
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Jawaban tersimpan otomatis. Timer tetap berjalan walau halaman ditutup.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom bar mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="container-page grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2.5">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => goTo(currentIndex - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            variant="secondary"
            onClick={() => setNavOpen(true)}
            className="gap-1.5 px-3"
            aria-label="Buka daftar soal"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="tabular-nums">
              {currentIndex + 1}/{total}
            </span>
          </Button>
          {currentIndex === total - 1 ? (
            <Button
              onClick={() => setConfirmOpen(true)}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Kumpulkan <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => goTo(currentIndex + 1)} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Daftar Soal</SheetTitle>
          </SheetHeader>
          <QuestionNavigation
            className="mt-3 border-0 p-0 shadow-none"
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            flagged={flagged}
            onJump={goTo}
          />
          <Button
            onClick={() => {
              setNavOpen(false);
              setConfirmOpen(true);
            }}
            className="mt-4 w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            <Send className="h-4 w-4" /> Kumpulkan Ujian
          </Button>
        </SheetContent>
      </Sheet>

      <ExamConfirmDialog
        open={confirmOpen}
        perSubtest={perSubtest}
        flaggedCount={flagged.length}
        remainingLabel={timer.display}
        isSubmitting={submitting}
        onConfirm={() => void handleSubmit(false)}
        onCancel={() => setConfirmOpen(false)}
        onJumpFirstEmpty={
          firstEmptyIndex >= 0
            ? () => {
                setConfirmOpen(false);
                goTo(firstEmptyIndex);
              }
            : undefined
        }
        onJumpFirstFlagged={
          firstFlaggedIndex >= 0
            ? () => {
                setConfirmOpen(false);
                goTo(firstFlaggedIndex);
              }
            : undefined
        }
      />

      {submitting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Menilai jawaban kamu…</p>
          </div>
        </div>
      )}
    </>
  );
}

function SaveIndicator({ status, online }: { status: SaveStatus; online: boolean }) {
  if (!online) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <CloudOff className="h-3 w-3" /> Offline
      </span>
    );
  }
  const map: Record<SaveStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    idle: { icon: <Cloud className="h-3 w-3" />, label: "Siap", cls: "" },
    pending: { icon: <Cloud className="h-3 w-3" />, label: "Belum tersimpan", cls: "" },
    saving: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Menyimpan…", cls: "" },
    saved: {
      icon: <Check className="h-3 w-3" />,
      label: "Tersimpan",
      cls: "text-emerald-600 dark:text-emerald-400",
    },
    error: {
      icon: <CloudOff className="h-3 w-3" />,
      label: "Gagal simpan, mencoba lagi",
      cls: "text-amber-600 dark:text-amber-400",
    },
  };
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1", s.cls)} aria-live="polite">
      {s.icon}
      {s.label}
    </span>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
      {children}
    </kbd>
  );
}

function readLocal(key: string): LocalState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    if (!parsed || typeof parsed !== "object") return null;
    const answers: Record<string, string> = {};
    if (parsed.answers && typeof parsed.answers === "object") {
      for (const [k, v] of Object.entries(parsed.answers)) {
        if (typeof v === "string") answers[k] = v;
      }
    }
    const flagged = Array.isArray(parsed.flagged)
      ? parsed.flagged.filter((x): x is string => typeof x === "string")
      : [];
    return { answers, flagged, savedAt: Number(parsed.savedAt) || 0 };
  } catch {
    return null;
  }
}
