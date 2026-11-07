/**
 * tryout-result — Baca hasil attempt tryout yang sudah selesai.
 *
 * Input: { attempt_id: string }
 * Output: { attempt, exam_set, questions, has_pembahasan, insights, history }
 *
 * - Hanya pemilik attempt yang bisa membaca (filter user_id di query).
 * - Kunci jawaban, skor TKP, dan pembahasan hanya dikirim jika attempt sudah
 *   selesai DAN paket kredit attempt tersebut punya `has_pembahasan`.
 * - insights: rank & persentil di antara peserta set yang sama, rata-rata skor
 *   peserta lain, tingkat kelulusan (RPC service_role, agregat — tanpa data
 *   pribadi user lain).
 * - history: 10 attempt terakhir milik user (untuk grafik progres).
 */
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  BodyTooLargeError,
  EXAM_SET_COLUMNS,
  PEMBAHASAN_COLUMNS,
  PUBLIC_QUESTION_COLUMNS,
  type QuestionRow,
  UUID_RE,
  fetchHasPembahasan,
  json,
  rateLimited,
  readJsonBody,
  shapeResultQuestion,
  sortQuestions,
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
    const limited = rateLimited(req, userId, "tryout-result", 60, 60_000);
    if (limited) return limited;

    const admin = getAdminClient();
    const body = (await readJsonBody(req, 4_096)) as Record<string, unknown>;
    const attemptId = typeof body.attempt_id === "string" ? body.attempt_id.trim() : "";
    if (!attemptId || !UUID_RE.test(attemptId)) {
      return json(req, { error: "attempt_id wajib diisi." }, 400);
    }

    // 1. Attempt + exam set (hanya milik pemanggil)
    const { data: attempt, error: attErr } = await admin
      .from("tryout_attempts")
      .select(
        `id, user_id, exam_set_id, credit_id, is_free, status, started_at, finished_at, duration_seconds, answers, flagged_questions, stats, score_twk, score_tiu, score_tkp, score_total, pass_twk, pass_tiu, pass_tkp, pass_overall, tryout_exam_sets!inner(${EXAM_SET_COLUMNS})`,
      )
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();
    if (attErr) throw attErr;
    if (!attempt) {
      return json(req, { error: "Hasil tidak ditemukan." }, 404);
    }
    if (attempt.status === "in_progress") {
      return json(req, { error: "Ujian masih berjalan.", status: "in_progress" }, 409);
    }

    // deno-lint-ignore no-explicit-any
    const examSet = attempt.tryout_exam_sets as any;

    // 2. Entitlement pembahasan
    const hasPembahasan = await fetchHasPembahasan(admin, attempt.credit_id);

    // 3. Soal, insight, dan riwayat (paralel)
    const [questionsRes, insightsRes, historyRes] = await Promise.all([
      admin
        .from("tryout_questions")
        .select(
          hasPembahasan
            ? PUBLIC_QUESTION_COLUMNS + ", correct_answer, scores" + PEMBAHASAN_COLUMNS
            : PUBLIC_QUESTION_COLUMNS,
        )
        .eq("exam_set_id", examSet.id),
      admin.rpc("get_tryout_attempt_insights", {
        p_user_id: userId,
        p_attempt_id: attemptId,
      }),
      admin
        .from("tryout_attempts")
        .select(
          "id, exam_set_id, finished_at, score_total, score_twk, score_tiu, score_tkp, pass_overall, tryout_exam_sets(name, twk_count, tiu_count, tkp_count)",
        )
        .eq("user_id", userId)
        .in("status", ["completed", "timed_out"])
        .order("finished_at", { ascending: false })
        .limit(10),
    ]);
    if (questionsRes.error) throw questionsRes.error;
    if (insightsRes.error) console.warn("tryout-result insights:", insightsRes.error.message);
    if (historyRes.error) console.warn("tryout-result history:", historyRes.error.message);

    const questions = sortQuestions((questionsRes.data || []) as unknown as QuestionRow[]).map(
      (q) => shapeResultQuestion(q, hasPembahasan),
    );

    const history = (historyRes.data || [])
      // deno-lint-ignore no-explicit-any
      .map((h: any) => ({
        id: h.id,
        exam_set_id: h.exam_set_id,
        exam_name: h.tryout_exam_sets?.name ?? null,
        max_total: h.tryout_exam_sets
          ? 5 *
            ((h.tryout_exam_sets.twk_count ?? 30) +
              (h.tryout_exam_sets.tiu_count ?? 35) +
              (h.tryout_exam_sets.tkp_count ?? 45))
          : 550,
        finished_at: h.finished_at,
        score_total: h.score_total,
        score_twk: h.score_twk,
        score_tiu: h.score_tiu,
        score_tkp: h.score_tkp,
        pass_overall: h.pass_overall,
      }))
      .reverse(); // kronologis: lama → baru

    return json(req, {
      attempt: {
        id: attempt.id,
        exam_set_id: examSet.id,
        status: attempt.status,
        is_free: !!attempt.is_free,
        score_twk: attempt.score_twk,
        score_tiu: attempt.score_tiu,
        score_tkp: attempt.score_tkp,
        score_total: attempt.score_total,
        pass_twk: attempt.pass_twk,
        pass_tiu: attempt.pass_tiu,
        pass_tkp: attempt.pass_tkp,
        pass_overall: attempt.pass_overall,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        duration_seconds: attempt.duration_seconds,
        answers: attempt.answers || {},
        flagged_questions: Array.isArray(attempt.flagged_questions)
          ? attempt.flagged_questions
          : [],
        stats: attempt.stats || {},
      },
      exam_set: examSet,
      questions,
      has_pembahasan: hasPembahasan,
      insights: insightsRes.error ? null : (insightsRes.data ?? null),
      history,
    });
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return json(req, { error: "Payload terlalu besar." }, 413);
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-result error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Sesi login tidak valid. Silakan login ulang." }, 401);
    }
    return json(req, { error: "Gagal memuat hasil tryout." }, 500);
  }
});
