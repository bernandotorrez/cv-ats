/**
 * AI Suggest — saran pengisian section CV (3 opsi)
 * POST /ai-suggest
 */
import { aiComplete, checkAndTrackQuota, corsResponse, errorResponse, getAdminClient, getUserId, getLanguageInstruction, type CvUiLang } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { cvId, section, targetRole, currentContent, additionalContext, regenerateIndex, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!cvId || !section) throw new Error("cvId dan section diperlukan");

    const languageRule =
      lang === "en"
        ? "All option and explanation values MUST be written in professional English."
        : "Semua nilai option dan explanation WAJIB ditulis dalam Bahasa Indonesia profesional.";
    const activeVerbRule =
      lang === "en"
        ? 'Use active verbs such as "Led", "Developed", "Increased", "Managed", "Designed", "Optimized".'
        : 'Gunakan kata kerja aktif seperti "Memimpin", "Mengembangkan", "Meningkatkan", "Mengelola", "Merancang", "Mengoptimalkan".';

    const prompts: Record<string, string> = {
      summary: `Buatkan 3 opsi ringkasan profil profesional (2-4 kalimat) ${getLanguageInstruction(lang)}. Setiap opsi harus punya gaya berbeda.
${languageRule}
Target posisi: ${targetRole || "tidak disebutkan"}
${currentContent ? `Konten saat ini: ${currentContent}\nBuat opsi yang lebih baik dengan gaya berbeda.` : "Buat 3 opsi dari awal."}
${additionalContext ? `Konteks: ${additionalContext}` : ""}
${regenerateIndex !== undefined ? `Opsi ke-${regenerateIndex + 1} sebelumnya kurang cocok. Buatkan opsi baru dengan gaya yang berbeda.` : ""}

OUTPUT FORMAT (JSON):
[{"option": "teks ringkasan opsi 1", "explanation": "penjelasan singkat kenapa opsi ini kuat"}, {"option": "teks ringkasan opsi 2", "explanation": "penjelasan singkat"}, {"option": "teks ringkasan opsi 3", "explanation": "penjelasan singkat"}]
HANYA JSON array, tanpa markdown, tanpa kata pembuka/penutup.`,

      headline: `Buatkan 3 opsi headline profesional ${getLanguageInstruction(lang)} untuk posisi ${targetRole || "profesional"}.
${languageRule}
${currentContent ? `Headline saat ini: ${currentContent}\nBuat opsi dengan gaya berbeda.` : ""}
${regenerateIndex !== undefined ? `Opsi ke-${regenerateIndex + 1} sebelumnya kurang cocok. Buatkan opsi baru.` : ""}
Syarat: singkat, sebut posisi + keahlian inti + value proposition.
OUTPUT FORMAT (JSON):
[{"option": "headline opsi 1", "explanation": "kenapa headline ini efektif"}, {"option": "headline opsi 2", "explanation": "..."}, {"option": "headline opsi 3", "explanation": "..."}]
HANYA JSON array.`,

      experience: `Buatkan 3 opsi deskripsi pengalaman kerja (3-5 poin) ${getLanguageInstruction(lang)}.
${languageRule}
${targetRole ? `Target: ${targetRole}` : ""}
${currentContent ? `Konten saat ini: ${currentContent}\nBuat opsi dengan gaya berbeda.` : "Buat 3 opsi dari awal."}
${additionalContext ? `Konteks: ${additionalContext}` : ""}
${regenerateIndex !== undefined ? `Opsi ke-${regenerateIndex + 1} sebelumnya kurang cocok. Buatkan opsi baru.` : ""}

ATURAN PENTING untuk setiap opsi:
- Setiap poin DIAWALI dengan dash: "- "
- ${activeVerbRule}
- Sertakan metrik kuantitatif: "...meningkatkan 35%", "...mengelola tim 8 orang"
- Fokus pada PENCAPAIAN, bukan tugas harian.

OUTPUT FORMAT (JSON):
[{"option": "- poin 1\\n- poin 2\\n- poin 3", "explanation": "kenapa deskripsi ini kuat"}, ...]
HANYA JSON array, tanpa markdown.`,

      education: `Buatkan 3 opsi deskripsi pendidikan (1-3 kalimat) ${getLanguageInstruction(lang)}.
${languageRule}
${currentContent ? `Deskripsi saat ini: ${currentContent}\nBuat opsi dengan gaya berbeda.` : "Buat 3 opsi dari awal."}
${additionalContext ? `Konteks: ${additionalContext}` : ""}
${regenerateIndex !== undefined ? `Opsi ke-${regenerateIndex + 1} sebelumnya kurang cocok. Buatkan opsi baru.` : ""}

OUTPUT FORMAT (JSON):
[{"option": "deskripsi opsi 1", "explanation": "kenapa deskripsi ini efektif"}, ...]
HANYA JSON array.`,

      skills: `Sarankan 3 opsi daftar skill (hard + soft) ${getLanguageInstruction(lang)} untuk target posisi: ${targetRole || "umum"}.
${languageRule}
${currentContent ? `Skill saat ini: ${currentContent}\nBuat opsi dengan fokus berbeda.` : ""}
${additionalContext ? `Konteks: ${additionalContext}` : ""}
${regenerateIndex !== undefined ? `Opsi ke-${regenerateIndex + 1} sebelumnya kurang cocok. Buatkan opsi baru.` : ""}

OUTPUT FORMAT (JSON):
[{"option": "skill1\\nskill2\\nskill3\\nskill4", "explanation": "fokus opsi ini"}, ...]
HANYA JSON array.`,
    };

    const prompt = prompts[section] || prompts.summary;
    const result = await aiComplete([{ role: "user", content: prompt }], {}, lang);

    await checkAndTrackQuota(admin, userId, "suggest", result.length);

    // Parse JSON response
    let suggestions: Array<{ option: string; explanation: string }>;
    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, "").trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error("Invalid format");
      }
    } catch {
      // Fallback: wrap single response as one option
      suggestions = [
        { option: result.trim(), explanation: lang === "en" ? "AI suggestion" : "Saran dari AI" },
      ];
    }

    return corsResponse({ suggestions }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
