/**
 * CORS Configuration — exact-match origin allowlist
 *
 * SECURITY:
 * - Only exact origins are allowed (no wildcard / regex patterns). Preview
 *   deployments can be enabled explicitly via the CORS_EXTRA_ORIGINS secret
 *   (comma-separated list of exact origins, e.g. "https://my-preview.vercel.app").
 * - Localhost origins are only accepted in development mode (local Supabase CLI
 *   or ALLOW_DEV_CORS=true).
 * - Disallowed origins are never reflected; the canonical production origin is
 *   returned instead, so the browser blocks the cross-origin read.
 * - No Access-Control-Allow-Credentials: auth uses Bearer tokens, not cookies.
 * - `Vary: Origin` so shared caches never serve one origin's CORS headers to another.
 */

// Production origins - deployed frontend domains (exact match only)
const PRODUCTION_ORIGINS = ["https://cvpintar.web.id", "https://www.cvpintar.web.id"];

// Development origins - only accepted when isDevelopmentMode() is true
const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8000",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8080",
];

const ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type, x-requested-with";
const ALLOW_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";

/** Extra exact origins from the CORS_EXTRA_ORIGINS secret (optional). */
function getExtraOrigins(): string[] {
  const raw = Deno.env.get("CORS_EXTRA_ORIGINS") || "";
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter((o) => /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(o));
}

/**
 * Development mode:
 * 1. ALLOW_DEV_CORS=true (explicit opt-in), or
 * 2. Running under the local Supabase CLI (SUPABASE_URL points at the local gateway).
 */
function isDevelopmentMode(): boolean {
  if (Deno.env.get("ALLOW_DEV_CORS") === "true") return true;

  try {
    const host = new URL(Deno.env.get("SUPABASE_URL") || "").hostname;
    return ["kong", "localhost", "127.0.0.1", "host.docker.internal"].includes(host);
  } catch {
    return false;
  }
}

function getAllowedOrigins(): string[] {
  const origins = [...PRODUCTION_ORIGINS, ...getExtraOrigins()];
  if (isDevelopmentMode()) origins.push(...DEV_ORIGINS);
  return origins;
}

/**
 * Get CORS headers for a request.
 * Reflects the request Origin only when it exactly matches the allowlist.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = origin !== "" && getAllowedOrigins().includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : PRODUCTION_ORIGINS[0],
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Static CORS headers, used when the request origin is not available.
 */
export const corsHeadersStatic: Record<string, string> = {
  "Access-Control-Allow-Origin": PRODUCTION_ORIGINS[0],
  "Access-Control-Allow-Headers": ALLOW_HEADERS,
  "Access-Control-Allow-Methods": ALLOW_METHODS,
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

/**
 * Wildcard CORS headers for development/testing.
 * WARNING: Only use in development, never in production.
 */
export function corsHeadersWildcard(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Max-Age": "86400",
  };
}
