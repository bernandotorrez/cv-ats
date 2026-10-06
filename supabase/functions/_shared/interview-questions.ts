/**
 * Normalisasi daftar pertanyaan interview dari AI — logika murni (tanpa Deno/jaringan).
 *
 * `generate` memakai jsonMode (balasan wajib objek JSON) padahal prompt meminta array, jadi AI
 * bisa membalas {"questions":[...]}, {"pertanyaan":[...]}, array of string, dsb. Sebelumnya hanya
 * kunci `questions` yang dibaca; bentuk lain menjadi daftar kosong tanpa pesan error.
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
