/**
 * AI Chat — panduan AI interaktif untuk CV
 * POST /ai-chat
 */
import {
  aiComplete,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  reserveQuota,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import type { AiMessage } from "../_shared/ai-common.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import { limitText, readJsonBody, ValidationError } from "../_shared/validation.ts";

// ─── Input limits (M2) ─────────────────────────────────────────────

/** Jumlah pesan riwayat maksimum yang diteruskan ke AI (pesan lama dibuang). */
const MAX_MESSAGES = 30;
/** Panjang maksimum tiap pesan riwayat (pesan lebih lama dipotong). */
const MAX_HISTORY_MESSAGE_CHARS = 4_000;
/**
 * Pesan terakhir (input user saat ini) membawa konteks CV dari frontend
 * (AiChatPanel: ringkasan + skill; guided-mode: draft CV dalam JSON + instruksi),
 * sehingga batasnya lebih longgar. Melebihi batas → 400.
 */
const MAX_LAST_MESSAGE_CHARS = { chat: 12_000, guided: 20_000 } as const;
const MAX_BODY_BYTES = 300_000;

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

    // Rate Limiting
    const rateLimitKey = `ai-chat:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }
    const admin = getAdminClient();
    const { messages, jsonMode, mode, language } = await readJsonBody(req, MAX_BODY_BYTES);
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError("messages diperlukan");
    }

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

    // Validate and sanitize messages — hanya MAX_MESSAGES pesan terakhir yang dipakai
    const recentMessages = messages.slice(-MAX_MESSAGES);
    const lastIndex = recentMessages.length - 1;
    const sanitizedMessages: AiMessage[] = [];
    for (const [index, msg] of recentMessages.entries()) {
      if (!msg || typeof msg !== "object") continue;
      if (!msg.content || typeof msg.content !== "string") continue;

      let content: string = msg.content;
      if (index === lastIndex) {
        limitText(content, MAX_LAST_MESSAGE_CHARS[isGuidedMode ? "guided" : "chat"], "pesan");
      } else if (content.length > MAX_HISTORY_MESSAGE_CHARS) {
        content = content.slice(0, MAX_HISTORY_MESSAGE_CHARS);
      }

      // Detect jailbreak attempts
      if (detectJailbreakAttempt(content)) {
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
      const sanitized = sanitizeMessage(content);

      // Skip empty messages
      if (!sanitized) continue;

      sanitizedMessages.push({
        // L2: hanya role "user" | "assistant"; role lain (system/developer/tool/...) → user
        role: msg.role === "assistant" ? "assistant" : "user",
        content: sanitized,
      });
    }

    if (sanitizedMessages.length === 0) {
      throw new ValidationError("Tidak ada pesan yang valid");
    }

    // H3: reservasi kuota SEBELUM memanggil AI (estimasi token = maxTokens)
    const MAX_TOKENS = 2000;
    const reservation = await reserveQuota(admin, userId, feature, MAX_TOKENS);

    let result: string;
    try {
      result = await aiComplete(
        sanitizedMessages,
        {
          temperature: 0.7,
          maxTokens: MAX_TOKENS,
          jsonMode: jsonMode === true,
          useGuidedPrompt: true, // Use specialized CV chat prompt with stronger guardrails
        },
        lang,
      );
    } catch (e) {
      await reservation.release();
      throw e;
    }

    return corsResponse({ reply: result.trim() }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
