/**
 * QuestionCard — Kartu soal ujian + pilihan jawaban.
 * Dark mode & responsive support.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Flag, Check, X } from "lucide-react";
import type {
  TryoutQuestionFull,
  TryoutQuestionPublic,
} from "@/lib/tryout-types";

type QuestionProps = {
  question: TryoutQuestionPublic;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string;
  isFlagged?: boolean;
  onAnswer: (key: string) => void;
  onToggleFlag?: () => void;
};

type ResultProps = {
  question: TryoutQuestionFull;
  questionNumber: number;
  userAnswer?: string;
  showExplanation: boolean;
  isTkp?: boolean;
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  onAnswer,
  onToggleFlag,
}: QuestionProps) {
  const [imageExpanded, setImageExpanded] = useState(false);

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {questionNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            dari {totalQuestions} soal
          </span>
          {question.category && (
            <span className="hidden rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
              {question.category}
            </span>
          )}
        </div>
        {onToggleFlag && (
          <button
            type="button"
            onClick={onToggleFlag}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
              isFlagged
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                : "border-border bg-background text-muted-foreground hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
            )}
          >
            <Flag className={cn("h-3.5 w-3.5", isFlagged && "fill-current")} />
            <span className="hidden sm:inline">{isFlagged ? "Ditandai" : "Tandai Ragu"}</span>
            <span className="sm:hidden">{isFlagged ? "🚩" : "Ragu"}</span>
          </button>
        )}
      </div>

      {/* Image (optional) */}
      {question.question_image_url && (
        <button
          type="button"
          onClick={() => setImageExpanded(!imageExpanded)}
          className="mb-4 block max-w-full overflow-hidden rounded-lg border bg-muted/30"
        >
          <img
            src={question.question_image_url}
            alt="Gambar soal"
            className={cn(
              "w-full transition",
              imageExpanded ? "max-h-none" : "max-h-48 sm:max-h-64 object-contain",
            )}
          />
        </button>
      )}

      {/* Question text */}
      <div
        className="prose prose-sm dark:prose-invert mb-5 max-w-none text-foreground sm:mb-6 sm:text-base"
        dangerouslySetInnerHTML={{ __html: question.question_text }}
      />

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt) => {
          const selected = selectedAnswer === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onAnswer(opt.key)}
              className={cn(
                "group flex w-full items-start gap-2.5 rounded-xl border-2 p-3 text-left transition sm:gap-3 sm:p-3.5",
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
              <span className="flex-1 pt-1 text-sm leading-relaxed sm:pt-1.5 sm:text-base">
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

/**
 * QuestionResultCard — Menampilkan soal + jawaban benar + pembahasan.
 * Digunakan di halaman hasil.
 */
export function QuestionResultCard({
  question,
  questionNumber,
  userAnswer,
  showExplanation,
}: ResultProps) {
  const isCorrect = userAnswer === question.correct_answer;
  const hasUserAnswer = !!userAnswer;

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-sm font-bold text-foreground">
            {questionNumber}
          </span>
          {hasUserAnswer ? (
            isCorrect ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                Benar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                <X className="h-3 w-3" />
                Salah
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              Tidak dijawab
            </span>
          )}
          {question.category && (
            <span className="hidden rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
              {question.category}
            </span>
          )}
        </div>
      </div>

      <div
        className="prose prose-sm dark:prose-invert mb-5 max-w-none text-foreground sm:text-base"
        dangerouslySetInnerHTML={{ __html: question.question_text }}
      />

      <div className="space-y-2">
        {question.options.map((opt) => {
          const isUserChoice = userAnswer === opt.key;
          const isCorrectAnswer = question.correct_answer === opt.key;
          const isTkpQuestion = question.subtest === "tkp";

          let isHighest = false;
          if (isTkpQuestion && question.scores) {
            const maxScore = Math.max(...Object.values(question.scores));
            const optScore = question.scores[opt.key];
            isHighest = optScore === maxScore;
          }

          return (
            <div
              key={opt.key}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border-2 p-3 text-sm transition sm:gap-3 sm:p-3.5 sm:text-base",
                isCorrectAnswer
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : isUserChoice
                    ? "border-red-400 bg-red-50 dark:bg-red-950/40"
                    : "border-border bg-background",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold sm:h-9 sm:w-9",
                  isCorrectAnswer
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isUserChoice
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-border bg-background text-foreground",
                )}
              >
                {opt.key}
              </span>
              <div className="flex-1">
                <span className="block leading-relaxed">{opt.text}</span>
                {isTkpQuestion && question.scores && question.scores[opt.key] !== undefined && (
                  <span className="mt-1 inline-block text-[10px] font-medium text-muted-foreground">
                    Skor: {question.scores[opt.key]}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isCorrectAnswer && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Kunci
                  </span>
                )}
                {isUserChoice && !isCorrectAnswer && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                    Kamu
                  </span>
                )}
                {isTkpQuestion && isHighest && !isCorrectAnswer && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Skor Tertinggi
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showExplanation && question.explanation && (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 dark:bg-primary/10">
          <h4 className="mb-2 text-sm font-bold text-primary">Pembahasan</h4>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: question.explanation }}
          />
        </div>
      )}
    </article>
  );
}