/**
 * Komponen analisis halaman hasil tryout:
 * - ReadinessBanner: tingkat kesiapan + jarak ke passing grade.
 * - PeerComparison: rank, persentil, rata-rata peserta.
 * - RecommendationList: rekomendasi belajar spesifik.
 * - HistoryTrend: grafik batang skor total beberapa attempt terakhir.
 */
import { Award, Lightbulb, TrendingDown, TrendingUp, Users, Target, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Readiness, Recommendation, SubtestGap } from "@/lib/tryout-analysis";
import { SUBTEST_LABEL } from "@/lib/tryout-analysis";
import type { TryoutHistoryPoint, TryoutInsights } from "@/lib/tryout-types";

const READINESS_STYLE: Record<Readiness["level"], string> = {
  elite: "from-emerald-500 to-teal-600",
  competitive: "from-emerald-500 to-emerald-600",
  passed: "from-sky-500 to-indigo-500",
  close: "from-amber-500 to-orange-500",
  practice: "from-rose-500 to-orange-500",
};

export function ReadinessBanner({
  readiness,
  total,
  gaps,
}: {
  readiness: Readiness;
  total: number;
  gaps: SubtestGap[];
}) {
  // Total maksimal mengikuti komposisi set (set mini < 550).
  const maxTotal = gaps.reduce((s, g) => s + g.max, 0) || 550;
  const pct = Math.round((total / maxTotal) * 100);
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        className={cn(
          "flex flex-col gap-5 bg-gradient-to-br p-5 text-white sm:flex-row sm:items-center sm:p-6",
          READINESS_STYLE[readiness.level],
        )}
      >
        <ScoreRing value={total} max={maxTotal} pct={pct} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Tingkat kesiapan
          </div>
          <h2 className="mt-0.5 font-display text-2xl font-bold sm:text-3xl">{readiness.label}</h2>
          <p className="mt-1.5 text-sm opacity-95">{readiness.description}</p>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        {gaps.map((g) => {
          const scorePct = Math.min(100, (g.score / g.max) * 100);
          const passPct = Math.min(100, (g.passing / g.max) * 100);
          return (
            <div
              key={g.subtest}
              className={cn(
                "rounded-xl border-2 p-3 sm:p-4",
                g.passed
                  ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {SUBTEST_LABEL[g.subtest]}
                </span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    g.passed ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
                  )}
                >
                  {g.passed ? "Lulus" : "Belum"}
                </span>
              </div>
              <div className="mt-1.5 font-display text-2xl font-bold">
                {g.score}
                <span className="text-sm font-medium text-muted-foreground"> / {g.max}</span>
              </div>
              {/* Bar skor dengan penanda passing grade */}
              <div className="relative mt-2 h-2 rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", g.passed ? "bg-emerald-500" : "bg-red-500")}
                  style={{ width: `${scorePct}%` }}
                />
                <div
                  className="absolute -top-1 h-4 w-0.5 bg-foreground/70"
                  style={{ left: `${passPct}%` }}
                  title={`Passing grade ${g.passing}`}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {g.passed ? (
                  <>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      +{g.margin}
                    </span>{" "}
                    di atas passing grade {g.passing}
                  </>
                ) : (
                  <>
                    Kurang{" "}
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      {g.pointsNeeded} poin
                    </span>{" "}
                    (≈{g.questionsNeeded} soal) dari PG {g.passing}
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScoreRing({ value, max, pct }: { value: number; max: number; pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0"
      aria-label={`Skor ${value} dari ${max}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-[11px] opacity-90">dari {max}</div>
        </div>
      </div>
    </div>
  );
}

export function PeerComparison({
  insights,
  scores,
}: {
  insights: TryoutInsights;
  scores: { total: number; twk: number; tiu: number; tkp: number };
}) {
  const others = insights.participants - 1;
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-bold sm:text-lg">Posisi Kamu</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Peringkat" value={`#${insights.rank}`} sub={`dari ${insights.participants}`} />
        <Stat
          label="Persentil"
          value={`${insights.percentile}%`}
          sub={others > 0 ? "peserta di bawahmu" : "peserta pertama"}
        />
        <Stat
          label="Kelulusan"
          value={insights.pass_rate != null ? `${insights.pass_rate}%` : "–"}
          sub="peserta lulus PG"
        />
      </div>

      {insights.avg && others > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <p className="text-xs font-semibold text-muted-foreground">
            Dibanding rata-rata {others} peserta lain
          </p>
          {(
            [
              ["Total", scores.total, insights.avg.total],
              ["TWK", scores.twk, insights.avg.twk],
              ["TIU", scores.tiu, insights.avg.tiu],
              ["TKP", scores.tkp, insights.avg.tkp],
            ] as const
          ).map(([label, mine, avg]) => {
            const diff = mine - avg;
            return (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="text-muted-foreground">rata² {avg}</span>
                  <DiffBadge diff={diff} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-xl font-bold sm:text-2xl">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  const up = diff > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold",
        up
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {diff}
    </span>
  );
}

const TONE_STYLE: Record<Recommendation["tone"], string> = {
  danger: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-sky-500",
  success: "border-l-emerald-500",
};

export function RecommendationList({ items }: { items: Recommendation[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h3 className="font-display text-base font-bold sm:text-lg">Rekomendasi Belajar</h3>
      </div>
      <ol className="space-y-2.5">
        {items.map((r, i) => (
          <li
            key={i}
            className={cn("rounded-lg border border-l-4 bg-background p-3", TONE_STYLE[r.tone])}
          >
            <div className="text-sm font-semibold">{r.title}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {r.detail}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HistoryTrend({
  history,
  currentId,
}: {
  history: TryoutHistoryPoint[];
  currentId: string;
}) {
  if (history.length < 2) return null;
  const idx = history.findIndex((h) => h.id === currentId);
  const prev = idx > 0 ? history[idx - 1] : null;
  const current = idx >= 0 ? history[idx] : null;
  const best = Math.max(...history.map((h) => h.score_total));
  const delta = prev && current ? current.score_total - prev.score_total : null;

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-bold sm:text-lg">Progres Kamu</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {delta != null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              vs sebelumnya <DiffBadge diff={delta} />
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Award className="h-3 w-3" /> Terbaik {best}
          </span>
        </div>
      </div>
      <div
        className="flex h-36 items-end gap-1.5 sm:gap-2"
        role="img"
        aria-label="Grafik skor total per tryout"
      >
        {history.map((h, i) => {
          const isCurrent = h.id === currentId;
          return (
            <div
              key={h.id}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums",
                  isCurrent ? "text-primary" : "text-muted-foreground",
                )}
              >
                {h.score_total}
              </span>
              <div
                className={cn(
                  "w-full max-w-10 rounded-t-md transition",
                  isCurrent
                    ? "bg-primary"
                    : h.pass_overall
                      ? "bg-emerald-400/70 dark:bg-emerald-500/50"
                      : "bg-muted-foreground/30",
                )}
                style={{
                  height: `${Math.max(4, (h.score_total / (h.max_total || 550)) * 100)}%`,
                }}
                title={`${h.exam_name ?? "Tryout"} · ${h.finished_at ? new Date(h.finished_at).toLocaleDateString("id-ID") : ""} · ${h.score_total}/${h.max_total || 550}`}
              />
              <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Hijau = lulus passing grade · batang berwarna utama = tryout ini.
      </p>
    </section>
  );
}
