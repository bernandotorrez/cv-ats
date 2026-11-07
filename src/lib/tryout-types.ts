/**
 * Tryout SKD Types
 * TypeScript types untuk fitur Tryout Seleksi Kompetensi Dasar (CPNS)
 */

export type TryoutSubtest = "twk" | "tiu" | "tkp";

export type TryoutAttemptStatus = "in_progress" | "completed" | "timed_out" | "abandoned";

export type TryoutDifficulty = "easy" | "medium" | "hard";

export type TryoutQuestionOption = {
  key: string; // A/B/C/D/E
  /** Teks opsi; untuk opsi bergambar dipakai sebagai teks alternatif (alt). */
  text: string;
  /** Gambar opsi (TIU figural) dari bucket tryout-images. */
  image_url?: string | null;
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
  explanation_detail?: TryoutExplanationDetail | null;
};

/**
 * Pembahasan detail terstruktur (dibuat AI lewat edge function tryout-explain,
 * di-cache di tryout_questions.explanation_detail).
 */
export type TryoutExplanationDetail = {
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

export type TryoutReportReason =
  | "kunci_salah"
  | "soal_ambigu"
  | "opsi_bermasalah"
  | "typo"
  | "pembahasan_salah"
  | "lainnya";

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
  /** Attempt dari set preview gratis (tanpa kredit). */
  is_free?: boolean;
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
 * Statistik per attempt (breakdown per subtes, kategori & tingkat kesulitan).
 * Field bertanda opsional baru ada di attempt setelah upgrade 2026-11; attempt
 * lama hanya punya answered/correct/wrong/empty/by_category.
 */
export type TryoutBinaryBucket = {
  correct: number;
  total: number;
  wrong?: number;
  empty?: number;
};

export type TryoutTkpBucket = {
  score: number;
  total: number;
  max?: number;
  answered?: number;
};

export type TryoutBinaryStats = {
  total?: number;
  answered: number;
  correct: number;
  wrong: number;
  empty: number;
  flagged?: number;
  flagged_correct?: number;
  by_category?: Record<string, TryoutBinaryBucket>;
  by_difficulty?: Record<string, TryoutBinaryBucket>;
};

export type TryoutTkpStats = {
  total?: number;
  answered: number;
  empty?: number;
  flagged?: number;
  /** Jumlah jawaban dengan skor 5 (pilihan paling ideal). */
  best_choice?: number;
  by_category?: Record<string, TryoutTkpBucket>;
  by_difficulty?: Record<string, TryoutTkpBucket>;
};

export type TryoutAttemptStats = {
  twk?: TryoutBinaryStats;
  tiu?: TryoutBinaryStats;
  tkp?: TryoutTkpStats;
};

/** Posisi attempt di antara peserta set yang sama (RPC agregat). */
export type TryoutInsights = {
  participants: number;
  rank: number;
  percentile: number;
  pass_rate: number | null;
  avg: { total: number; twk: number; tiu: number; tkp: number } | null;
  top_score: number;
};

export type TryoutHistoryPoint = {
  id: string;
  exam_set_id: string;
  exam_name: string | null;
  finished_at: string | null;
  score_total: number;
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  pass_overall: boolean;
};

/** Respons edge function tryout-result. */
export type TryoutResultResponse = {
  attempt: TryoutAttempt;
  exam_set: TryoutExamSet;
  questions: Array<TryoutQuestionPublic & Partial<TryoutQuestionFull>>;
  has_pembahasan: boolean;
  insights: TryoutInsights | null;
  history: TryoutHistoryPoint[];
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
  resumed: boolean;
  /** Attempt gratis (set preview gratis) — tidak memakai kredit. */
  is_free?: boolean;
  answers: Record<string, string>;
  flagged: string[];
  /** Jam server saat respons dibuat — untuk koreksi selisih jam perangkat. */
  server_now?: string;
};

/**
 * Submit exam response (ringkasan; soal & pembahasan lewat tryout-result).
 */
export type TryoutSubmitResponse = {
  attempt: Pick<
    TryoutAttempt,
    | "id"
    | "exam_set_id"
    | "status"
    | "score_twk"
    | "score_tiu"
    | "score_tkp"
    | "score_total"
    | "pass_overall"
  >;
  answers_source: "submit" | "autosave";
};

/**
 * Leaderboard entry (RPC `get_tryout_leaderboard`; tidak memuat UUID user).
 */
export type TryoutLeaderboardEntry = {
  ranking: number;
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
  is_me: boolean;
};

/**
 * Respons RPC `get_tryout_leaderboard`.
 */
export type TryoutLeaderboardResponse = {
  entitled: boolean;
  entries: TryoutLeaderboardEntry[];
  my_entry?: TryoutLeaderboardEntry | null;
  total_participants?: number;
};

/**
 * Minimal client shape untuk memanggil RPC tryout yang belum ada di
 * `integrations/supabase/types.ts` (save_tryout_answers, get_tryout_leaderboard).
 * Pakai: `(supabase as unknown as TryoutRpcClient).rpc(...)`.
 */
export type TryoutRpcClient = {
  rpc: (
    fn: "save_tryout_answers" | "get_tryout_leaderboard" | "report_tryout_question",
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
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
