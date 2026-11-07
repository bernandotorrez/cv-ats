/**
 * Pembuat pembahasan detail soal tryout SKD (AI) + validasi output.
 *
 * Bentuk yang disimpan di tryout_questions.explanation_detail:
 * {
 *   v: 1,
 *   answer: "C",                 // kunci (TWK/TIU) / opsi skor tertinggi (TKP)
 *   summary: "...",              // inti jawaban & alasannya
 *   concept: "...",              // materi/konsep yang diuji
 *   steps: ["...", "..."],       // langkah penyelesaian / cara berpikir
 *   options: { A: "...", ... },  // analisis tiap opsi
 *   tips: "..." | null,          // trik cepat saat ujian
 *   reference: "..." | null,     // dasar hukum / sumber (TWK) bila relevan
 *   generated_at: ISO string
 * }
 *
 * AI diberi kunci yang sudah ada. Bila AI yakin kuncinya salah, hasil TIDAK
 * disimpan dan dikembalikan sebagai `disputed` agar admin memeriksa soalnya.
 */
import { AI_MODEL } from "./ai-common.ts";
import { normalizeOptions, type QuestionRow } from "./tryout.ts";

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";

export type ExplanationDetail = {
  v: 1;
  answer: string | null;
  summary: string;
  concept: string;
  steps: string[];
  options: Record<string, string>;
  tips: string | null;
  reference: string | null;
  generated_at: string;
};

export type ExplainOutcome =
  | { ok: true; detail: ExplanationDetail }
  | { ok: false; disputed: true; reason: string }
  | { ok: false; disputed: false; reason: string };

const SYSTEM_PROMPT = `Kamu adalah tutor SKD CPNS senior yang menulis pembahasan soal TWK, TIU, dan TKP untuk peserta tryout.

PRINSIP:
1. Kunci jawaban (TWK/TIU) dan skor tiap opsi (TKP) yang diberikan sudah diverifikasi. Jelaskan MENGAPA kunci itu benar.
2. Jika kamu sangat yakin kunci yang diberikan SALAH atau soal ambigu, isi "key_disagree": true dan alasan singkat di "disagree_reason". Jangan memaksakan pembahasan yang salah.
3. Akurat: rujuk pasal, sila, undang-undang, atau peristiwa secara tepat. Untuk hitungan, tulis langkah demi langkah dengan angka sebenarnya dan pastikan hasilnya sama dengan kunci.
4. Bahasa Indonesia baku, ramah, mudah dipahami lulusan SMA/S1. Teks polos tanpa HTML/markdown.
5. Output hanya objek JSON valid.`;

