/**
 * ScoreBreakdown — Analisis detail skor per kategori soal.
 * Dark mode support.
 */
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TryoutAttemptStats } from "@/lib/tryout-types";

type Props = {
  stats: TryoutAttemptStats;
};

export function ScoreBreakdown({ stats }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-bold sm:text-lg">Analisis Per Kategori</h3>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <SubtestBreakdown title="TWK" color="amber" stats={stats.twk} maxScore={150} type="binary" />
        <SubtestBreakdown title="TIU" color="sky" stats={stats.tiu} maxScore={175} type="binary" />
        <SubtestBreakdown title="TKP" color="emerald" stats={stats.tkp} maxScore={225} type="tkp" />
      </div>
    </div>
  );
}

function SubtestBreakdown({
  title,
  color,
  stats,
  maxScore,
  type,
}: {
  title: string;
  color: "amber" | "sky" | "emerald";
  stats: TryoutAttemptStats[keyof TryoutAttemptStats];
  maxScore: number;
  type: "binary" | "tkp";
}) {
  if (!stats) return null;

  const colorClass = {
    amber: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800",
    sky: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950/40 dark:border-sky-800",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800",
  }[color];

  const byCategory = stats.by_category || {};
  const categories = Object.entries(byCategory);

  return (
    <div className={cn("rounded-xl border p-3 sm:p-4", colorClass)}>
      <div className="flex items-center justify-between">
        <h4 className="font-bold">{title}</h4>
        {type === "binary" && "correct" in stats && (
          <div className="text-sm">
            <span className="font-bold">{stats.correct}</span>
            <span className="text-muted-foreground">/{stats.answered} benar</span>
          </div>
        )}
        {type === "tkp" && "answered" in stats && (
          <div className="text-sm">
            <span className="font-bold">{stats.answered}</span>
            <span className="text-muted-foreground">/{maxScore / 5} dijawab</span>
          </div>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">Tidak ada data.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {categories.map(([cat, data]) => {
            const total = type === "binary" ? (data as any).total : (data as any).total;
            const score =
              type === "binary" ? (data as any).correct : (data as any).score;
            const max = type === "binary" ? total : total * 5;
            const pct = Math.round((score / max) * 100);
            return (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{cat}</span>
                  <span className="font-bold">
                    {score}
                    <span className="font-normal text-muted-foreground">/{max}</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-background/60 dark:bg-background/30">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      pct >= 70
                        ? "bg-emerald-500"
                        : pct >= 40
                          ? "bg-amber-500"
                          : "bg-red-500",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}