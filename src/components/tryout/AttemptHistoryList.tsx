/**
 * AttemptHistoryList — Riwayat attempt: status, set, tanggal, durasi, skor
 * total + chip per subtes (warna lulus/belum lulus passing grade).
 */
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Clock, History, XCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/tryout-scoring";
import { formatDateId, type TryoutAttemptSummary } from "@/lib/tryout-display";
import { EmptyState } from "./TryoutLayout";

type Props = {
  attempts: TryoutAttemptSummary[];
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
};

export function AttemptHistoryList({ attempts, emptyMessage, emptyAction }: Props) {
  if (attempts.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6" aria-hidden />}
        title="Belum ada riwayat"
        description={emptyMessage ?? "Hasil setiap tryout yang kamu kerjakan akan muncul di sini."}
        action={emptyAction}
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {attempts.map((a) => {
        const running = a.status === "in_progress";
        const tone = running ? "sky" : a.pass_overall ? "emerald" : "amber";
        return (
          <li key={a.id}>
            <Link
              to={(running ? "/tryout/$examId/ujian" : "/tryout/$examId/hasil/$attemptId") as never}
              params={{ examId: a.exam_set_id, attemptId: a.id } as never}
              className="group flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:gap-4 sm:p-4"
            >
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                  tone === "sky" && "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
                  tone === "emerald" &&
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
                  tone === "amber" &&
                    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
                )}
                aria-hidden
              >
                {running ? (
                  <Clock className="h-5 w-5" />
                ) : a.pass_overall ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <h3 className="truncate text-sm font-bold text-foreground sm:text-base">
                    {a.exam_name || "Tryout SKD"}
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateId(a.finished_at ?? a.created_at)}
                    {!running &&
                      a.duration_seconds != null &&
                      ` · ${formatDuration(a.duration_seconds)}`}
                    {a.status === "timed_out" && " · waktu habis"}
                  </span>
                  {a.is_free && (
                    <span className="rounded-md bg-yellow-200 px-1.5 py-0.5 text-[10px] font-bold text-yellow-900 dark:bg-yellow-900/50 dark:text-yellow-200">
                      Gratis
                    </span>
                  )}
                </div>
                {running ? (
                  <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">
                    Sedang berjalan — jawaban tersimpan otomatis
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(
                      [
                        ["TWK", a.score_twk, a.pass_twk],
                        ["TIU", a.score_tiu, a.pass_tiu],
                        ["TKP", a.score_tkp, a.pass_tkp],
                      ] as const
                    ).map(([label, score, pass]) => (
                      <span
                        key={label}
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                          pass
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
                        )}
                        title={pass ? "Lulus passing grade" : "Belum lulus passing grade"}
                      >
                        {label} {score}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right">
                {running ? (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    <Play className="h-4 w-4" aria-hidden /> Lanjutkan
                  </span>
                ) : (
                  <>
                    <div className="font-display text-xl font-extrabold tabular-nums text-foreground sm:text-2xl">
                      {a.score_total}
                      <span className="text-xs font-medium text-muted-foreground">
                        /{a.max_total ?? 550}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-[11px] font-semibold",
                        a.pass_overall
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {a.pass_overall ? "Lulus PG" : "Belum lulus"}
                    </div>
                  </>
                )}
              </div>
              <ChevronRight
                className="hidden h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 sm:block"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
