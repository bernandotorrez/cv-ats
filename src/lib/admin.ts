/**
 * Admin utilities — check if current user has admin role
 */
import { supabase } from "@/integrations/supabase/client";

let cachedAdminStatus: { userId: string; isAdmin: boolean } | null = null;

export async function isAdmin(userId: string): Promise<boolean> {
  if (cachedAdminStatus?.userId === userId) {
    return cachedAdminStatus.isAdmin;
  }
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  const result = !!data;
  cachedAdminStatus = { userId, isAdmin: result };
  return result;
}

export function clearAdminCache() {
  cachedAdminStatus = null;
}
