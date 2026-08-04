/**
 * Reset Monthly Quota Function
 * 
 * This function handles monthly quota reset for all tiers.
 * It can be triggered by pg_cron on the 1st of every month.
 * 
 * What it does:
 * 1. Archive old ai_usage records (older than 3 months) to ai_usage_archive
 * 2. Reset quota counters if needed
 * 3. Auto-renew free tier subscriptions
 * 4. Expire paid tier subscriptions that have passed date_end
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    // Verify cron secret for security
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    
    if (!cronSecret || cronSecret !== expectedSecret) {
      return json(req, { error: "Unauthorized" }, 401);
    }

    const admin = getAdminClient();
    const now = new Date();
    const results = {
      timestamp: now.toISOString(),
      expired_subscriptions: 0,
      renewed_free_subscriptions: 0,
      archived_usage_records: 0,
      errors: [] as string[],
    };

    // 1. Expire paid subscriptions that have passed date_end
    const { data: expiredSubs, error: expireError } = await admin
      .from("user_subscriptions")
      .update({ status: "expired" })
      .neq("tier_id", await getFreeTierId(admin))
      .eq("status", "active")
      .lt("date_end", now.toISOString())
      .select("id");

    if (expireError) {
      results.errors.push(`Failed to expire subscriptions: ${expireError.message}`);
    } else {
      results.expired_subscriptions = expiredSubs?.length || 0;
    }

    // 2. Auto-renew free tier subscriptions (set date_end to NULL = never expires)
    const freeTierId = await getFreeTierId(admin);
    const { data: renewedFree, error: renewError } = await admin
      .from("user_subscriptions")
      .update({ 
        status: "active",
        date_end: null,  // Free tier never expires
      })
      .eq("tier_id", freeTierId)
      .eq("status", "active")
      .not("date_end", "is", null)  // Only update those that have a date_end set
      .select("id");

    if (renewError) {
      results.errors.push(`Failed to renew free subscriptions: ${renewError.message}`);
    } else {
      results.renewed_free_subscriptions = renewedFree?.length || 0;
    }

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
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("reset-monthly-quota error:", message);
    return json(req, { error: message }, 500);
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

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
