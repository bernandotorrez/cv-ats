/**
 * tryout-explain — Pembahasan detail soal (AI, di-cache di DB).
 *
 * Mode:
 * 1. Peserta: { question_id, attempt_id }
 *    - attempt milik pemanggil, sudah selesai, set soal sama dengan soal,
 *      dan paket kredit attempt punya `has_pembahasan`.
 *    - Jika detail sudah ada → langsung dikembalikan (tanpa AI).
 * 2. Admin satu soal: { question_id, force?: boolean } — force = buat ulang.
 * 3. Admin massal: { exam_set_id, limit?: 1-5 } — isi soal yang belum punya
 *    detail. Return { processed, failed, disputed[], remaining }.
 *
 * Detail yang "disputed" (AI menilai kunci salah) tidak disimpan; dikembalikan
 * ke admin untuk diperiksa. Kunci jawaban tidak pernah dikirim ke peserta
 * yang tidak berhak (cek entitlement sama seperti tryout-result).
 */
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  BodyTooLargeError,
  PUBLIC_QUESTION_COLUMNS,
  type QuestionRow,
  UUID_RE,
  fetchHasPembahasan,
  json,
  rateLimited,
  readJsonBody,
} from "../_shared/tryout.ts";
import { generateExplanation } from "../_shared/tryout-explain.ts";

const QUESTION_COLUMNS =
  PUBLIC_QUESTION_COLUMNS +
  ", exam_set_id, correct_answer, scores, explanation, explanation_detail";

type Row = QuestionRow & { exam_set_id: string; explanation_detail: unknown };

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
    const body = (await readJsonBody(req, 4_096)) as Record<string, unknown>;

    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!role;

    const limited = isAdmin
      ? rateLimited(req, userId, "tryout-explain-admin", 200, 10 * 60_000)
      : rateLimited(req, userId, "tryout-explain", 30, 10 * 60_000);
    if (limited) return limited;

    // ─── Mode admin massal ────────────────────────────────────────────────
    if (typeof body.exam_set_id === "string") {
      if (!isAdmin) return json(req, { error: "Forbidden: hanya admin." }, 403);
      const examSetId = body.exam_set_id.trim();
      if (!UUID_RE.test(examSetId)) return json(req, { error: "exam_set_id tidak valid." }, 400);
      const rawLimit = Number(body.limit);
      const limit = Number.isFinite(rawLimit) ? Math.min(5, Math.max(1, Math.floor(rawLimit))) : 3;
      const skip = Array.isArray(body.skip_ids)
        ? body.skip_ids
            .filter((x): x is string => typeof x === "string" && UUID_RE.test(x))
            .slice(0, 200)
        : [];

      let query = admin
        .from("tryout_questions")
        .select(QUESTION_COLUMNS)
        .eq("exam_set_id", examSetId)
        .is("explanation_detail", null)
        .order("question_number", { ascending: true })
        .limit(limit);
      if (skip.length) query = query.not("id", "in", `(${skip.join(",")})`);
      const { data: rows, error } = await query;
      if (error) throw error;

      const results = await Promise.all(
        ((rows || []) as unknown as Row[]).map(async (q) => {
          try {
            const out = await generateExplanation(q);
            if (out.ok) {
              await saveDetail(admin, q.id, out.detail);
              return { id: q.id, status: "ok" as const };
            }
            return {
              id: q.id,
              question_number: q.question_number,
              status: out.disputed ? ("disputed" as const) : ("failed" as const),
              reason: out.reason,
            };
          } catch (err) {
            console.error("tryout-explain bulk:", err instanceof Error ? err.message : err);
            return {
              id: q.id,
              question_number: q.question_number,
              status: "failed" as const,
              reason: "Gagal memanggil AI",
            };
          }
        }),
      );

      const { count: remaining } = await admin
        .from("tryout_questions")
        .select("id", { count: "exact", head: true })
        .eq("exam_set_id", examSetId)
        .is("explanation_detail", null);

      return json(req, {
        processed: results.filter((r) => r.status === "ok").length,
        failed: results.filter((r) => r.status === "failed"),
        disputed: results.filter((r) => r.status === "disputed"),
        remaining: remaining ?? 0,
      });
    }

    // ─── Mode satu soal ───────────────────────────────────────────────────
    const questionId = typeof body.question_id === "string" ? body.question_id.trim() : "";
    if (!UUID_RE.test(questionId)) return json(req, { error: "question_id tidak valid." }, 400);

    const { data: qData, error: qErr } = await admin
      .from("tryout_questions")
      .select(QUESTION_COLUMNS)
      .eq("id", questionId)
      .maybeSingle();
    if (qErr) throw qErr;
    const q = qData as unknown as Row | null;
    if (!q) return json(req, { error: "Soal tidak ditemukan." }, 404);

    const force = isAdmin && body.force === true;

    if (!isAdmin) {
      const attemptId = typeof body.attempt_id === "string" ? body.attempt_id.trim() : "";
      if (!UUID_RE.test(attemptId)) return json(req, { error: "attempt_id tidak valid." }, 400);
      const { data: attempt } = await admin
        .from("tryout_attempts")
        .select("id, exam_set_id, credit_id, status")
        .eq("id", attemptId)
        .eq("user_id", userId)
        .maybeSingle();
      // Pesan seragam: tidak membocorkan apakah soal/attempt ada.
      const deny = () =>
        json(req, { error: "Pembahasan detail hanya untuk paket dengan pembahasan." }, 403);
      if (!attempt || attempt.exam_set_id !== q.exam_set_id) return deny();
      if (attempt.status !== "completed" && attempt.status !== "timed_out") return deny();
      if (!(await fetchHasPembahasan(admin, attempt.credit_id))) return deny();
    }

    if (q.explanation_detail && !force) {
      return json(req, { detail: q.explanation_detail, cached: true });
    }

    const out = await generateExplanation(q);
    if (!out.ok) {
      console.warn("tryout-explain:", questionId, out.reason);
      if (out.disputed) {
        return json(
          req,
          {
            error: "DISPUTED",
            message: isAdmin
              ? `AI meragukan kunci soal ini: ${out.reason}`
              : "Pembahasan detail untuk soal ini sedang ditinjau tim kami. Silakan laporkan jika menurutmu kuncinya keliru.",
          },
          422,
        );
      }
      if (out.reason.startsWith("Soal bergambar")) {
        return json(
          req,
          {
            error: "IMAGE_QUESTION",
            message: isAdmin
              ? out.reason
              : "Pembahasan detail untuk soal bergambar belum tersedia. Lihat pembahasan singkat di atas.",
          },
          422,
        );
      }
      return json(req, { error: "Gagal membuat pembahasan detail. Coba lagi sebentar." }, 502);
    }

    await saveDetail(admin, q.id, out.detail);
    return json(req, { detail: out.detail, cached: false });
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return json(req, { error: "Payload terlalu besar." }, 413);
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-explain error:", message);
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Sesi login tidak valid. Silakan login ulang." }, 401);
    }
    return json(req, { error: "Gagal memuat pembahasan detail." }, 500);
  }
});

// deno-lint-ignore no-explicit-any
async function saveDetail(admin: any, id: string, detail: unknown) {
  const { error } = await admin
    .from("tryout_questions")
    .update({ explanation_detail: detail, explanation_detail_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
