/**
 * API Route: AI CV Review
 * Forwards request to Supabase Edge Function.
 *
 * SECURITY: same-origin only — no CORS headers are sent, so other sites cannot
 * read responses from this proxy. Errors return a generic message; details are
 * logged server-side only.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai-cv-review")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/ai-cv-review`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: request.headers.get("Authorization") || "",
            },
            body: JSON.stringify(await request.json()),
          });

          const data = await response.json();

          return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("api/ai-cv-review proxy error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
