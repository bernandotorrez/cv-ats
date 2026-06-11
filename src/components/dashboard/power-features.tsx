import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lock, Zap, ArrowRight } from "lucide-react";
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
  const unlockedCount = visible.filter((f) => !f.locked).length;

  return (
    <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Tools AI
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unlockedCount} dari {visible.length} tools tersedia untukmu
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 grid gap-2.5 sm:grid-cols-2">
        {displayed.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => (f.locked ? onUpgrade() : onFeatureClick(f.action))}
            className="group text-left"
          >
            <article
              className={cn(
                "relative flex items-start gap-3.5 rounded-xl border p-4 transition-all duration-200",
                f.locked
                  ? "border-dashed bg-muted/20 opacity-75 hover:border-amber-400/60 hover:bg-amber-50/30"
                  : "bg-background hover:border-primary/30 hover:shadow-sm hover:-translate-y-px hover:bg-primary/2",
              )}
            >
              {/* Popular ribbon */}
              {f.popular && !f.locked && (
                <span className="absolute -top-px right-3 inline-flex items-center gap-0.5 rounded-b-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  Populer
                </span>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                  f.locked
                    ? "bg-muted text-muted-foreground"
                    : f.gradient
                      ? `${f.gradient} text-white shadow-sm`
                      : "bg-primary/10 text-primary",
                )}
              >
                <f.icon className="h-4.5 w-4.5" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3
                    className={cn(
                      "text-sm font-bold truncate transition-colors",
                      f.locked
                        ? "text-muted-foreground"
                        : "text-foreground group-hover:text-primary",
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
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary text-[10px] py-0 px-1.5 shrink-0">
                      New
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">
                  {f.desc}
                </p>

                {/* Usage hint OR unlock prompt */}
                {!f.locked ? (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Mulai sekarang
                    <ArrowRight className="h-3 w-3" />
                  </div>
                ) : (
                  <p className="mt-1.5 text-[10px] font-medium text-amber-700">
                    Upgrade ke {f.upgradeTier} untuk akses →
                  </p>
                )}
              </div>
            </article>
          </button>
        ))}
      </div>

      {/* Expand / Collapse */}
      {hasMore && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-colors",
              expanded
                ? "border-border text-muted-foreground hover:bg-muted/50"
                : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10",
            )}
          >
            {expanded ? (
              <>
                Sembunyikan <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Lihat semua {visible.length} tools <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
