/**
 * Shared helper tryout SKD untuk edge function (start / submit / result).
 *
 * Satu sumber kebenaran untuk: kolom yang aman dikirim, validasi jawaban,
 * urutan soal, perhitungan skor, dan statistik attempt. Frontend punya
 * duplikat ringan di src/lib/tryout-scoring.ts (Deno tidak bisa import FE).
 */
import { corsHeaders } from "./cors.ts";
import { checkRateLimit, createRateLimitedResponse } from "./rate-limit.ts";

export type Subtest = "twk" | "tiu" | "tkp";

export type QuestionRow = {
  id: string;
  subtest: Subtest;
  question_number: number;
  question_text: string;
  question_image_url: string | null;
  options: unknown;
  category: string | null;
  difficulty: string | null;
  correct_answer?: string | null;
  scores?: Record<string, number> | null;
  explanation?: string | null;
  explanation_image_url?: string | null;
  explanation_detail?: unknown;
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const EXAM_SET_COLUMNS =
  "id, slug, name, description, total_questions, duration_minutes, twk_count, tiu_count, tkp_count, passing_grade_twk, passing_grade_tiu, passing_grade_tkp, is_active, is_free_preview, sort_order";

// Kolom aman selama ujian berlangsung. JANGAN tambahkan correct_answer,
// scores, explanation, explanation_image_url.
export const PUBLIC_QUESTION_COLUMNS =
  "id, subtest, question_number, question_text, question_image_url, options, category, difficulty";

export const SCORING_QUESTION_COLUMNS = PUBLIC_QUESTION_COLUMNS + ", correct_answer, scores";

export const PEMBAHASAN_COLUMNS = ", explanation, explanation_image_url, explanation_detail";

/** Kunci opsi yang sah. Jawaban di luar ini dibuang (tidak dinilai). */
export const OPTION_KEY_RE = /^[A-E]$/;

/** Toleransi jaringan setelah waktu habis (auto-submit client). */
export const GRACE_SECONDS = 60;

const SUBTEST_ORDER: Record<Subtest, number> = { twk: 0, tiu: 1, tkp: 2 };

export const MAX_SCORE = { twk: 150, tiu: 175, tkp: 225, total: 550 } as const;

/** Urutan resmi CAT: TWK → TIU → TKP, lalu nomor soal. */
export function sortQuestions<T extends Pick<QuestionRow, "subtest" | "question_number">>(
  questions: T[],
): T[] {
  return [...questions].sort(
    (a, b) =>
      (SUBTEST_ORDER[a.subtest] ?? 9) - (SUBTEST_ORDER[b.subtest] ?? 9) ||
      a.question_number - b.question_number,
  );
}

/** Gambar hanya dari bucket publik tryout-images milik project ini. */
export function safeImageUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    const u = new URL(url);
    const base = new URL(Deno.env.get("SUPABASE_URL") || "http://invalid");
    if (u.host !== base.host) return null;
    if (!u.pathname.startsWith("/storage/v1/object/public/tryout-images/")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function normalizeOptions(
  raw: unknown,
): { key: string; text: string; image_url?: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((opt, i) => {
      if (typeof opt === "string") {
        const m = opt.match(/^\s*([A-E])[.)]\s*(.*)$/s);
        return m
          ? { key: m[1], text: m[2].trim() }
          : { key: String.fromCharCode(65 + i), text: opt.trim() };
      }
      if (opt && typeof opt === "object") {
        const o = opt as Record<string, unknown>;
        const image = safeImageUrl(o.image_url);
        return {
          key: String(o.key ?? String.fromCharCode(65 + i))
            .trim()
            .toUpperCase(),
          text: String(o.text ?? "").trim(),
          ...(image ? { image_url: image } : {}),
        };
      }
      return { key: String.fromCharCode(65 + i), text: "" };
    })
    .filter((o) => OPTION_KEY_RE.test(o.key));
}

export function shapePublicQuestion(q: QuestionRow) {
  return {
    id: q.id,
    subtest: q.subtest,
    question_number: q.question_number,
    question_text: q.question_text,
    question_image_url: safeImageUrl(q.question_image_url),
    options: normalizeOptions(q.options),
    category: q.category,
    difficulty: q.difficulty,
  };
}

export function shapeResultQuestion(q: QuestionRow, withPembahasan: boolean) {
  const base = shapePublicQuestion(q);
  if (!withPembahasan) return base;
  return {
    ...base,
    correct_answer: q.correct_answer ?? null,
    scores: q.scores ?? null,
    explanation: q.explanation ?? null,
    explanation_image_url: q.explanation_image_url ?? null,
    explanation_detail: q.explanation_detail ?? null,
  };
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Hanya id soal milik set ini, nilai harus kunci opsi A–E. */
export function cleanAnswers(raw: unknown, questionIds: Set<string>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isPlainObject(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!questionIds.has(key)) continue;
    if (typeof value !== "string") continue;
    const v = value.trim().toUpperCase();
    if (!OPTION_KEY_RE.test(v)) continue;
    out[key] = v;
  }
  return out;
}

export function cleanFlagged(raw: unknown, questionIds: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<string>();
  for (const v of raw) {
    if (typeof v === "string" && questionIds.has(v)) out.add(v);
  }
  return [...out];
}

// ─── Skor ────────────────────────────────────────────────────────────────────

function tkpValue(q: QuestionRow, answer: string | undefined): number {
  if (!answer || !q.scores) return 0;
  const value = q.scores[answer];
  // Jawaban sah tapi skor tidak terdefinisi (data rusak) → nilai minimum.
  return typeof value === "number" && Number.isFinite(value) ? value : 1;
}

export function computeScores(
  questions: QuestionRow[],
  answers: Record<string, string>,
  passing: { twk: number; tiu: number; tkp: number },
) {
  let twk = 0;
  let tiu = 0;
  let tkp = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (q.subtest === "tkp") tkp += tkpValue(q, a);
    else if (a && q.correct_answer && a === q.correct_answer) {
      if (q.subtest === "twk") twk += 5;
      else tiu += 5;
    }
  }
  const pass_twk = twk >= passing.twk;
  const pass_tiu = tiu >= passing.tiu;
  const pass_tkp = tkp >= passing.tkp;
  return {
    twk,
    tiu,
    tkp,
    total: twk + tiu + tkp,
    pass_twk,
    pass_tiu,
    pass_tkp,
    pass_overall: pass_twk && pass_tiu && pass_tkp,
  };
}

