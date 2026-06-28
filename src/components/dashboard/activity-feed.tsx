import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Activity,
  Clock,
  FileEdit,
  FilePlus2,
  Sparkles,
  Rocket,
  BarChart3,
  Key,
  ArrowRight,
} from "lucide-react";

interface ActivityItem {
  action: string;
  label: string;
  time: string;
  location?: string;
  detail?: string;
}

const actionConfig: Record<
  string,
  { icon: typeof FileEdit; color: string; bg: string; verb: string }
> = {
  edit: {
    icon: FileEdit,
    color: "text-emerald-700",
    bg: "bg-emerald-500/10",
    verb: "Diedit",
  },
  create: {
    icon: FilePlus2,
    color: "text-emerald-700",
    bg: "bg-emerald-500/10",
    verb: "Dibuat",
  },
  score: {
    icon: BarChart3,
    color: "text-amber-700",
    bg: "bg-amber-500/10",
    verb: "Cek Skor ATS",
  },
  keyword: {
    icon: Key,
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    verb: "Ekstrak Keyword",
  },
  ai: {
    icon: Sparkles,
    color: "text-violet-700",
    bg: "bg-violet-500/10",
    verb: "AI digunakan",
  },
  welcome: {
    icon: Rocket,
    color: "text-amber-700",
    bg: "bg-amber-500/10",
    verb: "Selamat datang",
  },
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const isEmpty = activities.length === 0;

  return (
    <aside className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Activity className="h-3.5 w-3.5 text-emerald-700" />
          </div>
          <h3 className="font-display font-bold text-foreground text-sm">Aktivitas Terbaru</h3>
        </div>
      </div>

      {isEmpty ? (
        <div className="px-5 py-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Mulai edit CV untuk melihat riwayat.
          </p>
        </div>
      ) : (
        /* Timeline list */
        <ul className="relative px-4 py-3 space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[2.35rem] top-5 bottom-5 w-px bg-border/50" />

          {activities.map((a, i) => {
            const config = actionConfig[a.action] ?? actionConfig.welcome;
            const Icon = config.icon;
            const isFirst = i === 0;

            return (
              <li
                key={i}
                className={cn(
                  "relative flex items-start gap-3 py-2.5",
                  isFirst && "opacity-100",
                  !isFirst && "opacity-80",
                )}
              >
                {/* Icon node on timeline */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-2 ring-background",
                    config.bg,
                    isFirst && "ring-emerald-100",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{config.verb}</p>
                      <p className="truncate text-sm font-semibold text-foreground leading-tight mt-0.5">
                        {a.label}
                      </p>
                      {a.location && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{a.location}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground/70 mt-0.5 whitespace-nowrap flex items-center gap-1">
                      📅 {a.time}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer link */}
      {!isEmpty && (
        <div className="px-5 py-3 border-t border-border/50 bg-muted/10">
          <Link
            to="/cv"
            className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            Lihat semua aktivitas
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </aside>
  );
}
