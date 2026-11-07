/**
 * Widget dashboard tryout: ringkasan progres, banner ujian berjalan, kartu set.
 */
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Play,
  RotateCcw,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimer } from "@/lib/tryout-scoring";
import type { ProgressSummary, TryoutAttemptSummary } from "@/lib/tryout-display";
import { isFinished } from "@/lib/tryout-display";

// ─── Ringkasan progres ──────────────────────────────────────────────────────

export function ProgressStats({ summary }: { summary: ProgressSummary }) {
  const tiles = [
    {
      icon: <FileText className="h-4 w-4" aria-hidden />,
      label: "Tryout selesai",
      value: String(summary.finished),
      sub: summary.finished > 0 ? "attempt dinilai" : "belum ada",
    },
    {
      icon: <Trophy className="h-4 w-4" aria-hidden />,
      label: "Skor terbaik",
      value: summary.best != null ? String(summary.best) : "–",
      sub: "dari 550",
    },
    {
      icon: <Target className="h-4 w-4" aria-hidden />,
      label: "Rata-rata",
      value: summary.average != null ? String(summary.average) : "–",
      sub:
        summary.lastDelta == null
          ? "skor total"
          : summary.lastDelta >= 0
            ? `+${summary.lastDelta} dari sebelumnya`
            : `${summary.lastDelta} dari sebelumnya`,
      trend: summary.lastDelta,
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
      label: "Lulus passing grade",
      value: summary.finished > 0 ? `${summary.passed}/${summary.finished}` : "–",
      sub: "ketiga subtes",
    },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan progres">
      {tiles.map((t) => (
        <li key={t.label} className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="text-primary">{t.icon}</span>
            {t.label}
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">
            {t.value}
          </div>
          <div
            className={cn(
              "mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground",
              t.trend != null && t.trend > 0 && "text-emerald-600 dark:text-emerald-400",
              t.trend != null && t.trend < 0 && "text-red-600 dark:text-red-400",
            )}
          >
            {t.trend != null && t.trend > 0 && <TrendingUp className="h-3 w-3" aria-hidden />}
            {t.trend != null && t.trend < 0 && <TrendingDown className="h-3 w-3" aria-hidden />}
            {t.sub}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Banner ujian berjalan ──────────────────────────────────────────────────

export function ResumeBanner({
  examId,
  examName,
  remainingSeconds,
  answered,
}: {
  examId: string;
  examName: string;
  remainingSeconds: number;
  answered?: number;
}) {
  const expired = remainingSeconds <= 0;
  return (
    <section
      aria-label="Ujian sedang berjalan"
      className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Clock className="h-5 w-5" aria-hidden />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-background motion-safe:animate-pulse" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Ujian sedang berjalan
          </p>
          <p className="font-display text-base font-bold text-foreground sm:text-lg">{examName}</p>
          <p className="text-xs text-muted-foreground">
            {expired
              ? "Waktu sudah habis — buka untuk mengumpulkan jawaban yang tersimpan."
              : `Sisa waktu ± ${formatTimer(remainingSeconds)}${answered != null ? ` · ${answered} soal terjawab` : ""}. Timer tetap berjalan.`}
          </p>
        </div>
      </div>
      <Button asChild size="lg" className="shrink-0 gap-2 rounded-xl">
        <Link to={"/tryout/$examId/ujian" as never} params={{ examId } as never}>
          <Play className="h-4 w-4" aria-hidden /> {expired ? "Kumpulkan" : "Lanjutkan ujian"}
        </Link>
      </Button>
    </section>
  );
}

// ─── Kartu set tryout ───────────────────────────────────────────────────────

export type ExamSetSummary = {
  id: string;
  name: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  twk_count: number;
  tiu_count: number;
  tkp_count: number;
};

export function CompositionBar({
  twk,
  tiu,
  tkp,
  showLegend = true,
}: {
  twk: number;
  tiu: number;
  tkp: number;
  showLegend?: boolean;
}) {
  const total = Math.max(1, twk + tiu + tkp);
  const parts = [
    { key: "TWK", n: twk, cls: "bg-amber-400" },
    { key: "TIU", n: tiu, cls: "bg-sky-400" },
    { key: "TKP", n: tkp, cls: "bg-emerald-500" },
  ];
  return (
    <div>
      <div
        className="flex h-2 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`Komposisi soal: TWK ${twk}, TIU ${tiu}, TKP ${tkp}`}
      >
        {parts.map((p) => (
          <div key={p.key} className={p.cls} style={{ width: `${(p.n / total) * 100}%` }} />
        ))}
      </div>
      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {parts.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-sm", p.cls)} aria-hidden />
              <b className="font-semibold text-foreground">{p.key}</b> {p.n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExamSetCard({
  set,
  attempts,
  hasCredits,
  onOpen,
}: {
  set: ExamSetSummary;
  /** Attempt user untuk set ini (urutan bebas). */
  attempts: TryoutAttemptSummary[];
  hasCredits: boolean;
  onOpen: () => void;
}) {
  const running = attempts.find((a) => a.status === "in_progress");
  const done = attempts.filter(isFinished);
  const best = done.length ? done.reduce((b, a) => (a.score_total > b.score_total ? a : b)) : null;

  const status = running
    ? {
        label: "Sedang berjalan",
        cls: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
      }
    : best
      ? best.pass_overall
        ? {
            label: "Lulus PG",
            cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
          }
        : {
            label: "Belum lulus PG",
            cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
          }
      : { label: "Belum dikerjakan", cls: "bg-muted text-muted-foreground" };

  const cta = running
    ? {
        label: "Lanjutkan",
        icon: <Play className="h-4 w-4" aria-hidden />,
        variant: "default" as const,
      }
    : !hasCredits
      ? {
          label: "Lihat detail",
          icon: <ArrowRight className="h-4 w-4" aria-hidden />,
          variant: "outline" as const,
        }
      : done.length
        ? {
            label: "Ulangi",
            icon: <RotateCcw className="h-4 w-4" aria-hidden />,
            variant: "outline" as const,
          }
        : {
            label: "Mulai",
            icon: <Play className="h-4 w-4" aria-hidden />,
            variant: "default" as const,
          };

  return (
    <article className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <BookOpenCheck className="h-5 w-5" aria-hidden />
        </span>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", status.cls)}>
          {status.label}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 font-display text-lg font-bold text-foreground">
        {set.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {set.description || "Simulasi SKD lengkap sesuai kisi-kisi BKN."}
      </p>

      <div className="mb-5 mt-4">
        <CompositionBar twk={set.twk_count} tiu={set.tiu_count} tkp={set.tkp_count} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <div className="min-w-0 text-xs text-muted-foreground">
          {best ? (
            <>
              <div>
                Terbaik{" "}
                <b className="font-display text-base font-extrabold text-foreground">
                  {best.score_total}
                </b>
                /550
              </div>
              <div>{done.length}x dikerjakan</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" aria-hidden /> {set.total_questions} soal
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {set.duration_minutes} menit
              </div>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant={cta.variant}
          onClick={onOpen}
          className="h-10 shrink-0 gap-1.5 rounded-lg px-4"
          aria-label={`${cta.label} ${set.name}`}
        >
          {cta.icon}
          {cta.label}
        </Button>
      </div>
      {!running && !hasCredits && (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
          <Coins className="h-3 w-3" aria-hidden /> Butuh 1 kredit untuk memulai
        </p>
      )}
    </article>
  );
}
