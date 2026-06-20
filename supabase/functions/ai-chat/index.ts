/**
 * AI Chat — panduan AI interaktif untuk CV
 * POST /ai-chat
 */
import {
  aiComplete,
  checkAndTrackQuota,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import type { AiMessage } from "../_shared/ai-common.ts";

// ─── Jailbreak Detection ───────────────────────────────────────────

const JAILBREAK_PATTERNS = [
  /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|rules?|commands?)/i,
  /forget\s+(everything|all|previous|your)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+(now|a)\s+(different|new)\s+(ai|assistant|bot|model)/i,
  /disregard\s+(previous|all|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /new\s+(instructions?|prompts?|rules?|system\s+prompt)/i,
  /override\s+(instructions?|prompts?|rules?|system)/i,
  /act\s+as\s+(if|a|an)\s+(?!cv|hr|recruiter|professional)/i,
  /pretend\s+(you|to\s+be)\s+(?!cv|hr|recruiter|professional)/i,
  /roleplay\s+as/i,
  /simulate\s+(being|a|an)\s+(?!cv|hr|recruiter)/i,
  /system\s*:\s*/i,
  /\[system\]/i,
  /\<\|system\|\>/i,
  /\<\|im_start\|\>/i,
  /\<\|im_end\|\>/i,
];

const OFF_TOPIC_PATTERNS = [
  /(?:politik|agama|sara|pornografi|judi|narkoba|terorisme)/i,
  /(?:hack|crack|exploit|malware|virus|ddos|phishing)/i,
  /(?:bitcoin|crypto|trading|forex|investment|saham)\s+(?:tips|strategy|signal)/i,
  /(?:write|create|generate)\s+(?:a\s+)?(?:poem|story|essay|article|song|code)\s+(?:about|for)/i,
];

function detectJailbreakAttempt(text: string): boolean {
  // Check for jailbreak patterns
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(text)) {
      console.warn("[SECURITY] Jailbreak attempt detected:", text.substring(0, 100));
      return true;
    }
  }

  // Check for off-topic requests
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(text)) {
      console.warn("[SECURITY] Off-topic request detected:", text.substring(0, 100));
      return true;
    }
  }

  return false;
}

function sanitizeMessage(text: string): string {
  // Remove potential injection attempts
  return text
    .replace(/\<\|.*?\|\>/g, "") // Remove special tokens
    .replace(/\[system\]/gi, "[user]") // Replace system tags
    .replace(/system\s*:/gi, "user:") // Replace system prefix
    .trim();
}

// ─── Main Handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { messages, jsonMode, mode, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!messages || !Array.isArray(messages)) throw new Error("messages diperlukan");

    const isGuidedMode = mode === "guided";
    const feature = isGuidedMode ? "guided" : "chat";

    // Guided mode: check feature flag first
    if (isGuidedMode) {
      const { data: userSub } = await admin
        .from("user_subscriptions")
        .select(`subscription_tiers!inner(enable_guided_mode, slug)`)
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      const tier = (userSub as any)?.subscription_tiers;
      if (tier && tier.enable_guided_mode === false) {
        return corsResponse(
          {
            reply:
              "Maaf, fitur Panduan AI tidak tersedia di paket kamu. Silakan upgrade untuk mengakses fitur ini.",
          },
          200,
          req,
        );
      }
    }

    // Validate and sanitize messages
    const sanitizedMessages: AiMessage[] = [];
    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== "string") continue;

      // Detect jailbreak attempts
      if (detectJailbreakAttempt(msg.content)) {
        return corsResponse(
          {
            reply:
              "Maaf, saya hanya bisa membantu dengan pertanyaan seputar CV dan karir profesional. Mari fokus pada pengisian CV kamu.",
          },
          200,
          req,
        );
      }

      // Sanitize content
      const sanitized = sanitizeMessage(msg.content);

      // Skip empty messages
      if (!sanitized) continue;

      sanitizedMessages.push({
        role: msg.role === "system" ? "user" : msg.role, // Force system to user
        content: sanitized,
      });
    }

    if (sanitizedMessages.length === 0) {
      throw new Error("Tidak ada pesan yang valid");
    }

    const result = await aiComplete(
      sanitizedMessages,
      {
        temperature: 0.7,
        maxTokens: 2000,
        jsonMode: jsonMode || false,
        useGuidedPrompt: true, // Use specialized CV chat prompt with stronger guardrails
      },
      lang,
    );

    await checkAndTrackQuota(admin, userId, feature, result.length);

    return corsResponse({ reply: result.trim() }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
