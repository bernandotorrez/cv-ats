/**
 * AI CV Review — Professional HR Recruitment Review (20+ years experience)
 * Persona: Senior HR Recruitment Expert
 * Target Users: Starter & Pro tiers only
 *
 * POST /ai-cv-review
 * Body: { cvData: object, targetRole?: string, jobDescription?: string }
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

    // Check feature flag from subscription_tiers
    const { data: userSub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, name, enable_cv_review)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const tier = (userSub as any)?.subscription_tiers;
    if (!tier?.enable_cv_review) {
      return corsResponse(
        {
          error:
            "Fitur Review CV by HR hanya tersedia untuk paket Starter ke atas. Silakan upgrade untuk mengakses fitur ini.",
          requiresUpgrade: true,
          upgradeUrl: "/harga",
        },
        403,
        req,
      );
    }

    const { cvId, cvData, targetRole, jobDescription, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!cvData) {
      throw new Error("Data CV diperlukan untuk review");
    }

    const tierSlug = (tier as any)?.slug || "free";

    // Convert CV data to text for analysis
    const cvText = extractCvText(cvData);
    const jdText = jobDescription ? `\n\nLOWONGAN YANG DITARGET:\n${jobDescription}` : "";
    const roleText = targetRole ? `\nPosisi yang dilamar: ${targetRole}` : "";

    // HR PERSONA SYSTEM PROMPT - 20 years experience
    const hrPersonaPrompt = `Kamu adalah Sari Dewi Lakshmana, Senior HR Recruitment Consultant dengan pengalaman 20+ tahun di berbagai industri:
- Pernah menangani rekrutmen untuk perusahaan Fortune 500 di Asia Tenggara
- Spesialisasi: executive search, mass recruitment, dan HR consulting
- Pengalaman di sektor: teknologi, perbankan, manufaktur, kesehatan, ritel
- Certified Professional in Human Resources (CPHR)
- Pendiri HR Consultancy "TalentFlow Indonesia"

PENDEKATAN REVIEW:
1. Kamu melihat CV dari Kacamata REKRUTER, bukan pelamar
2. Dalam 6 detik pertama, rekruter sudah memutuskan - kamu bantuoptimalkan 6 detik itu
3. ${lang === "en" ? "You understand international work culture and multinational company expectations" : "Kamu paham budaya kerja Indonesia dan ekspektasi perusahaan lokal & multinasional"}
4. Kamu berikan feedback yang JUJUR, LANGSUNG, dan KONSTRUKTIF - bukan basa-basi

FORMAT REVIEW:

## 🎯 SKOR KESELURUHAN (0-100)
Total skor adalah rata-rata tertimbang dari 5 sub-kategori di bawah. SETIAP sub-kategori dinilai 0-100:
- First Impression (0-100): Apakah CV langsung menarik perhatian rekruter?
- Formatting & ATS (0-100): Apakah format bisa dibaca mesin ATS?
- Konten & Relevansi (0-100): Apakah pengalaman relevan dengan posisi?
- Pengalaman & Pencapaian (0-100): Apakah ada metrik & dampak terukur?
- Presentasi & Writing (0-100): Apakah bahasa profesional, ringkas, dan jelas?

PENTING: Setiap sub-kategori adalah angka 0-100. Contoh: skor 78 berarti 78/100, BUKAN 7.8/10.

## ✅ KEKUATAN CV (3-5 point)
Yang sudah BAIK dan harus dipertahankan

## ⚠️ AREA PERBAIKAN (3-5 point)  
Yang perlu DIPERBAIKI dengan urgensi tinggi

## 💡 SARAN SPESIFIK (5-7 actionable items)
Saran KONKRET dan DAPAT DIIMPLEMENTASI langsung:
- Contoh: "Ubah 'Bertanggung jawab atas penjualan' → 'Meningkatkan penjualan 35% dalam 8 bulan (Rp 500jt target → Rp 675jt tercapai)'"
- Prioritas: Urutkan dari dampak tertinggi ke terendah

## 📊 PERBANDINGAN DENGAN STANDAR INDUSTRI
Bandingkan CV dengan kandidat lain di level yang sama

## 🎯 KESIMPULAN HR
Opini jujur tentang kelayakan CV ini untuk posisi target

OUTPUT: WAJIB JSON valid ${getLanguageInstruction(lang)} (tanpa markdown wrapper):
{
  "reviewer": {
    "name": "Sari Dewi Lakshmana",
    "title": "Senior HR Recruitment Consultant",
    "experience": "20+ tahun"
  },
  "overallScore": number (0-100),
  "firstImpression": number (0-100),
  "formatScore": number (0-100),
  "contentScore": number (0-100),
  "achievementScore": number (0-100),
  "presentationScore": number (0-100),
  "strengths": string[] (3-5),
  "weaknesses": string[] (3-5),
  "suggestions": [
    {
      "priority": "high" | "medium" | "low",
      "category": "format" | "content" | "achievement" | "writing" | "keyword",
      "current": "kondisi saat ini",
      "suggested": "rekomendasi perbaikan",
      "impact": "dampak jika diubah"
    }
  ],
  "industryBenchmark": {
    "level": "fresh_grad|junior|mid|senior|executive",
    "comparison": "perbandingan dengan standar industri",
    "percentile": "perkiraan percentil CV ini"
  },
  "hrVerdict": {
    "verdict": ${lang === "en" ? '"Pass Initial|Mid Stage|Final Stage|Needs Revision"' : '"Lolos Tahap Awal|Tahap Menengah|Tahap Akhir|Harus Revisi"'},
    "reason": "alasan keputusan",
    "nextSteps": ["langkah selanjutnya"]
  },
  "quickWins": string[] (3 point yang bisa diubah SEKARANG untuk dampak cepat)
}`;

    const analysisPrompt = `DATA CV YANG DIREVIEW:${roleText}${jdText}

${cvText}

${hrPersonaPrompt}`;

    const result = await aiComplete(
      [{ role: "user", content: analysisPrompt }],
      { temperature: 0.4, maxTokens: 4000, jsonMode: true },
      lang,
    );

    let parsed: Record<string, unknown>;
    try {
      // Try direct parse first
      parsed = JSON.parse(result);
    } catch {
      // Try to extract JSON from response
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          throw new Error("Gagal parse hasil review CV. Silakan coba lagi.");
        }
      } else {
        throw new Error("Format respons tidak valid. Silakan coba lagi.");
      }
    }

    // Track usage
    await checkAndTrackQuota(admin, userId, "cv_review", 800);

    // Save review to database
    const { error: insertError } = await admin.from("cv_reviews").insert({
      user_id: userId,
      cv_id: cvId || null,
      target_role: targetRole || null,
      job_description: jobDescription || null,
      overall_score: parsed.overallScore || 0,
      scores: {
        overall: parsed.overallScore,
        first_impression: parsed.firstImpression,
        format: parsed.formatScore,
        content: parsed.contentScore,
        achievement: parsed.achievementScore,
        presentation: parsed.presentationScore,
      },
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || [],
      industry_benchmark: parsed.industryBenchmark || {},
      hr_verdict: parsed.hrVerdict || {},
      quick_wins: parsed.quickWins || [],
    });

    if (insertError) {
      console.error("Failed to save CV review:", insertError);
    }

    // Return structured response
    return corsResponse(
      {
        success: true,
        review: {
          reviewer: parsed.reviewer || {
            name: "Hira AI",
            title: "Senior HR Recruitment Consultant",
            experience: "20+ tahun",
          },
          scores: {
            overall: parsed.overallScore || 0,
            firstImpression: parsed.firstImpression || 0,
            format: parsed.formatScore || 0,
            content: parsed.contentScore || 0,
            achievement: parsed.achievementScore || 0,
            presentation: parsed.presentationScore || 0,
          },
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          suggestions: parsed.suggestions || [],
          industryBenchmark: parsed.industryBenchmark || {},
          hrVerdict: parsed.hrVerdict || {},
          quickWins: parsed.quickWins || [],
        },
        tier: tierSlug,
        isHrPersona: true,
      },
      200,
      req,
    );
  } catch (e) {
    return errorResponse(e, req);
  }
});

/**
 * Extract readable text from CV data object
 * Sesuai dengan tipe CvData dari cv-types.ts:
 * { personal, experiences, educations, skills, languages, certificates }
 */
