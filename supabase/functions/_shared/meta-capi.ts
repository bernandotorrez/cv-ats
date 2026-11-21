/**
 * Meta Conversions API (server-side) — event Purchase untuk pembayaran lunas.
 *
 * Dipanggil dari payment-webhook / payment-reconcile tepat setelah aktivasi pertama
 * (`already_fulfilled === false`). Browser mengirim event yang sama dari halaman
 * /payment/success dengan event_id = order_id, sehingga Meta menghitungnya sekali.
 *
 * Tidak pernah melempar error dan tidak pernah menahan proses pembayaran.
 *
 * Secrets (Supabase Edge Functions); semuanya opsional, tanpa dua yang pertama modul ini no-op:
 * - META_PIXEL_ID          : ID Pixel / dataset
 * - META_CAPI_ACCESS_TOKEN : token Conversions API (Events Manager → Settings → Generate access token)
 * - META_TEST_EVENT_CODE   : kode "Test events" untuk menguji tanpa mencemari data asli
 * - META_GRAPH_VERSION     : versi Graph API, default v23.0
 */
import type { getAdminClient } from "./ai-common.ts";
import { getAccountEmail, SITE_URL } from "./email.ts";

type AdminClient = ReturnType<typeof getAdminClient>;

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v23.0";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

type TrackingRow = {
  fbp: string | null;
  fbc: string | null;
  event_source_url: string | null;
  client_ip: string | null;
  client_user_agent: string | null;
} | null;

export async function sendMetaPurchase(admin: AdminClient, orderId: string): Promise<void> {
  const pixelId = Deno.env.get("META_PIXEL_ID");
  const accessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  if (!pixelId || !accessToken) return;

  try {
    const { data: order, error } = await admin
      .from("payment_orders")
      .select("order_id, user_id, product_type, product_ref, product_name, quantity, amount_idr, paid_at")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error || !order) {
      console.error("sendMetaPurchase: order tidak ditemukan", orderId, error?.message);
      return;
    }

    const { data: trackingData } = await admin
      .from("payment_order_tracking")
      .select("fbp, fbc, event_source_url, client_ip, client_user_agent")
      .eq("order_id", orderId)
      .maybeSingle();
    const tracking = (trackingData ?? null) as TrackingRow;

    const account = await getAccountEmail(admin, order.user_id);

    const userData: Record<string, unknown> = {
      external_id: [await sha256Hex(String(order.user_id))],
    };
    if (account?.email) userData.em = [await sha256Hex(account.email.trim().toLowerCase())];
    if (tracking?.fbp) userData.fbp = tracking.fbp;
    if (tracking?.fbc) userData.fbc = tracking.fbc;
    if (tracking?.client_ip) userData.client_ip_address = tracking.client_ip;
    if (tracking?.client_user_agent) userData.client_user_agent = tracking.client_user_agent;

    const paidAtMs = order.paid_at ? Date.parse(order.paid_at) : NaN;
    const eventTime = Math.floor((Number.isFinite(paidAtMs) ? paidAtMs : Date.now()) / 1000);

    const body: Record<string, unknown> = {
      data: [
        {
          event_name: "Purchase",
          event_time: eventTime,
          event_id: order.order_id,
          // Event 'website' mewajibkan user agent pembeli. Bila order tidak punya data
          // tracking (mis. dibuat sebelum fitur ini), kirim sebagai system_generated.
          action_source: tracking?.client_user_agent ? "website" : "system_generated",
          event_source_url: tracking?.event_source_url || `${SITE_URL}/tryout/beli`,
          user_data: userData,
          custom_data: {
            currency: "IDR",
            value: order.amount_idr,
            content_type: "product",
            content_ids: [order.product_type],
            content_category: order.product_type,
            content_name: order.product_name,
            num_items: order.quantity,
            order_id: order.order_id,
          },
        },
      ],
    };
    const testCode = Deno.env.get("META_TEST_EVENT_CODE");
    if (testCode) body.test_event_code = testCode;

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) {
      console.error(`sendMetaPurchase: HTTP ${res.status}`, (await res.text()).slice(0, 500));
      return;
    }
    console.log(`sendMetaPurchase: ${orderId} terkirim`);
  } catch (e) {
    console.error("sendMetaPurchase failed:", e);
  }
}
