/**
 * API Route: AI CV Review
 * Forwards request to Supabase Edge Function
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai-cv-review")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const corsHeaders = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        if (request.method === "OPTIONS") {
          return new Response(null, { headers: corsHeaders });
        }

        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/ai-cv-review`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": request.headers.get("Authorization") || "",
            },
            body: JSON.stringify(await request.json()),
          });

          const data = await response.json();
          
          return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          });
        }
      },
    },
  },
});
