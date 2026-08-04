/**
 * tryout-result — Baca hasil attempt tryout yang sudah selesai.
 *
 * Input: { attempt_id: string }
 * Output: { attempt, exam_set, questions, has_pembahasan }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

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

    const body = await req.json().catch(() => ({}));
    const attemptId = (body.attempt_id || "").trim();
    if (!attemptId) {
      return json(req, { error: "attempt_id wajib diisi." }, 400);
    }

    // 1. Fetch attempt + exam set
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

    if (attempt.status === "in_progress") {
      return json(req, { error: "Attempt masih berjalan." }, 400);
    }

    const examSet = attempt.tryout_exam_sets;

    // 2. Fetch questions (full)
    const { data: questions, error: qErr } = await admin
      .from("tryout_questions")
      .select("*")
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    const normalizedQuestions = (questions || []).map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
    }));

    // 3. Cek apakah paket user termasuk pembahasan
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
        id: attempt.id,
        user_id: attempt.user_id,
        exam_set_id: examSet.id,
        status: attempt.status,
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
        stats: attempt.stats || {},
      },
      exam_set: examSet,
      questions: normalizedQuestions,
      has_pembahasan: hasPembahasan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-result error:", message);
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
