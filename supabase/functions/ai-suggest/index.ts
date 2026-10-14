/**
 * AI Suggest — saran pengisian section CV (3 opsi)
 * POST /ai-suggest
 */
import {
  aiComplete,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  getActionVerbExamples,
  getCvWritingRules,
  getLanguageStyle,
  summarizeCvForPrompt,
  fenced,
  reserveQuota,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import { limitText, readJsonBody, ValidationError } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);

    // Rate Limiting
    const rateLimitKey = `ai-suggest:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }
    const admin = getAdminClient();

    // Check feature flag — ai-suggest available for all tiers but verify DB state
    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, quota_ai_suggest)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const suggestQuota = (userSub as any)?.subscription_tiers?.quota_ai_suggest ?? null;
    if (suggestQuota !== null && suggestQuota <= 0) {
      return corsResponse(
        {
          error: "Fitur AI Saran tidak tersedia di paket kamu. Silakan upgrade.",
          requiresUpgrade: true,
          upgradeUrl: "/harga",
        },
        403,
        req,
      );
    }

    const body = await readJsonBody(req, 100_000);
    const lang: CvUiLang = body.language === "en" ? "en" : "id";
    const cvId = limitText(body.cvId, 100, "cvId");
    const section = limitText(body.section, 50, "section");
    const targetRole = limitText(body.targetRole, 500, "targetRole");
    const currentContent = limitText(body.currentContent, 10_000, "currentContent");
    const additionalContext = limitText(body.additionalContext, 5_000, "additionalContext");
    const regenerateIndex =
      typeof body.regenerateIndex === "number" &&
      Number.isInteger(body.regenerateIndex) &&
      body.regenerateIndex >= 0 &&
      body.regenerateIndex < 20
        ? body.regenerateIndex
        : undefined;

    if (!cvId || !section) throw new ValidationError("cvId dan section diperlukan");

    const normalizeExperienceBullets = (text: string) =>
      text
        .split("\n")
        .map((line) => {
          const trimmed = line.trimStart();
          if (/^[-*]\s+/.test(trimmed)) {
            return `${line.slice(0, line.length - trimmed.length)}• ${trimmed.replace(/^[-*]\s+/, "")}`;
          }
          return line;
        })
        .join("\n");

    // Konteks dari isi CV user agar saran spesifik (bukan template umum). Hanya CV milik user.
    const { data: cvRow } = await admin
      .from("cvs")
      .select("data")
      .eq("id", cvId)
      .eq("user_id", userId)
      .maybeSingle();
    const cvProfile = summarizeCvForPrompt((cvRow as { data?: unknown } | null)?.data);

    const isEn = lang === "en";
    const languageRule = isEn
      ? "All option and explanation values MUST be written in English. Style: " +
        getLanguageStyle(lang)
      : "Semua nilai option dan explanation WAJIB dalam Bahasa Indonesia. Gaya: " +
        getLanguageStyle(lang);
    const placeholderRule = (examples: string) =>
      `Gunakan angka/fakta yang ada di data user. Jika angka akan memperkuat kalimat tetapi tidak tersedia, boleh MAKSIMAL 2 placeholder per opsi dengan format kurung siku (${examples}) agar user mengisi angka sebenarnya — JANGAN mengarang angka spesifik. Jika memakai placeholder, sebutkan di explanation bahwa user perlu menggantinya.`;

    const contextBlock = [
      `TARGET POSISI: ${targetRole || (isEn ? "not specified (infer from the CV)" : "tidak disebutkan (simpulkan dari CV)")}`,
      cvProfile
        ? `PROFIL CV USER (konteks — jangan disalin mentah):\n${fenced("profil_cv", cvProfile)}`
        : "",
      additionalContext ? `ITEM YANG SEDANG DIISI: ${additionalContext}` : "",
      currentContent
        ? `KONTEN SAAT INI (pertahankan semua fakta & angka di dalamnya, lalu perkuat):\n${fenced("konten_saat_ini", currentContent)}`
        : "KONTEN SAAT INI: kosong — buat dari nol berdasarkan profil CV, item, dan target posisi.",
      regenerateIndex !== undefined
        ? "CATATAN: user tidak puas dengan opsi sebelumnya. Buat 3 opsi baru dengan sudut pandang, struktur kalimat, dan pilihan kata yang jelas berbeda dari biasanya."
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const outputFormat = (
      example: string,
    ) => `OUTPUT: JSON object saja, tepat 3 opsi, urutan sesuai sudut di atas:
{"suggestions": [{"option": ${example}, "explanation": "1 kalimat: sudut opsi ini & kapan paling cocok dipakai"}, {...}, {...}]}`;

    const prompts: Record<string, string> = {
      summary: `TUGAS: Tulis 3 opsi ringkasan profil (professional summary) untuk CV.
