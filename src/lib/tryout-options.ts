/**
 * Helper opsi & hasil soal tryout (dipakai halaman ujian & hasil).
 */
import type { TryoutQuestionFull, TryoutQuestionOption } from "./tryout-types";

/**
 * Gambar soal/opsi hanya dari bucket publik `tryout-images` milik project ini.
 * URL lain (http, host asing, data:, javascript:) diabaikan.
 */
export function safeTryoutImageUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    const u = new URL(url);
    const base = new URL(import.meta.env.VITE_SUPABASE_URL || "");
    if (u.protocol !== "https:" && !(u.protocol === "http:" && u.hostname === "127.0.0.1")) {
      return null;
    }
    if (u.host !== base.host) return null;
    if (!u.pathname.startsWith("/storage/v1/object/public/tryout-images/")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Normalisasi opsi lama (string "A. teks") maupun baru ({key, text, image_url}). */
export function normalizeOptions(options: unknown): TryoutQuestionOption[] {
  if (!Array.isArray(options)) return [];
  return options.map((opt, index) => {
    const fallbackKey = String.fromCharCode(65 + index);
    if (typeof opt === "string") {
      const m = opt.match(/^\s*([A-E])[.)]\s*([\s\S]*)$/);
      return m ? { key: m[1], text: m[2].trim() } : { key: fallbackKey, text: opt };
    }
    const o = (opt ?? {}) as Partial<TryoutQuestionOption>;
    const image = safeTryoutImageUrl(o.image_url);
    return {
      key: o.key || fallbackKey,
      text: o.text ?? "",
      ...(image ? { image_url: image } : {}),
    };
  });
}

/** Kelas wadah daftar opsi: grid untuk opsi bergambar, daftar untuk teks. */
export const optionListClass = (imageMode: boolean) =>
  imageMode ? "grid grid-cols-3 gap-2 sm:grid-cols-5" : "space-y-2";

/** True bila semua opsi bergambar (ditampilkan sebagai grid gambar). */
export function hasImageOptions(options: TryoutQuestionOption[]): boolean {
  return options.length > 0 && options.every((o) => !!o.image_url);
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
