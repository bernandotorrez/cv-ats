import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type SearchSource = "linkedin" | "jobstreet" | "glints" | "kalibrr" | "google";

type SearchResult = {
  title: string;
  url: string;
  content: string;
  source: string;
};

type ExtractedJob = {
  title: string;
  company: string;
  location: string;
  type?: string;
  level?: string;
  industry?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  description: string;
  requirements?: string | null;
  qualifications?: string | null;
  source_url?: string | null;
};

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const AI_MODEL = "gemini/gemini-2.5-flash-lite";
const DEFAULT_SOURCES: SearchSource[] = ["linkedin", "jobstreet", "glints", "kalibrr"];
const SOURCE_DOMAINS: Record<SearchSource, string> = {
  linkedin: "linkedin.com/jobs",
  jobstreet: "jobstreet.co.id",
  glints: "glints.com/id/opportunities/jobs",
  kalibrr: "kalibrr.com",
  google: "",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const requesterId = await getUserId(req);
    const admin = getAdminClient();
    const { data: requesterRole, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;
    if (!requesterRole) return json(req, { error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const query = cleanText(body.query, 80);
    const location = cleanText(body.location || "Indonesia", 60);
    const limit = clampNumber(Number(body.limit || 8), 1, 20);
    const sources = normalizeSources(body.sources);

    if (!query || query.length < 2) {
      return json(req, { error: "Posisi atau keyword lowongan wajib diisi." }, 400);
    }

    const searchResults = await collectSearchResults(query, location, sources, limit);
    if (searchResults.length === 0) {
      return json(
        req,
        {
          error:
            "Search provider belum dikonfigurasi. Tambahkan TAVILY_API_KEY, SERPAPI_API_KEY, atau BRAVE_SEARCH_API_KEY di Supabase secrets.",
        },
        400,
      );
    }

    const extractedJobs = await extractJobsWithAi(query, location, searchResults, limit);
    const rows = extractedJobs.map((job) => toJobRow(job, query, location)).filter(Boolean);

    if (rows.length === 0) {
      return json(req, {
        inserted: 0,
        skipped: 0,
        jobs: [],
        message: "AI tidak menemukan lowongan yang cukup valid dari hasil pencarian.",
      });
    }

    const { data, error } = await admin
      .from("job_listings")
      .upsert(rows, { onConflict: "slug" })
      .select("id, slug, title, company, location, source_url");

    if (error) throw error;

    return json(req, {
      inserted: data?.length || 0,
      skipped: Math.max(extractedJobs.length - (data?.length || 0), 0),
      jobs: data || [],
      searched: searchResults.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("admin-job-search error:", message);
    return json(req, { error: message }, message.startsWith("Unauthorized") ? 401 : 500);
  }
});

async function collectSearchResults(
  query: string,
  location: string,
  sources: SearchSource[],
  limit: number,
) {
  const perSource = Math.max(2, Math.ceil(limit / sources.length));
  const batches = await Promise.all(
    sources.map((source) =>
      searchWeb(buildSourceQuery(query, location, source), source, perSource),
    ),
  );

  const seen = new Set<string>();
  return batches
    .flat()
    .filter((result) => {
      if (!result.url || seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    })
    .slice(0, Math.max(limit * 2, 8));
}

async function searchWeb(searchQuery: string, source: SearchSource, limit: number) {
  const tavilyKey = Deno.env.get("TAVILY_API_KEY");
  if (tavilyKey) {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        max_results: limit,
        search_depth: "basic",
        include_answer: false,
      }),
    });
    if (!res.ok) throw new Error("Tavily search gagal.");
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      title: String(item.title || ""),
      url: String(item.url || ""),
      content: String(item.content || ""),
      source,
    })) as SearchResult[];
  }

  const serpKey = Deno.env.get("SERPAPI_API_KEY");
  if (serpKey) {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("api_key", serpKey);
    url.searchParams.set("num", String(limit));
    const res = await fetch(url);
    if (!res.ok) throw new Error("SerpAPI search gagal.");
    const data = await res.json();
    return (data.organic_results || []).slice(0, limit).map((item: any) => ({
      title: String(item.title || ""),
      url: String(item.link || ""),
      content: String(item.snippet || ""),
      source,
    })) as SearchResult[];
  }

  const braveKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
  if (braveKey) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("count", String(limit));
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": braveKey,
      },
    });
    if (!res.ok) throw new Error("Brave Search gagal.");
    const data = await res.json();
    return (data.web?.results || []).slice(0, limit).map((item: any) => ({
      title: String(item.title || ""),
      url: String(item.url || ""),
      content: String(item.description || ""),
      source,
    })) as SearchResult[];
  }

  return [];
}

