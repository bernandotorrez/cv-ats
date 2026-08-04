/**
 * Subscription & Feature Gating Utilities
 * Checks user tier against feature requirements.
 *
 * Feature flags are read from the database subscription_tiers row whenever
 * possible, with hardcoded TIER_LIMITS as the fallback. The edge functions
 * are the ultimate authority — flags here MUST match their gating logic.
 */
import { supabase } from "@/integrations/supabase/client";

export type Tier = "free" | "starter" | "pro";

export interface TierLimits {
  tier: Tier;
  tierName: string;
  priceMonthly: number;
  // Countable quotas (null = unlimited)
  maxCvs: number | null;
  maxAiSuggestions: number | null;
  maxAtsScores: number | null;
  maxGuidedSessions: number | null;
  maxCoverLetter: number | null;
  maxCvReview: number | null;
  maxKeywordExtract: number | null;
  maxTailorCv: number | null;
  maxInterviewSimulator: number | null;
  maxAiChat: number | null;
  maxCvDownloads: number | null;
  // Boolean feature gates — MUST match edge function gating
  enableCvReview: boolean; // ai-cv-review: free=❌, starter+=✅
  enableAiSuggest: boolean; // ai-suggest: all tiers
  enableAiScore: boolean; // ai-score: all tiers with quota
  enableTextPolish: boolean; // ai-polish: all tiers with quota
  enableGuidedMode: boolean; // ai-chat (mode=guided): all tiers ✅
  maxTextPolish: number | null; // null = unlimited
  canDownloadDocx: boolean;
  canCoverLetter: boolean; // ai-cover-letter: free=❌
  canKeywordExtract: boolean; // ai-keywords: free=❌
  canCompare: boolean;
  canAnalytics: boolean;
  canInterviewSimulator: boolean;
  watermark: boolean;
  templateAccess: "basic" | "all";
}

type DbSubscriptionRow = {
  tier_id: string;
  status: string;
  date_start: string;
  date_end: string | null;  // null = never expires (free tier)
  subscription_tiers: {
    slug: string;
    name: string;
    price_monthly: number;
    max_cvs: number | null;
    quota_ai_suggest: number | null;
    quota_ai_score: number | null;
    quota_ai_chat: number | null;
    quota_ai_cover_letter: number | null;
    quota_ai_keyword_extract: number | null;
    quota_ai_tailor_cv: number | null;
    quota_cv_downloads: number | null;
    quota_cv_review: number | null;
    quota_interview_simulator: number | null;
    quota_guided_mode: number | null;
    template_access: string;
    enable_cv_review: boolean;
    enable_cover_letter: boolean;
    enable_keyword_extractor: boolean;
    enable_cv_comparison: boolean;
    enable_interview_simulator: boolean;
    enable_analytics: boolean;
    enable_text_polish: boolean;
    enable_guided_mode: boolean;
    quota_ai_polish: number | null;
  } | null;
};

/**
 * Hardcoded per-tier limits. Acts as fallback when DB is unavailable.
 * Values MUST match: supabase/seed.sql, edge function tier gates, and pricing page.
 */
const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    tier: "free",
    tierName: "Free",
    priceMonthly: 0,
    maxCvs: 1,
    maxAiSuggestions: 5,
    maxAtsScores: 1,
    maxGuidedSessions: 10,
    maxCoverLetter: 0,
    maxCvReview: 0,
    maxKeywordExtract: 0,
    maxTailorCv: 0,
    maxInterviewSimulator: 0,
    maxAiChat: 5,
    maxCvDownloads: 1,
    enableCvReview: false,
    enableAiSuggest: true,
    enableAiScore: true,
    enableGuidedMode: true,
    enableTextPolish: true,
    maxTextPolish: 5,
    canDownloadDocx: false,
    canCoverLetter: false,
    canKeywordExtract: false,
    canCompare: false,
    canAnalytics: false,
    canInterviewSimulator: false,
    watermark: true,
    templateAccess: "basic",
  },
  starter: {
    tier: "starter",
    tierName: "Starter",
    priceMonthly: 15000,
    maxCvs: 3,
    maxAiSuggestions: 50,
    maxAtsScores: 10,
    maxGuidedSessions: 30,
    maxCoverLetter: 10,
    maxCvReview: 10,
    maxKeywordExtract: 20,
    maxTailorCv: 0,
    maxInterviewSimulator: 0,
    maxAiChat: 50,
    maxCvDownloads: null,
    enableCvReview: true,
    enableAiSuggest: true,
    enableAiScore: true,
    enableGuidedMode: true,
    enableTextPolish: true,
    maxTextPolish: 50,
    canDownloadDocx: true,
    canCoverLetter: true,
    canKeywordExtract: true,
    canCompare: false,
    canAnalytics: false,
    canInterviewSimulator: false,
    watermark: false,
    templateAccess: "all",
  },
  pro: {
    tier: "pro",
    tierName: "Pro",
    priceMonthly: 35000,
    maxCvs: 10,
    maxAiSuggestions: 200,
    maxAtsScores: 50,
    maxGuidedSessions: 100,
    maxCoverLetter: 50,
    maxCvReview: 50,
    maxKeywordExtract: 100,
    maxTailorCv: 30,
    maxInterviewSimulator: 50,
    maxAiChat: 200,
    maxCvDownloads: null,
    enableCvReview: true,
    enableAiSuggest: true,
    enableAiScore: true,
    enableGuidedMode: true,
    enableTextPolish: true,
    maxTextPolish: 200,
    canDownloadDocx: true,
    canCoverLetter: true,
    canKeywordExtract: true,
    canCompare: true,
    canAnalytics: true,
    canInterviewSimulator: true,
    watermark: false,
    templateAccess: "all",
  },
};

