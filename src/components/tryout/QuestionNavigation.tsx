/**
 * QuestionNavigation — Sidebar navigasi nomor soal (mobile & desktop).
 * Dark mode & responsive support.
 */
import { cn } from "@/lib/utils";
import type { TryoutSubtest } from "@/lib/tryout-types";

export type QuestionNavStatus = "empty" | "answered" | "flagged" | "current";

type Props = {
  questions: Array<{ id: string; subtest: TryoutSubtest; question_number: number }>;
  currentIndex: number;
  answers: Record<string, string>;
  flagged: string[];
  onJump: (index: number) => void;
};

export function QuestionNavigation({
  questions,
  currentIndex,
  answers,
  flagged,
  onJump,
}: Props) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Navigasi Soal</h3>
        <span className="text-xs text-muted-foreground">
          {Object.keys(answers).length}/{questions.length}
        </span>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-2.5 text-[10px] font-medium text-muted-foreground sm:gap-3">
        <LegendDot color="bg-primary" label="Aktif" />
        <LegendDot color="bg-emerald-500" label="Dijawab" />
        <LegendDot color="bg-amber-400" label="Ragu" />
        <LegendDot color="bg-muted" label="Kosong" />
      </div>

      {/* Grid — 7 cols on mobile for compact view, more on larger screens */}
      <div className="grid grid-cols-7 gap-1 sm:grid-cols-8 md:grid-cols-7 lg:grid-cols-8">
        {questions.map((q, idx) => {
          const status: QuestionNavStatus =
            idx === currentIndex
              ? "current"
              : flagged.includes(q.id)
                ? "flagged"
                : answers[q.id]
                  ? "answered"
                  : "empty";

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(idx)}
              className={cn(
                "relative grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold transition sm:h-9 sm:w-9 sm:text-xs",
                status === "current"
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-1"
                  : status === "answered"
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : status === "flagged"
                      ? "bg-amber-400 text-amber-900 hover:bg-amber-500"
                      : "bg-muted text-foreground hover:bg-muted/70",
              )}
              aria-label={`Soal ${q.question_number}${status === "current" ? " (aktif)" : ""}`}
              aria-current={status === "current" ? "true" : undefined}
            >
              {q.question_number}
              {flagged.includes(q.id) && status !== "flagged" && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 border-t pt-3">
        <p className="text-[11px] text-muted-foreground">
          Kosong: {questions.length - Object.keys(answers).length} soal · Ragu:{" "}
          {flagged.length}
        </p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      <span>{label}</span>
    </div>
  );
}