function extractCvText(cvData: Record<string, unknown>): string {
  const lines: string[] = [];

  // ===== Personal Info (field: "personal") =====
  const personal = cvData.personal as Record<string, unknown> | undefined;
  if (personal) {
    lines.push("DATA DIRI:");
    if (personal.fullName) lines.push(`Nama: ${personal.fullName}`);
    if (personal.headline) lines.push(`Judul: ${personal.headline}`);
    if (personal.email) lines.push(`Email: ${personal.email}`);
    if (personal.phone) lines.push(`Telepon: ${personal.phone}`);
    if (personal.location) lines.push(`Lokasi: ${personal.location}`);
    if (personal.linkedin) lines.push(`LinkedIn: ${personal.linkedin}`);
    if (personal.website) lines.push(`Website: ${personal.website}`);
    if (personal.summary) lines.push(`Ringkasan: ${personal.summary}`);
  }

  // ===== Work Experience (field: "experiences") =====
  const experiences = cvData.experiences as Array<Record<string, unknown>> | undefined;
  if (experiences && Array.isArray(experiences) && experiences.length > 0) {
    lines.push("\nPENGALAMAN KERJA:");
    experiences.forEach((exp, i) => {
      lines.push(`${i + 1}. ${exp.position || "Posisi"}`);
      lines.push(`   Perusahaan: ${exp.company || "-"}`);
      lines.push(`   Lokasi: ${exp.location || "-"}`);
      lines.push(
        `   Periode: ${exp.startDate || "-"} - ${exp.current ? "Sekarang" : exp.endDate || "-"}`,
      );
      if (exp.description) lines.push(`   Deskripsi: ${exp.description}`);
    });
  }

  // ===== Education (field: "educations") =====
  const educations = cvData.educations as Array<Record<string, unknown>> | undefined;
  if (educations && Array.isArray(educations) && educations.length > 0) {
    lines.push("\nPENDIDIKAN:");
    educations.forEach((edu, i) => {
      lines.push(`${i + 1}. ${edu.degree || "-"} ${edu.field ? `(${edu.field})` : ""}`);
      lines.push(`   Institusi: ${edu.school || "-"}`);
      lines.push(`   Tahun: ${edu.startDate || "-"} - ${edu.endDate || "-"}`);
      if (edu.description) lines.push(`   Deskripsi: ${edu.description}`);
    });
  }

  // ===== Skills (field: "skills") =====
  const skills = cvData.skills as Array<Record<string, unknown>> | undefined;
  if (skills && Array.isArray(skills) && skills.length > 0) {
    lines.push("\nKEAHLIAN:");
    const skillNames = skills.map((s) => s.name).filter(Boolean);
    if (skillNames.length > 0) {
      lines.push(skillNames.join(", "));
    }
  }

  // ===== Languages (field: "languages") =====
  const languages = cvData.languages as Array<Record<string, unknown>> | undefined;
  if (languages && Array.isArray(languages) && languages.length > 0) {
    lines.push("\nBAHASA:");
    languages.forEach((lang) => {
      lines.push(`${lang.name || "-"}: ${lang.level || "-"}`);
    });
  }

  // ===== Certificates (field: "certificates") =====
  const certificates = cvData.certificates as Array<Record<string, unknown>> | undefined;
  if (certificates && Array.isArray(certificates) && certificates.length > 0) {
    lines.push("\nSERTIFIKAT:");
    certificates.forEach((cert) => {
      lines.push(`- ${cert.name || "-"} — ${cert.issuer || "-"} (${cert.date || "-"})`);
    });
  }

  return lines.join("\n");
}