/**
 * Fetch the full tier config from the database including feature flags.
 * Falls back to hardcoded TIER_LIMITS if DB query fails.
 * Automatically checks subscription expiration and downgrades if needed.
 */
export async function getUserTierConfig(userId: string): Promise<TierLimits> {
  try {
    // First check and handle subscription expiration
    const { tier } = await checkAndHandleSubscription(userId);
    
    // If downgraded to free, return free limits
    if (tier === "free") {
      return TIER_LIMITS.free;
    }

    const { data } = await supabase
      .from("user_subscriptions")
      .select(
        `tier_id, status, date_start, date_end,
        subscription_tiers!inner(
          slug, name, price_monthly,
          max_cvs, quota_ai_suggest, quota_ai_score,
          quota_ai_chat, quota_ai_cover_letter, quota_ai_keyword_extract,
          quota_ai_tailor_cv,
          quota_cv_downloads,
          quota_cv_review, quota_interview_simulator, quota_guided_mode,
          template_access,
          enable_cv_review, enable_cover_letter, enable_keyword_extractor,
          enable_cv_comparison, enable_interview_simulator,
          enable_analytics,
          enable_text_polish, quota_ai_polish,
          enable_guided_mode
        )`,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (data?.subscription_tiers) {
      const t = data.subscription_tiers;
      const slug = (t.slug as Tier) || "free";
      const base = TIER_LIMITS[slug] || TIER_LIMITS.free;

      return {
        ...base,
        tier: slug,
        tierName: t.name || base.tierName,
        priceMonthly: t.price_monthly ?? base.priceMonthly,
        // Override countable limits from DB if present
        maxCvs: t.max_cvs ?? base.maxCvs,
        maxAiSuggestions: t.quota_ai_suggest ?? base.maxAiSuggestions,
        maxAtsScores: t.quota_ai_score ?? base.maxAtsScores,
        maxCoverLetter: t.quota_ai_cover_letter ?? base.maxCoverLetter,
        maxCvReview: t.quota_cv_review ?? base.maxCvReview,
        maxKeywordExtract: t.quota_ai_keyword_extract ?? base.maxKeywordExtract,
        maxTailorCv: t.quota_ai_tailor_cv ?? base.maxTailorCv,
        maxInterviewSimulator: t.quota_interview_simulator ?? base.maxInterviewSimulator,
        maxAiChat: t.quota_ai_chat ?? base.maxAiChat,
        maxCvDownloads: t.quota_cv_downloads ?? base.maxCvDownloads,
        templateAccess: (t.template_access as "basic" | "all") || base.templateAccess,
        // Feature gates — read directly from DB columns.
        // DB is the source of truth; hardcoded base is fallback only.
        enableCvReview: t.enable_cv_review ?? base.enableCvReview,
        canCoverLetter: t.enable_cover_letter ?? base.canCoverLetter,
        canKeywordExtract: t.enable_keyword_extractor ?? base.canKeywordExtract,
        canCompare: t.enable_cv_comparison ?? base.canCompare,
        canInterviewSimulator: t.enable_interview_simulator ?? base.canInterviewSimulator,
        canAnalytics: t.enable_analytics ?? base.canAnalytics,
        enableTextPolish: t.enable_text_polish ?? base.enableTextPolish,
        maxTextPolish: t.quota_ai_polish ?? base.maxTextPolish,
        enableGuidedMode: t.enable_guided_mode ?? base.enableGuidedMode,
        maxGuidedSessions: t.quota_guided_mode ?? base.maxGuidedSessions,
      };
    }
  } catch {
    // DB query failed — fall through to hardcoded
  }
  return TIER_LIMITS.free;
}

/**
 * Get the current user's tier slug from their active subscription.
 * Falls back to "free" if no subscription found.
 * Automatically checks subscription expiration.
 */
export async function getUserTier(userId: string): Promise<Tier> {
  try {
    // Use checkAndHandleSubscription to auto-check expiration
    const { tier } = await checkAndHandleSubscription(userId);
    return tier;
  } catch {
    // Fall through to free
  }
  return "free";
}

/**
 * Get the limits for the current user's tier (fetches from DB).
 */
export async function getUserLimits(userId: string): Promise<TierLimits> {
  return getUserTierConfig(userId);
}

/**
 * Get limits for a specific tier (hardcoded fallback, no DB call).
 */
export function getTierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if a user has access to a specific feature.
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof TierLimits,
): Promise<boolean> {
  const limits = await getUserLimits(userId);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (value === null) return true; // null = unlimited
  return (value as number) > 0;
}

