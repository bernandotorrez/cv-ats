import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Infinity as InfinityIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
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

function getStatus(used: number, max: number | null) {
  if (max === null) return "unlimited";
  const pct = (used / max) * 100;
  if (pct >= 100) return "exhausted";
  if (pct >= 80) return "warning";
  return "ok";
}

export function UsageBars({ bars }: UsageBarsProps) {
  const visibleBars = bars.filter((b) => b.visible);
  if (visibleBars.length === 0) return null;

  const warningCount = visibleBars.filter((b) => b.max !== null && b.used / b.max >= 0.8).length;

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      {warningCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            {warningCount} kuota hampir habis — pertimbangkan upgrade
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-3">
        {visibleBars.map((bar) => {
          const status = getStatus(bar.used, bar.max);
          const pct = bar.max === null ? 100 : Math.min((bar.used / bar.max) * 100, 100);
          const remaining = bar.max === null ? null : Math.max(bar.max - bar.used, 0);

          return (
            <article
              key={bar.label}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-px",
                status === "exhausted" && "border-rose-300 bg-rose-50/40",
                status === "warning" && "border-amber-300 bg-amber-50/30",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Icon + label */}
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      status === "exhausted"
                        ? "bg-rose-100 text-rose-600"
                        : status === "warning"
                          ? "bg-amber-100 text-amber-600"
                          : bar.color,
                    )}
                  >
                    <bar.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{bar.label}</p>
                    <p
                      className={cn(
                        "text-xs",
                        status === "exhausted"
                          ? "text-rose-600 font-medium"
                          : status === "warning"
                            ? "text-amber-600 font-medium"
                            : "text-muted-foreground",
                      )}
                    >
                      {status === "unlimited"
                        ? "Tanpa batas bulan ini"
                        : status === "exhausted"
                          ? "Kuota habis"
                          : `${remaining} sisa bulan ini`}
                    </p>
                  </div>
                </div>

                {/* Counter */}
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      status === "exhausted"
                        ? "text-rose-600"
                        : status === "warning"
                          ? "text-amber-600"
                          : "text-foreground",
                    )}
                  >
                    {bar.used}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center justify-end gap-0.5">
                    {bar.max === null ? <InfinityIcon className="h-3 w-3" /> : `/ ${bar.max}`}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <Progress
                  value={pct}
                  className={cn(
                    "h-1.5",
                    status === "exhausted" && "[&>div]:bg-rose-500",
                    status === "warning" && "[&>div]:bg-amber-500",
                  )}
                />
              </div>

              {/* Status badge row */}
              {status !== "unlimited" && (
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      status === "exhausted"
                        ? "text-rose-600"
                        : status === "warning"
                          ? "text-amber-600"
                          : "text-muted-foreground/70",
                    )}
                  >
                    {Math.round(pct)}% digunakan
                  </span>
                  {status === "ok" && pct === 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Belum digunakan
                    </span>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
