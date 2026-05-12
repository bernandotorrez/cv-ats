import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tier, TierLimits } from "@/lib/subscription";
import { Crown, Star, Sparkles, Zap } from "lucide-react";

interface TierBannerProps {
  tier: Tier;
  limits: TierLimits;
  cvCount: number;
  aiUsageCount: number;
}

const tierConfig: Record<Tier, { label: string; icon: typeof Crown; gradient: string; badgeClass: string; emoji: string }> = {
  free: { label: "Free", icon: Star, gradient: "from-muted/80 to-card", badgeClass: "bg-muted-foreground/20 text-foreground", emoji: "🌱" },
  starter: { label: "Starter", icon: Zap, gradient: "from-blue-500/10 to-card", badgeClass: "bg-info text-info-foreground", emoji: "⚡" },
  pro: { label: "Pro", icon: Crown, gradient: "from-warning/10 to-card", badgeClass: "bg-warning text-warning-foreground", emoji: "👑" },
};

export function TierBanner({ tier, limits, cvCount, aiUsageCount }: TierBannerProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-r p-5",
      config.gradient,
    )}>
      {/* Subtle pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-current blur-2xl" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl text-xl",
            tier === "pro" ? "bg-warning/20" : tier === "starter" ? "bg-info/20" : "bg-muted",
          )}>
            {config.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs font-semibold", config.badgeClass)}>
                {config.label} Plan
              </Badge>
              {tier === "free" && (
                <span className="text-xs text-muted-foreground">Paket gratis — mulai berkreasi!</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                📄 {limits.maxCvs === null ? "CV ∞" : `${cvCount}/${limits.maxCvs} CV`}
              </span>
              <span className="flex items-center gap-1">
                ✨ {limits.maxAiSuggestions === null ? "AI ∞" : `${aiUsageCount}/${limits.maxAiSuggestions} AI`}
              </span>
            </div>
          </div>
        </div>

        {tier === "free" && (
          <Button asChild className="gap-2 shadow-md shadow-primary/20">
            <Link to="/harga">
              <Sparkles className="h-4 w-4" /> Upgrade Plan
            </Link>
          </Button>
        )}
        {tier !== "free" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Fitur premium aktif
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
