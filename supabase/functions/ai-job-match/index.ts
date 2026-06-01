/**
 * AI Job Match — cocokkan CV user dengan detail lowongan.
 * POST /ai-job-match
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
  data: unknown;
  user_id: string;
};

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string | null;
  level: string | null;
  industry: string | null;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  qualifications: string | null;
  benefits: string | null;
  tech_stack: string | null;
  work_mode: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const { cvId, jobId, jobDescription, jobUrl, jobTitle, companyName, language } =
      await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!cvId) throw new Error("cvId diperlukan.");
    if (!jobId && !jobDescription && !jobUrl) {
      throw new Error("Pilih lowongan, isi job description, atau masukkan URL lowongan.");
    }

    const { data: cv, error: cvError } = await admin
      .from("cvs")
      .select("id, title, data, user_id")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (cvError || !cv) throw new Error("CV tidak ditemukan atau bukan milik user.");

    const cvRow = cv as CvRow;
    const jobContext = await resolveJobContext(admin, {
      jobId,
      jobDescription,
      jobUrl,
      jobTitle,
      companyName,
    });
    const cvText = JSON.stringify(cvRow.data, null, 2);

    const prompt = `Kamu adalah career coach dan recruiter ATS specialist.
Analisis kecocokan CV user terhadap lowongan kerja berikut ${getLanguageInstruction(lang)}.

Jangan mengarang isi lowongan. Gunakan hanya data lowongan dan CV yang diberikan.
Jika detail lowongan kurang lengkap, jelaskan sebagai gap/ketidakpastian.

LOWONGAN:
${jobContext}

CV TITLE:
${cvRow.title}

DATA CV:
${cvText}

Output HARUS JSON valid saja tanpa markdown:
{
  "match_score": number (0-100),
  "verdict": "strong" | "good" | "medium" | "low",
  "summary": string (2-3 kalimat),
  "matched_keywords": string[] (5-10 keyword/skill yang ada di CV dan relevan dengan lowongan),
  "missing_keywords": string[] (5-10 keyword/skill dari lowongan yang belum kuat/kurang terlihat di CV),
  "strengths": string[] (3-5 alasan CV cocok),
  "gaps": string[] (3-5 gap utama),
  "recommendations": string[] (5-7 langkah perbaikan actionable),
  "cv_changes": [
    {
      "section": string,
      "current_issue": string,
      "suggested_change": string,
      "impact": string
    }
  ]
}`;

    const raw = await aiComplete(
      [{ role: "user", content: prompt }],
      { temperature: 0.25, maxTokens: 3500, jsonMode: true },
      lang,
    );

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Gagal parse hasil job match.");
      parsed = JSON.parse(match[0]);
    }

    await checkAndTrackQuota(admin, userId, "job_match", 700);

    return corsResponse(
      {
        matchScore: clampScore(parsed.match_score),
        verdict: normalizeVerdict(parsed.verdict),
        summary: String(parsed.summary || ""),
        matchedKeywords: toStringArray(parsed.matched_keywords),
        missingKeywords: toStringArray(parsed.missing_keywords),
        strengths: toStringArray(parsed.strengths),
        gaps: toStringArray(parsed.gaps),
        recommendations: toStringArray(parsed.recommendations),
        cvChanges: toCvChanges(parsed.cv_changes),
      },
      200,
      req,
    );
  } catch (e) {
    return errorResponse(e, req);
  }
});

async function resolveJobContext(
  admin: ReturnType<typeof getAdminClient>,
  input: {
    jobId?: string;
    jobDescription?: string;
    jobUrl?: string;
    jobTitle?: string;
    companyName?: string;
  },
) {
  if (input.jobId) {
    const { data: job, error: jobError } = await admin
      .from("job_listings")
      .select(
        "id, title, company, location, type, level, industry, description, responsibilities, requirements, qualifications, benefits, tech_stack, work_mode",
      )
      .eq("id", input.jobId)
      .eq("is_active", true)
      .single();

    if (jobError || !job) throw new Error("Lowongan tidak ditemukan atau tidak aktif.");
    return buildJobContext(job as JobRow);
  }

  if (input.jobUrl) {
    const fetched = await fetchJobUrlText(input.jobUrl);
    return [
      `Sumber: URL lowongan`,
      `URL: ${input.jobUrl}`,
      input.jobTitle ? `Posisi: ${input.jobTitle}` : "",
      input.companyName ? `Perusahaan: ${input.companyName}` : "",
      section("Konten lowongan dari URL", fetched),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    `Sumber: Job description manual`,
    input.jobTitle ? `Posisi: ${input.jobTitle}` : "",
    input.companyName ? `Perusahaan: ${input.companyName}` : "",
    section("Job description", input.jobDescription),
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function fetchJobUrlText(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("URL lowongan tidak valid.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URL lowongan harus http atau https.");
  }

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CVPintarJobMatch/1.0; +https://www.cvpintar.web.id)",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil detail lowongan dari URL. Coba paste job description manual.");
  }

  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 300) {
    throw new Error("Konten URL terlalu sedikit. Coba paste job description manual.");
  }

  return text.slice(0, 12000);
}

function buildJobContext(job: JobRow) {
  return [
    `Posisi: ${job.title}`,
    `Perusahaan: ${job.company}`,
    `Lokasi: ${job.location}`,
    `Tipe: ${job.type || "Tidak dicantumkan"}`,
    `Level: ${job.level || "Tidak dicantumkan"}`,
    `Industri: ${job.industry || "Tidak dicantumkan"}`,
    `Mode kerja: ${job.work_mode || "Tidak dicantumkan"}`,
    section("Deskripsi", job.description),
    section("Responsibilities", job.responsibilities),
    section("Requirements", job.requirements),
    section("Qualifications", job.qualifications),
    section("Benefits", job.benefits),
    section("Tech stack", job.tech_stack),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function section(label: string, value?: string | null) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return `${label}:\n${clean}`;
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeVerdict(value: unknown) {
  const verdict = String(value || "").toLowerCase();
  if (["strong", "good", "medium", "low"].includes(verdict)) return verdict;
  return "medium";
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];
}

function toCvChanges(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        section: String(row.section || "CV").trim(),
        currentIssue: String(row.current_issue || row.currentIssue || "").trim(),
        suggestedChange: String(row.suggested_change || row.suggestedChange || "").trim(),
        impact: String(row.impact || "").trim(),
      };
    })
    .filter((item) => item.suggestedChange)
    .slice(0, 6);
}
