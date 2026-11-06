/**
 * tryout-submit — Submit jawaban tryout & hitung skor (server-authoritative).
 *
 * Flow:
 * 1. Validasi user own attempt & status `in_progress` + rate limit.
 * 2. Validasi waktu: deadline = started_at + duration. Jika submit datang
 *    setelah deadline + 60 detik, payload jawaban DIABAIKAN dan yang dinilai
 *    hanya jawaban yang sudah tersimpan lewat autosave (save_tryout_answers);
 *    status menjadi `timed_out`.
 * 3. Fetch soal + kunci (kolom eksplisit), hitung skor & statistik di server.
 * 4. Update attempt dengan guard `status = in_progress` (cegah double submit),
 *    pastikan tepat 1 baris berubah.
 * 5. Return ringkasan skor. Soal, kunci & pembahasan diambil lewat
 *    tryout-result (satu pintu entitlement).
 *
 * Skor, durasi, dan status TIDAK pernah diambil dari client. Jawaban hanya
 * diterima untuk id soal milik set ini dengan nilai A–E.
 */

import { getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  BodyTooLargeError,
  EXAM_SET_COLUMNS,
  GRACE_SECONDS,
  type QuestionRow,
  SCORING_QUESTION_COLUMNS,
  UUID_RE,
  cleanAnswers,
  cleanFlagged,
  computeScores,
  computeStats,
  isPlainObject,
  json,
  rateLimited,
  readJsonBody,
} from "../_shared/tryout.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const userId = await getUserId(req);
    const limited = rateLimited(req, userId, "tryout-submit", 10, 60_000);
    if (limited) return limited;

    const admin = getAdminClient();
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const attemptId = typeof body.attempt_id === "string" ? body.attempt_id.trim() : "";
    if (!attemptId || !UUID_RE.test(attemptId)) {
      return json(req, { error: "attempt_id wajib diisi." }, 400);
    }

    // 1. Attempt (hanya milik pemanggil)
    const { data: attempt, error: attErr } = await admin
      .from("tryout_attempts")
      .select(
        `id, user_id, exam_set_id, credit_id, status, started_at, answers, flagged_questions, tryout_exam_sets!inner(${EXAM_SET_COLUMNS})`,
      )
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();
    if (attErr) throw attErr;
    if (!attempt) {
      // Sama untuk "tidak ada" dan "bukan milikmu" — tidak membocorkan keberadaan id.
      return json(req, { error: "Attempt tidak ditemukan." }, 404);
    }
    if (attempt.status !== "in_progress") {
      return json(req, { error: "Attempt sudah disubmit.", status: attempt.status }, 409);
    }

    // deno-lint-ignore no-explicit-any
    const examSet = attempt.tryout_exam_sets as any;
    const durationMinutes: number = examSet.duration_minutes ?? 100;

    // 2. Validasi waktu (server-side anti-cheat)
    const startedAtMs = new Date(attempt.started_at).getTime();
    const deadlineMs = startedAtMs + durationMinutes * 60_000;
    const nowMs = Date.now();
    const pastGrace = nowMs > deadlineMs + GRACE_SECONDS * 1000;

    // 3. Soal + kunci
    const { data: questionsData, error: qErr } = await admin
      .from("tryout_questions")
      .select(SCORING_QUESTION_COLUMNS)
      .eq("exam_set_id", examSet.id);
    if (qErr) throw qErr;
    const questions = (questionsData || []) as QuestionRow[];
    const questionIds = new Set(questions.map((q) => q.id));

    // Setelah deadline + grace: payload diabaikan, hanya jawaban autosave.
    const storedAnswers = cleanAnswers(attempt.answers, questionIds);
    const storedFlagged = cleanFlagged(attempt.flagged_questions, questionIds);
    const answers =
      !pastGrace && isPlainObject(body.answers)
        ? cleanAnswers(body.answers, questionIds)
        : storedAnswers;
    const flagged =
      !pastGrace && Array.isArray(body.flagged_questions)
        ? cleanFlagged(body.flagged_questions, questionIds)
        : storedFlagged;

    // 4. Skor & statistik
    const score = computeScores(questions, answers, {
      twk: examSet.passing_grade_twk,
      tiu: examSet.passing_grade_tiu,
      tkp: examSet.passing_grade_tkp,
    });
    const stats = computeStats(questions, answers, flagged);
    const finishedAt = new Date(nowMs).toISOString();
    const durationSeconds = Math.max(
      0,
      Math.min(durationMinutes * 60, Math.floor((nowMs - startedAtMs) / 1000)),
    );
    const updateStatus = pastGrace ? "timed_out" : "completed";

    // 5. Update — hanya jika masih in_progress (cegah double submit)
    const { data: updatedRows, error: updateErr } = await admin
      .from("tryout_attempts")
      .update({
        status: updateStatus,
        answers,
        flagged_questions: flagged,
        score_twk: score.twk,
        score_tiu: score.tiu,
        score_tkp: score.tkp,
        score_total: score.total,
        pass_twk: score.pass_twk,
        pass_tiu: score.pass_tiu,
        pass_tkp: score.pass_tkp,
        pass_overall: score.pass_overall,
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
        score_twk: score.twk,
        score_tiu: score.tiu,
        score_tkp: score.tkp,
        score_total: score.total,
        pass_twk: score.pass_twk,
        pass_tiu: score.pass_tiu,
        pass_tkp: score.pass_tkp,
        pass_overall: score.pass_overall,
        started_at: attempt.started_at,
        finished_at: finishedAt,
        duration_seconds: durationSeconds,
      },
      answers_source: pastGrace ? "autosave" : "submit",
    });
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return json(req, { error: "Payload terlalu besar." }, 413);
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-submit error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Sesi login tidak valid. Silakan login ulang." }, 401);
    }
    return json(req, { error: "Gagal submit tryout. Coba lagi." }, 500);
  }
});
