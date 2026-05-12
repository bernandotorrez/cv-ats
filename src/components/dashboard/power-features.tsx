import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PowerFeature {
  icon: LucideIcon;
  label: string;
  desc: string;
  action: string;
  badge: string;
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
  const visible = features.filter((f) => f.visible);
  if (visible.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">🚀</span>
        <h2 className="font-display text-lg font-bold text-foreground">Fitur Andalan</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((f) => (
          <button
            key={f.label}
            onClick={() => f.locked ? onUpgrade() : onFeatureClick(f.action)}
            className="group relative block w-full text-left"
          >
            <Card className={cn(
              "h-full overflow-hidden border-2 transition-all duration-300",
              f.locked
                ? "border-dashed border-muted-foreground/20 opacity-75 hover:border-warning/40"
                : "border-border hover:border-primary/40 hover:shadow-xl hover:-translate-y-1",
            )}>
              {/* Gradient top accent */}
              {!f.locked && (
                <div className={cn("h-1 w-full", f.gradient || "bg-gradient-to-r from-primary to-secondary")} />
              )}
              <CardContent className="p-5">
                {/* Lock badge */}
                {f.locked && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-warning/15 border border-warning/30 px-2.5 py-1">
                    <Lock className="h-3 w-3 text-warning" />
                    <span className="text-[10px] font-semibold text-warning">{f.upgradeTier}</span>
                  </div>
                )}

                <div className={cn(
                  "mb-3 flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                  f.locked ? "bg-muted" : "bg-primary-soft",
                )}>
                  <f.icon className={cn("h-5 w-5", f.locked ? "text-muted-foreground" : "text-primary")} />
                </div>

                <h3 className={cn(
                  "font-display font-bold",
                  !f.locked && "group-hover:text-primary transition-colors",
                )}>
                  {f.label}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {f.desc}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {f.badge}
                  </Badge>
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-semibold transition-all",
                    f.locked ? "text-warning" : "text-primary group-hover:gap-2",
                  )}>
                    {f.locked ? "Upgrade" : "Coba"}
                    {f.locked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}