function buildPrompt(q: QuestionRow): string {
  const opts = normalizeOptions(q.options);
  const optionLines = opts.map((o) => {
    const score = q.subtest === "tkp" && q.scores ? ` (skor ${q.scores[o.key] ?? "?"})` : "";
    return `${o.key}. ${stripHtml(o.text)}${score}`;
  });
  const keyLine =
    q.subtest === "tkp"
      ? "Skor tiap opsi tertera di atas (5 = sikap paling ideal ASN, 1 = paling tidak tepat)."
      : `Kunci jawaban: ${q.correct_answer}`;
  const subtestName =
    q.subtest === "twk"
      ? "TWK (Tes Wawasan Kebangsaan)"
      : q.subtest === "tiu"
        ? "TIU (Tes Intelegensi Umum)"
        : "TKP (Tes Karakteristik Pribadi)";

  const guide =
    q.subtest === "tkp"
      ? [
          '- "steps": 2-4 poin prinsip penilaian sikap yang dipakai (mis. orientasi pelayanan, inisiatif, integritas).',
          '- "options": untuk SETIAP opsi jelaskan mengapa mendapat skor tersebut (1 kalimat), sebut skornya.',
          '- "reference": nilai dasar ASN BerAKHLAK atau kode etik yang relevan, atau null.',
        ]
      : q.subtest === "tiu"
        ? [
            '- "steps": langkah penyelesaian berurutan (2-6 langkah), tulis hitungan/penalaran konkret.',
            '- "options": untuk SETIAP opsi jelaskan singkat mengapa benar/salah (mis. hasil hitungan opsi tersebut tidak sesuai).',
            '- "reference": null kecuali ada rumus/aturan baku yang perlu disebut.',
          ]
        : [
            '- "steps": 2-5 poin penalaran untuk sampai ke jawaban.',
            '- "options": untuk SETIAP opsi jelaskan singkat mengapa benar/salah (fakta pembanding).',
            '- "reference": dasar hukum/sumber spesifik (mis. "UUD NRI 1945 Pasal 27 ayat (3)"), atau null bila tidak ada.',
          ];

  return [
    `Subtes: ${subtestName}`,
    q.category ? `Kategori: ${q.category}` : "",
    "",
    "SOAL:",
    stripHtml(q.question_text),
    "",
    "PILIHAN:",
    ...optionLines,
    "",
    keyLine,
    q.explanation ? `Pembahasan singkat yang sudah ada: ${stripHtml(q.explanation)}` : "",
    "",
    "Tulis pembahasan detail dengan aturan:",
    `- "answer": huruf opsi ${q.subtest === "tkp" ? "dengan skor tertinggi" : "kunci jawaban"}.`,
    '- "summary": 2-3 kalimat inti: jawaban yang tepat dan alasan utamanya.',
    '- "concept": 1-3 kalimat materi/konsep yang diuji soal ini.',
    ...guide,
    '- "tips": 1 kalimat trik cepat/jebakan yang perlu diwaspadai saat ujian, atau null.',
    "- Jangan menyalin ulang teks soal secara utuh.",
    "",
    "FORMAT:",
    '{"key_disagree":false,"disagree_reason":null,"answer":"C","summary":"...","concept":"...","steps":["...","..."],"options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"tips":"...","reference":null}',
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export async function generateExplanation(
  q: QuestionRow,
  opts: { timeoutMs?: number } = {},
): Promise<ExplainOutcome> {
  // AI hanya membaca teks. Soal bergambar (TIU figural / gambar manual) tidak
  // boleh dibahas AI karena isinya tidak terlihat → rawan mengarang. Soal
  // figural dari generator sudah membawa pembahasan detail sendiri.
  if (q.question_image_url || normalizeOptions(q.options).some((o) => o.image_url)) {
    return {
      ok: false,
      disputed: false,
      reason: "Soal bergambar: pembahasan detail ditulis manual oleh admin.",
    };
  }

  const aiKey = Deno.env.get("AI_API_KEY");
  if (!aiKey) return { ok: false, disputed: false, reason: "AI_API_KEY tidak dikonfigurasi" };

  const content = await callAi(aiKey, buildPrompt(q), opts.timeoutMs ?? 60_000);
  const parsed = parseJson(content);
  if (!parsed) return { ok: false, disputed: false, reason: "Output AI tidak valid" };

  if (parsed.key_disagree === true) {
    return {
      ok: false,
      disputed: true,
      reason: clean(parsed.disagree_reason, 300) || "AI meragukan kunci jawaban.",
    };
  }

  const keys = normalizeOptions(q.options).map((o) => o.key);
  const expected =
    q.subtest === "tkp"
      ? (bestTkpKey(q.scores) ?? null)
      : (q.correct_answer || "").trim().toUpperCase() || null;
  const answer = clean(parsed.answer, 2).toUpperCase() || null;
  if (expected && answer && answer !== expected) {
    return {
      ok: false,
      disputed: true,
      reason: `AI menyimpulkan jawaban ${answer}, kunci tersimpan ${expected}.`,
    };
  }

  const summary = clean(parsed.summary, 700);
  const concept = clean(parsed.concept, 700);
  const steps = Array.isArray(parsed.steps)
    ? parsed.steps
        .map((s: unknown) => clean(s, 500))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const rawOptions = (
    parsed.options && typeof parsed.options === "object" ? parsed.options : {}
  ) as Record<string, unknown>;
  const options: Record<string, string> = {};
  for (const k of keys) {
    const text = clean(rawOptions[k], 500);
    if (text) options[k] = text;
  }

  if (summary.length < 20 || steps.length === 0 || Object.keys(options).length < keys.length) {
    return { ok: false, disputed: false, reason: "Pembahasan AI tidak lengkap" };
  }

  return {
    ok: true,
    detail: {
      v: 1,
      answer: expected,
      summary,
      concept,
      steps,
      options,
      tips: clean(parsed.tips, 400) || null,
      reference: clean(parsed.reference, 300) || null,
      generated_at: new Date().toISOString(),
    },
  };
}

function bestTkpKey(scores: Record<string, number> | null | undefined): string | null {
  if (!scores) return null;
  let best: string | null = null;
  let max = -Infinity;
  for (const [k, v] of Object.entries(scores)) {
    if (typeof v === "number" && v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

/** Teks polos: buang tag HTML, karakter kontrol, markdown tebal, rapikan spasi. */
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return (
    stripHtml(value)
      .replace(/\*\*/g, "")
      // deno-lint-ignore no-control-regex
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, max)
  );
}

function stripHtml(s: string): string {
  return s
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// deno-lint-ignore no-explicit-any
function parseJson(content: string): Record<string, any> | null {
  let text = content.trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      const v = JSON.parse(m[0]);
      return v && typeof v === "object" && !Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  }
}

async function callAi(aiKey: string, prompt: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AI HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`AI timeout setelah ${timeoutMs} ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
