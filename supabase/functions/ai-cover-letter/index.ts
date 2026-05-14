/**
 * AI Cover Letter — generate surat lamaran profesional
 * POST /ai-cover-letter
 */
import { aiComplete, checkAndTrackQuota, corsResponse, errorResponse, getAdminClient, getUserId, getLanguageInstruction, type CvUiLang } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { cvId, cvData, jobDescription, companyName, positionName, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!cvId || !cvData || !jobDescription) throw new Error("cvId, cvData, dan jobDescription diperlukan");

    const cvText = JSON.stringify(cvData, null, 2);

    const prompt = `Buatkan surat lamaran (cover letter) profesional ${getLanguageInstruction(lang)}.

DATA CV:
${cvText}

DESKRIPSI PEKERJAAN:
${jobDescription}
${companyName ? `\nPerusahaan: ${companyName}` : ""}
${positionName ? `\nPosisi: ${positionName}` : ""}

PEDOMAN:
1. Pembukaan: sapa rekruter, sebut posisi & perusahaan.
2. Paragraf 1: intro singkat & ketertarikan.
3. Paragraf 2-3: 2-3 pencapaian relevan dengan metrik.
4. Penutup: antusiasme, ajakan interview, kontak.
5. ${lang === "en" ? "Professional English, warm and engaging, 250-400 words." : "Bahasa Indonesia formal hangat, 250-400 kata."}
6. JANGAN pakai "Saya yang bertanda tangan di bawah ini".

OUTPUT: HANYA teks surat, tanpa kata pembuka/penutup.`;

    const result = await aiComplete(
      [{ role: "user", content: prompt }],
      { temperature: 0.7, maxTokens: 2000 },
      lang,
    );

    await checkAndTrackQuota(admin, userId, "cover_letter", result.length);

    return corsResponse({ coverLetter: result.trim() }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
