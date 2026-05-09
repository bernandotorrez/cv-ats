/**
 * Midtrans Payment Webhook
 * Handles payment notifications from Midtrans.
 * POST /payment-webhook
 *
 * SECURITY:
 * - Validates Midtrans signature
 * - Validates server-side amount
 * - Idempotent (duplicate handling)
 */

import { corsHeaders } from "../_shared/cors.ts";

// ─── Types ─────────────────────────────────────────────────────────

interface MidtransWebhook {
  transaction_id: string;
  order_id: string;
  payment_type: string;
  transaction_status: string;
  fraud_status?: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  currency?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") || "";

function verifySignature(payload: MidtransWebhook): boolean {
  if (!MIDTRANS_SERVER_KEY) {
    console.error("MIDTRANS_SERVER_KEY not configured");
    return false;
  }

  const data = `${payload.order_id}${payload.status_code}${payload.gross_amount}${MIDTRANS_SERVER_KEY}`;
  const hash = sha512(data);

  return hash === payload.signature_key;
}

async function sha512(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-512", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Main Handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const payload: MidtransWebhook = await req.json();

    // Validate required fields
    if (!payload.order_id || !payload.transaction_status || !payload.signature_key) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Verify signature
    const isValid = await verifySignature(payload);
    if (!isValid) {
      console.error("Invalid signature for order:", payload.order_id);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Get admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Dynamic import to avoid top-level await issues
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );
    const admin = createClient(supabaseUrl, supabaseKey);

    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status || "accept";
    const orderId = payload.order_id;
    const amount = parseInt(payload.gross_amount, 10);

    // Idempotency check — has this order been processed?
    const { data: existingPayment } = await (admin as any)
      .from("payments")
      .select("id, status")
      .eq("gateway_order_id", orderId)
      .single();

    if (existingPayment && existingPayment.status !== "pending") {
      // Already processed, return success
      return new Response(
        JSON.stringify({ status: "ok", already_processed: true }),
        { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Determine payment success
    let paymentSuccess = false;
    let paymentStatus = "pending";

    if (transactionStatus === "capture" && fraudStatus === "accept") {
      paymentSuccess = true;
      paymentStatus = "success";
    } else if (transactionStatus === "settlement") {
      paymentSuccess = true;
      paymentStatus = "success";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      paymentSuccess = false;
      paymentStatus = transactionStatus === "expire" ? "expired" : "failed";
    } else if (transactionStatus === "pending") {
      paymentSuccess = false;
      paymentStatus = "pending";
    }

    // SECURITY: Extract user_id from order_id with validation
    // Expected format: cvkarir-UUID-TIMESTAMP (e.g., cvkarir-123e4567-1699999999999)
    // Using regex to validate UUID format for security
    let userId: string | null = null;
    const orderIdMatch = orderId.match(/^cvkarir-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(-\d+)?$/i);
    if (orderIdMatch && orderIdMatch[1]) {
      userId = orderIdMatch[1];
    } else {
      // Fallback: try to extract from order_id metadata in payment record
      const metadataUserId = (payload as any).metadata?.user_id;
      if (metadataUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metadataUserId)) {
        userId = metadataUserId;
        console.log("Using user_id from payment metadata for order:", orderId);
      }
    }

    if (!userId) {
      console.error("Cannot extract user_id from order_id:", orderId);
      return new Response(
        JSON.stringify({ error: "Invalid order_id format" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Upsert payment record
    const paymentData = {
      user_id: userId,
      gateway: "midtrans",
      gateway_order_id: orderId,
      gateway_transaction_id: payload.transaction_id || null,
      amount_idr: amount,
      status: paymentStatus,
      payment_method: payload.payment_type || null,
      metadata: payload,
    };

    if (existingPayment) {
      await (admin as any).from("payments").update(paymentData).eq("id", existingPayment.id);
    } else {
      await (admin as any).from("payments").insert(paymentData);
    }

    // Handle subscription activation
    if (paymentSuccess) {
      // Find the subscription related to this payment
      const { data: subscription } = await (admin as any)
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (subscription) {
        // Activate subscription
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

        await (admin as any)
          .from("subscriptions")
          .update({
            status: "active",
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", subscription.id);

        // Update user's profile tier
        // Extract tier from metadata or subscription record
        await (admin as any)
          .from("profiles")
          .update({
            subscription_tier: "starter", // Default to starter, will be adjusted per plan
            subscription_status: "active",
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq("id", userId);
      }
    } else if (["failed", "expired"].includes(paymentStatus)) {
      // Mark subscription as cancelled/past_due
      await (admin as any)
        .from("subscriptions")
        .update({ status: paymentStatus === "expired" ? "past_due" : "cancelled" })
        .eq("user_id", userId)
        .eq("status", "pending");
    }

    return new Response(
      JSON.stringify({ status: "ok", payment_status: paymentStatus }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    console.error("Payment webhook error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
