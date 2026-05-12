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
  maxInterviewSimulator: number | null;
  maxAiChat: number | null;
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
  date_end: string;
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
    maxInterviewSimulator: 0,
    maxAiChat: 5,
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
    priceMonthly: 14900,
    maxCvs: 3,
    maxAiSuggestions: 50,
    maxAtsScores: 10,
    maxGuidedSessions: 30,
    maxCoverLetter: 10,
    maxCvReview: 10,
    maxKeywordExtract: 20,
    maxInterviewSimulator: 0,
    maxAiChat: 50,
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
    priceMonthly: 39000,
    maxCvs: 10,
    maxAiSuggestions: 200,
    maxAtsScores: 50,
    maxGuidedSessions: 100,
    maxCoverLetter: 50,
    maxCvReview: 50,
    maxKeywordExtract: 100,
    maxInterviewSimulator: 50,
    maxAiChat: 200,
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
 */
export async function getUserTierConfig(userId: string): Promise<TierLimits> {
  try {
    const { data } = await (supabase as any)
      .from("user_subscriptions")
      .select(
        `tier_id, status, date_start, date_end,
        subscription_tiers!inner(
          slug, name, price_monthly,
          max_cvs, quota_ai_suggest, quota_ai_score,
          quota_ai_chat, quota_ai_cover_letter, quota_ai_keyword_extract,
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
        maxInterviewSimulator: t.quota_interview_simulator ?? base.maxInterviewSimulator,
        maxAiChat: t.quota_ai_chat ?? base.maxAiChat,
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
 */
export async function getUserTier(userId: string): Promise<Tier> {
  try {
    const { data } = await (supabase as any)
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (data) {
      const tier = data.subscription_tiers?.slug as Tier;
      if (tier && TIER_LIMITS[tier]) return tier;
    }
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

export { TIER_LIMITS };
