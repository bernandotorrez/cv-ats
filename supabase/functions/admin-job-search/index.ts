import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type SearchSource = "jobstreet" | "glints" | "kalibrr" | "dealls" | "google";

type SearchResult = {
  title: string;
  url: string;
  content: string;
  source: string;
  original_content?: string;
  original_content_source?: "tavily_extract" | "direct_fetch";
};

type TavilySearchResponse = {
  results?: Array<{
    title?: unknown;
    url?: unknown;
    content?: unknown;
    raw_content?: unknown;
  }>;
};

type SerpApiSearchResponse = {
  organic_results?: Array<{
    title?: unknown;
    link?: unknown;
    snippet?: unknown;
  }>;
};

type BraveSearchResponse = {
  web?: {
    results?: Array<{
      title?: unknown;
      url?: unknown;
      description?: unknown;
    }>;
  };
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
  salary_currency?: string | null;
  salary_period?: string | null;
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  qualifications?: string | null;
  benefits?: string | null;
  tech_stack?: string | null;
  work_mode?: string | null;
  deadline?: string | null;
  source_url?: string | null;
};

type SalaryRange = {
  min: number | null;
  max: number | null;
  currency: string | null;
  period: string | null;
};

type JobParseResult = {
  jobs: ExtractedJob[];
  recovered: boolean;
};

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const AI_MODEL = "gemini/gemini-2.5-flash-lite";
const DEFAULT_SOURCES: SearchSource[] = ["jobstreet", "glints", "kalibrr", "dealls", "google"];
const RICH_AI_SOURCE_LIMIT = 6;
const RICH_AI_CONTENT_CHARS = 3500;
const SNIPPET_AI_CONTENT_CHARS = 1200;

// ---------------------------------------------------------------------------
// LOGGER
// ---------------------------------------------------------------------------

type LogLevel = "info" | "warn" | "error" | "debug";

