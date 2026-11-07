/**
 * QuestionCard — Kartu soal ujian + pilihan jawaban.
 * QuestionResultCard — Soal + kunci/skor TKP + pembahasan (halaman hasil).
 *
 * Aksesibel: pilihan berupa radiogroup, bisa dipilih dengan keyboard
 * (A–E diatur di halaman ujian), dark mode & responsive.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeTryoutHtml } from "@/lib/sanitize";
import { Flag, Check, X, Eraser, Star, AlertOctagon } from "lucide-react";
import type {
  TryoutExplanationDetail,
  TryoutQuestionFull,
  TryoutQuestionPublic,
} from "@/lib/tryout-types";
import { SUBTEST_INFO } from "@/lib/tryout-types";
import { DIFFICULTY_LABEL } from "@/lib/tryout-analysis";
import {
  hasImageOptions,
  normalizeOptions,
  optionListClass,
  questionOutcome,
  safeTryoutImageUrl,
} from "@/lib/tryout-options";
import { OptionVisual } from "./OptionVisual";
import { ExplanationPanel } from "./ExplanationPanel";
import { ReportQuestionDialog } from "./ReportQuestionDialog";

type QuestionProps = {
  question: TryoutQuestionPublic;
  displayNumber: number;
  totalQuestions: number;
  selectedAnswer?: string;
  isFlagged?: boolean;
  onAnswer: (key: string) => void;
  onClear?: () => void;
  onToggleFlag?: () => void;
};

export function QuestionCard({
  question,
  displayNumber,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  onAnswer,
  onClear,
  onToggleFlag,
}: QuestionProps) {
  const [imageExpanded, setImageExpanded] = useState(false);
  const options = normalizeOptions(question.options);
  const imageMode = hasImageOptions(options);
  const questionImage = safeTryoutImageUrl(question.question_image_url);
  const info = SUBTEST_INFO[question.subtest];

  return (
    <article
      className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5 md:p-6"
      aria-labelledby={`q-${question.id}-title`}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            id={`q-${question.id}-title`}
            className="grid h-9 min-w-9 place-items-center rounded-lg bg-primary px-2 text-sm font-bold text-primary-foreground"
          >
            {displayNumber}
          </span>
          <span className="text-xs text-muted-foreground">dari {totalQuestions}</span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[11px] font-bold",
              info.color,
              "dark:bg-transparent",
            )}
          >
            {info.label}
          </span>
          {question.category && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {question.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {onClear && selectedAnswer && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
              title="Hapus jawaban (Backspace)"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}
          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              aria-pressed={!!isFlagged}
              title="Tandai ragu-ragu (R)"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                isFlagged
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  : "border-border bg-background text-muted-foreground hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
              )}
            >
              <Flag className={cn("h-3.5 w-3.5", isFlagged && "fill-current")} />
              {isFlagged ? "Ragu-ragu" : "Tandai Ragu"}
            </button>
          )}
        </div>
      </div>

      <div
        className="prose prose-sm mb-5 max-w-none select-none text-foreground dark:prose-invert sm:mb-6 sm:text-base"
        dangerouslySetInnerHTML={{ __html: sanitizeTryoutHtml(question.question_text) }}
      />

      {questionImage && (
        <button
          type="button"
          onClick={() => setImageExpanded(!imageExpanded)}
          className="mb-4 block max-w-full overflow-hidden rounded-lg border bg-muted/30"
          aria-label={imageExpanded ? "Perkecil gambar soal" : "Perbesar gambar soal"}
        >
          <img
            src={questionImage}
            alt="Gambar soal"
            loading="lazy"
            referrerPolicy="no-referrer"
            draggable={false}
            className={cn(
              "w-full select-none bg-white transition",
              imageExpanded ? "max-h-none" : "max-h-48 object-contain sm:max-h-64",
            )}
          />
        </button>
      )}

      <div
        role="radiogroup"
        aria-labelledby={`q-${question.id}-title`}
        className={optionListClass(imageMode)}
      >
        {options.map((opt) => {
          const selected = selectedAnswer === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onAnswer(opt.key)}
              className={cn(
                "group flex w-full rounded-xl border-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                imageMode
                  ? "flex-col items-center gap-1.5 p-2"
                  : "items-start gap-2.5 p-3 sm:gap-3 sm:p-3.5",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10"
                  : "border-border bg-background hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold transition sm:h-9 sm:w-9",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground group-hover:border-primary",
                )}
              >
                {opt.key}
              </span>
              {imageMode ? (
                <OptionVisual opt={opt} />
              ) : (
                <span className="flex-1 select-none pt-1 text-sm leading-relaxed sm:pt-1.5 sm:text-base">
                  {opt.text}
                </span>
              )}
              {selected && !imageMode && (
                <Check className="mt-1.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}

type ResultProps = {
  question: TryoutQuestionPublic & Partial<TryoutQuestionFull>;
  displayNumber: number;
  userAnswer?: string;
  isFlagged?: boolean;
  showExplanation: boolean;
  /** Untuk memuat pembahasan detail (entitlement dicek server). */
  attemptId?: string;
  onDetailLoaded?: (questionId: string, detail: TryoutExplanationDetail) => void;
  /** Tampilkan tombol "Laporkan soal". */
  canReport?: boolean;
};

