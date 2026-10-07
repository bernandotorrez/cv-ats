import { corsHeaders } from "../_shared/cors.ts";
import { AI_MODEL, getAdminClient, getUserId } from "../_shared/ai-common.ts";

type SearchSource = "jobstreet" | "glints" | "kalibrr" | "dealls" | "google";
type Board = "jobstreet" | "glints" | "kalibrr" | "dealls" | "other";
type PageKind = "detail" | "listing";

type PageLink = { url: string; text: string };

type StructuredJob = {
  title: string | null;
  company: string | null;
  location: string | null;
  country: string | null;
  datePosted: string | null;
  validThrough: string | null;
  employmentType: string | null;
};

type SearchResult = {
  title: string;
  url: string;
  content: string;
  source: string;
  board: Board;
  kind: PageKind;
  original_content?: string;
  original_content_source?: "tavily_search" | "tavily_extract" | "direct_fetch";
  links?: PageLink[];
  structured?: StructuredJob | null;
};

type RawSearchHit = { title: string; url: string; content: string; raw_content?: string };

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

type PageData = {
  content: string;
  source: "tavily_extract" | "direct_fetch";
  links: PageLink[];
  structured: StructuredJob | null;
};

type ExtractedJob = {
  page_id?: number;
  is_job_detail?: boolean;
  is_closed?: boolean;
  title: string;
  company: string;
  location: string;
  posted_date?: string | null;
  type?: string;
  level?: string;
  industry?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  description: string;
  // AI kadang mengembalikan list sebagai array, kadang string dipisah \n.
  responsibilities?: string | string[] | null;
  requirements?: string | string[] | null;
  qualifications?: string | string[] | null;
  benefits?: string | string[] | null;
  tech_stack?: string | string[] | null;
  work_mode?: string | null;
  deadline?: string | null;
};

type PolishedJob = {
  job_id?: number;
  description?: string | null;
  responsibilities?: string | string[] | null;
  requirements?: string | string[] | null;
  qualifications?: string | string[] | null;
  benefits?: string | string[] | null;
  tech_stack?: string | string[] | null;
};

/** Halaman detail lowongan yang sudah lolos cek konten, status tutup, dan tanggal. */
type AssessedPage = {
  result: SearchResult;
  text: string;
  postedAt: string | null;
  deadline: string | null;
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

type RejectReason =
  | "no_content"
  | "closed"
  | "expired"
  | "stale"
  | "undated"
  | "not_job_detail"
  | "low_quality"
  | "foreign_location"
  | "duplicate";

type JobRow = ReturnType<typeof buildJobRow> extends infer R ? Exclude<R, RejectReason> : never;

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const DEFAULT_SOURCES: SearchSource[] = ["jobstreet", "glints", "kalibrr", "dealls", "google"];
const AI_PAGES_PER_BATCH = 5;
const AI_BATCH_CONCURRENCY = 3;
const AI_CONTENT_CHARS = 5000;
const AI_POLISH_BATCH = 5;
const AI_POLISH_SOURCE_CHARS = 3500;
const MIN_PAGE_CONTENT_CHARS = 300;
const MAX_LISTING_PAGES = 6;
const DIRECT_FETCH_LIMIT = 12;

// Lowongan yang diposting lebih lama dari ini dianggap basi (kecuali deadline-nya masih berlaku).
const MAX_POSTED_AGE_DAYS = 45;
// Lowongan tanpa tanggal posting/deadline disembunyikan otomatis setelah N hari tidak terlihat lagi.
const DEFAULT_TTL_DAYS = 30;

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
// LinkedIn & Glassdoor sengaja tidak dipakai karena sering mengembalikan halaman
// login/consent, bukan detail lowongan yang bisa dicrawl stabil.
// ---------------------------------------------------------------------------

const SOURCE_DOMAINS: Record<SearchSource, string[]> = {
  jobstreet: ["id.jobstreet.com", "jobstreet.co.id"],
  glints: ["glints.com"],
  kalibrr: ["kalibrr.com", "kalibrr.id"],
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

const BLOCKED_HOSTS = [
  "linkedin.com",
  "glassdoor.com",
  "glassdoor.co.id",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "tiktok.com",
  "reddit.com",
  "quora.com",
  "wikipedia.org",
];

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
    const today = jakartaToday();

    log = createLogger(requestId, query);
    log.info("request_start", { query, location, limit, sources, today });

    if (!query || query.length < 2) {
      log.warn("validation_failed", { reason: "query too short" });
      return json(req, { error: "Posisi atau keyword lowongan wajib diisi." }, 400);
    }

    const rejected: Partial<Record<RejectReason, number>> = {};
    const reject = (reason: RejectReason, data?: Record<string, unknown>) => {
      rejected[reason] = (rejected[reason] || 0) + 1;
      log.debug("job_rejected", { reason, ...data });
    };

    // ── STEP 1: Search ──────────────────────────────────────────────────────
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

    // ── STEP 2: Kumpulkan URL detail lowongan ──────────────────────────────
    // Hanya halaman detail 1 lowongan yang dipakai. Halaman pencarian/listing
    // dipakai sebagai sumber link ke halaman detail, tidak pernah disimpan.
    const candidateTarget = clampNumber(limit * 2 + 4, 8, 30);
    const seenUrls = new Set(searchResults.map((r) => r.url));
    let candidates = searchResults.filter((r) => r.kind === "detail");
    const listings = searchResults.filter((r) => r.kind === "listing");

    if (candidates.length < candidateTarget && listings.length > 0) {
      const harvested = await harvestDetailUrls(
        listings,
        candidateTarget - candidates.length,
        seenUrls,
        log,
      );
      candidates = [...candidates, ...harvested];
    }

    // Job board yang dikenal diproses lebih dulu daripada situs lain.
    candidates = [
      ...candidates.filter((c) => c.board !== "other"),
      ...candidates.filter((c) => c.board === "other"),
    ].slice(0, candidateTarget);

    log.info("candidates_ready", {
      detail_from_search: searchResults.filter((r) => r.kind === "detail").length,
      listings: listings.length,
      candidates: candidates.length,
    });

    if (candidates.length === 0) {
      return json(req, {
        inserted: 0,
        skipped: 0,
        rejected,
        jobs: [],
        searched: searchResults.length,
        message: "Tidak ditemukan halaman detail lowongan dari hasil pencarian.",
      });
    }

    // ── STEP 3: Ambil isi halaman detail ────────────────────────────────────
    const enriched = await enrichSearchResults(candidates, log);
    const sourcePages = enriched.filter(
      (r) => (r.original_content?.length || 0) >= MIN_PAGE_CONTENT_CHARS,
    ).length;

    // ── STEP 4: Cek konten, status tutup & tanggal sebelum AI ──────────────
    const assessed: AssessedPage[] = [];
    for (const result of enriched) {
      const outcome = assessPage(result, today);
      if (typeof outcome === "string") reject(outcome, { url: result.url });
      else assessed.push(outcome);
    }
    log.info("pages_assessed", { usable: assessed.length, rejected });

    if (assessed.length === 0) {
      return json(req, {
        inserted: 0,
        skipped: candidates.length,
        rejected,
        jobs: [],
        searched: searchResults.length,
        source_pages: sourcePages,
        message: "Semua lowongan yang ditemukan sudah ditutup, kedaluwarsa, atau tidak terbaca.",
      });
    }

    // ── STEP 5: AI extraction (1 halaman = 1 lowongan) ─────────────────────
    const extracted = await extractJobsWithAi(assessed, today, log);

    // ── STEP 6: Validasi & bangun row ───────────────────────────────────────
    const rows: JobRow[] = [];
    const rowSourceText = new Map<JobRow, string>();
    const seenKeys = new Set<string>();
    assessed.forEach((page, index) => {
      const job = extracted.get(index);
      if (!job) return reject("not_job_detail", { url: page.result.url, why: "ai_skipped" });

      const row = buildJobRow(job, page, today);
      if (typeof row === "string") return reject(row, { url: page.result.url, title: job.title });

      const key = jobIdentityKey(row.title, row.company);
      if (seenKeys.has(key)) return reject("duplicate", { url: page.result.url });
      seenKeys.add(key);
      rows.push(row);
      rowSourceText.set(row, page.text);
    });

    const finalRows = rows.slice(0, limit);
    if (finalRows.length === 0) {
      log.warn("no_valid_rows", { rejected });
      return json(req, {
        inserted: 0,
        skipped: candidates.length,
        rejected,
        jobs: [],
        searched: searchResults.length,
        source_pages: sourcePages,
        message: "AI tidak menemukan lowongan yang cukup valid dan masih dibuka.",
      });
    }

    // ── STEP 6b: AI polish — rapikan & kelompokkan ulang isi lowongan ──────
    await polishJobsWithAi(finalRows, rowSourceText, log);

    // Lowongan yang sama (judul + perusahaan) yang sudah ada di DB di-update,
    // bukan dibuat ulang dengan slug baru.
    await reuseExistingSlugs(admin, finalRows, log);
    const seenSlugs = new Set<string>();
    const upsertRows = finalRows.filter((row) => {
      if (seenSlugs.has(row.slug)) return false;
      seenSlugs.add(row.slug);
      return true;
    });

    // ── STEP 7: Upsert ke DB ────────────────────────────────────────────────
    log.info("db_upsert_start", { rows: upsertRows.length });
    const { data, error } = await admin
      .from("job_listings")
      .upsert(upsertRows, { onConflict: "slug" })
      .select("id, slug, title, company, location, source_url");

    if (error) {
      log.error("db_upsert_failed", { message: error.message, code: error.code });
      throw error;
    }

    const inserted = data?.length || 0;
    const skipped = Math.max(candidates.length - inserted, 0);
    log.info("request_done", {
      inserted,
      skipped,
      rejected,
      searched: searchResults.length,
      source_pages: sourcePages,
      total_ms: log.elapsed(),
    });

    return json(req, {
      inserted,
      skipped,
      rejected,
      jobs: data || [],
      searched: searchResults.length,
      source_pages: sourcePages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error("unhandled_exception", { message, total_ms: log.elapsed() });
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Unauthorized" }, 401);
    }
    return json(req, { error: "Internal server error" }, 500);
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
  const queryVariants = buildQueryVariants(query, location);

  log.debug("search_variants", {
    variants: queryVariants.map((v) => `${v.query} @ ${v.location}`),
    per_source: perSource,
  });

  const batches = await Promise.all(
    sources.flatMap((source) =>
      queryVariants.map(async (variant) => {
        const q = buildSourceQuery(variant.query, variant.location, source);
        const hits = await searchWeb(q, source, perSource, log).catch((err) => {
          log.warn("source_search_failed", { source, query: q, error: err.message });
          return [] as RawSearchHit[];
        });
        return hits.map((hit) => ({ hit, source }));
      }),
    ),
  );

  let raw = batches.flat();
  if (raw.length === 0) {
    log.warn("all_sources_empty", { reason: "triggering google fallback search" });
    const fallbackQuery = buildGoogleFallbackQuery(query, location);
    const hits = await searchWeb(fallbackQuery, "google", perSource * 2, log).catch((err) => {
      log.warn("google_fallback_failed", { error: err.message });
      return [] as RawSearchHit[];
    });
    raw = hits.map((hit) => ({ hit, source: "google" as SearchSource }));
  }

  const combined = [...buildListingSeeds(query, sources), ...raw.map(toSearchResult)].filter(
    (result): result is SearchResult => result !== null,
  );

  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  const filtered = combined.filter((result) => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    const key = `${result.board}:${result.kind}`;
    counts[key] = (counts[key] || 0) + 1;
    return true;
  });

  log.info("search_collected", {
    raw: raw.length,
    after_classify: filtered.length,
    by_board: counts,
  });

  return filtered;
}

function toSearchResult({ hit, source }: { hit: RawSearchHit; source: SearchSource }) {
  const classified = classifyUrl(hit.url);
  if (!classified) return null;
  // Situs non-job-board hanya dipakai kalau berupa halaman detail.
  if (classified.board === "other" && classified.kind === "listing") return null;

  const rawContent = cleanContent(hit.raw_content || "", 20000);
  return {
    title: hit.title,
    url: classified.url,
    content: hit.content,
    source,
    board: classified.board,
    kind: classified.kind,
    original_content: rawContent || undefined,
    original_content_source: rawContent ? "tavily_search" : undefined,
  } satisfies SearchResult;
}

/**
 * Halaman pencarian job board yang diurutkan dari yang terbaru. Halaman ini
 * hanya dipakai untuk memanen link detail lowongan, tidak pernah disimpan.
 */
function buildListingSeeds(query: string, sources: SearchSource[]): SearchResult[] {
  const seeds: SearchResult[] = [];
  const listing = (url: string, source: SearchSource, board: Board): SearchResult => ({
    title: `${query} (${source})`,
    url,
    content: "",
    source,
    board,
    kind: "listing",
  });

  if (sources.includes("dealls")) {
    const params = new URLSearchParams({ searchJob: query });
    seeds.push(listing(`https://dealls.com/?${params.toString()}`, "dealls", "dealls"));
  }
  if (sources.includes("jobstreet")) {
    const slug = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slug) {
      seeds.push(
        listing(
          `https://id.jobstreet.com/id/${slug}-jobs?sortmode=ListedDate&daterange=14`,
          "jobstreet",
          "jobstreet",
        ),
      );
    }
  }
  return seeds;
}

