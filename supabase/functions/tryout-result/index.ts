/**
 * tryout-result — Baca hasil attempt tryout yang sudah selesai.
 *
 * Input: { attempt_id: string }
 * Output: { attempt, exam_set, questions, has_pembahasan }
 *
 * Kunci jawaban, skor TKP, dan pembahasan hanya dikirim jika attempt sudah
 * selesai DAN paket kredit attempt tersebut punya `has_pembahasan`.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type QuestionRow = {
  id: string;
  subtest: "twk" | "tiu" | "tkp";
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
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXAM_SET_COLUMNS =
  "id, slug, name, description, total_questions, duration_minutes, twk_count, tiu_count, tkp_count, passing_grade_twk, passing_grade_tiu, passing_grade_tkp, is_active, is_free_preview, sort_order";

const PUBLIC_QUESTION_COLUMNS =
  "id, subtest, question_number, question_text, question_image_url, options, category, difficulty";

const PEMBAHASAN_QUESTION_COLUMNS =
  PUBLIC_QUESTION_COLUMNS + ", correct_answer, scores, explanation, explanation_image_url";

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
    const attemptId = typeof body?.attempt_id === "string" ? body.attempt_id.trim() : "";
    if (!attemptId || !UUID_RE.test(attemptId)) {
      return json(req, { error: "attempt_id wajib diisi." }, 400);
    }

    // 1. Fetch attempt + exam set
    const { data: attempt, error: attErr } = await admin
      .from("tryout_attempts")
      .select(
        `id, user_id, exam_set_id, credit_id, status, started_at, finished_at, duration_seconds, answers, stats, score_twk, score_tiu, score_tkp, score_total, pass_twk, pass_tiu, pass_tkp, pass_overall, tryout_exam_sets!inner(${EXAM_SET_COLUMNS})`,
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

    if (attempt.status === "in_progress") {
      return json(req, { error: "Attempt masih berjalan." }, 400);
    }

    // deno-lint-ignore no-explicit-any
    const examSet = attempt.tryout_exam_sets as any;

    // 2. Cek apakah paket user termasuk pembahasan
    let hasPembahasan = false;
    if (attempt.credit_id) {
      const { data: credit } = await admin
        .from("tryout_credits")
        .select("tryout_packages!inner(has_pembahasan)")
        .eq("id", attempt.credit_id)
        .maybeSingle();
      // Relasi many-to-one: runtime berupa object, bukan array
      const pkg = (credit as { tryout_packages?: { has_pembahasan?: boolean } } | null)
        ?.tryout_packages;
      hasPembahasan = !!pkg?.has_pembahasan;
    }

    // 3. Fetch questions — kunci & pembahasan hanya jika paket mencakupnya
    const { data: questions, error: qErr } = await admin
      .from("tryout_questions")
      .select(hasPembahasan ? PEMBAHASAN_QUESTION_COLUMNS : PUBLIC_QUESTION_COLUMNS)
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    const normalizedQuestions = ((questions || []) as unknown as QuestionRow[]).map((q) => {
      const base = {
        id: q.id,
        subtest: q.subtest,
        question_number: q.question_number,
        question_text: q.question_text,
        question_image_url: q.question_image_url,
        options: Array.isArray(q.options) ? q.options : [],
        category: q.category,
        difficulty: q.difficulty,
      };
      if (!hasPembahasan) return base;
      return {
        ...base,
        correct_answer: q.correct_answer ?? null,
        scores: q.scores ?? null,
        explanation: q.explanation ?? null,
        explanation_image_url: q.explanation_image_url ?? null,
      };
    });

    return json(req, {
      attempt: {
        id: attempt.id,
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
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: message }, 401);
    }
    return json(req, { error: "Gagal memuat hasil tryout." }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