export function QuestionResultCard({
  question,
  displayNumber,
  userAnswer,
  isFlagged,
  showExplanation,
  attemptId,
  onDetailLoaded,
  canReport,
}: ResultProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const options = normalizeOptions(question.options);
  const imageMode = hasImageOptions(options);
  const questionImage = safeTryoutImageUrl(question.question_image_url);
  const isTkp = question.subtest === "tkp";
  const scores = question.scores ?? null;
  const maxScore = scores ? Math.max(...Object.values(scores)) : null;
  const userScore = isTkp && userAnswer && scores ? scores[userAnswer] : null;
  const outcome = questionOutcome(
    { subtest: question.subtest, correct_answer: question.correct_answer ?? null },
    userAnswer,
  );

  return (
    <article
      id={`hasil-${question.id}`}
      className="scroll-mt-24 rounded-2xl border bg-card p-4 shadow-sm sm:p-5 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-muted px-2 text-sm font-bold text-foreground">
          {displayNumber}
        </span>
        {outcome === "correct" && (
          <Pill className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Check className="h-3 w-3" /> Benar · +5
          </Pill>
        )}
        {outcome === "wrong" && (
          <Pill className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
            <X className="h-3 w-3" /> Salah · 0
          </Pill>
        )}
        {outcome === "empty" && (
          <Pill className="bg-muted text-muted-foreground">Tidak dijawab · 0</Pill>
        )}
        {outcome === "tkp" && userScore != null && (
          <Pill
            className={cn(
              userScore >= 5
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : userScore >= 4
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
            )}
          >
            <Star className="h-3 w-3" /> Skor {userScore}/{maxScore ?? 5}
          </Pill>
        )}
        {isFlagged && (
          <Pill className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <Flag className="h-3 w-3 fill-current" /> Ragu
          </Pill>
        )}
        {question.category && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {question.category}
          </span>
        )}
        {question.difficulty && (
          <span className="text-[11px] text-muted-foreground">
            · {DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}
          </span>
        )}
      </div>

      <div
        className="prose prose-sm mb-5 max-w-none text-foreground dark:prose-invert sm:text-base"
        dangerouslySetInnerHTML={{ __html: sanitizeTryoutHtml(question.question_text) }}
      />

      {questionImage && (
        <img
          src={questionImage}
          alt="Gambar soal"
          loading="lazy"
          referrerPolicy="no-referrer"
          className="mb-5 max-h-64 w-full rounded-lg border bg-white object-contain"
        />
      )}

      <div className={optionListClass(imageMode)}>
        {options.map((opt) => {
          const isUserChoice = userAnswer === opt.key;
          const optScore = scores?.[opt.key];
          const isKey = isTkp
            ? optScore != null && optScore === maxScore
            : question.correct_answer === opt.key;
          const isWrongChoice = isUserChoice && !isKey && !isTkp;

          return (
            <div
              key={opt.key}
              className={cn(
                "flex rounded-xl border-2 text-sm sm:text-base",
                imageMode
                  ? "flex-col items-center gap-1.5 p-2"
                  : "items-start gap-2.5 p-3 sm:gap-3 sm:p-3.5",
                isKey
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : isWrongChoice
                    ? "border-red-400 bg-red-50 dark:bg-red-950/40"
                    : isUserChoice
                      ? "border-sky-400 bg-sky-50 dark:bg-sky-950/40"
                      : "border-border bg-background",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold sm:h-9 sm:w-9",
                  isKey
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isWrongChoice
                      ? "border-red-500 bg-red-500 text-white"
                      : isUserChoice
                        ? "border-sky-500 bg-sky-500 text-white"
                        : "border-border bg-background text-foreground",
                )}
              >
                {opt.key}
              </span>
              {imageMode ? (
                <OptionVisual opt={opt} />
              ) : (
                <span className="flex-1 pt-1 leading-relaxed">{opt.text}</span>
              )}
              <div
                className={cn(
                  "flex shrink-0 gap-1",
                  imageMode ? "flex-col items-center" : "flex-col items-end pt-1",
                )}
              >
                {isTkp && optScore != null && (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      isKey ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {optScore} poin
                  </span>
                )}
                {isKey && !isTkp && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Kunci
                  </span>
                )}
                {isUserChoice && (
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide",
                      isWrongChoice
                        ? "text-red-700 dark:text-red-400"
                        : isKey
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-sky-700 dark:text-sky-400",
                    )}
                  >
                    Jawabanmu
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showExplanation && (
        <ExplanationPanel
          question={question}
          attemptId={attemptId}
          userAnswer={userAnswer}
          onDetailLoaded={onDetailLoaded}
        />
      )}

      {canReport && (
        <>
          <div className="mt-3 flex justify-end print:hidden">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
            >
              <AlertOctagon className="h-3.5 w-3.5" /> Laporkan soal
            </button>
          </div>
          <ReportQuestionDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            questionId={question.id}
            displayNumber={displayNumber}
          />
        </>
      )}
    </article>
  );
}

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold",
        className,
      )}
    >
      {children}
    </span>
  );
}
