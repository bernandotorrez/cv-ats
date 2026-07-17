/**
 * AI Polish — Perbaiki & perhalus teks deskripsi
 * POST /ai-polish
 * Body: { text: string, context?: string, variants?: number }
 *
 * If `variants` is provided (e.g. 3), returns multiple polished versions.
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
      return corsResponse(
        {
          error: "Fitur Perbaiki Teks tidak tersedia di paket kamu. Silakan upgrade.",
          requiresUpgrade: true,
          upgradeUrl: "/harga",
        },
        403,
        req,
      );
    }

    const { text, context, language, variants } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";
    const wantVariants = typeof variants === "number" && variants > 1;

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      throw new Error("Teks terlalu pendek untuk diperbaiki (minimal 5 karakter).");
    }

    const ctxLine = context ? `\nKONTEKS: ${context}` : "";
    const languageRule =
      lang === "en"
        ? "The final output MUST be in professional English."
        : "Output akhir WAJIB dalam Bahasa Indonesia formal dan profesional.";

    if (wantVariants) {
      // ── Multi-variant mode ──────────────────────────────────────────────
      const tones =
        lang === "en"
          ? [
              { key: "impactful", label: "Impactful", desc: "Focus on strong action verbs and quantifiable achievements." },
              { key: "clear", label: "Clear & Concise", desc: "Simple, direct language. Easy to read and ATS-optimised." },
              { key: "creative", label: "Creative", desc: "Engaging and memorable phrasing while staying professional." },
            ]
          : [
              { key: "impactful", label: "Impactful", desc: "Fokus pada kata kerja aktif kuat dan pencapaian terukur (angka/metrik)." },
              { key: "clear", label: "Jelas & Ringkas", desc: "Bahasa simpel, langsung ke inti, dan mudah dibaca ATS." },
              { key: "creative", label: "Kreatif", desc: "Kalimat menarik dan berkesan namun tetap profesional." },
            ];

      const prompt = `Kamu adalah penulis CV profesional. Buatkan 3 versi perbaikan teks berikut dengan gaya berbeda.${ctxLine}

ATURAN UMUM:
- ${languageRule}
- ${getActionVerbExamples(lang)}
- Tambahkan metrik/angka jika memungkinkan
- Gunakan format BULLET POINTS (awali tiap poin dengan karakter '-') karena teks ini adalah deskripsi. Pastikan baris baru di dalam string JSON di-escape dengan '\\n'.
- JANGAN ubah fakta — hanya perbaiki bahasa dan struktur
- JANGAN tambahkan informasi yang tidak ada di teks asli

TEKS ASLI:
${text}

Buatkan TEPAT 3 versi dalam format JSON berikut (tanpa markdown, hanya JSON mentah):
{
  "variants": [
    {"tone": "${tones[0].label}", "polished": "<versi 1 — ${tones[0].desc}>"},
    {"tone": "${tones[1].label}", "polished": "<versi 2 — ${tones[1].desc}>"},
    {"tone": "${tones[2].label}", "polished": "<versi 3 — ${tones[2].desc}>"}
  ]
}`;

      const raw = await aiComplete(
        [{ role: "user", content: prompt }],
        { temperature: 0.7, maxTokens: 1500, jsonMode: true },
        lang,
      );

      let parsed: { variants: { polished: string; tone: string }[] };
      try {
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("AI gagal menghasilkan variasi teks. Silakan coba lagi.");
      }

      // Track quota usage
      await checkAndTrackQuota(admin, userId, "polish", 300);

      return corsResponse(
        {
          original: text,
          variants: parsed.variants,
        },
        200,
        req,
      );
    }

    // ── Single polish mode (backward compatible) ─────────────────────────
    const prompt = `Perbaiki teks deskripsi pengalaman kerja/pendidikan berikut agar lebih profesional, impactful, dan ATS-friendly.${ctxLine}

ATURAN:
- ${languageRule}
- ${getActionVerbExamples(lang)}
- Tambahkan metrik/angka jika memungkinkan (contoh: ${lang === "en" ? '"increased 30%", "managed team of 5"' : '"meningkatkan 30%", "mengelola tim 5 orang"'})
- ${lang === "en" ? "Professional & formal English" : "Bahasa Indonesia formal & profesional"}
- Gunakan format BULLET POINTS (awali tiap poin dengan karakter '-')
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
      .replace(/^\* /gm, "- ") // normalize markdown bullet * → -
      .trim();

    // Track quota usage
    await checkAndTrackQuota(admin, userId, "polish", 300);

    return corsResponse(
      {
        original: text,
        polished,
      },
      200,
      req,
    );
  } catch (e) {
    return errorResponse(e, req);
  }
});
