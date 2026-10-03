/**
 * Pembayaran SumoPod — client hanya mengirim product key.
 * Harga, order_id, dan payment link dibuat di Edge Function `payment-create`.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = (import.meta.env.VITE_SUPABASE_URL || "") + "/functions/v1";

export type ProductKey =
  "tier:starter" | "tier:pro" | "addon:upload_cv" | "addon:pro_photo" | `tryout:${string}`;

export type PaymentOrderStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";

export interface CreatePaymentResult {
  order_id: string;
  amount: number;
  payment_link_url: string;
  expires_at: string;
}

export async function createPayment(
  product: ProductKey,
  quantity = 1,
): Promise<CreatePaymentResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${BASE_URL}/payment-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ product, quantity }),
  });
  const json = (await res.json().catch(() => ({}))) as Partial<CreatePaymentResult> & {
    error?: string;
  };
  if (!res.ok || !json.payment_link_url) {
    throw new Error(json.error || `Gagal membuat pembayaran (${res.status})`);
  }
  return json as CreatePaymentResult;
}

/**
 * Hook checkout: redirect ke login bila belum masuk, lalu ke halaman bayar SumoPod.
 * `pending` berisi product key yang sedang diproses (untuk state loading tombol).
 */
export function useCheckout() {
  const [pending, setPending] = useState<string | null>(null);

  // Reset loading saat user kembali via tombol back (halaman dipulihkan dari bfcache)
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function checkout(product: ProductKey, quantity = 1) {
    if (pending) return;
    setPending(product);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.assign(
          `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
        return;
      }
      const payment = await createPayment(product, quantity);
      window.location.assign(payment.payment_link_url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat pembayaran.");
      setPending(null);
    }
  }

  return { checkout, pending };
}
