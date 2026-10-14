/**
 * Normalisasi pertanyaan & evaluasi interview dari AI — logika murni (tanpa Deno/jaringan).
 *
 * `generate` memakai jsonMode (balasan wajib objek JSON). Prompt meminta {"questions":[...]},
 * tetapi AI kadang tetap membalas {"pertanyaan":[...]}, array of string, dsb., jadi semua bentuk
 * itu tetap dibaca di sini.
 */

export interface InterviewQuestion {
  id: string;
  question: string;
}

const MAX_QUESTIONS = 20;
const MAX_QUESTION_CHARS = 1_000;
const TEXT_KEYS = ["question", "pertanyaan", "text", "q", "content"] as const;

function findArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  for (const key of ["questions", "pertanyaan", "data", "items", "result"]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  // Kunci tak dikenal: ambil array pertama di objek
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) return value;
  }
  return null;
}

function textOf(item: unknown): string {
  if (typeof item === "string") return item.trim();
  if (typeof item !== "object" || item === null) return "";
  const obj = item as Record<string, unknown>;
  for (const key of TEXT_KEYS) {
    if (typeof obj[key] === "string" && (obj[key] as string).trim()) {
      return (obj[key] as string).trim();
    }
  }
  return "";
}

/** Daftar pertanyaan valid (id unik, teks tidak kosong). Kosong bila AI tidak memberi apa pun. */
export function normalizeQuestions(parsed: unknown): InterviewQuestion[] {
  const list = findArray(parsed);
  if (!list) return [];

  const used = new Set<string>();
  const result: InterviewQuestion[] = [];
  for (const item of list) {
    const question = textOf(item).slice(0, MAX_QUESTION_CHARS);
    if (!question) continue;

    let id = `q${result.length + 1}`;
    if (typeof item === "object" && item !== null) {
      const raw = (item as Record<string, unknown>).id;
      if ((typeof raw === "string" || typeof raw === "number") && String(raw).trim()) {
        id = String(raw).trim().slice(0, 50);
      }
    }
    // id ganda akan membuat dua pertanyaan berbagi satu jawaban
    while (used.has(id)) id = `${id}_${result.length + 1}`;
    used.add(id);

    result.push({ id, question });
    if (result.length >= MAX_QUESTIONS) break;
  }
  return result;
}

// ─── Normalisasi hasil evaluasi jawaban ───────────────────────────

export interface AnswerEvaluation {
  id: string;
  score: number;
  strength: string;
  weakness: string;
  suggestion: string;
}

export interface InterviewEvaluation {
  evaluations: AnswerEvaluation[];
  overall_score: number;
  feedback: string;
}

const clampScore = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
};
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Rapikan evaluasi dari AI: satu entri per pertanyaan (urutan & id mengikuti `questionIds`),
 * skor dibatasi 0-100, dan `overall_score` dihitung ulang sebagai rata-rata skor per pertanyaan
 * (pertanyaan tanpa evaluasi = 0) agar konsisten dengan rubrik, bukan angka bebas dari AI.
 * null bila AI tidak mengembalikan evaluasi apa pun.
 */
export function normalizeEvaluation(
  parsed: unknown,
  questionIds: string[],
): InterviewEvaluation | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  const raw = Array.isArray(obj.evaluations) ? obj.evaluations : [];

  const byId = new Map<string, Record<string, unknown>>();
  raw.forEach((item, index) => {
    if (typeof item !== "object" || item === null) return;
    const entry = item as Record<string, unknown>;
    const id = String(entry.id ?? questionIds[index] ?? "").trim();
    if (id && !byId.has(id)) byId.set(id, entry);
  });
  if (byId.size === 0) return null;

  const evaluations = questionIds.map((id): AnswerEvaluation => {
    const entry = byId.get(id);
    return {
      id,
      score: clampScore(entry?.score) ?? 0,
      strength: text(entry?.strength, 1_000),
      weakness: text(entry?.weakness, 1_000),
      suggestion: text(entry?.suggestion, 2_000),
    };
  });
  const total = evaluations.reduce((sum, e) => sum + e.score, 0);
  return {
    evaluations,
    overall_score: evaluations.length ? Math.round(total / evaluations.length) : 0,
    feedback: text(obj.feedback, 5_000),
  };
}
