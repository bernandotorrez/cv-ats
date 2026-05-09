/**
 * Rate Limiter — In-memory rate limiting for Edge Functions
 * SECURITY: Prevents abuse by limiting requests per user per time window
 * 
 * NOTE: This is an in-memory store, suitable for single-instance deployments.
 * For multi-region/multi-instance deployments, consider using Supabase's
 * pg_limiter extension or an external rate limiting service like Upstash.
 */

// In-memory bucket storage: key -> { count, resetAt }
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if a request is allowed under the rate limit
 * 
 * @param key - Unique identifier (e.g., "userId:endpoint")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  // Bucket doesn't exist or expired - create new bucket
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  // Check if limit exceeded
  if (bucket.count >= maxRequests) {
    return false;
  }

  // Increment counter
  bucket.count++;
  return true;
}

/**
 * Get current rate limit status without incrementing
 * 
 * @param key - Unique identifier
 * @param windowMs - Time window in milliseconds
 * @returns Object with count and remaining requests
 */
export function getRateLimitStatus(
  key: string,
  windowMs: number,
  maxRequests: number,
): { count: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    return { count: 0, remaining: maxRequests, resetAt: now + windowMs };
  }

  return {
    count: bucket.count,
    remaining: Math.max(0, maxRequests - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/**
 * Clear rate limit bucket (for testing or manual reset)
 */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Clear all rate limit buckets (for testing)
 */
export function clearAllRateLimits(): void {
  buckets.clear();
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // AI endpoints: 30 requests per minute per user
  AI_SUGGEST: { maxRequests: 30, windowMs: 60 * 1000 },
  AI_SCORE: { maxRequests: 30, windowMs: 60 * 1000 },
  AI_CHAT: { maxRequests: 30, windowMs: 60 * 1000 },
  AI_KEYWORDS: { maxRequests: 30, windowMs: 60 * 1000 },
  AI_COVER_LETTER: { maxRequests: 30, windowMs: 60 * 1000 },
  
  // PDF generation: 20 requests per minute per user
  GENERATE_PDF: { maxRequests: 20, windowMs: 60 * 1000 },
  
  // LinkedIn import: 10 requests per hour per user
  LINKEDIN_IMPORT: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  
  // Email: 10 requests per hour per user
  SEND_EMAIL: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
} as const;