/**
 * Check if user is at limit for countable features.
 */
export async function checkUsageLimit(
  userId: string,
  feature: "maxCvs" | "maxAiSuggestions" | "maxAtsScores" | "maxGuidedSessions",
  currentUsage: number,
): Promise<{ atLimit: boolean; current: number; max: number | null }> {
  const limits = await getUserLimits(userId);
  const max = limits[feature];
  if (max === null) return { atLimit: false, current: currentUsage, max: null };
  return { atLimit: currentUsage >= max, current: currentUsage, max };
}

/**
 * Check subscription status and handle expiration.
 * Returns the current tier after checking expiration.
 * If paid subscription is expired, auto-downgrades to free.
 */
export async function checkAndHandleSubscription(userId: string): Promise<{
  tier: Tier;
  isExpired: boolean;
  daysRemaining: number | null;
  dateEnd: string | null;
}> {
  try {
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("id, tier_id, status, date_start, date_end, subscription_tiers!inner(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!subscription) {
      // No active subscription, create free subscription
      await createFreeSubscription(userId);
      return { tier: "free", isExpired: false, daysRemaining: null, dateEnd: null };
    }

    const tierSlug = (subscription.subscription_tiers?.slug as Tier) || "free";

    // Free tier never expires
    if (tierSlug === "free" || !subscription.date_end) {
      return { tier: tierSlug, isExpired: false, daysRemaining: null, dateEnd: subscription.date_end };
    }

    // Check if paid subscription is expired
    const now = new Date();
    const endDate = new Date(subscription.date_end);
    const isExpired = endDate <= now;

    if (isExpired) {
      // Auto-downgrade to free tier
      await downgradeToFree(userId, subscription.id);
      return { tier: "free", isExpired: true, daysRemaining: 0, dateEnd: null };
    }

    // Calculate remaining days
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return { tier: tierSlug, isExpired: false, daysRemaining, dateEnd: subscription.date_end };
  } catch {
    // On error, return free tier as fallback
    return { tier: "free", isExpired: false, daysRemaining: null, dateEnd: null };
  }
}

/**
 * Get remaining days for current subscription.
 * Returns null for free tier (never expires).
 */
export async function getSubscriptionRemainingDays(userId: string): Promise<number | null> {
  try {
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("date_end, subscription_tiers!inner(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!subscription?.date_end) return null; // Free tier or no end date

    const tierSlug = subscription.subscription_tiers?.slug;
    if (tierSlug === "free") return null; // Free tier never expires

    const now = new Date();
    const endDate = new Date(subscription.date_end);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(0, daysRemaining);
  } catch {
    return null;
  }
}

/**
 * Downgrade user to free tier when paid subscription expires.
 */
async function downgradeToFree(userId: string, currentSubId: string): Promise<void> {
  // Mark current subscription as expired
  await supabase
    .from("user_subscriptions")
    .update({ status: "expired" })
    .eq("id", currentSubId);

  // Create new free subscription
  await createFreeSubscription(userId);
}

/**
 * Create a free tier subscription for user.
 */
async function createFreeSubscription(userId: string): Promise<void> {
  // Get free tier ID
  const { data: freeTier } = await supabase
    .from("subscription_tiers")
    .select("id")
    .eq("slug", "free")
    .single();

  if (!freeTier) return;

  await supabase
    .from("user_subscriptions")
    .insert({
      user_id: userId,
      tier_id: freeTier.id,
      status: "active",
      date_start: new Date().toISOString(),
      date_end: null, // Free tier never expires
      provider: "auto_downgrade",
    });
}

/**
 * Check if subscription is expiring soon (within 7 days).
 * Returns warning message if expiring, null otherwise.
 */
export async function checkExpiringWarning(userId: string): Promise<string | null> {
  const daysRemaining = await getSubscriptionRemainingDays(userId);
  
  if (daysRemaining === null) return null; // Free tier
  
  if (daysRemaining <= 0) {
    return "Subscription Anda telah berakhir. Upgrade untuk melanjutkan fitur premium.";
  }
  
  if (daysRemaining <= 3) {
    return `Subscription Anda berakhir dalam ${daysRemaining} hari. Perpanjang sekarang untuk menghindari gangguan.`;
  }
  
  if (daysRemaining <= 7) {
    return `Subscription Anda berakhir dalam ${daysRemaining} hari.`;
  }
  
  return null;
}

export { TIER_LIMITS };
