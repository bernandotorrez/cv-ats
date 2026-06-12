import { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  FileText,
  BarChart3,
  FileCheck,
  Mic,
  Send,
  Check,
  Flame,
  Trophy,
  Zap,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CareerStep {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  done: boolean;
  link?: string;
}

interface CareerProgressProps {
  user: User | null;
  steps: CareerStep[];
  onCreateCv?: () => void;
  onStepClick?: (step: CareerStep) => void;
}

/** Returns motivational copy based on progress */
function getMotivation(pct: number, stepPct: number, nextStepLabel?: string): {
  emoji: string;
  headline: string;
  sub: string;
  ctaLabel: string;
} {
  if (pct === 0) {
    return {
      emoji: "🚀",
      headline: "Mulai perjalananmu sekarang!",
      sub: "Buat CV pertamamu dan buka peluang kerja impian.",
      ctaLabel: "Buat CV Sekarang",
    };
  }
  if (pct < 40) {
    return {
      emoji: "💪",
      headline: `Selesaikan "${nextStepLabel}" untuk naik ke ${Math.min(pct + stepPct, 100)}%`,
      sub: "Kamu sudah mulai! Satu langkah lagi membawamu lebih dekat.",
      ctaLabel: "Lanjutkan",
    };
  }
  if (pct < 80) {
    return {
      emoji: "🔥",
      headline: "Sudah lebih dari setengah jalan!",
      sub: `Tinggal ${nextStepLabel ? `"${nextStepLabel}"` : "beberapa langkah"} lagi untuk profil yang lengkap.`,
      ctaLabel: "Terus Maju",
    };
  }
  if (pct < 100) {
    return {
      emoji: "⚡",
      headline: "Hampir sampai! Satu langkah terakhir.",
      sub: "Profil karier kamu hampir sempurna. Jangan berhenti sekarang!",
      ctaLabel: "Selesaikan",
    };
  }
  return {
    emoji: "🏆",
    headline: "Profil karier kamu lengkap!",
    sub: "Kamu siap bersaing. Pantau peluang baru dan perbarui CV secara rutin.",
    ctaLabel: "Lihat CV",
  };
}

/** Milestone badge shown at certain percentages */
function MilestoneBadge({ pct }: { pct: number }) {
  if (pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
        <Trophy className="h-3 w-3" /> Lengkap
      </span>
    );
  }
  if (pct >= 60) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
        <Flame className="h-3 w-3" /> On fire
      </span>
    );
  }
  if (pct >= 20) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
        <Zap className="h-3 w-3" /> Baru mulai
      </span>
    );
  }
  return null;
}

