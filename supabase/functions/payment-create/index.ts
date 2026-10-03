/**
 * payment-create — Buat payment link SumoPod untuk user yang login.
 *
 * POST /payment-create
 * Body: { product: "tier:pro" | "tier:starter" | "addon:upload_cv" | "addon:pro_photo" | "tryout:<slug>", quantity?: number }
 *
 * Keamanan:
 * - Harga & nama produk dihitung di server (payment-products.ts / database).
 * - order_id dibuat di server; order disimpan dulu (pending) sebelum memanggil gateway.
 * - Rate limit per user; order pending yang masih berlaku dipakai ulang.
 * - API key SumoPod hanya ada di secret edge function.
 *
 * Secrets:
 * - SUMOPOD_PAY_API_KEY (wajib)
 * - SUMOPOD_PAY_API_URL (opsional, default https://api-pay.sumopod.com/api/v1/payments)
 * - SITE_URL (opsional, default https://cvpintar.web.id) — base URL redirect /payment/success & /payment/cancel
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { resolveProduct } from "../_shared/payment-products.ts";

const SUMOPOD_API_URL =
  Deno.env.get("SUMOPOD_PAY_API_URL") || "https://api-pay.sumopod.com/api/v1/payments";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://cvpintar.web.id").replace(/\/+$/, "");

// Origin yang boleh dipakai sebagai base redirect (selain SITE_URL)
const RETURN_ORIGINS = new Set([
  SITE_URL,
  "https://cvpintar.web.id",
  "https://www.cvpintar.web.id",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const EXPIRES_IN_HOURS = 24;
const MAX_ORDERS_PER_10_MIN = 10;
const REUSE_MIN_REMAINING_MS = 15 * 60 * 1000;

type SumopodPaymentResponse = {
  payment_id?: string;
  order_id?: string;
  amount?: number;
  fee?: number;
  net_amount?: number;
  payment_link_url?: string;
  status?: string;
  expires_at?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const apiKey = Deno.env.get("SUMOPOD_PAY_API_KEY");
    if (!apiKey) {
      console.error("payment-create: SUMOPOD_PAY_API_KEY belum diset");
      return json(req, { error: "Pembayaran belum tersedia. Hubungi admin." }, 503);
    }

    const userId = await getUserId(req);
    const admin = getAdminClient();

    const body = (await req.json().catch(() => ({}))) as { product?: unknown; quantity?: unknown };
    let product;
    try {
      product = await resolveProduct(admin, body.product, body.quantity);
    } catch (e) {
      return json(req, { error: e instanceof Error ? e.message : "Produk tidak valid." }, 400);
    }

    // Pakai ulang order pending yang sama & masih lama berlakunya (hindari spam order)
    const { data: existing } = await admin
      .from("payment_orders")
      .select("order_id, amount_idr, payment_link_url, expires_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .eq("product_type", product.type)
      .eq("product_ref", product.ref)
      .eq("quantity", product.quantity)
      .eq("amount_idr", product.amount)
      .not("payment_link_url", "is", null)
      .gt("expires_at", new Date(Date.now() + REUSE_MIN_REMAINING_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.payment_link_url) {
      return json(req, {
        order_id: existing.order_id,
        amount: existing.amount_idr,
        payment_link_url: existing.payment_link_url,
        expires_at: existing.expires_at,
        reused: true,
      });
    }

    // Rate limit
    const { count } = await admin
      .from("payment_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    if ((count ?? 0) >= MAX_ORDERS_PER_10_MIN) {
      return json(req, { error: "Terlalu banyak permintaan pembayaran. Coba lagi beberapa menit lagi." }, 429);
    }

    const orderId = generateOrderId();
    const { error: insertError } = await admin.from("payment_orders").insert({
      order_id: orderId,
      user_id: userId,
      product_type: product.type,
      product_ref: product.ref,
      product_name: product.name,
      quantity: product.quantity,
      amount_idr: product.amount,
      status: "pending",
      gateway: "sumopod",
    });
    if (insertError) throw insertError;

    const returnBase = getReturnBase(req);
    const query = `order_id=${encodeURIComponent(orderId)}`;

    let gatewayRes: Response;
    try {
      gatewayRes = await fetch(SUMOPOD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
        body: JSON.stringify({
          order_id: orderId,
          amount: product.amount,
          currency: "IDR",
          expires_in_hours: EXPIRES_IN_HOURS,
          success_return_url: `${returnBase}/payment/success?${query}`,
          cancel_return_url: `${returnBase}/payment/cancel?${query}`,
          payment_method_type_code: "QRIS",
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      await markCancelled(admin, orderId, "gateway_unreachable");
      console.error("payment-create: gateway unreachable", e);
      return json(req, { error: "Gateway pembayaran tidak dapat dihubungi. Coba lagi." }, 502);
    }

    const rawText = await gatewayRes.text();
    let payment: SumopodPaymentResponse = {};
    try {
      payment = JSON.parse(rawText);
    } catch {
      // handled below
    }

    if (!gatewayRes.ok || !payment.payment_id || !isTrustedPaymentUrl(payment.payment_link_url)) {
      await markCancelled(admin, orderId, `gateway_error_${gatewayRes.status}`);
      console.error(`payment-create: gateway error (${gatewayRes.status}):`, rawText.slice(0, 500));
      return json(req, { error: "Gagal membuat pembayaran. Coba lagi." }, 502);
    }

    if (
      (payment.order_id != null && payment.order_id !== orderId) ||
      (payment.amount != null && Number(payment.amount) !== product.amount)
    ) {
      await markCancelled(admin, orderId, "gateway_response_mismatch");
      console.error("payment-create: response mismatch", { orderId, payment });
      return json(req, { error: "Gagal membuat pembayaran. Coba lagi." }, 502);
    }

    const expiresAt =
      payment.expires_at || new Date(Date.now() + EXPIRES_IN_HOURS * 3600 * 1000).toISOString();

    const { error: updateError } = await admin
      .from("payment_orders")
      .update({
        gateway_payment_id: payment.payment_id,
        payment_link_url: payment.payment_link_url,
        fee_idr: typeof payment.fee === "number" ? payment.fee : null,
        net_amount_idr: typeof payment.net_amount === "number" ? payment.net_amount : null,
        expires_at: expiresAt,
      })
      .eq("order_id", orderId);
    if (updateError) throw updateError;

    return json(req, {
      order_id: orderId,
      amount: product.amount,
      payment_link_url: payment.payment_link_url,
      expires_at: expiresAt,
      reused: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("payment-create error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Silakan login terlebih dahulu." }, 401);
    }
    return json(req, { error: "Terjadi kesalahan. Coba lagi." }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function generateOrderId(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const rand = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `CVP-${ymd}-${rand}`;
}

function getReturnBase(req: Request): string {
  const origin = (req.headers.get("Origin") || "").replace(/\/+$/, "");
  return RETURN_ORIGINS.has(origin) ? origin : SITE_URL;
}

function isTrustedPaymentUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "sumopod.com" || u.hostname.endsWith(".sumopod.com"));
  } catch {
    return false;
  }
}

async function markCancelled(
  admin: ReturnType<typeof getAdminClient>,
  orderId: string,
  reason: string,
) {
  await admin
    .from("payment_orders")
    .update({ status: "cancelled", last_event: reason })
    .eq("order_id", orderId)
    .eq("status", "pending");
}
