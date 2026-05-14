/**
 * AI Keywords — ekstrak keyword dari deskripsi pekerjaan
 * POST /ai-keywords
 */
import { aiComplete, checkAndTrackQuota, corsResponse, errorResponse, getAdminClient, getUserId, type CvUiLang } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { jobDescription, targetRole, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!jobDescription) throw new Error("jobDescription diperlukan");

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

    const prompt = `Analisis deskripsi pekerjaan berikut dan ekstrak keyword. Output HARUS JSON valid (tanpa markdown wrapper).

DESKRIPSI:
${jobDescription}
${targetRole ? `\nTarget Posisi: ${targetRole}` : ""}

Output JSON:
{
  "hard_skills": string[] (5-10 technical skills),
  "soft_skills": string[] (3-5 soft skills),
  "qualifications": string[] (3-5 kualifikasi),
  "action_verbs": string[] (5-8 kata kerja aksi untuk CV),
  "keywords_summary": string (2 kalimat strategi keyword)
}`;

    const result = await aiComplete(
      [{ role: "user", content: prompt }],
      { temperature: 0.3, maxTokens: 1500, jsonMode: true },
      lang,
    );

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Gagal parse hasil keyword");
    }

    await checkAndTrackQuota(admin, userId, "keyword_extract", 300);

    return corsResponse({
      hardSkills: parsed.hard_skills,
      softSkills: parsed.soft_skills,
      qualifications: parsed.qualifications,
      actionVerbs: parsed.action_verbs,
      keywordsSummary: parsed.keywords_summary,
    }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
