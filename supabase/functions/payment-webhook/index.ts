/**
 * Legacy Payment Webhook
 *
 * Payment gateway flow is currently disabled.
 *
 * Current payment flow:
 * - User transfers manually to CV Pintar bank account.
 * - User confirms via WhatsApp with:
 *   "Saya sudah melakukan transfer untuk Upgrade <tier>"
 * - User uploads transfer proof in WhatsApp.
 * - Admin verifies proof and activates the subscription manually.
 */

import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  return new Response(
    JSON.stringify({
      error: "Payment gateway webhook is disabled. Payments are verified manually via WhatsApp.",
      current_flow:
        'Transfer manual, lalu konfirmasi WhatsApp dengan teks "Saya sudah melakukan transfer untuk Upgrade <tier>" dan lampirkan bukti transfer.',
    }),
    { status: 410, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
  );
});
