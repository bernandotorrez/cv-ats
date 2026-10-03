/**
 * tryout-submit — Submit jawaban tryout & hitung skor (server-authoritative).
 *
 * Flow:
 * 1. Validasi user own attempt & status `in_progress`.
 * 2. Validasi waktu: deadline = started_at + duration. Jika submit datang
 *    setelah deadline + 60 detik, payload jawaban DIABAIKAN dan yang dinilai
 *    hanya jawaban yang sudah tersimpan lewat autosave (save_tryout_answers);
 *    status menjadi `timed_out`.
 * 3. Fetch soal + kunci (kolom eksplisit), hitung skor di server.
 * 4. Update attempt dengan guard `status = in_progress` (cegah double submit),
 *    pastikan tepat 1 baris berubah.
 * 5. Return skor. Kunci jawaban, skor TKP & pembahasan hanya dikirim jika
 *    paket attempt punya `has_pembahasan`.
 *
 * Skor, durasi, dan status TIDAK pernah diambil dari client.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type SubmitBody = {
  attempt_id?: string;
  answers?: unknown;
  flagged_questions?: unknown;
  auto_submit?: boolean;
};

type QuestionRow = {
  id: string;
  subtest: "twk" | "tiu" | "tkp";
  question_number: number;
  question_text: string;
  question_image_url: string | null;
  options: unknown;
  category: string | null;
  difficulty: string | null;
  correct_answer: string | null;
  scores: Record<string, number> | null;
  explanation?: string | null;
  explanation_image_url?: string | null;
};

/** Toleransi jaringan setelah waktu habis (auto-submit client). */
const GRACE_SECONDS = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXAM_SET_COLUMNS =
  "id, slug, name, description, total_questions, duration_minutes, twk_count, tiu_count, tkp_count, passing_grade_twk, passing_grade_tiu, passing_grade_tkp, is_active, is_free_preview, sort_order";

const SCORING_QUESTION_COLUMNS =
  "id, subtest, question_number, question_text, question_image_url, options, category, difficulty, correct_answer, scores";