/**
 * Variasi: lokasi asli + fallback Indonesia (jika beda).
 */
function buildQueryVariants(query: string, location: string) {
  const variants: { query: string; location: string }[] = [{ query, location }];

  const loc = location.toLowerCase();
  if (loc !== "indonesia" && !loc.includes("indonesia")) {
    variants.push({ query, location: "Indonesia" });
  }

  return variants.slice(0, 2);
}

/**
 * Google fallback query — natural, tanpa site: filter.
 * Dipakai ketika semua source utama tidak menghasilkan data.
 */
function buildGoogleFallbackQuery(query: string, location: string) {
  return `lowongan kerja "${query}" ${location} terbaru`;
}

async function searchWeb(
  searchQuery: string,
  source: SearchSource,
  limit: number,
  log: Logger,
): Promise<RawSearchHit[]> {
  const domains = SOURCE_DOMAINS[source];

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
        // Hanya halaman yang diindeks sebulan terakhir — lowongan lama tidak ikut.
        time_range: "month",
        include_answer: false,
        // Markdown mempertahankan link, dipakai untuk memanen URL detail dari halaman listing.
        include_raw_content: "markdown",
        ...(domains.length > 0 ? { include_domains: domains } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Tavily search gagal: ${res.status}`);
    const data = (await res.json()) as TavilySearchResponse;
    const results = (data.results || []).map((item) => ({
      title: String(item.title || ""),
      url: String(item.url || ""),
      content: String(item.content || ""),
      raw_content: item.raw_content ? String(item.raw_content) : undefined,
    }));
    log.debug("provider_result", {
      provider: "tavily",
      source,
      query: searchQuery,
      count: results.length,
    });
    return results;
  }

  const siteQuery = domains.length > 0 ? `${searchQuery} site:${domains[0]}` : searchQuery;

  const serpKey = Deno.env.get("SERPAPI_API_KEY");
  if (serpKey) {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", siteQuery);
    url.searchParams.set("api_key", serpKey);
    url.searchParams.set("num", String(Math.min(limit, 10)));
    url.searchParams.set("hl", "id");
    url.searchParams.set("gl", "id");
    url.searchParams.set("tbs", "qdr:m");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SerpAPI search gagal: ${res.status}`);
    const data = (await res.json()) as SerpApiSearchResponse;
    const results = (data.organic_results || []).slice(0, limit).map((item) => ({
      title: String(item.title || ""),
      url: String(item.link || ""),
      content: String(item.snippet || ""),
    }));
    log.debug("provider_result", {
      provider: "serpapi",
      source,
      query: siteQuery,
      count: results.length,
    });
    return results;
  }

  const braveKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
  if (braveKey) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", siteQuery);
    url.searchParams.set("count", String(Math.min(limit, 20)));
    url.searchParams.set("country", "id");
    url.searchParams.set("search_lang", "id");
    url.searchParams.set("freshness", "pm");
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
    }));
    log.debug("provider_result", {
      provider: "brave",
      source,
      query: siteQuery,
      count: results.length,
    });
    return results;
  }

  log.warn("no_search_provider", { source });
  return [];
}

// ---------------------------------------------------------------------------
// URL CLASSIFICATION
// ---------------------------------------------------------------------------

function detectBoard(host: string): Board {
  if (
    host === "jobstreet.co.id" ||
    host.endsWith("jobstreet.com") ||
    host.endsWith(".jobstreet.co.id")
  )
    return "jobstreet";
  if (host === "glints.com" || host.endsWith(".glints.com")) return "glints";
  if (/(^|\.)kalibrr\.(com|id)$/.test(host)) return "kalibrr";
  if (host === "dealls.com" || host.endsWith(".dealls.com")) return "dealls";
  return "other";
}

/**
 * Tentukan apakah URL adalah halaman detail 1 lowongan atau halaman listing,
 * sekaligus kanonisasi (buang query/hash) agar dedup per URL stabil.
 * Return null untuk URL yang tidak boleh dipakai sama sekali.
 */
