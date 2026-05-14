import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tier, TierLimits } from "@/lib/subscription";
import { Crown, Sparkles, Star, Zap } from "lucide-react";

interface TierBannerProps {
  tier: Tier;
  limits: TierLimits;
  cvCount: number;
  aiUsageCount: number;
}

const tierConfig: Record<Tier, { label: string; note: string; className: string }> = {
  free: {
    label: "Free",
    note: "Mulai rapi dulu. Upgrade saat ritme apply mulai kencang.",
    className: "border-border bg-card",
  },
  starter: {
    label: "Starter",
    note: "Kuota lebih lega untuk iterasi CV dan cover letter.",
    className: "border-primary/25 bg-primary/5",
  },
  pro: {
    label: "Pro",
    note: "Siap untuk banyak role, banyak versi CV, dan interview practice.",
    className: "border-amber-400/40 bg-amber-50/70",
  },
};

export function TierBanner({ tier, limits, cvCount, aiUsageCount }: TierBannerProps) {
  const config = tierConfig[tier];
  const Icon = tier === "pro" ? Crown : tier === "starter" ? Zap : Star;

  return (
    <section className={cn("rounded-2xl border p-4 shadow-sm sm:p-5", config.className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              tier === "pro"
                ? "bg-amber-500 text-white"
                : tier === "starter"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={tier === "free" ? "secondary" : "default"}>{config.label} Plan</Badge>
              {tier !== "free" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  Premium aktif
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{config.note}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border bg-background px-3 py-2">
              <span className="block font-semibold text-foreground">
                {limits.maxCvs === null ? "Unlimited" : `${cvCount}/${limits.maxCvs}`}
              </span>
              <span className="text-muted-foreground">CV</span>
            </div>
            <div className="rounded-xl border bg-background px-3 py-2">
              <span className="block font-semibold text-foreground">
                {limits.maxAiSuggestions === null
                  ? "Unlimited"
                  : `${aiUsageCount}/${limits.maxAiSuggestions}`}
              </span>
              <span className="text-muted-foreground">AI saran</span>
            </div>
          </div>
          {tier === "free" && (
            <Button asChild className="gap-2">
              <Link to="/harga">
                Upgrade
                <Zap className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
