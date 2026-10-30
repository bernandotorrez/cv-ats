/**
 * Abuse Alert Digest
 *
 * Dipanggil pg_cron (trigger_abuse_alert_digest, tiap 30 menit) hanya jika ada
 * alert akun ganda baru. Mengklaim alert terbuka yang belum di-email, lalu
 * mengirim satu email ringkasan ke ADMIN_NOTIFY_EMAIL. Jika email gagal,
 * alert dikembalikan ke antrean (emailed_at = null) untuk dicoba lagi.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/ai-common.ts";
import { sendAbuseAlertDigest, type AbuseAlertDigestItem } from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    // Dipanggil pg_cron via pg_net tanpa JWT (verify_jwt = false di config.toml),
    // jadi cron secret ini satu-satunya autentikasi — gagal tertutup jika kosong.
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
    const { data, error } = await admin.rpc("claim_abuse_alert_digest");
    if (error) {
      console.error("claim_abuse_alert_digest failed:", error.message);
      return json(req, { error: "Internal server error" }, 500);
    }

    const alerts = (data ?? []) as AbuseAlertDigestItem[];
    if (alerts.length === 0) {
      return json(req, { success: true, sent: 0 });
    }

    const sent = await sendAbuseAlertDigest(alerts);
    if (!sent) {
      const { error: releaseError } = await admin
        .from("abuse_alerts")
        .update({ emailed_at: null })
        .in(
          "id",
          alerts.map((a) => a.id),
        );
      if (releaseError) console.error("release abuse alerts failed:", releaseError.message);
      return json(req, { error: "Email gagal dikirim" }, 502);
    }

    return json(req, { success: true, sent: alerts.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("abuse-alert-digest error:", message);
    return json(req, { error: "Internal server error" }, 500);
  }
});

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