function createLogger(requestId: string, query: string) {
  const start = Date.now();

  function log(level: LogLevel, step: string, data?: Record<string, unknown>) {
    const elapsed = Date.now() - start;
    const entry = {
      ts: new Date().toISOString(),
      req: requestId,
      elapsed_ms: elapsed,
      level,
      step,
      query,
      ...data,
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  return {
    info: (step: string, data?: Record<string, unknown>) => log("info", step, data),
    warn: (step: string, data?: Record<string, unknown>) => log("warn", step, data),
    error: (step: string, data?: Record<string, unknown>) => log("error", step, data),
    debug: (step: string, data?: Record<string, unknown>) => log("debug", step, data),
    elapsed: () => Date.now() - start,
  };
}

type Logger = ReturnType<typeof createLogger>;

// ---------------------------------------------------------------------------
// SOURCE DOMAINS & QUERY CONFIG
//
// LinkedIn sengaja tidak dipakai karena sering mengembalikan halaman login/consent,
// bukan detail lowongan yang bisa dicrawl stabil.
// ---------------------------------------------------------------------------

const SOURCE_DOMAINS: Record<SearchSource, string[]> = {
  jobstreet: ["jobstreet.co.id", "jobstreet.com"],
  glints: ["glints.com"],
  kalibrr: ["kalibrr.com"],
  dealls: ["dealls.com"],
  google: [],
};

const SOURCE_QUERY_SUFFIXES: Record<SearchSource, string> = {
  jobstreet: "loker terbaru",
  glints: "lowongan kerja",
  kalibrr: "job vacancy",
  dealls: "lowongan kerja",
  google: "lowongan kerja Indonesia terbaru",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  let log = createLogger(requestId, "-");

  try {
    const admin = getAdminClient();
    const isCronRequest = await isValidCronRequest(req, admin);

    if (!isCronRequest) {
      const requesterId = await getUserId(req);
      const { data: requesterRole, error: roleError } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", requesterId)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) throw roleError;
      if (!requesterRole) {
        log.warn("auth_forbidden", { user_id: requesterId });
        return json(req, { error: "Forbidden" }, 403);
      }
      log.info("auth_ok", { via: "admin_role", user_id: requesterId });
    } else {
      log.info("auth_ok", { via: "cron_secret" });
    }

    const body = await req.json().catch(() => ({}));
    const query = cleanText(body.query, 80);
    const location = cleanText(body.location || "Indonesia", 60);
    const limit = clampNumber(Number(body.limit || 12), 1, 50);
    const sources = normalizeSources(body.sources);

    log = createLogger(requestId, query);
    log.info("request_start", { query, location, limit, sources });

    if (!query || query.length < 2) {
      log.warn("validation_failed", { reason: "query too short" });
      return json(req, { error: "Posisi atau keyword lowongan wajib diisi." }, 400);
    }

    // ── STEP 1: Search ──────────────────────────────────────────────────────
    log.info("search_start", { sources, limit });
    const searchResults = await collectSearchResults(query, location, sources, limit, log);

    if (searchResults.length === 0) {
      log.error("search_empty", { reason: "no search provider configured or no results" });
      return json(
        req,
        {
          error:
            "Tidak ada hasil pencarian. Pastikan TAVILY_API_KEY, SERPAPI_API_KEY, atau BRAVE_SEARCH_API_KEY sudah dikonfigurasi di Supabase secrets.",
        },
        400,
      );
    }
    log.info("search_done", { total_results: searchResults.length });

    // ── STEP 2: Enrich ──────────────────────────────────────────────────────
    log.info("enrich_start", {
      urls_to_fetch: Math.min(searchResults.length, Math.max(limit * 2, 20)),
    });
    const enrichedResults = await enrichSearchResults(searchResults, limit, log);
    const enrichedCount = enrichedResults.filter((r) => r.original_content).length;
    log.info("enrich_done", {
      enriched: enrichedCount,
      snippet_only: enrichedResults.length - enrichedCount,
    });

    // ── STEP 3: AI Extraction ───────────────────────────────────────────────
    log.info("ai_extract_start", { input_results: enrichedResults.length, limit });
    const extractedJobs = await extractJobsWithAi(query, location, enrichedResults, limit, log);
    log.info("ai_extract_done", { jobs_extracted: extractedJobs.length });

    // ── STEP 4: Build rows & filter ─────────────────────────────────────────
    const rows = extractedJobs
      .map((job) => toJobRow(job, query, location, enrichedResults))
      .filter(Boolean);
    const invalidCount = extractedJobs.length - rows.length;
    if (invalidCount > 0) {
      log.warn("rows_filtered", { invalid_rows: invalidCount, reason: "missing required fields" });
    }

    if (rows.length === 0) {
      log.warn("no_valid_rows", { extracted: extractedJobs.length });
      return json(req, {
        inserted: 0,
        skipped: 0,
        jobs: [],
        message: "AI tidak menemukan lowongan yang cukup valid dari hasil pencarian.",
      });
    }

    // ── STEP 5: Upsert ke DB ────────────────────────────────────────────────
    log.info("db_upsert_start", { rows: rows.length });
    const { data, error } = await admin
      .from("job_listings")
      .upsert(rows, { onConflict: "slug" })
      .select("id, slug, title, company, location, source_url");

    if (error) {
      log.error("db_upsert_failed", { message: error.message, code: error.code });
      throw error;
    }

    const inserted = data?.length || 0;
    const skipped = Math.max(extractedJobs.length - inserted, 0);
    log.info("request_done", {
      inserted,
      skipped,
      searched: searchResults.length,
      source_pages: enrichedCount,
      total_ms: log.elapsed(),
    });

    return json(req, {
      inserted,
      skipped,
      jobs: data || [],
      searched: searchResults.length,
      source_pages: enrichedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error("unhandled_exception", { message, total_ms: log.elapsed() });
    return json(req, { error: message }, message.startsWith("Unauthorized") ? 401 : 500);
  }
});

// ---------------------------------------------------------------------------
// SEARCH & COLLECTION
// ---------------------------------------------------------------------------

async function collectSearchResults(
  query: string,
  location: string,
  sources: SearchSource[],
  limit: number,
  log: Logger,
) {
  const perSource = Math.max(5, Math.ceil((limit * 2) / sources.length));

  // FIX: Variasi query dibangun lebih hati-hati — hindari kombinasi yang sia-sia.
  // Cukup 2 variasi: lokasi spesifik + Indonesia fallback.
  const queryVariants = buildQueryVariants(query, location);

  log.debug("search_variants", {
    variants: queryVariants.map((v) => `${v.query} @ ${v.location}`),
    per_source: perSource,
  });

  const batches = await Promise.all(
    sources.flatMap((source) =>
      queryVariants.map((variant) => {
        const q = buildSourceQuery(variant.query, variant.location, source);
        return searchWeb(q, source, perSource, log).catch((err) => {
          log.warn("source_search_failed", { source, query: q, error: err.message });
          return [] as SearchResult[];
        });
      }),
    ),
  );

  // FIX: Jika semua source utama gagal total, coba fallback ke Google search tanpa site: filter.
  const allRaw = batches.flat();
  const hasResults = allRaw.length > 0;

  let fallbackResults: SearchResult[] = [];
  if (!hasResults) {
    log.warn("all_sources_empty", { reason: "triggering google fallback search" });
    const fallbackQuery = buildGoogleFallbackQuery(query, location);
    fallbackResults = await searchWeb(fallbackQuery, "google", perSource * 2, log).catch((err) => {
      log.warn("google_fallback_failed", { error: err.message });
      return [];
    });
  }

  const seedResults = buildSourceSeedResults(query, sources);
  const combined = [...seedResults, ...allRaw, ...fallbackResults];

  const seen = new Set<string>();
  const seenTitles = new Set<string>();
  const sourceCounts: Record<string, number> = {};

  const filtered = combined
    .filter((result) => {
      if (!result.url || seen.has(result.url)) return false;
      // Filter URL yang jelas tidak bisa dipakai sebagai sumber lowongan.
      if (isNonJobUrl(result.url)) return false;
      const titleKey = normalizeForDedup(result.title);
      if (titleKey.length > 5 && seenTitles.has(titleKey)) return false;
      seen.add(result.url);
      if (titleKey.length > 5) seenTitles.add(titleKey);
      sourceCounts[result.source] = (sourceCounts[result.source] || 0) + 1;
      return true;
    })
    .slice(0, Math.max(limit * 3, 24));

  log.info("search_collected", {
    raw: combined.length,
    after_dedup: filtered.length,
    by_source: sourceCounts,
  });

  return filtered;
}

function buildSourceSeedResults(query: string, sources: SearchSource[]): SearchResult[] {
  if (!sources.includes("dealls")) return [];
  const params = new URLSearchParams({ searchJob: query });
  return [
    {
      title: `${query} jobs on Dealls`,
      url: `https://dealls.com/?${params.toString()}`,
      content: `Dealls job search results for ${query}`,
      source: "dealls",
    },
  ];
}

/**
 * FIX: Buat query lebih natural dan tidak over-engineered.
 * Variasi: lokasi asli + fallback Indonesia (jika beda).
 */
function buildQueryVariants(query: string, location: string) {
  const variants: { query: string; location: string }[] = [{ query, location }];

  // Tambah fallback ke Indonesia jika lokasi sangat spesifik
  const loc = location.toLowerCase();
  if (loc !== "indonesia" && !loc.includes("indonesia")) {
    variants.push({ query, location: "Indonesia" });
  }

  // Cukup 2 varian maksimal
  return variants.slice(0, 2);
}

/**
 * FIX: Google fallback query — lebih natural, tidak pakai site: filter.
 * Dipakai ketika semua source utama tidak menghasilkan data.
 */
function buildGoogleFallbackQuery(query: string, location: string) {
  return `lowongan kerja "${query}" ${location} terbaru`;
}

/**
 * FIX: Filter URL yang bukan halaman lowongan.
 * LinkedIn diblok total karena crawler sering hanya mendapat halaman login/consent.
 */
function isNonJobUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("linkedin.com")) return true;
    return false;
  } catch {
    return false;
  }
}

