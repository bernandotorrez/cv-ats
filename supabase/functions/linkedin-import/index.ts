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
  const personal: Record<string, string> = {};
  if (profile.fullName) personal.fullName = profile.fullName as string;
  if (profile.headline) personal.headline = profile.headline as string;
  if (profile.email) personal.email = profile.email as string;
  if (profile.mobileNumber) personal.phone = profile.mobileNumber as string;
  if (profile.addressWithCountry) personal.location = profile.addressWithCountry as string;
  else if (profile.addressWithoutCountry) personal.location = profile.addressWithoutCountry as string;
  if (profile.linkedinUrl) personal.linkedin = profile.linkedinUrl as string;
  if (profile.about) personal.summary = profile.about as string;

  const experiences = ((profile.experiences as unknown[]) || []).map((e: any, i: number) => ({
    id: `import-${i}`,
    company: e.companyName || "",
    position: e.title || "",
    startDate: formatDate(e.jobStartedOn),
    endDate: e.jobStillWorking ? "" : formatDate(e.jobEndedOn),
    current: !!e.jobStillWorking,
    location: e.jobLocation || "",
    description: e.jobDescription || "",
  }));

  const educations = ((profile.educations as unknown[]) || []).map((e: any, i: number) => {
    const subtitle = (e.subtitle || "") as string;
    const [degree, field] = subtitle.split(",").map((s: string) => s.trim());
    return {
      id: `import-edu-${i}`,
      school: e.title || "",
      degree: degree || subtitle || "",
      field: field || "",
      startDate: formatDate(e.period?.startedOn),
      endDate: formatDate(e.period?.endedOn),
      description: e.description || "",
    };
  });

  const skills = ((profile.skills as unknown[]) || []).map((s: any, i: number) => ({
    id: `import-skill-${i}`,
    name: s.title || "",
  }));

  const certificates = ((profile.licenseAndCertificates as unknown[]) || []).map((c: any, i: number) => ({
    id: `import-cert-${i}`,
    name: c.title || "",
    issuer: c.subtitle || "",
    date: (c.issued || "").replace("Issued ", ""),
  }));

  const languages = ((profile.languages as unknown[]) || []).map((l: any, i: number) => ({
    id: `import-lang-${i}`,
    name: l.name || l.title || "",
    level: l.proficiency || "Intermediate",
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
      linkedInUrls: [linkedinUrl],
      maxDelay: 5,
      minDelay: 2,
    }),
  });

  if (!runRes.ok) {
    const errText = await runRes.text();
    throw new Error(`Gagal memulai Apify run: ${runRes.status} ${errText}`);
  }

  const runData = (await runRes.json()) as { data: { id: string } };
  const runId = runData.data.id;

  // Step 2: Poll until finished (max 60 seconds)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(`${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/${runId}`, {
      headers: { Authorization: `Bearer ${APIFY_API_KEY}` },
    });

    if (!statusRes.ok) continue;

    const statusData = (await statusRes.json()) as { data: { status: string } };
    const status = statusData.data.status;

    if (status === "SUCCEEDED") break;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Scraping LinkedIn gagal (status: ${status}). Coba lagi nanti.`);
    }
  }

  // Step 3: Fetch dataset items
  const datasetRes = await fetch(
    `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/${runId}/dataset/items`,
    { headers: { Authorization: `Bearer ${APIFY_API_KEY}` } },
  );

  if (!datasetRes.ok) throw new Error("Gagal mengambil hasil scraping.");

  const items = (await datasetRes.json()) as unknown[];
  if (!items.length) throw new Error("Profil LinkedIn tidak ditemukan atau kosong.");

  return items[0] as Record<string, unknown>;
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
