/**
 * AttemptHistoryList — Daftar riwayat attempt user.
 * Dark mode & responsive support.
 */
import { Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/tryout-scoring";
import type { TryoutAttempt } from "@/lib/tryout-types";

type AttemptWithExam = TryoutAttempt & {
  exam_sets?: { id: string; slug: string; name: string } | null;
};

type Props = {
  attempts: AttemptWithExam[];
  emptyMessage?: string;
};

export function AttemptHistoryList({ attempts, emptyMessage }: Props) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 font-display text-lg font-bold">Belum ada riwayat</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {emptyMessage ?? "Kamu belum pernah mengerjakan tryout."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attempts.map((a) => {
        return (
          <Link
            key={a.id}
            to={"/tryout/$examId/hasil/$attemptId" as never}
            params={{
              examId: a.exam_set_id,
              attemptId: a.id,
            } as never}
            className="group flex items-center gap-2.5 rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm sm:gap-3 sm:p-4"
          >
            <div
              className={
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 " +
                (a.pass_overall
                  ? "bg-emerald-100 dark:bg-emerald-950/60"
                  : "bg-amber-100 dark:bg-amber-950/60")
              }
            >
              {a.pass_overall ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:h-5 sm:w-5" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-bold text-foreground">
                  {a.exam_sets?.name || "Tryout"}
                </h4>
                <Badge
                  variant={a.status === "completed" ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {a.status === "completed"
                    ? "Selesai"
                    : a.status === "timed_out"
                      ? "Waktu habis"
                      : a.status === "abandoned"
                        ? "Dibatalkan"
                        : "Berjalan"}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground sm:gap-3 sm:text-[11px]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(a.duration_seconds)}
                </span>
                <span>
                  {new Date(a.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="font-display text-lg font-bold text-primary sm:text-2xl">
                {a.score_total}
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">/550</span>
              </div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {a.pass_overall ? "Lulus" : "Belum lulus"}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}