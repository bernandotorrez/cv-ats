import type { ReactNode } from "react";

interface Props {
  feature: string;
  tier: string;
  requiredTier?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

const TIER_LEVEL: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  pro_plus: 3,
};

/**
 * FeatureGate — conditionally renders children based on user's subscription tier.
 * If the user doesn't have access, shows fallback or upgrade prompt.
 */
export function FeatureGate({
  feature,
  tier,
  requiredTier,
  children,
  fallback,
  showUpgrade = true,
}: Props) {
  const userLevel = TIER_LEVEL[tier] ?? 0;
  const required = requiredTier ? (TIER_LEVEL[requiredTier] ?? 0) : 1; // default starter

  if (userLevel >= required) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return <UpgradePrompt feature={feature} tier={tier} requiredTier={requiredTier} />;
  }

  return null;
}

/**
 * UpgradePrompt — inline prompt to upgrade subscription.
 * Minimal, non-intrusive.
 */
export function UpgradePrompt({
  feature,
  tier,
  requiredTier,
}: {
  feature: string;
  tier: string;
  requiredTier?: string;
}) {
  const targetTier = requiredTier || (tier === "free" ? "starter" : "pro");

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
      <p className="text-sm text-muted-foreground">
        Fitur <span className="font-medium text-foreground">{feature}</span>{" "}
        tersedia untuk paket{" "}
        <span className="font-semibold capitalize">{targetTier}</span> ke atas.
      </p>
      <a
        href="/harga"
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Upgrade sekarang →
      </a>
    </div>
  );
}
