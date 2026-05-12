/**
 * Admin utilities — check if current user has admin role
 * SECURITY: Admin cache has TTL to prevent privilege escalation
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Security: Cache with TTL ──────────────────────────────────────────────────
// Admin status cache with 5-minute TTL to ensure role changes take effect quickly
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedAdminStatus {
  userId: string;
  isAdmin: boolean;
  cachedAt: number; // timestamp when cached
}

let cachedAdminStatus: CachedAdminStatus | null = null;

/**
 * Check if current user has admin role
 * SECURITY: Cache expires after TTL to ensure role revocation takes effect
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const now = Date.now();
  
  // Check cache with TTL expiration
  if (
    cachedAdminStatus?.userId === userId &&
    now - cachedAdminStatus.cachedAt < ADMIN_CACHE_TTL_MS
  ) {
    return cachedAdminStatus.isAdmin;
  }
  
  // Fetch fresh from database
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  
  const result = !!data;
  
  // Update cache with timestamp
  cachedAdminStatus = {
    userId,
    isAdmin: result,
    cachedAt: now,
  };
  
  return result;
}

/**
 * Clear the entire admin cache
 * Call this when you need to ensure fresh data (e.g., after bulk operations)
 */
export function clearAdminCache(): void {
  cachedAdminStatus = null;
}

/**
 * Invalidate cache for a specific user
 * Call this after role changes for that user
 * SECURITY: Ensures role changes take effect immediately
 */
export function invalidateAdminCache(userId: string): void {
  if (cachedAdminStatus?.userId === userId) {
    cachedAdminStatus = null;
    console.log(`[Admin] Cache invalidated for user: ${userId.slice(0, 8)}`);
  }
}
