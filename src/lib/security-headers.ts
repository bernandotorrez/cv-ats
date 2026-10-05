/**
 * Security Headers — OWASP Top 10 & Best Practices
 * Reference: skill.md section 5.1
 * Applied to all HTTP responses via server.ts wrapper.
 */

// CSP directives tailored for cvpintar.web.id
//
// SECURITY NOTES:
// - 'unsafe-eval' removed: nothing in the client bundle needs it. pdfjs-dist 5.x
//   contains no eval/new Function; bluebird (via mammoth) only uses
//   `new Function` outside the browser (canEvaluate = no navigator).
// - 'unsafe-inline' is still required in script-src: TanStack Start injects
//   inline hydration/dehydration scripts during SSR, and the gtag bootstrap in
//   __root.tsx is inline. Moving to a per-request nonce (router `ssr.nonce` +
//   'strict-dynamic') is the follow-up; JSON-LD output is escaped (seo.ts) to
//   close the known injection path in the meantime.
// - style-src keeps 'unsafe-inline' for Tailwind/shadcn inline styles.
// - The frontend never calls the AI gateway directly (all AI goes through
//   Supabase edge functions), so it is not in connect-src.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.hcaptcha.com https://*.hcaptcha.com https://va.vercel-scripts.com https://www.googletagmanager.com https://static.cloudflareinsights.com https://benixai.web.id https://www.benixai.web.id https://*.benixai.web.id",
  "style-src 'self' 'unsafe-inline' https://*.hcaptcha.com",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.hcaptcha.com https://www.google-analytics.com https://*.google-analytics.com https://benixai.web.id https://www.benixai.web.id https://*.benixai.web.id",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.hcaptcha.com https://analytics.google.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://cloudflareinsights.com https://*.cloudflareinsights.com https://csp-reporting.cloudflare.com https://benixai.web.id https://www.benixai.web.id https://*.benixai.web.id wss://benixai.web.id wss://www.benixai.web.id wss://*.benixai.web.id",
  "frame-src https://*.hcaptcha.com https://newassets.hcaptcha.com https://benixai.web.id https://www.benixai.web.id https://*.benixai.web.id",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
  // CSP — mencegah XSS, data injection, dan code execution attacks
  "Content-Security-Policy": CSP_DIRECTIVES,

  // Mencegah clickjacking dengan melarang iframe dari domain lain
  "X-Frame-Options": "DENY",

  // Mencegah MIME-type sniffing (IE/Chrome)
  "X-Content-Type-Options": "nosniff",

  // Membatasi informasi referrer yang dikirim ke domain lain
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Membatasi browser API yang bisa digunakan
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), interest-cohort=()",

  // HSTS — force HTTPS (max 2 tahun, include subdomains, preload ready)
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // Hint browser untuk pre-resolve DNS
  "X-DNS-Prefetch-Control": "on",

  // Informasi server minimal (jangan tampilkan tech stack)
  Server: "cvpintar.web.id",
};

/**
 * Apply security headers to an existing Response.
 * Merges with any existing headers (non-destructive for existing custom headers).
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    // Don't override CSP if already set by a downstream handler
    if (key === "Content-Security-Policy" && headers.has("Content-Security-Policy")) {
      continue;
    }
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Creates a new Response with security headers from scratch.
 */
export function createSecureResponse(body?: BodyInit | null, init?: ResponseInit): Response {
  const response = new Response(body, init);
  return applySecurityHeaders(response);
}