function classifyUrl(raw: string): { url: string; board: Board; kind: PageKind } | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (BLOCKED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;

  const path = parsed.pathname;
  const board = detectBoard(host);
  parsed.hash = "";

  const detail = (isDetail: boolean) => {
    if (isDetail) parsed.search = "";
    return { url: parsed.toString(), board, kind: (isDetail ? "detail" : "listing") as PageKind };
  };

  switch (board) {
    case "jobstreet":
      return detail(/\/job\/(?:[a-z0-9-]*-)?\d{6,}\/?$/i.test(path));
    case "glints": {
      // glints.com/vn, /sg, /my, ... = lowongan luar Indonesia.
      const country = path.match(/^\/([a-z]{2})\//i)?.[1]?.toLowerCase();
      if (country && country !== "id" && country !== "en") return null;
      return detail(
        /\/opportunities\/jobs\/[^/]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i.test(
          path,
        ),
      );
    }
    case "kalibrr":
      return detail(/\/c\/[^/]+\/jobs\/\d+/i.test(path));
    case "dealls":
      return detail(/^\/(?:en\/)?loker\/[^/]+~[^/]+\/?$/i.test(path));
    default: {
      for (const key of Array.from(parsed.searchParams.keys())) {
        if (/^utm_|^fbclid$|^gclid$/i.test(key)) parsed.searchParams.delete(key);
      }
      const looksLikeListing =
        /\/(search|cari|kategori|category|tag|tags|find-jobs|job-search|page\/\d+)(\/|$)|\/jobs\/?$|lowongan-kerja-(di|terbaru)|\/lowongan\/?$|\/loker\/?$/i.test(
          path,
        ) || /[?&](q|s|keyword|keywords|search|query)=/i.test(parsed.search);
      return detail(!looksLikeListing && path.length > 1);
    }
  }
}

function normalizeSources(value: unknown): SearchSource[] {
  if (!Array.isArray(value)) return DEFAULT_SOURCES;
  const allowed = new Set<SearchSource>(["jobstreet", "glints", "kalibrr", "dealls", "google"]);
  const sources = value.filter((s): s is SearchSource => allowed.has(s as SearchSource));
  return sources.length > 0 ? sources : DEFAULT_SOURCES;
}

function buildSourceQuery(query: string, location: string, source: SearchSource) {
  return `${query} ${location} ${SOURCE_QUERY_SUFFIXES[source]}`;
}

// ---------------------------------------------------------------------------
// LISTING HARVEST
// ---------------------------------------------------------------------------

/**
 * Ambil link halaman detail lowongan dari halaman listing/pencarian job board.
 * Link diambil bergiliran dari tiap listing supaya satu situs tidak mendominasi.
 */
async function harvestDetailUrls(
  listings: SearchResult[],
  max: number,
  seenUrls: Set<string>,
  log: Logger,
) {
  const targets = listings.filter((l) => l.board !== "other").slice(0, MAX_LISTING_PAGES);
  const needFetch = targets.filter((l) => !l.original_content || l.original_content.length < 500);
  const pages =
    needFetch.length > 0 ? await extractSourcePages(needFetch, log) : new Map<string, PageData>();

  const perListing = targets.map((listing) => {
    const page = pages.get(listing.url);
    const content = page?.content || listing.original_content || "";
    const links = [...(page?.links || []), ...extractLinksFromText(content, listing.url)];
    const found: SearchResult[] = [];
    for (const link of links) {
      const classified = classifyUrl(link.url);
      if (!classified || classified.kind !== "detail" || classified.board !== listing.board)
        continue;
      if (seenUrls.has(classified.url)) continue;
      seenUrls.add(classified.url);
      found.push({
        title: cleanText(link.text, 160),
        url: classified.url,
        content: "",
        source: listing.source,
        board: classified.board,
        kind: "detail",
      });
    }
    return found;
  });

  const harvested: SearchResult[] = [];
  for (let round = 0; harvested.length < max; round++) {
    const batch = perListing.map((list) => list[round]).filter(Boolean);
    if (batch.length === 0) break;
    harvested.push(...batch.slice(0, max - harvested.length));
  }

  log.info("listing_harvest", {
    listings: targets.length,
    fetched: pages.size,
    harvested: harvested.length,
    per_listing: perListing.map((list) => list.length),
  });
  return harvested;
}

function extractLinksFromText(text: string, baseUrl: string): PageLink[] {
  const links: PageLink[] = [];
  for (const match of text.matchAll(/\[([^\]]{0,200})\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const url = resolveUrl(match[2], baseUrl);
    if (url) links.push({ url, text: match[1] });
  }
  for (const match of text.matchAll(/https?:\/\/[^\s)"'<>\]]+/g)) {
    links.push({ url: match[0], text: "" });
  }
  return links;
}

function extractLinksFromHtml(html: string, baseUrl: string): PageLink[] {
  const links: PageLink[] = [];
  // Kartu lowongan bisa berisi markup panjang, jadi teks diambil dari potongan
  // setelah tag pembuka (bukan sampai </a>).
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const url = resolveUrl(decodeHtmlEntities(match[1]), baseUrl);
    if (!url) continue;
    const after = html.slice(
      (match.index ?? 0) + match[0].length,
      (match.index ?? 0) + match[0].length + 800,
    );
    links.push({ url, text: cleanText(stripHtml(after.split(/<\/a>/i)[0]), 200) });
  }
  return links;
}

function resolveUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ENRICHMENT
// ---------------------------------------------------------------------------

async function enrichSearchResults(results: SearchResult[], log: Logger) {
  const pages = await extractSourcePages(results, log);

  return results.map((result) => {
    const page = pages.get(result.url);
    if (!page) return result;
    const existing = result.original_content || "";
    const useExisting = existing.length >= page.content.length;
    return {
      ...result,
      original_content: useExisting ? existing : page.content,
      original_content_source: useExisting ? result.original_content_source : page.source,
      links: page.links,
      structured: page.structured,
    };
  });
}

/**
 * Tavily extract untuk halaman yang belum punya konten, lalu direct fetch untuk
 * yang masih kosong + halaman yang biasanya punya JSON-LD JobPosting (tanggal
 * posting & validThrough paling akurat datang dari sana).
 */
async function extractSourcePages(results: SearchResult[], log: Logger) {
  const pageMap = new Map<string, PageData>();

  const needTavily = results
    .filter((r) => !r.original_content || r.original_content.length < 800)
    .map((r) => r.url);

  const tavilyKey = Deno.env.get("TAVILY_API_KEY");
  if (tavilyKey && needTavily.length > 0) {
    const batchSize = 20;
    for (let i = 0; i < needTavily.length; i += batchSize) {
      const batch = needTavily.slice(i, i + batchSize);
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
            const rawContent = String(item.raw_content || item.content || "");
            const content = cleanContent(rawContent, 20000);
            if (url && content.length > 120) {
              pageMap.set(url, {
                content,
                source: "tavily_extract",
                links: extractLinksFromText(rawContent, url),
                structured: null,
              });
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

  // Jobstreet/Glints/Kalibrr memblokir fetch langsung (403), jadi direct fetch
  // diprioritaskan untuk halaman yang belum punya konten, lalu Dealls & situs lain.
  const hasContent = (r: SearchResult) =>
    pageMap.has(r.url) || (r.original_content?.length || 0) >= MIN_PAGE_CONTENT_CHARS;
  const directTargets = [
    ...results.filter((r) => !hasContent(r)),
    ...results.filter((r) => hasContent(r) && (r.board === "dealls" || r.board === "other")),
  ].slice(0, DIRECT_FETCH_LIMIT);

  const directPages = await Promise.allSettled(
    directTargets.map(async (result) => ({
      url: result.url,
      page: await fetchPage(result.url, log),
    })),
  );

  let directOk = 0;
  for (const settled of directPages) {
    if (settled.status !== "fulfilled" || !settled.value.page) continue;
    const { url, page } = settled.value;
    const existing = pageMap.get(url);
    if (existing && existing.content.length >= page.content.length) {
      existing.structured = page.structured;
      existing.links = [...existing.links, ...page.links];
    } else {
      pageMap.set(url, page);
    }
    directOk++;
  }
  log.info("direct_fetch_done", { attempted: directTargets.length, ok: directOk });

  return pageMap;
}

async function fetchPage(url: string, log: Logger): Promise<PageData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
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
      return null;
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      log.debug("direct_fetch_skip", { url, reason: "non-html", content_type: contentType });
      return null;
    }

    const html = await res.text();
    const structured = extractStructuredJobPosting(html);
    const content = cleanContent(`${structured.text}\n\n${stripHtml(html)}`, 16000);
    if (content.length <= 120) return null;
    return {
      content,
      source: "direct_fetch",
      links: extractLinksFromHtml(html, url),
      structured: structured.job,
    };
  } catch (err) {
    log.debug("direct_fetch_error", {
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// PAGE ASSESSMENT (closed / expired / stale)
// ---------------------------------------------------------------------------

function assessPage(result: SearchResult, today: string): AssessedPage | RejectReason {
  const text = cutSimilarJobsSection(result.original_content || "");
  if (text.length < MIN_PAGE_CONTENT_CHARS) return "no_content";
  if (isClosedJobText(text)) return "closed";

  const structured = result.structured;
  const postedAt =
    validPostedDate(parseHumanDate(structured?.datePosted), today) ||
    validPostedDate(extractPostedDate(text, today), today);
  const deadline =
    validDeadline(parseHumanDate(structured?.validThrough), today) ||
    validDeadline(extractDeadline(text), today);

  const freshness = freshnessRejection(postedAt, deadline, today);
  if (freshness) return freshness;

  // Situs di luar job board besar sering menyalin lowongan lama tanpa update —
  // wajib ada tanggal yang bisa diverifikasi.
  if (result.board === "other" && !postedAt && !deadline) return "undated";

  return { result, text, postedAt, deadline };
}

function freshnessRejection(
  postedAt: string | null,
  deadline: string | null,
  today: string,
): RejectReason | null {
  if (deadline && deadline < today) return "expired";
  const stillOpenByDeadline = Boolean(deadline && deadline >= today);
  if (postedAt && daysBetween(postedAt, today) > MAX_POSTED_AGE_DAYS && !stillOpenByDeadline)
    return "stale";
  return null;
}

const CLOSED_JOB_MARKERS = [
  "lowongan ini sudah ditutup",
  "lowongan ini telah ditutup",
  "lowongan sudah ditutup",
  "lowongan ini sudah tidak tersedia",
  "lowongan ini tidak tersedia lagi",
  "lowongan ini sudah kedaluwarsa",
  "lowongan ini sudah tidak aktif",
  "iklan lowongan ini sudah tidak",
  "pekerjaan ini sudah ditutup",
  "pekerjaan ini sudah tidak tersedia",
  "sudah tidak menerima lamaran",
  "tidak lagi menerima lamaran",
  "this job is no longer available",
  "this job is no longer advertised",
  "this job is no longer accepting applications",
  "no longer accepting applications",
  "this job has expired",
  "this job is closed",
  "this job has been closed",
  "this position has been filled",
  "this position is no longer available",
  "job ad has expired",
  "job is no longer active",
];

function isClosedJobText(text: string) {
  const normalized = normalizeWords(text);
  return CLOSED_JOB_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * Halaman detail biasanya diakhiri daftar "lowongan serupa" yang punya tanggal
 * & judul sendiri — buang supaya tidak tercampur dengan lowongan utama.
 */
function cutSimilarJobsSection(content: string) {
  const match = content.search(
    /\n[#*>\s-]*(lowongan serupa|lowongan lainnya|lowongan terkait|lowongan lain dari|pekerjaan serupa|rekomendasi lowongan|similar jobs|related jobs|more jobs from|other jobs|jobs you may|you may also like|people also viewed|lihat lowongan lain)/i,
  );
  if (match > 400 && match > content.length * 0.2) return content.slice(0, match).trim();
  return content;
}

const MONTHS: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  pebruari: 2,
  february: 2,
  feb: 2,
  maret: 3,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  agustus: 8,
  august: 8,
  agu: 8,
  agt: 8,
  ags: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nopember: 11,
  nov: 11,
  desember: 12,
  december: 12,
  des: 12,
  dec: 12,
};

/** Parse tanggal ISO, D/M/Y (format Indonesia), atau nama bulan ID/EN → YYYY-MM-DD. */
function parseHumanDate(value: unknown): string | null {
  const s = String(value || "")
    .trim()
    .toLowerCase();
  if (!s) return null;

  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return ymd(+m[1], +m[2], +m[3]);

  m = s.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return ymd(year, +m[2], +m[1]);
  }

  m = s.match(/\b(\d{1,2})\s+([a-z]+)\.?,?\s+(\d{4})\b/);
  if (m && MONTHS[m[2]]) return ymd(+m[3], MONTHS[m[2]], +m[1]);

  m = s.match(/\b([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (m && MONTHS[m[1]]) return ymd(+m[3], MONTHS[m[1]], +m[2]);

  return null;
}

function ymd(year: number, month: number, day: number) {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return null;
  return date.toISOString().slice(0, 10);
}

/** "Diposting 3 hari yang lalu", "Posted 2d ago", "Posted on 12 Sep 2026", dll. */
function extractPostedDate(text: string, today: string): string | null {
  const region = text.slice(0, 6000);

  const absolute = region.match(
    /(?:diposting|dipasang|diiklankan|dipublikasikan|tanggal posting|tanggal tayang|date posted|posted on|posted|published)\s*(?:pada|on)?\s*:?\s*([0-9]{1,2}\s+[A-Za-z]+\.?,?\s+[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4}|\b[A-Za-z]{3,}\.?\s+[0-9]{1,2},?\s+[0-9]{4})/i,
  );
  const absoluteDate = parseHumanDate(absolute?.[1]);
  if (absoluteDate) return absoluteDate;

  if (
    /(?:diposting|dipasang|diiklankan|diperbarui|posted|updated|listed)\s*(?:pada\s*)?(?:hari ini|today|baru saja|just now)/i.test(
      region,
    )
  ) {
    return today;
  }
  if (
    /(?:diposting|dipasang|diiklankan|diperbarui|posted|updated|listed)\s*(?:pada\s*)?(?:kemarin|yesterday)/i.test(
      region,
    )
  ) {
    return addDays(today, -1);
  }

  const relativePattern =
    /(\d{1,3})\s*\+?\s*(menit|jam|hari|minggu|bulan|tahun|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|bln|mo|[mhdwy])\b\s*\+?\s*(yang\s+lalu|lalu|ago)/gi;
  for (const relative of region.matchAll(relativePattern)) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const indonesian = /lalu/i.test(relative[3]);
    const isLongUnit = /^(bulan|tahun|months?|years?|bln|mo|y)$/.test(unit);
    // "berdiri sejak 20 tahun yang lalu" bukan tanggal posting — satuan bulan/tahun
    // hanya dipercaya kalau didahului kata kunci posting.
    const prefix = region.slice(Math.max(0, (relative.index ?? 0) - 30), relative.index);
    if (
      isLongUnit &&
      !/(diposting|dipasang|diiklankan|diperbarui|ditayangkan|posted|updated|listed)/i.test(prefix)
    )
      continue;

    let days: number;
    if (/^(menit|minutes?|mins?|m|jam|hours?|hrs?)$/.test(unit)) days = 0;
    // "3h yang lalu" (ID) = 3 hari; "3h ago" (EN) = 3 jam.
    else if (unit === "h") days = indonesian ? amount : 0;
    else if (/^(hari|days?|d)$/.test(unit)) days = amount;
    else if (/^(minggu|weeks?|w)$/.test(unit)) days = amount * 7;
    else if (/^(bulan|months?|bln|mo)$/.test(unit)) days = amount * 30;
    else days = amount * 365;

    return addDays(today, -days);
  }
  return null;
}

function extractDeadline(text: string) {
  const match = text.match(
    /(?:deadline|batas (?:akhir )?(?:lamaran|pendaftaran|pengiriman|waktu)|ditutup(?: pada)?|tutup pada|closing date|close date|apply before|lamar sebelum|kirim lamaran (?:paling lambat|sebelum)|berlaku (?:hingga|sampai)|valid (?:until|through)|expires?(?: on)?)[^\n\d]{0,30}?([0-9]{1,2}\s+[A-Za-zÀ-ÿ]+\.?,?\s+[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4}|\b[A-Za-z]{3,}\.?\s+[0-9]{1,2},?\s+[0-9]{4})/i,
  );
  return parseHumanDate(match?.[1] || null);
}

/** Tanggal posting di masa depan = salah parse, abaikan. */
function validPostedDate(date: string | null, today: string) {
  if (!date || date > today) return null;
  return date;
}

/** Deadline >400 hari ke depan hampir pasti salah parse, abaikan. */
function validDeadline(date: string | null, today: string) {
  if (!date) return null;
  if (daysBetween(today, date) > 400) return null;
  return date;
}

function jakartaToday() {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function endOfDayJakarta(date: string) {
  return new Date(`${date}T23:59:59+07:00`).toISOString();
}

// ---------------------------------------------------------------------------
// AI EXTRACTION
// ---------------------------------------------------------------------------

/** Return map: index halaman di `pages` → lowongan hasil ekstraksi AI. */
async function extractJobsWithAi(pages: AssessedPage[], today: string, log: Logger) {
  const aiKey = Deno.env.get("AI_API_KEY");
  if (!aiKey) throw new Error("AI_API_KEY tidak dikonfigurasi.");

  const batches: number[][] = [];
  for (let i = 0; i < pages.length; i += AI_PAGES_PER_BATCH) {
    batches.push(pages.slice(i, i + AI_PAGES_PER_BATCH).map((_, j) => i + j));
  }

  const results = new Map<number, ExtractedJob>();
  await mapWithConcurrency(batches, AI_BATCH_CONCURRENCY, async (indexes) => {
    const jobs = await extractBatch(
      indexes.map((i) => pages[i]),
      today,
      aiKey,
      log,
    ).catch((err) => {
      log.error("ai_batch_failed", { message: err instanceof Error ? err.message : String(err) });
      return new Map<number, ExtractedJob>();
    });
    for (const [localIndex, job] of jobs) results.set(indexes[localIndex], job);
  });

  log.info("ai_extract_done", { pages: pages.length, jobs: results.size });
  return results;
}

/** Return map: index halaman di batch (0-based) → lowongan. */
async function extractBatch(
  pages: AssessedPage[],
  today: string,
  aiKey: string,
  log: Logger,
  attempt = 1,
): Promise<Map<number, ExtractedJob>> {
  const payload = pages.map((page, index) => ({
    page_id: index + 1,
    url: page.result.url,
    search_title: page.result.title || null,
    structured_job_posting: page.result.structured || null,
    content: prepareAiContent(page.text, AI_CONTENT_CHARS),
  }));

  const prompt = [
    "Kamu adalah parser lowongan kerja Indonesia yang sangat teliti.",
    `Hari ini: ${today}.`,
    `Ada ${pages.length} halaman. Kembalikan JSON valid: {"jobs":[...]} dengan TEPAT satu objek per halaman (pakai page_id yang sama).`,
    "Jangan membuat, menebak, atau menambah informasi yang tidak ada di halaman.",
    "",
    "=== FIELD ===",
    "page_id       : angka page_id dari input",
    "is_job_detail : true HANYA jika halaman adalah detail SATU lowongan spesifik. false jika halaman listing/hasil pencarian,",
    "                artikel, halaman login/consent, profil perusahaan, atau isinya tidak jelas. Jika false, field lain boleh null.",
    "is_closed     : true jika halaman menyatakan lowongan sudah ditutup/kedaluwarsa/tidak menerima lamaran.",
    "title         : Nama jabatan persis (misal 'Senior Frontend Engineer'). Tanpa nama perusahaan, kota, atau nama situs.",
    "company       : Nama perusahaan yang merekrut. null jika tidak disebut/dirahasiakan. JANGAN isi nama job board (Jobstreet, Glints, dll).",
    "location      : Kota/kabupaten (+ provinsi jika ada), misal 'Jakarta Selatan' atau 'Bandung, Jawa Barat'. 'Remote' jika full remote.",
    "posted_date   : Tanggal lowongan diposting/diperbarui, format YYYY-MM-DD. Hitung dari teks relatif (misal '3 hari yang lalu') memakai tanggal hari ini. null jika tidak ada.",
    "deadline      : Tanggal tutup lamaran YYYY-MM-DD, null jika tidak ada.",
    "description   : Gambaran peran 3-6 kalimat (maks 1000 karakter) dari halaman: tujuan peran, ruang lingkup kerja, konteks tim/perusahaan.",
    "                BUKAN salinan daftar requirements. Pisahkan paragraf dengan \\n\\n.",
    "responsibilities, requirements, qualifications, benefits : item yang eksplisit tertulis, dipisah \\n, maksimal 8 item per field. null jika tidak ada.",
    "tech_stack    : tools/teknologi yang eksplisit tertulis, pisah koma. null jika tidak ada.",
    "work_mode     : 'onsite' | 'remote' | 'hybrid' | null",
    "type          : 'full-time' | 'part-time' | 'contract' | 'internship'",
    "level         : 'entry' | 'mid' | 'senior' | 'manager' | 'director'",
    "industry      : bidang industri perusahaan jika jelas, null jika tidak",
    "salary_min, salary_max : angka bulat sesuai mata uang, null jika tidak disebutkan",
    "salary_currency: 'IDR' | 'USD' | dll, null jika tidak ada",
    "salary_period : 'monthly' | 'yearly' | null",
    "",
    "=== ATURAN ===",
    "- Pertahankan bahasa asli halaman (jangan terjemahkan) agar isi bisa diverifikasi ke sumber.",
    "- Abaikan navigasi, footer, cookie banner, dan daftar lowongan lain di halaman.",
    "- Jika informasi tidak muncul eksplisit, isi null.",
    "- Output hanya JSON, tanpa markdown.",
    "",
    "=== HALAMAN ===",
    JSON.stringify(payload),
  ].join("\n");

  const maxTokens = Math.min(4096, 400 + pages.length * 750);

  const { content, finishReason } = await callAiJson(
    "Kamu adalah parser lowongan kerja profesional. Output hanya JSON valid dan ringkas. Jangan gunakan markdown.",
    prompt,
    maxTokens,
    aiKey,
    log,
    { stage: "extract", pages: pages.length, attempt },
  );
  const parsed = parseJobsFromContent(content);
  if (parsed.recovered) log.warn("ai_parse_recovered", { attempt, jobs: parsed.jobs.length });

  const byPage = new Map<number, ExtractedJob>();
  for (const job of parsed.jobs) {
    const index = Number(job.page_id) - 1;
    if (Number.isInteger(index) && index >= 0 && index < pages.length && !byPage.has(index)) {
      byPage.set(index, job);
    }
  }

  // Respons terpotong: ulangi sekali untuk halaman yang belum terjawab.
  const missing = pages.map((_, i) => i).filter((i) => !byPage.has(i));
  if (finishReason === "length" && attempt < 2 && missing.length > 0) {
    log.warn("ai_retry_missing", { attempt: attempt + 1, pages: missing.length });
    const retried = await extractBatch(
      missing.map((i) => pages[i]),
      today,
      aiKey,
      log,
      attempt + 1,
    );
    for (const [retryIndex, job] of retried) byPage.set(missing[retryIndex], job);
  }

  return byPage;
}

/** Rapikan markdown/teks halaman untuk AI: buang gambar, link jadi teks, baris noise & duplikat. */
function prepareAiContent(text: string, maxLength: number) {
  const seen = new Set<string>();
  const lines = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 2 && !isJobContentNoise(line))
    .filter((line) => {
      const key = normalizeWords(line).slice(0, 100);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return lines.join("\n").slice(0, maxLength);
}

/** Panggil AI gateway (Sumopod) dalam mode JSON. */
async function callAiJson(
  system: string,
  prompt: string,
  maxTokens: number,
  aiKey: string,
  log: Logger,
  logData: Record<string, unknown>,
) {
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
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("ai_call_failed", { ...logData, status: res.status, body: text.slice(0, 300) });
    throw new Error("AI call gagal.");
  }

  const data = await res.json();
  const usage = data.usage || {};
  const finishReason: string | null = data.choices?.[0]?.finish_reason ?? null;
  log.info("ai_call_ok", {
    ...logData,
    model: AI_MODEL,
    latency_ms: Date.now() - t0,
    prompt_tokens: usage.prompt_tokens ?? null,
    completion_tokens: usage.completion_tokens ?? null,
    finish_reason: finishReason,
  });

  return { content: String(data.choices?.[0]?.message?.content || "{}"), finishReason };
}

// ---------------------------------------------------------------------------
// AI POLISH
// ---------------------------------------------------------------------------

/**
 * Tahap kedua: AI merapikan draft hasil ekstraksi — memindahkan item ke
 * kategori yang benar, membuang heading/lokasi/jadwal yang nyasar ke list, dan
 * merapikan kalimat. Hasilnya tetap diverifikasi ke halaman sumber; kalau AI
 * gagal, draft yang sudah tervalidasi tetap dipakai.
 */
async function polishJobsWithAi(rows: JobRow[], sourceText: Map<JobRow, string>, log: Logger) {
  const aiKey = Deno.env.get("AI_API_KEY");
  if (!aiKey || rows.length === 0) return;

  const batches: JobRow[][] = [];
  for (let i = 0; i < rows.length; i += AI_POLISH_BATCH) {
    batches.push(rows.slice(i, i + AI_POLISH_BATCH));
  }

  let polished = 0;
  await mapWithConcurrency(batches, AI_BATCH_CONCURRENCY, async (batch) => {
    try {
      const results = await polishBatch(batch, sourceText, aiKey, log);
      batch.forEach((row, index) => {
        const job = results.get(index);
        const text = sourceText.get(row);
        if (job && text && applyPolish(row, job, text)) polished++;
      });
    } catch (err) {
      log.warn("ai_polish_failed", { message: err instanceof Error ? err.message : String(err) });
    }
  });

  log.info("ai_polish_done", { rows: rows.length, polished });
}

async function polishBatch(
  rows: JobRow[],
  sourceText: Map<JobRow, string>,
  aiKey: string,
  log: Logger,
) {
  const payload = rows.map((row, index) => ({
    job_id: index + 1,
    title: row.title,
    company: row.company,
    draft: {
      description: row.description,
      responsibilities: sanitizeListItems(row.responsibilities),
      requirements: sanitizeListItems(row.requirements),
      qualifications: sanitizeListItems(row.qualifications),
      benefits: sanitizeListItems(row.benefits),
      tech_stack: row.tech_stack,
    },
    source: prepareAiContent(sourceText.get(row) || "", AI_POLISH_SOURCE_CHARS),
  }));

  const prompt = [
    "Rapikan draft data lowongan kerja berikut agar siap tampil di job board.",
    `Kembalikan JSON valid: {"jobs":[{"job_id":1,"description":"...","responsibilities":[],"requirements":[],"qualifications":[],"benefits":[],"tech_stack":[]}]} dengan TEPAT satu objek per job_id.`,
    "",
    "=== ATURAN ===",
    "- Gunakan HANYA informasi yang ada di `source`. Jangan menambah fakta baru.",
    "- Pertahankan bahasa dan kata-kata asli sumber (jangan terjemahkan/parafrase). Boleh rapikan kapitalisasi, ejaan, dan tanda baca.",
    "- Satu item = satu poin utuh. Gabungkan potongan kalimat yang terpecah, jangan memotong kalimat (misal 'Mon - Fri').",
    "- BUANG dari semua list: heading/judul section (misal '## Benefit Kerja', 'Deskripsi pekerjaan ...'), nama perusahaan, kota/lokasi/alamat,",
    "  jadwal & jam kerja, work arrangement (onsite/remote), gaji, dan tanggal.",
    "- Kelompokkan dengan benar:",
    "  responsibilities = tugas & tanggung jawab pekerjaan",
    "  requirements     = syarat wajib (pengalaman, pendidikan, skill wajib)",
    "  qualifications   = skill/kualifikasi tambahan atau nice-to-have yang bukan duplikat requirements",
    "  benefits         = fasilitas/tunjangan untuk karyawan",
    "- Satu item tidak boleh muncul di lebih dari satu list. Maksimal 8 item per list. Kalau tidak ada, isi [].",
    "- description: gambaran lengkap peran, 3-6 kalimat (400-1000 karakter) dalam 1-2 paragraf dipisah \\n\\n, tanpa markdown/daftar.",
    "  Isi: tujuan peran, ruang lingkup pekerjaan, dan konteks perusahaan/tim yang ada di sumber. Jangan sekadar menyalin requirements.",
    "- tech_stack: nama tools/teknologi saja (misal 'Vue.js', 'Nuxt.js'), maksimal 12.",
    "",
    "=== DATA ===",
    JSON.stringify(payload),
  ].join("\n");

  const { content } = await callAiJson(
    "Kamu adalah editor data lowongan kerja yang teliti. Output hanya JSON valid. Jangan gunakan markdown.",
    prompt,
    Math.min(4096, 300 + rows.length * 900),
    aiKey,
    log,
    { stage: "polish", rows: rows.length },
  );

  const parsed = parseJsonObject(content) as { jobs?: unknown };
  const results = new Map<number, PolishedJob>();
  for (const item of Array.isArray(parsed.jobs) ? parsed.jobs : []) {
    if (!item || typeof item !== "object") continue;
    const job = item as PolishedJob;
    const index = Number(job.job_id) - 1;
    if (Number.isInteger(index) && index >= 0 && index < rows.length && !results.has(index)) {
      results.set(index, job);
    }
  }
  return results;
}

/** Terapkan hasil polish ke row. Return true kalau ada field yang berubah. */
function applyPolish(row: JobRow, job: PolishedJob, text: string) {
  const before = JSON.stringify(row);

  const lists = groundedJobLists(job, text);
  for (const field of LIST_FIELDS) {
    if (job[field] === undefined) continue;
    // Item dari AI yang tidak bisa diverifikasi → pakai draft (sudah tervalidasi),
    // kecuali AI memang mengosongkan field itu (item salah kategori).
    const aiGaveItems = sanitizeListItems(job[field]).length > 0;
    const polished = lists[field] ? cleanListText(lists[field], 2000) : null;
    row[field] = polished || (aiGaveItems ? row[field] : null);
  }

  const description = cleanJobDescription(job.description || "", 2000);
  if (description.length >= 60 && isTextGrounded(description, text)) {
    row.description = description;
  }

  if (job.tech_stack !== undefined) {
    row.tech_stack = filterGroundedInlineText(job.tech_stack, text) ?? row.tech_stack;
  }

  return JSON.stringify(row) !== before;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// ROW BUILDER & VALIDATION
// ---------------------------------------------------------------------------

function buildJobRow(job: ExtractedJob, page: AssessedPage, today: string) {
  if (job.is_job_detail === false) return "not_job_detail" as const;
  if (job.is_closed === true) return "closed" as const;

  const structured = page.result.structured;
  const text = page.text;

  // Tanggal deterministik dari halaman diutamakan; tanggal dari AI hanya cadangan.
  const postedAt = page.postedAt || validPostedDate(parseHumanDate(job.posted_date), today);
  const deadline = page.deadline || validDeadline(parseHumanDate(job.deadline), today);
  const freshness = freshnessRejection(postedAt, deadline, today);
  if (freshness) return freshness;
  if (page.result.board === "other" && !postedAt && !deadline) return "undated" as const;

  const title = cleanJobTitle(structured?.title || job.title);
  const company = cleanCompanyName(structured?.company || job.company);
  if (!isValidJobTitle(title) || !company || normalizeWords(company) === normalizeWords(title))
    return "low_quality" as const;

  if (structured?.country && !/^(id|idn|indonesia)$/i.test(structured.country))
    return "foreign_location" as const;
  const workMode = normalizeWorkMode(job.work_mode) || inferWorkMode(text);
  const location = normalizeLocation(structured?.location || job.location, workMode);
  if (!location) return "foreign_location" as const;

  // Hanya isi dari AI yang bisa diverifikasi ke halaman. Fallback regex per
  // heading dibuang: sering ikut menyapu section lain (benefit, lokasi, jadwal).
  const lists = groundedJobLists(job, text);
  const responsibilities = lists.responsibilities;
  const requirements = lists.requirements;
  const qualifications = lists.qualifications;
  const benefits = lists.benefits;

  const description = buildSourceDescription(text, job.description, responsibilities);
  if (description.length < 60) return "low_quality" as const;

  const parsedSalary = parseSalaryRange(text);
  const hasGroundedSalary = Boolean(parsedSalary.min || parsedSalary.max);
  const aiCurrency = normalizeSalaryCurrency(job.salary_currency);
  const salaryMin = normalizeSalary(hasGroundedSalary ? parsedSalary.min : job.salary_min);
  const salaryMax = normalizeSalary(hasGroundedSalary ? parsedSalary.max : job.salary_max);
  const salaryCurrency = hasGroundedSalary
    ? parsedSalary.currency || "IDR"
    : aiCurrency && isSalaryCurrencyGrounded(aiCurrency, text)
      ? aiCurrency
      : "IDR";
  const hasSalary = Boolean(salaryMin || salaryMax);
  const now = new Date().toISOString();

  return {
    slug: buildSlug(title, company, primaryCity(location)),
    title,
    company,
    location,
    type: normalizeType(structured?.employmentType || job.type),
    level: normalizeLevel(job.level || title),
    industry: cleanJobText(job.industry || "", 80) || null,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: hasSalary ? salaryCurrency : "IDR",
    salary_period: hasSalary
      ? parsedSalary.period ||
        sanePeriod(normalizeSalaryPeriod(job.salary_period), salaryMax || salaryMin, salaryCurrency)
      : "monthly",
    description,
    responsibilities: cleanListText(responsibilities || "", 2000) || null,
    requirements: cleanListText(requirements || "", 2000) || null,
    qualifications: cleanListText(qualifications || "", 2000) || null,
    benefits: cleanListText(benefits || "", 1000) || null,
    tech_stack: filterGroundedInlineText(job.tech_stack, text) || extractTechStack(text),
    work_mode: workMode,
    deadline,
    posted_at: postedAt ? new Date(`${postedAt}T00:00:00+07:00`).toISOString() : null,
    expires_at: computeExpiresAt(postedAt, deadline, today),
    last_seen_at: now,
    source_url: page.result.url,
    is_active: true,
    updated_at: now,
  };
}

/**
 * Kapan lowongan otomatis disembunyikan (lihat cron deactivate_expired_job_listings):
 * deadline jika ada, kalau tidak tanggal posting + MAX_POSTED_AGE_DAYS, kalau
 * tidak ada keduanya DEFAULT_TTL_DAYS sejak terakhir terlihat.
 */
function computeExpiresAt(postedAt: string | null, deadline: string | null, today: string) {
  if (deadline) return endOfDayJakarta(deadline);
  if (postedAt) return endOfDayJakarta(addDays(postedAt, MAX_POSTED_AGE_DAYS));
  return endOfDayJakarta(addDays(today, DEFAULT_TTL_DAYS));
}

async function reuseExistingSlugs(
  admin: ReturnType<typeof getAdminClient>,
  rows: JobRow[],
  log: Logger,
) {
  const { data, error } = await admin
    .from("job_listings")
    .select("slug, title, company, source_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3000);

  if (error) {
    log.warn("existing_lookup_failed", { message: error.message });
    return;
  }

  const byKey = new Map<string, string>();
  const byUrl = new Map<string, string>();
  for (const existing of data || []) {
    byKey.set(jobIdentityKey(existing.title, existing.company), existing.slug);
    if (existing.source_url) byUrl.set(existing.source_url, existing.slug);
  }

  let reused = 0;
  for (const row of rows) {
    const slug = byUrl.get(row.source_url) || byKey.get(jobIdentityKey(row.title, row.company));
    if (slug && slug !== row.slug) {
      row.slug = slug;
      reused++;
    }
  }
  log.info("existing_slugs_reused", { reused, checked: data?.length || 0 });
}

function jobIdentityKey(title: string, company: string) {
  const companyKey = normalizeWords(company)
    .replace(/\b(pt|cv|tbk|persero|indonesia)\b/g, "")
    .replace(/\s+/g, "");
  return `${normalizeForDedup(title)}|${companyKey}`;
}

const JOB_BOARD_NAMES =
  /^(jobstreet|jobstreet indonesia|jobstreet by seek|glints|kalibrr|dealls|linkedin|indeed|glassdoor|karir com|loker id|jobs id|topkarir|seek)$/;

function cleanCompanyName(value: unknown) {
  const company = cleanJobText(value || "", 120)
    .replace(/\s*[-|–]\s*(jobstreet|glints|kalibrr|dealls|indeed|linkedin)\b.*$/i, "")
    .trim();
  const normalized = normalizeWords(company);
  if (!normalized || normalized.length < 2) return "";
  if (JOB_BOARD_NAMES.test(normalized)) return "";
  if (
    /^(tidak disebutkan|tidak diketahui|tidak ada|n a|na|null|none|unknown|hidden|various|company|perusahaan|client|klien kami|our client)$/.test(
      normalized,
    )
  )
    return "";
  // Pengiklan dirahasiakan / placeholder ("Private Advertiser", "a multinational company").
  if (
    /\b(confidential|rahasia|anonim|anonymous|private advertiser|employer provided|tidak disebutkan)\b/.test(
      normalized,
    ) ||
    /\b(a|an|sebuah)\s+(multinational|leading|well known|reputable|growing|fast growing)\b/.test(
      normalized,
    )
  )
    return "";
  return company;
}

function isValidJobTitle(title: string) {
  if (title.length < 3 || title.length > 120) return false;
  const normalized = normalizeWords(title);
  if (!normalized) return false;
  // Judul halaman pencarian, bukan jabatan.
  if (/^(lowongan|loker|lowongan kerja|cari kerja|info loker)\b/.test(normalized)) return false;
  if (/\b(jobs?|lowongan|loker)\s+(in|di|at)\b/.test(normalized)) return false;
  if (/\b\d+\s*(lowongan|loker|jobs?|results?|hasil|vacancies)\b/.test(normalized)) return false;
  if (/\bjobs$/.test(normalized)) return false;
  return true;
}

const FOREIGN_LOCATION =
  /\b(singapore|singapura|malaysia|kuala lumpur|selangor|penang|johor|philippines|filipina|manila|makati|taguig|pasig|cebu|quezon|vietnam|viet nam|ho chi minh|hanoi|ha noi|thailand|bangkok|india|bangalore|bengaluru|mumbai|taiwan|taipei|hong kong|australia|sydney|melbourne|japan|tokyo|korea|seoul|china|shanghai|beijing|shenzhen|united states|usa|united kingdom|london|dubai|uae)\b/i;

/**
 * Rapikan lokasi: buang ", Jakarta Raya" & duplikat, ganti placeholder dengan
 * "Indonesia"/"Remote". Return null untuk lokasi di luar Indonesia.
 */
function normalizeLocation(value: unknown, workMode: string | null) {
  const raw = cleanJobText(value || "", 160);
  if (/[Ạ-ỹ]|quận|phường/i.test(raw)) return null;
  if (FOREIGN_LOCATION.test(raw) && !/indonesia/i.test(raw)) return null;

  const normalized = normalizeWords(raw);
  if (/^(remote|full remote|wfh|work from home|anywhere)/.test(normalized)) return "Remote";
  if (
    !normalized ||
    /^(tidak disebutkan|tidak diketahui|on site|onsite|hybrid|wfo|n a|na|various|multiple locations|beberapa lokasi|unknown|seluruh indonesia)$/.test(
      normalized,
    )
  ) {
    return workMode === "remote" ? "Remote" : "Indonesia";
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const meaningful = parts.filter(
    (part) =>
      !/^(dki\s+)?jakarta raya$|^daerah khusus ibukota jakarta$|^indonesia$|^id$/i.test(part),
  );
  const seen = new Set<string>();
  const unique = (meaningful.length > 0 ? meaningful : parts.slice(0, 1))
    .map((part) => (/^(dki\s+)?jakarta raya$/i.test(part) ? "Jakarta" : part))
    .filter((part) => {
      const key = normalizeWords(part);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return unique.slice(0, 2).join(", ") || "Indonesia";
}

function primaryCity(location: string) {
  return location.split(",")[0].trim();
}

// ---------------------------------------------------------------------------
// SOURCE-BASED EXTRACTION HELPERS
// ---------------------------------------------------------------------------

function parseSalaryRange(text: string): SalaryRange {
  const salaryText = extractSalaryContext(text);
  if (!salaryText) {
    return { min: null, max: null, currency: null, period: null };
  }

  const source = salaryText.toLowerCase();
  const structuredPeriod = /"unitText"\s*:\s*"(YEAR|ANNUAL)/i.test(salaryText)
    ? "yearly"
    : /"unitText"\s*:\s*"MONTH/i.test(salaryText)
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
    return { min, max, currency, period: sanePeriod(structuredPeriod, max || min, currency) };
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
        period: sanePeriod(
          salaryPeriodNear(salaryText, match.index ?? 0),
          Math.max(min || 0, max || 0),
          currency,
        ),
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
    period: amount
      ? sanePeriod(salaryPeriodNear(salaryText, single?.index ?? 0), amount, currency)
      : null,
  };
}

/** Periode gaji dari baris tempat angka gaji ditemukan saja (bukan "pengalaman 2 tahun"). */
function salaryPeriodNear(text: string, index: number) {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  const lineEnd = text.indexOf("\n", index);
  const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).toLowerCase();
  if (/bulan|month|\/mo\b|\/bln/.test(line)) return "monthly";
  if (/per tahun|\/tahun|\/thn|year|annual|annum|p\.a\./.test(line)) return "yearly";
  return null;
}

/** Default bulanan; gaji IDR "tahunan" di bawah Rp36jt hampir pasti salah baca. */
function sanePeriod(period: string | null, amount: number | null, currency: string | null) {
  if (period === "yearly" && (currency || "IDR") === "IDR" && (amount || 0) < 36_000_000)
    return "monthly";
  return period || "monthly";
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
      /salary|gaji|upah|kompensasi|\brp\.?\s?\d|\bidr\b|rupiah|\busd\b|dollar|\$\s?\d|\d\s?(juta|jt)\b|million/i.test(
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

function extractSectionText(text: string, headings: string[]) {
  const normalized = text.replace(/\r/g, "\n");
  const escapedHeadings = headings.map(escapeRegExp).join("|");
  const stop =
    "responsibilities|requirements|qualifications|benefits|perks|about|company|deskripsi|kualifikasi|persyaratan|tanggung jawab|fasilitas|benefit|skills|apply|lamar|deadline";
  const pattern = new RegExp(
    `(?:^|\\n)[#*\\s]*(?:${escapedHeadings})[*\\s]*:?\\s*\\n?([\\s\\S]{80,1800}?)(?=\\n\\s*#{1,6}\\s|\\n[#*\\s]*(?:${stop})[*\\s]*:?\\s*\\n|$)`,
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
  // Ringkasan AI dipakai hanya kalau isinya bisa diverifikasi ke halaman sumber.
  if (isTextGrounded(aiDescription, sourceText)) {
    const description = cleanJobDescription(aiDescription, 2000);
    if (description.length >= 60) return description;
  }

  const sourceDescription = extractSectionText(sourceText, [
    "about the job",
    "about this role",
    "about the role",
    "ringkasan",
    "overview",
    "deskripsi pekerjaan",
    "job description",
    "the role",
  ]);
  if (sourceDescription) {
    const description = cleanJobDescription(sourceDescription, 2000);
    if (description) return description;
  }

  return responsibilities ? cleanJobDescription(responsibilities, 900) : "";
}

const LIST_FIELDS = ["responsibilities", "requirements", "qualifications", "benefits"] as const;
type ListField = (typeof LIST_FIELDS)[number];

/**
 * Ambil list dari AI, rapikan, verifikasi ke halaman sumber, dan buang item
 * yang muncul di lebih dari satu field (item pertama yang menang).
 */
function groundedJobLists(
  job: Partial<Record<ListField, string | string[] | null>>,
  sourceText: string,
): Record<ListField, string | null> {
  const seen = new Set<string>();
  const result = {} as Record<ListField, string | null>;
  for (const field of LIST_FIELDS) {
    const items = sanitizeListItems(job[field])
      .filter((item) => isTextGrounded(item, sourceText))
      .filter((item) => {
        const key = normalizeWords(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
    result[field] = items.length > 0 ? items.join("\n") : null;
  }
  return result;
}

/** Pecah list (array atau string \n) jadi item bersih tanpa markdown, bullet, atau heading. */
function sanitizeListItems(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.map(String) : String(value || "").split(/\n|•|·|;/);
  return raw
    .filter((item) => !/^\s*#{1,6}\s/.test(item)) // heading markdown, bukan isi list
    .map((item) =>
      stripAngleBrackets(decodeHtmlEntities(item))
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_`]{1,3}/g, "")
        .replace(/^\s*#{1,6}\s*/, "")
        // Bullet hanya kalau diikuti spasi, supaya "3+ years" tidak jadi "+ years".
        .replace(/^\s*(?:[-*•·+–]\s+|\d{1,2}[.)]\s+)/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((item) => item.length >= 3 && item.length <= 300)
    .filter((item) => !/:$/.test(item) && !isJobContentNoise(item));
}

function filterGroundedInlineText(value: string | string[] | null | undefined, sourceText: string) {
  const items = (Array.isArray(value) ? value.map(String) : String(value || "").split(/,|\n|;/))
    .map((item) => item.trim())
    .filter((item) => Boolean(item) && !isJobContentNoise(item))
    .filter((item) => normalizeWords(sourceText).includes(normalizeWords(item)))
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

function extractStructuredJobPosting(html: string): { text: string; job: StructuredJob | null } {
  const blocks = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );
  const parts: string[] = [];
  let job: StructuredJob | null = null;

  for (const block of blocks) {
    const jsonText = decodeHtmlEntities(block[1] || "").trim();
    const parsed = parseJsonObject(jsonText);
    const nodes = flattenStructuredNodes(parsed);
    for (const node of nodes) {
      if (!isJobPostingNode(node)) continue;
      parts.push(structuredJobToText(node));
      job ??= structuredJobFields(node);
    }
  }

  return { text: parts.join("\n\n"), job };
}

function structuredJobFields(node: Record<string, unknown>): StructuredJob {
  const hiring = node.hiringOrganization;
  const company =
    typeof hiring === "string" ? hiring : (hiring as Record<string, unknown> | undefined)?.name;

  const locations = Array.isArray(node.jobLocation) ? node.jobLocation : [node.jobLocation];
  const address = ((locations[0] as Record<string, unknown> | undefined)?.address || {}) as Record<
    string,
    unknown
  >;
  const country =
    typeof address.addressCountry === "string"
      ? address.addressCountry
      : ((address.addressCountry as Record<string, unknown> | undefined)?.name as
          | string
          | undefined);
  const isRemote = String(node.jobLocationType || "").toUpperCase() === "TELECOMMUTE";
  const location = isRemote
    ? "Remote"
    : [address.addressLocality, address.addressRegion].filter(Boolean).map(String).join(", ");

  const employmentType = Array.isArray(node.employmentType)
    ? node.employmentType.join(", ")
    : node.employmentType;

  return {
    title: node.title ? stripHtml(String(node.title)).trim() : null,
    company: company ? String(company) : null,
    location: location || null,
    country: !isRemote && country ? String(country) : null,
    datePosted: node.datePosted ? String(node.datePosted) : null,
    validThrough: node.validThrough ? String(node.validThrough) : null,
    employmentType: employmentType ? String(employmentType) : null,
  };
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
      `Date posted: ${node.datePosted || ""}`,
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

function normalizeType(value?: string | null) {
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
    clean.includes("intern") ||
    clean.includes("graduate")
  )
    return "entry";
  return "mid";
}

function normalizeWorkMode(value?: string | null) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("hybrid") || clean.includes("wfo/wfh")) return "hybrid";
  if (clean.includes("remote") || clean.includes("wfh") || clean.includes("work from home"))
    return "remote";
  if (clean.includes("flexible") || clean.includes("fleksibel")) return "hybrid";
  if (clean.includes("onsite") || clean.includes("on-site") || clean.includes("wfo"))
    return "onsite";
  return null;
}

function normalizeSalaryPeriod(value?: string | null) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("year") || clean.includes("tahun") || clean.includes("annual"))
    return "yearly";
  return "monthly";
}

function normalizeSalary(value?: number | null) {
  if (!Number.isFinite(Number(value))) return null;
  const salary = Math.round(Number(value));
  return salary > 0 ? salary : null;
}

function buildSlug(...parts: string[]) {
  const base = parts
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const hash = hashString(parts.join("|").toLowerCase()).toString(36).slice(0, 8);
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
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 60);
}

function normalizeWords(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
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
  if (record.page_id === undefined || record.page_id === null) return null;
  return record as unknown as ExtractedJob;
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

function cleanJobTitle(value: unknown) {
  const title = stripAngleBrackets(String(value || ""))
    .replace(/\s+/g, " ")
    .trim()
    // Timestamp relatif di awal (misal: "2 hari yang lalu Backend Developer")
    .replace(/^\d+\s+(?:menit|jam|hari|minggu|bulan|tahun)\s+yang\s+lalu\s*/i, "")
    .replace(/^image\s+\d+\s*/i, "")
    .replace(/^#+\s*/, "")
    // Prefix iklan: "Lowongan Kerja Data Analyst", "Hiring: Data Analyst"
    .replace(
      /^(?:lowongan kerja|lowongan|loker|we are hiring|hiring|dibutuhkan|urgent(?:ly)? (?:hiring|needed))\s*[:\-–]?\s+/i,
      "",
    )
    // Suffix sumber/perusahaan: "Backend Developer | Jobstreet", "... di PT ABC"
    .replace(/\s*[|–-]\s*(?:linkedin|jobstreet|glints|kalibrr|dealls|indeed)\b.*$/i, "")
    .replace(/\s+(?:di|at)\s+(?:pt|cv)\.?\s.*$/i, "")
    .trim()
    .slice(0, 120);

  return isShouting(title) ? toTitleCase(title) : title;
}

function isShouting(value: string) {
  const letters = value.replace(/[^A-Za-z]/g, "");
  return letters.length > 6 && letters === letters.toUpperCase();
}

/** "FULL-STACK DEVELOPER (PHP)" → "Full-Stack Developer (PHP)"; akronim ≤3 huruf tetap kapital. */
function toTitleCase(value: string) {
  return value.replace(/[A-Za-z]+/g, (word) =>
    word.length <= 3 && word === word.toUpperCase() && !/^(AND|THE|DAN|DI|OF|FOR)$/.test(word)
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}

function cleanJobText(value: unknown, maxLength: number) {
  return stripAngleBrackets(String(value || ""))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\d+\s+(?:menit|jam|hari|minggu|bulan|tahun)\s+yang\s+lalu\s*/gi, "")
    .replace(/^Image\s+\d+\s*/gi, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Seperti cleanJobText tapi mempertahankan jeda paragraf (\n\n). */
function cleanJobDescription(value: unknown, maxLength: number) {
  const description = String(value || "")
    .replace(/\r/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => cleanJobText(paragraph, maxLength))
    .filter((paragraph) => paragraph && !isJobContentNoise(paragraph))
    .join("\n\n")
    .slice(0, maxLength)
    .trim();
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
  return stripAngleBrackets(decodeHtmlEntities(String(value || "")))
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim())
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

/**
 * SECURITY (defense in depth): scraped text is rendered on public job pages
 * (incl. JSON-LD). decodeHtmlEntities turns "&lt;" back into "<", so strip
 * angle brackets from every stored text field.
 */
function stripAngleBrackets(value: string) {
  return value.replace(/[<>]/g, " ");
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

/**
 * Cron auth: compare the x-cron-secret header with JOB_SEARCH_CRON_SECRET
 * (edge function secret). Falls back to the Vault RPC (service_role only) when
 * the env var is not configured. Constant-time comparison; fails closed when
 * either side is missing or shorter than 16 characters.
 */
async function isValidCronRequest(req: Request, admin: ReturnType<typeof getAdminClient>) {
  const providedSecret = req.headers.get("x-cron-secret");
  if (!providedSecret) return false;

  let expectedSecret = Deno.env.get("JOB_SEARCH_CRON_SECRET") || "";
  if (!expectedSecret) {
    const { data, error } = await admin.rpc("get_job_search_cron_secret");
    if (error || typeof data !== "string") return false;
    expectedSecret = data;
  }
  if (expectedSecret.length < 16) return false;

  return await timingSafeEqualStrings(providedSecret, expectedSecret);
}

/** Constant-time string comparison (hash both sides so length is not leaked). */
async function timingSafeEqualStrings(a: string, b: string) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
