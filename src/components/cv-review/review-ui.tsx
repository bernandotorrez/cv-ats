import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lightbulb,
  ListChecks,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { CvReviewResult } from "@/lib/ai-functions";
import { cn } from "@/lib/utils";
import { formatReviewDate, scoreTone } from "./review-utils";

export type ReviewData = CvReviewResult["review"];

export interface ReviewHistoryItem {
  id: string;
  target_role: string | null;
  overall_score: number;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Hira AI                                                             */
/* ------------------------------------------------------------------ */

export function HiraCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border border-green-200 bg-green-50 p-4",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700 font-display text-base font-extrabold text-white ring-4 ring-green-100"
      >
        HA
      </span>
      <div className="min-w-0">
        <p className="font-display text-base font-extrabold text-gray-900">Hira AI</p>
        <p className="text-sm text-green-900">Senior HR Consultant · 20+ tahun</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Riwayat                                                             */
/* ------------------------------------------------------------------ */

export function ReviewHistoryList({
  items,
  selectedId,
  onSelect,
  layout = "list",
}: {
  items: ReviewHistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  layout?: "list" | "row";
}) {
  return (
    <ul
      className={cn(
        layout === "row"
          ? "flex gap-2 overflow-x-auto pb-1"
          : "divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white",
      )}
    >
      {items.map((item) => {
        const tone = scoreTone(item.overall_score);
        const selected = selectedId === item.id;
        return (
          <li key={item.id} className={cn(layout === "row" && "shrink-0")}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700",
                layout === "row"
                  ? "min-w-[13rem] rounded-xl border-2 bg-white"
                  : "first:rounded-t-xl last:rounded-b-xl hover:bg-green-50",
                layout === "row" &&
                  (selected
                    ? "border-green-700 bg-green-50"
                    : "border-gray-200 hover:border-green-700"),
                layout === "list" && selected && "bg-green-50",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-extrabold ring-1",
                  tone.pill,
                )}
              >
                {item.overall_score}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-gray-900">
                  {item.target_role || "Tanpa target posisi"}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                  <Clock aria-hidden="true" className="h-3 w-3" />
                  {formatReviewDate(item.created_at)}
                </span>
              </span>
              {selected && (
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-green-700" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Ringkasan hasil review                                              */
/* ------------------------------------------------------------------ */

function ScoreRing({ value }: { value: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-white/20"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="stroke-yellow-300 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-extrabold leading-none text-white">
          {clamped}
        </span>
        <span className="mt-1 text-xs font-semibold text-green-100">dari 100</span>
      </div>
    </div>
  );
}

function ListCard({
  icon,
  title,
  items,
  tone,
  empty,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  tone: "good" | "bad" | "tip";
  empty: string;
}) {
  const dot = {
    good: "bg-green-600",
    bad: "bg-red-500",
    tip: "bg-amber-500",
  }[tone];
  const iconBox = {
    good: "bg-green-50 text-green-700",
    bad: "bg-red-50 text-red-700",
    tip: "bg-amber-50 text-amber-700",
  }[tone];
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2.5 font-display text-base font-extrabold text-gray-900">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconBox)}>
          {icon}
        </span>
        {title}
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
          {items.length}
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-800">
              <span
                aria-hidden="true"
                className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dot)}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReviewSummary({ review }: { review: ReviewData }) {
  const { scores, hrVerdict, industryBenchmark } = review;
  const tone = scoreTone(scores.overall);
  const breakdown = [
    { label: "Kesan pertama", value: scores.firstImpression },
    { label: "Format ATS", value: scores.format },
    { label: "Konten", value: scores.content },
    { label: "Pencapaian", value: scores.achievement },
    { label: "Presentasi", value: scores.presentation },
  ];
  const hasBenchmark = Boolean(
    industryBenchmark?.level || industryBenchmark?.comparison || industryBenchmark?.percentile,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* Skor keseluruhan */}
        <section
          aria-label="Skor keseluruhan"
          className="relative flex flex-col items-center overflow-hidden rounded-3xl bg-green-700 p-6 text-center text-white shadow-xl shadow-green-900/15"
        >
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-green-600/50 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-yellow-300/15 blur-3xl"
          />
          <div className="relative flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">
              Skor keseluruhan
            </p>
            <div className="mt-4">
              <ScoreRing value={scores.overall} />
            </div>
            <p className="mt-4 font-display text-xl font-extrabold">{tone.label}</p>
            {hasBenchmark && (
              <div className="mt-3 w-full rounded-2xl bg-white/10 p-3 text-left text-sm ring-1 ring-white/20">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-100">
                  <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" />
                  Benchmark industri
                </p>
                {(industryBenchmark.level || industryBenchmark.percentile) && (
                  <p className="mt-1 font-bold">
                    {[industryBenchmark.level, industryBenchmark.percentile]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {industryBenchmark.comparison && (
                  <p className="mt-1 leading-relaxed text-green-50">
                    {industryBenchmark.comparison}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Verdict + rincian skor */}
        <section
          aria-label="Verdict HR"
          className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-green-800">Verdict HR</p>
            {hrVerdict.verdict && (
              <span className="rounded-full bg-green-700 px-3 py-1 text-sm font-bold text-white">
                {hrVerdict.verdict}
              </span>
            )}
          </div>
          {hrVerdict.reason && (
            <p className="mt-3 text-base leading-relaxed text-gray-800">{hrVerdict.reason}</p>
          )}

          {hrVerdict.nextSteps?.length > 0 && (
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <ListChecks aria-hidden="true" className="h-4 w-4 text-green-700" />
                Langkah berikutnya
              </p>
              <ol className="mt-2.5 space-y-2">
                {hrVerdict.nextSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-800">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white"
                    >
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {breakdown.map((item) => {
              const t = scoreTone(item.value);
              return (
                <div key={item.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-sm font-medium text-gray-700">{item.label}</dt>
                    <dd className={cn("font-display text-base font-extrabold", t.text)}>
                      {item.value}
                    </dd>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-label={item.label}
                    aria-valuenow={item.value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={cn("h-full rounded-full transition-[width] duration-700", t.bar)}
                      style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </dl>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ListCard
          tone="good"
          title="Kekuatan"
          icon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
          items={review.strengths}
          empty="Belum ada kekuatan yang menonjol."
        />
        <ListCard
          tone="bad"
          title="Perlu diperbaiki"
          icon={<AlertCircle aria-hidden="true" className="h-4 w-4" />}
          items={review.weaknesses}
          empty="Tidak ada kelemahan berarti."
        />
        <ListCard
          tone="tip"
          title="Perbaikan cepat"
          icon={<Lightbulb aria-hidden="true" className="h-4 w-4" />}
          items={review.quickWins}
          empty="Tidak ada perbaikan cepat tambahan."
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar "yang akan kamu dapatkan"                                   */
/* ------------------------------------------------------------------ */

const DELIVERABLES = [
  "Skor 5 aspek: kesan pertama, format ATS, konten, pencapaian, presentasi",
  "Verdict HR dan langkah berikutnya",
  "Saran kalimat siap terapkan langsung di CV-mu",
  "Perbaikan cepat dan benchmark industri",
];

export function ReviewDeliverables() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900">
        <Sparkles aria-hidden="true" className="h-4 w-4 text-green-700" />
        Yang akan kamu dapatkan
      </h2>
      <ul className="mt-3 space-y-2.5">
        {DELIVERABLES.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-gray-700">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
