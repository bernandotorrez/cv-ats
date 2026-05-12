import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Pencil, Plus, Sparkles } from "lucide-react";

interface ActivityItem {
  action: string;
  label: string;
  time: string;
}

const actionConfig: Record<string, { icon: typeof Pencil; color: string; bg: string }> = {
  edit: { icon: Pencil, color: "text-primary", bg: "bg-primary-soft" },
  create: { icon: Plus, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  ai: { icon: Sparkles, color: "text-violet-600", bg: "bg-violet-500/10" },
  welcome: { icon: Sparkles, color: "text-warning", bg: "bg-warning/10" },
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display font-bold">Aktivitas Terbaru</h3>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {activities.map((a, i) => {
            const config = actionConfig[a.action] || actionConfig.welcome;
            const Icon = config.icon;
            return (
              <li key={i} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate font-medium">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">{a.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
