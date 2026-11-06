/**
 * ExamTimer — Countdown timer ujian dengan warning states.
 * Pembaca layar hanya diberi tahu saat status berubah (bukan tiap detik).
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
        "flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 font-mono text-base font-bold tabular-nums transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-lg",
        isCritical
          ? "animate-pulse border-red-500 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
          : isWarning
            ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
            : "border-primary/30 bg-primary/5 text-primary dark:bg-primary/10",
      )}
      role="timer"
      aria-label={`Sisa waktu ${display}`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
      <span>{display}</span>
      <span className="sr-only" aria-live="assertive">
        {isCritical ? "Waktu kurang dari satu menit" : isWarning ? "Waktu hampir habis" : ""}
      </span>
    </div>
  );
}
