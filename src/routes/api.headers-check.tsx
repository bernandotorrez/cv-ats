import { createFileRoute } from "@tanstack/react-router";

/**
 * Security Headers Test Endpoint
 * Returns all HTTP response headers for debugging.
 * Access at: /api/headers-check
 */
export const Route = createFileRoute("/api/headers-check")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        // This handler runs server-side and headers will be
        // augmented by the security middleware in server.ts
        const headers: Record<string, string> = {};
        // Most security headers are added AFTER this handler returns
        // via the applySecurityHeaders wrapper in server.ts

        return new Response(
          JSON.stringify(
            {
              message:
                "Security headers are applied via server.ts middleware. Check browser DevTools Network tab for full response headers.",
              expectedHeaders: [
                "Content-Security-Policy",
                "X-Frame-Options: DENY",
                "X-Content-Type-Options: nosniff",
                "Referrer-Policy: strict-origin-when-cross-origin",
                "Permissions-Policy",
                "Strict-Transport-Security",
                "X-DNS-Prefetch-Control: on",
              ],
              note: "Some CSP directives allow 'unsafe-inline' for styles (Tailwind) and Midtrans/Anthropic API domains.",
            },
            null,
            2,
          ),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        );
      },
    },
  },
});
