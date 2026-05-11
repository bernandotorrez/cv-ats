/**
 * AI Interview Simulator Edge Function
 * 
 * POST /ai-interview - Generate interview questions or evaluate answers
 * 
 * Body: { action: "generate" | "evaluate", position, level, industry?, questions?, answers?, cv?: object }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { aiCompletion, type AiMessage } from "../_shared/ai-common.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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
      status: 429, headers: { ...corsHeaders(req), "Content-Type": "application/json" }
    });
  }

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
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
        status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    const { action, position, level, industry, questions, answers, cv } = body;

    if (action === "generate") {
      const result = await generateQuestions(position, level, industry);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" }
      });
    }

    if (action === "evaluate") {
      const result = await evaluateAnswers(position, level, industry, questions, answers);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" }
      });
    }

    if (action === "save_session") {
      const { sessionId, ...sessionData } = body;
      if (sessionId) {
        await (supabase as any).from("interview_sessions").update({ ...sessionData }).eq("id", sessionId).eq("user_id", user.id);
      } else {
        await (supabase as any).from("interview_sessions").insert({ ...sessionData, user_id: user.id });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" }
      });
    }

    throw new Error("Invalid action");

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.message === "Unauthorized" ? 401 : 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" }
    });
  }
});

async function generateQuestions(position: string, level: string, industry?: string) {
  const messages: AiMessage[] = [
    {
      role: "system",
      content: `Kamu adalah HR profesional Indonesia dengan 20 tahun pengalaman di ${industry || "berbagai industri"}. 
Buatlah 8 pertanyaan interview untuk posisi ${position} (${level}).
Pertanyaan harus mencakup: behavioral, situational, technical, dan soft skills.
Format output HARUS JSON array: [{"id": "q1", "question": "..."}, ...]
Bahasa: Indonesia.`
    },
    { role: "user", content: `Generate 8 interview questions untuk ${position} level ${level}.` }
  ];

  const result = await aiCompletion(messages, { temperature: 0.8, jsonMode: true });
  const parsed = JSON.parse(result);
  return { questions: Array.isArray(parsed) ? parsed : parsed.questions ?? [] };
}

async function evaluateAnswers(
  position: string,
  level: string,
  industry: string | undefined,
  questions: Array<{ id: string; question: string }>,
  answers: Array<{ id: string; answer: string }>
) {
  const qaText = questions.map((q, i) => {
    const a = answers.find(a => a.id === q.id);
    return `Q${i + 1}: ${q.question}\nA${i + 1}: ${a?.answer || "(tidak dijawab)"}`;
  }).join("\n\n");

  const messages: AiMessage[] = [
    {
      role: "system",
      content: `Kamu adalah HR profesional yang mengevaluasi jawaban interview.
Posisi: ${position} (${level}), Industri: ${industry || "Umum"}.

Evaluasi setiap jawaban dengan kriteria:
1. Relevansi (apakah menjawab pertanyaan?)
2. Struktur (apakah pakai format STAR/CAR?)
3. Dampak (apakah ada angka atau hasil konkret?)
4. Kepercayaan diri

Format output HARUS JSON:
{
  "evaluations": [{"id": "q1", "score": 0-100, "strength": "...", "weakness": "...", "suggestion": "..."}],
  "overall_score": 0-100,
  "feedback": "ringkasan feedback umum dalam 2-3 paragraf"
}
Bahasa: Indonesia.`
    },
    { role: "user", content: qaText }
  ];

  const result = await aiCompletion(messages, { temperature: 0.5, jsonMode: true, maxTokens: 3000 });
  return JSON.parse(result);
}