async function extractJobsWithAi(
  query: string,
  location: string,
  results: SearchResult[],
  limit: number,
) {
  const aiKey = Deno.env.get("AI_API_KEY");
  if (!aiKey) throw new Error("AI_API_KEY tidak dikonfigurasi.");

  const prompt = [
    "Ekstrak lowongan pekerjaan Indonesia dari hasil search berikut.",
    'Kembalikan JSON valid saja dengan format: {"jobs":[...]}',
    "Setiap job wajib punya title, company, location, description, source_url.",
    "Jangan mengarang perusahaan atau posisi yang tidak didukung hasil search.",
    "Jika hasil hanya halaman search umum dan bukan listing, abaikan.",
    "Gunakan type salah satu: full-time, part-time, contract, internship.",
    "Gunakan level salah satu: entry, mid, senior, manager, director.",
    `Keyword: ${query}`,
    `Lokasi: ${location}`,
    `Maksimal job: ${limit}`,
    "",
    JSON.stringify(results.slice(0, limit * 2), null, 2),
  ].join("\n");

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah parser lowongan kerja. Output harus JSON valid, ringkas, faktual, tanpa markdown.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("AI job extraction error:", text);
    throw new Error("AI extraction gagal.");
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = parseJsonObject(content);
  return Array.isArray(parsed.jobs) ? (parsed.jobs as ExtractedJob[]).slice(0, limit) : [];
}

function toJobRow(job: ExtractedJob, fallbackQuery: string, fallbackLocation: string) {
  const title = cleanText(job.title || fallbackQuery, 120);
  const company = cleanText(job.company || "", 120);
  const location = cleanText(job.location || fallbackLocation, 120);
  const description = cleanText(job.description || "", 1200);

  if (!title || !company || !location || description.length < 24) return null;

  return {
    slug: buildSlug(title, company, location),
    title,
    company,
    location,
    type: normalizeType(job.type),
    level: normalizeLevel(job.level),
    industry: cleanText(job.industry || "", 80) || null,
    salary_min: normalizeSalary(job.salary_min),
    salary_max: normalizeSalary(job.salary_max),
    description,
    requirements: cleanText(job.requirements || "", 1200) || null,
    qualifications: cleanText(job.qualifications || "", 1200) || null,
    source_url: cleanUrl(job.source_url),
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

function buildSourceQuery(query: string, location: string, source: SearchSource) {
  const domain = SOURCE_DOMAINS[source];
  const base = `${query} ${location} lowongan kerja`;
  return domain ? `${base} site:${domain}` : base;
}

function normalizeSources(value: unknown): SearchSource[] {
  if (!Array.isArray(value)) return DEFAULT_SOURCES;
  const allowed = new Set<SearchSource>(["linkedin", "jobstreet", "glints", "kalibrr", "google"]);
  const sources = value.filter((item): item is SearchSource => allowed.has(item as SearchSource));
  return sources.length > 0 ? sources : DEFAULT_SOURCES;
}

function normalizeType(value?: string) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("part")) return "part-time";
  if (clean.includes("contract") || clean.includes("kontrak")) return "contract";
  if (clean.includes("intern") || clean.includes("magang")) return "internship";
  return "full-time";
}

function normalizeLevel(value?: string) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("director")) return "director";
  if (clean.includes("manager") || clean.includes("lead")) return "manager";
  if (clean.includes("senior")) return "senior";
  if (clean.includes("fresh") || clean.includes("entry") || clean.includes("junior"))
    return "entry";
  return "mid";
}

function normalizeSalary(value?: number | null) {
  if (!Number.isFinite(Number(value))) return null;
  const salary = Math.round(Number(value));
  return salary > 0 ? salary : null;
}

function cleanUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function buildSlug(...parts: string[]) {
  const base = parts
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const hash = hashString(parts.join("|")).toString(36).slice(0, 8);
  return `${base || "lowongan"}-${hash}`;
}

function hashString(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return hash >>> 0;
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
