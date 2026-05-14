/**
 * AI Interview Simulator Edge Function
 *
 * POST /ai-interview - Generate interview questions or evaluate answers
 *
 * Body: { action: "generate" | "evaluate", position, level, industry?, questions?, answers?, cv?: object }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  aiComplete,
  type AiMessage,
  getLanguageInstruction,
  type CvUiLang,
} from "../_shared/ai-common.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Rate limit: 20 requests per minute per IP
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);
  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= 20) return false;
  record.count++;
  return true;
}

Deno.serve(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req), status: 204 });
  }

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Terlalu banyak request. Coba lagi nanti." }), {
      status: 429,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Check feature flag
    const { data: sub } = await (supabase as any)
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug, enable_interview_simulator)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!sub?.subscription_tiers?.enable_interview_simulator) {
      return new Response(JSON.stringify({ error: "Fitur ini hanya untuk pengguna Pro." }), {
        status: 403,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, position, level, industry, questions, answers, cv, language } = body;
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (action === "generate") {
      const result = await generateQuestions(position, level, industry, lang);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "evaluate") {
      const result = await evaluateAnswers(position, level, industry, questions, answers, lang);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "save_session") {
      const { sessionId, ...sessionData } = body;
      if (sessionId) {
        await (supabase as any)
          .from("interview_sessions")
          .update({ ...sessionData })
          .eq("id", sessionId)
          .eq("user_id", user.id);
      } else {
        await (supabase as any)
          .from("interview_sessions")
          .insert({ ...sessionData, user_id: user.id });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.message === "Unauthorized" ? 401 : 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
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
  const parsed = JSON.parse(result);
  return { questions: Array.isArray(parsed) ? parsed : (parsed.questions ?? []) };
}

async function evaluateAnswers(
  position: string,
  level: string,
  industry: string | undefined,
  questions: Array<{ id: string; question: string }>,
  answers: Array<{ id: string; answer: string }>,
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
      return `Q${i + 1}: ${q.question}\nA${i + 1}: ${a?.answer || "(tidak dijawab)"}`;
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
9. Jangan mengubah schema JSON.

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
  return JSON.parse(result);
}
