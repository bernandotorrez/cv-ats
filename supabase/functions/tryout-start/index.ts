/**
 * tryout-start — Memulai attempt tryout baru.
 *
 * Flow:
 * 1. Validasi user authenticated.
 * 2. Cek apakah ada attempt `in_progress` untuk exam set ini. Jika ada → return
 *    attempt tersebut (auto-resume). Jangan buat attempt baru, jangan pakai kredit lagi.
 * 3. Cek kredit user (remaining_credits > 0, FIFO dari kredit terlama).
 * 4. Decrement `used_credits` pada row kredit tersebut.
 * 5. Insert `tryout_attempts` dengan status `in_progress`.
 * 6. Fetch soal dari `tryout_questions` (TANPA jawaban & pembahasan).
 * 7. Return: attempt_id, soal, started_at, expires_at, remaining_seconds.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type StartBody = {
  exam_set_id?: string;
  exam_set_slug?: string;
};

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
    const examSetId = (body.exam_set_id || "").trim();
    const examSetSlug = (body.exam_set_slug || "").trim();
    if (!examSetId && !examSetSlug) {
      return json(req, { error: "exam_set_id atau exam_set_slug wajib diisi." }, 400);
    }

    // 1. Fetch exam set
    let examQuery = admin.from("tryout_exam_sets").select("*").eq("is_active", true);
    if (examSetId) examQuery = examQuery.eq("id", examSetId);
    else examQuery = examQuery.eq("slug", examSetSlug);

    const { data: examSet, error: examErr } = await examQuery.maybeSingle();
    if (examErr) throw examErr;
    if (!examSet) {
      return json(req, { error: "Set tryout tidak ditemukan atau tidak aktif." }, 404);
    }

    // 2. Cek existing in_progress attempt (resume)
    const { data: existingAttempt } = await admin
      .from("tryout_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_set_id", examSet.id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existingAttempt) {
      // Resume: ambil soal tanpa jawaban, hitung sisa waktu
      const { data: questions } = await admin
        .from("tryout_questions")
        .select(
          "id, subtest, question_number, question_text, question_image_url, options, category, difficulty",
        )
        .eq("exam_set_id", examSet.id)
        .order("question_number", { ascending: true });

      const startedAt = existingAttempt.started_at;
      const durationMinutes = examSet.duration_minutes;
      const expiresAt = new Date(
        new Date(startedAt).getTime() + durationMinutes * 60_000,
      ).toISOString();
      const remainingSeconds = Math.max(
        0,
        Math.floor(
          (new Date(expiresAt).getTime() - Date.now()) / 1000,
        ),
      );

      return json(req, {
        resumed: true,
        attempt_id: existingAttempt.id,
        exam_set: examSet,
        questions: (questions || []).map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : [],
        })),
        answers: existingAttempt.answers || {},
        flagged: existingAttempt.flagged_questions || [],
        started_at: startedAt,
        expires_at: expiresAt,
        duration_minutes: durationMinutes,
        remaining_seconds: remainingSeconds,
      });
    }

    // 3. Cek kredit user (FIFO: paling lama dulu)
    const { data: credits, error: creditErr } = await admin
      .from("tryout_credits")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("remaining_credits", 0)
      .order("created_at", { ascending: true })
      .limit(1);

    if (creditErr) throw creditErr;
    if (!credits || credits.length === 0) {
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

    const credit = credits[0];

    // 4. Decrement used_credits
    const newUsed = (credit.used_credits || 0) + 1;
    if (newUsed > credit.total_credits) {
      return json(req, { error: "Kredit tidak cukup." }, 402);
    }
    const { error: updateErr } = await admin
      .from("tryout_credits")
      .update({ used_credits: newUsed })
      .eq("id", credit.id);
    if (updateErr) throw updateErr;

    // 5. Insert attempt baru
    const { data: newAttempt, error: insertErr } = await admin
      .from("tryout_attempts")
      .insert({
        user_id: userId,
        exam_set_id: examSet.id,
        credit_id: credit.id,
        status: "in_progress",
        answers: {},
        flagged_questions: [],
      })
      .select("*")
      .single();
    if (insertErr) throw insertErr;

    // 6. Fetch soal tanpa jawaban/pembahasan
    const { data: questions, error: qErr } = await admin
      .from("tryout_questions")
      .select(
        "id, subtest, question_number, question_text, question_image_url, options, category, difficulty",
      )
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    const startedAt = newAttempt.started_at;
    const durationMinutes = examSet.duration_minutes;
    const expiresAt = new Date(
      new Date(startedAt).getTime() + durationMinutes * 60_000,
    ).toISOString();
    const remainingSeconds = durationMinutes * 60;

    return json(req, {
      resumed: false,
      attempt_id: newAttempt.id,
      exam_set: examSet,
      questions: (questions || []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
      })),
      answers: {},
      flagged: [],
      started_at: startedAt,
      expires_at: expiresAt,
      duration_minutes: durationMinutes,
      remaining_seconds: remainingSeconds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-start error:", message);
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