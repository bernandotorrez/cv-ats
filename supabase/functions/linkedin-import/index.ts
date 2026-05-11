/**
 * LinkedIn Import — scrape LinkedIn profile via Apify & map to CV data
 * POST /linkedin-import
 */
import { corsResponse, errorResponse, getUserId } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY") || "";
const APIFY_ACTOR_ID = "2SyF0bVxmgGr8IVCZ";
const APIFY_BASE = "https://api.apify.com/v2";

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "Mei", "06": "Jun", "07": "Jul", "08": "Agu",
  "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
};

function formatDate(ym: string | null | undefined): string {
  if (!ym) return "";
  const parts = ym.split("-");
  if (parts.length === 2) {
    const month = MONTH_NAMES[parts[0]] || parts[0];
    return `${month} ${parts[1]}`;
  }
  return ym;
}

function mapProfileToCvData(profile: Record<string, unknown>) {
  const p = (key: string, fallback?: string) => (profile[key] ?? (fallback ? profile[fallback] : undefined)) as string | undefined;
  const a = (key: string, fallback?: string) => ((profile[key] ?? (fallback ? profile[fallback] : undefined)) as unknown[]) || [];

  const personal: Record<string, string> = {};
  const name = p("fullName", "name") || p("firstName") + " " + p("lastName") || "";
  if (name.trim()) personal.fullName = name.trim();
  if (p("headline", "title")) personal.headline = p("headline", "title")!;
  if (p("email")) personal.email = p("email")!;
  if (p("mobileNumber", "phone")) personal.phone = p("mobileNumber", "phone")!;
  if (p("addressWithCountry", "location")) personal.location = p("addressWithCountry", "location")!;
  else if (p("addressWithoutCountry")) personal.location = p("addressWithoutCountry")!;
  if (p("linkedinUrl", "url")) personal.linkedin = p("linkedinUrl", "url")!;
  if (p("about", "summary")) personal.summary = p("about", "summary")!;

  const experiences = a("experiences", "experience").map((e: any, i: number) => ({
    id: `import-${i}`,
    company: e.companyName || e.company || "",
    position: e.title || e.position || "",
    startDate: formatDate(e.jobStartedOn || e.startDate || e.startedOn),
    endDate: e.jobStillWorking || e.current ? "" : formatDate(e.jobEndedOn || e.endDate || e.endedOn),
    current: !!(e.jobStillWorking || e.current),
    location: e.jobLocation || e.location || "",
    description: e.jobDescription || e.description || "",
  }));

  const educations = a("educations", "education").map((e: any, i: number) => {
    const subtitle = (e.subtitle || e.degree || "") as string;
    const [degree, field] = subtitle.split(",").map((s: string) => s.trim());
    return {
      id: `import-edu-${i}`,
      school: e.title || e.school || e.institution || "",
      degree: degree || subtitle || e.fieldOfStudy || "",
      field: field || e.fieldOfStudy || "",
      startDate: formatDate(e.period?.startedOn || e.startDate || e.startedOn),
      endDate: formatDate(e.period?.endedOn || e.endDate || e.endedOn),
      description: e.description || "",
    };
  });

  const skills = a("skills", "skill").map((s: any, i: number) => ({
    id: `import-skill-${i}`,
    name: s.title || s.name || "",
  }));

  const certificates = a("licenseAndCertificates", "certificates").map((c: any, i: number) => ({
    id: `import-cert-${i}`,
    name: c.title || c.name || "",
    issuer: c.subtitle || c.issuer || "",
    date: (c.issued || c.date || "").replace("Issued ", ""),
  }));

  const languages = a("languages", "language").map((l: any, i: number) => ({
    id: `import-lang-${i}`,
    name: l.name || l.title || l.language || "",
    level: l.proficiency || l.level || "Intermediate",
  }));

  return { personal, experiences, educations, skills, certificates, languages };
}

