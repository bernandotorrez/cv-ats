/**
 * AI Translate CV — terjemahkan isi CV ID <-> EN
 * POST /ai-translate-cv
 * Body: { cvData: CvData, target: "en" | "id" }
 * Response: { cvData, language, translatedFields, skippedFields }
 *
 * Hanya teks bebas (ringkasan, jabatan, deskripsi, ...) yang dikirim ke AI; struktur, tanggal,
 * nama perusahaan, kontak, dan URL tidak pernah diubah (lihat _shared/translate-cv.ts).
 * Gerbang & kuota sendiri per paket: subscription_tiers.enable_cv_translate / quota_ai_translate
 * (free terkunci, starter 3/bulan, pro 15/bulan — lihat migration 20261006000100_translate_quota.sql),
 * ditambah batas harian anti-penyalahgunaan.
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

/** Maksimal terjemahan per 24 jam per user, di luar kuota bulanan (mencegah ledakan pemakaian). */
const DAILY_CAP = 5;

interface TranslateTier {
  slug?: string;
  enable_cv_translate?: boolean | null;
  quota_ai_translate?: number | null;
}

/** Tier aktif user; jika tidak punya langganan aktif, pakai baris tier "free". */
async function loadTier(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
): Promise<TranslateTier | null> {
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("subscription_tiers!inner(slug, enable_cv_translate, quota_ai_translate)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const active = (sub as { subscription_tiers?: TranslateTier } | null)?.subscription_tiers;
  if (active) return active;

  const { data: free } = await admin
    .from("subscription_tiers")
    .select("slug, enable_cv_translate, quota_ai_translate")
    .eq("slug", "free")
    .maybeSingle();
  return (free as TranslateTier | null) ?? null;
}

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

    const tier = await loadTier(admin, userId);
    if (!tier?.enable_cv_translate) {
      return corsResponse(
        {
          error: "Terjemahan CV tersedia di paket Starter ke atas. Upgrade untuk menggunakannya.",
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

    // Batas harian (di atas kuota bulanan)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: usedToday } = await admin
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "translate")
      .gte("created_at", since);
    if ((usedToday ?? 0) >= DAILY_CAP) {
      throw new Error(
        `Kuota harian terjemahan CV tercapai (${DAILY_CAP} per hari). Coba lagi besok.`,
      );
    }

    // Reservasi kuota SEBELUM memanggil AI; dikembalikan jika AI/parsing gagal
    let reservation;
    try {
      reservation = await reserveQuota(admin, userId, "translate", 1500);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Kuota")) {
        const limit = tier.quota_ai_translate;
        throw new Error(
          `Kuota terjemahan CV bulan ini habis${limit != null ? ` (${limit})` : ""}. Upgrade paket untuk menambah kuota.`,
        );
      }
      throw e;
    }

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
