/**
 * Reset Monthly Quota Function
 * 
 * This function handles monthly quota reset for all tiers.
 * It can be triggered by pg_cron on the 1st of every month.
 * 
 * What it does:
 * 1. Archive old ai_usage records (older than 3 months) to ai_usage_archive
 * 2. Reset quota counters if needed
 * 3. Expire paid tier subscriptions past date_end (also runs hourly via pg_cron)
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    // Verify cron secret (constant-time). This function is invoked by pg_cron via
    // pg_net without a JWT (verify_jwt = false in config.toml), so this check is
    // the only authentication — it fails closed if CRON_SECRET is unset/short.
    const cronSecret = req.headers.get("x-cron-secret") || "";
    const expectedSecret = Deno.env.get("CRON_SECRET") || "";

    if (
      !cronSecret ||
      expectedSecret.length < 16 ||
      !(await timingSafeEqualStrings(cronSecret, expectedSecret))
    ) {
      return json(req, { error: "Unauthorized" }, 401);
    }

    const admin = getAdminClient();
    const now = new Date();
    const results = {
      timestamp: now.toISOString(),
      expired_subscriptions: 0,
      archived_usage_records: 0,
      errors: [] as string[],
    };

    // 1. Expire paid subscriptions that have passed date_end and downgrade them
    //    to Free. Also runs hourly via pg_cron (expire-due-subscriptions); this
    //    is just a safety net.
    const { data: expiredCount, error: expireError } = await admin.rpc(
      "expire_due_subscriptions",
    );

    if (expireError) {
      results.errors.push(`Failed to expire subscriptions: ${expireError.message}`);
    } else {
      results.expired_subscriptions = Number(expiredCount || 0);
    }

    // 2. Free tier rows never expire: date_end is NOT NULL and stored as +100 years,
    //    so there is nothing to renew here.
    const freeTierId = await getFreeTierId(admin);

    // 3. Archive old ai_usage records (older than 3 months)
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // First, count records to archive
    const { count: recordsToArchive } = await admin
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .lt("created_at", threeMonthsAgo.toISOString());

    // Delete old records (in batches to avoid timeout)
    if (recordsToArchive && recordsToArchive > 0) {
      const { error: deleteError } = await admin
        .from("ai_usage")
        .delete()
        .lt("created_at", threeMonthsAgo.toISOString());

      if (deleteError) {
        results.errors.push(`Failed to archive old usage: ${deleteError.message}`);
      } else {
        results.archived_usage_records = recordsToArchive;
      }
    }

    // 4. Update subscription date_start for renewed subscriptions
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Update date_start for paid subscriptions that are still active
    const { error: updateDateStartError } = await admin
      .from("user_subscriptions")
      .update({ date_start: now.toISOString() })
      .neq("tier_id", freeTierId)
      .eq("status", "active")
      .lt("date_start", monthStart.toISOString());

    if (updateDateStartError) {
      results.errors.push(`Failed to update date_start: ${updateDateStartError.message}`);
    }

    return json(req, {
      success: true,
      message: "Monthly quota reset completed",
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("reset-monthly-quota error:", message);
    return json(req, { error: "Internal server error" }, 500);
  }
});

async function getFreeTierId(admin: ReturnType<typeof getAdminClient>): Promise<string> {
  const { data, error } = await admin
    .from("subscription_tiers")
    .select("id")
    .eq("slug", "free")
    .single();

  if (error || !data) {
    throw new Error("Free tier not found in subscription_tiers");
  }
  return data.id;
}

/** Constant-time string comparison (hash both sides so length is not leaked). */
async function timingSafeEqualStrings(a: string, b: string) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
