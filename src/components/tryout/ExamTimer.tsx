/**
 * ExamTimer — Countdown timer ujian dengan warning states.
 */
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  display: string;
  isWarning: boolean;
  isCritical: boolean;
};

export function ExamTimer({ display, isWarning, isCritical }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border-2 px-3 py-2 font-mono text-lg font-bold transition-colors",
        isCritical
          ? "border-red-500 bg-red-50 text-red-700 animate-pulse dark:bg-red-950/60 dark:text-red-400"
          : isWarning
            ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
            : "border-primary/30 bg-primary/5 text-primary dark:bg-primary/10",
      )}
      role="timer"
      aria-live="polite"
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span>{display}</span>
    </div>
  );
}