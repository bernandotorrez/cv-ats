/**
 * tryout-generate-questions — Generate soal tryout SKD menggunakan AI.
 *
 * Admin only. Menggunakan AI gateway yang sama dengan fitur lain (sumopod + gemini).
 *
 * Body:
 * - exam_set_id: UUID (wajib)
 * - subtest: 'twk' | 'tiu' | 'tkp' (wajib)
 * - count: number (1-45, default 10)
 * - category: string (opsional, misal "Pancasila", "Numerik", "Pelayanan Publik")
 * - difficulty: 'easy' | 'medium' | 'hard' (default 'medium')
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const AI_MODEL = "gemini/gemini-3.1-flash-lite";

type GenerateBody = {
  exam_set_id?: string;
  subtest?: "twk" | "tiu" | "tkp";
  count?: number;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const requesterId = await getUserId(req);
    const admin = getAdminClient();

    // Validasi admin
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      return json(req, { error: "Forbidden: hanya admin." }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as GenerateBody;
    const examSetId = (body.exam_set_id || "").trim();
    const subtest = body.subtest;
    const count = Math.min(45, Math.max(1, body.count || 10));
    const category = (body.category || "").trim();
    const difficulty = body.difficulty || "medium";

    if (!examSetId) {
      return json(req, { error: "exam_set_id wajib diisi." }, 400);
    }
    if (!subtest || !["twk", "tiu", "tkp"].includes(subtest)) {
      return json(req, { error: "subtest harus twk, tiu, atau tkp." }, 400);
    }

    // Cek exam set exists
    const { data: examSet } = await admin
      .from("tryout_exam_sets")
      .select("id, name")
      .eq("id", examSetId)
      .maybeSingle();
    if (!examSet) {
      return json(req, { error: "Exam set tidak ditemukan." }, 404);
    }

    // Cek nomor soal terakhir yang sudah ada
    const { data: lastQ } = await admin
      .from("tryout_questions")
      .select("question_number")
      .eq("exam_set_id", examSetId)
      .eq("subtest", subtest)
      .order("question_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startNumber = lastQ ? lastQ.question_number + 1 : 1;

    // Generate soal via AI
    const aiKey = Deno.env.get("AI_API_KEY");
    if (!aiKey) {
      return json(req, { error: "AI_API_KEY tidak dikonfigurasi." }, 500);
    }

    const prompt = buildPrompt(subtest, count, category, difficulty, startNumber);

    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah pembuat soal CPNS SKD yang sangat berpengalaman. Output hanya JSON valid. Jangan gunakan markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("AI error:", res.status, errText);
      return json(req, { error: "Gagal generate soal dari AI." }, 500);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = parseQuestions(content);

    if (!parsed || parsed.length === 0) {
      return json(req, { error: "AI tidak menghasilkan soal yang valid.", raw: content }, 500);
    }

    // Insert ke database
    const rows = parsed.map((q: any, idx: number) => ({
      exam_set_id: examSetId,
      subtest,
      question_number: startNumber + idx,
      question_text: q.question_text || "",
      options: q.options || [],
      correct_answer: subtest === "tkp" ? null : q.correct_answer || null,
      scores: subtest === "tkp" ? q.scores || null : null,
      explanation: q.explanation || null,
      category: category || q.category || null,
      difficulty,
    }));

    const { data: inserted, error: insertErr } = await admin
      .from("tryout_questions")
      .insert(rows)
      .select("id, question_number, question_text");

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return json(req, { error: `Gagal menyimpan soal: ${insertErr.message}` }, 500);
    }

    return json(req, {
      success: true,
      generated: inserted?.length || 0,
      start_number: startNumber,
      questions: inserted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-generate-questions error:", message);
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

function buildPrompt(
  subtest: string,
  count: number,
  category: string,
  difficulty: string,
  startNumber: number,
): string {
  const categoryHint = category ? `kategori "${category}"` : `berbagai kategori relevan`;
  const difficultyDesc =
    difficulty === "easy"
      ? "mudah (fresh graduate harus bisa)"
      : difficulty === "hard"
        ? "sulit (butuh pemahaman mendalam)"
        : "sedang (standar ujian SKD asli)";

  if (subtest === "tkp") {
    return [
      `Buatkan ${count} soal TKP (Tes Karakteristik Pribadi) untuk simulasi SKD CPNS.`,
      `Tingkat kesulitan: ${difficultyDesc}.`,
      category ? `Fokus kategori: ${category}.` : "Campurkan berbagai kategori: Pelayanan Publik, Jejaring Kerja, Profesionalisme, Integritas.",
      "",
      "Format setiap soal:",
      "- question_text: situasi kerja nyata di pemerintahan (1-2 kalimat)",
      "- options: 5 pilihan (A/B/C/D/E), masing-masing 1 kalimat pendek",
      "- scores: objek {A:n, B:n, C:n, D:n, E:n} di mana n = 1-5 (5=paling baik, 1=paling buruk)",
      "- explanation: mengapa skor tertinggi paling baik (1 kalimat)",
      "- category: sub-kategori soal",
      "",
      "ATURAN PENTING:",
      "- Jangan buat soal yang sama atau sangat mirip.",
      "- Setiap soal harus punya 1 jawaban terbaik (skor 5) dan 1 terburuk (skor 1).",
      "- Pilihan harus realistis dan relevan dengan konteks ASN Indonesia.",
      "",
      `Nomor soal mulai dari ${startNumber}.`,
      "",
      'Output JSON: {"questions": [{question_number, question_text, options:[{key,text}], scores:{A:5,B:4,...}, explanation, category}]}',
    ].join("\n");
  }

  if (subtest === "twk") {
    return [
      `Buatkan ${count} soal TWK (Tes Wawasan Kebangsaan) untuk simulasi SKD CPNS.`,
      `Tingkat kesulitan: ${difficultyDesc}.`,
      category ? `Fokus kategori: ${category}.` : "Campurkan kategori: Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika, Peristiwa Bersejarah.",
      "",
      "Format setiap soal:",
      "- question_text: pertanyaan pilihan ganda (1-2 kalimat)",
      "- options: 5 pilihan (A/B/C/D/E), masing-masing 1 frasa/kalimat pendek",
      "- correct_answer: huruf pilihan yang benar (A/B/C/D/E)",
      "- explanation: penjelasan mengapa jawaban itu benar (1-2 kalimat)",
      "- category: sub-kategori soal",
      "",
      "ATURAN PENTING:",
      "- Soal harus faktual dan jawaban benar harus akurat.",
      "- Jangan buat soal yang ambigu atau bisa diperdebatkan.",
      "- Pilihan salah harus plausible tapi jelas salah.",
      "",
      `Nomor soal mulai dari ${startNumber}.`,
      "",
      'Output JSON: {"questions": [{question_number, question_text, options:[{key,text}], correct_answer, explanation, category}]}',
    ].join("\n");
  }

  // TIU
  return [
    `Buatkan ${count} soal TIU (Tes Intelegensi Umum) untuk simulasi SKD CPNS.`,
    `Tingkat kesulitan: ${difficultyDesc}.`,
    category ? `Fokus kategori: ${category}.` : "Campurkan kategori: Verbal (sinonim/antonim/analogi), Numerik (hitungan/barisan/deret), Figural (pola gambar/logika), Logis (silogisme/analisis).",
    "",
    "Format setiap soal:",
    "- question_text: pertanyaan pilihan ganda (1-2 kalimat)",
    "- options: 5 pilihan (A/B/C/D/E)",
    "- correct_answer: huruf pilihan yang benar (A/B/C/D/E)",
    "- explanation: penjelasan cara menyelesaikan (1-2 kalimat)",
    "- category: sub-kategori (Verbal/Numerik/Figural/Logis)",
    "",
    "ATURAN PENTING:",
    "- Untuk soal numerik, pastikan perhitungan benar.",
    "- Untuk soal verbal, pastikan sinonim/antonim/analogi akurat.",
    "- Untuk soal figural, deskripsikan pola dengan jelas (karena tidak ada gambar).",
    "- Pilihan salah harus plausible.",
    "",
    `Nomor soal mulai dari ${startNumber}.`,
    "",
    'Output JSON: {"questions": [{question_number, question_text, options:[{key,text}], correct_answer, explanation, category}]}',
  ].join("\n");
}

function parseQuestions(content: string): any[] {
  try {
    // Bersihkan markdown code block jika ada
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(cleaned);
    return parsed.questions || parsed.data?.questions || [];
  } catch {
    // Coba extract JSON dari teks
    const match = content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return parsed.questions || [];
      } catch {
        return [];
      }
    }
    return [];
  }
}