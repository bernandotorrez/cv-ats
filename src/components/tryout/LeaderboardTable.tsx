/**
 * LeaderboardTable — Tabel leaderboard tryout per exam set.
 * Dark mode & responsive support.
 */
import { Trophy, Medal, Award, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { formatDuration } from "@/lib/tryout-scoring";
import { cn } from "@/lib/utils";

export type LeaderboardEntry = {
  ranking: number;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  exam_set_id: string;
  exam_name: string;
  score_total: number;
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  pass_overall: boolean;
  duration_seconds: number | null;
  finished_at: string | null;
};

type Props = {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  loading?: boolean;
  limit?: number;
};

export function LeaderboardTable({
  entries,
  currentUserId,
  loading = false,
  limit,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center sm:p-8">
        <Trophy className="mx-auto h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
        <h3 className="mt-3 font-display text-lg font-bold">Belum ada leaderboard</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Jadilah yang pertama menyelesaikan tryout untuk masuk papan peringkat!
        </p>
      </div>
    );
  }

  const displayEntries = limit ? entries.slice(0, limit) : entries;

  return (
    <div className="space-y-2">
      {displayEntries.map((entry) => {
        const isCurrentUser = entry.user_id === currentUserId;
        return (
          <div
            key={`${entry.user_id}-${entry.exam_set_id}`}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-md sm:gap-3 sm:p-4",
              isCurrentUser
                ? "border-primary bg-primary/5 ring-1 ring-primary/30 dark:bg-primary/10"
                : "border-border",
            )}
          >
            {/* Rank */}
            <div className="flex w-10 shrink-0 items-center justify-center sm:w-12">
              {entry.ranking === 1 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                  <Trophy className="h-5 w-5" />
                </div>
              ) : entry.ranking === 2 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400/10 text-slate-500 dark:text-slate-400">
                  <Medal className="h-5 w-5" />
                </div>
              ) : entry.ranking === 3 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600/10 text-orange-600">
                  <Award className="h-5 w-5" />
                </div>
              ) : (
                <span className="font-display text-base font-bold text-muted-foreground sm:text-lg">
                  #{entry.ranking}
                </span>
              )}
            </div>

            {/* Avatar + Info */}
            <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm sm:h-11 sm:w-11">
              <AvatarImage src={entry.avatar_url || ""} alt={entry.full_name || ""} />
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1 pl-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-bold text-foreground sm:text-sm">
                  {entry.full_name || "User CV Pintar"}
                </span>
                {isCurrentUser && (
                  <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                    Kamu
                  </span>
                )}
                {entry.pass_overall && (
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    LULUS
                  </span>
                )}
              </div>
              
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">TWK</span> {entry.score_twk}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">TIU</span> {entry.score_tiu}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">TKP</span> {entry.score_tkp}
                </div>
              </div>
              
              <div className="mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground/80 sm:text-[10px]">
                <span>{formatDuration(entry.duration_seconds)}</span>
                {entry.finished_at && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(entry.finished_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Total score */}
            <div className="shrink-0 text-right">
              <div className="font-display text-xl font-black text-primary sm:text-2xl drop-shadow-sm">
                {entry.score_total}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}