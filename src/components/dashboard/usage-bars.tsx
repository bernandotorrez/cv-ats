import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface UsageBar {
  icon: LucideIcon;
  label: string;
  used: number;
  max: number | null;
  color: string;
  visible: boolean;
}

interface UsageBarsProps {
  bars: UsageBar[];
}

export function UsageBars({ bars }: UsageBarsProps) {
  const visibleBars = bars.filter((b) => b.visible);
  if (visibleBars.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visibleBars.map((bar) => {
        const pct = bar.max === null ? 100 : Math.min((bar.used / bar.max) * 100, 100);
        const isNearLimit = bar.max !== null && pct >= 80;
        const isUnlimited = bar.max === null;

        return (
          <article
            key={bar.label}
            className="rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    bar.color,
                  )}
                >
                  <bar.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{bar.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {isUnlimited
                      ? "Tanpa batas bulan ini"
                      : `${Math.max((bar.max ?? 0) - bar.used, 0)} sisa`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn("text-sm font-bold tabular-nums", isNearLimit && "text-amber-600")}
                >
                  {bar.used}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isUnlimited ? "unlimited" : `/ ${bar.max}`}
                </p>
              </div>
            </div>
            <Progress
              value={pct}
              className={cn("mt-4 h-2", isNearLimit && "[&>div]:bg-amber-500")}
            />
          </article>
        );
      })}
    </div>
  );
}
