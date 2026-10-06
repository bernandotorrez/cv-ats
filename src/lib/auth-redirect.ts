/**
 * Tujuan redirect setelah login. Hanya path internal (cegah open redirect):
 * harus diawali "/" tapi bukan "//" atau "/\\" (protocol-relative).
 */
export function safeRedirectTarget(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
