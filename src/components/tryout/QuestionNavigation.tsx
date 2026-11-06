/**
 * QuestionNavigation — Grid nomor soal, dikelompokkan per subtes.
 * Dipakai di sidebar desktop dan di sheet (mobile).
 */
import { cn } from "@/lib/utils";
import type { TryoutSubtest } from "@/lib/tryout-types";
import { SUBTEST_INFO } from "@/lib/tryout-types";

export type QuestionNavStatus = "empty" | "answered" | "flagged" | "current";

type NavQuestion = { id: string; subtest: TryoutSubtest };

type Props = {
  questions: NavQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  flagged: string[];
  onJump: (index: number) => void;
  className?: string;
};

export function QuestionNavigation({
  questions,
  currentIndex,
  answers,
  flagged,
  onJump,
  className,
}: Props) {
  const flaggedSet = new Set(flagged);
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const groups = (["twk", "tiu", "tkp"] as const)
    .map((subtest) => ({
      subtest,
      items: questions.map((q, idx) => ({ q, idx })).filter(({ q }) => q.subtest === subtest),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={cn("rounded-2xl border bg-card p-3 shadow-sm sm:p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Navigasi Soal</h3>
        <span className="text-xs text-muted-foreground">
          {answeredCount}/{questions.length} dijawab
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2.5 text-[10px] font-medium text-muted-foreground sm:gap-3">
        <LegendDot color="bg-primary" label="Aktif" />
        <LegendDot color="bg-emerald-500" label="Dijawab" />
        <LegendDot color="bg-amber-400" label="Ragu" />
        <LegendDot color="bg-muted border" label="Kosong" />
      </div>

      <div className="space-y-3">
        {groups.map((g) => {
          const done = g.items.filter(({ q }) => answers[q.id]).length;
          return (
            <div key={g.subtest}>
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>
                  {SUBTEST_INFO[g.subtest].label}{" "}
                  <span className="font-normal">· {SUBTEST_INFO[g.subtest].fullName}</span>
                </span>
                <span>
                  {done}/{g.items.length}
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 lg:grid-cols-8">
                {g.items.map(({ q, idx }) => {
                  const isFlagged = flaggedSet.has(q.id);
                  const status: QuestionNavStatus =
                    idx === currentIndex
                      ? "current"
                      : isFlagged
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
                        "relative grid h-8 place-items-center rounded-md text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        status === "current"
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                          : status === "answered"
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : status === "flagged"
                              ? "bg-amber-400 text-amber-950 hover:bg-amber-500"
                              : "border bg-muted/60 text-foreground hover:bg-muted",
                      )}
                      aria-label={`Soal ${idx + 1}${answers[q.id] ? ", dijawab" : ", kosong"}${isFlagged ? ", ragu-ragu" : ""}`}
                      aria-current={status === "current" ? "step" : undefined}
                    >
                      {idx + 1}
                      {isFlagged && status !== "flagged" && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-1 ring-background" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">
        Kosong: {questions.length - answeredCount} · Ragu: {flagged.length}
      </p>
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
