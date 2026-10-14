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
  fenced,
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
    const jdText = jobDescription
      ? `\nDESKRIPSI PEKERJAAN (acuan utama relevansi & keyword):\n${fenced("job_description", jobDescription)}`
      : "";

    const prompt = `TUGAS: Nilai CV berikut sebagai ATS specialist & recruiter senior — objektif, konsisten, dan tidak murah hati. Semua teks ${getLanguageInstruction(lang)}.
TARGET POSISI: ${targetRole || "tidak disebutkan (nilai berdasarkan arah karier yang tersirat di CV)"}${jdText}

DATA CV (JSON):
${fenced("data_cv", cvText)}

RUBRIK (setiap dimensi 0–100):
- relevance: relevansi headline, summary, dan pengalaman dengan target posisi/JD. Tanpa target & JD: kejelasan dan konsistensi arah karier.
- skills_match: kecocokan skill di CV dengan kebutuhan posisi (JD bila ada; jika tidak, kebutuhan umum posisi target).
- experience: kualitas deskripsi pengalaman/magang/organisasi — kata kerja aktif, pencapaian & angka vs sekadar daftar tugas, kejelasan ruang lingkup, progres karier.
- format: kelengkapan & kerapian untuk ATS — kontak (email, telepon, lokasi), headline, summary, tanggal konsisten, bullet rapi, tidak ada section/item kosong.
- keywords: kehadiran keyword industri/JD dengan penulisan standar, tersebar di headline, summary, skill, dan pengalaman.

KALIBRASI SKOR:
- 90–100: luar biasa, siap kirim hampir tanpa revisi.
- 75–89: baik, perlu revisi minor.
- 60–74: cukup, ada beberapa kelemahan nyata.
- 40–59: lemah, butuh perbaikan besar.
- <40: sangat kurang atau banyak bagian kosong.
Section kosong, summary generik, atau deskripsi yang hanya berisi daftar tugas HARUS menurunkan skor secara nyata. Jangan memberi skor tinggi hanya karena CV panjang.
overall_score = round(0.25×relevance + 0.20×skills_match + 0.25×experience + 0.15×format + 0.15×keywords).

ISI TEKS:
- summary: 2–3 kalimat penilaian keseluruhan yang jujur.
- strengths & weaknesses: spesifik dan merujuk bagian CV yang nyata (mis. "Pengalaman di PT X belum menyebut hasil kerja"), bukan nasihat umum.
- suggestions: 5–7 tindakan konkret, urut dari dampak terbesar. Sebut bagian yang diubah dan contoh singkat perbaikannya. Jangan menyarankan mengarang pengalaman, angka, atau skill.

OUTPUT: JSON object saja:
{
  "overall_score": number,
  "breakdown": {"relevance": number, "skills_match": number, "experience": number, "format": number, "keywords": number},
  "summary": string,
  "strengths": string[] (3-5),
  "weaknesses": string[] (3-5),
  "suggestions": string[] (5-7)
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
      parsed.overall_score = computeOverall(parsed.breakdown) ?? parsed.overall_score;
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

const SCORE_WEIGHTS = {
  relevance: 0.25,
  skills_match: 0.2,
  experience: 0.25,
  format: 0.15,
  keywords: 0.15,
} as const;

/** Hitung ulang overall dari breakdown agar konsisten dengan bobot rubrik (null jika data tidak lengkap). */
function computeOverall(breakdown: unknown): number | null {
  if (!breakdown || typeof breakdown !== "object") return null;
  const values = breakdown as Record<string, unknown>;
  let total = 0;
  for (const [key, weight] of Object.entries(SCORE_WEIGHTS)) {
    const value = Number(values[key]);
    if (!Number.isFinite(value)) return null;
    total += Math.min(100, Math.max(0, value)) * weight;
  }
  return Math.round(total);
}
