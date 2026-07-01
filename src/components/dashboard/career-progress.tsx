import { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  BarChart3,
  FileCheck,
  Mic,
  Send,
  Check,
  Flame,
  BookOpen,
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

/** Circular progress ring SVG */
function CircularProgress({ percentage }: { percentage: number }) {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(142, 71%, 45%)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">Target: 100%</span>
      </div>
    </div>
  );
}

export function CareerProgress({ user, steps, onCreateCv, onStepClick }: CareerProgressProps) {
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "pejuang karier";

  const completedSteps = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const nextStep = steps.find((s) => !s.done);

  // Determine motivation based on progress
  const isOnFire = progressPct >= 40;
  const isComplete = progressPct === 100;

  return (
    <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-6 sm:px-6 lg:px-8">
        {/* 3-column grid on desktop */}
        <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          {/* ── Left: Greeting + CTAs ── */}
          <div className="min-w-0">
            {/* Green greeting badge */}
            <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="shrink-0">Selamat datang kembali,</span>
              <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-xs inline-block align-bottom font-bold">
                {displayName}
              </span>
              <span className="shrink-0">! 👋</span>
            </div>

            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              Saatnya wujudkan <span className="text-emerald-600">karier impianmu!</span>
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Lengkapi CV terbaikmu, lewati ATS, dan tingkatkan peluang dipanggil interview.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {nextStep &&
                (nextStep.id === "create-cv" && onCreateCv ? (
                  <Button
                    size="sm"
                    onClick={onCreateCv}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Lanjutkan Interview
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : nextStep.link ? (
                  <Button asChild size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Link to={nextStep.link as never}>
                      Lanjutkan Interview
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onStepClick?.(nextStep)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Lanjutkan Interview
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ))}
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to="/panduan-cv-ats">
                  <BookOpen className="h-3.5 w-3.5" />
                  Lihat Panduan
                </Link>
              </Button>
            </div>
          </div>

          {/* ── Center: Circular Progress + Checklist ── */}
          <div className="rounded-2xl border bg-background p-5 sm:p-6 w-full min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display font-bold text-sm text-foreground">Progres CV-mu</h3>
              {isOnFire && !isComplete && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Flame className="h-3 w-3" /> On fire
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              {/* Circular progress */}
              <div className="shrink-0 mx-auto sm:mx-0">
                <CircularProgress percentage={progressPct} />
              </div>

              {/* Checklist */}
              <div className="flex-1 min-w-0 w-full space-y-0.5">
                <p className="text-xs font-semibold text-muted-foreground mb-2 text-center sm:text-left">
                  {completedSteps}/{totalSteps} langkah selesai
                </p>
                <div className="max-w-[200px] mx-auto sm:mx-0 space-y-0.5">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 py-1">
                      {step.done ? (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span
                        className={cn(
                          "text-xs",
                          step.done
                            ? "text-foreground font-medium line-through decoration-muted-foreground/40"
                            : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Motivational Card ── */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{isComplete ? "🏆" : isOnFire ? "🔥" : "💪"}</span>
                <h3 className="font-display font-bold text-sm text-foreground">
                  {isComplete ? "Lengkap!" : isOnFire ? "Keren!" : "Semangat!"}
                </h3>
              </div>
              <p className="text-lg font-bold text-foreground leading-tight">
                {isComplete
                  ? "Profil kariermu sudah lengkap!"
                  : isOnFire
                    ? "Kamu sedang on track!"
                    : "Yuk mulai langkah pertama!"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {isComplete
                  ? "Perbarui CV secara rutin agar tetap relevan."
                  : isOnFire
                    ? "Pertahankan momentum ini dan selesaikan langkah berikutnya."
                    : "Lengkapi CV terbaikmu dan mulai perjalanan kariermu."}
              </p>
            </div>
          </div>
        </div>
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
      description: "Mulai buat CV profesional",
      icon: FileText,
      done: data.hasCv,
      link: "/cv",
    },
    {
      id: "score-cv",
      label: "Cek Skor ATS",
      description: "Cek kecocokan CV kamu",
      icon: BarChart3,
      done: data.hasScore,
    },
    {
      id: "cover-letter",
      label: "Cover Letter",
      description: "Tingkatkan daya tarik",
      icon: FileCheck,
      done: data.hasCoverLetter,
      // Starter+ only
      hidden: data.tier === "free",
    },
    {
      id: "interview",
      label: "Interview",
      description: "Latihan & persiapan",
      icon: Mic,
      done: data.hasInterview,
      link: "/simulasi-wawancara",
      // Pro only
      hidden: data.tier !== "pro",
    },
    {
      id: "apply",
      label: "Lamaran",
      description: "Kirim ke perusahaan",
      icon: Send,
      done: data.hasApplied,
      link: "/lamaran",
    },
  ];

  return allSteps.filter((s) => !("hidden" in s && s.hidden));
}
