/**
 * Tryout API — pemanggil edge function tryout dengan token sesi, timeout, dan
 * pesan error yang konsisten. Token kedaluwarsa di-refresh sekali otomatis.
 */
import { supabase } from "@/integrations/supabase/client";

export class TryoutApiError extends Error {
  status: number;
  code?: string;
  data: Record<string, unknown>;
  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message);
    this.name = "TryoutApiError";
    this.status = status;
    this.code = typeof data.error === "string" ? data.error : undefined;
    this.data = data;
  }
}

type TryoutFunction = "tryout-start" | "tryout-submit" | "tryout-result" | "tryout-explain";

async function getToken(forceRefresh = false): Promise<string | null> {
  if (forceRefresh) {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function callTryoutFunction<T>(
  fn: TryoutFunction,
  body: Record<string, unknown>,
  opts: { timeoutMs?: number; keepalive?: boolean } = {},
): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(attempt > 0);
    if (!token) {
      throw new TryoutApiError("Sesi login habis. Silakan login ulang.", 401);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);
    let res: Response;
    try {
      res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        keepalive: opts.keepalive,
      });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err instanceof DOMException && err.name === "AbortError";
      throw new TryoutApiError(
        aborted
          ? "Server terlalu lama merespons. Periksa koneksi lalu coba lagi."
          : "Tidak dapat terhubung ke server. Periksa koneksi internet kamu.",
        0,
      );
    }
    clearTimeout(timer);

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 401 && attempt === 0) continue; // refresh token lalu ulangi
    if (!res.ok) {
      const message =
        (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        (res.status === 429
          ? "Terlalu banyak permintaan. Coba lagi sebentar."
          : "Terjadi kesalahan. Coba lagi.");
      throw new TryoutApiError(message, res.status, data);
    }
    return data as T;
  }
  throw new TryoutApiError("Sesi login habis. Silakan login ulang.", 401);
}
