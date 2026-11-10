/**
 * LeaderboardTable — Papan peringkat tryout.
 * - variant "compact": daftar ringkas untuk sidebar dashboard.
 * - variant "full": podium top-3 + daftar peringkat berikutnya.
 * Nama sudah disamarkan server; avatar hanya dari host tepercaya.
 * `is_me` = baris milik user yang sedang login.
 */
import { Link } from "@tanstack/react-router";
import { Award, Crown, Lock, Medal, Trophy, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/tryout-scoring";
import { safeAvatarUrl } from "@/lib/tryout-display";
import { EmptyState } from "./TryoutLayout";
import { LeaderboardSkeleton } from "./skeletons";

export type LeaderboardEntry = {
  ranking: number;
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
  is_me: boolean;
};

type Props = {
  entries: LeaderboardEntry[];
  loading?: boolean;
  limit?: number;
  /** User belum punya paket dengan akses leaderboard. */
  locked?: boolean;
  variant?: "compact" | "full";
  /** Tampilkan nama set (saat menampilkan semua set sekaligus). */
  showExamName?: boolean;
};

export function LeaderboardTable({
  entries,
  loading = false,
  limit,
  locked = false,
  variant = "full",
  showExamName = false,
}: Props) {
  const compact = variant === "compact";

  if (loading) {
    return <LeaderboardSkeleton rows={limit ?? 6} compact={compact} podium={!compact} />;
  }

  if (locked) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <Lock className="h-6 w-6" aria-hidden />
        </span>
        <h3 className="mt-3 font-display text-base font-bold">Leaderboard terkunci</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          Leaderboard terbuka setelah kamu membeli paket tryout apa pun, termasuk Tryout Satuan.
        </p>
        <Button asChild size="sm" className="mt-4 rounded-lg">
          <Link to={"/tryout/beli" as never}>Lihat Paket Tryout</Link>
        </Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-6 w-6" aria-hidden />}
        title="Belum ada peringkat"
        description="Selesaikan tryout untuk jadi yang pertama di papan peringkat."
      />
    );
  }

  const list = limit ? entries.slice(0, limit) : entries;

  if (compact) {
    return (
      <ol className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        {list.map((e, i) => (
          <li
            key={`${e.exam_set_id}-${e.ranking}-${i}`}
            className={cn("flex items-center gap-3 px-3 py-2.5", e.is_me && "bg-primary/5")}
          >
            <RankBadge rank={e.ranking} small />
            <PersonAvatar entry={e} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {e.full_name || "Pejuang SKD"}
                {e.is_me && <MeTag />}
              </p>
              {showExamName && (
                <p className="truncate text-[11px] text-muted-foreground">{e.exam_name}</p>
              )}
            </div>
            <span className="font-display text-base font-extrabold tabular-nums text-primary">
              {e.score_total}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  // Podium hanya bila 3 teratas berada di set yang sama (peringkat per set).
  const top = list.slice(0, 3);
  const podium =
    top.length === 3 &&
    top.every((e) => e.exam_set_id === top[0].exam_set_id) &&
    top.map((e) => e.ranking).join() === "1,2,3";
  const rest = podium ? list.slice(3) : list;

  return (
    <div className="space-y-4">
      {podium && <Podium entries={top} />}
      <ol className="space-y-2">
        {rest.map((e, i) => (
          <li
            key={`${e.exam_set_id}-${e.ranking}-${i}`}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:gap-4 sm:p-4",
              e.is_me && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
            )}
          >
            <RankBadge rank={e.ranking} />
            <PersonAvatar entry={e} size="md" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-foreground">
                <span className="truncate">{e.full_name || "Pejuang SKD"}</span>
                {e.is_me && <MeTag />}
                {e.pass_overall && (
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Lulus PG
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-2.5 text-[11px] text-muted-foreground">
                <span>
                  <b className="font-semibold text-foreground">TWK</b> {e.score_twk}
                </span>
                <span>
                  <b className="font-semibold text-foreground">TIU</b> {e.score_tiu}
                </span>
                <span>
                  <b className="font-semibold text-foreground">TKP</b> {e.score_tkp}
                </span>
                <span>· {formatDuration(e.duration_seconds)}</span>
                {showExamName && <span>· {e.exam_name}</span>}
              </p>
            </div>
            <span className="font-display text-xl font-extrabold tabular-nums text-primary sm:text-2xl">
              {e.score_total}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  // Urutan tampilan: 2 – 1 – 3
  const order = [entries[1], entries[0], entries[2]];
  const height = ["sm:min-h-[200px]", "sm:min-h-[236px]", "sm:min-h-[184px]"];
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Tiga peringkat teratas">
      {order.map((e, i) => {
        const first = e.ranking === 1;
        return (
          <li
            key={e.ranking}
            className={cn(
              "flex flex-col items-center rounded-2xl border bg-card px-2 py-4 text-center shadow-sm sm:px-4",
              height[i],
              first &&
                "border-amber-300 bg-gradient-to-b from-amber-50 to-card dark:border-amber-800 dark:from-amber-950/40",
              e.is_me && "ring-2 ring-primary/40",
            )}
          >
            {first && <Crown className="mb-1 h-5 w-5 text-amber-500" aria-hidden />}
            <div className="relative">
              <PersonAvatar entry={e} size={first ? "lg" : "md"} />
              <RankBadge
                rank={e.ranking}
                small
                className="absolute -bottom-1.5 -right-2 z-10 ring-2 ring-card"
              />
            </div>
            <p className="mt-2 line-clamp-1 text-xs font-bold text-foreground sm:text-sm">
              {e.full_name || "Pejuang SKD"}
              {e.is_me && <MeTag />}
            </p>
            <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-primary sm:text-2xl">
              {e.score_total}
            </p>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              {formatDuration(e.duration_seconds)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function RankBadge({
  rank,
  small = false,
  className,
}: {
  rank: number;
  small?: boolean;
  className?: string;
}) {
  const size = small ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm";
  const icon = small ? "h-3.5 w-3.5" : "h-4 w-4";
  if (rank === 1)
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-amber-400 text-amber-950",
          size,
          className,
        )}
        aria-label="Peringkat 1"
      >
        <Trophy className={icon} aria-hidden />
      </span>
    );
  if (rank === 2)
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-slate-300 text-slate-800 dark:bg-slate-500 dark:text-white",
          size,
          className,
        )}
        aria-label="Peringkat 2"
      >
        <Medal className={icon} aria-hidden />
      </span>
    );
  if (rank === 3)
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-white",
          size,
          className,
        )}
        aria-label="Peringkat 3"
      >
        <Award className={icon} aria-hidden />
      </span>
    );
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-muted font-display font-bold tabular-nums text-muted-foreground",
        size,
        className,
      )}
      aria-label={`Peringkat ${rank}`}
    >
      {rank}
    </span>
  );
}

function PersonAvatar({ entry, size }: { entry: LeaderboardEntry; size: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "h-8 w-8" : size === "md" ? "h-10 w-10" : "h-14 w-14";
  const src = safeAvatarUrl(entry.avatar_url);
  const initial = (entry.full_name || "P").trim().charAt(0).toUpperCase();
  return (
    <Avatar className={cn("shrink-0 border-2 border-background shadow-sm", cls)}>
      {src && <AvatarImage src={src} alt="" referrerPolicy="no-referrer" loading="lazy" />}
      <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
        {initial || <User className="h-4 w-4" aria-hidden />}
      </AvatarFallback>
    </Avatar>
  );
}

function MeTag() {
  return (
    <span className="ml-1.5 rounded-md bg-primary px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
      Kamu
    </span>
  );
}
