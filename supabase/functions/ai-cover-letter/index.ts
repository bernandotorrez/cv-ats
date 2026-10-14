/**
 * AI Cover Letter — generate surat lamaran profesional
 * POST /ai-cover-letter
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
    const rateLimitKey = `ai-cover-letter:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }
    const admin = getAdminClient();

    // Check feature flag before processing
    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, enable_cover_letter)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const enabled = (userSub as any)?.subscription_tiers?.enable_cover_letter ?? false;
    if (!enabled) {
      return corsResponse(
        {
          error:
            "Fitur Cover Letter AI hanya tersedia untuk paket Starter ke atas. Silakan upgrade.",
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
    const companyName = limitText(body.companyName, LIMITS.shortText, "companyName");
    const positionName = limitText(body.positionName, LIMITS.shortText, "positionName");
    const jobSource = limitText(body.jobSource, LIMITS.shortText, "jobSource");

    if (!cvId || !cvData || !jobDescription)
      throw new ValidationError("cvId, cvData, dan jobDescription diperlukan");

    const cvText = JSON.stringify(cvData, null, 2);

    const isEn = lang === "en";
    const prompt = `TUGAS: Tulis surat lamaran kerja (cover letter) ${getLanguageInstruction(lang)} berdasarkan data CV kandidat dan lowongan berikut.

DATA CV KANDIDAT (JSON):
${fenced("data_cv", cvText)}

LOWONGAN:
${fenced("job_description", jobDescription)}
${companyName ? `Perusahaan: ${companyName}\n` : ""}${positionName ? `Posisi: ${positionName}\n` : ""}${jobSource ? `Sumber info lowongan: ${jobSource}\n` : ""}
LANGKAH BERPIKIR (jangan ditulis di output):
1. Identifikasi 3–4 kebutuhan utama dari lowongan (skill, pengalaman, tanggung jawab inti).
2. Cari bukti terkuat di CV untuk tiap kebutuhan — pengalaman, pencapaian, proyek, atau skill yang benar-benar ada.
3. Susun surat yang menghubungkan bukti tersebut ke kebutuhan lowongan secara eksplisit.

ATURAN KEJUJURAN:
- Gunakan HANYA pengalaman, pencapaian, angka, dan skill yang ada di data CV. Jangan mengarang angka atau pencapaian; bila CV tidak punya angka, jelaskan dampaknya secara kualitatif dan spesifik.
- Tentang perusahaan, gunakan hanya info dari lowongan/nama perusahaan. Jangan mengarang misi, produk, penghargaan, atau nilai perusahaan.
- Jangan pakai placeholder dalam kurung siku. Jika nama perusahaan tidak diketahui, gunakan rujukan umum (${isEn ? '"your company"' : '"perusahaan Bapak/Ibu"'}).

STRUKTUR:
- Salam pembuka: ${isEn ? '"Dear Hiring Manager," (or "Dear [Company] Recruitment Team," when the company is known)' : '"Yth. Tim Rekrutmen [nama perusahaan]," atau "Yth. Bapak/Ibu HRD [nama perusahaan]," (tanpa nama perusahaan bila tidak diketahui)'}.
- Paragraf 1 — pembuka (2–3 kalimat): sebut posisi, perusahaan, sumber lowongan (bila ada), dan satu kalimat pembuka yang langsung menunjukkan kualifikasi terkuat. Hindari ${isEn ? '"I am writing to apply for..."' : '"Dengan hormat, saya yang bertanda tangan di bawah ini..." dan "Dengan ini saya bermaksud melamar..."'}.
- Paragraf 2 — bukti kecocokan (paling panjang): 2–3 pengalaman/pencapaian paling relevan dari CV, masing-masing dikaitkan eksplisit dengan kebutuhan lowongan. Sertakan angka bila ada di CV.
- Paragraf 3 — kontribusi: apa yang akan kandidat kontribusikan pada tanggung jawab di lowongan dan kenapa peran ini cocok dengan arah kariernya.
- Paragraf 4 — penutup: ajakan wawancara yang percaya diri dan sopan, sebut email/telepon dari CV (bila ada), dan ucapan terima kasih.
- Salam penutup ${isEn ? '"Sincerely,"' : '"Hormat saya,"'} lalu nama lengkap kandidat dari CV.

GAYA:
- 250–380 kata (di luar salam). Paragraf dipisah satu baris kosong.
- ${isEn ? 'Professional, warm, confident English; vary sentence openings — avoid starting most sentences with "I".' : 'Bahasa Indonesia profesional yang hangat, percaya diri, dan mengalir; sapa pembaca dengan "Bapak/Ibu". Hindari kalimat birokratis kuno seperti "Demikian surat lamaran ini saya buat".'}
- Sesuaikan nada dengan industri (startup: lugas dan energik; korporat/perbankan/pemerintahan: lebih formal).
- Masukkan 3–5 keyword penting dari lowongan secara natural.
- Teks polos: tanpa markdown (**tebal**, *miring*, heading), tanpa subjek email, tanggal, atau blok alamat.

OUTPUT: hanya teks surat, dari salam pembuka sampai nama.`;

    // H3: reservasi kuota SEBELUM memanggil AI (estimasi token = maxTokens)
    const MAX_TOKENS = 2000;
    const reservation = await reserveQuota(admin, userId, "cover_letter", MAX_TOKENS);

    let result: string;
    try {
      result = await aiComplete(
        [{ role: "user", content: prompt }],
        { temperature: 0.7, maxTokens: MAX_TOKENS },
        lang,
      );
    } catch (e) {
      await reservation.release();
      throw e;
    }

    return corsResponse({ coverLetter: result.trim() }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
