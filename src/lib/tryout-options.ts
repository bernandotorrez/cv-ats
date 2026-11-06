/**
 * Helper opsi & hasil soal tryout (dipakai halaman ujian & hasil).
 */
import type { TryoutQuestionFull, TryoutQuestionOption } from "./tryout-types";

/** Normalisasi opsi lama (string "A. teks") maupun baru ({key, text}). */
export function normalizeOptions(options: unknown): TryoutQuestionOption[] {
  if (!Array.isArray(options)) return [];
  return options.map((opt, index) => {
    const fallbackKey = String.fromCharCode(65 + index);
    if (typeof opt === "string") {
      const m = opt.match(/^\s*([A-E])[.)]\s*([\s\S]*)$/);
      return m ? { key: m[1], text: m[2].trim() } : { key: fallbackKey, text: opt };
    }
    const o = (opt ?? {}) as Partial<TryoutQuestionOption>;
    return { key: o.key || fallbackKey, text: o.text ?? "" };
  });
}

export type QuestionOutcome = "correct" | "wrong" | "empty" | "tkp";

export function questionOutcome(
  q: Pick<TryoutQuestionFull, "subtest" | "correct_answer">,
  userAnswer?: string,
): QuestionOutcome {
  if (!userAnswer) return "empty";
  if (q.subtest === "tkp") return "tkp";
  return userAnswer === q.correct_answer ? "correct" : "wrong";
}
