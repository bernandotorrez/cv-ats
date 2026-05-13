/**
 * Security Headers — OWASP Top 10 & Best Practices
 * Reference: skill.md section 5.1
 * Applied to all HTTP responses via server.ts wrapper.
 */

// CSP directives tailored for cvpintar.web.id
//
// SECURITY NOTE: These directives contain 'unsafe-inline' and 'unsafe-eval' for the following reasons:
// - 'unsafe-inline': Required by Tailwind CSS and inline styles used by shadcn/ui components
// - 'unsafe-eval': Required by the template system for dynamic component compilation
// - Midtrans scripts: Required for Snap payment popup functionality
// - AI Gateway: Required for AI feature connectivity
//
// If a future refactor can eliminate these, security posture would be significantly improved.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://api.midtrans.com https://js.hcaptcha.com https://*.hcaptcha.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.hcaptcha.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.hcaptcha.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ai.sumopod.com https://app.midtrans.com https://*.hcaptcha.com",
  "frame-src https://app.midtrans.com https://*.hcaptcha.com https://newassets.hcaptcha.com",
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
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  // HSTS — force HTTPS (max 2 tahun, include subdomains, preload ready)
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",

  // Hint browser untuk pre-resolve DNS
  "X-DNS-Prefetch-Control": "on",

  // Informasi server minimal (jangan tampilkan tech stack)
  "Server": "cvpintar.web.id",
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
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit,
): Response {
  const response = new Response(body, init);
  return applySecurityHeaders(response);
}