async function searchWeb(searchQuery: string, source: SearchSource, limit: number, log: Logger) {
  const tavilyKey = Deno.env.get("TAVILY_API_KEY");
  if (tavilyKey) {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        max_results: limit,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: true,
      }),
    });
    if (!res.ok) throw new Error(`Tavily search gagal: ${res.status}`);
    const data = (await res.json()) as TavilySearchResponse;
    const results = (data.results || []).map((item) => ({
      title: String(item.title || ""),
      url: String(item.url || ""),
      content: String(item.content || ""),
      source,
      original_content: cleanContent(item.raw_content || "", 12000) || undefined,
      original_content_source: item.raw_content ? "tavily_extract" : undefined,
    })) as SearchResult[];
    log.debug("provider_result", {
      provider: "tavily",
      source,
      query: searchQuery,
      count: results.length,
    });
    return results;
  }

  const serpKey = Deno.env.get("SERPAPI_API_KEY");
  if (serpKey) {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("api_key", serpKey);
    url.searchParams.set("num", String(Math.min(limit, 10)));
    url.searchParams.set("hl", "id");
    url.searchParams.set("gl", "id");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SerpAPI search gagal: ${res.status}`);
    const data = (await res.json()) as SerpApiSearchResponse;
    const results = (data.organic_results || []).slice(0, limit).map((item) => ({
      title: String(item.title || ""),
      url: String(item.link || ""),
      content: String(item.snippet || ""),
      source,
    })) as SearchResult[];
    log.debug("provider_result", {
      provider: "serpapi",
      source,
      query: searchQuery,
      count: results.length,
    });
    return results;
  }

  const braveKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
  if (braveKey) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("count", String(Math.min(limit, 20)));
    url.searchParams.set("country", "id");
    url.searchParams.set("search_lang", "id");
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": braveKey,
      },
    });
    if (!res.ok) throw new Error(`Brave Search gagal: ${res.status}`);
    const data = (await res.json()) as BraveSearchResponse;
    const results = (data.web?.results || []).slice(0, limit).map((item) => ({
      title: String(item.title || ""),
      url: String(item.url || ""),
      content: String(item.description || ""),
      source,
    })) as SearchResult[];
    log.debug("provider_result", {
      provider: "brave",
      source,
      query: searchQuery,
      count: results.length,
    });
    return results;
  }

  log.warn("no_search_provider", { source });
  return [];
}

// ---------------------------------------------------------------------------
// QUERY BUILDER
// ---------------------------------------------------------------------------

/**
 * - Jobstreet/Glints/Kalibrr: tetap pakai site: karena mereka crawlable
 * - Google: query natural tanpa site: filter
 */
function buildSourceQuery(query: string, location: string, source: SearchSource) {
  const domains = SOURCE_DOMAINS[source];
  const suffix = SOURCE_QUERY_SUFFIXES[source];

  // Google: query natural tanpa filter
  if (source === "google" || domains.length === 0) {
    return `${query} ${location} ${suffix}`;
  }

  // Jobstreet, Glints, Kalibrr: pakai site: filter karena crawlable
  return `${query} ${location} ${suffix} site:${domains[0]}`;
}

function normalizeSources(value: unknown): SearchSource[] {
  if (!Array.isArray(value)) return DEFAULT_SOURCES;
  const allowed = new Set<SearchSource>(["jobstreet", "glints", "kalibrr", "dealls", "google"]);
  const sources = value.filter((s): s is SearchSource => allowed.has(s as SearchSource));
  return sources.length > 0 ? sources : DEFAULT_SOURCES;
}

// ---------------------------------------------------------------------------
// ENRICHMENT
// ---------------------------------------------------------------------------

async function enrichSearchResults(results: SearchResult[], limit: number, log: Logger) {
  const enrichLimit = Math.min(results.length, Math.max(limit * 2, 20));
  const targets = results.slice(0, enrichLimit);
  const extracted = await extractSourcePages(targets, log);

  return results.map((result) => {
    const page = extracted.get(result.url);
    if (!page) return result;
    const existingContent = result.original_content || "";
    return {
      ...result,
      original_content:
        existingContent.length >= page.content.length ? existingContent : page.content,
      original_content_source:
        existingContent.length >= page.content.length
          ? result.original_content_source
          : page.source,
    };
  });
}

async function extractSourcePages(results: SearchResult[], log: Logger) {
  const validUrls = results.map((r) => r.url).filter(Boolean);
  const pageMap = new Map<string, { content: string; source: "tavily_extract" | "direct_fetch" }>();

  const tavilyKey = Deno.env.get("TAVILY_API_KEY");
  if (tavilyKey && validUrls.length > 0) {
    const batchSize = 20;
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize);
      log.debug("tavily_extract_batch", { batch_index: i / batchSize, urls: batch.length });
      try {
        const res = await fetch("https://api.tavily.com/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tavilyKey}`,
          },
          body: JSON.stringify({
            urls: batch,
            extract_depth: "advanced",
            format: "markdown",
            include_images: false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let extracted = 0;
          for (const item of data.results || []) {
            const url = String(item.url || "");
            const content = cleanContent(item.raw_content || item.content || "", 20000);
            if (url && content.length > 120) {
              pageMap.set(url, { content, source: "tavily_extract" });
              extracted++;
            }
          }
          log.info("tavily_extract_ok", { sent: batch.length, extracted });
        } else {
          const body = await res.text().catch(() => "");
          log.warn("tavily_extract_failed", { status: res.status, body: body.slice(0, 200) });
        }
      } catch (err) {
        log.warn("tavily_extract_error", {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  const missing = results.filter((r) => !pageMap.has(r.url)).slice(0, 12);
  log.debug("direct_fetch_start", { urls: missing.length });

  const directPages = await Promise.allSettled(
    missing.map(async (result) => ({
      url: result.url,
      content: await fetchPageText(result.url, log),
    })),
  );

  let directOk = 0;
  let directFailed = 0;
  for (const settled of directPages) {
    if (settled.status === "fulfilled" && settled.value.content.length > 120) {
      pageMap.set(settled.value.url, { content: settled.value.content, source: "direct_fetch" });
      directOk++;
    } else {
      directFailed++;
    }
  }
  log.info("direct_fetch_done", { ok: directOk, failed: directFailed });

  return pageMap;
}

async function fetchPageText(url: string, log: Logger) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        "User-Agent": "CVPintarJobIndexer/2.0 (+https://cvpintar.web.id)",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      log.debug("direct_fetch_skip", { url, status: res.status });
      return "";
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      log.debug("direct_fetch_skip", {
        url,
        reason: "non-html content-type",
        content_type: contentType,
      });
      return "";
    }

    const html = await res.text();
    const structured = extractStructuredJobPosting(html);
    const text = cleanContent(`${structured}\n\n${stripHtml(html)}`, 16000);
    log.debug("direct_fetch_ok", { url, chars: text.length });
    return text;
  } catch (err) {
    log.debug("direct_fetch_error", {
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    return "";
  }
}

// ---------------------------------------------------------------------------
// AI EXTRACTION
// ---------------------------------------------------------------------------

async function extractJobsWithAi(
  query: string,
  location: string,
  results: SearchResult[],
  limit: number,
  log: Logger,
) {
  const aiKey = Deno.env.get("AI_API_KEY");
  if (!aiKey) throw new Error("AI_API_KEY tidak dikonfigurasi.");

  const richResults = results.filter((r) => r.original_content && r.original_content.length > 300);
  const snippetResults = results.filter(
    (r) => !r.original_content || r.original_content.length <= 300,
  );

  log.info("ai_batch_split", { rich: richResults.length, snippet: snippetResults.length });

  const batchLimit = Math.ceil(limit / 2);
  const batches: ExtractedJob[][] = [];

  if (richResults.length > 0) {
    log.info("ai_batch_start", {
      mode: "rich",
      inputs: Math.min(richResults.length, limit),
      target: batchLimit,
    });
    const batch1 = await extractBatch(
      query,
      location,
      richResults.slice(0, limit),
      batchLimit,
      aiKey,
      "rich",
      log,
    );
    log.info("ai_batch_done", { mode: "rich", jobs: batch1.length });
    batches.push(batch1);
  }

  if (snippetResults.length > 0 && (batches[0]?.length ?? 0) < limit) {
    const remaining = limit - (batches[0]?.length || 0);
    log.info("ai_batch_start", {
      mode: "snippet",
      inputs: Math.min(snippetResults.length, 16),
      target: remaining,
    });
    const batch2 = await extractBatch(
      query,
      location,
      snippetResults.slice(0, 16),
      remaining,
      aiKey,
      "snippet",
      log,
    );
    log.info("ai_batch_done", { mode: "snippet", jobs: batch2.length });
    batches.push(batch2);
  }

  // FIX: Jika sama sekali tidak ada hasil setelah split, coba extraction dengan semua data
  if (batches.every((b) => b.length === 0) && results.length > 0) {
    log.warn("ai_all_batches_empty", { reason: "retrying with combined results" });
    const combined = await extractBatch(
      query,
      location,
      results.slice(0, limit),
      limit,
      aiKey,
      "rich",
      log,
    );
    batches.push(combined);
  }

  const allJobs = batches.flat().map((job) => enhanceJobFromSources(job, results));
  const seen = new Set<string>();
  const deduped = allJobs
    .filter((job) => {
      const key = normalizeForDedup(`${job.title}|${job.company}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  log.info("ai_dedup", { before: allJobs.length, after: deduped.length });
  return deduped;
}

async function extractBatch(
  query: string,
  location: string,
  results: SearchResult[],
  limit: number,
  aiKey: string,
  mode: "rich" | "snippet",
  log: Logger,
  attempt = 1,
) {
  const modeNote =
    mode === "rich"
      ? "Konten halaman lengkap tersedia di field original_content — ekstrak detail sebanyak mungkin."
      : "Gunakan snippet dan judul untuk mengekstrak informasi. Lebih ringkas tapi tetap akurat.";

  const prompt = [
    "Kamu adalah parser lowongan kerja Indonesia yang sangat teliti.",
    `Ekstrak maksimal ${limit} lowongan pekerjaan dari data berikut dan kembalikan JSON valid: {"jobs":[...]}`,
    "Jangan membuat, menebak, atau menambah informasi yang tidak ada di DATA SUMBER.",
    "Output harus ringkas. Jangan menyalin isi halaman penuh.",
    "",
    "=== INSTRUKSI FIELD ===",
    "WAJIB ADA: title, company, location, description",
    "ISI JIKA ADA: type, level, industry, salary_min, salary_max, salary_currency, salary_period,",
    "             responsibilities, requirements, qualifications, benefits, tech_stack, work_mode, deadline",
    "",
    "=== PANDUAN PENGISIAN ===",
    "title         : Nama jabatan yang tepat (misal: 'Senior Frontend Engineer', bukan 'Lowongan IT')",
    "company       : Nama perusahaan lengkap dan benar",
    "location      : Kota/provinsi (misal: 'Jakarta Selatan', 'Bandung', 'Remote')",
    "description   : Ringkasan 1-2 kalimat dari sumber, maksimal 280 karakter.",
    "responsibilities: Hanya tanggung jawab yang eksplisit tertulis di sumber, tiap item dipisah newline (\\n). Null jika tidak ada.",
    "requirements  : Hanya requirement wajib yang eksplisit tertulis di sumber, tiap item dipisah \\n. Null jika tidak ada.",
    "qualifications: Hanya skill/kualifikasi yang eksplisit tertulis di sumber, tiap item dipisah \\n. Null jika tidak ada.",
    "benefits      : Hanya fasilitas/benefit yang eksplisit tertulis di sumber, tiap item dipisah \\n. Null jika tidak ada.",
    "tech_stack    : Hanya tools/teknologi yang eksplisit tertulis di sumber, pisah dengan koma. Null jika tidak ada.",
    "work_mode     : 'onsite' | 'remote' | 'hybrid'",
    "type          : 'full-time' | 'part-time' | 'contract' | 'internship'",
    "level         : 'entry' | 'mid' | 'senior' | 'manager' | 'director'",
    "salary_min    : Angka bulat (IDR), null jika tidak disebutkan",
    "salary_max    : Angka bulat (IDR), null jika tidak disebutkan",
    "salary_currency: 'IDR' | 'USD' | dll, null jika tidak ada",
    "salary_period : 'monthly' | 'yearly' | null",
    "deadline      : Tanggal tutup lamaran format YYYY-MM-DD, null jika tidak ada",
    "source_url    : URL lengkap halaman lowongan",
    "",
    "=== ATURAN KUALITAS ===",
    "- Satu URL = satu lowongan (jangan duplikasi)",
    "- Jangan mengarang deskripsi, tanggung jawab, requirement, benefit, gaji, deadline, company, atau posisi.",
    "- Jika informasi tidak muncul eksplisit di sumber, isi null. Jangan isi dengan asumsi umum untuk role tersebut.",
    "- Boleh merapikan bahasa, tetapi maknanya harus tetap sama dengan sumber asli.",
    "- Jika company tidak jelas, gunakan domain URL sebagai petunjuk",
    "- Jika halaman adalah listing umum (bukan detail 1 lowongan), ekstrak hanya lowongan yang title, company, location, dan URL-nya jelas",
    "- Tulis dalam Bahasa Indonesia yang natural dan profesional tanpa menambahkan fakta baru",
    "- Batasi responsibilities/requirements/qualifications/benefits maksimal 5 item singkat per field",
    `- ${modeNote}`,
    "",
    `Keyword: ${query}`,
    `Target lokasi: ${location}`,
    `Maksimal job: ${limit}`,
    "",
    "=== DATA SUMBER ===",
    JSON.stringify(buildAiSourcePayload(results, mode, limit), null, 2),
  ].join("\n");

  const maxTokens = Math.min(4096, Math.max(1400, limit * 520));

  const t0 = Date.now();
  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.1,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah parser lowongan kerja profesional. Output hanya JSON valid dan ringkas. Jangan gunakan markdown.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("ai_call_failed", { mode, status: res.status, body: text.slice(0, 300) });
    throw new Error("AI extraction gagal.");
  }

  const data = await res.json();
  const usage = data.usage || {};
  const finishReason = data.choices?.[0]?.finish_reason ?? null;
  log.info("ai_call_ok", {
    mode,
    attempt,
    latency_ms: Date.now() - t0,
    prompt_tokens: usage.prompt_tokens ?? null,
    completion_tokens: usage.completion_tokens ?? null,
    total_tokens: usage.total_tokens ?? null,
    finish_reason: finishReason,
  });

  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = parseJobsFromContent(content);
  const jobs = parsed.jobs.slice(0, limit);

  if (finishReason === "length") {
    log.warn("ai_response_truncated", { mode, attempt, recovered_jobs: jobs.length });
  }

  if (parsed.recovered && jobs.length > 0) {
    log.warn("ai_parse_recovered", { mode, attempt, jobs: jobs.length });
  }

  if (jobs.length === 0) {
    log.warn("ai_parse_unexpected", { mode, attempt, content_preview: content.slice(0, 200) });

    if (finishReason === "length" && attempt < 2 && results.length > 1) {
      const retryResults = results.slice(0, Math.max(3, Math.ceil(results.length / 2)));
      const retryLimit = Math.max(1, Math.min(limit, 4));
      log.warn("ai_retry_compact", {
        mode,
        attempt: attempt + 1,
        inputs: retryResults.length,
        target: retryLimit,
      });
      return extractBatch(query, location, retryResults, retryLimit, aiKey, mode, log, attempt + 1);
    }
  }

  return jobs;
}

function buildAiSourcePayload(results: SearchResult[], mode: "rich" | "snippet", limit: number) {
  const sourceLimit =
    mode === "rich"
      ? Math.min(results.length, Math.max(Math.min(limit, RICH_AI_SOURCE_LIMIT), 3))
      : Math.min(results.length, Math.max(limit * 2, 8));
  const contentLimit = mode === "rich" ? RICH_AI_CONTENT_CHARS : SNIPPET_AI_CONTENT_CHARS;

  return results.slice(0, sourceLimit).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content?.slice(0, 320),
    full_content: compactJobSourceText(r.original_content || r.content || "", contentLimit) || null,
  }));
}

function compactJobSourceText(value: unknown, maxLength: number) {
  const source = cleanContent(value, maxLength * 3);
  if (!source) return "";

  const importantPattern =
    /title:|company:|description:|employment type|qualifications|responsibilities|skills|salary|valid through|requirement|persyaratan|kualifikasi|tanggung jawab|deskripsi|benefit|fasilitas|remote|hybrid|onsite|full-time|part-time|contract|intern/i;

  const lines = source
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && !isJobContentNoise(line));
  const lead = lines.slice(0, 36);
  const important = lines.filter((line) => importantPattern.test(line)).slice(0, 42);

  const seen = new Set<string>();
  const merged = [...important, ...lead].filter((line) => {
    const key = normalizeWords(line).slice(0, 100);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return cleanContent(merged.join("\n"), maxLength);
}

// ---------------------------------------------------------------------------
// ROW BUILDER
// ---------------------------------------------------------------------------

function toJobRow(
  job: ExtractedJob,
  fallbackQuery: string,
  fallbackLocation: string,
  sourceResults: SearchResult[] = [],
) {
  const title = cleanJobTitle(job.title || fallbackQuery);
  const company = cleanJobText(job.company || "", 120);
  const location = cleanJobText(job.location || fallbackLocation, 120);
  const description = cleanJobDescription(job.description || "", 2000);
  const matchedSource = findSourceForJob({ ...job, title, company, location }, sourceResults);
  const fallbackSourceUrl = sourceResults.map((result) => cleanUrl(result.url)).find(Boolean);
  const sourceUrl =
    cleanUrl(job.source_url) || cleanUrl(matchedSource?.url) || fallbackSourceUrl || null;
  const sourceText = matchedSource
    ? cleanContent(
        `${matchedSource.title}\n${matchedSource.content}\n${matchedSource.original_content || ""}`,
        24000,
      )
    : "";
  const parsedSalary = sourceText ? parseSalaryRange(sourceText) : null;
  const aiCurrency = normalizeSalaryCurrency(job.salary_currency);
  const hasGroundedSalary = Boolean(parsedSalary?.min || parsedSalary?.max);
  const salaryMin = normalizeSalary(hasGroundedSalary ? parsedSalary?.min : job.salary_min);
  const salaryMax = normalizeSalary(hasGroundedSalary ? parsedSalary?.max : job.salary_max);
  const salaryCurrency = hasGroundedSalary
    ? parsedSalary?.currency || "IDR"
    : aiCurrency && isSalaryCurrencyGrounded(aiCurrency, sourceText)
      ? aiCurrency
      : "IDR";

  if (!title || !company || !location || description.length < 24) return null;

  return {
    slug: buildSlug(title, company, location),
    title,
    company,
    location,
    type: normalizeType(job.type),
    level: normalizeLevel(job.level),
    industry: cleanJobText(job.industry || "", 80) || null,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: salaryMin || salaryMax ? salaryCurrency || "IDR" : "IDR",
    salary_period:
      salaryMin || salaryMax
        ? parsedSalary?.period || normalizeSalaryPeriod(job.salary_period)
        : "monthly",
    description,
    responsibilities: cleanListText(job.responsibilities || "", 2000) || null,
    requirements: cleanListText(job.requirements || "", 2000) || null,
    qualifications: cleanListText(job.qualifications || "", 2000) || null,
    benefits: cleanListText(job.benefits || "", 1000) || null,
    tech_stack: cleanJobText(job.tech_stack || "", 500) || null,
    work_mode: normalizeWorkMode(job.work_mode),
    deadline: parseDeadline(job.deadline),
    source_url: sourceUrl,
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// SOURCE-BASED ENHANCEMENT
// ---------------------------------------------------------------------------

function enhanceJobFromSources(job: ExtractedJob, results: SearchResult[]): ExtractedJob {
  const source = findSourceForJob(job, results);
  if (!source) return stripUngroundedDetails(job);
  const sourceUrl = cleanUrl(job.source_url) || cleanUrl(source.url);

  const text = cleanContent(
    `${source.title}\n${source.content}\n${source.original_content || ""}`,
    24000,
  );
  if (text.length < 120) {
    return {
      ...stripUngroundedDetails(job),
      source_url: sourceUrl,
    };
  }

  const salary = parseSalaryRange(text);
  const responsibilities =
    extractSectionItems(text, [
      "responsibilities",
      "job description",
      "deskripsi pekerjaan",
      "tanggung jawab",
      "apa yang akan kamu lakukan",
      "what you will do",
      "the role",
    ]) || filterGroundedListText(job.responsibilities, text);
  const requirements =
    extractSectionItems(text, [
      "requirements",
      "persyaratan",
      "kualifikasi",
      "minimum qualifications",
      "what you will need",
      "qualifications",
      "requirements and skills",
    ]) || filterGroundedListText(job.requirements, text);
  const qualifications =
    extractSectionItems(text, [
      "preferred qualifications",
      "nice to have",
      "skill yang dibutuhkan",
      "skills",
      "kompetensi",
    ]) || filterGroundedListText(job.qualifications, text);
  const benefits =
    extractSectionItems(text, ["benefits", "perks", "fasilitas", "benefit", "what we offer"]) ||
    filterGroundedListText(job.benefits, text);

  return {
    ...job,
    source_url: sourceUrl,
    salary_min: job.salary_min ?? salary.min,
    salary_max: job.salary_max ?? salary.max,
    salary_currency: job.salary_currency || salary.currency,
    salary_period: job.salary_period || salary.period,
    description: buildSourceDescription(text, job.description, responsibilities),
    responsibilities,
    requirements,
    qualifications,
    benefits,
    tech_stack: extractTechStack(text) || filterGroundedInlineText(job.tech_stack, text),
    work_mode: job.work_mode || inferWorkMode(text),
    deadline: job.deadline || extractDeadline(text),
  };
}

function stripUngroundedDetails(job: ExtractedJob): ExtractedJob {
  return {
    ...job,
    description: "",
    responsibilities: null,
    requirements: null,
    qualifications: null,
    benefits: null,
    tech_stack: null,
  };
}

function findSourceForJob(job: ExtractedJob, results: SearchResult[]) {
  const jobUrl = cleanUrl(job.source_url);
  if (jobUrl) {
    const exact = results.find((result) => cleanUrl(result.url) === jobUrl);
    if (exact) return exact;
  }

  const jobKey = normalizeForDedup(`${job.title}|${job.company}`);
  return results.find((result) => {
    const resultKey = normalizeForDedup(`${result.title}|${result.content}`);
    return (
      resultKey.includes(normalizeForDedup(job.title).slice(0, 24)) ||
      (job.company && resultKey.includes(normalizeForDedup(job.company).slice(0, 18))) ||
      resultKey.includes(jobKey.slice(0, 30))
    );
  });
}

function parseSalaryRange(text: string): SalaryRange {
  const salaryText = extractSalaryContext(text);
  if (!salaryText) {
    return { min: null, max: null, currency: null, period: null };
  }

  const source = salaryText.toLowerCase();
  const period = /tahun|year|annual|annually/.test(source)
    ? "yearly"
    : /bulan|month|monthly|per month|\/mo|\/bulan/.test(source)
      ? "monthly"
      : null;
  const structuredMin = salaryText.match(/"minValue"\s*:\s*"?([0-9.,]+)"?/i);
  const structuredMax = salaryText.match(/"maxValue"\s*:\s*"?([0-9.,]+)"?/i);
  const structuredValue = salaryText.match(/"value"\s*:\s*"?([0-9.,]+)"?/i);
  const structuredCurrency = salaryText.match(/"currency"\s*:\s*"([A-Z]{3})"/i);
  if (structuredMin || structuredMax || structuredValue) {
    const currency =
      normalizeSalaryCurrency(structuredCurrency?.[1]) || inferSalaryCurrency(source);
    const min = parseSalaryNumber(structuredMin?.[1] || structuredValue?.[1], undefined, currency);
    const max = parseSalaryNumber(structuredMax?.[1] || structuredValue?.[1], undefined, currency);
    return { min, max, currency, period };
  }
  const currency = inferSalaryCurrency(source);

  const rangePatterns = [
    /(?:rp|idr)?\s*([\d.,]+)\s*(juta|jt|m|million|k|ribu)?\s*(?:-|–|—|to|sampai|hingga|sd|s\/d)\s*(?:rp|idr)?\s*([\d.,]+)\s*(juta|jt|m|million|k|ribu)?/i,
    /(?:salary|gaji|upah|kompensasi)[^\d]{0,30}(?:rp|idr)?\s*([\d.,]+)\s*(juta|jt|m|million|k|ribu)?[^\d]{0,12}(?:rp|idr)?\s*([\d.,]+)\s*(juta|jt|m|million|k|ribu)?/i,
  ];

  for (const pattern of rangePatterns) {
    const match = salaryText.match(pattern);
    if (!match) continue;
    const min = parseSalaryNumber(match[1], match[2], currency);
    const max = parseSalaryNumber(match[3], match[4] || match[2], currency);
    if (min || max) {
      return {
        min: min && max ? Math.min(min, max) : min,
        max: min && max ? Math.max(min, max) : max,
        currency: currency || "IDR",
        period: period || "monthly",
      };
    }
  }

  const single = salaryText.match(
    /(?:salary|gaji|upah|kompensasi|mulai|hingga|up to)[^\d]{0,30}(?:rp|idr)?\s*([\d.,]+)\s*(juta|jt|m|million|k|ribu)?/i,
  );
  const amount = single ? parseSalaryNumber(single[1], single[2], currency) : null;
  return {
    min: /mulai|start|from/i.test(single?.[0] || "") ? amount : null,
    max: /hingga|up to|max/i.test(single?.[0] || "") ? amount : null,
    currency: amount ? currency || "IDR" : null,
    period: amount ? period || "monthly" : null,
  };
}

function extractSalaryContext(text: string) {
  const structuredSalary = text.match(/Salary:\s*(\{[\s\S]{0,1200}?\})/i)?.[0];
  if (structuredSalary && /minValue|maxValue|currency|value/i.test(structuredSalary)) {
    return structuredSalary;
  }

  const lines = text
    .split(/\n|(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) =>
      /salary|gaji|upah|kompensasi|rp|idr|rupiah|usd|dollar|\$|juta|jt|million|ribu|\/bulan|per month|monthly|tahun|year/i.test(
        line,
      ),
    )
    .filter(
      (line) => !/image|logo|cookie|privacy|javascript|css|font|schema|breadcrumb/i.test(line),
    )
    .slice(0, 8);

  return lines.join("\n");
}

function inferSalaryCurrency(context: string) {
  if (/\b(rp|idr|rupiah)\b/i.test(context)) return "IDR";
  if (/\b(usd|us\$|dollar|dollars)\b/i.test(context)) return "USD";
  if (/\$/.test(context) && !/\b(rp|idr|rupiah)\b/i.test(context)) return "USD";
  return null;
}

function normalizeSalaryCurrency(value?: string | null) {
  const clean = String(value || "")
    .trim()
    .toUpperCase();
  if (!clean) return null;
  if (clean === "RP" || clean === "RUPIAH") return "IDR";
  if (/^[A-Z]{3}$/.test(clean)) return clean;
  return null;
}

function isSalaryCurrencyGrounded(currency: string, sourceText: string) {
  if (!sourceText) return currency === "IDR";
  if (currency === "IDR") return /\b(rp|idr|rupiah)\b/i.test(sourceText);
  if (currency === "USD") return /\b(usd|us\$|dollar|dollars)\b|\$/i.test(sourceText);
  return new RegExp(`\\b${escapeRegExp(currency)}\\b`, "i").test(sourceText);
}

function parseSalaryNumber(value?: string, unit?: string, currency?: string | null) {
  if (!value) return null;
  const normalized = normalizeNumericSalary(value);
  const number = Number.parseFloat(normalized);
  if (!Number.isFinite(number) || number <= 0) return null;
  const cleanUnit = String(unit || "").toLowerCase();
  if (cleanUnit === "juta" || cleanUnit === "jt" || cleanUnit === "m" || cleanUnit === "million") {
    return Math.round(number * (currency === "USD" ? 1_000 : 1_000_000));
  }
  if (cleanUnit === "k" || cleanUnit === "ribu") return Math.round(number * 1_000);
  if (number < 1_000) {
    if (currency === "USD") return Math.round(number);
    return Math.round(number * 1_000_000);
  }
  return Math.round(number);
}

function normalizeNumericSalary(value: string) {
  const clean = value.trim();
  if (clean.includes(",") && clean.includes(".")) {
    return clean.lastIndexOf(",") > clean.lastIndexOf(".")
      ? clean.replace(/\./g, "").replace(",", ".")
      : clean.replace(/,/g, "");
  }
  if (clean.includes(",")) return clean.replace(",", ".");

  const dotParts = clean.split(".");
  if (dotParts.length > 2 || dotParts.at(-1)?.length === 3) {
    return clean.replace(/\./g, "");
  }
  return clean;
}

function extractSectionItems(text: string, headings: string[]) {
  const section = extractSectionText(text, headings);
  if (!section) return null;
  const items = section
    .split(/\n|•|·|(?:^|\s)[*-]\s+|(?<=\.)\s+(?=[A-Z0-9A-Z])/)
    .map((item) =>
      item
        .replace(/^[0-9]+[.)]\s*/, "")
        .replace(/^[*-]\s*/, "")
        .trim(),
    )
    .filter((item) => item.length > 8 && item.length < 240)
    .slice(0, 10);
  return items.length > 0 ? items.join("\n") : cleanText(section, 1200) || null;
}

function extractSectionText(text: string, headings: string[]) {
  const normalized = text.replace(/\r/g, "\n");
  const escapedHeadings = headings.map(escapeRegExp).join("|");
  const stop =
    "responsibilities|requirements|qualifications|benefits|perks|about|company|deskripsi|kualifikasi|persyaratan|tanggung jawab|fasilitas|benefit|skills|apply|lamar|deadline";
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:${escapedHeadings})\\s*:?\\s*\\n?([\\s\\S]{80,1800}?)(?=\\n\\s*(?:${stop})\\s*:?\\s*\\n|$)`,
    "i",
  );
  const match = normalized.match(pattern);
  return match ? cleanContent(match[1], 1800) : null;
}

function buildSourceDescription(
  sourceText: string,
  aiDescription?: string | null,
  responsibilities?: string | null,
) {
  const sourceDescription =
    extractSectionText(sourceText, [
      "about the job",
      "about this role",
      "ringkasan",
      "overview",
      "deskripsi pekerjaan",
      "job description",
      "the role",
    ]) || firstReadableParagraph(sourceText);

  if (sourceDescription) {
    const description = cleanJobDescription(sourceDescription, 2000);
    if (description) return description;
  }

  const groundedAiDescription = isTextGrounded(aiDescription, sourceText)
    ? cleanJobDescription(aiDescription, 2000)
    : "";
  const groundedResponsibilities = responsibilities
    ? cleanJobDescription(responsibilities, 900)
    : "";

  return cleanText(
    [groundedAiDescription, groundedResponsibilities].filter(Boolean).join(" "),
    2000,
  );
}

function filterGroundedListText(value: string | null | undefined, sourceText: string) {
  const items = String(value || "")
    .split(/\n|;|•|·/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => isTextGrounded(item, sourceText))
    .slice(0, 10);

  return items.length > 0 ? items.join("\n") : null;
}

function filterGroundedInlineText(value: string | null | undefined, sourceText: string) {
  const items = String(value || "")
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter((item) => Boolean(item) && !isJobContentNoise(item))
    .filter((item) => isTextGrounded(item, sourceText))
    .slice(0, 12);

  return items.length > 0 ? items.join(", ") : null;
}

function isTextGrounded(value: string | null | undefined, sourceText: string) {
  if (isJobContentNoise(value)) return false;
  const tokens = meaningfulTokens(value);
  if (tokens.length === 0) return false;
  const normalizedSource = normalizeWords(sourceText);
  const matched = tokens.filter((token) => normalizedSource.includes(token));
  return matched.length >= Math.min(3, tokens.length);
}

function meaningfulTokens(value: string | null | undefined) {
  const stopwords = new Set([
    "dan",
    "atau",
    "yang",
    "untuk",
    "dengan",
    "dalam",
    "pada",
    "serta",
    "akan",
    "kami",
    "kamu",
    "anda",
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "will",
    "our",
    "your",
  ]);

  return Array.from(new Set(normalizeWords(value).split(" ")))
    .filter((token) => token.length >= 4 && !stopwords.has(token))
    .slice(0, 16);
}

function firstReadableParagraph(text: string) {
  return (
    text
      .split(/\n{2,}|(?<=\.)\s+(?=[A-Z0-9A-Z])/)
      .map((item) => item.trim())
      .find((item) => item.length > 120 && item.length < 900 && !isJobContentNoise(item)) || ""
  );
}

function extractTechStack(text: string) {
  const keywords = [
    "React",
    "Next.js",
    "Vue",
    "Angular",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "Java",
    "PHP",
    "Laravel",
    "Go",
    "Golang",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "AWS",
    "GCP",
    "Docker",
    "Kubernetes",
    "Figma",
    "Excel",
    "SQL",
  ];
  const found = keywords.filter((keyword) =>
    new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(text),
  );
  return found.length > 0 ? Array.from(new Set(found)).slice(0, 12).join(", ") : null;
}

function inferWorkMode(text: string) {
  return normalizeWorkMode(text);
}

function extractDeadline(text: string) {
  const match = text.match(
    /(?:deadline|batas lamaran|ditutup|closing date|apply before)[^\n\d]{0,30}([0-9]{1,2}\s+[A-Za-zÀ-ÿ]+\s+[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
  );
  return parseDeadline(match?.[1] || null);
}

function extractStructuredJobPosting(html: string) {
  const blocks = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );
  const parts: string[] = [];

  for (const block of blocks) {
    const jsonText = decodeHtmlEntities(block[1] || "").trim();
    const parsed = parseJsonObject(jsonText);
    const nodes = flattenStructuredNodes(parsed);
    for (const node of nodes) {
      if (!isJobPostingNode(node)) continue;
      parts.push(structuredJobToText(node));
    }
  }

  return parts.join("\n\n");
}

function flattenStructuredNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenStructuredNodes);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const graph = record["@graph"];
  return [record, ...flattenStructuredNodes(graph)];
}

function isJobPostingNode(node: Record<string, unknown>) {
  const type = node["@type"];
  return Array.isArray(type)
    ? type.some((item) => String(item).toLowerCase() === "jobposting")
    : String(type || "").toLowerCase() === "jobposting";
}

function structuredJobToText(node: Record<string, unknown>) {
  const hiring = node.hiringOrganization as Record<string, unknown> | undefined;
  const baseSalary = node.baseSalary as Record<string, unknown> | undefined;
  return cleanContent(
    [
      `Title: ${node.title || ""}`,
      `Company: ${hiring?.name || ""}`,
      `Description: ${stripHtml(String(node.description || ""))}`,
      `Employment type: ${node.employmentType || ""}`,
      `Qualifications: ${node.qualifications || ""}`,
      `Responsibilities: ${node.responsibilities || ""}`,
      `Skills: ${node.skills || ""}`,
      `Salary: ${JSON.stringify(baseSalary || {})}`,
      `Valid through: ${node.validThrough || ""}`,
    ].join("\n"),
    12000,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function normalizeType(value?: string) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("part")) return "part-time";
  if (clean.includes("contract") || clean.includes("kontrak") || clean.includes("freelance"))
    return "contract";
  if (clean.includes("intern") || clean.includes("magang") || clean.includes("trainee"))
    return "internship";
  return "full-time";
}

function normalizeLevel(value?: string) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("director") || clean.includes("vp") || clean.includes("vice president"))
    return "director";
  if (
    clean.includes("manager") ||
    clean.includes("lead") ||
    clean.includes("head") ||
    clean.includes("supervisor")
  )
    return "manager";
  if (clean.includes("senior") || clean.includes("sr.") || clean.includes("sr ")) return "senior";
  if (
    clean.includes("fresh") ||
    clean.includes("entry") ||
    clean.includes("junior") ||
    clean.includes("jr.") ||
    clean.includes("graduate")
  )
    return "entry";
  return "mid";
}

