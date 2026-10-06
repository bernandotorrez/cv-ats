/**
 * AI Interview Simulator Edge Function
 *
 * POST /ai-interview - Generate interview questions or evaluate answers
 *
 * Body: { action: "generate" | "evaluate" | "save_session", position, level, industry?, questions?, answers?, language? }
 */
import { corsHeaders } from "../_shared/cors.ts";
import {
  aiComplete,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  reserveQuota,
  type AiMessage,
  getLanguageInstruction,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  LIMITS,
  limitJson,
  limitText,
  readJsonBody,
  ValidationError,
} from "../_shared/validation.ts";

// ─── Input limits (M2) ─────────────────────────────────────────────

const MAX_QUESTIONS = 20;
const MAX_QUESTION_CHARS = 1_000;
const MAX_ANSWER_CHARS = 5_000;
const MAX_FEEDBACK_CHARS = 20_000;

type Question = { id: string; question: string };
/** `durationSec`/`wpm`/`fillerCount` hanya ada untuk jawaban yang direkam dengan suara. */
type Answer = {
  id: string;
  answer: string;
  durationSec?: number;
  wpm?: number;
  fillerCount?: number;
};

/** Angka opsional dari client: dibuang jika bukan angka valid, dibatasi ke rentang wajar. */
function readOptionalNumber(value: unknown, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return Math.min(Math.round(value), max);
}

function readContext(body: Record<string, unknown>) {
  const position = limitText(body.position, LIMITS.shortText, "position").trim();
  const level = limitText(body.level, 100, "level").trim();
  const industry = limitText(body.industry, LIMITS.shortText, "industry").trim() || undefined;
  return { position, level, industry };
}

function readQuestions(value: unknown): Question[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_QUESTIONS) {
    throw new ValidationError("Input questions tidak valid.");
  }
  return value.map((q) => {
    if (!q || typeof q !== "object") throw new ValidationError("Input questions tidak valid.");
    const item = q as Record<string, unknown>;
    return {
      id: limitText(String(item.id ?? ""), 50, "questions.id"),
      question: limitText(item.question, MAX_QUESTION_CHARS, "questions.question"),
    };
  });
}

function readAnswers(value: unknown): Answer[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_QUESTIONS) {
    throw new ValidationError("Input answers tidak valid.");
  }
  return value.map((a) => {
    if (!a || typeof a !== "object") throw new ValidationError("Input answers tidak valid.");
    const item = a as Record<string, unknown>;
    const answer: Answer = {
      id: limitText(String(item.id ?? ""), 50, "answers.id"),
      answer: limitText(item.answer, MAX_ANSWER_CHARS, "answers.answer"),
    };
    const durationSec = readOptionalNumber(item.durationSec, 1_800);
    const wpm = readOptionalNumber(item.wpm, 400);
    const fillerCount = readOptionalNumber(item.fillerCount, 500);
    if (durationSec !== undefined) answer.durationSec = durationSec;
    if (wpm !== undefined) answer.wpm = wpm;
    if (fillerCount !== undefined) answer.fillerCount = fillerCount;
    return answer;
  });
}

/**
 * L6: hanya kolom interview_sessions yang boleh diisi user (allow-list eksplisit).
 * Kolom id, user_id, created_at tidak pernah diambil dari body.
 */
