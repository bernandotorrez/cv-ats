/**
 * Shared AI utilities for all edge functions
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsHeadersStatic } from "./cors.ts";
import {
  type CvUiLang,
  getSystemPrompt,
  getChatSystemPrompt,
  getLanguageInstruction,
  getActionVerbExamples,
} from "./cv-prompts.ts";

// ─── Types ─────────────────────────────────────────────────────────

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  useGuidedPrompt?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const AI_API_KEY = Deno.env.get("AI_API_KEY") || "";
const AI_MODEL = "gemini/gemini-2.5-flash-lite";

export const FEATURE_MAP: Record<string, string> = {
  "ai-suggest": "suggest",
  "ai-score": "score",
  "ai-job-match": "job_match",
  "ai-chat": "chat",
  "ai-cover-letter": "cover_letter",
  "ai-keywords": "keyword_extract",
};

const FEATURE_QUOTA_MAP: Record<string, string> = {
  suggest: "quota_ai_suggest",
  score: "quota_ai_score",
  job_match: "quota_ai_job_match",
  chat: "quota_ai_chat",
  cover_letter: "quota_ai_cover_letter",
  keyword_extract: "quota_ai_keyword_extract",
  cv_review: "quota_cv_review",
  polish: "quota_ai_polish",
  guided: "quota_guided_mode",
};

// ─── Auth ──────────────────────────────────────────────────────────

export async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No valid auth token");
  }
  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("Unauthorized: Invalid auth token");
  }
  return user.id;
}

// ─── Admin Client ──────────────────────────────────────────────────

export function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

// ─── Quota ─────────────────────────────────────────────────────────

export async function checkAndTrackQuota(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  feature: string,
  tokensUsed: number,
): Promise<void> {
  const quotaColumn = FEATURE_QUOTA_MAP[feature];
  if (!quotaColumn) return;

  // Get user's active tier quota
  const { data: userSub } = await adminClient
    .from("user_subscriptions")
    .select(`subscription_tiers!inner(${quotaColumn}, slug, name)`)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  let limit: number | null = null;
  let tierName = "Free";

  if (userSub) {
    const tier = (userSub as any).subscription_tiers;
    limit = tier?.[quotaColumn] ?? 0;
    tierName = tier?.name || "Free";
  } else {
    // Fallback to free tier
    const { data: freeTier } = await adminClient
      .from("subscription_tiers")
      .select(`${quotaColumn}, name`)
      .eq("slug", "free")
      .single();
    if (freeTier) {
      limit = (freeTier as any)[quotaColumn] ?? 0;
      tierName = (freeTier as any).name || "Free";
    }
  }

  if (limit === null) limit = 9999; // null = unlimited, treat as high number

  // Count usage this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count, error } = await adminClient
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", monthStart.toISOString());

  if (error) {
    console.error("Failed to check usage:", error);
    return;
  }
  if (count !== null && count >= limit) {
    throw new Error(`Kuota ${feature} bulan ini habis (${count}/${limit}). Silakan upgrade.`);
  }

  // Track usage
  await adminClient.from("ai_usage").insert({ user_id: userId, feature, tokens_used: tokensUsed });
}

// ─── AI Gateway ────────────────────────────────────────────────────

export { getLanguageInstruction, getActionVerbExamples };
export type { CvUiLang };

export async function aiComplete(
  messages: AiMessage[],
  options: AiCompletionOptions = {},
  language: CvUiLang = "id",
): Promise<string> {
  const {
    model = AI_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    jsonMode = false,
    useGuidedPrompt = false,
  } = options;

  if (!AI_API_KEY) throw new Error("AI_API_KEY tidak dikonfigurasi.");

  // Use specialized prompt for guided CV chat
  const systemPrompt = useGuidedPrompt ? getChatSystemPrompt(language) : getSystemPrompt(language);

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature,
    max_tokens: maxTokens,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // SECURITY: Log full error server-side, return generic message to client
    console.error(`AI Gateway error (${res.status}):`, errText);
    throw new Error("AI service temporarily unavailable. Please try again later.");
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── CORS Wrapper ──────────────────────────────────────────────────

export function corsResponse(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(req ? corsHeaders(req) : corsHeadersStatic),
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(e: unknown, req?: Request) {
  const message = e instanceof Error ? e.message : "Internal server error";
  const status = message.startsWith("Unauthorized") ? 401 : message.includes("Kuota") ? 429 : 500;
  console.error("Edge Function error:", message);
  return corsResponse({ error: message }, status, req);
}