${languageRule}

${contextBlock}

SUDUT TIAP OPSI (harus terasa jelas berbeda):
1. Berbasis pencapaian — tonjolkan hasil/dampak paling kuat dari pengalaman user.
2. Berbasis keahlian — tonjolkan kombinasi skill inti, tools, dan domain/industri.
3. Berorientasi target — hubungkan latar belakang user dengan posisi target dan value yang dibawa ke perusahaan.

ATURAN:
- 2–4 kalimat, 40–80 kata. Struktur: identitas profesional (jabatan/bidang + level atau lama pengalaman) → keahlian/pencapaian kunci → value atau arah karier.
- Tulis tanpa kata ganti orang pertama (${isEn ? '"I", "my"' : '"saya", "aku"'}), mis. ${isEn ? '"Digital Marketing Specialist with 4 years of experience in…"' : '"Digital Marketing Specialist dengan 4 tahun pengalaman di…"'}.
- Lama pengalaman: hitung dari tanggal di profil CV. Jika tidak bisa dipastikan, jangan sebut angka tahun.
- Masukkan 3–5 keyword yang relevan dengan target posisi secara natural.
- Fresh graduate / tanpa pengalaman kerja: fokus pada pendidikan, magang, organisasi, proyek, dan skill.
- Jangan mengklaim pencapaian, skill, atau senioritas yang tidak didukung data user.

${outputFormat('"teks ringkasan"')}`,

      headline: `TUGAS: Tulis 3 opsi headline CV (baris di bawah nama).
${languageRule}

${contextBlock}

SUDUT TIAP OPSI:
1. Jabatan + spesialisasi, mis. "Software Engineer | Backend & Cloud Infrastructure".
2. Jabatan + 2–3 keahlian/tools inti, mis. "Data Analyst | SQL, Python & Power BI".
3. Jabatan + value/hasil yang ditawarkan, mis. "Account Executive | Membangun Pipeline B2B yang Konsisten".

ATURAN:
- Maksimal ±70 karakter. Pemisah " | ".
- Gunakan nama jabatan standar industri yang dicari rekruter & ATS (boleh istilah Bahasa Inggris yang lazim), selaras dengan target posisi.
- Jangan menaikkan senioritas (Senior/Lead/Head) atau menyebut keahlian yang tidak didukung CV.
- Tanpa emoji, tanpa titik di akhir.

${outputFormat('"teks headline"')}`,

      experience: `TUGAS: Tulis 3 opsi deskripsi untuk satu item pengalaman di CV (lihat ITEM YANG SEDANG DIISI).
${languageRule}

${contextBlock}

SUDUT TIAP OPSI:
1. Dampak & hasil — tonjolkan kontribusi terhadap target bisnis/tim.
2. Keahlian & ruang lingkup — tonjolkan tools/metode yang dipakai dan skala tanggung jawab.
3. Kolaborasi & perbaikan proses — tonjolkan kerja lintas tim, inisiatif, atau efisiensi (sesuaikan dengan level jabatan).

ATURAN:
- 3–5 poin per opsi. Setiap poin diawali "• " dan dipisah "\\n" di dalam string JSON.
${getCvWritingRules(lang)}
- Isi harus realistis untuk jabatan & perusahaan tersebut, dan relevan dengan target posisi.
- ${placeholderRule(isEn ? '"[X%]", "[X clients]", "[Rp X]"' : '"[X%]", "[X klien]", "[Rp X]"')}

