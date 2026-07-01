import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PowerFeature {
  icon: LucideIcon;
  label: string;
  desc: string;
  action: string;
  badge: string;
  isNew?: boolean;
  badgeColor?: string;
  visible: boolean;
  locked: boolean;
  upgradeTier?: string;
  gradient?: string;
  usageCount?: number;
  popular?: boolean;
}

interface PowerFeaturesProps {
  features: PowerFeature[];
  onFeatureClick: (action: string) => void;
  onUpgrade: () => void;
}

export function PowerFeatures({ features, onFeatureClick, onUpgrade }: PowerFeaturesProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = features.filter((f) => f.visible);
  if (visible.length === 0) return null;

  const displayed = expanded ? visible : visible.slice(0, 4);
  const hasMore = visible.length > 4;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Tools AI untuk CV-mu</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manfaatkan AI untuk membuat CV yang lebih kuat dan relevan.
        </p>
      </div>

      {/* 2×2 Grid */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {displayed.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => (f.locked ? onUpgrade() : onFeatureClick(f.action))}
            className="group text-left w-full"
          >
            <article
              className={cn(
                "relative flex items-start gap-3 sm:gap-4 rounded-2xl border bg-card p-4 sm:p-5 transition-all duration-200 shadow-sm",
                f.locked
                  ? "border-dashed opacity-75 hover:border-amber-400/60 hover:bg-amber-50/30"
                  : "hover:border-emerald-300/50 hover:shadow-md hover:-translate-y-px",
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                  f.locked
                    ? "bg-muted text-muted-foreground"
                    : f.gradient
                      ? `${f.gradient} text-white shadow-sm`
                      : "bg-primary/10 text-primary",
                )}
              >
                <f.icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3
                    className={cn(
                      "text-sm font-bold truncate transition-colors",
                      f.locked
                        ? "text-muted-foreground"
                        : "text-foreground group-hover:text-emerald-700",
                    )}
                  >
                    {f.label}
                  </h3>
                  {f.locked ? (
                    <Badge
                      variant="outline"
                      className="gap-0.5 border-amber-400/50 text-amber-700 text-[10px] py-0 px-1.5 shrink-0"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      {f.upgradeTier}
                    </Badge>
                  ) : f.isNew ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      New
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">
                  {f.desc}
                </p>

                {/* Action link */}
                {!f.locked ? (
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                    {f.label === "CV Review AI"
                      ? "Review Sekarang"
                      : f.label === "CV Scoring"
                        ? "Cek Skor ATS"
                        : f.label === "AI Job Match Score"
                          ? "Cek Kecocokan"
                          : f.label === "Auto Tailor CV"
                            ? "Auto Tailor"
                            : "Mulai sekarang"}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] font-medium text-amber-700">
                    Upgrade ke {f.upgradeTier} untuk akses →
                  </p>
                )}
              </div>
            </article>
          </button>
        ))}
      </div>

      {/* Show more / less */}
      {hasMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            {expanded ? "Sembunyikan" : "Lihat semua tools AI"}
            <ArrowRight
              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")}
            />
          </button>
        </div>
      )}
    </section>
  );
}
