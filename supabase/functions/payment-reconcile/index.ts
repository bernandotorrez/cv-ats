/**
 * payment-reconcile — Cocokkan order "Menunggu" dengan status di SumoPod.
 *
 * Untuk order yang sudah dibayar tapi webhook-nya tidak pernah masuk (secret
 * salah, SumoPod gangguan, dsb). Dipanggil admin dari /admin/payments.
 *
 * POST /payment-reconcile
 * Body: { order_id?: string }  — kosong = semua order pending ≤ 9 hari terakhir
 *
 * Keamanan:
 * - JWT pemanggil wajib & harus punya role admin (user_roles).
 * - Status diambil langsung dari API SumoPod (X-Api-Key, server-side).
 * - Aktivasi hanya bila SumoPod menyatakan "completed", order_id/payment_id
 *   cocok, lalu lewat RPC `fulfill_payment_order` (validasi amount, idempotent).
 *
 * Secrets:
 * - SUMOPOD_PAY_API_KEY (wajib)
 * - SUMOPOD_PAY_STATUS_URL (opsional) — base URL cek status; default
 *   SUMOPOD_PAY_API_URL (…/api/v1/payments). Request: GET <base>/<payment_id>.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { runInBackground, sendPaymentSuccessEmails } from "../_shared/email.ts";

const SUMOPOD_API_URL =
  Deno.env.get("SUMOPOD_PAY_API_URL") || "https://api-pay.sumopod.com/api/v1/payments";
const STATUS_BASE_URL = (Deno.env.get("SUMOPOD_PAY_STATUS_URL") || SUMOPOD_API_URL).replace(
  /\/+$/,
  "",
);
const ORDER_ID_RE = /^CVP-\d{8}-[A-Z0-9]{10}$/;
const LOOKBACK_DAYS = 9; // link 24 jam + QR 7 hari + jeda
const MAX_ORDERS_PER_RUN = 30;

type GatewayPayment = {
  payment_id?: string;
  order_id?: string;
  status?: string;
  amount?: number | string;
  payment_method?: string;
  paid_at?: string;
};

type ReconcileResult = {
  order_id: string;
  gateway_status: string | null;
  action: "fulfilled" | "expired" | "failed" | "unchanged" | "error";
  error?: string;
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
      return json(req, { error: "SUMOPOD_PAY_API_KEY belum diset." }, 503);
    }

    const requesterId = await getUserId(req);
    const admin = getAdminClient();

    const { data: requesterRole, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!requesterRole) {
      return json(req, { error: "Forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as { order_id?: unknown };
    const singleOrderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
    if (singleOrderId && !ORDER_ID_RE.test(singleOrderId)) {
      return json(req, { error: "order_id tidak valid." }, 400);
    }

    let query = admin
      .from("payment_orders")
      .select("order_id, gateway_payment_id")
      .eq("status", "pending")
      .is("fulfilled_at", null)
      .not("gateway_payment_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS_PER_RUN);
    query = singleOrderId
      ? query.eq("order_id", singleOrderId)
      : query.gte(
          "created_at",
          new Date(Date.now() - LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString(),
        );

    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;

    const results: ReconcileResult[] = [];
    for (const order of orders ?? []) {
      results.push(await reconcileOrder(admin, apiKey, order.order_id, order.gateway_payment_id));
    }

    const counts = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.action] = (acc[r.action] ?? 0) + 1;
      return acc;
    }, {});
    console.log("payment-reconcile:", JSON.stringify(counts));

    return json(req, { checked: results.length, counts, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("payment-reconcile error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Unauthorized" }, 401);
    }
    return json(req, { error: "Terjadi kesalahan." }, 500);
  }
});

async function reconcileOrder(
  admin: ReturnType<typeof getAdminClient>,
  apiKey: string,
  orderId: string,
  paymentId: string,
): Promise<ReconcileResult> {
  let payment: GatewayPayment;
  try {
    const res = await fetch(`${STATUS_BASE_URL}/${encodeURIComponent(paymentId)}`, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    const raw = await res.text();
    if (!res.ok) {
      return {
        order_id: orderId,
        gateway_status: null,
        action: "error",
        error: `gateway_http_${res.status}: ${raw.slice(0, 120)}`,
      };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Terima respons datar maupun dibungkus { data: {...} }
    payment =
      !parsed.status && parsed.data && typeof parsed.data === "object"
        ? (parsed.data as GatewayPayment)
        : (parsed as GatewayPayment);
  } catch (e) {
    return {
      order_id: orderId,
      gateway_status: null,
      action: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const status = typeof payment.status === "string" ? payment.status.toLowerCase() : null;

  if (payment.order_id && payment.order_id !== orderId) {
    return {
      order_id: orderId,
      gateway_status: status,
      action: "error",
      error: "order_id_mismatch",
    };
  }
  if (payment.payment_id && payment.payment_id !== paymentId) {
    return {
      order_id: orderId,
      gateway_status: status,
      action: "error",
      error: "payment_id_mismatch",
    };
  }

  if (status === "completed") {
    const { data: result, error } = await admin.rpc("fulfill_payment_order", {
      p_order_id: orderId,
      p_gateway_payment_id: paymentId,
      p_amount: Math.round(Number(payment.amount)),
      p_payment_method: payment.payment_method ?? null,
      p_paid_at: payment.paid_at ?? null,
    });
    if (error) {
      await admin
        .from("payment_orders")
        .update({ last_event: `error: ${error.message.slice(0, 200)}` })
        .eq("order_id", orderId);
      return { order_id: orderId, gateway_status: status, action: "error", error: error.message };
    }
    if ((result as { already_fulfilled?: boolean } | null)?.already_fulfilled === false) {
      await admin
        .from("payment_orders")
        .update({ last_event: "reconcile: payment.completed" })
        .eq("order_id", orderId);
      runInBackground(sendPaymentSuccessEmails(admin, orderId, "reconcile"));
    }
    return { order_id: orderId, gateway_status: status, action: "fulfilled" };
  }

  if (status === "expired" || status === "failed") {
    const { error } = await admin
      .from("payment_orders")
      .update({ status, last_event: `reconcile: payment.${status}` })
      .eq("order_id", orderId)
      .eq("status", "pending");
    if (error) {
      return { order_id: orderId, gateway_status: status, action: "error", error: error.message };
    }
    return { order_id: orderId, gateway_status: status, action: status };
  }

  return { order_id: orderId, gateway_status: status, action: "unchanged" };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
