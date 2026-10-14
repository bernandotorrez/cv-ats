/**
 * admin-payment-fulfill — Aktivasi manual order yang sudah dibayar (Completed
 * di SumoPod) tapi gagal diaktifkan webhook. Dipanggil dari /admin/payments.
 *
 * POST /admin-payment-fulfill
 * Body: { order_id: string }
 *
 * Keamanan:
 * - JWT pemanggil wajib & harus punya role admin (user_roles).
 * - Aktivasi lewat RPC atomik & idempotent `fulfill_payment_order` (service_role),
 *   memakai nominal yang tercatat di order — tidak ada input nominal dari client.
 * - Saat aktivasi pertama: email konfirmasi ke pembeli + notifikasi CS (terpisah).
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { runInBackground, sendPaymentSuccessEmails } from "../_shared/email.ts";

const ORDER_ID_RE = /^CVP-\d{8}-[A-Z0-9]{10}$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
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
    const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
    if (!ORDER_ID_RE.test(orderId)) {
      return json(req, { error: "order_id tidak valid." }, 400);
    }

    const { data: order, error: orderError } = await admin
      .from("payment_orders")
      .select("order_id, gateway_payment_id, amount_idr, gateway_amount_idr, payment_method")
      .eq("order_id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) {
      return json(req, { error: "Order tidak ditemukan." }, 404);
    }

    const { data: result, error: fulfillError } = await admin.rpc("fulfill_payment_order", {
      p_order_id: order.order_id,
      p_gateway_payment_id: order.gateway_payment_id,
      p_amount: order.gateway_amount_idr ?? order.amount_idr,
      p_payment_method: order.payment_method,
      p_paid_at: null,
    });
    if (fulfillError) {
      return json(req, { error: fulfillError.message }, 422);
    }

    const alreadyFulfilled = (result as { already_fulfilled?: boolean } | null)?.already_fulfilled;
    if (alreadyFulfilled === false) {
      await admin
        .from("payment_orders")
        .update({ last_event: `manual_fulfill by ${requesterId}` })
        .eq("order_id", orderId);
      console.log(`admin-payment-fulfill: ${orderId} diaktifkan oleh ${requesterId}`);
      runInBackground(sendPaymentSuccessEmails(admin, orderId, "manual"));
    }

    return json(req, { ok: true, already_fulfilled: alreadyFulfilled === true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("admin-payment-fulfill error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Unauthorized" }, 401);
    }
    return json(req, { error: "Terjadi kesalahan." }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