function normalizeWorkMode(value?: string | null) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("remote") || clean.includes("wfh") || clean.includes("work from home"))
    return "remote";
  if (
    clean.includes("hybrid") ||
    clean.includes("flexible") ||
    clean.includes("fleksibel") ||
    clean.includes("wfo/wfh")
  )
    return "hybrid";
  if (clean.includes("onsite") || clean.includes("on-site") || clean.includes("wfo"))
    return "onsite";
  return null;
}

function normalizeSalaryPeriod(value?: string | null) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("year") || clean.includes("tahun") || clean.includes("annual"))
    return "yearly";
  if (clean.includes("month") || clean.includes("bulan")) return "monthly";
  return "monthly";
}

function normalizeSalary(value?: number | null) {
  if (!Number.isFinite(Number(value))) return null;
  const salary = Math.round(Number(value));
  return salary > 0 ? salary : null;
}

function parseDeadline(value?: string | null) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {
    // Ignore invalid dates
  }
  return null;
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
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return hash >>> 0;
}

function normalizeForDedup(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 60);
}

function normalizeWords(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJobsFromContent(content: string): JobParseResult {
  const cleaned = stripJsonCodeFence(content);
  const parsed = parseJsonObject(cleaned) as Record<string, unknown>;
  const directJobs = normalizeParsedJobs(parsed);
  if (directJobs.length > 0) return { jobs: directJobs, recovered: false };

  const recoveredJobs = extractCompleteJobsFromTruncatedJson(cleaned);
  return { jobs: recoveredJobs, recovered: recoveredJobs.length > 0 };
}

function normalizeParsedJobs(parsed: unknown): ExtractedJob[] {
  if (Array.isArray(parsed))
    return parsed.map(normalizeParsedJob).filter(Boolean) as ExtractedJob[];
  if (!parsed || typeof parsed !== "object") return [];
  const record = parsed as Record<string, unknown>;
  if (Array.isArray(record.jobs)) {
    return record.jobs.map(normalizeParsedJob).filter(Boolean) as ExtractedJob[];
  }
  return [];
}

function normalizeParsedJob(value: unknown): ExtractedJob | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!record.title && !record.company && !record.source_url) return null;
  return record as ExtractedJob;
}

