/**
 * Tryout Scoring Utilities
 * Logika perhitungan skor Tryout SKD (TWK/TIU/TKP).
 * Server-side: edge function.
 * Client-side: bisa dipakai untuk preview saat mode pembahasan.
 */

import {
  SCORING,
  type TryoutAttemptStats,
  type TryoutQuestionFull,
  type TryoutSubtest,
} from "./tryout-types";

export type TryoutScore = {
  twk: number;
  tiu: number;
  tkp: number;
  total: number;
  pass_twk: boolean;
  pass_tiu: boolean;
  pass_tkp: boolean;
  pass_overall: boolean;
};

/**
 * Skor TWK & TIU: setiap jawaban benar = 5 poin, salah/kosong = 0.
 * Tidak ada pengurangan nilai (zero negative marking).
 */
export function scoreBinary(
  questions: TryoutQuestionFull[],
  answers: Record<string, string>,
  subtest: TryoutSubtest,
  perCorrect: number,
): number {
  let score = 0;
  for (const q of questions) {
    if (q.subtest !== subtest) continue;
    const userAnswer = answers[q.id];
    if (userAnswer && q.correct_answer && userAnswer === q.correct_answer) {
      score += perCorrect;
    }
  }
  return score;
}

/**
 * Skor TKP: ambil skor dari field `scores` sesuai pilihan user.
 * Jika tidak ada jawaban atau scores null, = 0.
 * Untuk jawaban ada tapi tidak ada di scores (edge case), default = 1.
 */
export function scoreTkp(
  questions: TryoutQuestionFull[],
  answers: Record<string, string>,
): number {
  let score = 0;
  for (const q of questions) {
    if (q.subtest !== "tkp") continue;
    const userAnswer = answers[q.id];
    if (!userAnswer) continue;
    if (!q.scores) continue;
    const value = q.scores[userAnswer];
    if (typeof value === "number" && Number.isFinite(value)) {
      score += value;
    } else {
      // Default 1 jika user jawab tapi tidak ada di scores (safety)
      score += 1;
    }
  }
  return score;
}

/**
 * Hitung skor lengkap + status lulus per subtes.
 */
export function computeTryoutScore(
  questions: TryoutQuestionFull[],
  answers: Record<string, string>,
  passing: {
    twk: number;
    tiu: number;
    tkp: number;
  },
): TryoutScore {
  const twk = scoreBinary(questions, answers, "twk", SCORING.TWK_PER_CORRECT);
  const tiu = scoreBinary(questions, answers, "tiu", SCORING.TIU_PER_CORRECT);
  const tkp = scoreTkp(questions, answers);
  const total = twk + tiu + tkp;

  const pass_twk = twk >= passing.twk;
  const pass_tiu = tiu >= passing.tiu;
  const pass_tkp = tkp >= passing.tkp;
  const pass_overall = pass_twk && pass_tiu && pass_tkp;

  return { twk, tiu, tkp, total, pass_twk, pass_tiu, pass_tkp, pass_overall };
}

/**
 * Statistik detail per subtes.
 */
export function computeTryoutStats(
  questions: TryoutQuestionFull[],
  answers: Record<string, string>,
): TryoutAttemptStats {
  const stats: TryoutAttemptStats = {};

  for (const subtest of ["twk", "tiu", "tkp"] as TryoutSubtest[]) {
    const subset = questions.filter((q) => q.subtest === subtest);
    const answered = subset.filter((q) => answers[q.id]).length;
    const empty = subset.length - answered;

    if (subtest === "tkp") {
      // TKP: hitung score per kategori
      const byCategory: Record<string, { score: number; total: number }> = {};
      for (const q of subset) {
        const cat = q.category || "Lainnya";
        if (!byCategory[cat]) byCategory[cat] = { score: 0, total: 0 };
        byCategory[cat].total += 1;
        const userAnswer = answers[q.id];
        if (userAnswer && q.scores && typeof q.scores[userAnswer] === "number") {
          byCategory[cat].score += q.scores[userAnswer];
        }
      }
      stats.tkp = { answered, by_category: byCategory };
    } else {
      // TWK/TIU: hitung correct/wrong per kategori
      const correct = subset.filter(
        (q) => q.correct_answer && answers[q.id] === q.correct_answer,
      ).length;
      const wrong = answered - correct;
      const byCategory: Record<string, { correct: number; total: number }> = {};
      for (const q of subset) {
        const cat = q.category || "Lainnya";
        if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 };
        byCategory[cat].total += 1;
        if (q.correct_answer && answers[q.id] === q.correct_answer) {
          byCategory[cat].correct += 1;
        }
      }
      if (subtest === "twk") {
        stats.twk = { answered, correct, wrong, empty, by_category: byCategory };
      } else {
        stats.tiu = { answered, correct, wrong, empty, by_category: byCategory };
      }
    }
  }

  return stats;
}

/**
 * Format durasi detik → "X menit Y detik".
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} detik`;
  if (s === 0) return `${m} menit`;
  return `${m} menit ${s} detik`;
}

/**
 * Format detik ke HH:MM:SS / MM:SS untuk timer ujian.
 */
export function formatTimer(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Hitung sisa detik dari started_at + duration_minutes.
 */
export function calculateRemainingSeconds(
  startedAt: string,
  durationMinutes: number,
  now: Date = new Date(),
): number {
  const startMs = new Date(startedAt).getTime();
  const expiresMs = startMs + durationMinutes * 60_000;
  return Math.max(0, Math.floor((expiresMs - now.getTime()) / 1000));
}

/**
 * Persentase progress (0-100).
 */
export function progressPercent(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}