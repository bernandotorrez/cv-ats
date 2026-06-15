/**
 * AI Polish — Perbaiki & perhalus teks deskripsi
 * POST /ai-polish
 * Body: { text: string, context?: string }
 *
 * Quota: checked via subscription_tiers.quota_ai_polish
 * Feature gate: subscription_tiers.enable_text_polish
 */
import {
  aiComplete,
  checkAndTrackQuota,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  getActionVerbExamples,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();

    // Check feature flag
    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, enable_text_polish)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (userSub && (userSub as any).subscription_tiers?.enable_text_polish === false) {
      return corsResponse({
        error: "Fitur Perbaiki Teks tidak tersedia di paket kamu. Silakan upgrade.",
        requiresUpgrade: true,
        upgradeUrl: "/harga",
      }, 403, req);
    }

    const { text, context, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      throw new Error("Teks terlalu pendek untuk diperbaiki (minimal 5 karakter).");
    }

    const ctxLine = context ? `\nKONTEKS: ${context}` : "";
    const languageRule =
      lang === "en"
        ? "The final output MUST be in professional English."
        : "Output akhir WAJIB dalam Bahasa Indonesia formal dan profesional.";

    const prompt = `Perbaiki teks deskripsi pengalaman kerja/pendidikan berikut agar lebih profesional, impactful, dan ATS-friendly.${ctxLine}

ATURAN:
- ${languageRule}
- ${getActionVerbExamples(lang)}
- Tambahkan metrik/angka jika memungkinkan (contoh: ${lang === "en" ? '"increased 30%", "managed team of 5"' : '"meningkatkan 30%", "mengelola tim 5 orang"'})
- ${lang === "en" ? "Professional & formal English" : "Bahasa Indonesia formal & profesional"}
- JANGAN ubah fakta — hanya perbaiki bahasa dan struktur
- JANGAN tambahkan informasi yang tidak ada di teks asli
- Output LANGSUNG teks yang sudah diperbaiki, tanpa kata pembuka

TEKS ASLI:
${text}

TEKS PERBAIKAN:`;

    const result = await aiComplete(
      [{ role: "user", content: prompt }],
      { temperature: 0.3, maxTokens: 800 },
      lang,
    );

    // Clean up any markdown or quotes
    const polished = result
      .replace(/^["']|["']$/g, "")
      .replace(/^```[\s\S]*?\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/^\* /gm, "- ")   // normalize markdown bullet * → -
      .trim();

    // Track quota usage
    await checkAndTrackQuota(admin, userId, "polish", 300);

    return corsResponse({
      original: text,
      polished,
    }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
