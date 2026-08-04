/**
 * Tryout SKD Types
 * TypeScript types untuk fitur Tryout Seleksi Kompetensi Dasar (CPNS)
 */

export type TryoutSubtest = "twk" | "tiu" | "tkp";

export type TryoutAttemptStatus =
  | "in_progress"
  | "completed"
  | "timed_out"
  | "abandoned";

export type TryoutDifficulty = "easy" | "medium" | "hard";

export type TryoutQuestionOption = {
  key: string; // A/B/C/D/E
  text: string;
};

export type TryoutQuestionScores = {
  [key: string]: number; // "A": 5, "B": 4, dst.
};

/**
 * Question public — untuk client saat ujian (tanpa jawaban).
 */
export type TryoutQuestionPublic = {
  id: string;
  subtest: TryoutSubtest;
  question_number: number;
  question_text: string;
  question_image_url: string | null;
  options: TryoutQuestionOption[];
  category: string | null;
  difficulty: TryoutDifficulty;
};

/**
 * Question full — jawaban benar & pembahasan (server only atau setelah submit).
 */
export type TryoutQuestionFull = TryoutQuestionPublic & {
  correct_answer: string | null;
  scores: TryoutQuestionScores | null;
  explanation: string | null;
  explanation_image_url: string | null;
};

/**
 * Paket tryout.
 */
export type TryoutPackage = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  credits: number;
  features: string[];
  has_pembahasan: boolean;
  has_analytics: boolean;
  has_leaderboard: boolean;
  is_active: boolean;
  sort_order: number;
};

/**
 * Set ujian.
 */
export type TryoutExamSet = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  twk_count: number;
  tiu_count: number;
  tkp_count: number;
  passing_grade_twk: number;
  passing_grade_tiu: number;
  passing_grade_tkp: number;
  is_active: boolean;
  is_free_preview: boolean;
  sort_order: number;
};

/**
 * Kredit user.
 */
export type TryoutCredit = {
  id: string;
  package_id: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  payment_method: string | null;
  payment_ref: string | null;
  status: "active" | "expired" | "refunded";
  activated_at: string | null;
  expired_at: string | null;
  created_at: string;
};

/**
 * Attempt ujian.
 */
export type TryoutAttempt = {
  id: string;
  user_id: string;
  exam_set_id: string;
  credit_id: string | null;
  status: TryoutAttemptStatus;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  answers: Record<string, string>;
  flagged_questions: string[];
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  score_total: number;
  pass_twk: boolean;
  pass_tiu: boolean;
  pass_tkp: boolean;
  pass_overall: boolean;
  stats: TryoutAttemptStats;
  created_at: string;
};

/**
 * Statistik per attempt (breakdown per subtes & kategori).
 */
export type TryoutAttemptStats = {
  twk?: {
    answered: number;
    correct: number;
    wrong: number;
    empty: number;
    by_category?: Record<string, { correct: number; total: number }>;
  };
  tiu?: {
    answered: number;
    correct: number;
    wrong: number;
    empty: number;
    by_category?: Record<string, { correct: number; total: number }>;
  };
  tkp?: {
    answered: number;
    by_category?: Record<string, { score: number; total: number }>;
  };
};

/**
 * Start exam response (dari edge function).
 */
export type TryoutStartResponse = {
  attempt_id: string;
  exam_set: TryoutExamSet;
  questions: TryoutQuestionPublic[];
  started_at: string;
  duration_minutes: number;
  expires_at: string; // started_at + duration
  remaining_seconds: number;
};

/**
 * Submit exam response.
 */
export type TryoutSubmitResponse = {
  attempt: TryoutAttempt;
  exam_set: TryoutExamSet;
  questions: TryoutQuestionFull[];
  has_pembahasan: boolean;
};

/**
 * Leaderboard entry.
 */
export type TryoutLeaderboardEntry = {
  ranking: number;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  exam_set_id: string;
  exam_name: string;
  score_total: number;
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  pass_overall: boolean;
  duration_seconds: number | null;
  finished_at: string | null;
};

/**
 * State ujian di client (untuk local state).
 */
export type TryoutExamState = {
  attempt_id: string;
  exam_set: TryoutExamSet;
  questions: TryoutQuestionPublic[];
  answers: Record<string, string>;
  flagged: string[];
  currentIndex: number;
  started_at: string;
  duration_minutes: number;
};

/**
 * Konstanta skor.
 */
export const SCORING = {
  TWK_PER_CORRECT: 5,
  TIU_PER_CORRECT: 5,
  TKP_MIN_PER_QUESTION: 1,
  TKP_MAX_PER_QUESTION: 5,
  PASSING_GRADE_TWK: 65,
  PASSING_GRADE_TIU: 80,
  PASSING_GRADE_TKP: 166,
  MAX_SCORE_TWK: 150,
  MAX_SCORE_TIU: 175,
  MAX_SCORE_TKP: 225,
  MAX_SCORE_TOTAL: 550,
} as const;

export const SUBTEST_INFO: Record<
  TryoutSubtest,
  { label: string; fullName: string; count: number; color: string }
> = {
  twk: {
    label: "TWK",
    fullName: "Tes Wawasan Kebangsaan",
    count: 30,
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  tiu: {
    label: "TIU",
    fullName: "Tes Intelegensi Umum",
    count: 35,
    color: "text-sky-700 bg-sky-50 border-sky-200",
  },
  tkp: {
    label: "TKP",
    fullName: "Tes Karakteristik Pribadi",
    count: 45,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
};

/**
 * Link pembayaran Lynk.id untuk Paket Tryout CPNS
 */
export const TRYOUT_LYNK_URLS: Record<string, string> = {
  satuan: "https://lynk.id/ben-yt-ai/d6m9o62dgwd5",
  lengkap: "https://lynk.id/ben-yt-ai/n6rnv6rlj2er",
};

export function getTryoutLynkUrl(slug: string): string {
  return TRYOUT_LYNK_URLS[slug] || `https://lynk.id/ben-yt-ai/${slug}`;
}