import { Card, CardContent } from "@/components/ui/card";
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {visibleBars.map((bar) => {
        const pct = bar.max === null ? 100 : Math.min((bar.used / bar.max) * 100, 100);
        const isNearLimit = bar.max !== null && pct >= 80;
        const isUnlimited = bar.max === null;

        return (
          <Card key={bar.label} className="group relative overflow-hidden border transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bar.color)}>
                  <bar.icon className="h-4 w-4" />
                </div>
                {isUnlimited && (
                  <span className="text-[10px] font-bold text-primary">∞</span>
                )}
              </div>
              <p className="text-xs font-medium text-foreground">{bar.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={cn("text-lg font-bold tabular-nums", isNearLimit ? "text-warning" : "text-foreground")}>
                  {bar.used}
                </span>
                <span className="text-xs text-muted-foreground">
                  {bar.max === null ? "unlimited" : `/ ${bar.max}`}
                </span>
              </div>
              <Progress
                value={pct}
                className={cn("mt-2 h-1.5", isNearLimit && "[&>div]:bg-warning")}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