export function CareerProgress({ user, steps, onCreateCv, onStepClick }: CareerProgressProps) {
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "pejuang karier";

  const completedSteps = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const nextStep = steps.find((s) => !s.done);
  const nextStepIdx = steps.findIndex((s) => !s.done);
  const stepPct = Math.round(100 / totalSteps);
  const motivation = getMotivation(progressPct, stepPct, nextStep?.label);

  // Points to reward completed steps (20 pts each)
  const points = completedSteps * 20;

  return (
    <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Gradient accent — color shifts with progress */}
      <div
        className={cn(
          "h-1 bg-gradient-to-r transition-all",
          progressPct === 100
            ? "from-amber-400 via-yellow-300 to-orange-400"
            : progressPct >= 60
              ? "from-emerald-500 via-primary/60 to-sky-400"
              : "from-primary via-primary/60 to-sky-400",
        )}
      />

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {/* ── Row 1: Avatar + greeting + progress ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: avatar + name */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {(user?.user_metadata?.full_name || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg font-bold text-foreground truncate sm:text-xl">
                  Halo, {displayName}!
                </h1>
                <MilestoneBadge pct={progressPct} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedSteps}/{totalSteps} langkah selesai
                {points > 0 && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                    <Target className="h-3 w-3" /> {points} poin
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: percentage + progress bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span
                className={cn(
                  "text-2xl font-bold font-display tabular-nums",
                  progressPct === 100
                    ? "text-amber-500"
                    : progressPct >= 60
                      ? "text-emerald-600"
                      : "text-primary",
                )}
              >
                {progressPct}%
              </span>
            </div>
            <div className="w-28 sm:w-40 space-y-1">
              <Progress value={progressPct} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-right">
                target: 100%
              </p>
            </div>
          </div>
        </div>

        {/* ── Row 2: Motivational inline banner ── */}
        <div className={cn(
          "mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm",
          progressPct === 100
            ? "bg-amber-50 border border-amber-200"
            : "bg-primary/5 border border-primary/10",
        )}>
          <span className="text-base leading-none mt-0.5 shrink-0">{motivation.emoji}</span>
          <div className="min-w-0">
            <p className={cn(
              "font-semibold text-sm",
              progressPct === 100 ? "text-amber-700" : "text-foreground",
            )}>
              {motivation.headline}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {motivation.sub}
            </p>
          </div>
        </div>

        {/* ── Row 3: Step pills ── */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isNext = idx === nextStepIdx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(step)}
                className={cn(
                  "group flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-2 transition-all duration-200",
                  step.done
                    ? "bg-primary/8 text-primary hover:bg-primary/15"
                    : isNext
                      ? "bg-primary/5 border border-primary/25 hover:bg-primary/10 ring-2 ring-primary/10"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                )}
                title={step.description}
              >
                {step.done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shrink-0">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full shrink-0",
                      isNext
                        ? "bg-primary/15 text-primary animate-pulse"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <StepIcon className="h-3 w-3" />
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    step.done
                      ? "text-primary"
                      : isNext
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <span className="text-muted-foreground/30 ml-0.5 text-[10px]">→</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Row 4: CTA — only when not 100% ── */}
        {nextStep && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 border border-border/60 px-4 py-3 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Langkah selanjutnya
              </p>
              <p className="text-sm font-bold text-foreground truncate mt-0.5">
                {nextStep.label}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  — {nextStep.description}
                </span>
              </p>
            </div>
            {onCreateCv && nextStep.id === "create-cv" ? (
              <Button size="sm" onClick={onCreateCv} className="gap-1.5 shrink-0">
                {motivation.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : nextStep.link ? (
              <Button asChild size="sm" className="gap-1.5 shrink-0">
                <Link to={nextStep.link as never}>
                  {motivation.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onStepClick?.(nextStep)}
                className="gap-1.5 shrink-0"
              >
                {motivation.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* ── Completed state ── */}
        {progressPct === 100 && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              Luar biasa! Profil kariermu sudah lengkap. Perbarui CV secara rutin agar tetap relevan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// Default steps definition — filtered by tier
// Free: Buat CV, Cek Skor ATS, Lamaran (no Cover Letter / Interview)
// Starter: Buat CV, Cek Skor ATS, Cover Letter, Lamaran (no Interview)
// Pro: all 5 steps
export function getCareerSteps(data: {
  hasCv: boolean;
  hasScore: boolean;
  hasCoverLetter: boolean;
  hasInterview: boolean;
  hasApplied: boolean;
  tier: "free" | "starter" | "pro";
}): CareerStep[] {
  const allSteps: (CareerStep & { hidden?: boolean })[] = [
    {
      id: "create-cv",
      label: "Buat CV",
      description: "Tulis CV pertamamu dengan editor",
      icon: FileText,
      done: data.hasCv,
      link: "/cv",
    },
    {
      id: "score-cv",
      label: "Cek Skor ATS",
      description: "Ukur kesiapan CV untuk ATS",
      icon: BarChart3,
      done: data.hasScore,
    },
    {
      id: "cover-letter",
      label: "Cover Letter",
      description: "Tulis surat lamaran dengan AI",
      icon: FileCheck,
      done: data.hasCoverLetter,
      // Starter+ only
      hidden: data.tier === "free",
    },
    {
      id: "interview",
      label: "Interview",
      description: "Latihan jawab pertanyaan HR",
      icon: Mic,
      done: data.hasInterview,
      // Pro only
      hidden: data.tier !== "pro",
    },
    {
      id: "apply",
      label: "Lamaran",
      description: "Apply ke pekerjaan impianmu",
      icon: Send,
      done: data.hasApplied,
    },
  ];

  return allSteps.filter((s) => !("hidden" in s && s.hidden));
}
