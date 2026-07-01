/**
 * AI Cover Letter — generate surat lamaran profesional
 * POST /ai-cover-letter
 */
import {
  aiComplete,
  checkAndTrackQuota,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  getLanguageInstruction,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { cvId, cvData, jobDescription, companyName, positionName, language, jobSource } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!cvId || !cvData || !jobDescription)
      throw new Error("cvId, cvData, dan jobDescription diperlukan");

    const cvText = JSON.stringify(cvData, null, 2);

    const prompt = `Buatkan surat lamaran (cover letter) profesional ${getLanguageInstruction(lang)}.

DATA CV:
${cvText}

DESKRIPSI PEKERJAAN:
${jobDescription}
${companyName ? `\nPerusahaan: ${companyName}` : ""}
${positionName ? `\nPosisi: ${positionName}` : ""}
${jobSource ? `\nSumber Informasi Lowongan: ${jobSource}` : ""}

PEDOMAN:
1. Pembukaan & Intro: Sapa rekruter secara profesional. Hindari kalimat klise kaku seperti "Dengan ini saya bermaksud melamar...". Mulailah dengan kalimat pembuka yang menarik, menyebut posisi, perusahaan, dan sumber informasi lowongan (${jobSource || "informasi lowongan"}).
2. Mengapa Saya (Dampak Kuantitatif): Tuliskan 2-3 pencapaian relevan dari CV, lengkap dengan metrik kuantitatif (angka, persentase, nominal, efisiensi waktu, dll.) untuk membuktikan dampak nyata dari keahlian Anda.
3. Mengapa Perusahaan Ini (Value Fit): Tunjukkan ketertarikan Anda pada misi/industri perusahaan, dan bagaimana Anda dapat membantu memecahkan masalah atau berkontribusi pada tujuan mereka.
4. Penutup: Kalimat penutup yang percaya diri namun sopan, ajakan untuk berdiskusi/wawancara (call to action), serta sebutkan kontak Anda (email/telepon) untuk mempermudah rekruter.
5. Gaya Bahasa & Nada: ${lang === "en" ? "Professional English, confident, warm and engaging, 250-400 words. Avoid generic boilerplate text." : "Bahasa Indonesia profesional formal, percaya diri, hangat, dan mengalir (tidak kaku/statis). JANGAN gunakan kalimat birokratis kuno seperti 'Saya yang bertanda tangan di bawah ini' atau 'Demikian surat lamaran ini saya buat'."}

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
