/**
 * AI Tailor CV — sesuaikan CV user terhadap job description spesifik.
 * POST /ai-tailor-cv
 */
import {
  aiComplete,
  checkAndTrackQuota,
  corsResponse,
  errorResponse,
  getAdminClient,
  getLanguageInstruction,
  getUserId,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

type CvRow = {
  id: string;
  title: string;
  data: Record<string, unknown>;
  user_id: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { cvId, jobDescription, jobTitle, companyName, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!cvId) throw new Error("cvId diperlukan.");
    if (!String(jobDescription || "").trim()) throw new Error("Job description wajib diisi.");

    const { data: tierData } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const tierSlug = (tierData as any)?.subscription_tiers?.slug || "free";
    if (tierSlug !== "pro") {
      throw new Error("Auto Tailor CV tersedia untuk paket Pro.");
    }

    const { data: cv, error: cvError } = await admin
      .from("cvs")
      .select("id, title, data, user_id")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (cvError || !cv) throw new Error("CV tidak ditemukan atau bukan milik user.");

    const cvRow = cv as CvRow;
    const cleanJobDescription = String(jobDescription).trim().slice(0, 12000);
    const cvText = JSON.stringify(cvRow.data, null, 2);

    const prompt = `Kamu adalah recruiter, ATS specialist, dan career coach.
Tugasmu: tailor CV user agar lebih relevan untuk lowongan tertentu ${getLanguageInstruction(lang)}.

ATURAN PENTING:
- Jangan mengarang pengalaman, angka, sertifikasi, pendidikan, perusahaan, tanggal, atau skill yang tidak tersirat/ada di CV user.
- Boleh menata ulang prioritas skill dan memperjelas wording agar keyword lowongan lebih terlihat.
- Boleh rewrite headline, summary, dan deskripsi pengalaman agar lebih spesifik ke lowongan.
- Pertahankan schema data CV yang sama: personal, experiences, educations, skills, languages, certificates.
- Pertahankan id item yang sudah ada.
- Jika ada keyword lowongan yang tidak bisa dimasukkan dengan jujur, masukkan ke cautions, bukan dipaksakan.
- Output HARUS JSON valid saja tanpa markdown.

LOWONGAN:
Posisi: ${String(jobTitle || "").trim() || "Tidak dicantumkan"}
Perusahaan: ${String(companyName || "").trim() || "Tidak dicantumkan"}
Job description:
${cleanJobDescription}

CV TITLE:
${cvRow.title}

DATA CV SAAT INI:
${cvText}

Format output:
{
  "tailored_cv_data": {
    "personal": {
      "fullName": string,
      "headline": string,
      "email": string,
      "phone": string,
      "location": string,
      "website": string,
      "linkedin": string,
      "summary": string,
      "summaryAlign": "left" | "center" | "right" | "justify"
    },
    "experiences": [
      {
        "id": string,
        "company": string,
        "position": string,
        "location": string,
        "startDate": string,
        "endDate": string,
        "current": boolean,
        "description": string,
        "descriptionAlign": "left" | "center" | "right" | "justify"
      }
    ],
    "educations": [],
    "skills": [],
    "languages": [],
    "certificates": []
  },
  "summary": string,
  "target_role": string,
  "company_name": string,
  "keyword_focus": string[],
  "changes": [
    {
      "section": string,
      "before": string,
      "after": string,
      "reason": string
    }
  ],
  "cautions": string[]
}`;

    const raw = await aiComplete(
      [{ role: "user", content: prompt }],
      { temperature: 0.2, maxTokens: 5000, jsonMode: true },
      lang,
    );

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Gagal parse hasil tailor CV.");
      parsed = JSON.parse(match[0]);
    }

    const tailored = normalizeCvData(parsed.tailored_cv_data, cvRow.data);

    await checkAndTrackQuota(admin, userId, "tailor_cv", 900);

    return corsResponse(
      {
        tailoredCvData: tailored,
        summary: String(parsed.summary || ""),
        targetRole: String(parsed.target_role || jobTitle || ""),
        companyName: String(parsed.company_name || companyName || ""),
        keywordFocus: toStringArray(parsed.keyword_focus).slice(0, 12),
        changes: toChanges(parsed.changes),
        cautions: toStringArray(parsed.cautions).slice(0, 8),
      },
      200,
      req,
    );
  } catch (e) {
    return errorResponse(e, req);
  }
});

function normalizeCvData(value: unknown, fallback: Record<string, unknown>) {
  const data = isRecord(value) ? value : fallback;
  const source = fallback;
  return {
    personal: isRecord(data.personal) ? data.personal : source.personal || {},
    experiences: Array.isArray(data.experiences) ? data.experiences : source.experiences || [],
    educations: Array.isArray(data.educations) ? data.educations : source.educations || [],
    skills: Array.isArray(data.skills) ? data.skills : source.skills || [],
    languages: Array.isArray(data.languages) ? data.languages : source.languages || [],
    certificates: Array.isArray(data.certificates) ? data.certificates : source.certificates || [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function toChanges(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        section: String(row.section || "CV").trim(),
        before: String(row.before || "").trim(),
        after: String(row.after || "").trim(),
        reason: String(row.reason || "").trim(),
      };
    })
    .filter((item) => item.after || item.reason)
    .slice(0, 10);
}
