/**
 * LinkedIn Import — scrape LinkedIn profile via Apify & map to CV data
 * POST /linkedin-import
 */
import {
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  reserveQuota,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import { limitText, readJsonBody, ValidationError } from "../_shared/validation.ts";

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY") || "";
const APIFY_ACTOR_ID = "2SyF0bVxmgGr8IVCZ";
const APIFY_BASE = "https://api.apify.com/v2";

// Kuota import LinkedIn per bulan (setiap import menjalankan Apify berbayar)
const LINKEDIN_IMPORT_LIMITS: Record<string, number> = {
  free: 2,
  starter: 10,
  pro: 30,
  pro_plus: 30,
};

/** Error setelah Apify run dimulai (biaya sudah terjadi → kuota tidak dikembalikan). */
class ApifyRunError extends Error {}

/**
 * Validasi ketat URL profil LinkedIn & kembalikan URL kanonik.
 * Hanya https://(www.|xx.)linkedin.com/in/<slug>.
 */
function normalizeLinkedInUrl(value: string): string {
  let input = value.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) input = `https://${input}`;
  input = input.replace(/^http:\/\//i, "https://");

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new ValidationError("URL tidak valid. Gunakan format linkedin.com/in/username");
  }

  const host = url.hostname.toLowerCase();
  const hostOk = host === "linkedin.com" || /^[a-z0-9-]+\.linkedin\.com$/.test(host);
  if (url.protocol !== "https:" || !hostOk || url.port || url.username || url.password) {
    throw new ValidationError("URL tidak valid. Gunakan format linkedin.com/in/username");
  }

  const match = url.pathname.match(/^\/in\/([A-Za-z0-9\-_%.]{3,100})\/?$/);
  if (!match) {
    throw new ValidationError("URL tidak valid. Gunakan format linkedin.com/in/username");
  }
  return `https://www.linkedin.com/in/${match[1]}/`;
}

async function getTierSlug(admin: ReturnType<typeof getAdminClient>, userId: string) {
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("subscription_tiers!inner(slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return (
    (sub as { subscription_tiers?: { slug?: string } } | null)?.subscription_tiers?.slug || "free"
  );
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mei",
  "06": "Jun",
  "07": "Jul",
  "08": "Agu",
  "09": "Sep",
  "10": "Okt",
  "11": "Nov",
  "12": "Des",
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

// Data Apify tidak bertipe; akses properti longgar.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

function mapProfileToCvData(profile: Record<string, unknown>) {
  const p = (key: string, fallback?: string) =>
    (profile[key] ?? (fallback ? profile[fallback] : undefined)) as string | undefined;
  const a = (key: string, fallback?: string) =>
    ((profile[key] ?? (fallback ? profile[fallback] : undefined)) as unknown[]) || [];

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

  const experiences = a("experiences", "experience").map((e: Loose, i: number) => ({
    id: `import-${i}`,
    company: e.companyName || e.company || "",
    position: e.title || e.position || "",
    startDate: formatDate(e.jobStartedOn || e.startDate || e.startedOn),
    endDate:
      e.jobStillWorking || e.current ? "" : formatDate(e.jobEndedOn || e.endDate || e.endedOn),
    current: !!(e.jobStillWorking || e.current),
    location: e.jobLocation || e.location || "",
    description: e.jobDescription || e.description || "",
  }));

  const educations = a("educations", "education").map((e: Loose, i: number) => {
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

  const skills = a("skills", "skill").map((s: Loose, i: number) => ({
    id: `import-skill-${i}`,
    name: s.title || s.name || "",
  }));

  const certificates = a("licenseAndCertificates", "certificates").map((c: Loose, i: number) => ({
    id: `import-cert-${i}`,
    name: c.title || c.name || "",
    issuer: c.subtitle || c.issuer || "",
    date: (c.issued || c.date || "").replace("Issued ", ""),
  }));

  const languages = a("languages", "language").map((l: Loose, i: number) => ({
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
    const errText = await runRes.text().catch(() => "");
    console.error("Apify run start error:", runRes.status, errText);
    throw new Error("Gagal memulai import LinkedIn. Silakan coba lagi nanti.");
  }

  const runJson = await runRes.json();
  const run = runJson.data ?? runJson;
  const runId = run.id;
  const datasetId = run.defaultDatasetId;

  if (!runId) {
    console.error("Apify run response without id:", JSON.stringify(runJson).slice(0, 500));
    throw new Error("Gagal memulai import LinkedIn. Silakan coba lagi nanti.");
  }

  try {
    return await pollApifyRun(runId, datasetId);
  } catch (e) {
    // Run sudah berjalan (biaya Apify sudah terjadi) → tandai agar kuota tidak di-release
    // Hanya pesan yang kita buat sendiri (Error biasa) yang diteruskan ke user.
    const isOwnMessage = e instanceof Error && e.constructor === Error;
    if (!isOwnMessage) console.error("Apify polling error:", e);
    throw new ApifyRunError(
      isOwnMessage ? e.message : "Import LinkedIn gagal. Silakan coba lagi nanti.",
    );
  }
}

async function pollApifyRun(
  runId: string,
  datasetId: string | undefined,
): Promise<Record<string, unknown>> {
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
      console.error("Apify run ended with status:", status);
      throw new Error("Import LinkedIn gagal. Profil mungkin private atau tidak ditemukan.");
    }
  }

  if (!succeeded) {
    throw new Error(
      "Scraping LinkedIn timeout. Profil mungkin private atau terlalu lama diproses. Coba lagi nanti.",
    );
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

  const items = (await datasetRes.json()) as unknown[];
  if (!items || !items.length) throw new Error("Profil LinkedIn tidak ditemukan atau kosong.");

  // Debug: log raw dataset structure
  console.log("Apify dataset items count:", items.length);
  console.log(
    "Apify first item keys:",
    JSON.stringify(Object.keys((items[0] as Record<string, unknown>) ?? {})),
  );

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
    const rl = checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi dalam 1 jam." }),
        corsHeaders(req),
      );
    }

    const body = await readJsonBody(req, 10_000);
    const rawUrl = limitText(body.linkedinUrl, 500, "URL LinkedIn");
    if (!rawUrl.trim()) throw new ValidationError("URL LinkedIn diperlukan.");
    const linkedinUrl = normalizeLinkedInUrl(rawUrl);

    if (!APIFY_API_KEY) throw new Error("APIFY_API_KEY tidak dikonfigurasi.");

    const admin = getAdminClient();
    const tierSlug = await getTierSlug(admin, userId);
    const limit = LINKEDIN_IMPORT_LIMITS[tierSlug] ?? LINKEDIN_IMPORT_LIMITS.free;

    // Reservasi kuota SEBELUM Apify run berbayar dimulai.
    const reservation = await reserveQuota(admin, userId, "linkedin_import", 0, { limit });

    let profile: Record<string, unknown>;
    try {
      profile = await runApifyActor(linkedinUrl);
    } catch (e) {
      // Kembalikan kuota hanya jika run belum sempat dimulai (belum ada biaya).
      if (!(e instanceof ApifyRunError)) await reservation.release();
      // ApifyRunError (subclass) akan disamarkan errorResponse → pakai Error biasa
      throw e instanceof ApifyRunError ? new Error(e.message) : e;
    }
    const cvData = mapProfileToCvData(profile);

    return corsResponse({ data: cvData }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
