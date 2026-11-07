/**
 * Helper tampilan untuk halaman tryout (dashboard, detail, beli, leaderboard).
 */
import { UUID_RE } from "./tryout-uuid";

export { UUID_RE };

/** Ringkasan attempt untuk daftar/statistik (tanpa answers & stats). */
export type TryoutAttemptSummary = {
  id: string;
  exam_set_id: string;
  status: "in_progress" | "completed" | "timed_out" | "abandoned";
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  score_total: number;
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  pass_overall: boolean;
  pass_twk: boolean;
  pass_tiu: boolean;
  pass_tkp: boolean;
  created_at: string;
  is_free?: boolean;
  exam_name?: string | null;
  /** Skor total maksimal set attempt (dari komposisi; default 550). */
  max_total?: number;
};

/** Kolom yang dipilih untuk TryoutAttemptSummary (jangan ambil answers/stats). */
export const ATTEMPT_SUMMARY_COLUMNS =
  "id, exam_set_id, status, is_free, started_at, finished_at, duration_seconds, score_total, score_twk, score_tiu, score_tkp, pass_overall, pass_twk, pass_tiu, pass_tkp, created_at";

export const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export const formatDateId = (iso: string | null | undefined, withTime = false) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "-";

export const isFinished = (a: Pick<TryoutAttemptSummary, "status">) =>
  a.status === "completed" || a.status === "timed_out";

export type ProgressSummary = {
  finished: number;
  /** Skor terbaik (dibandingkan relatif terhadap skor maksimal set masing-masing). */
  best: number | null;
  bestMax: number | null;
  /** Rata-rata persentase skor terhadap skor maksimal set (0–100). */
  averagePct: number | null;
  passed: number;
  /** Selisih persentase attempt terakhir vs sebelumnya (poin persen). */
  lastDeltaPct: number | null;
};

/**
 * Statistik progres dari attempt yang sudah selesai (urutan bebas).
 * Set bisa berbeda ukuran (set mini vs 110 soal), jadi perbandingan memakai
 * persentase skor terhadap skor maksimal set masing-masing.
 */
export function summarizeProgress(attempts: TryoutAttemptSummary[]): ProgressSummary {
  const done = attempts
    .filter(isFinished)
    .sort((a, b) => (a.finished_at ?? a.created_at).localeCompare(b.finished_at ?? b.created_at));
  if (done.length === 0) {
    return {
      finished: 0,
      best: null,
      bestMax: null,
      averagePct: null,
      passed: 0,
      lastDeltaPct: null,
    };
  }
  const pct = (a: TryoutAttemptSummary) => (a.score_total / (a.max_total || 550)) * 100;
  const best = done.reduce((b, a) => (pct(a) > pct(b) ? a : b));
  const last = done[done.length - 1];
  const prev = done.length > 1 ? done[done.length - 2] : null;
  return {
    finished: done.length,
    best: best.score_total,
    bestMax: best.max_total || 550,
    averagePct: Math.round(done.reduce((s, a) => s + pct(a), 0) / done.length),
    passed: done.filter((a) => a.pass_overall).length,
    lastDeltaPct: prev == null ? null : Math.round(pct(last) - pct(prev)),
  };
}

/** Sisa detik ujian berjalan (perkiraan dari jam perangkat). */
export function remainingSecondsOf(startedAt: string, durationMinutes: number): number {
  const end = new Date(startedAt).getTime() + durationMinutes * 60_000;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}

/**
 * Avatar hanya dari host tepercaya. URL avatar berasal dari profil user lain;
 * memuat URL sembarang dari browser peserta bisa membocorkan IP/aktivitas
 * (tracking pixel). Selain host di bawah → fallback ikon.
 */
export function safeAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return undefined;
    const supabaseHost = (() => {
      try {
        return new URL(import.meta.env.VITE_SUPABASE_URL || "").host;
      } catch {
        return "";
      }
    })();
    const ok =
      (supabaseHost && u.host === supabaseHost) ||
      u.host.endsWith(".googleusercontent.com") ||
      u.host === "avatars.githubusercontent.com";
    return ok ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}
