/**
 * tryout-generate-questions — Generate soal tryout SKD menggunakan AI.
 *
 * Admin only. Menggunakan AI gateway yang sama dengan fitur lain (sumopod + deepseek).
 *
 * Body:
 * - exam_set_id: UUID (wajib)
 * - subtest: 'twk' | 'tiu' | 'tkp' (wajib)
 * - count: number (1-45, default 10)
 * - category: string (opsional, misal "Pancasila", "Numerik", "Pelayanan Publik")
 * - difficulty: 'easy' | 'medium' | 'hard' (default 'medium')
 *
 * Catatan:
 * - Penomoran soal GLOBAL per set (bukan per subtes) agar TIU/TKP tidak bentrok,
 *   mengikuti konvensi set: TWK 1..30, TIU 31..65, TKP 66..110.
 * - Prompt AI diberi daftar soal yang sudah ada (set ini + set lain) supaya
 *   setiap set punya soal yang berbeda.
 * - Setelah insert, total_questions pada exam set disinkronkan ke jumlah aktual.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { AI_MODEL, getAdminClient, getUserId } from "../_shared/ai-common.ts";

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";

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

    // Cek nomor soal terakhir yang sudah ada (GLOBAL per set, supaya antar subtes tidak bentrok)
    const { data: lastQ } = await admin
      .from("tryout_questions")
      .select("question_number")
      .eq("exam_set_id", examSetId)
      .order("question_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startNumber = lastQ ? lastQ.question_number + 1 : 1;

    // Kumpulkan soal yang sudah ada (set ini + set lain) agar AI tidak mengulang pertanyaan
    const [sameSetRes, otherSetsRes] = await Promise.all([
      admin
        .from("tryout_questions")
        .select("question_text")
        .eq("exam_set_id", examSetId)
        .limit(60),
      admin
        .from("tryout_questions")
        .select("question_text")
        .neq("exam_set_id", examSetId)
        .limit(120),
    ]);

    const dontRepeat = [
      ...(sameSetRes.data || []),
      ...(otherSetsRes.data || []),
    ]
      .map((q: any) => String(q.question_text || "").replace(/<[^>]+>/g, " ").trim())
      .filter(Boolean)
      .slice(0, 150);

    // Generate soal via AI
    const aiKey = Deno.env.get("AI_API_KEY");
    if (!aiKey) {
      return json(req, { error: "AI_API_KEY tidak dikonfigurasi." }, 500);
    }

    const prompt = buildPrompt(subtest, count, category, difficulty, dontRepeat);

    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
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
    const rawQuestions = parseQuestions(content);
    const valid = rawQuestions
      .map((q) => cleanQuestion(q, subtest))
      .filter((q): q is CleanQuestion => q !== null);
    const skipped = rawQuestions.length - valid.length;
    const parsed = valid.slice(0, count);
    if (skipped > 0) console.warn(`tryout-generate-questions: ${skipped} soal AI tidak valid dibuang`);

    if (parsed.length === 0) {
      return json(req, { error: "AI tidak menghasilkan soal yang valid.", raw: content }, 500);
    }

    // Insert ke database
    const rows = parsed.map((q, idx) => ({
      exam_set_id: examSetId,
      subtest,
      question_number: startNumber + idx,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      scores: q.scores,
      explanation: q.explanation,
      category: category || q.category,
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

    // Sinkronkan total_questions pada exam set dengan jumlah aktual
    const { count: actualCount } = await admin
      .from("tryout_questions")
      .select("id", { count: "exact", head: true })
      .eq("exam_set_id", examSetId);
    if (typeof actualCount === "number") {
      await admin
        .from("tryout_exam_sets")
        .update({ total_questions: actualCount })
        .eq("id", examSetId);
    }

    return json(req, {
      success: true,
      generated: inserted?.length || 0,
      skipped,
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

const SYSTEM_PROMPT = `Kamu adalah penyusun soal SKD CPNS (TWK, TIU, TKP) yang sangat berpengalaman dan teliti, mengikuti kisi-kisi resmi BKN.

PRINSIP:
1. AKURAT: setiap fakta (Pancasila, UUD NRI 1945 hasil amandemen, sejarah, ketatanegaraan) harus benar dan tidak bisa diperdebatkan. Jangan memakai fakta yang mudah berubah (nama pejabat aktif, data statistik terbaru). Jika ragu akan sebuah fakta, buat soal lain.
2. SATU KUNCI: untuk TWK/TIU tepat satu pilihan benar; pengecoh masuk akal tapi jelas salah bagi yang paham materi.
3. KONSISTEN: "explanation" harus mendukung kunci jawaban; hitung ulang soal numerik sebelum menulis kunci.
4. Bahasa Indonesia baku sesuai EYD. Teks polos: tanpa HTML, markdown, atau gambar (soal figural/pola dideskripsikan dengan teks/simbol).
5. Output hanya objek JSON valid, tanpa markdown dan tanpa teks lain.`;

function buildPrompt(
  subtest: string,
  count: number,
  category: string,
  difficulty: string,
  dontRepeat: string[] = [],
): string {
  const difficultyDesc =
    difficulty === "easy"
      ? "mudah (fresh graduate harus bisa)"
      : difficulty === "hard"
        ? "sulit (butuh pemahaman mendalam)"
        : "sedang (standar ujian SKD asli)";

  // Instruksi anti-duplikat: hindari soal yang sudah ada di set lain / set ini
  const avoidLines =
    dontRepeat.length > 0
      ? [
          "",
          "SOAL YANG SUDAH ADA (jangan dibuat ulang atau sekadar diparafrasekan):",
          ...dontRepeat.map((t) => `- ${t.slice(0, 120)}`),
        ].join("\n")
      : "";

  const common = [
    `Tingkat kesulitan: ${difficultyDesc}.`,
    "Setiap soal punya tepat 5 pilihan dengan key A, B, C, D, E (urut), masing-masing teks singkat tanpa awalan huruf.",
    "Jangan buat soal yang sama atau sangat mirip dengan soal lain di batch ini maupun daftar soal yang sudah ada.",
  ];

  if (subtest === "tkp") {
    return [
      `Buatkan ${count} soal TKP (Tes Karakteristik Pribadi) untuk simulasi SKD CPNS.`,
      category
        ? `Fokus kategori: ${category}.`
        : "Campurkan kategori: Pelayanan Publik, Jejaring Kerja, Sosial Budaya, Teknologi Informasi dan Komunikasi, Profesionalisme, Anti Radikalisme.",
      ...common,
      "",
      "ATURAN TKP:",
      "- question_text: situasi kerja nyata ASN/instansi pemerintah (1-3 kalimat), diakhiri pertanyaan sikap (mis. \"Sikap Anda adalah...\").",
      "- scores: setiap pilihan mendapat skor berbeda 1-5 (permutasi 1,2,3,4,5; tidak boleh ada skor ganda). 5 = sikap paling ideal ASN (proaktif, solutif, berintegritas, melayani), 1 = paling buruk (menghindar, melanggar aturan, merugikan publik).",
      "- Acak posisi pilihan skor 5 antar soal (jangan selalu A atau E). Semua pilihan harus terdengar masuk akal; perbedaan skor ditentukan oleh tingkat inisiatif, tanggung jawab, dan kepentingan publik.",
      "- explanation: 1-2 kalimat mengapa pilihan skor 5 paling tepat dan pilihan skor 1 paling tidak tepat.",
      "- category: sub-kategori soal.",
      avoidLines,
      "",
      "FORMAT OUTPUT:",
      '{"questions":[{"question_text":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."},{"key":"E","text":"..."}],"scores":{"A":3,"B":5,"C":1,"D":4,"E":2},"explanation":"...","category":"..."}]}',
    ].join("\n");
  }

  const isTwk = subtest === "twk";
  return [
    isTwk
      ? `Buatkan ${count} soal TWK (Tes Wawasan Kebangsaan) untuk simulasi SKD CPNS.`
      : `Buatkan ${count} soal TIU (Tes Intelegensi Umum) untuk simulasi SKD CPNS.`,
    category
      ? `Fokus kategori: ${category}.`
      : isTwk
        ? "Campurkan kategori: Nasionalisme, Integritas, Bela Negara, Pilar Negara (Pancasila, UUD NRI 1945, NKRI, Bhinneka Tunggal Ika), Bahasa Indonesia."
        : "Campurkan kategori: Verbal (sinonim/antonim/analogi), Numerik (hitungan/barisan/deret/soal cerita), Figural (pola/serial berbasis teks atau simbol), Logis (silogisme/analisis).",
    ...common,
    "",
    `ATURAN ${isTwk ? "TWK" : "TIU"}:`,
    "- question_text: pertanyaan pilihan ganda (1-3 kalimat).",
    "- correct_answer: satu huruf A-E. Sebarkan kunci jawaban secara merata antar soal (jangan didominasi satu huruf).",
    isTwk
      ? "- Rujuk pasal/sila/peristiwa secara tepat; hindari soal opini atau yang jawabannya bergantung tafsir."
      : "- Numerik: hitung langkah demi langkah dan pastikan hasilnya tepat sama dengan salah satu pilihan. Verbal: pastikan sinonim/antonim/analogi sesuai KBBI. Figural/logis: pola harus punya satu jawaban yang bisa diturunkan dari teks soal.",
    isTwk
      ? "- explanation: 1-2 kalimat mengapa jawaban benar (sebut dasar: pasal, sila, atau peristiwa)."
      : "- explanation: 1-3 kalimat cara menyelesaikan (langkah hitungan/alasan).",
    `- category: sub-kategori soal${isTwk ? "" : " (Verbal/Numerik/Figural/Logis)"}.`,
    avoidLines,
    "",
    "FORMAT OUTPUT:",
    '{"questions":[{"question_text":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."},{"key":"E","text":"..."}],"correct_answer":"C","explanation":"...","category":"..."}]}',
  ].join("\n");
}

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;

type CleanQuestion = {
  question_text: string;
  options: { key: string; text: string }[];
  correct_answer: string | null;
  scores: Record<string, number> | null;
  explanation: string | null;
  category: string | null;
};

/**
 * Validasi soal dari AI sebelum disimpan: 5 opsi A-E berisi teks, kunci A-E untuk TWK/TIU,
 * dan skor TKP berupa permutasi 1..5. Soal yang tidak memenuhi dibuang (tidak disimpan rusak).
 */