${outputFormat('"• poin 1\\n• poin 2\\n• poin 3"')}`,

      education: `TUGAS: Tulis 3 opsi deskripsi untuk satu item pendidikan di CV (lihat ITEM YANG SEDANG DIISI).
${languageRule}

${contextBlock}

SUDUT TIAP OPSI:
1. Akademik & prestasi — IPK, penghargaan, beasiswa, mata kuliah relevan.
2. Proyek & keterampilan terapan — skripsi/tugas akhir, proyek, praktikum yang relevan dengan target posisi.
3. Kegiatan & kepemimpinan — organisasi, kepanitiaan, kompetisi, dan soft skill yang terbukti.

ATURAN:
- 2–4 poin per opsi. Setiap poin diawali "• " dan dipisah "\\n" di dalam string JSON.
- ${getActionVerbExamples(lang)}.
- Pilih hal yang paling relevan dengan target posisi.
- ${placeholderRule(isEn ? '"[GPA X.XX]", "[thesis title]"' : '"[IPK X,XX]", "[judul skripsi]"')}

${outputFormat('"• poin 1\\n• poin 2"')}`,

      skills: `TUGAS: Sarankan 3 opsi daftar skill untuk CV.
${languageRule}

${contextBlock}

SUDUT TIAP OPSI:
1. Hard skill inti — kompetensi teknis/fungsional utama untuk target posisi.
2. Tools & platform — software, bahasa pemrograman, sistem, atau platform yang lazim dipakai di posisi tersebut.
3. Seimbang — campuran hard skill dan maksimal 4 soft skill yang relevan.

ATURAN:
- 10–15 skill per opsi, masing-masing 1–3 kata, dipisah ", " (contoh: "React, Node.js, REST API, Problem Solving").
- Penulisan resmi/standar industri ("JavaScript", "Microsoft Excel", "Google Analytics"), tanpa deskripsi atau level.
- Prioritaskan skill yang sudah ada atau tersirat dari pengalaman di CV, lalu lengkapi dengan skill yang lazim dibutuhkan target posisi. Urutkan dari paling relevan. Tanpa duplikat.
- Di explanation, ingatkan user untuk menghapus skill yang tidak benar-benar dikuasai.

${outputFormat('"Skill1, Skill2, Skill3"')}`,
    };

    const prompt = Object.hasOwn(prompts, section) ? prompts[section] : prompts.summary;

    // H3: reservasi kuota SEBELUM memanggil AI (estimasi token = maxTokens default 2048)
    const reservation = await reserveQuota(admin, userId, "suggest", 2048);

    let result: string;
    try {
      result = await aiComplete(
        [{ role: "user", content: prompt }],
        { temperature: regenerateIndex !== undefined ? 0.9 : 0.7, maxTokens: 2048, jsonMode: true },
        lang,
      );
    } catch (e) {
      await reservation.release();
      throw e;
    }

    let suggestions = parseSuggestions(result);
    if (suggestions.length === 0) {
      // Fallback: tampilkan respons mentah sebagai satu opsi
      suggestions = [
        { option: result.trim(), explanation: isEn ? "AI suggestion" : "Saran dari AI" },
      ];
    }

    if (section === "experience" || section === "education") {
      suggestions = suggestions.map((suggestion) => ({
        ...suggestion,
        option: normalizeExperienceBullets(suggestion.option),
      }));
    }

    return corsResponse({ suggestions }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});

type Suggestion = { option: string; explanation: string };

/** Terima {"suggestions": [...]}, array mentah, atau object dengan array lain di dalamnya. */
function parseSuggestions(raw: string): Suggestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return [];
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }

  let items: unknown = parsed;
  if (items && typeof items === "object" && !Array.isArray(items)) {
    const obj = items as Record<string, unknown>;
    items = Array.isArray(obj.suggestions)
      ? obj.suggestions
      : Object.values(obj).find(Array.isArray);
  }
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (typeof item === "string") return { option: item.trim(), explanation: "" };
      const obj = (item ?? {}) as Record<string, unknown>;
      return {
        option: typeof obj.option === "string" ? obj.option.trim() : "",
        explanation: typeof obj.explanation === "string" ? obj.explanation.trim() : "",
      };
    })
    .filter((s) => s.option)
    .slice(0, 3);
}
