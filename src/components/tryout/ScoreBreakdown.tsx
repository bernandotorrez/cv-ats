/**
 * ScoreBreakdown — Analisis per subtes: benar/salah/kosong, per kategori
 * (urut dari terlemah), dan per tingkat kesulitan.
 */
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TryoutAttemptStats, TryoutBinaryStats, TryoutTkpStats } from "@/lib/tryout-types";
import { DIFFICULTY_LABEL } from "@/lib/tryout-analysis";

type Props = { stats: TryoutAttemptStats };

export function ScoreBreakdown({ stats }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-bold sm:text-lg">Analisis Per Kategori</h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {stats.twk && <BinaryBreakdown title="TWK" tone="amber" stats={stats.twk} />}
        {stats.tiu && <BinaryBreakdown title="TIU" tone="sky" stats={stats.tiu} />}
        {stats.tkp && <TkpBreakdown stats={stats.tkp} />}
      </div>
    </div>
  );
}

const TONE = {
  amber: "border-amber-200 dark:border-amber-900",
  sky: "border-sky-200 dark:border-sky-900",
  emerald: "border-emerald-200 dark:border-emerald-900",
} as const;

function BinaryBreakdown({
  title,
  tone,
  stats,
}: {
  title: string;
  tone: keyof typeof TONE;
  stats: TryoutBinaryStats;
}) {
  const total = stats.total ?? stats.answered + stats.empty;
  const cats = Object.entries(stats.by_category || {})
    .map(([name, b]) => ({ name, value: b.correct, max: b.total }))
    .sort((a, b) => a.value / a.max - b.value / b.max);
  const diffs = Object.entries(stats.by_difficulty || {})
    .map(([name, b]) => ({ name, value: b.correct, max: b.total }))
    .sort((a, b) => order(a.name) - order(b.name));

  return (
    <div className={cn("rounded-xl border-2 p-3 sm:p-4", TONE[tone])}>
      <div className="flex items-baseline justify-between">
        <h4 className="font-display text-lg font-bold">{title}</h4>
        <span className="text-sm tabular-nums">
          <b>{stats.correct}</b>
          <span className="text-muted-foreground">/{total} benar</span>
        </span>
      </div>
      <StackBar
        segments={[
          { value: stats.correct, cls: "bg-emerald-500", label: "Benar" },
          { value: stats.wrong, cls: "bg-red-500", label: "Salah" },
          { value: stats.empty, cls: "bg-muted-foreground/30", label: "Kosong" },
        ]}
        total={total}
      />
      <CategoryList items={cats} unit="soal" />
      {diffs.length > 1 && <DifficultyRow items={diffs} />}
    </div>
  );
}

function TkpBreakdown({ stats }: { stats: TryoutTkpStats }) {
  const cats = Object.entries(stats.by_category || {})
    .map(([name, b]) => ({ name, value: b.score, max: b.max ?? b.total * 5 }))
    .sort((a, b) => a.value / a.max - b.value / b.max);
  const total =
    stats.total ?? Object.values(stats.by_category || {}).reduce((s, b) => s + b.total, 0);
  const empty = stats.empty ?? Math.max(0, total - stats.answered);

  return (
    <div className={cn("rounded-xl border-2 p-3 sm:p-4", TONE.emerald)}>
      <div className="flex items-baseline justify-between">
        <h4 className="font-display text-lg font-bold">TKP</h4>
        <span className="text-sm tabular-nums">
          <b>{stats.answered}</b>
          <span className="text-muted-foreground">/{total} dijawab</span>
        </span>
      </div>
      <StackBar
        segments={[
          { value: stats.best_choice ?? 0, cls: "bg-emerald-500", label: "Skor 5" },
          {
            value: Math.max(0, stats.answered - (stats.best_choice ?? 0)),
            cls: "bg-sky-400",
            label: "Skor 1–4",
          },
          { value: empty, cls: "bg-muted-foreground/30", label: "Kosong" },
        ]}
        total={total}
      />
      <CategoryList items={cats} unit="poin" />
    </div>
  );
}

function StackBar({
  segments,
  total,
}: {
  segments: Array<{ value: number; cls: string; label: string }>;
  total: number;
}) {
  if (total <= 0) return null;
  return (
    <div className="mt-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.value > 0 ? (
            <div key={s.label} className={s.cls} style={{ width: `${(s.value / total) * 100}%` }} />
          ) : null,
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-sm", s.cls)} />
            {s.label} {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function CategoryList({
  items,
  unit,
}: {
  items: Array<{ name: string; value: number; max: number }>;
  unit: string;
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-xs text-muted-foreground">Tidak ada data kategori.</p>;
  }
  return (
    <div className="mt-3 space-y-2">
      {items.map((c) => {
        const pct = c.max > 0 ? Math.round((c.value / c.max) * 100) : 0;
        return (
          <div key={c.name}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium" title={c.name}>
                {c.name}
              </span>
              <span className="shrink-0 tabular-nums">
                <b>{c.value}</b>
                <span className="text-muted-foreground">
                  /{c.max} {unit} · {pct}%
                </span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DifficultyRow({ items }: { items: Array<{ name: string; value: number; max: number }> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
      {items.map((d) => (
        <span
          key={d.name}
          className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          {DIFFICULTY_LABEL[d.name] ?? d.name}:{" "}
          <b className="text-foreground">
            {d.value}/{d.max}
          </b>
        </span>
      ))}
    </div>
  );
}

function order(d: string) {
  return d === "easy" ? 0 : d === "medium" ? 1 : d === "hard" ? 2 : 3;
}
