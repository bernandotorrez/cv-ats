/**
 * AI Translate CV — terjemahkan isi CV ID <-> EN
 * POST /ai-translate-cv
 * Body: { cvData: CvData, target: "en" | "id" }
 * Response: { cvData, language, translatedFields, skippedFields }
 *
 * Hanya teks bebas (ringkasan, jabatan, deskripsi, ...) yang dikirim ke AI; struktur, tanggal,
 * nama perusahaan, kontak, dan URL tidak pernah diubah (lihat _shared/translate-cv.ts).
 * Kuota & gerbang fitur memakai milik "Perbaiki Teks": quota_ai_polish / enable_text_polish.
 */
import {
  aiComplete,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  reserveQuota,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import { readJsonBody, ValidationError } from "../_shared/validation.ts";
import {
  applyTranslations,
  buildTranslateMessages,
  collectTranslatable,
  parseTranslations,
  type TranslateTarget,
} from "../_shared/translate-cv.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);

    const rl = checkRateLimit(`ai-translate-cv:${userId}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }

    const admin = getAdminClient();

    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, enable_text_polish, quota_ai_polish)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const tier = (
      userSub as {
        subscription_tiers?: {
          enable_text_polish?: boolean | null;
          quota_ai_polish?: number | null;
        };
      } | null
    )?.subscription_tiers;
    if (
      tier?.enable_text_polish === false ||
      (tier?.quota_ai_polish !== null &&
        tier?.quota_ai_polish !== undefined &&
        tier.quota_ai_polish <= 0)
    ) {
      return corsResponse(
        {
          error: "Terjemahan CV tidak tersedia di paket kamu. Silakan upgrade.",
          requiresUpgrade: true,
          upgradeUrl: "/harga",
        },
        403,
        req,
      );
    }

    const body = await readJsonBody(req, 200_000);
    const target: TranslateTarget | null =
      body.target === "en" ? "en" : body.target === "id" ? "id" : null;
    if (!target) throw new ValidationError("Bahasa tujuan harus 'en' atau 'id'.");

    const items = collectTranslatable(body.cvData);
    if (items.length === 0) {
      // Tidak ada teks untuk diterjemahkan: tidak memakai kuota
      return corsResponse(
        { cvData: body.cvData, language: target, translatedFields: 0, skippedFields: 0 },
        200,
        req,
      );
    }

    // Reservasi kuota SEBELUM memanggil AI; dikembalikan jika AI/parsing gagal
    const reservation = await reserveQuota(admin, userId, "polish", 1500);

    let translations: Record<string, string>;
    try {
      const { system, user } = buildTranslateMessages(items, target);
      const raw = await aiComplete(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { temperature: 0.2, maxTokens: 6000, jsonMode: true },
        target,
      );
      translations = parseTranslations(raw);
    } catch (e) {
      await reservation.release();
      throw e;
    }

    const { cv, applied, skipped } = applyTranslations(body.cvData, items, translations);
    if (applied === 0) {
      await reservation.release();
      throw new Error("AI gagal menerjemahkan CV. Silakan coba lagi.");
    }

    return corsResponse(
      { cvData: cv, language: target, translatedFields: applied, skippedFields: skipped },
      200,
      req,
    );
  } catch (e) {
    return errorResponse(e, req);
  }
});
