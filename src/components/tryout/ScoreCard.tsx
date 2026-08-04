/**
 * ScoreCard — Kartu skor utama + status kelulusan.
 * Dark mode & responsive support.
 */
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Trophy, AlertTriangle } from "lucide-react";

type Props = {
  total: number;
  maxTotal: number;
  twk: number;
  tiu: number;
  tkp: number;
  passOverall: boolean;
  passTwk: boolean;
  passTiu: boolean;
  passTkp: boolean;
  passingGrade: { twk: number; tiu: number; tkp: number };
};

export function ScoreCard({
  total,
  maxTotal,
  twk,
  tiu,
  tkp,
  passOverall,
  passTwk,
  passTiu,
  passTkp,
  passingGrade,
}: Props) {
  const percent = Math.round((total / maxTotal) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        className={cn(
          "px-5 py-6 text-center sm:px-6 sm:py-8",
          passOverall
            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
            : "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
        )}
      >
        {passOverall ? (
          <Trophy className="mx-auto mb-2 h-10 w-10 sm:h-12 sm:w-12" />
        ) : (
          <AlertTriangle className="mx-auto mb-2 h-10 w-10 sm:h-12 sm:w-12" />
        )}
        <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
          Status Kelulusan
        </div>
        <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl md:text-4xl">
          {passOverall ? "LULUS" : "BELUM LULUS"}
        </h2>
        <p className="mt-2 text-xs opacity-90 sm:text-sm">
          {passOverall
            ? "Selamat! Kamu lulus semua subtes passing grade."
            : "Ada subtes yang belum memenuhi passing grade."}
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6">
        <SubtestScore
          label="TWK"
          fullName="Wawasan Kebangsaan"
          score={twk}
          max={150}
          passing={passingGrade.twk}
          passed={passTwk}
        />
        <SubtestScore
          label="TIU"
          fullName="Intelegensi Umum"
          score={tiu}
          max={175}
          passing={passingGrade.tiu}
          passed={passTiu}
        />
        <SubtestScore
          label="TKP"
          fullName="Karakteristik Pribadi"
          score={tkp}
          max={225}
          passing={passingGrade.tkp}
          passed={passTkp}
        />
      </div>

      <div className="border-t bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Total Skor</span>
          <span className="font-display text-xl font-bold text-foreground sm:text-2xl">
            {total} <span className="text-sm font-medium text-muted-foreground">/ {maxTotal}</span>
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all",
              passOverall ? "bg-emerald-500" : "bg-amber-500",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-1 text-right text-xs font-medium text-muted-foreground">
          {percent}% dari skor maksimal
        </div>
      </div>
    </div>
  );
}

function SubtestScore({
  label,
  fullName,
  score,
  max,
  passing,
  passed,
}: {
  label: string;
  fullName: string;
  score: number;
  max: number;
  passing: number;
  passed: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-3 sm:p-4",
        passed
          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40"
          : "border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/40",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="text-[11px] text-muted-foreground">{fullName}</div>
        </div>
        {passed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}
      </div>
      <div className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
        {score}{" "}
        <span className="text-xs font-medium text-muted-foreground sm:text-sm">/ {max}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Passing grade: {passing}
      </div>
      <div
        className={cn(
          "mt-2 text-xs font-bold uppercase tracking-wide",
          passed ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
        )}
      >
        {passed ? "✓ Lulus" : "✗ Tidak lulus"}
      </div>
    </div>
  );
}