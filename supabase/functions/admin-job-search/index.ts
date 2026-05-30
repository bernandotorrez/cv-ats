import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type SearchSource = "linkedin" | "jobstreet" | "glints" | "kalibrr" | "google";

type SearchResult = {
  title: string;
  url: string;
  content: string;
  source: string;
  original_content?: string;
  original_content_source?: "tavily_extract" | "direct_fetch";
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

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const AI_MODEL = "gemini/gemini-2.5-flash-lite";
const DEFAULT_SOURCES: SearchSource[] = ["linkedin", "jobstreet", "glints", "kalibrr"];

// ---------------------------------------------------------------------------
// LOGGER — structured, timestamped, dengan request ID untuk tracing
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

// Domain patterns untuk setiap sumber — lebih luas agar tidak terlalu restrictif
const SOURCE_DOMAINS: Record<SearchSource, string[]> = {
  linkedin: ["linkedin.com/jobs", "linkedin.com/in"],
  jobstreet: ["jobstreet.co.id", "jobstreet.com"],
  glints: ["glints.com/id/opportunities/jobs", "glints.com"],
  kalibrr: ["kalibrr.com"],
  google: [],
};

// Query template per sumber agar lebih relevan
const SOURCE_QUERY_SUFFIXES: Record<SearchSource, string> = {
  linkedin: "lowongan kerja terbaru",
  jobstreet: "loker terbaru",
  glints: "lowongan",
  kalibrr: "job vacancy",
  google: "lowongan kerja Indonesia 2024 2025",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  // Buat request ID unik untuk tracing semua log dalam 1 request
  const requestId = crypto.randomUUID().slice(0, 8);
  // Logger dibuat sementara sebelum query tersedia
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

    // Buat ulang logger dengan query yang sudah diketahui
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
      log.error("search_empty", { reason: "no search provider configured" });
      return json(
        req,
        {
          error:
            "Search provider belum dikonfigurasi. Tambahkan TAVILY_API_KEY, SERPAPI_API_KEY, atau BRAVE_SEARCH_API_KEY di Supabase secrets.",
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
    const rows = extractedJobs.map((job) => toJobRow(job, query, location)).filter(Boolean);
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
  const perSource = Math.max(4, Math.ceil((limit * 2) / sources.length));
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

  const seen = new Set<string>();
  const seenTitles = new Set<string>();
  const sourceCounts: Record<string, number> = {};

  const filtered = batches
    .flat()
    .filter((result) => {
      if (!result.url || seen.has(result.url)) return false;
      const titleKey = normalizeForDedup(result.title);
      if (titleKey.length > 5 && seenTitles.has(titleKey)) return false;
      seen.add(result.url);
      if (titleKey.length > 5) seenTitles.add(titleKey);
      sourceCounts[result.source] = (sourceCounts[result.source] || 0) + 1;
      return true;
    })
    .slice(0, Math.max(limit * 3, 24));

  log.info("search_collected", {
    raw: batches.flat().length,
    after_dedup: filtered.length,
    by_source: sourceCounts,
  });

  return filtered;
}

/**
 * Buat beberapa variasi query untuk mendapatkan hasil yang lebih beragam.
 * Contoh: "data analyst Jakarta" → juga cari "data analyst remote", "analis data Indonesia"
 */
function buildQueryVariants(query: string, location: string) {
  const variants = [{ query, location }];

  // Tambah varian lokasi: jika ada kota spesifik, tambah juga "remote"
  if (!location.toLowerCase().includes("remote")) {
    variants.push({ query, location: `${location} OR remote` });
  }

  // Tambah varian Indonesia jika lokasi sangat spesifik
  if (location.toLowerCase() !== "indonesia" && !location.toLowerCase().includes("indonesia")) {
    variants.push({ query, location: "Indonesia" });
  }

  return variants.slice(0, 2); // Maksimal 2 varian agar tidak terlalu banyak request
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
        include_raw_content: false,
      }),
    });
    if (!res.ok) throw new Error(`Tavily search gagal: ${res.status}`);
    const data = await res.json();
    const results = (data.results || []).map((item: any) => ({
      title: String(item.title || ""),
      url: String(item.url || ""),
      content: String(item.content || ""),
      source,
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
    const data = await res.json();
    const results = (data.organic_results || []).slice(0, limit).map((item: any) => ({
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
    const data = await res.json();
    const results = (data.web?.results || []).slice(0, limit).map((item: any) => ({
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
// ENRICHMENT — ambil konten halaman asli
// ---------------------------------------------------------------------------

async function enrichSearchResults(results: SearchResult[], limit: number, log: Logger) {
  const enrichLimit = Math.min(results.length, Math.max(limit * 2, 20));
  const targets = results.slice(0, enrichLimit);
  const extracted = await extractSourcePages(targets, log);

  return results.map((result) => {
    const page = extracted.get(result.url);
    if (!page) return result;
    return {
      ...result,
      original_content: page.content,
      original_content_source: page.source,
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
            const content = cleanContent(item.raw_content || item.content || "", 10000);
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
    const text = cleanContent(stripHtml(html), 8000);
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
// AI EXTRACTION — lebih detail, lebih banyak field
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

  const allJobs = batches.flat();
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
) {
  const modeNote =
    mode === "rich"
      ? "Konten halaman lengkap tersedia di field original_content — ekstrak detail sebanyak mungkin."
      : "Gunakan snippet dan judul untuk mengekstrak informasi. Lebih ringkas tapi tetap akurat.";

  const prompt = [
    "Kamu adalah parser lowongan kerja Indonesia yang sangat teliti.",
    'Ekstrak semua lowongan pekerjaan dari data berikut dan kembalikan JSON valid: {"jobs":[...]}',
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
    "description   : 4-6 kalimat menjelaskan scope kerja, tim, dan konteks bisnis perusahaan",
    "responsibilities: Daftar tanggung jawab utama, tiap item dipisah newline (\\n), 4-8 poin",
    "requirements  : Daftar requirement wajib (pengalaman, pendidikan, sertifikasi), tiap item dipisah \\n",
    "qualifications: Daftar skill/kompetensi yang dicari, tiap item dipisah \\n",
    "benefits      : Fasilitas/benefit (asuransi, bonus, WFH, dll), tiap item dipisah \\n",
    "tech_stack    : Tools/teknologi spesifik (misal: 'React, TypeScript, PostgreSQL'), pisah dengan koma",
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
    "- Jangan mengarang company atau posisi yang tidak ada di sumber",
    "- Jika company tidak jelas, gunakan domain URL sebagai petunjuk",
    "- Jika halaman adalah listing umum (bukan detail 1 lowongan), ekstrak semua yang ada",
    "- Tulis dalam Bahasa Indonesia yang natural dan profesional",
    `- ${modeNote}`,
    "",
    `Keyword: ${query}`,
    `Target lokasi: ${location}`,
    `Maksimal job: ${limit}`,
    "",
    "=== DATA SUMBER ===",
    JSON.stringify(
      results.slice(0, Math.max(limit * 2, 8)).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 400),
        full_content: r.original_content?.slice(0, 6000) || null,
      })),
      null,
      2,
    ),
  ].join("\n");

  const t0 = Date.now();
  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.15,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah parser lowongan kerja profesional. Output harus JSON valid saja, tanpa markdown, tanpa komentar. Ekstrak sebanyak mungkin lowongan yang valid.",
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
  log.info("ai_call_ok", {
    mode,
    latency_ms: Date.now() - t0,
    prompt_tokens: usage.prompt_tokens ?? null,
    completion_tokens: usage.completion_tokens ?? null,
    total_tokens: usage.total_tokens ?? null,
    finish_reason: data.choices?.[0]?.finish_reason ?? null,
  });

  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = parseJsonObject(content);
  const jobs = Array.isArray(parsed.jobs) ? (parsed.jobs as ExtractedJob[]).slice(0, limit) : [];

  if (!Array.isArray(parsed.jobs)) {
    log.warn("ai_parse_unexpected", { mode, content_preview: content.slice(0, 200) });
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// ROW BUILDER — tambah field baru
// ---------------------------------------------------------------------------

function toJobRow(job: ExtractedJob, fallbackQuery: string, fallbackLocation: string) {
  const title = cleanText(job.title || fallbackQuery, 120);
  const company = cleanText(job.company || "", 120);
  const location = cleanText(job.location || fallbackLocation, 120);
  const description = cleanText(job.description || "", 2000); // Naikkan batas

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
    // Field baru — pastikan kolom ini ada di tabel job_listings kamu
    salary_currency: cleanText(job.salary_currency || "", 10) || "IDR",
    salary_period: normalizeSalaryPeriod(job.salary_period),
    description,
    responsibilities: cleanText(job.responsibilities || "", 2000) || null,
    requirements: cleanText(job.requirements || "", 2000) || null,
    qualifications: cleanText(job.qualifications || "", 2000) || null,
    benefits: cleanText(job.benefits || "", 1000) || null,
    tech_stack: cleanText(job.tech_stack || "", 500) || null,
    work_mode: normalizeWorkMode(job.work_mode),
    deadline: parseDeadline(job.deadline),
    source_url: cleanUrl(job.source_url),
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// HELPERS — normalisasi & utilitas
// ---------------------------------------------------------------------------

function buildSourceQuery(query: string, location: string, source: SearchSource) {
  const domains = SOURCE_DOMAINS[source];
  const suffix = SOURCE_QUERY_SUFFIXES[source];
  const base = `${query} ${location} ${suffix}`;

  if (domains.length === 0) return base;
  if (domains.length === 1) return `${base} site:${domains[0]}`;
  // Untuk sumber dengan domain utama, cukup gunakan yang pertama
  return `${base} site:${domains[0]}`;
}

function normalizeSources(value: unknown): SearchSource[] {
  if (!Array.isArray(value)) return DEFAULT_SOURCES;
  const allowed = new Set<SearchSource>(["linkedin", "jobstreet", "glints", "kalibrr", "google"]);
  const sources = value.filter((s): s is SearchSource => allowed.has(s as SearchSource));
  return sources.length > 0 ? sources : DEFAULT_SOURCES;
}

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
  return "monthly"; // Default ke monthly untuk Indonesia
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

/**
 * Normalisasi string untuk keperluan deduplication.
 * Hapus karakter non-alfanumerik dan ubah ke lowercase.
 */
function normalizeForDedup(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 60);
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

function cleanContent(value: unknown, maxLength: number) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
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
