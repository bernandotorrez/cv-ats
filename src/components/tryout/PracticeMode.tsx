/**
 * PracticeMode — Latihan ulang soal dari hasil tryout (tanpa kredit, tanpa
 * timer, tidak mengubah skor). Jawaban langsung dicek + pembahasan.
 *
 * Hanya tersedia untuk paket dengan pembahasan (kunci sudah dikirim server
 * ke halaman hasil). Tidak ada data yang disimpan ke server.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Dumbbell, RotateCcw, Shuffle, Trophy, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeTryoutHtml } from "@/lib/sanitize";
import {
  hasImageOptions,
  normalizeOptions,
  optionListClass,
  questionOutcome,
  safeTryoutImageUrl,
} from "@/lib/tryout-options";
import { OptionVisual } from "./OptionVisual";
import type {
  TryoutExplanationDetail,
  TryoutQuestionFull,
  TryoutQuestionPublic,
  TryoutSubtest,
} from "@/lib/tryout-types";
import { SUBTEST_INFO } from "@/lib/tryout-types";
import { ExplanationPanel } from "./ExplanationPanel";

type Q = TryoutQuestionPublic & Partial<TryoutQuestionFull>;
type Item = { q: Q; no: number };
type Source = "mistakes" | "flagged" | "all";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  answers: Record<string, string>;
  flagged: string[];
  attemptId: string;
  onDetailLoaded?: (questionId: string, detail: TryoutExplanationDetail) => void;
};

function isMistake(q: Q, answer?: string): boolean {
  const o = questionOutcome(
    { subtest: q.subtest, correct_answer: q.correct_answer ?? null },
    answer,
  );
  if (o === "empty" || o === "wrong") return true;
  if (o === "tkp") return (q.scores?.[answer as string] ?? 5) < 5;
  return false;
}

function isRight(q: Q, answer: string): boolean {
  if (q.subtest === "tkp") {
    const scores = q.scores ?? {};
    const max = Math.max(...Object.values(scores));
    return scores[answer] === max;
  }
  return answer === q.correct_answer;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PracticeMode({
  open,
  onOpenChange,
  items,
  answers,
  flagged,
  attemptId,
  onDetailLoaded,
}: Props) {
  const [phase, setPhase] = useState<"setup" | "run" | "done">("setup");
  const [source, setSource] = useState<Source>("mistakes");
  const [subtests, setSubtests] = useState<Record<TryoutSubtest, boolean>>({
    twk: true,
    tiu: true,
    tkp: true,
  });
  const [random, setRandom] = useState(false);
  const [queue, setQueue] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});

  const flaggedSet = useMemo(() => new Set(flagged), [flagged]);
  const pool = useMemo(
    () =>
      items.filter(({ q }) => {
        if (!subtests[q.subtest]) return false;
        if (source === "mistakes") return isMistake(q, answers[q.id]);
        if (source === "flagged") return flaggedSet.has(q.id);
        return true;
      }),
    [items, subtests, source, answers, flaggedSet],
  );

  useEffect(() => {
    if (!open) {
      setPhase("setup");
      setIndex(0);
      setPicked({});
    }
  }, [open]);

  function start(list: Item[]) {
    setQueue(random ? shuffle(list) : list);
    setIndex(0);
    setPicked({});
    setPhase("run");
  }

  const current = queue[index];
  const currentOptions = current ? normalizeOptions(current.q.options) : [];
  const currentImageMode = hasImageOptions(currentOptions);
  const currentPick = current ? picked[current.q.id] : undefined;

  function choose(key: string) {
    if (!current || currentPick) return;
    setPicked((p) => ({ ...p, [current.q.id]: key }));
  }

  function next() {
    if (index + 1 >= queue.length) setPhase("done");
    else setIndex((i) => i + 1);
  }

  // Keyboard: A–E pilih, Enter / → lanjut.
  useEffect(() => {
    if (!open || phase !== "run" || !current) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const k = e.key.toUpperCase();
      if (/^[A-E]$/.test(k)) {
        e.preventDefault();
        choose(k);
      } else if ((e.key === "Enter" || e.key === "ArrowRight") && currentPick) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, current, currentPick, index, queue.length]);

  const results = queue.map(({ q }) => ({
    q,
    pick: picked[q.id],
    right: picked[q.id] ? isRight(q, picked[q.id]) : false,
  }));
  const answeredCount = results.filter((r) => r.pick).length;
  const rightCount = results.filter((r) => r.right).length;
  const stillWrong = queue.filter(({ q }) => picked[q.id] && !isRight(q, picked[q.id]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> Mode Latihan
          </DialogTitle>
          <DialogDescription>
            Kerjakan ulang soal tanpa timer. Jawaban langsung dicek dan tidak mengubah skor tryout.
          </DialogDescription>
        </DialogHeader>

        {phase === "setup" && (
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold">Soal yang dilatih</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["mistakes", "Salah & kosong", "Termasuk TKP yang belum skor 5"],
                    ["flagged", "Ditandai ragu", "Soal yang kamu ragukan saat ujian"],
                    ["all", "Semua soal", "Ulang seluruh set"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSource(value)}
                    aria-pressed={source === value}
                    className={cn(
                      "rounded-xl border-2 p-3 text-left transition",
                      source === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-[11px] text-muted-foreground">{hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">Subtes</div>
              <div className="flex flex-wrap gap-2">
                {(["twk", "tiu", "tkp"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={subtests[s]}
                    onClick={() => setSubtests((v) => ({ ...v, [s]: !v[s] }))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-semibold transition",
                      subtests[s]
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {SUBTEST_INFO[s].label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={random}
                  onClick={() => setRandom((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition",
                    random
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Shuffle className="h-3.5 w-3.5" /> Acak urutan
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
              <span className="text-sm">
                <b>{pool.length}</b> soal siap dilatih
              </span>
              <Button onClick={() => start(pool)} disabled={pool.length === 0} className="gap-1.5">
                Mulai latihan <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {pool.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Tidak ada soal untuk pilihan ini — coba ganti sumber soal atau subtes. 🎉
              </p>
            )}
          </div>
        )}

        {phase === "run" && current && (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Soal {index + 1} dari {queue.length} · {SUBTEST_INFO[current.q.subtest].label} no.{" "}
                  {current.no}
                </span>
                <span>
                  Benar {rightCount}/{answeredCount}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((index + (currentPick ? 1 : 0)) / queue.length) * 100}%` }}
                />
              </div>
            </div>

            <div
              className="prose prose-sm max-w-none text-foreground dark:prose-invert sm:text-base"
              dangerouslySetInnerHTML={{ __html: sanitizeTryoutHtml(current.q.question_text) }}
            />

            {safeTryoutImageUrl(current.q.question_image_url) && (
              <img
                src={safeTryoutImageUrl(current.q.question_image_url)!}
                alt="Gambar soal"
                referrerPolicy="no-referrer"
                className="max-h-56 w-full rounded-lg border bg-white object-contain"
              />
            )}

            <div className={optionListClass(currentImageMode)} role="radiogroup">
              {currentOptions.map((o) => {
                const revealed = !!currentPick;
                const isPick = currentPick === o.key;
                const correct = revealed && isRight(current.q, o.key);
                const score = current.q.subtest === "tkp" ? current.q.scores?.[o.key] : undefined;
                return (
                  <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={isPick}
                    disabled={revealed}
                    onClick={() => choose(o.key)}
                    className={cn(
                      "flex w-full rounded-xl border-2 text-left text-sm transition sm:text-base",
                      currentImageMode
                        ? "flex-col items-center gap-1.5 p-2"
                        : "items-start gap-2.5 p-3",
                      !revealed && "border-border hover:border-primary/40 hover:bg-primary/5",
                      revealed &&
                        correct &&
                        "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
                      revealed &&
                        isPick &&
                        !correct &&
                        "border-red-400 bg-red-50 dark:bg-red-950/40",
                      revealed && !isPick && !correct && "border-border opacity-80",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 text-sm font-bold",
                        revealed && correct
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : revealed && isPick
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-border",
                      )}
                    >
                      {o.key}
                    </span>
                    {currentImageMode ? (
                      <OptionVisual opt={o} />
                    ) : (
                      <span className="flex-1 pt-1 leading-relaxed">{o.text}</span>
                    )}
                    {revealed && score != null && (
                      <span className="shrink-0 pt-1 text-xs font-bold text-muted-foreground">
                        {score} poin
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {currentPick && (
              <>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-3 text-sm font-semibold",
                    isRight(current.q, currentPick)
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
                  )}
                >
                  {isRight(current.q, currentPick) ? (
                    <>
                      <Check className="h-4 w-4" /> Tepat!
                      {answers[current.q.id] && answers[current.q.id] !== currentPick
                        ? " Kali ini kamu memperbaiki jawaban saat ujian."
                        : ""}
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      {current.q.subtest === "tkp"
                        ? `Belum paling ideal (skor ${current.q.scores?.[currentPick] ?? "-"}).`
                        : `Belum tepat. Kunci: ${current.q.correct_answer}.`}
                    </>
                  )}
                </div>
                <ExplanationPanel
                  key={current.q.id}
                  question={current.q}
                  attemptId={attemptId}
                  userAnswer={currentPick}
                  onDetailLoaded={onDetailLoaded}
                />
                <div className="flex justify-end">
                  <Button onClick={next} className="gap-1.5">
                    {index + 1 >= queue.length ? "Lihat hasil latihan" : "Soal berikutnya"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-5 py-2 text-center">
            <Trophy className="mx-auto h-12 w-12 text-amber-500" />
            <div>
              <div className="font-display text-3xl font-bold">
                {rightCount}/{queue.length}
              </div>
              <p className="text-sm text-muted-foreground">
                soal dijawab tepat (
                {queue.length ? Math.round((rightCount / queue.length) * 100) : 0}%)
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              {stillWrong.length > 0 && (
                <Button onClick={() => start(stillWrong)} className="gap-1.5">
                  <RotateCcw className="h-4 w-4" /> Ulangi {stillWrong.length} soal yang masih salah
                </Button>
              )}
              <Button variant="outline" onClick={() => setPhase("setup")}>
                Latihan lain
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Selesai
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
