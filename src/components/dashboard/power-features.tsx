import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, ChevronUp, Lock } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Tools AI</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pilih langkah berikutnya untuk optimalkan CV-mu
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {displayed.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => (f.locked ? onUpgrade() : onFeatureClick(f.action))}
            className="group text-left"
          >
            <article
              className={cn(
                "flex items-start gap-3.5 rounded-xl border bg-card p-4 transition-all",
                f.locked
                  ? "border-dashed opacity-75 hover:border-amber-400/60"
                  : "hover:border-primary/30 hover:shadow-sm hover:-translate-y-px",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  f.gradient
                    ? `${f.gradient} text-white`
                    : "bg-primary/10 text-primary",
                )}
              >
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {f.label}
                  </h3>
                  {f.locked ? (
                    <Badge variant="outline" className="gap-1 border-amber-400/50 text-amber-700 text-[10px] py-0 px-1.5 shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      {f.upgradeTier}
                    </Badge>
                  ) : (
                    <>
                      {f.isNew && (
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary text-[10px] py-0 px-1.5 shrink-0">
                          New
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">{f.desc}</p>
              </div>
            </article>
          </button>
        ))}
      </div>

      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mx-auto"
        >
          Lihat semua tools ({visible.length})
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
      {hasMore && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          Sembunyikan
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}
