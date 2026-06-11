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

export function CareerProgress({ user, steps, onCreateCv, onStepClick }: CareerProgressProps) {
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "pejuang karier";

  const completedSteps = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const nextStep = steps.find((s) => !s.done);

  return (
    <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Gradient accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-sky-400" />

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {/* Row 1: Greeting + Progress inline */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold font-display text-sm">
              {(user?.user_metadata?.full_name || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-foreground truncate sm:text-xl">
                Halo, {displayName}!
              </h1>
              <p className="text-xs text-muted-foreground">
                {completedSteps}/{totalSteps} langkah selesai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-2xl font-bold font-display text-primary tabular-nums">
              {progressPct}%
            </span>
            <div className="w-32 sm:w-40">
              <Progress value={progressPct} className="h-2" />
            </div>
          </div>
        </div>

        {/* Row 2: Horizontal step flow */}
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(step)}
                className={cn(
                  "group flex items-center gap-2 shrink-0 rounded-lg px-3 py-2 transition-all",
                  step.done
                    ? "bg-primary/8 text-primary hover:bg-primary/12"
                    : idx === steps.findIndex((s) => !s.done)
                      ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                )}
                title={step.description}
              >
                {step.done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      idx === steps.findIndex((s) => !s.done)
                        ? "bg-primary/15 text-primary"
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
                      : idx === steps.findIndex((s) => !s.done)
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <span className="text-muted-foreground/40 ml-0.5">→</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 3: Next step CTA */}
        {nextStep && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-primary shrink-0">Langkah selanjutnya:</span>
              <span className="text-sm font-bold text-foreground truncate">{nextStep.label}</span>
            </div>
            {onCreateCv ? (
              <Button size="sm" onClick={onCreateCv} className="gap-1.5 shrink-0 ml-3">
                Mulai
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-1.5 shrink-0 ml-3">
                <Link to="/cv">
                  Mulai
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Default steps definition
export function getCareerSteps(data: {
  hasCv: boolean;
  hasScore: boolean;
  hasCoverLetter: boolean;
  hasInterview: boolean;
  hasApplied: boolean;
}): CareerStep[] {
  return [
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
    },
    {
      id: "interview",
      label: "Interview",
      description: "Latihan jawab pertanyaan HR",
      icon: Mic,
      done: data.hasInterview,
    },
    {
      id: "apply",
      label: "Lamaran",
      description: "Apply ke pekerjaan impianmu",
      icon: Send,
      done: data.hasApplied,
    },
  ];
}
