import { cn } from "@/lib/utils";
import { Lock, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  action: string;
  color: string;
  visible: boolean;
  locked?: boolean;
  upgradeTier?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: string) => void;
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  const visible = actions.filter((a) => a.visible);
  if (visible.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Zap className="h-3.5 w-3.5" />
            Shortcut
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Aksi cepat</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => !a.locked && onAction(a.action)}
            className={cn(
              "group relative flex min-h-28 flex-col justify-between rounded-2xl border bg-card p-4 text-left shadow-sm transition-all",
              a.locked
                ? "cursor-not-allowed border-dashed opacity-65"
                : "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md",
            )}
            aria-disabled={a.locked}
          >
            {a.locked && (
              <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-700">
                <Lock className="h-3.5 w-3.5" />
              </span>
            )}
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.color)}>
              <a.icon className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold leading-tight text-foreground">
                {a.label}
              </span>
              {a.locked && (
                <span className="mt-1 block text-[11px] font-medium text-amber-700">
                  {a.upgradeTier}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
