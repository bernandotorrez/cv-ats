/**
 * tryout-generate-questions — Generate soal tryout SKD menggunakan AI.
 *
 * Admin only. Menggunakan AI gateway yang sama dengan fitur lain (sumopod + deepseek).
 *
 * Body:
 * - exam_set_id: UUID (wajib)
 * - subtest: 'twk' | 'tiu' | 'tkp' (wajib)
 * - count: number bulat (1-30, default 10)
 * - category: string (opsional, maks 60 karakter, misal "Pilar Negara", "Numerik - Deret Angka")
 * - difficulty: 'easy' | 'medium' | 'hard' (default 'medium')
 *
 * Alur:
 * 1. Kisi-kisi: bila kategori tidak diisi, kuota per kategori resmi (blueprint BKN) diberikan
 *    ke kategori yang paling sedikit terisi di set ini (category balancing).
 * 2. Over-generate: AI diminta ~1.3x jumlah soal, lalu divalidasi struktural (cleanQuestion).
 * 3. Filter near-duplicate (Jaccard token ≥ 0.8) terhadap soal subtes yang sama di semua set
 *    dan antar soal dalam batch.
 * 4. Verifikasi: panggilan AI kedua (temperature 0) sebagai reviewer independen yang
 *    mengerjakan soal TANPA kunci. Soal yang kuncinya tidak cocok / ambigu / bermasalah
 *    faktual dibuang. Bila verifier gagal, soal yang lolos validasi struktural tetap dipakai
 *    dan respons berisi `verified: false`.
 * 5. Kunci jawaban diacak merata (permutasi opsi dengan crypto.getRandomValues).
 *
 * Catatan:
 * - Penomoran soal GLOBAL per set (startNumber = nomor terakhir + 1). Urutan tampil saat ujian
 *   diurutkan per subtes lalu question_number, jadi urutan nomor antar subtes tidak masalah.
 * - Setelah insert, total_questions pada exam set disinkronkan ke jumlah aktual.
 * - Pesan error internal (DB/AI) hanya di-log di server, tidak dikirim ke client.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { AI_MODEL, getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";

/** Batas request per admin (in-memory, per instance). Generate set lengkap ≈ 12-18 request. */
const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const MAX_COUNT = 30;
const DEFAULT_COUNT = 10;
/** Batas atas jumlah soal yang diminta ke AI per panggilan (menjaga output < max_tokens). */
const MAX_GENERATE = 32;
const OVERGENERATE_RATIO = 1.3;

/** Timeout per panggilan AI. */
const AI_TIMEOUT_MS = 120_000;
/**
 * Anggaran waktu total request (wall clock edge function Supabase ±150 detik di plan free).
 * Verifier hanya dijalankan bila sisa anggaran masih cukup. Bisa dinaikkan via secret
 * TRYOUT_GENERATE_BUDGET_MS untuk plan dengan batas lebih longgar.
 */
const TOTAL_BUDGET_MS = Number(Deno.env.get("TRYOUT_GENERATE_BUDGET_MS")) || 140_000;
const MIN_VERIFY_MS = 15_000;

const DUPLICATE_THRESHOLD = 0.8;
const EXISTING_FETCH_LIMIT = 2000;
const PAGE_SIZE = 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Subtest = "twk" | "tiu" | "tkp";
type Difficulty = "easy" | "medium" | "hard";

const SUBTESTS: readonly Subtest[] = ["twk", "tiu", "tkp"];
const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

