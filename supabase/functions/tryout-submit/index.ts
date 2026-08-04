/**
 * tryout-submit — Submit jawaban tryout & hitung skor.
 *
 * Flow:
 * 1. Validasi user own attempt.
 * 2. Validasi attempt status = `in_progress`.
 * 3. Validasi waktu: now() - started_at <= duration + 30s tolerance.
 * 4. Fetch semua soal + jawaban benar.
 * 5. Hitung skor (server-side).
 * 6. Update attempt: status, scores, pass flags, duration, finished_at.
 * 7. Return: skor + soal lengkap (untuk pembahasan jika paket lengkap).
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type SubmitBody = {
  attempt_id?: string;
  answers?: Record<string, string>;
  flagged_questions?: string[];
  auto_submit?: boolean;
};

const TIME_TOLERANCE_SECONDS = 30;

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
    const attemptId = (body.attempt_id || "").trim();
    if (!attemptId) {
      return json(req, { error: "attempt_id wajib diisi." }, 400);
    }

    const answers = body.answers || {};
    const flagged = body.flagged_questions || [];

    // 1. Ambil attempt
    const { data: attempt, error: attErr } = await admin
      .from("tryout_attempts")
      .select("*, tryout_exam_sets!inner(*)")
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
      return json(req, { error: `Attempt sudah ${attempt.status}.` }, 400);
    }

    // 2. Validasi waktu (server-side anti-cheat)
    const examSet = attempt.tryout_exam_sets;
    const startedAt = new Date(attempt.started_at).getTime();
    const maxDurationMs = (examSet.duration_minutes + TIME_TOLERANCE_SECONDS / 60) * 60_000;
    const elapsedMs = Date.now() - startedAt;
    const timedOut = elapsedMs > maxDurationMs;
    if (timedOut && Object.keys(answers).length === 0) {
      // Server-side auto-submit dengan jawaban kosong jika client tidak sempat kirim
      return json(req, { error: "Waktu habis dan tidak ada jawaban tersimpan." }, 400);
    }

    // 3. Fetch semua soal + jawaban benar (full)
    const { data: questions, error: qErr } = await admin
      .from("tryout_questions")
      .select("*")
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    // 4. Hitung skor
    const normalizedQuestions = (questions || []).map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
    }));

    const scoreTwk = computeBinary(normalizedQuestions, answers, "twk", 5);
    const scoreTiu = computeBinary(normalizedQuestions, answers, "tiu", 5);
    const scoreTkp = computeTkp(normalizedQuestions, answers);
    const scoreTotal = scoreTwk + scoreTiu + scoreTkp;

    const passTwk = scoreTwk >= examSet.passing_grade_twk;
    const passTiu = scoreTiu >= examSet.passing_grade_tiu;
    const passTkp = scoreTkp >= examSet.passing_grade_tkp;
    const passOverall = passTwk && passTiu && passTkp;

    const finishedAt = new Date().toISOString();
    const durationSeconds = Math.min(
      examSet.duration_minutes * 60,
      Math.floor(elapsedMs / 1000),
    );

    const stats = computeStats(normalizedQuestions, answers);

    // 5. Update attempt
    const updateStatus = timedOut ? "timed_out" : "completed";
    const { error: updateErr } = await admin
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
      .eq("id", attemptId);
    if (updateErr) throw updateErr;

    // 6. Cek apakah paket user termasuk pembahasan (paket lengkap)
    let hasPembahasan = false;
    if (attempt.credit_id) {
      const { data: credit } = await admin
        .from("tryout_credits")
        .select("tryout_packages!inner(has_pembahasan)")
        .eq("id", attempt.credit_id)
        .maybeSingle();
      hasPembahasan = !!credit?.tryout_packages?.has_pembahasan;
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
        stats,
      },
      exam_set: examSet,
      questions: normalizedQuestions,
      has_pembahasan: hasPembahasan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-submit error:", message);
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    return json(req, { error: message }, status);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

// ─── Scoring helpers (duplikasi dari tryout-scoring.ts karena Deno tidak resolve TS file dari FE) ───

function computeBinary(
  questions: any[],
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

function computeTkp(questions: any[], answers: Record<string, string>): number {
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

function computeStats(questions: any[], answers: Record<string, string>) {
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
        (q: any) => q.correct_answer && answers[q.id] === q.correct_answer,
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