/**
 * AI Score — analisis skor ATS untuk CV
 * POST /ai-score
 */
import {
  aiComplete,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  getLanguageInstruction,
  reserveQuota,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  LIMITS,
  limitJson,
  limitText,
  readJsonBody,
  ValidationError,
} from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);

    // Rate Limiting
    const rateLimitKey = `ai-score:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }
    const admin = getAdminClient();

    // Check feature flag — ai-score available for all tiers but verify DB state
    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, quota_ai_score)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const scoreQuota = (userSub as any)?.subscription_tiers?.quota_ai_score ?? null;
    if (scoreQuota !== null && scoreQuota <= 0) {
      return corsResponse(
        {
          error: "Fitur AI Scoring tidak tersedia di paket kamu. Silakan upgrade.",
          requiresUpgrade: true,
          upgradeUrl: "/harga",
        },
        403,
        req,
      );
    }

    const body = await readJsonBody(req, 300_000);
    const lang: CvUiLang = body.language === "en" ? "en" : "id";
    const cvId = limitText(body.cvId, 100, "cvId");
    const cvData = limitJson(body.cvData, LIMITS.json, "cvData");
    const jobDescription = limitText(body.jobDescription, LIMITS.jobDescription, "jobDescription");
    const targetRole = limitText(body.targetRole, LIMITS.shortText, "targetRole");

    if (!cvId || !cvData) throw new ValidationError("cvId dan cvData diperlukan");

    // L7: cvId harus milik user (hasil disimpan ke cv_scores yang mereferensikan cvId)
    const { data: ownedCv, error: cvError } = await admin
      .from("cvs")
      .select("id")
      .eq("id", cvId)
      .eq("user_id", userId)
      .maybeSingle();
    if (cvError) console.error("ai-score: CV ownership check failed:", cvError);
    if (!ownedCv) {
      return corsResponse({ error: "CV tidak ditemukan." }, 403, req);
    }

    const cvText = JSON.stringify(cvData, null, 2);
    const jdText = jobDescription ? `\nDESKRIPSI PEKERJAAN:\n${jobDescription}` : "";

    const prompt = `Analisis CV berikut dan berikan skor ATS ${getLanguageInstruction(lang)}.
${jdText}
Target posisi: ${targetRole || "tidak disebutkan"}

DATA CV:
${cvText}

Output HARUS JSON valid (tanpa markdown wrapper):
{
  "overall_score": number (0-100),
  "breakdown": {
    "relevance": number (0-100),
    "skills_match": number (0-100),
    "experience": number (0-100),
    "format": number (0-100),
    "keywords": number (0-100)
  },
  "summary": string (2-3 kalimat ${getLanguageInstruction(lang)}),
  "strengths": string[] (3-5),
  "weaknesses": string[] (3-5),
  "suggestions": string[] (5-7 actionable)
}`;

    // H3: reservasi kuota SEBELUM memanggil AI; dikembalikan jika AI/parsing gagal
    const reservation = await reserveQuota(admin, userId, "score", 500);

    let parsed: Record<string, unknown>;
    try {
      const result = await aiComplete(
        [{ role: "user", content: prompt }],
        { temperature: 0.3, maxTokens: 3000, jsonMode: true },
        lang,
      );
      parsed = parseJsonObject(result);
    } catch (e) {
      await reservation.release();
      throw e;
    }

    // Save to DB (setelah kuota tereservasi & AI berhasil)
    const { error: insertError } = await admin.from("cv_scores").insert({
      cv_id: ownedCv.id,
      user_id: userId,
      overall_score: parsed.overall_score,
      breakdown: parsed.breakdown,
      suggestions: parsed.suggestions,
      job_description: jobDescription || null,
    });
    if (insertError) console.error("Failed to save CV score:", insertError);

    return corsResponse(
      {
        overallScore: parsed.overall_score,
        breakdown: parsed.breakdown,
        summary: parsed.summary,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        suggestions: parsed.suggestions,
      },
      200,
      req,
    );
  } catch (e) {
    return errorResponse(e, req);
  }
});

function parseJsonObject(result: string): Record<string, unknown> {
  try {
    return JSON.parse(result);
  } catch {
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error("Gagal parse hasil scoring. Silakan coba lagi.");
  }
}
