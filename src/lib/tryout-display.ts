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
  best: number | null;
  average: number | null;
  passed: number;
  lastDelta: number | null;
};

/** Statistik progres dari attempt yang sudah selesai (urutan bebas). */
export function summarizeProgress(attempts: TryoutAttemptSummary[]): ProgressSummary {
  const done = attempts
    .filter(isFinished)
    .sort((a, b) => (a.finished_at ?? a.created_at).localeCompare(b.finished_at ?? b.created_at));
  if (done.length === 0) {
    return { finished: 0, best: null, average: null, passed: 0, lastDelta: null };
  }
  const scores = done.map((a) => a.score_total);
  const last = scores[scores.length - 1];
  const prev = scores.length > 1 ? scores[scores.length - 2] : null;
  return {
    finished: done.length,
    best: Math.max(...scores),
    average: Math.round(scores.reduce((s, x) => s + x, 0) / scores.length),
    passed: done.filter((a) => a.pass_overall).length,
    lastDelta: prev == null ? null : last - prev,
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
