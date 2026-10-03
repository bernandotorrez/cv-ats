/**
 * tryout-start — Memulai (atau melanjutkan) attempt tryout.
 *
 * Flow:
 * 1. Validasi user authenticated.
 * 2. Ambil exam set aktif (by id atau slug).
 * 3. RPC `start_tryout_attempt` (service_role only) — dalam SATU transaksi:
 *    resume attempt `in_progress` yang sah (punya credit_id), atau potong 1
 *    kredit FIFO secara atomik (compare-and-set) lalu insert attempt baru.
 * 4. Fetch soal dari `tryout_questions` TANPA kunci jawaban, skor TKP, dan
 *    pembahasan.
 * 5. Return: attempt_id, soal, started_at, expires_at, remaining_seconds.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type StartBody = {
  exam_set_id?: string;
  exam_set_slug?: string;
};

type StartRpcResult = {
  attempt_id: string;
  credit_id: string | null;
  started_at: string;
  answers: Record<string, string> | null;
  flagged_questions: string[] | null;
  resumed: boolean;
};

// Kolom aman untuk dikirim saat ujian berlangsung. JANGAN tambahkan
// correct_answer, scores, explanation, explanation_image_url.
const PUBLIC_QUESTION_COLUMNS =
  "id, subtest, question_number, question_text, question_image_url, options, category, difficulty";

const EXAM_SET_COLUMNS =
  "id, slug, name, description, total_questions, duration_minutes, twk_count, tiu_count, tkp_count, passing_grade_twk, passing_grade_tiu, passing_grade_tkp, is_active, is_free_preview, sort_order";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const body = (await req.json().catch(() => ({}))) as StartBody;
    const examSetId = typeof body.exam_set_id === "string" ? body.exam_set_id.trim() : "";
    const examSetSlug = typeof body.exam_set_slug === "string" ? body.exam_set_slug.trim() : "";
    if (!examSetId && !examSetSlug) {
      return json(req, { error: "exam_set_id atau exam_set_slug wajib diisi." }, 400);
    }
    if (examSetId && !UUID_RE.test(examSetId)) {
      return json(req, { error: "exam_set_id tidak valid." }, 400);
    }
    if (examSetSlug && examSetSlug.length > 120) {
      return json(req, { error: "exam_set_slug tidak valid." }, 400);
    }

    // 1. Fetch exam set
    let examQuery = admin.from("tryout_exam_sets").select(EXAM_SET_COLUMNS).eq("is_active", true);
    if (examSetId) examQuery = examQuery.eq("id", examSetId);
    else examQuery = examQuery.eq("slug", examSetSlug);

    const { data: examSet, error: examErr } = await examQuery.maybeSingle();
    if (examErr) throw examErr;
    if (!examSet) {
      return json(req, { error: "Set tryout tidak ditemukan atau tidak aktif." }, 404);
    }

    // 2. Resume atau konsumsi kredit + insert attempt (atomik, di DB)
    const { data: rpcData, error: rpcErr } = await admin.rpc("start_tryout_attempt", {
      p_user_id: userId,
      p_exam_set_id: examSet.id,
    });

    if (rpcErr) {
      const msg = rpcErr.message || "";
      if (msg.includes("NO_CREDITS")) {
        return json(
          req,
          {
            error: "NO_CREDITS",
            message:
              "Kamu belum punya kredit tryout. Beli paket Satuan atau Lengkap untuk mulai.",
          },
          402,
        );
      }
      if (msg.includes("NO_QUESTIONS")) {
        return json(
          req,
          { error: "Set tryout ini belum memiliki soal. Kredit kamu tidak terpakai." },
          409,
        );
      }
      if (msg.includes("EXAM_SET_NOT_FOUND")) {
        return json(req, { error: "Set tryout tidak ditemukan atau tidak aktif." }, 404);
      }
      throw rpcErr;
    }

    const started = rpcData as StartRpcResult | null;
    if (!started?.attempt_id) {
      throw new Error("Gagal memulai attempt.");
    }

    // 3. Fetch soal tanpa jawaban/pembahasan
    const { data: questions, error: qErr } = await admin
      .from("tryout_questions")
      .select(PUBLIC_QUESTION_COLUMNS)
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    const startedAt = started.started_at;
    const durationMinutes = examSet.duration_minutes ?? 100;
    const expiresAtMs = new Date(startedAt).getTime() + durationMinutes * 60_000;
    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));

    return json(req, {
      resumed: !!started.resumed,
      attempt_id: started.attempt_id,
      exam_set: examSet,
      questions: (questions || []).map((q) => ({
        id: q.id,
        subtest: q.subtest,
        question_number: q.question_number,
        question_text: q.question_text,
        question_image_url: q.question_image_url,
        options: Array.isArray(q.options) ? q.options : [],
        category: q.category,
        difficulty: q.difficulty,
      })),
      answers: started.answers || {},
      flagged: started.flagged_questions || [],
      started_at: startedAt,
      expires_at: new Date(expiresAtMs).toISOString(),
      duration_minutes: durationMinutes,
      remaining_seconds: remainingSeconds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-start error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: message }, 401);
    }
    return json(req, { error: "Gagal memulai tryout. Coba lagi." }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