type GenerateBody = {
  exam_set_id?: unknown;
  subtest?: unknown;
  count?: unknown;
  category?: unknown;
  difficulty?: unknown;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Kisi-kisi resmi (blueprint) per subtes
 * ──────────────────────────────────────────────────────────────────────────── */

type BlueprintCategory = {
  name: string;
  /** Deskripsi cakupan materi untuk prompt. */
  desc: string;
  /** Kata kunci (sudah dinormalisasi) untuk memetakan kategori bebas/lama ke kategori resmi. */
  aliases: string[];
};

const BLUEPRINT: Record<Subtest, BlueprintCategory[]> = {
  twk: [
    {
      name: "Nasionalisme",
      desc: "semangat kebangsaan, cinta tanah air, sejarah pergerakan dan perjuangan nasional",
      aliases: ["nasionalisme", "sejarah", "peristiwa bersejarah", "kebangsaan"],
    },
    {
      name: "Integritas",
      desc: "kejujuran, antikorupsi, etika dan kode etik ASN, konsistensi nilai",
      aliases: ["integritas", "antikorupsi", "anti korupsi", "etika"],
    },
    {
      name: "Bela Negara",
      desc: "hak dan kewajiban bela negara, ketahanan nasional, ancaman terhadap negara",
      aliases: ["bela negara", "ketahanan nasional"],
    },
    {
      name: "Pilar Negara",
      desc: "Pancasila, UUD NRI 1945 (pasal hasil amandemen), NKRI, Bhinneka Tunggal Ika",
      aliases: ["pilar negara", "pancasila", "uud", "nkri", "bhinneka", "konstitusi"],
    },
    {
      name: "Bahasa Negara",
      desc: "kedudukan dan fungsi bahasa Indonesia, Sumpah Pemuda, UU No. 24 Tahun 2009, kaidah bahasa baku",
      aliases: ["bahasa negara", "bahasa indonesia", "bahasa"],
    },
  ],
  tiu: [
    {
      name: "Verbal - Analogi",
      desc: "hubungan antarkata (A : B = C : ?), dengan relasi yang jelas dan sesuai KBBI",
      aliases: ["analogi"],
    },
    {
      name: "Verbal - Silogisme",
      desc: "penarikan kesimpulan yang sah dari dua premis atau lebih",
      aliases: ["silogisme", "logis", "logika"],
    },
    {
      name: "Verbal - Analitis",
      desc: "penalaran analitis (urutan posisi, jadwal, penempatan) dari beberapa syarat dalam teks",
      aliases: ["analitis", "analisis"],
    },
    {
      name: "Numerik - Berhitung",
      desc: "operasi hitung, pecahan, persen, pangkat, akar",
      aliases: ["berhitung", "hitung", "aritmetika", "aritmatika"],
    },
    {
      name: "Numerik - Deret Angka",
      desc: "pola barisan/deret angka dengan satu pola yang konsisten",
      aliases: ["deret", "barisan"],
    },
    {
      name: "Numerik - Perbandingan Kuantitatif",
      desc: "membandingkan nilai P dan Q (opsi seperti P > Q, P < Q, P = Q, hubungan tidak dapat ditentukan)",
      aliases: ["perbandingan kuantitatif", "kuantitatif", "perbandingan"],
    },
    {
      name: "Numerik - Soal Cerita",
      desc: "aritmetika sosial, kecepatan-jarak-waktu, pekerjaan bersama, umur, campuran",
      aliases: ["soal cerita", "cerita"],
    },
    {
      name: "Figural",
      desc: "pola/serial huruf, angka, atau simbol yang ditulis sebagai teks (tanpa gambar)",
      aliases: ["figural", "pola", "serial"],
    },
  ],
  tkp: [
    {
      name: "Pelayanan Publik",
      desc: "sikap melayani masyarakat secara ramah, cepat, adil, dan sesuai prosedur",
      aliases: ["pelayanan publik", "pelayanan"],
    },
    {
      name: "Jejaring Kerja",
      desc: "membangun dan memanfaatkan relasi kerja, kolaborasi lintas unit/instansi",
      aliases: ["jejaring kerja", "jejaring", "kerja sama", "kolaborasi"],
    },
    {
      name: "Sosial Budaya",
      desc: "adaptasi dan menghargai keberagaman suku, agama, budaya di lingkungan kerja/masyarakat",
      aliases: ["sosial budaya", "sosial", "budaya"],
    },
    {
      name: "Teknologi Informasi dan Komunikasi",
      desc: "pemanfaatan TIK untuk efektivitas kerja, keamanan data, adaptasi teknologi baru",
      aliases: ["teknologi informasi", "teknologi", "tik"],
    },
    {
      name: "Profesionalisme",
      desc: "tanggung jawab, disiplin, kompetensi, dan integritas dalam menjalankan tugas",
      aliases: ["profesionalisme", "profesional", "integritas"],
    },
    {
      name: "Anti Radikalisme",
      desc: "sikap terhadap paham radikal, intoleransi, dan ujaran kebencian",
      aliases: ["anti radikalisme", "antiradikalisme", "radikal"],
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
 * Handler
 * ──────────────────────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  const startedAt = Date.now();

  try {
    const requesterId = await getUserId(req);
    const admin = getAdminClient();

    // Validasi admin
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      return json(req, { error: "Forbidden: hanya admin." }, 403);
    }

    // Rate limit per admin (setelah cek admin supaya non-admin tidak menghabiskan kuota)
    const rl = checkRateLimit(
      `tryout-generate-questions:${requesterId}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({
          error: "Terlalu banyak request generate soal. Silakan coba lagi nanti.",
        }),
        corsHeaders(req),
      );
    }

    // ── Validasi input ──
    const body = (await req.json().catch(() => ({}))) as GenerateBody;
    if (!body || typeof body !== "object") {
      return json(req, { error: "Body request tidak valid." }, 400);
    }

    const examSetId = typeof body.exam_set_id === "string" ? body.exam_set_id.trim() : "";
    if (!examSetId) {
      return json(req, { error: "exam_set_id wajib diisi." }, 400);
    }
    if (!UUID_RE.test(examSetId)) {
      return json(req, { error: "exam_set_id tidak valid." }, 400);
    }

    const subtest = body.subtest as Subtest;
    if (typeof body.subtest !== "string" || !SUBTESTS.includes(subtest)) {
      return json(req, { error: "subtest harus twk, tiu, atau tkp." }, 400);
    }

    const count = parseCount(body.count);

    let difficulty: Difficulty = "medium";
    if (body.difficulty !== undefined && body.difficulty !== null && body.difficulty !== "") {
      if (
        typeof body.difficulty !== "string" ||
        !DIFFICULTIES.includes(body.difficulty as Difficulty)
      ) {
        return json(req, { error: "difficulty harus easy, medium, atau hard." }, 400);
      }
      difficulty = body.difficulty as Difficulty;
    }

    let requestedCategory = "";
    if (body.category !== undefined && body.category !== null) {
      if (typeof body.category !== "string") {
        return json(req, { error: "Kategori tidak valid." }, 400);
      }
      requestedCategory = sanitizeLine(body.category);
      if (requestedCategory.length > 60) {
        return json(req, { error: "Kategori maksimal 60 karakter." }, 400);
      }
    }
    // Kategori dari admin dipetakan ke nama resmi kisi-kisi bila cocok
    const fixedCategory = requestedCategory
      ? canonicalCategory(subtest, requestedCategory) || requestedCategory
      : "";

    const aiKey = Deno.env.get("AI_API_KEY");
    if (!aiKey) {
      console.error("tryout-generate-questions: AI_API_KEY tidak dikonfigurasi");
      return json(req, { error: "Layanan AI belum dikonfigurasi." }, 500);
    }

    // Cek exam set exists
    const { data: examSet, error: examSetErr } = await admin
      .from("tryout_exam_sets")
      .select("id, name")
      .eq("id", examSetId)
      .maybeSingle();
    if (examSetErr) {
      console.error("tryout-generate-questions: gagal membaca exam set:", examSetErr);
      return json(req, { error: "Terjadi kesalahan pada server." }, 500);
    }
    if (!examSet) {
      return json(req, { error: "Exam set tidak ditemukan." }, 404);
    }

    // Data pendukung: nomor terakhir (GLOBAL per set), kategori subtes di set ini,
    // dan soal subtes yang sama di semua set (untuk anti-duplikat).
    const [lastQRes, setCategoryRes, existingQuestions] = await Promise.all([
      admin
        .from("tryout_questions")
        .select("question_number")
        .eq("exam_set_id", examSetId)
        .order("question_number", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("tryout_questions")
        .select("category")
        .eq("exam_set_id", examSetId)
        .eq("subtest", subtest),
      fetchExistingQuestions(admin, subtest),
    ]);
    if (lastQRes.error) {
      console.error("tryout-generate-questions: gagal membaca nomor soal:", lastQRes.error);
      return json(req, { error: "Terjadi kesalahan pada server." }, 500);
    }
    if (setCategoryRes.error) {
      console.warn("tryout-generate-questions: gagal membaca kategori set:", setCategoryRes.error);
    }

    const startNumber = lastQRes.data ? Number(lastQRes.data.question_number) + 1 : 1;

    // Hitung keterisian kategori resmi di set ini (untuk balancing)
    const existingCategoryCounts = new Map<string, number>();
    for (const c of BLUEPRINT[subtest]) existingCategoryCounts.set(c.name, 0);
    for (const row of (setCategoryRes.data || []) as Array<{ category: string | null }>) {
      const canon = canonicalCategory(subtest, row.category || "");
      if (canon) existingCategoryCounts.set(canon, (existingCategoryCounts.get(canon) || 0) + 1);
    }

    // Daftar soal untuk instruksi "jangan diulang" di prompt (set ini didahulukan)
    const dontRepeat = [
      ...existingQuestions.filter((q) => q.exam_set_id === examSetId),
      ...existingQuestions.filter((q) => q.exam_set_id !== examSetId),
    ]
      .map((q) => stripHtml(q.question_text).replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 150);

    // ── 1. Generate (over-generate) ──
    const generateCount = Math.max(
      count,
      Math.min(MAX_GENERATE, Math.ceil(count * OVERGENERATE_RATIO)),
    );
    const quota = fixedCategory
      ? null
      : allocateQuota(
          BLUEPRINT[subtest].map((c) => c.name),
          existingCategoryCounts,
          generateCount,
        );

    const prompt = buildPrompt({
      subtest,
      count: generateCount,
      fixedCategory,
      quota,
      difficulty,
      dontRepeat,
    });

    let genContent: string;
    try {
      genContent = await callAi(aiKey, {
        system: SYSTEM_PROMPT,
        user: prompt,
        temperature: 0.7,
        maxTokens: 8192,
        timeoutMs: AI_TIMEOUT_MS,
      });
    } catch (err) {
      console.error("tryout-generate-questions: panggilan AI generate gagal:", errMessage(err));
      return json(req, { error: "Gagal generate soal dari AI. Silakan coba lagi." }, 502);
    }

    const rawQuestions = parseQuestions(genContent);
    const structurallyValid = rawQuestions
      .map((q) => cleanQuestion(q, subtest))
      .filter((q): q is CleanQuestion => q !== null);
    const skipped = rawQuestions.length - structurallyValid.length;
    if (rawQuestions.length === 0) {
      // Konten mentah AI hanya di-log (dipotong), tidak dikirim ke client
      console.error(
        "tryout-generate-questions: output AI tidak bisa di-parse:",
        genContent.slice(0, 1000),
      );
    } else if (skipped > 0) {
      console.warn(`tryout-generate-questions: ${skipped} soal AI tidak valid dibuang`);
    }

    // Normalisasi kategori ke nama resmi kisi-kisi
    for (const q of structurallyValid) {
      q.category = fixedCategory || canonicalCategory(subtest, q.category || "") || q.category;
    }

    // ── 2. Filter near-duplicate (vs soal subtes yang sama di semua set + antar batch) ──
    const seenTokenSets = existingQuestions.map((q) => tokenSet(q.question_text));
    const unique: CleanQuestion[] = [];
    let duplicates = 0;
    for (const q of structurallyValid) {
      const tokens = tokenSet(q.question_text);
      if (seenTokenSets.some((s) => jaccard(tokens, s) >= DUPLICATE_THRESHOLD)) {
        duplicates++;
        continue;
      }
      seenTokenSets.push(tokens);
      unique.push(q);
    }
    if (duplicates > 0) {
      console.warn(`tryout-generate-questions: ${duplicates} soal near-duplicate dibuang`);
    }

    // ── 3. Verifikasi oleh reviewer AI independen ──
    let accepted = unique;
    let rejectedByReview = 0;
    let verified = false;
    if (unique.length > 0) {
      const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
      const verifyTimeout = Math.min(AI_TIMEOUT_MS, remaining - 10_000);
      if (verifyTimeout < MIN_VERIFY_MS) {
        console.warn(
          "tryout-generate-questions: waktu tidak cukup untuk verifikasi, soal disimpan tanpa verifikasi",
        );
      } else {
        const review = await verifyQuestions(aiKey, subtest, unique, verifyTimeout);
        if (review) {
          verified = true;
          accepted = review.accepted;
          rejectedByReview = review.rejected;
          if (rejectedByReview > 0) {
            console.warn(`tryout-generate-questions: ${rejectedByReview} soal ditolak reviewer AI`);
          }
        }
      }
    }

    // ── 4. Ambil `count` soal (seimbang per kategori bila tanpa kategori admin) ──
    const picked = fixedCategory
      ? accepted.slice(0, count)
      : pickBalanced(accepted, count, existingCategoryCounts);

    if (picked.length === 0) {
      return json(
        req,
        {
          error: "AI tidak menghasilkan soal yang lolos validasi. Silakan coba lagi.",
          skipped,
          rejected_by_review: rejectedByReview,
          duplicates,
          verified,
        },
        502,
      );
    }

    // ── 5. Acak posisi opsi agar kunci jawaban tersebar merata ──
    const finalQuestions = picked.map(shuffleOptions);

    // Insert ke database
    const rows = finalQuestions.map((q, idx) => ({
      exam_set_id: examSetId,
      subtest,
      question_number: startNumber + idx,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      scores: q.scores,
      explanation: q.explanation,
      category: q.category,
      difficulty,
    }));

    const { data: inserted, error: insertErr } = await admin
      .from("tryout_questions")
      .insert(rows)
      .select("id, question_number, question_text");

    if (insertErr) {
      console.error("tryout-generate-questions: insert error:", insertErr);
      return json(req, { error: "Gagal menyimpan soal ke database." }, 500);
    }

    // Sinkronkan total_questions pada exam set dengan jumlah aktual
    const { count: actualCount } = await admin
      .from("tryout_questions")
      .select("id", { count: "exact", head: true })
      .eq("exam_set_id", examSetId);
    if (typeof actualCount === "number") {
      await admin
        .from("tryout_exam_sets")
        .update({ total_questions: actualCount })
        .eq("id", examSetId);
    }

    return json(req, {
      success: true,
      generated: inserted?.length || 0,
      skipped,
      rejected_by_review: rejectedByReview,
      duplicates,
      verified,
      start_number: startNumber,
      questions: inserted,
    });
  } catch (error) {
    const message = errMessage(error);
    console.error("tryout-generate-questions error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Unauthorized" }, 401);
    }
    return json(req, { error: "Terjadi kesalahan pada server." }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** count harus bilangan bulat terbatas; selain itu pakai default. Dibatasi 1..MAX_COUNT. */
function parseCount(raw: unknown): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return DEFAULT_COUNT;
  return Math.min(MAX_COUNT, Math.max(1, Math.floor(n)));
}

/** Satu baris teks: buang karakter kontrol/newline, rapikan spasi. */
function sanitizeLine(s: string): string {
  // deno-lint-ignore no-control-regex
  return s
    .replace(/[\u0000-\u001F\u007F-\u009F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ────────────────────────────────────────────────────────────────────────────
 * Data soal yang sudah ada
 * ──────────────────────────────────────────────────────────────────────────── */

type ExistingQuestion = { exam_set_id: string; question_text: string };

/** Ambil hingga EXISTING_FETCH_LIMIT soal subtes yang sama di semua set (terbaru dulu). */
async function fetchExistingQuestions(
  admin: ReturnType<typeof getAdminClient>,
  subtest: Subtest,
): Promise<ExistingQuestion[]> {
  const out: ExistingQuestion[] = [];
  for (let from = 0; from < EXISTING_FETCH_LIMIT; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE, EXISTING_FETCH_LIMIT) - 1;
    const { data, error } = await admin
      .from("tryout_questions")
      .select("exam_set_id, question_text")
      .eq("subtest", subtest)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);
    if (error) {
      console.warn("tryout-generate-questions: gagal membaca soal existing:", error);
      break;
    }
    const rows = (data || []) as Array<{ exam_set_id: string; question_text: string | null }>;
    for (const r of rows) {
      if (r.question_text) out.push({ exam_set_id: r.exam_set_id, question_text: r.question_text });
    }
    if (rows.length < to - from + 1) break;
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Kategori: pemetaan & balancing
 * ──────────────────────────────────────────────────────────────────────────── */

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Petakan nama kategori bebas (dari AI / data lama) ke nama resmi kisi-kisi; null bila tidak cocok. */
function canonicalCategory(subtest: Subtest, raw: string): string | null {
  const key = normalizeKey(raw);
  if (!key) return null;
  const cats = BLUEPRINT[subtest];
  // 1) Cocok persis dengan nama resmi
  for (const c of cats) {
    if (normalizeKey(c.name) === key) return c.name;
  }
  // 2) Cocok lewat alias (alias yang lebih panjang/spesifik didahulukan)
  const aliasPairs = cats
    .flatMap((c) => c.aliases.map((a) => ({ alias: a, name: c.name })))
    .sort((a, b) => b.alias.length - a.alias.length);
  for (const { alias, name } of aliasPairs) {
    if (` ${key} `.includes(` ${alias} `)) return name;
  }
  return null;
}

/** Bagi `total` soal ke kategori yang paling sedikit terisi (greedy, urutan kisi-kisi sebagai tie-breaker). */
function allocateQuota(
  categories: string[],
  existing: Map<string, number>,
  total: number,
): Map<string, number> {
  const quota = new Map<string, number>(categories.map((c) => [c, 0]));
  for (let i = 0; i < total; i++) {
    let best = categories[0];
    let bestLoad = Infinity;
    for (const c of categories) {
      const load = (existing.get(c) || 0) + (quota.get(c) || 0);
      if (load < bestLoad) {
        best = c;
        bestLoad = load;
      }
    }
    quota.set(best, (quota.get(best) || 0) + 1);
  }
  return quota;
}

/** Pilih `count` soal dari pool dengan menjaga keseimbangan kategori (yang paling sedikit didahulukan). */
function pickBalanced(
  pool: CleanQuestion[],
  count: number,
  existing: Map<string, number>,
): CleanQuestion[] {
  const OTHER = "__lainnya__";
  const groups = new Map<string, CleanQuestion[]>();
  for (const q of pool) {
    const key = q.category && existing.has(q.category) ? q.category : OTHER;
    const arr = groups.get(key) || [];
    arr.push(q);
    groups.set(key, arr);
  }
  const load = new Map<string, number>();
  for (const key of groups.keys()) {
    // Kategori di luar kisi-kisi dipakai paling akhir
    load.set(key, key === OTHER ? Number.MAX_SAFE_INTEGER : existing.get(key) || 0);
  }

  const picked: CleanQuestion[] = [];
  while (picked.length < count) {
    let bestKey: string | null = null;
    let bestLoad = Infinity;
    for (const [key, arr] of groups) {
      if (arr.length === 0) continue;
      const l = load.get(key) ?? 0;
      if (l < bestLoad) {
        bestKey = key;
        bestLoad = l;
      }
    }
    if (bestKey === null) break;
    picked.push(groups.get(bestKey)!.shift()!);
    load.set(bestKey, bestLoad + 1);
  }
  return picked;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Prompt generate
 * ──────────────────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `Kamu adalah penyusun soal SKD CPNS (TWK, TIU, TKP) yang sangat berpengalaman dan teliti, mengikuti kisi-kisi resmi BKN.

PRINSIP:
1. AKURAT: setiap fakta (Pancasila, UUD NRI 1945 hasil amandemen, sejarah, ketatanegaraan) harus benar dan tidak bisa diperdebatkan. Jangan memakai fakta yang mudah berubah (nama pejabat aktif, data statistik terbaru). Jika ragu akan sebuah fakta, buat soal lain.
2. SATU KUNCI: untuk TWK/TIU tepat satu pilihan benar; pengecoh masuk akal tapi jelas salah bagi yang paham materi.
3. KONSISTEN: "explanation" harus mendukung kunci jawaban; hitung ulang soal numerik sebelum menulis kunci.
4. Bahasa Indonesia baku sesuai EYD. Teks polos: tanpa HTML, markdown, atau gambar (soal figural/pola dideskripsikan dengan teks/simbol).
5. Output hanya objek JSON valid, tanpa markdown dan tanpa teks lain.`;

function buildPrompt(opts: {
  subtest: Subtest;
  count: number;
  fixedCategory: string;
  quota: Map<string, number> | null;
  difficulty: Difficulty;
  dontRepeat: string[];
}): string {
  const { subtest, count, fixedCategory, quota, difficulty, dontRepeat } = opts;
  const difficultyDesc =
    difficulty === "easy"
      ? "mudah (fresh graduate harus bisa)"
      : difficulty === "hard"
        ? "sulit (butuh pemahaman mendalam)"
        : "sedang (standar ujian SKD asli)";

  // Instruksi komposisi kategori sesuai kisi-kisi
  const cats = BLUEPRINT[subtest];
  let categoryLines: string[];
  if (fixedCategory) {
    const official = cats.find((c) => c.name === fixedCategory);
    categoryLines = [
      `Semua soal berkategori: ${fixedCategory}${official ? ` (${official.desc})` : ""}.`,
      `Isi field "category" dengan "${fixedCategory}".`,
    ];
  } else {
    const parts = cats
      .filter((c) => (quota?.get(c.name) || 0) > 0)
      .map((c) => ({ c, n: quota?.get(c.name) || 0 }));
    categoryLines = [
      `Komposisi kategori (WAJIB tepat sesuai kuota): ${parts
        .map(({ c, n }) => `${n} soal ${c.name}`)
        .join(", ")}.`,
      "Cakupan tiap kategori:",
      ...parts.map(({ c }) => `- ${c.name}: ${c.desc}.`),
      'Isi field "category" persis dengan nama kategori di atas.',
    ];
  }

  // Instruksi anti-duplikat: hindari soal yang sudah ada di set lain / set ini
  const avoidLines =
    dontRepeat.length > 0
      ? [
          "",
          "SOAL YANG SUDAH ADA (jangan dibuat ulang atau sekadar diparafrasekan):",
          ...dontRepeat.map((t) => `- ${t.slice(0, 120)}`),
        ].join("\n")
      : "";

  const common = [
    `Tingkat kesulitan: ${difficultyDesc}.`,
    "Setiap soal punya tepat 5 pilihan dengan key A, B, C, D, E (urut), masing-masing teks singkat tanpa awalan huruf. Kelima pilihan harus berbeda satu sama lain.",
    'Jangan gunakan pilihan yang merujuk pilihan lain (mis. "semua jawaban benar", "A dan B benar").',
    "explanation tidak boleh menyebut huruf opsi (A/B/C/D/E); sebut isi jawabannya langsung.",
    "Jangan buat soal yang sama atau sangat mirip dengan soal lain di batch ini maupun daftar soal yang sudah ada.",
  ];

  if (subtest === "tkp") {
    return [
      `Buatkan ${count} soal TKP (Tes Karakteristik Pribadi) untuk simulasi SKD CPNS.`,
      ...categoryLines,
      ...common,
      "",
      "ATURAN TKP:",
      '- question_text: situasi kerja nyata ASN/instansi pemerintah (1-3 kalimat), diakhiri pertanyaan sikap (mis. "Sikap Anda adalah...").',
      "- scores: setiap pilihan mendapat skor berbeda 1-5 (permutasi 1,2,3,4,5; tidak boleh ada skor ganda). 5 = sikap paling ideal ASN (proaktif, solutif, berintegritas, melayani), 1 = paling buruk (menghindar, melanggar aturan, merugikan publik).",
      "- Semua pilihan harus terdengar masuk akal; perbedaan skor ditentukan oleh tingkat inisiatif, tanggung jawab, dan kepentingan publik. Pilihan skor 5 harus jelas paling ideal menurut nilai ASN.",
      "- explanation: 1-2 kalimat mengapa sikap terbaik paling tepat dan sikap terburuk paling tidak tepat (tanpa menyebut huruf opsi).",
      "- category: kategori soal sesuai komposisi di atas.",
      avoidLines,
      "",
      "FORMAT OUTPUT:",
      '{"questions":[{"question_text":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."},{"key":"E","text":"..."}],"scores":{"A":3,"B":5,"C":1,"D":4,"E":2},"explanation":"...","category":"..."}]}',
    ].join("\n");
  }

  const isTwk = subtest === "twk";
  return [
    isTwk
      ? `Buatkan ${count} soal TWK (Tes Wawasan Kebangsaan) untuk simulasi SKD CPNS.`
      : `Buatkan ${count} soal TIU (Tes Intelegensi Umum) untuk simulasi SKD CPNS.`,
    ...categoryLines,
    ...common,
    "",
    `ATURAN ${isTwk ? "TWK" : "TIU"}:`,
    "- question_text: pertanyaan pilihan ganda (1-3 kalimat; soal analitis/cerita boleh lebih panjang).",
    "- correct_answer: satu huruf A-E.",
    isTwk
      ? "- Rujuk pasal/sila/peristiwa secara tepat; hindari soal opini atau yang jawabannya bergantung tafsir."
      : "- Numerik: hitung langkah demi langkah dan pastikan hasilnya tepat sama dengan salah satu pilihan. Verbal: pastikan relasi analogi sesuai KBBI dan kesimpulan silogisme sah secara logika. Figural/analitis: pola/syarat harus menghasilkan tepat satu jawaban yang bisa diturunkan dari teks soal.",
    isTwk
      ? "- explanation: minimal 1 kalimat lengkap mengapa jawaban benar (sebut dasar: pasal, sila, atau peristiwa)."
      : "- explanation: minimal 1 kalimat lengkap cara menyelesaikan (langkah hitungan/alasan).",
    "- category: kategori soal sesuai komposisi di atas.",
    avoidLines,
    "",
    "FORMAT OUTPUT:",
    '{"questions":[{"question_text":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."},{"key":"E","text":"..."}],"correct_answer":"C","explanation":"...","category":"..."}]}',
  ].join("\n");
}

/* ────────────────────────────────────────────────────────────────────────────
 * Panggilan AI
 * ──────────────────────────────────────────────────────────────────────────── */

async function callAi(
  aiKey: string,
  opts: { system: string; user: string; temperature: number; maxTokens: number; timeoutMs: number },
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AI HTTP ${res.status}: ${errText.slice(0, 500)}`);
    }
    const data = await res.json();
    const choice = data?.choices?.[0];
    if (choice?.finish_reason === "length") {
      console.warn("tryout-generate-questions: output AI terpotong (finish_reason=length)");
    }
    const content = choice?.message?.content;
    return typeof content === "string" ? content : "";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`AI timeout setelah ${opts.timeoutMs} ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Verifikasi oleh reviewer AI independen
 * ──────────────────────────────────────────────────────────────────────────── */

const REVIEWER_SYSTEM_PROMPT = `Kamu adalah reviewer independen soal SKD CPNS (TWK, TIU, TKP) yang sangat teliti. Kamu TIDAK diberi kunci jawaban: kerjakan setiap soal sendiri dari nol, lalu nilai kualitasnya secara jujur dan ketat.
Output hanya objek JSON valid, tanpa markdown dan tanpa teks lain.`;

type ReviewResult = { accepted: CleanQuestion[]; rejected: number };

/**
 * Reviewer AI mengerjakan soal tanpa kunci. Mengembalikan null bila verifier gagal
 * (error/timeout/output tidak terbaca) — pemanggil lalu memakai soal tanpa verifikasi.
 */
async function verifyQuestions(
  aiKey: string,
  subtest: Subtest,
  questions: CleanQuestion[],
  timeoutMs: number,
): Promise<ReviewResult | null> {
  const isTkp = subtest === "tkp";
  const subtestName =
    subtest === "twk"
      ? "TWK (Tes Wawasan Kebangsaan)"
      : subtest === "tiu"
        ? "TIU (Tes Intelegensi Umum)"
        : "TKP (Tes Karakteristik Pribadi)";

  const questionBlocks = questions
    .map((q, i) =>
      [`[${i + 1}] ${q.question_text}`, ...q.options.map((o) => `${o.key}. ${o.text}`)].join("\n"),
    )
    .join("\n\n");

  const instructions = isTkp
    ? [
        `Berikut ${questions.length} soal ${subtestName}. Untuk setiap soal, tentukan pilihan sikap yang PALING ideal bagi ASN (proaktif, solutif, berintegritas, melayani publik, sesuai aturan).`,
        "Untuk setiap soal kembalikan:",
        '- "id": nomor soal (angka dalam kurung siku)',
        '- "alasan": alasan singkat (maks 20 kata)',
        '- "answer": satu huruf A-E pilihan sikap paling ideal',
        '- "ambiguous": true bila ada lebih dari satu pilihan yang sama-sama paling ideal atau situasi tidak jelas',
        '- "factual_issue": true bila situasi memuat aturan/fakta yang keliru',
        "",
        "FORMAT OUTPUT:",
        '{"reviews":[{"id":1,"alasan":"...","answer":"B","ambiguous":false,"factual_issue":false}]}',
      ]
    : [
        `Berikut ${questions.length} soal ${subtestName}. Kerjakan setiap soal sendiri (hitung ulang soal numerik langkah demi langkah).`,
        "Untuk setiap soal kembalikan:",
        '- "id": nomor soal (angka dalam kurung siku)',
        '- "alasan": langkah/alasan singkat (maks 25 kata)',
        '- "answer": satu huruf A-E jawaban yang benar menurut kamu',
        '- "ambiguous": true bila lebih dari satu pilihan bisa dibenarkan, tidak ada pilihan yang benar, atau informasi soal kurang',
        '- "factual_issue": true bila soal memuat fakta/premis yang keliru, sudah tidak berlaku, atau bisa diperdebatkan',
        "",
        "FORMAT OUTPUT:",
        '{"reviews":[{"id":1,"alasan":"...","answer":"C","ambiguous":false,"factual_issue":false}]}',
      ];

  let content: string;
  try {
    content = await callAi(aiKey, {
      system: REVIEWER_SYSTEM_PROMPT,
      user: [...instructions, "", "SOAL:", questionBlocks].join("\n"),
      temperature: 0,
      maxTokens: Math.min(8192, 512 + questions.length * 150),
      timeoutMs,
    });
  } catch (err) {
    console.warn("tryout-generate-questions: verifier AI gagal:", errMessage(err));
    return null;
  }

  const reviews = parseReviews(content);
  if (!reviews) {
    console.warn(
      "tryout-generate-questions: output verifier tidak bisa di-parse:",
      content.slice(0, 500),
    );
    return null;
  }
  // Bila reviewer hanya menilai sebagian kecil soal, anggap verifikasi gagal
  // (lebih aman daripada membuang banyak soal hanya karena output reviewer terpotong).
  const covered = questions.filter((_, i) => reviews.has(i + 1)).length;
  if (covered < Math.ceil(questions.length / 2)) {
    console.warn(
      `tryout-generate-questions: verifier hanya menilai ${covered}/${questions.length} soal, verifikasi diabaikan`,
    );
    return null;
  }

  const accepted: CleanQuestion[] = [];
  let rejected = 0;
  questions.forEach((q, i) => {
    const r = reviews.get(i + 1);
    let ok: boolean;
    if (!r || !r.answer) {
      ok = false; // tidak dinilai reviewer → tidak lolos
    } else if (isTkp) {
      // TKP: pilihan terbaik versi reviewer harus mendapat skor tinggi (4 atau 5)
      ok = (q.scores?.[r.answer] ?? 0) > 3;
    } else {
      ok = r.answer === q.correct_answer && !r.ambiguous && !r.factualIssue;
    }
    if (ok) accepted.push(q);
    else rejected++;
  });
  return { accepted, rejected };
}

type Review = { answer: string | null; ambiguous: boolean; factualIssue: boolean };

function parseReviews(content: string): Map<number, Review> | null {
  const parsed = parseJsonObject(content);
  if (!parsed) return null;
  const list = Array.isArray(parsed.reviews)
    ? parsed.reviews
    : Array.isArray(parsed.results)
      ? parsed.results
      : null;
  if (!list) return null;

  const map = new Map<number, Review>();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const id = Number(r.id);
    if (!Number.isInteger(id) || id < 1) continue;
    const letter = String(r.answer ?? r.best ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-E]/g, "");
    map.set(id, {
      answer: letter.length === 1 ? letter : null,
      ambiguous: r.ambiguous === true || r.ambiguous === "true",
      factualIssue: r.factual_issue === true || r.factual_issue === "true",
    });
  }
  return map.size > 0 ? map : null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Validasi struktural
 * ──────────────────────────────────────────────────────────────────────────── */

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;

type CleanQuestion = {
  question_text: string;
  options: { key: string; text: string }[];
  correct_answer: string | null;
  scores: Record<string, number> | null;
  explanation: string | null;
  category: string | null;
};

/** Buang tag HTML (soal disimpan sebagai teks polos) dan rapikan spasi tanpa menghapus baris baru. */
function stripHtml(s: string): string {
  return (
    s
      .replace(/<!--[\s\S]*?-->/g, " ")
      // Isi <script>/<style> ikut dibuang, bukan hanya tag-nya
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<\/?[a-zA-Z][^<>]*>/g, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function normalizeOption(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Validasi soal dari AI sebelum disimpan: 5 opsi A-E unik berisi teks, panjang teks wajar,
 * kunci A-E + explanation untuk TWK/TIU, dan skor TKP berupa permutasi 1..5.
 * Soal yang tidak memenuhi dibuang (tidak disimpan rusak).
 */
function cleanQuestion(raw: unknown, subtest: Subtest): CleanQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const questionText = typeof q.question_text === "string" ? stripHtml(q.question_text) : "";
  if (questionText.length < 15 || questionText.length > 1500) return null;
  if (!Array.isArray(q.options) || q.options.length !== 5) return null;

  // Bila AI memberi key A-E lengkap tapi tidak urut, susun ulang sesuai key
  // supaya correct_answer/scores tetap merujuk opsi yang benar.
  let rawOptions: unknown[] = q.options;
  const rawKeys = rawOptions.map((opt) =>
    opt && typeof opt === "object"
      ? String((opt as Record<string, unknown>).key ?? "")
          .trim()
          .toUpperCase()
      : "",
  );
  if ([...rawKeys].sort().join("") === OPTION_KEYS.join("")) {
    rawOptions = OPTION_KEYS.map((k) => rawOptions[rawKeys.indexOf(k)]);
  }

  const options = rawOptions.map((opt, i) => {
    const text =
      typeof opt === "string"
        ? opt
        : opt && typeof opt === "object"
          ? String((opt as Record<string, unknown>).text ?? "")
          : "";
    // Buang awalan "A. " / "A) " bila AI tetap menuliskannya
    return {
      key: OPTION_KEYS[i],
      text: stripHtml(text)
        .replace(/^[A-E][.)]\s+/, "")
        .trim(),
    };
  });
  if (options.some((o) => !o.text || o.text.length > 400)) return null;
  // Opsi harus unik (abaikan huruf besar/kecil dan spasi)
  if (new Set(options.map((o) => normalizeOption(o.text))).size !== options.length) return null;

  let correctAnswer: string | null = null;
  let scores: Record<string, number> | null = null;
  if (subtest === "tkp") {
    const rawScores = q.scores && typeof q.scores === "object" ? q.scores : null;
    if (!rawScores) return null;
    scores = {};
    for (const key of OPTION_KEYS) {
      scores[key] = Number((rawScores as Record<string, unknown>)[key]);
    }
    const sorted = Object.values(scores).sort((a, b) => a - b);
    if (sorted.join(",") !== "1,2,3,4,5") return null;
  } else {
    correctAnswer = String(q.correct_answer ?? "")
      .trim()
      .toUpperCase();
    if (!(OPTION_KEYS as readonly string[]).includes(correctAnswer)) return null;
  }

  const explanation = typeof q.explanation === "string" ? stripHtml(q.explanation) : "";
  if (subtest !== "tkp" && explanation.length < 20) return null;
  if (explanation.length > 2000) return null;
  const category = typeof q.category === "string" ? sanitizeLine(stripHtml(q.category)) : "";
  return {
    question_text: questionText,
    options,
    correct_answer: correctAnswer,
    scores,
    explanation: explanation || null,
    category: category ? category.slice(0, 60) : null,
  };
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  let cleaned = content.trim();
  // Bersihkan markdown code block jika ada
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    // Coba extract objek JSON dari teks
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

function parseQuestions(content: string): unknown[] {
  const parsed = parseJsonObject(content);
  if (!parsed) return [];
  if (Array.isArray(parsed.questions)) return parsed.questions;
  const data = parsed.data as Record<string, unknown> | undefined;
  if (data && Array.isArray(data.questions)) return data.questions;
  return [];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Near-duplicate (Jaccard token set)
 * ──────────────────────────────────────────────────────────────────────────── */

function tokenSet(text: string): Set<string> {
  const normalized = stripHtml(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return new Set(normalized ? normalized.split(" ") : []);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let inter = 0;
  for (const t of small) if (large.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Acak opsi (kunci jawaban merata)
 * ──────────────────────────────────────────────────────────────────────────── */

/** Explanation yang menyebut huruf opsi tidak boleh diacak (huruf akan jadi salah). */
const LETTER_REFERENCE_RE = /\b(opsi|pilihan|jawaban)\s*\(?[A-E]\)?\b/i;
/** Opsi yang merujuk posisi/opsi lain ("semua jawaban benar", "A dan B") juga tidak diacak. */
const POSITIONAL_OPTION_RE =
  /\b(semua|seluruh)\s+(jawaban|pilihan|opsi)\b|\bdi\s*atas\b|\b[A-E]\s*(dan|&)\s*[A-E]\b/;

/** Bilangan bulat acak seragam 0..max-1 dengan crypto (rejection sampling, tanpa bias modulo). */
function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function shuffleOptions(q: CleanQuestion): CleanQuestion {
  if (q.explanation && LETTER_REFERENCE_RE.test(q.explanation)) return q;
  if (q.options.some((o) => POSITIONAL_OPTION_RE.test(o.text))) return q;

  // Fisher-Yates: order[i] = indeks opsi lama yang menempati posisi baru i
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }

  const options = order.map((oldIdx, newIdx) => ({
    key: OPTION_KEYS[newIdx],
    text: q.options[oldIdx].text,
  }));
  // Huruf baru untuk opsi yang sebelumnya berhuruf oldKey
  const newKeyOf = (oldKey: string) =>
    OPTION_KEYS[order.indexOf((OPTION_KEYS as readonly string[]).indexOf(oldKey))];

  let scores: Record<string, number> | null = null;
  if (q.scores) {
    scores = {};
    order.forEach((oldIdx, newIdx) => {
      scores![OPTION_KEYS[newIdx]] = q.scores![OPTION_KEYS[oldIdx]];
    });
  }

  return {
    ...q,
    options,
    correct_answer: q.correct_answer ? newKeyOf(q.correct_answer) : null,
    scores,
  };
}