const PEMBAHASAN_COLUMNS = ", explanation, explanation_image_url";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();

    const body = (await req.json().catch(() => ({}))) as SubmitBody;
    const attemptId = typeof body.attempt_id === "string" ? body.attempt_id.trim() : "";
    if (!attemptId || !UUID_RE.test(attemptId)) {
      return json(req, { error: "attempt_id wajib diisi." }, 400);
    }

    // 1. Ambil attempt
    const { data: attempt, error: attErr } = await admin
      .from("tryout_attempts")
      .select(
        `id, user_id, exam_set_id, credit_id, status, started_at, answers, flagged_questions, tryout_exam_sets!inner(${EXAM_SET_COLUMNS})`,
      )
      .eq("id", attemptId)
      .maybeSingle();
    if (attErr) throw attErr;
    if (!attempt) {
      return json(req, { error: "Attempt tidak ditemukan." }, 404);
    }
    if (attempt.user_id !== userId) {
      return json(req, { error: "Forbidden: bukan attempt kamu." }, 403);
    }
    if (attempt.status !== "in_progress") {
      return json(req, { error: `Attempt sudah ${attempt.status}.` }, 409);
    }

    // deno-lint-ignore no-explicit-any
    const examSet = attempt.tryout_exam_sets as any;
    const durationMinutes: number = examSet.duration_minutes ?? 100;

    // 2. Validasi waktu (server-side anti-cheat)
    const startedAtMs = new Date(attempt.started_at).getTime();
    const deadlineMs = startedAtMs + durationMinutes * 60_000;
    const nowMs = Date.now();
    const pastGrace = nowMs > deadlineMs + GRACE_SECONDS * 1000;

    // 3. Paket: apakah termasuk pembahasan?
    const hasPembahasan = await fetchHasPembahasan(admin, attempt.credit_id);

    // 4. Fetch soal + kunci (kolom eksplisit)
    const { data: questionsData, error: qErr } = await admin
      .from("tryout_questions")
      .select(SCORING_QUESTION_COLUMNS + (hasPembahasan ? PEMBAHASAN_COLUMNS : ""))
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    const questions = ((questionsData || []) as unknown as QuestionRow[]).map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
    }));
    const questionIds = new Set(questions.map((q) => q.id));

    // Setelah deadline + grace: payload diabaikan, hanya jawaban autosave.
    const storedAnswers = cleanAnswers(attempt.answers, questionIds);
    const storedFlagged = cleanFlagged(attempt.flagged_questions, questionIds);
    const payloadIsValid = isPlainObject(body.answers);
    const answers =
      !pastGrace && payloadIsValid ? cleanAnswers(body.answers, questionIds) : storedAnswers;
    const flagged =
      !pastGrace && Array.isArray(body.flagged_questions)
        ? cleanFlagged(body.flagged_questions, questionIds)
        : storedFlagged;

    // 5. Hitung skor
    const scoreTwk = computeBinary(questions, answers, "twk", 5);
    const scoreTiu = computeBinary(questions, answers, "tiu", 5);
    const scoreTkp = computeTkp(questions, answers);
    const scoreTotal = scoreTwk + scoreTiu + scoreTkp;

    const passTwk = scoreTwk >= examSet.passing_grade_twk;
    const passTiu = scoreTiu >= examSet.passing_grade_tiu;
    const passTkp = scoreTkp >= examSet.passing_grade_tkp;
    const passOverall = passTwk && passTiu && passTkp;

    const finishedAt = new Date(nowMs).toISOString();
    const durationSeconds = Math.max(
      0,
      Math.min(durationMinutes * 60, Math.floor((nowMs - startedAtMs) / 1000)),
    );

    const stats = computeStats(questions, answers);

    // 6. Update attempt — hanya jika masih in_progress (cegah double submit)
    const updateStatus = pastGrace ? "timed_out" : "completed";
    const { data: updatedRows, error: updateErr } = await admin
      .from("tryout_attempts")
      .update({
        status: updateStatus,
        answers,
        flagged_questions: flagged,
        score_twk: scoreTwk,
        score_tiu: scoreTiu,
        score_tkp: scoreTkp,
        score_total: scoreTotal,
        pass_twk: passTwk,
        pass_tiu: passTiu,
        pass_tkp: passTkp,
        pass_overall: passOverall,
        stats,
        finished_at: finishedAt,
        duration_seconds: durationSeconds,
      })
      .eq("id", attemptId)
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .select("id");
    if (updateErr) throw updateErr;
    if (!updatedRows || updatedRows.length !== 1) {
      return json(req, { error: "Attempt sudah disubmit." }, 409);
    }

    return json(req, {
      attempt: {
        id: attemptId,
        exam_set_id: examSet.id,
        status: updateStatus,
        score_twk: scoreTwk,
        score_tiu: scoreTiu,
        score_tkp: scoreTkp,
        score_total: scoreTotal,
        pass_twk: passTwk,
        pass_tiu: passTiu,
        pass_tkp: passTkp,
        pass_overall: passOverall,
        started_at: attempt.started_at,
        finished_at: finishedAt,
        duration_seconds: durationSeconds,
        answers,
        stats,
      },
      exam_set: examSet,
      questions: questions.map((q) => shapeQuestion(q, hasPembahasan)),
      has_pembahasan: hasPembahasan,
      answers_source: pastGrace ? "autosave" : "submit",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-submit error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: message }, 401);
    }
    return json(req, { error: "Gagal submit tryout. Coba lagi." }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
async function fetchHasPembahasan(admin: any, creditId: string | null): Promise<boolean> {
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

/**
 * Tanpa pembahasan: kirim soal tanpa kunci jawaban, skor TKP, dan pembahasan
 * (halaman hasil hanya menampilkan soal jika paket punya pembahasan).
 */
function shapeQuestion(q: QuestionRow & { options: unknown[] }, hasPembahasan: boolean) {
  const base = {
    id: q.id,
    subtest: q.subtest,
    question_number: q.question_number,
    question_text: q.question_text,
    question_image_url: q.question_image_url,
    options: q.options,
    category: q.category,
    difficulty: q.difficulty,
  };
  if (!hasPembahasan) return base;
  return {
    ...base,
    correct_answer: q.correct_answer,
    scores: q.scores,
    explanation: q.explanation ?? null,
    explanation_image_url: q.explanation_image_url ?? null,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Hanya id soal milik set ini, nilai berupa string pendek (kunci opsi). */
function cleanAnswers(raw: unknown, questionIds: Set<string>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isPlainObject(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!questionIds.has(key)) continue;
    if (typeof value !== "string") continue;
    const v = value.trim();
    if (v.length < 1 || v.length > 8) continue;
    out[key] = v;
  }
  return out;
}

function cleanFlagged(raw: unknown, questionIds: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<string>();
  for (const v of raw) {
    if (typeof v === "string" && questionIds.has(v)) out.add(v);
  }
  return [...out];
}

// ─── Scoring helpers (duplikasi dari tryout-scoring.ts karena Deno tidak resolve TS file dari FE) ───

function computeBinary(
  questions: QuestionRow[],
  answers: Record<string, string>,
  subtest: "twk" | "tiu",
  perCorrect: number,
): number {
  let score = 0;
  for (const q of questions) {
    if (q.subtest !== subtest) continue;
    const userAnswer = answers[q.id];
    if (userAnswer && q.correct_answer && userAnswer === q.correct_answer) {
      score += perCorrect;
    }
  }
  return score;
}

function computeTkp(questions: QuestionRow[], answers: Record<string, string>): number {
  let score = 0;
  for (const q of questions) {
    if (q.subtest !== "tkp") continue;
    const userAnswer = answers[q.id];
    if (!userAnswer || !q.scores) continue;
    const value = q.scores[userAnswer];
    if (typeof value === "number" && Number.isFinite(value)) {
      score += value;
    } else {
      score += 1; // safety default
    }
  }
  return score;
}

function computeStats(questions: QuestionRow[], answers: Record<string, string>) {
  // deno-lint-ignore no-explicit-any
  const stats: any = {};

  for (const subtest of ["twk", "tiu", "tkp"]) {
    const subset = questions.filter((q) => q.subtest === subtest);
    const answered = subset.filter((q) => answers[q.id]).length;
    const empty = subset.length - answered;

    if (subtest === "tkp") {
      const byCategory: Record<string, { score: number; total: number }> = {};
      for (const q of subset) {
        const cat = q.category || "Lainnya";
        if (!byCategory[cat]) byCategory[cat] = { score: 0, total: 0 };
        byCategory[cat].total += 1;
        const userAnswer = answers[q.id];
        if (userAnswer && q.scores && typeof q.scores[userAnswer] === "number") {
          byCategory[cat].score += q.scores[userAnswer];
        }
      }
      stats.tkp = { answered, by_category: byCategory };
    } else {
      const correct = subset.filter(
        (q) => q.correct_answer && answers[q.id] === q.correct_answer,
      ).length;
      const wrong = answered - correct;
      const byCategory: Record<string, { correct: number; total: number }> = {};
      for (const q of subset) {
        const cat = q.category || "Lainnya";
        if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 };
        byCategory[cat].total += 1;
        if (q.correct_answer && answers[q.id] === q.correct_answer) {
          byCategory[cat].correct += 1;
        }
      }
      stats[subtest] = { answered, correct, wrong, empty, by_category: byCategory };
    }
  }
  return stats;
}
