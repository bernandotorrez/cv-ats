/**
 * AI Score — analisis skor ATS untuk CV
 * POST /ai-score
 */
import { aiComplete, checkAndTrackQuota, corsResponse, errorResponse, getAdminClient, getUserId, getLanguageInstruction, type CvUiLang } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { cvId, cvData, jobDescription, targetRole, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!cvId || !cvData) throw new Error("cvId dan cvData diperlukan");

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
    "relevance": number,
    "skills_match": number,
    "experience": number,
    "format": number,
    "keywords": number
  },
  "summary": string (2-3 kalimat ${getLanguageInstruction(lang)}),
  "strengths": string[] (3-5),
  "weaknesses": string[] (3-5),
  "suggestions": string[] (5-7 actionable)
}`;

    const result = await aiComplete(
      [{ role: "user", content: prompt }],
      { temperature: 0.3, maxTokens: 3000, jsonMode: true },
      lang,
    );

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Gagal parse hasil scoring");
    }

    // Save to DB
    await admin.from("cv_scores").insert({
      cv_id: cvId,
      user_id: userId,
      overall_score: parsed.overall_score,
      breakdown: parsed.breakdown,
      suggestions: parsed.suggestions,
      job_description: jobDescription || null,
    });

    await checkAndTrackQuota(admin, userId, "score", 500);

    return corsResponse({
      overallScore: parsed.overall_score,
      breakdown: parsed.breakdown,
      summary: parsed.summary,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      suggestions: parsed.suggestions,
    }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
