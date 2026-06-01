import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, Lock, Zap } from "lucide-react";
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
  const visible = features.filter((f) => f.visible);
  if (visible.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
            <Zap className="h-3.5 w-3.5" />
            Tools paling berdampak
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Pilih langkah berikutnya
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Mulai dari audit CV, cek ATS, lalu siapkan jawaban interview dengan alur yang lebih fokus.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((f, index) => (
          <button
            key={f.label}
            type="button"
            onClick={() => (f.locked ? onUpgrade() : onFeatureClick(f.action))}
            className="group h-full text-left"
          >
            <article
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all",
                f.locked
                  ? "border-dashed opacity-80 hover:border-amber-400"
                  : "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    index % 3 === 0
                      ? "bg-primary/10 text-primary"
                      : index % 3 === 1
                        ? "bg-sky-500/10 text-sky-700"
                        : "bg-rose-500/10 text-rose-700",
                  )}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                {f.locked ? (
                  <Badge variant="outline" className="gap-1 border-amber-400/50 text-amber-700">
                    <Lock className="h-3 w-3" />
                    {f.upgradeTier}
                  </Badge>
                ) : (
                  <div className="flex flex-wrap justify-end gap-2">
                    {f.isNew && (
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                        New
                      </Badge>
                    )}
                    <Badge variant="secondary">{f.badge}</Badge>
                  </div>
                )}
              </div>

              <h3 className="mt-5 font-display text-base font-bold text-foreground transition-colors group-hover:text-primary">
                {f.label}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{f.desc}</p>

              <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
                {f.locked ? "Lihat paket" : "Buka fitur"}
                {f.locked ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </div>
            </article>
          </button>
        ))}
      </div>
    </section>
  );
}