function extractCompleteJobsFromTruncatedJson(content: string): ExtractedJob[] {
  const jobsStart = content.search(/"jobs"\s*:/i);
  const scanStart = jobsStart >= 0 ? content.indexOf("[", jobsStart) : 0;
  if (scanStart < 0) return [];

  const jobs: ExtractedJob[] = [];
  let objectStart = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = scanStart; i < content.length; i++) {
    const char = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) objectStart = i;
      depth++;
      continue;
    }

    if (char === "}" && depth > 0) {
      depth--;
      if (depth === 0 && objectStart >= 0) {
        const job = normalizeParsedJob(parseJsonObject(content.slice(objectStart, i + 1)));
        if (job) jobs.push(job);
        objectStart = -1;
      }
    }
  }

  return jobs;
}

function stripJsonCodeFence(content: string) {
  return String(content || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(stripJsonCodeFence(content));
  } catch {
    const match = stripJsonCodeFence(content).match(/\{[\s\S]*\}/);
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

/**
 * FIX: cleanJobTitle disederhanakan — tidak terlalu agresif.
 * Regex lama bisa ikut menghapus judul job yang valid.
 */
function cleanJobTitle(value: unknown) {
  return (
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      // Hapus timestamp relatif di awal (misal: "2 hari yang lalu Backend Developer")
      .replace(/^\d+\s+(?:menit|jam|hari|minggu|bulan|tahun)\s+yang\s+lalu\s*/i, "")
      // Hapus prefix "Image N"
      .replace(/^image\s+\d+\s*/i, "")
      // Hapus markdown heading
      .replace(/^#+\s*/, "")
      // Hapus suffix sumber (misal: "Backend Developer | LinkedIn")
      .replace(/\s*\|\s*(?:linkedin|jobstreet|glints|kalibrr|indeed).*$/i, "")
      .trim()
      .slice(0, 120)
  );
}

function cleanJobText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\d+\s+(?:menit|jam|hari|minggu|bulan|tahun)\s+yang\s+lalu\s*/gi, "")
    .replace(/^Image\s+\d+\s*/gi, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanJobDescription(value: unknown, maxLength: number) {
  const description = cleanJobText(value, maxLength);
  return isJobContentNoise(description) ? "" : description;
}

function isJobContentNoise(value: unknown) {
  const text = normalizeWords(value);
  if (!text) return false;

  const exactNoise = [
    "dengan mengklik lanjutkan untuk bergabung atau login",
    "anda menyetujui perjanjian pengguna kebijakan privasi dan kebijakan cookie",
    "by clicking continue to join or sign in you agree",
    "user agreement privacy policy and cookie policy",
    "we use cookies to improve your experience",
    "sign in to view more jobs",
    "join now to apply",
  ];
  if (exactNoise.some((phrase) => text.includes(phrase))) return true;

  const mentionsConsent = text.includes("menyetujui") || text.includes("agree");
  const mentionsPolicy =
    text.includes("kebijakan privasi") ||
    text.includes("kebijakan cookie") ||
    text.includes("perjanjian pengguna") ||
    text.includes("privacy policy") ||
    text.includes("cookie policy") ||
    text.includes("user agreement");
  const mentionsLogin =
    text.includes("login") ||
    text.includes("sign in") ||
    text.includes("bergabung") ||
    text.includes("join");

  if (mentionsConsent && mentionsPolicy) return true;
  if (text.length < 500 && mentionsPolicy && mentionsLogin) return true;
  if (text.length < 300 && text.includes("cookie") && text.includes("privacy")) return true;

  return false;
}

function cleanContent(value: unknown, maxLength: number) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function cleanListText(value: unknown, maxLength: number) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength);
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

async function isValidCronRequest(req: Request, admin: ReturnType<typeof getAdminClient>) {
  const providedSecret = req.headers.get("x-cron-secret");
  if (!providedSecret) return false;
  const { data, error } = await admin.rpc("get_job_search_cron_secret");
  if (error || !data) return false;
  return providedSecret === data;
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
