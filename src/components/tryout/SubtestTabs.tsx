/**
 * SubtestTabs — Lompat ke awal subtes (TWK/TIU/TKP) + progres per subtes.
 * Tab aktif mengikuti subtes soal yang sedang dibuka.
 */
import { cn } from "@/lib/utils";
import type { TryoutSubtest } from "@/lib/tryout-types";
import { SUBTEST_INFO } from "@/lib/tryout-types";

type Props = {
  activeSubtest: TryoutSubtest;
  counts: Record<TryoutSubtest, { total: number; answered: number }>;
  onChange: (subtest: TryoutSubtest) => void;
};

export function SubtestTabs({ activeSubtest, counts, onChange }: Props) {
  const tabs = (["twk", "tiu", "tkp"] as const).filter((k) => counts[k].total > 0);

  return (
    <div
      className="grid gap-1 rounded-xl border bg-card p-1 shadow-sm"
      style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label="Subtes"
    >
      {tabs.map((key) => {
        const isActive = key === activeSubtest;
        const count = counts[key];
        const info = SUBTEST_INFO[key];
        const pct = count.total > 0 ? Math.round((count.answered / count.total) * 100) : 0;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            title={`${info.fullName} — lompat ke soal pertama`}
            className={cn(
              "relative overflow-hidden rounded-lg px-2 py-1.5 text-left transition sm:px-3",
              isActive
                ? cn(info.color, "border dark:bg-muted")
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold sm:text-sm">{info.label}</span>
              <span className="text-[10px] font-semibold tabular-nums sm:text-xs">
                {count.answered}/{count.total}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-current opacity-60"
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
