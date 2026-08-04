/**
 * SubtestTabs — Tab untuk filter soal berdasarkan subtes (TWK/TIU/TKP).
 */
import { cn } from "@/lib/utils";
import type { TryoutSubtest } from "@/lib/tryout-types";
import { SUBTEST_INFO } from "@/lib/tryout-types";

type Props = {
  activeSubtest: TryoutSubtest | "all";
  counts: Record<TryoutSubtest | "all", { total: number; answered: number }>;
  onChange: (subtest: TryoutSubtest | "all") => void;
};

export function SubtestTabs({ activeSubtest, counts, onChange }: Props) {
  const tabs: Array<{ key: TryoutSubtest | "all"; label: string; fullName: string }> = [
    { key: "all", label: "Semua", fullName: "Semua Soal" },
    { key: "twk", label: "TWK", fullName: SUBTEST_INFO.twk.fullName },
    { key: "tiu", label: "TIU", fullName: SUBTEST_INFO.tiu.fullName },
    { key: "tkp", label: "TKP", fullName: SUBTEST_INFO.tkp.fullName },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border bg-card p-1 shadow-sm">
      {tabs.map((tab) => {
        const isActive = tab.key === activeSubtest;
        const count = counts[tab.key];
        const info = tab.key !== "all" ? SUBTEST_INFO[tab.key] : null;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            title={tab.fullName}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
              isActive
                ? info
                  ? info.color
                  : "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                isActive
                  ? "bg-white/25 text-current"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {count.answered}/{count.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}