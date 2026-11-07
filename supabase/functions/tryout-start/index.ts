/**
 * tryout-start — Memulai (atau melanjutkan) attempt tryout.
 *
 * Flow:
 * 1. Validasi user authenticated + rate limit.
 * 2. Ambil exam set aktif (by id atau slug).
 * 3. RPC `start_tryout_attempt` (service_role only) — dalam SATU transaksi:
 *    resume attempt `in_progress` yang sah (punya credit_id), atau potong 1
 *    kredit FIFO secara atomik (compare-and-set) lalu insert attempt baru.
 * 4. Fetch soal TANPA kunci jawaban, skor TKP, dan pembahasan; urut
 *    TWK → TIU → TKP seperti CAT BKN.
 * 5. Return: attempt_id, soal, started_at, expires_at, remaining_seconds,
 *    server_now (untuk koreksi selisih jam perangkat).
 */

import { getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  BodyTooLargeError,
  EXAM_SET_COLUMNS,
  PUBLIC_QUESTION_COLUMNS,
  type QuestionRow,
  UUID_RE,
  json,
  rateLimited,
  readJsonBody,
  shapePublicQuestion,
  sortQuestions,
} from "../_shared/tryout.ts";

type StartRpcResult = {
  attempt_id: string;
  credit_id: string | null;
  started_at: string;
  answers: Record<string, string> | null;
  flagged_questions: string[] | null;
  resumed: boolean;
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,119}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const userId = await getUserId(req);
    const limited = rateLimited(req, userId, "tryout-start", 20, 60_000);
    if (limited) return limited;

    const admin = getAdminClient();
    const body = (await readJsonBody(req, 4_096)) as Record<string, unknown>;
    const examSetId = typeof body.exam_set_id === "string" ? body.exam_set_id.trim() : "";
    const examSetSlug = typeof body.exam_set_slug === "string" ? body.exam_set_slug.trim() : "";
    if (!examSetId && !examSetSlug) {
      return json(req, { error: "exam_set_id atau exam_set_slug wajib diisi." }, 400);
    }
    if (examSetId && !UUID_RE.test(examSetId)) {
      return json(req, { error: "exam_set_id tidak valid." }, 400);
    }
    if (!examSetId && !SLUG_RE.test(examSetSlug)) {
      return json(req, { error: "exam_set_slug tidak valid." }, 400);
    }

    // 1. Exam set
    let examQuery = admin.from("tryout_exam_sets").select(EXAM_SET_COLUMNS).eq("is_active", true);
    examQuery = examSetId ? examQuery.eq("id", examSetId) : examQuery.eq("slug", examSetSlug);
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
            message: "Kamu belum punya kredit tryout. Beli paket Satuan atau Lengkap untuk mulai.",
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
      if (msg.includes("SET_INCOMPLETE")) {
        return json(
          req,
          {
            error: "SET_INCOMPLETE",
            message:
              "Set tryout ini sedang disiapkan dan soalnya belum lengkap. Kredit kamu tidak terpakai — coba set lain atau kembali nanti.",
          },
          409,
        );
      }
      if (msg.includes("EXAM_SET_NOT_FOUND")) {
        return json(req, { error: "Set tryout tidak ditemukan atau tidak aktif." }, 404);
      }
      throw rpcErr;
    }

    const started = rpcData as StartRpcResult | null;
    if (!started?.attempt_id) throw new Error("Gagal memulai attempt.");

    // 3. Soal tanpa jawaban/pembahasan
    const { data: questions, error: qErr } = await admin
      .from("tryout_questions")
      .select(PUBLIC_QUESTION_COLUMNS)
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    const nowMs = Date.now();
    const durationMinutes = examSet.duration_minutes ?? 100;
    const expiresAtMs = new Date(started.started_at).getTime() + durationMinutes * 60_000;

    return json(req, {
      resumed: !!started.resumed,
      attempt_id: started.attempt_id,
      exam_set: examSet,
      questions: sortQuestions((questions || []) as QuestionRow[]).map(shapePublicQuestion),
      answers: started.answers || {},
      flagged: started.flagged_questions || [],
      started_at: started.started_at,
      expires_at: new Date(expiresAtMs).toISOString(),
      duration_minutes: durationMinutes,
      remaining_seconds: Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000)),
      server_now: new Date(nowMs).toISOString(),
    });
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return json(req, { error: "Payload terlalu besar." }, 413);
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-start error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Sesi login tidak valid. Silakan login ulang." }, 401);
    }
    return json(req, { error: "Gagal memulai tryout. Coba lagi." }, 500);
  }
});