type BinaryCat = { correct: number; wrong: number; empty: number; total: number };
type TkpCat = { score: number; max: number; answered: number; total: number };

/**
 * Statistik attempt. Format kompatibel dengan versi lama (answered/correct/
 * wrong/empty/by_category), ditambah by_difficulty, flagged, dan
 * flagged_correct (berapa soal "ragu" yang ternyata benar).
 */
export function computeStats(
  questions: QuestionRow[],
  answers: Record<string, string>,
  flagged: string[] = [],
) {
  const flaggedSet = new Set(flagged);
  // deno-lint-ignore no-explicit-any
  const stats: Record<string, any> = {};

  for (const subtest of ["twk", "tiu", "tkp"] as const) {
    const subset = questions.filter((q) => q.subtest === subtest);
    const answered = subset.filter((q) => answers[q.id]).length;
    const empty = subset.length - answered;
    const flaggedCount = subset.filter((q) => flaggedSet.has(q.id)).length;

    if (subtest === "tkp") {
      const byCategory: Record<string, TkpCat> = {};
      const byDifficulty: Record<string, TkpCat> = {};
      let fives = 0;
      for (const q of subset) {
        const v = tkpValue(q, answers[q.id]);
        if (v === 5) fives += 1;
        for (const [bucket, key] of [
          [byCategory, q.category || "Lainnya"],
          [byDifficulty, q.difficulty || "medium"],
        ] as const) {
          if (!bucket[key]) bucket[key] = { score: 0, max: 0, answered: 0, total: 0 };
          bucket[key].total += 1;
          bucket[key].max += 5;
          bucket[key].score += v;
          if (answers[q.id]) bucket[key].answered += 1;
        }
      }
      stats.tkp = {
        total: subset.length,
        answered,
        empty,
        flagged: flaggedCount,
        best_choice: fives,
        by_category: byCategory,
        by_difficulty: byDifficulty,
      };
      continue;
    }

    const byCategory: Record<string, BinaryCat> = {};
    const byDifficulty: Record<string, BinaryCat> = {};
    let correct = 0;
    let flaggedCorrect = 0;
    for (const q of subset) {
      const a = answers[q.id];
      const isCorrect = !!a && !!q.correct_answer && a === q.correct_answer;
      if (isCorrect) correct += 1;
      if (isCorrect && flaggedSet.has(q.id)) flaggedCorrect += 1;
      for (const [bucket, key] of [
        [byCategory, q.category || "Lainnya"],
        [byDifficulty, q.difficulty || "medium"],
      ] as const) {
        if (!bucket[key]) bucket[key] = { correct: 0, wrong: 0, empty: 0, total: 0 };
        bucket[key].total += 1;
        if (!a) bucket[key].empty += 1;
        else if (isCorrect) bucket[key].correct += 1;
        else bucket[key].wrong += 1;
      }
    }
    stats[subtest] = {
      total: subset.length,
      answered,
      correct,
      wrong: answered - correct,
      empty,
      flagged: flaggedCount,
      flagged_correct: flaggedCorrect,
      by_category: byCategory,
      by_difficulty: byDifficulty,
    };
  }
  return stats;
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

const SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), ...SECURITY_HEADERS },
  });
}

/** Rate limit per user per endpoint (in-memory per instance, best effort). */
export function rateLimited(
  req: Request,
  userId: string,
  endpoint: string,
  max: number,
  windowMs: number,
): Response | null {
  const rl = checkRateLimit(`${endpoint}:${userId}`, max, windowMs);
  if (rl.allowed) return null;
  return createRateLimitedResponse(
    rl,
    JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }),
    corsHeaders(req),
  );
}

/** Baca body JSON dengan batas ukuran (default 64 KB). */
export async function readJsonBody(req: Request, maxBytes = 65_536): Promise<unknown> {
  const len = Number(req.headers.get("content-length") || "0");
  if (len > maxBytes) throw new BodyTooLargeError();
  const text = await req.text();
  if (text.length > maxBytes) throw new BodyTooLargeError();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export class BodyTooLargeError extends Error {
  constructor() {
    super("BODY_TOO_LARGE");
  }
}

// deno-lint-ignore no-explicit-any
export async function fetchHasPembahasan(admin: any, creditId: string | null): Promise<boolean> {
  if (!creditId) return false;
  const { data: credit } = await admin
    .from("tryout_credits")
    .select("tryout_packages!inner(has_pembahasan)")
    .eq("id", creditId)
    .maybeSingle();
  // Relasi many-to-one: runtime berupa object, bukan array
  const pkg = (credit as { tryout_packages?: { has_pembahasan?: boolean } } | null)
    ?.tryout_packages;
  return !!pkg?.has_pembahasan;
}
