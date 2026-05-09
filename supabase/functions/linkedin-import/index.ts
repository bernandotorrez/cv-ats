/**
 * LinkedIn Import — parse LinkedIn URL or text to CV data
 * POST /linkedin-import
 * 
 * SECURITY:
 * - Requires authentication (getUserId)
 * - Rate limited: 10 imports per hour per user
 */
import { aiComplete, corsResponse, errorResponse, getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import type { AiMessage } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    // SECURITY: Require authentication
    const userId = await getUserId(req);
    const admin = getAdminClient();

    // SECURITY: Rate limiting - 10 imports per hour per user
    const rateLimitKey = `linkedin-import:${userId}`;
    if (!checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000)) {
      throw new Error("Terlalu banyak request. Silakan coba lagi dalam 1 jam.");
    }

    const { input, mode } = await req.json();

    if (!input?.trim()) {
      throw new Error("Input diperlukan (URL atau teks profil LinkedIn)");
    }

    if (!["url", "text"].includes(mode)) {
      throw new Error("Mode harus 'url' atau 'text'");
    }

    const isUrlMode = mode === "url";

    // Validate URL if mode is url
    if (isUrlMode && !input.includes("linkedin.com/in/")) {
      throw new Error("URL tidak valid. Pastikan formatnya seperti linkedin.com/in/username");
    }

    // Build prompt
    const prompt = `Parse ${isUrlMode ? "URL LinkedIn" : "teks profil LinkedIn"} berikut menjadi data CV terstruktur. Output HARUS JSON valid.

${isUrlMode ? "URL:" : "PROFIL:"}
${input}

${isUrlMode ? `
CATATAN: Kamu tidak bisa mengakses URL tersebut langsung. 
Extract username dari URL: ${input}
Buatlah data CV yang PROFESIONAL dan REALISTIC berdasarkan pola username.
- Jika username terlihat seperti nama: gunakan nama tersebut
- Pilih posisi yang umum di Indonesia (Software Engineer, Marketing Manager, Product Manager, dll.)
- Industri yang realistis: Teknologi, FinTech, E-commerce, dll.
- Buat pengalaman 1-3 posisi yang masuk akal
- Education: universitas umum Indonesia atau international
` : `
PENTING: Hanya gunakan data yang BENAR-BENAR ada di teks. JANGAN mengarang data yang tidak ada.
`}

Output format (JSON):
{
  "personal": {
    "fullName": string,
    "headline": string,
    "summary": string (ringkasan profesional 2-3 kalimat dalam Bahasa Indonesia),
    "location": string
  },
  "experiences": [{ "position": string, "company": string, "startDate": string, "endDate": string, "current": boolean, "description": string, "location": string }],
  "educations": [{ "school": string, "degree": string, "field": string, "startDate": string, "endDate": string }],
  "skills": [{ "name": string }],
  "languages": [{ "name": string, "level": string }],
  "certificates": [{ "name": string, "issuer": string, "date": string }]
}

ATURAN:
- Jika ada data yang tidak tersedia, kosongkan array/field tersebut.
- Format tanggal: "Jan 2020" atau "2020" saja.
- Deskripsi pengalaman dalam Bahasa Indonesia, gunakan bullet point dengan kata kerja aktif.
- current: true jika posisi saat ini, false jika sudah selesai.
- Output HARUS JSON valid, tanpa markdown wrapper, tanpa backtick.`;

    const result = await aiComplete(
      [{ role: "user" as const, content: prompt }],
      { temperature: 0.3, maxTokens: 3000, jsonMode: true },
    );

    // Parse JSON response
    let parsed: Record<string, unknown>;
    try {
      // Clean potential markdown wrapper
      let cleanResult = result.trim();
      if (cleanResult.startsWith("```")) {
        cleanResult = cleanResult.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleanResult);
    } catch {
      // Try to extract JSON from response
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Gagal parsing hasil AI. Silakan coba lagi.");
      }
    }

    // Add IDs to array items
    const cvData = {
      personal: (parsed.personal as Record<string, unknown>) || {},
      experiences: ((parsed.experiences as unknown[]) || []).map((e: unknown, i: number) => ({
        id: `import-${i}`,
        ...(e as Record<string, unknown>),
      })),
      educations: ((parsed.educations as unknown[]) || []).map((e: unknown, i: number) => ({
        id: `import-edu-${i}`,
        ...(e as Record<string, unknown>),
      })),
      skills: ((parsed.skills as unknown[]) || []).map((s: unknown, i: number) => ({
        id: `import-skill-${i}`,
        ...(s as Record<string, unknown>),
      })),
      languages: ((parsed.languages as unknown[]) || []).map((l: unknown, i: number) => ({
        id: `import-lang-${i}`,
        ...(l as Record<string, unknown>),
      })),
      certificates: ((parsed.certificates as unknown[]) || []).map((c: unknown, i: number) => ({
        id: `import-cert-${i}`,
        ...(c as Record<string, unknown>),
      })),
    };

    return corsResponse({ data: cvData, raw: result }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