function readSessionFields(body: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (body.position !== undefined) {
    fields.position = limitText(body.position, LIMITS.shortText, "position");
  }
  if (body.level !== undefined) fields.level = limitText(body.level, 100, "level");
  if (body.industry !== undefined) {
    fields.industry =
      body.industry === null ? null : limitText(body.industry, LIMITS.shortText, "industry");
  }
  if (body.questions !== undefined) fields.questions = readQuestions(body.questions);
  if (body.answers !== undefined) fields.answers = readAnswers(body.answers);
  if (body.scores !== undefined) {
    if (body.scores !== null && !Array.isArray(body.scores)) {
      throw new ValidationError("Input scores tidak valid.");
    }
    fields.scores = limitJson(body.scores ?? [], 50_000, "scores");
  }
  if (body.overall_score !== undefined) {
    const score = body.overall_score;
    if (score !== null && (typeof score !== "number" || !Number.isFinite(score))) {
      throw new ValidationError("Input overall_score tidak valid.");
    }
    fields.overall_score = score === null ? null : Math.max(0, Math.min(100, Math.round(score)));
  }
  if (body.feedback !== undefined) {
    fields.feedback =
      body.feedback === null ? null : limitText(body.feedback, MAX_FEEDBACK_CHARS, "feedback");
  }
  return fields;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req), status: 204 });
  }

  try {
    const userId = await getUserId(req);

    const rateLimitKey = `ai-interview:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Coba lagi nanti." }),
        corsHeaders(req),
      );
    }

    const admin = getAdminClient();

    // Check feature flag
    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, enable_interview_simulator)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const tier = (sub as { subscription_tiers?: { enable_interview_simulator?: boolean } } | null)
      ?.subscription_tiers;
    if (!tier?.enable_interview_simulator) {
      return corsResponse({ error: "Fitur ini hanya untuk pengguna Pro." }, 403, req);
    }

    const body = await readJsonBody(req, 200_000);
    const action = body.action;
    const lang: CvUiLang = body.language === "en" ? "en" : "id";

    if (action === "generate" || action === "evaluate") {
      const { position, level, industry } = readContext(body);
      if (!position || !level) throw new ValidationError("position dan level diperlukan");

      const questions = action === "evaluate" ? readQuestions(body.questions) : [];
      const answers = action === "evaluate" ? readAnswers(body.answers) : [];
      if (action === "evaluate" && questions.length === 0) {
        throw new ValidationError("questions diperlukan");
      }

      // H3: reservasi kuota SEBELUM memanggil AI; dikembalikan jika AI/parsing gagal
      const reservation = await reserveQuota(
        admin,
        userId,
        "interview_simulator",
        action === "generate" ? 400 : 600,
      );

      let result: unknown;
      try {
        result =
          action === "generate"
            ? await generateQuestions(position, level, industry, lang)
            : await evaluateAnswers(position, level, industry, questions, answers, lang);
      } catch (e) {
        await reservation.release();
        throw e;
      }
      return corsResponse(result, 200, req);
    }

    if (action === "save_session") {
      const sessionId = limitText(body.sessionId, 100, "sessionId");
      const fields = readSessionFields(body);

      if (sessionId) {
        if (Object.keys(fields).length === 0) {
          throw new ValidationError("Tidak ada data sesi untuk disimpan.");
        }
        const { data: updated, error } = await admin
          .from("interview_sessions")
          .update(fields)
          .eq("id", sessionId)
          .eq("user_id", userId)
          .select("id");
        if (error) {
          console.error("ai-interview save_session update failed:", error);
          throw new Error("Gagal menyimpan sesi wawancara.");
        }
        if (!updated || updated.length === 0) {
          return corsResponse({ error: "Sesi wawancara tidak ditemukan." }, 404, req);
        }
        return corsResponse({ success: true, id: sessionId }, 200, req);
      }

      if (!fields.position || !fields.level) {
        throw new ValidationError("position dan level diperlukan");
      }
      const { data: inserted, error } = await admin
        .from("interview_sessions")
        .insert({ ...fields, user_id: userId })
        .select("id")
        .single();
      if (error) {
        console.error("ai-interview save_session insert failed:", error);
        throw new Error("Gagal menyimpan sesi wawancara.");
      }
      return corsResponse({ success: true, id: inserted?.id }, 200, req);
    }

    throw new ValidationError("Invalid action");
  } catch (err) {
    return errorResponse(err, req);
  }
});

async function generateQuestions(
  position: string,
  level: string,
  industry: string | undefined,
  lang: CvUiLang,
) {
  const targetIndustry = industry?.trim() || "umum / lintas industri";
  const languageInstruction =
    lang === "en"
      ? "Write all questions in English."
      : "Tulis semua pertanyaan dalam Bahasa Indonesia yang natural dan profesional.";

  const messages: AiMessage[] = [
    {
      role: "system",
      content: `Kamu adalah interviewer senior dan HR business partner dengan pengalaman 20+ tahun.

Tugasmu: buat 8 pertanyaan interview yang sangat relevan dan terasa realistis untuk kandidat berikut:
- Posisi: ${position}
- Level senioritas: ${level}
- Industri: ${targetIndustry}

Prinsip kualitas pertanyaan:
1. Pertanyaan HARUS spesifik terhadap kombinasi posisi + level + industri. Jangan membuat pertanyaan generik yang bisa dipakai untuk semua role.
2. Sesuaikan kedalaman pertanyaan dengan level:
   - entry: fokus pada dasar, cara berpikir, potensi, learning agility, dan pengalaman awal.
   - mid: fokus pada ownership, problem solving, kolaborasi, eksekusi, dan hasil kerja.
   - senior: fokus pada decision making, trade-off, mentoring, sistem/proses, dan impact lintas tim.
   - manager/director: fokus pada strategi, people leadership, stakeholder management, prioritas bisnis, dan metrik.
3. Sesuaikan konteks dengan industri ${targetIndustry}: gunakan situasi, tantangan, KPI, stakeholder, regulasi, pelanggan, atau ritme kerja yang masuk akal untuk industri tersebut.
4. Buat campuran pertanyaan:
   - 2 behavioral berbasis pengalaman nyata
   - 2 situational / case-based sesuai industri
   - 2 technical / role-specific sesuai posisi
   - 1 leadership / collaboration
   - 1 motivation / culture fit
5. Pertanyaan harus singkat, jelas, dan mudah dijawab lewat suara.
6. Jangan menyebut bahwa kamu adalah AI.

Format output HARUS JSON array saja, tanpa markdown dan tanpa teks tambahan:
[{"id":"q1","question":"..."},{"id":"q2","question":"..."}]

${languageInstruction}`,
    },
    {
      role: "user",
      content: `Buat 8 pertanyaan interview untuk posisi ${position}, level ${level}, industri ${targetIndustry}. Pastikan setiap pertanyaan terasa spesifik untuk konteks tersebut.`,
    },
  ];

  const result = await aiComplete(messages, { temperature: 0.8, jsonMode: true }, lang);
  const parsed = parseAiJson<unknown[] | { questions?: unknown[] }>(result);
  return { questions: Array.isArray(parsed) ? parsed : (parsed.questions ?? []) };
}

async function evaluateAnswers(
  position: string,
  level: string,
  industry: string | undefined,
  questions: Question[],
  answers: Answer[],
  lang: CvUiLang,
) {
  const targetIndustry = industry?.trim() || "umum / lintas industri";
  const languageInstruction =
    lang === "en"
      ? "Write all feedback in English."
      : "Tulis semua feedback dalam Bahasa Indonesia yang natural, jelas, dan suportif.";
  const qaText = questions
    .map((q, i) => {
      const a = answers.find((a) => a.id === q.id);
      const delivery =
        a?.durationSec && a.durationSec > 0
          ? `\n(Cara bicara, dari rekaman suara: ${a.durationSec} detik` +
            `${a.wpm ? `, sekitar ${a.wpm} kata/menit` : ""}` +
            `, ${a.fillerCount ?? 0} kata pengisi terdeteksi)`
          : "";
      return `Q${i + 1}: ${q.question}\nA${i + 1}: ${a?.answer || "(tidak dijawab)"}${delivery}`;
    })
    .join("\n\n");

  const messages: AiMessage[] = [
    {
      role: "system",
      content: `Kamu adalah interviewer senior, HR profesional, dan career coach yang mengevaluasi jawaban interview secara jujur namun membangun.

Konteks kandidat:
- Posisi: ${position}
- Level senioritas: ${level}
- Industri: ${targetIndustry}

Cara menilai:
1. Nilai jawaban berdasarkan ekspektasi nyata untuk posisi, level, dan industri di atas.
2. Jangan beri skor tinggi untuk jawaban yang terdengar umum, terlalu pendek, tidak menjawab pertanyaan, atau tidak punya bukti.
3. Pertimbangkan 5 aspek utama:
   - Relevansi: apakah jawaban benar-benar menjawab pertanyaan?
   - Struktur: apakah alurnya jelas, idealnya STAR/CAR?
   - Kedalaman sesuai level: apakah kualitas jawaban cocok untuk ${level}?
   - Dampak: apakah ada hasil, angka, scope, stakeholder, atau pembelajaran konkret?
   - Komunikasi: apakah terdengar percaya diri, ringkas, dan profesional?
4. Untuk strength, tulis hal terbaik yang benar-benar terlihat dari jawaban.
5. Untuk weakness, tulis gap paling penting yang membuat jawaban kurang kuat.
6. Untuk suggestion, berikan saran praktis yang bisa langsung dipakai user untuk memperbaiki jawaban. Bila memungkinkan, arahkan ke struktur kalimat yang lebih baik, contoh metrik, atau detail konteks yang harus ditambahkan.
7. Feedback harus spesifik terhadap jawaban user. Hindari kalimat template seperti "jawaban sudah baik" tanpa alasan.
8. Jika jawaban kosong atau sangat minim, beri skor rendah dan jelaskan cara membangun jawaban dari nol.
9. Jika sebuah jawaban punya baris "Cara bicara" (dari rekaman suara), pertimbangkan tempo, durasi, dan kata pengisi pada aspek Komunikasi dan sebutkan hal terpentingnya di feedback umum. Transkrip berasal dari speech recognition, jadi jangan menghukum skor karena salah transkrip atau karena "eee/umm" yang tidak tertulis. Tempo wajar sekitar 100-170 kata/menit.
10. Jangan mengubah schema JSON.

Format output HARUS JSON valid saja, tanpa markdown dan tanpa teks tambahan:
{
  "evaluations": [{"id": "q1", "score": 0-100, "strength": "...", "weakness": "...", "suggestion": "..."}],
  "overall_score": 0-100,
  "feedback": "ringkasan feedback umum dalam 2-3 paragraf"
}

Aturan isi feedback umum:
- Paragraf 1: rangkum kesiapan kandidat untuk posisi ${position} level ${level}.
- Paragraf 2: sebutkan 2-3 pola perbaikan paling penting.
- Paragraf 3 opsional: beri arahan latihan berikutnya yang praktis.

${languageInstruction}`,
    },
    {
      role: "user",
      content: `Evaluasi jawaban interview berikut dengan konteks posisi ${position}, level ${level}, dan industri ${targetIndustry}. Pertahankan schema JSON yang diminta.\n\n${qaText}`,
    },
  ];

  const result = await aiComplete(
    messages,
    { temperature: 0.5, jsonMode: true, maxTokens: 3000 },
    lang,
  );
  return parseAiJson<Record<string, unknown>>(result);
}

function parseAiJson<T>(result: string): T {
  try {
    return JSON.parse(result);
  } catch {
    throw new Error("AI gagal memproses permintaan. Silakan coba lagi.");
  }
}
