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
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  getCvWritingRules,
  getLanguageStyle,
  fenced,
  reserveQuota,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import { LIMITS, limitText, readJsonBody, ValidationError } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);

    // Rate Limiting
    const rateLimitKey = `ai-polish:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }
    const admin = getAdminClient();

    // Check feature flag
    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, enable_text_polish, quota_ai_polish)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const tier = (userSub as any)?.subscription_tiers;
    if (
      tier?.enable_text_polish === false ||
      (tier?.quota_ai_polish !== null && tier?.quota_ai_polish <= 0)
    ) {
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

    const body = await readJsonBody(req, 50_000);
    const lang: CvUiLang = body.language === "en" ? "en" : "id";
    const wantVariants = typeof body.variants === "number" && body.variants > 1;
    const text = limitText(body.text, LIMITS.text, "text");
    const context = limitText(body.context, 2_000, "context");

    if (text.trim().length < 5) {
      throw new ValidationError("Teks terlalu pendek untuk diperbaiki (minimal 5 karakter).");
    }

    const isEn = lang === "en";
    const ctxLine = context ? `\nKONTEKS ITEM: ${context}` : "";
    const languageRule = isEn
      ? "The final output MUST be in English (translate if the original is in another language). Style: " +
        getLanguageStyle(lang)
      : "Output akhir WAJIB dalam Bahasa Indonesia (terjemahkan bila teks asli berbahasa lain). Gaya: " +
        getLanguageStyle(lang);
    const coreRules = `ATURAN WAJIB:
1. PERTAHANKAN SEMUA FAKTA: nama, tools, angka, persentase, nominal, durasi, dan ruang lingkup. JANGAN menambah fakta, angka, tools, atau pencapaian baru, JANGAN menambah placeholder, dan jangan menghilangkan informasi penting.
2. ${languageRule}
3. Perbaiki ejaan, tata bahasa, dan istilah teknis (penulisan standar, mis. "Microsoft Excel", "JavaScript").
4. Format: bullet points, setiap poin diawali "• " dan satu poin per baris. Jika teks asli berupa paragraf, pecah menjadi poin-poin logis. Gabungkan poin yang redundan; jumlah poin mengikuti jumlah ide di teks asli (umumnya 2–6).
5. Penulisan poin:
${getCvWritingRules(lang)}`;

    if (wantVariants) {
      // ── Multi-variant mode ──────────────────────────────────────────────
      const tones =
        lang === "en"
          ? [
              {
                key: "impactful",
                label: "Impactful",
                desc: "Strong action verbs; frame each point as a contribution or result.",
              },
              {
                key: "clear",
                label: "Clear & Concise",
                desc: "Simple, direct language. Easy to read and ATS-optimised.",
              },
              {
                key: "creative",
                label: "Creative",
                desc: "Engaging and memorable phrasing while staying professional.",
              },
            ]
          : [
              {
                key: "impactful",
                label: "Impactful",
                desc: "Kata kerja aktif yang kuat; bingkai tiap poin sebagai kontribusi atau hasil.",
              },
              {
                key: "clear",
                label: "Jelas & Ringkas",
                desc: "Bahasa simpel, langsung ke inti, dan mudah dibaca ATS.",
              },
              {
                key: "creative",
                label: "Kreatif",
                desc: "Kalimat menarik dan berkesan namun tetap profesional.",
              },
            ];

      const prompt = `TUGAS: Tulis ulang teks deskripsi CV di bawah menjadi 3 versi yang lebih profesional, kuat, dan ATS-friendly — masing-masing dengan gaya berbeda.${ctxLine}

${coreRules}

GAYA TIAP VERSI (ketiganya harus terasa jelas berbeda, bukan sekadar ganti 1–2 kata):
- "${tones[0].label}": ${tones[0].desc} Letakkan hasil/angka yang sudah ada di teks di posisi menonjol; ubah kalimat tugas menjadi kalimat kontribusi.
- "${tones[1].label}": ${tones[1].desc} Maksimal ±15 kata per poin, buang kata yang tidak perlu, keyword utama tetap ada.
- "${tones[2].label}": ${tones[2].desc} Variasikan struktur kalimat dan pilihan kata yang lebih hidup — tetap formal dan faktual.

${fenced("teks_asli", text)}

OUTPUT: JSON object saja. Baris baru di dalam string ditulis sebagai \\n.
{
  "variants": [
    {"tone": "${tones[0].label}", "polished": "• ...\\n• ..."},
    {"tone": "${tones[1].label}", "polished": "• ...\\n• ..."},
    {"tone": "${tones[2].label}", "polished": "• ...\\n• ..."}
  ]
}`;

      // H3: reservasi kuota SEBELUM memanggil AI; dikembalikan jika AI/parsing gagal
      const reservation = await reserveQuota(admin, userId, "polish", 300);

      let parsed: { variants: { polished: string; tone: string }[] };
      try {
        const raw = await aiComplete(
          [{ role: "user", content: prompt }],
          { temperature: 0.7, maxTokens: 1500, jsonMode: true },
          lang,
        );
        try {
          const cleaned = raw
            .replace(/^```json\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
          parsed = JSON.parse(cleaned);
          if (!Array.isArray(parsed?.variants)) throw new Error("Invalid format");
        } catch {
          throw new Error("AI gagal menghasilkan variasi teks. Silakan coba lagi.");
        }
      } catch (e) {
        await reservation.release();
        throw e;
      }

      return corsResponse(
        {
          original: text,
          variants: parsed.variants
            .filter((v) => typeof v?.polished === "string" && v.polished.trim())
            .map((v) => ({ tone: String(v.tone || ""), polished: normalizeBullets(v.polished) })),
        },
        200,
        req,
      );
    }

    // ── Single polish mode (backward compatible) ─────────────────────────
    const prompt = `TUGAS: Tulis ulang teks deskripsi CV di bawah agar lebih profesional, kuat, dan ATS-friendly.${ctxLine}

${coreRules}

${fenced("teks_asli", text)}

OUTPUT: hanya teks hasil perbaikan (bullet "• "), tanpa kalimat pembuka/penutup, tanpa tanda kutip.`;

    // H3: reservasi kuota SEBELUM memanggil AI; dikembalikan jika AI gagal
    const reservation = await reserveQuota(admin, userId, "polish", 300);

    let result: string;
    try {
      result = await aiComplete(
        [{ role: "user", content: prompt }],
        { temperature: 0.3, maxTokens: 800 },
        lang,
      );
    } catch (e) {
      await reservation.release();
      throw e;
    }

    // Clean up any markdown or quotes
    const polished = normalizeBullets(
      result
        .replace(/^```[a-z]*\s*/i, "")
        .replace(/\s*```$/, "")
        .trim()
        .replace(/^["']|["']$/g, ""),
    );

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

/** Seragamkan bullet markdown ("-", "*") menjadi "• " agar konsisten dengan AI Saran. */
function normalizeBullets(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^(\s*)[-*]\s+/, "$1• "))
    .join("\n")
    .trim();
}
