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
              "flex items-center gap-2.5 rounded-xl border bg-card p-2.5 transition sm:gap-3 sm:p-3 md:p-4",
              isCurrentUser
                ? "border-primary bg-primary/5 ring-1 ring-primary/30 dark:bg-primary/10"
                : "border-border",
            )}
          >
            {/* Rank */}
            <div className="flex w-10 shrink-0 items-center justify-center sm:w-12">
              {entry.ranking === 1 ? (
                <Trophy className="h-5 w-5 text-amber-500 sm:h-6 sm:w-6" />
              ) : entry.ranking === 2 ? (
                <Medal className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" />
              ) : entry.ranking === 3 ? (
                <Award className="h-5 w-5 text-orange-600 sm:h-6 sm:w-6" />
              ) : (
                <span className="font-display text-base font-bold text-muted-foreground sm:text-lg">
                  #{entry.ranking}
                </span>
              )}
            </div>

            {/* Avatar + Name */}
            <Avatar className="h-8 w-8 shrink-0 sm:h-9 sm:w-9">
              <AvatarImage src={entry.avatar_url || ""} alt={entry.full_name || ""} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                  {entry.full_name || "User CV Pintar"}
                </span>
                {isCurrentUser && (
                  <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    Kamu
                  </span>
                )}
                {entry.pass_overall && (
                  <span className="hidden rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 sm:inline">
                    LULUS
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground sm:text-[11px]">
                {formatDuration(entry.duration_seconds)}
                {entry.finished_at && (
                  <span className="ml-2">
                    {new Date(entry.finished_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Score breakdown — hidden on mobile */}
            <div className="hidden text-right text-[11px] sm:block">
              <div className="font-bold text-foreground">
                TWK {entry.score_twk} · TIU {entry.score_tiu} · TKP {entry.score_tkp}
              </div>
            </div>

            {/* Total score */}
            <div className="shrink-0 text-right">
              <div className="font-display text-lg font-bold text-primary sm:text-xl">
                {entry.score_total}
              </div>
              <div className="text-[10px] text-muted-foreground">/ 550</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}