function cleanQuestion(raw: unknown, subtest: string): CleanQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const questionText = typeof q.question_text === "string" ? q.question_text.trim() : "";
  if (!questionText || !Array.isArray(q.options) || q.options.length !== 5) return null;

  const options = q.options.map((opt, i) => {
    const text =
      typeof opt === "string"
        ? opt
        : opt && typeof opt === "object"
          ? String((opt as Record<string, unknown>).text ?? "")
          : "";
    // Buang awalan "A. " / "A) " bila AI tetap menuliskannya
    return { key: OPTION_KEYS[i], text: text.replace(/^[A-E][.)]\s+/, "").trim() };
  });
  if (options.some((o) => !o.text)) return null;

  let correctAnswer: string | null = null;
  let scores: Record<string, number> | null = null;
  if (subtest === "tkp") {
    const rawScores = q.scores && typeof q.scores === "object" ? q.scores : null;
    if (!rawScores) return null;
    scores = {};
    for (const key of OPTION_KEYS) {
      scores[key] = Number((rawScores as Record<string, unknown>)[key]);
    }
    const sorted = Object.values(scores).sort((a, b) => a - b);
    if (sorted.join(",") !== "1,2,3,4,5") return null;
  } else {
    correctAnswer = String(q.correct_answer ?? "")
      .trim()
      .toUpperCase();
    if (!(OPTION_KEYS as readonly string[]).includes(correctAnswer)) return null;
  }

  const explanation = typeof q.explanation === "string" ? q.explanation.trim() : "";
  const category = typeof q.category === "string" ? q.category.trim() : "";
  return {
    question_text: questionText,
    options,
    correct_answer: correctAnswer,
    scores,
    explanation: explanation || null,
    category: category || null,
  };
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