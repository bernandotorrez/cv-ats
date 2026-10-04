import { ArrowRight, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureGroup = "improve" | "apply" | "more";

interface PowerFeature {
  icon: LucideIcon;
  label: string;
  desc: string;
  action: string;
  group: FeatureGroup;
  isNew?: boolean;
  visible: boolean;
  locked: boolean;
  upgradeTier?: string;
}

interface PowerFeaturesProps {
  features: PowerFeature[];
  onFeatureClick: (action: string) => void;
  onUpgrade: () => void;
}

const GROUPS: Array<{ key: FeatureGroup; title: string; desc: string }> = [
  { key: "improve", title: "Tingkatkan CV", desc: "Ukur, review, dan sesuaikan CV-mu." },
  { key: "apply", title: "Siap melamar", desc: "Dari lowongan sampai wawancara." },
  { key: "more", title: "Lainnya", desc: "Pantau progres dan kelola akun." },
];

function FeatureCard({ f, onClick }: { f: PowerFeature; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        f.locked
          ? "border-dashed hover:border-amber-400 hover:bg-amber-50/40"
          : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          f.locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <f.icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "text-sm font-bold",
              f.locked ? "text-muted-foreground" : "text-foreground group-hover:text-primary",
            )}
          >
            {f.label}
          </span>
          {f.locked ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              <Lock aria-hidden="true" className="h-2.5 w-2.5" />
              {f.upgradeTier}
            </span>
          ) : f.isNew ? (
            <span className="rounded-md bg-yellow-300 px-1.5 py-0.5 text-[10px] font-bold text-gray-950">
              Baru
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground line-clamp-2">
          {f.locked ? `Tersedia di paket ${f.upgradeTier}. ${f.desc}` : f.desc}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </button>
  );
}

export function PowerFeatures({ features, onFeatureClick, onUpgrade }: PowerFeaturesProps) {
  const visible = features.filter((f) => f.visible);
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="tools-title" className="space-y-5">
      <div>
        <h2 id="tools-title" className="font-display text-xl font-extrabold tracking-tight">
          Tools AI
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Semua alat untuk membuat CV-mu lebih kuat dan lamaranmu lebih siap.
        </p>
      </div>

      {GROUPS.map((g) => {
        const items = visible.filter((f) => f.group === g.key);
        if (items.length === 0) return null;
        return (
          <div key={g.key}>
            <div className="mb-2.5 flex items-baseline gap-2">
              <h3 className="text-sm font-bold">{g.title}</h3>
              <span className="text-xs text-muted-foreground">{g.desc}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((f) => (
                <FeatureCard
                  key={f.label}
                  f={f}
                  onClick={() => (f.locked ? onUpgrade() : onFeatureClick(f.action))}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
