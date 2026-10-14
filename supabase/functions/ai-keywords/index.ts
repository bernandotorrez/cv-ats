/**
 * AI Keywords — ekstrak keyword dari deskripsi pekerjaan
 * POST /ai-keywords
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
import { LIMITS, limitText, readJsonBody, ValidationError } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);

    // Rate Limiting
    const rateLimitKey = `ai-keywords:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }
    const admin = getAdminClient();
    const body = await readJsonBody(req, 100_000);
    const lang: CvUiLang = body.language === "en" ? "en" : "id";
    const jobDescription = limitText(body.jobDescription, LIMITS.jobDescription, "jobDescription");
    const targetRole = limitText(body.targetRole, LIMITS.shortText, "targetRole");

    if (!jobDescription) throw new ValidationError("jobDescription diperlukan");

    // Check feature flag before processing
    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select(`subscription_tiers!inner(enable_keyword_extractor)`)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const enabled = (userSub as any)?.subscription_tiers?.enable_keyword_extractor ?? false;
    if (!enabled) {
      throw new Error("Keyword Extractor tidak tersedia di paket kamu. Silakan upgrade.");
    }

    const prompt = `TUGAS: Sebagai ATS specialist, ekstrak keyword dari job description berikut agar kandidat bisa menyesuaikan CV-nya.
${targetRole ? `TARGET POSISI: ${targetRole}\n` : ""}
${fenced("job_description", jobDescription)}

ATURAN:
- Ambil HANYA yang disebut atau tersirat kuat di job description. Jangan menambah skill/tools yang tidak ada.
- Tulis keyword persis seperti penulisan di job description (ATS mencocokkan teks). Jika ada singkatan populer, sertakan keduanya, mis. "Search Engine Optimization (SEO)".
- Urutkan setiap daftar dari yang paling penting: disebut berulang, ada di bagian persyaratan/wajib, atau disebut di awal.
- hard_skills (5–12): kompetensi teknis/fungsional, tools, software, metodologi, sertifikasi teknis.
- soft_skills (3–6): hanya yang disebut atau tersirat jelas.
- qualifications (3–6): syarat pendidikan, lama pengalaman, sertifikasi, bahasa, atau syarat lain — tulis ringkas (mis. "S1 Teknik Informatika", "Min. 2 tahun pengalaman").
- action_verbs (5–8): kata kerja aktif ${getLanguageInstruction(lang)} yang cocok dengan tanggung jawab di job description, untuk mengawali bullet pengalaman di CV.
- keywords_summary: 2–3 kalimat ${getLanguageInstruction(lang)} — keyword mana yang wajib muncul dan di bagian CV mana menaruhnya (headline, summary, skill, pengalaman).

OUTPUT: JSON object saja:
{
  "hard_skills": string[],
  "soft_skills": string[],
  "qualifications": string[],
  "action_verbs": string[],
  "keywords_summary": string
}`;

    // H3: reservasi kuota SEBELUM memanggil AI; dikembalikan jika AI/parsing gagal
    const reservation = await reserveQuota(admin, userId, "keyword_extract", 300);

    let parsed: Record<string, unknown>;
    try {
      const result = await aiComplete(
        [{ role: "user", content: prompt }],
        { temperature: 0.3, maxTokens: 1500, jsonMode: true },
        lang,
      );
      parsed = parseJsonObject(result);
    } catch (e) {
      await reservation.release();
      throw e;
    }

    return corsResponse(
      {
        hardSkills: parsed.hard_skills,
        softSkills: parsed.soft_skills,
        qualifications: parsed.qualifications,
        actionVerbs: parsed.action_verbs,
        keywordsSummary: parsed.keywords_summary,
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
    throw new Error("Gagal parse hasil keyword. Silakan coba lagi.");
  }
}
