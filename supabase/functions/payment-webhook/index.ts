/**
 * payment-webhook — Webhook SumoPod Payment Gateway.
 *
 * URL: https://<project-ref>.supabase.co/functions/v1/payment-webhook
 * Deploy dengan verify_jwt = false (lihat supabase/config.toml).
 *
 * Keamanan:
 * - Signature svix (svix-id, svix-timestamp, svix-signature) diverifikasi dengan
 *   SUMOPOD_PAY_WEBHOOK_SECRET (whsec_...) di atas raw body + toleransi waktu 5 menit.
 * - Header X-Webhook-Token dicek dengan SUMOPOD_PAY_WEBHOOK_TOKEN (whtok_...) bila diset.
 * - Minimal salah satu secret wajib diset; jika keduanya diset, keduanya wajib cocok.
 * - Event dicatat per svix-id (dedupe), aktivasi lewat RPC atomik & idempotent
 *   `fulfill_payment_order` yang juga memvalidasi amount & payment_id dengan data order.
 */

import { getAdminClient } from "../_shared/ai-common.ts";
import { runInBackground, sendPaymentEmail } from "../_shared/email.ts";

const TIMESTAMP_TOLERANCE_SEC = 5 * 60;

// Error bisnis: retry tidak akan menolong → balas 2xx agar tidak di-resend terus
const NON_RETRYABLE = [
  "order_not_found",
  "amount_mismatch",
  "payment_id_mismatch",
  "tier_not_found",
  "tryout_package_not_found",
  "profile_not_found",
  "unknown_product_type",
];

type WebhookEvent = {
  event_type?: string;
  data?: {
    payment_id?: string;
    order_id?: string;
    amount?: number;
    status?: string;
    payment_method?: string;
    paid_at?: string;
  };
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return text("Method not allowed", 405);
  }

  const signingSecret = Deno.env.get("SUMOPOD_PAY_WEBHOOK_SECRET") || "";
  const webhookToken = Deno.env.get("SUMOPOD_PAY_WEBHOOK_TOKEN") || "";
  if (!signingSecret && !webhookToken) {
    console.error(
      "payment-webhook: SUMOPOD_PAY_WEBHOOK_SECRET / SUMOPOD_PAY_WEBHOOK_TOKEN belum diset",
    );
    return text("Webhook not configured", 503);
  }

  const rawBody = await req.text();
  const svixId = req.headers.get("svix-id") || "";
  const svixTimestamp = req.headers.get("svix-timestamp") || "";
  const svixSignature = req.headers.get("svix-signature") || "";

  if (webhookToken) {
    const received = req.headers.get("x-webhook-token") || "";
    if (!timingSafeEqual(received, webhookToken)) {
      console.warn("payment-webhook: invalid webhook token");
      return text("Invalid webhook token", 401);
    }
  }

  if (signingSecret) {
    const valid = await verifySvixSignature(
      signingSecret,
      svixId,
      svixTimestamp,
      svixSignature,
      rawBody,
    );
    if (!valid) {
      console.warn("payment-webhook: invalid signature");
      return text("Invalid signature", 401);
    }
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return text("Invalid JSON", 400);
  }

  const eventType = event.event_type || "unknown";
  const data = event.data || {};
  const orderId = typeof data.order_id === "string" ? data.order_id : null;
  const eventKey = svixId || `${eventType}:${data.payment_id || orderId || crypto.randomUUID()}`;

  if (eventType === "payment.test") {
    console.log("payment-webhook: test event received");
    return text("ok", 200);
  }

  const admin = getAdminClient();

  // Dedupe: event yang sudah selesai diproses tidak diproses ulang
  const { data: prior } = await admin
    .from("payment_webhook_events")
    .select("processed_at")
    .eq("svix_id", eventKey)
    .maybeSingle();
  if (prior?.processed_at) {
    return text("ok (duplicate)", 200);
  }

  const { error: logError } = await admin
    .from("payment_webhook_events")
    .upsert(
      { svix_id: eventKey, event_type: eventType, order_id: orderId, payload: event, error: null },
      { onConflict: "svix_id" },
    );
  if (logError) {
    console.error("payment-webhook: gagal mencatat event", logError);
    return text("Temporary error", 500);
  }

  try {
    if (!orderId) throw new Error("order_not_found: missing order_id");

    if (eventType === "payment.completed") {
      if (data.status && data.status !== "completed") {
        throw new Error(`unexpected_status: ${data.status}`);
      }
      const { data: result, error } = await admin.rpc("fulfill_payment_order", {
        p_order_id: orderId,
        p_gateway_payment_id: data.payment_id ?? null,
        p_amount: typeof data.amount === "number" ? Math.round(data.amount) : Number(data.amount),
        p_payment_method: data.payment_method ?? null,
        p_paid_at: data.paid_at ?? null,
      });
      if (error) throw new Error(error.message);
      console.log(`payment-webhook: ${orderId} fulfilled`, result);

      // Email konfirmasi hanya saat aktivasi pertama (bukan webhook ulang)
      if (result && (result as { already_fulfilled?: boolean }).already_fulfilled === false) {
        runInBackground(sendSuccessEmail(admin, orderId));
      }
    } else if (eventType === "payment.failed" || eventType === "payment.expired") {
      const newStatus = eventType === "payment.failed" ? "failed" : "expired";
      let query = admin
        .from("payment_orders")
        .update({ status: newStatus, last_event: eventType })
        .eq("order_id", orderId)
        .eq("status", "pending");
      if (data.payment_id) query = query.eq("gateway_payment_id", data.payment_id);
      const { error } = await query;
      if (error) throw new Error(error.message);
    } else {
      console.log(`payment-webhook: event ${eventType} diabaikan`);
    }

    await admin
      .from("payment_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("svix_id", eventKey);
    return text("ok", 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const nonRetryable =
      NON_RETRYABLE.some((code) => message.includes(code)) ||
      message.startsWith("unexpected_status");
    console.error(`payment-webhook: ${eventType} ${orderId} gagal:`, message);

    await admin
      .from("payment_webhook_events")
      .update({ error: message, processed_at: nonRetryable ? new Date().toISOString() : null })
      .eq("svix_id", eventKey);

    if (nonRetryable) {
      if (orderId) {
        await admin
          .from("payment_orders")
          .update({ last_event: `error: ${message.slice(0, 200)}` })
          .eq("order_id", orderId);
      }
      return text("ok (not processed)", 200);
    }
    return text("Temporary error", 500);
  }
});

async function sendSuccessEmail(admin: ReturnType<typeof getAdminClient>, orderId: string) {
  const { data: order } = await admin
    .from("payment_orders")
    .select(
      "order_id, user_id, product_name, product_type, amount_idr, gateway_amount_idr, paid_at, fulfillment_result",
    )
    .eq("order_id", orderId)
    .maybeSingle();
  if (!order) return;
  await sendPaymentEmail(admin, order.user_id, "success", order);
}

function text(body: string, status: number) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain" } });
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

async function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  rawBody: string,
): Promise<boolean> {
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE_SEC) return false;

  let secretBytes: Uint8Array<ArrayBuffer>;
  try {
    secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  } catch {
    console.error("payment-webhook: SUMOPOD_PAY_WEBHOOK_SECRET bukan base64 valid");
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${svixId}.${svixTimestamp}.${rawBody}`),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // Bisa berisi beberapa "v1,<sig>" dipisah spasi (saat rotasi secret)
  return svixSignature
    .split(" ")
    .map((part) => part.split(",")[1] || "")
    .some((candidate) => timingSafeEqual(candidate, expected));
}
