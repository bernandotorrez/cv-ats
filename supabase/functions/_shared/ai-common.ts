/**
 * Shared AI utilities for all edge functions
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsHeadersStatic } from "./cors.ts";
import { ValidationError } from "./validation.ts";
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
// Model bisa diganti tanpa deploy ulang via: supabase secrets set AI_MODEL=... AI_MODEL_CV=...
export const AI_MODEL = Deno.env.get("AI_MODEL") || "deepseek-v4.1-flash:netra";
// Scan/Upload CV (OCR multimodal) — default Gemini
export const CV_AI_MODEL = Deno.env.get("AI_MODEL_CV") || "gemini/gemini-3.1-flash-lite";

export const FEATURE_MAP: Record<string, string> = {
  "ai-suggest": "suggest",
  "ai-score": "score",
  "ai-job-match": "job_match",
  "ai-tailor-cv": "tailor_cv",
  "ai-chat": "chat",
  "ai-cover-letter": "cover_letter",
  "ai-keywords": "keyword_extract",
};

const FEATURE_QUOTA_MAP: Record<string, string> = {
  suggest: "quota_ai_suggest",
  score: "quota_ai_score",
  job_match: "quota_ai_job_match",
  tailor_cv: "quota_ai_tailor_cv",
  chat: "quota_ai_chat",
  cover_letter: "quota_ai_cover_letter",
  keyword_extract: "quota_ai_keyword_extract",
  cv_review: "quota_cv_review",
  interview_simulator: "quota_interview_simulator",
  polish: "quota_ai_polish",
  translate: "quota_ai_translate",
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

export interface QuotaReservation {
  /** Kembalikan kuota (hapus catatan pemakaian) jika layanan berbayar gagal. */
  release: () => Promise<void>;
}

/** Limit bulanan dari tier aktif user (null = tanpa batas). */
async function getTierLimit(
  adminClient: ReturnType<typeof getAdminClient>,
  userId: string,
  quotaColumn: string,
): Promise<number | null> {
  const { data: userSub } = await adminClient
    .from("user_subscriptions")
    .select(`subscription_tiers!inner(${quotaColumn}, slug, name)`)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (userSub) {
    // deno-lint-ignore no-explicit-any
    const tier = (userSub as any).subscription_tiers;
    const value = tier?.[quotaColumn];
    return value === null || value === undefined ? null : Number(value);
  }

  const { data: freeTier } = await adminClient
    .from("subscription_tiers")
    .select(`${quotaColumn}, name`)
    .eq("slug", "free")
    .maybeSingle();
  // deno-lint-ignore no-explicit-any
  const value = (freeTier as any)?.[quotaColumn];
  return value === null || value === undefined ? 0 : Number(value);
}

/**
 * Reservasi kuota AI secara atomik SEBELUM memanggil layanan berbayar.
 * - Limit diambil dari kolom tier (FEATURE_QUOTA_MAP) atau dari `options.limit`.
 * - Melempar error "Kuota ... habis" (→ HTTP 429 via errorResponse) jika habis.
 * - Panggil `release()` di catch bila layanan gagal, agar kuota tidak terpotong.
 */
export async function reserveQuota(
  adminClient: ReturnType<typeof getAdminClient>,
  userId: string,
  feature: string,
  tokensUsed: number,
  options: { limit?: number | null } = {},
): Promise<QuotaReservation> {
  const quotaColumn = FEATURE_QUOTA_MAP[feature];
  let limit: number | null = null;
  if (options.limit !== undefined) {
    limit = options.limit;
  } else if (quotaColumn) {
    limit = await getTierLimit(adminClient, userId, quotaColumn);
  }

  const { data: usageId, error } = await adminClient.rpc("reserve_ai_quota", {
    p_user: userId,
    p_feature: feature,
    p_limit: limit,
    p_tokens: tokensUsed,
  });

  if (error) {
    console.error("reserve_ai_quota failed:", error);
    throw new Error("Gagal memverifikasi kuota. Silakan coba lagi.");
  }
  if (!usageId) {
    throw new Error(`Kuota ${feature} bulan ini habis (${limit}). Silakan upgrade.`);
  }

  let released = false;
  return {
    release: async () => {
      if (released) return;
      released = true;
      const { error: delError } = await adminClient.from("ai_usage").delete().eq("id", usageId);
      if (delError) console.error("Failed to release quota:", delError);
    },
  };
}

/** @deprecated Pakai reserveQuota() sebelum memanggil AI. */
export async function checkAndTrackQuota(
  adminClient: ReturnType<typeof getAdminClient>,
  userId: string,
  feature: string,
  tokensUsed: number,
): Promise<void> {
  await reserveQuota(adminClient, userId, feature, tokensUsed);
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

// Pesan yang terlihat seperti detail internal (DB, parser, konfigurasi) tidak dikirim ke client
const INTERNAL_ERROR_PATTERN =
  /relation|column|violates|duplicate key|PGRST|syntax|JSON|Unexpected token|AI_API_KEY|APIFY|KIE_AI|stack|undefined|null value/i;

export function errorResponse(e: unknown, req?: Request) {
  const message = e instanceof Error ? e.message : "Internal server error";
  console.error("Edge Function error:", e);

  if (e instanceof ValidationError) return corsResponse({ error: message }, 400, req);
  if (message.startsWith("Unauthorized")) return corsResponse({ error: "Unauthorized" }, 401, req);
  if (message.includes("Kuota")) return corsResponse({ error: message }, 429, req);

  const isDeveloperMessage =
    e instanceof Error &&
    e.constructor === Error &&
    !INTERNAL_ERROR_PATTERN.test(message) &&
    message.length <= 300;
  return corsResponse(
    { error: isDeveloperMessage ? message : "Terjadi kesalahan. Silakan coba lagi." },
    500,
    req,
  );
}
