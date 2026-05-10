/**
 * AI Chat — panduan AI interaktif untuk CV
 * POST /ai-chat
 */
import { aiComplete, checkAndTrackQuota, corsResponse, errorResponse, getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import type { AiMessage } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { messages, jsonMode } = await req.json();

    if (!messages || !Array.isArray(messages)) throw new Error("messages diperlukan");

    const result = await aiComplete(messages as AiMessage[], {
      temperature: 0.7,
      maxTokens: 2000,
      jsonMode: jsonMode || false,
    });

    await checkAndTrackQuota(admin, userId, "chat", result.length);

    return corsResponse({ reply: result.trim() }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