async function runApifyActor(linkedinUrl: string): Promise<Record<string, unknown>> {
  if (!APIFY_API_KEY) throw new Error("APIFY_API_KEY tidak dikonfigurasi.");

  // Step 1: Start actor run
  const runRes = await fetch(`${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APIFY_API_KEY}`,
    },
    body: JSON.stringify({
      profileUrls: [linkedinUrl],
      proxyConfiguration: { useApifyProxy: true },
      scrapeSkills: true,
      scrapeCertifications: true,
      scrapeLanguages: true,
      maxDelay: 5,
      minDelay: 2,
    }),
  });

  if (!runRes.ok) {
    const errText = await runRes.text();
    throw new Error(`Gagal memulai Apify run: ${runRes.status} ${errText}`);
  }

  const runJson = await runRes.json();
  const run = runJson.data ?? runJson;
  const runId = run.id;
  const datasetId = run.defaultDatasetId;

  if (!runId) throw new Error("Gagal mendapatkan run ID dari Apify.");

  // Step 2: Poll until finished (max 90 seconds)
  let succeeded = false;
  const maxAttempts = 45;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(`${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/${runId}`, {
      headers: { Authorization: `Bearer ${APIFY_API_KEY}` },
    });

    if (!statusRes.ok) continue;

    const statusJson = await statusRes.json();
    const statusData = statusJson.data ?? statusJson;
    const status = statusData.status;

    if (status === "SUCCEEDED") {
      succeeded = true;
      break;
    }
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Scraping LinkedIn gagal (status: ${status}). Coba lagi nanti.`);
    }
  }

  if (!succeeded) {
    throw new Error("Scraping LinkedIn timeout. Profil mungkin private atau terlalu lama diproses. Coba lagi nanti.");
  }

  // Step 3: Fetch dataset items using defaultDatasetId if available
  const itemsUrl = datasetId
    ? `${APIFY_BASE}/datasets/${datasetId}/items`
    : `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/${runId}/dataset/items`;

  const datasetRes = await fetch(itemsUrl, {
    headers: { Authorization: `Bearer ${APIFY_API_KEY}` },
  });

  if (!datasetRes.ok) {
    const errText = await datasetRes.text();
    console.error("Apify dataset fetch error:", datasetRes.status, errText);
    throw new Error("Gagal mengambil hasil scraping.");
  }

  const items = await datasetRes.json() as unknown[];
  if (!items || !items.length) throw new Error("Profil LinkedIn tidak ditemukan atau kosong.");

  // Debug: log raw dataset structure
  console.log("Apify dataset items count:", items.length);
  console.log("Apify first item keys:", JSON.stringify(Object.keys(items[0] as Record<string, unknown> ?? {})));

  // Apify actors sometimes wrap profile data under "profile", "result", or first array item
  let profile = items[0] as Record<string, unknown>;
  
  // Unwrap nested structures
  if (profile.profile && typeof profile.profile === "object") {
    profile = profile.profile as Record<string, unknown>;
  } else if (profile.result && typeof profile.result === "object") {
    profile = profile.result as Record<string, unknown>;
  }

  // If first item looks like metadata (has no personal fields), try finding the real profile
  const PROFILE_KEYS = ["fullName", "headline", "experiences", "educations", "skills"];
  const hasProfileData = PROFILE_KEYS.some((k) => k in profile);
  
  if (!hasProfileData && items.length > 1) {
    for (const item of items) {
      const candidate = item as Record<string, unknown>;
      if (PROFILE_KEYS.some((k) => k in candidate)) {
        profile = candidate;
        break;
      }
      // Also check nested
      if (candidate.profile && typeof candidate.profile === "object") {
        const nested = candidate.profile as Record<string, unknown>;
        if (PROFILE_KEYS.some((k) => k in nested)) {
          profile = nested;
          break;
        }
      }
    }
  }

  console.log("Final profile keys:", JSON.stringify(Object.keys(profile)));

  return profile;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);

    const rateLimitKey = `linkedin-import:${userId}`;
    if (!checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000)) {
      throw new Error("Terlalu banyak request. Silakan coba lagi dalam 1 jam.");
    }

    const { linkedinUrl } = await req.json();
    if (!linkedinUrl?.trim()) throw new Error("URL LinkedIn diperlukan.");

    if (!linkedinUrl.includes("linkedin.com/in/")) {
      throw new Error("URL tidak valid. Gunakan format linkedin.com/in/username");
    }

    const profile = await runApifyActor(linkedinUrl.trim());
    const cvData = mapProfileToCvData(profile);

    return corsResponse({ data: cvData }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
