import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
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
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <h2 className="font-display text-lg font-bold text-foreground">Aksi Cepat</h2>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {visible.map((a) => (
          <button
            key={a.label}
            onClick={() => !a.locked && onAction(a.action)}
            className={cn(
              "group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all duration-200",
              a.locked
                ? "border-dashed border-muted-foreground/15 opacity-60 cursor-not-allowed"
                : "border-transparent bg-card hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
            )}
          >
            {a.locked && (
              <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-warning/20 border border-warning/30">
                <Lock className="h-2.5 w-2.5 text-warning" />
              </div>
            )}
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
              a.color,
            )}>
              <a.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-center leading-tight">
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
