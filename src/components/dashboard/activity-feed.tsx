import { cn } from "@/lib/utils";
import { Activity, Pencil, Plus, Sparkles } from "lucide-react";

interface ActivityItem {
  action: string;
  label: string;
  time: string;
}

const actionConfig: Record<string, { icon: typeof Pencil; color: string; bg: string }> = {
  edit: { icon: Pencil, color: "text-primary", bg: "bg-primary/10" },
  create: { icon: Plus, color: "text-emerald-700", bg: "bg-emerald-500/10" },
  ai: { icon: Sparkles, color: "text-violet-700", bg: "bg-violet-500/10" },
  welcome: { icon: Sparkles, color: "text-amber-700", bg: "bg-amber-500/10" },
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <aside className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="font-display font-bold text-foreground">Aktivitas terbaru</h3>
      </div>
      <ul className="space-y-2">
        {activities.map((a, i) => {
          const config = actionConfig[a.action] || actionConfig.welcome;
          const Icon = config.icon;
          return (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-muted/35 p-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  config.bg,
                )}
              >
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
