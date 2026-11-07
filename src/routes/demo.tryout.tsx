/**
 * /demo/tryout?view=… — Halaman DEMO (data dummy) untuk screenshot materi
 * promosi tryout CPNS. Merender komponen tryout asli tanpa Supabase.
 * Hanya aktif di mode development; di production menampilkan 404.
 *
 * view: exam | exam-mobile | confirm | result | breakdown | pembahasan |
 *       practice | leaderboard
 */
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Grid3X3, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ExamConfirmDialog,
  ExamTimer,
  HistoryTrend,
  LeaderboardTable,
  PeerComparison,
  PracticeMode,
  QuestionCard,
  QuestionNavigation,
  QuestionResultCard,
  ReadinessBanner,
  RecommendationList,
  ScoreBreakdown,
  SubtestTabs,
  type LeaderboardEntry,
  AttemptHistoryList,
  AttemptListSkeleton,
  CreditBalance,
  CreditBalanceSkeleton,
  ExamDetailSkeleton,
  ExamSetCard,
  ExamSetGridSkeleton,
  LeaderboardSkeleton,
  PackageGridSkeleton,
  PageHeaderSkeleton,
  ProgressStats,
  ProgressStatsSkeleton,
  ResumeBanner,
  SectionTitle,
  StartExamDialog,
  TryoutPackageCard,
  TryoutPageHeader,
} from "@/components/tryout";
import { TryoutPromo } from "@/components/dashboard/tryout-promo";
import { generateFigural, type FiguralType } from "@/lib/tryout-figural";
import { summarizeProgress, type TryoutAttemptSummary } from "@/lib/tryout-display";
import { buildRecommendations, readiness, subtestGaps } from "@/lib/tryout-analysis";
import type {
  TryoutAttemptStats,
  TryoutExplanationDetail,
  TryoutHistoryPoint,
  TryoutInsights,
  TryoutQuestionFull,
  TryoutSubtest,
} from "@/lib/tryout-types";

export const Route = createFileRoute("/demo/tryout")({
  validateSearch: (s: Record<string, unknown>) => ({
    view: typeof s.view === "string" ? s.view : "exam",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: DemoTryoutPage,
});

// ─── Data dummy ──────────────────────────────────────────────────────────────

const EXAM_SET = {
  passing_grade_twk: 65,
  passing_grade_tiu: 80,
  passing_grade_tkp: 166,
  duration_minutes: 100,
};

const COUNTS: Record<TryoutSubtest, number> = { twk: 30, tiu: 35, tkp: 45 };

const NAV_QUESTIONS = (["twk", "tiu", "tkp"] as const).flatMap((s) =>
  Array.from({ length: COUNTS[s] }, (_, i) => ({ id: `${s}-${i + 1}`, subtest: s })),
);

// Jawaban & ragu untuk layar ujian (soal 1–37 terisi, beberapa ditandai ragu).
const EXAM_ANSWERS: Record<string, string> = Object.fromEntries(
  NAV_QUESTIONS.slice(0, 37)
    .filter((_, i) => i !== 11 && i !== 24)
    .map((q, i) => [q.id, "ABCDE"[(i * 7) % 5]]),
);
const EXAM_FLAGGED = ["twk-9", "twk-22", "tiu-4"];
const CURRENT_INDEX = 37; // TIU no. 8 → soal ke-38

const TIU_QUESTION = {
  id: "tiu-8",
  subtest: "tiu" as const,
  question_number: 38,
  question_text:
    "Sebuah toko memberi diskon 20% untuk semua barang, lalu tambahan diskon 10% dari harga setelah diskon pertama. Jika harga awal sebuah tas Rp250.000, berapa harga yang harus dibayar?",
  question_image_url: null,
  options: [
    { key: "A", text: "Rp175.000" },
    { key: "B", text: "Rp180.000" },
    { key: "C", text: "Rp185.000" },
    { key: "D", text: "Rp190.000" },
    { key: "E", text: "Rp200.000" },
  ],
  category: "Numerik - Soal Cerita",
  difficulty: "medium" as const,
};

const TWK_DETAIL: TryoutExplanationDetail = {
  v: 1,
  answer: "A",
  summary:
    "Jawaban yang tepat adalah A. Pasal 27 ayat (3) UUD NRI 1945 menyatakan setiap warga negara berhak dan wajib ikut serta dalam upaya pembelaan negara.",
  concept:
    "Soal menguji pemahaman hak dan kewajiban warga negara dalam UUD NRI 1945, khususnya ketentuan bela negara yang ditambahkan pada amandemen kedua (2000).",
  steps: [
    "Kenali kata kunci soal: “hak dan wajib” serta “pembelaan negara”.",
    "Ingat bahwa ketentuan bela negara secara umum ada di Bab X tentang Warga Negara dan Penduduk, yaitu Pasal 27.",
    "Bedakan dengan Pasal 30 ayat (1) yang mengatur usaha pertahanan dan keamanan negara secara khusus.",
    "Cocokkan dengan pilihan: hanya Pasal 27 ayat (3) yang memuat frasa “upaya pembelaan negara”.",
  ],
  options: {
    A: "Benar. Pasal 27 ayat (3) memuat hak dan kewajiban warga negara ikut serta dalam upaya pembelaan negara.",
    B: "Salah. Pasal 28A mengatur hak setiap orang untuk hidup serta mempertahankan hidup dan kehidupannya.",
    C: "Salah. Pasal 29 ayat (2) mengatur jaminan kemerdekaan memeluk agama dan beribadat.",
    D: "Salah. Pasal 31 ayat (1) mengatur hak setiap warga negara untuk mendapat pendidikan.",
    E: "Salah. Pasal 33 ayat (3) mengatur bumi, air, dan kekayaan alam yang dikuasai negara.",
  },
  tips: "Hafalkan pasal per bab: Bab X (Pasal 26–28) tentang warga negara. Jebakan umum: tertukar dengan Pasal 30 tentang pertahanan dan keamanan.",
  reference: "UUD NRI 1945 Pasal 27 ayat (3), hasil Perubahan Kedua tahun 2000.",
  generated_at: "2026-11-06T08:00:00.000Z",
};

const TWK_QUESTION: TryoutQuestionFull = {
  id: "twk-14",
  subtest: "twk",
  question_number: 14,
  question_text:
    "Ketentuan bahwa setiap warga negara berhak dan wajib ikut serta dalam upaya pembelaan negara tercantum dalam UUD NRI 1945 …",
  question_image_url: null,
  options: [
    { key: "A", text: "Pasal 27 ayat (3)" },
    { key: "B", text: "Pasal 28A" },
    { key: "C", text: "Pasal 29 ayat (2)" },
    { key: "D", text: "Pasal 31 ayat (1)" },
    { key: "E", text: "Pasal 33 ayat (3)" },
  ],
  category: "Bela Negara",
  difficulty: "medium",
  correct_answer: "A",
  scores: null,
  explanation:
    "Pasal 27 ayat (3) UUD NRI 1945: setiap warga negara berhak dan wajib ikut serta dalam upaya pembelaan negara.",
  explanation_image_url: null,
  explanation_detail: TWK_DETAIL,
};

const TKP_QUESTION: TryoutQuestionFull = {
  id: "tkp-3",
  subtest: "tkp",
  question_number: 68,
  question_text:
    "Antrean layanan di kantor Anda sangat panjang dan beberapa warga mulai mengeluh. Sementara itu, rekan Anda sedang istirahat. Sikap Anda adalah …",
  question_image_url: null,
  options: [
    { key: "A", text: "Meminta warga bersabar karena petugas memang terbatas" },
    {
      key: "B",
      text: "Membuka loket tambahan sendiri dan mengatur ulang antrean agar lebih cepat",
    },
    { key: "C", text: "Melaporkan keluhan warga kepada atasan agar segera ditindaklanjuti" },
    { key: "D", text: "Menghubungi rekan agar mempercepat waktu istirahatnya" },
    { key: "E", text: "Tetap melayani sesuai urutan tanpa menanggapi keluhan" },
  ],
  category: "Pelayanan Publik",
  difficulty: "medium",
  correct_answer: null,
  scores: { A: 2, B: 5, C: 3, D: 4, E: 1 },
  explanation:
    "Sikap paling ideal adalah mengambil inisiatif langsung untuk mempercepat layanan tanpa mengabaikan aturan.",
  explanation_image_url: null,
};

const STATS: TryoutAttemptStats = {
  twk: {
    total: 30,
    answered: 28,
    correct: 20,
    wrong: 8,
    empty: 2,
    flagged: 4,
    flagged_correct: 3,
    by_category: {
      Nasionalisme: { correct: 5, total: 6 },
      Integritas: { correct: 5, total: 6 },
      "Bela Negara": { correct: 4, total: 6 },
      "Pilar Negara": { correct: 3, total: 6 },
      "Bahasa Negara": { correct: 3, total: 6 },
    },
    by_difficulty: {
      easy: { correct: 8, total: 9 },
      medium: { correct: 9, total: 14 },
      hard: { correct: 3, total: 7 },
    },
  },
  tiu: {
    total: 35,
    answered: 33,
    correct: 26,
    wrong: 7,
    empty: 2,
    flagged: 3,
    flagged_correct: 1,
    by_category: {
      "Verbal - Analogi": { correct: 4, total: 4 },
      "Verbal - Silogisme": { correct: 3, total: 4 },
      "Verbal - Analitis": { correct: 3, total: 5 },
      "Numerik - Berhitung": { correct: 5, total: 5 },
      "Numerik - Deret Angka": { correct: 4, total: 5 },
      "Numerik - Perbandingan Kuantitatif": { correct: 3, total: 4 },
      "Numerik - Soal Cerita": { correct: 2, total: 4 },
      Figural: { correct: 2, total: 4 },
    },
    by_difficulty: {
      easy: { correct: 9, total: 10 },
      medium: { correct: 12, total: 16 },
      hard: { correct: 5, total: 9 },
    },
  },
  tkp: {
    total: 45,
    answered: 45,
    empty: 0,
    flagged: 2,
    best_choice: 22,
    by_category: {
      "Pelayanan Publik": { score: 33, max: 40, answered: 8, total: 8 },
      "Jejaring Kerja": { score: 29, max: 35, answered: 7, total: 7 },
      "Sosial Budaya": { score: 30, max: 35, answered: 7, total: 7 },
      "Teknologi Informasi dan Komunikasi": { score: 31, max: 40, answered: 8, total: 8 },
      Profesionalisme: { score: 31, max: 40, answered: 8, total: 8 },
      "Anti Radikalisme": { score: 28, max: 35, answered: 7, total: 7 },
    },
  },
};

const ATTEMPT = {
  id: "demo-attempt",
  score_twk: 100,
  score_tiu: 130,
  score_tkp: 182,
  score_total: 412,
  pass_overall: true,
  duration_seconds: 5520,
};

const INSIGHTS: TryoutInsights = {
  participants: 1284,
  rank: 87,
  percentile: 93,
  pass_rate: 41,
  avg: { total: 331, twk: 78, tiu: 96, tkp: 157 },
  top_score: 486,
};

const HISTORY: TryoutHistoryPoint[] = [318, 344, 361, 389, 412].map((score, i) => ({
  id: i === 4 ? "demo-attempt" : `h${i}`,
  exam_set_id: "set",
  exam_name: `Tryout SKD Set ${i + 1}`,
  finished_at: `2026-10-${String(5 + i * 6).padStart(2, "0")}T10:00:00.000Z`,
  score_total: score,
  score_twk: 0,
  score_tiu: 0,
  score_tkp: 0,
  pass_overall: score >= 340,
}));

const LEADERBOARD: LeaderboardEntry[] = [
  ["Rizky A.", 486, 135, 160, 191, 5210],
  ["Nadia P.", 478, 130, 155, 193, 5480],
  ["Fajar S.", 471, 125, 160, 186, 5023],
  ["Ayu L.", 466, 130, 150, 186, 5590],
  ["Bima W.", 459, 120, 150, 189, 5302],
  ["Citra M.", 455, 125, 145, 185, 5711],
  ["Dimas R.", 450, 115, 150, 185, 5455],
].map(([name, total, twk, tiu, tkp, dur], i) => ({
  ranking: i + 1,
  full_name: name as string,
  avatar_url: null,
  exam_set_id: "set",
  exam_name: "Tryout SKD Set 1",
  score_total: total as number,
  score_twk: twk as number,
  score_tiu: tiu as number,
  score_tkp: tkp as number,
  pass_overall: true,
  duration_seconds: dur as number,
  finished_at: "2026-11-01T10:00:00.000Z",
  is_me: false,
}));

// ─── Halaman ─────────────────────────────────────────────────────────────────

function DemoTryoutPage() {
  const { view } = Route.useSearch();
  return (
    <div id="shot" className="min-h-screen bg-background">
      {view === "exam" && <ExamView />}
      {view === "exam-mobile" && <ExamView mobile />}
      {view === "confirm" && <ConfirmView />}
      {view === "result" && <ResultView />}
      {view === "breakdown" && (
        <div className="container-page py-8">
          <ScoreBreakdown stats={STATS} />
        </div>
      )}
      {view === "pembahasan" && <PembahasanView />}
      {view === "practice" && <PracticeView />}
      {view === "leaderboard" && <LeaderboardView />}
      {view === "dashboard" && <DashboardView />}
      {view === "packages" && <PackagesView />}
      {view === "podium" && (
        <div className="container-page py-8">
          <LeaderboardTable entries={LEADERBOARD} variant="full" />
        </div>
      )}
      {view === "start-dialog" && (
        <StartExamDialog
          open
          onOpenChange={() => {}}
          examName="Tryout SKD Set 1"
          totalQuestions={110}
          durationMinutes={100}
          remainingCredits={0}
          isFree
          onConfirm={() => {}}
        />
      )}
      {view === "skeletons" && <SkeletonsView />}
      {view === "figural" && <FiguralView />}
      {view === "promo" && (
        <div className="mx-auto max-w-sm px-4 py-8">
          <TryoutPromo highlight />
        </div>
      )}
    </div>
  );
}

function perSubtestCounts(answers: Record<string, string>) {
  const out = {
    twk: { total: 0, answered: 0 },
    tiu: { total: 0, answered: 0 },
    tkp: { total: 0, answered: 0 },
  };
  for (const q of NAV_QUESTIONS) {
    out[q.subtest].total += 1;
    if (answers[q.id]) out[q.subtest].answered += 1;
  }
  return out;
}

function ExamView({ mobile = false }: { mobile?: boolean }) {
  const [answers, setAnswers] = useState({ ...EXAM_ANSWERS, [TIU_QUESTION.id]: "B" });
  const counts = useMemo(() => perSubtestCounts(answers), [answers]);
  const answered = Object.keys(answers).length;

  return (
    <>
      <div className="border-b bg-background/95">
        <div className="container-page flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Kembali">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tryout SKD Set 1
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{answered}/110 dijawab</span>
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <Check className="h-3 w-3" /> Tersimpan
                </span>
              </div>
            </div>
          </div>
          <ExamTimer display="47:12" isWarning={false} isCritical={false} />
        </div>
        <div className="h-1 w-full bg-muted">
          <div className="h-full bg-emerald-500" style={{ width: `${(answered / 110) * 100}%` }} />
        </div>
      </div>

      <div className={mobile ? "space-y-4 px-4 py-4 pb-28" : "container-page space-y-4 py-6"}>
        <SubtestTabs activeSubtest="tiu" counts={counts} onChange={() => {}} />
        <div className={mobile ? "" : "grid gap-4 lg:grid-cols-[1fr_340px]"}>
          <div className="min-w-0">
            <QuestionCard
              question={TIU_QUESTION}
              displayNumber={CURRENT_INDEX + 1}
              totalQuestions={110}
              selectedAnswer={answers[TIU_QUESTION.id]}
              isFlagged={false}
              onAnswer={(k) => setAnswers((a) => ({ ...a, [TIU_QUESTION.id]: k }))}
              onClear={() => {}}
              onToggleFlag={() => {}}
            />
            {!mobile && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </Button>
                <Button className="gap-1.5">
                  Selanjutnya <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {!mobile && (
            <aside className="space-y-4">
              <QuestionNavigation
                questions={NAV_QUESTIONS}
                currentIndex={CURRENT_INDEX}
                answers={answers}
                flagged={EXAM_FLAGGED}
                onJump={() => {}}
              />
              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" size="lg">
                <Send className="h-4 w-4" /> Kumpulkan Ujian
              </Button>
            </aside>
          )}
        </div>
      </div>

      {mobile && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background/95">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5">
            <Button variant="outline" className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="secondary" className="gap-1.5 px-3">
              <Grid3X3 className="h-4 w-4" /> 38/110
            </Button>
            <Button className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function ConfirmView() {
  const answers = { ...EXAM_ANSWERS };
  for (const q of NAV_QUESTIONS.slice(37, 106)) answers[q.id] = "C";
  const counts = perSubtestCounts(answers);
  return (
    <>
      <ExamView />
      <ExamConfirmDialog
        open
        perSubtest={counts}
        flaggedCount={3}
        remainingLabel="08:41"
        isSubmitting={false}
        onConfirm={() => {}}
        onCancel={() => {}}
        onJumpFirstEmpty={() => {}}
        onJumpFirstFlagged={() => {}}
      />
    </>
  );
}

function ResultView() {
  const gaps = subtestGaps(ATTEMPT, EXAM_SET);
  const ready = readiness(ATTEMPT, gaps);
  const recs = buildRecommendations({
    attempt: ATTEMPT,
    examSet: EXAM_SET,
    stats: STATS,
    gaps,
  });
  return (
    <div className="container-page space-y-5 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Hasil Tryout SKD</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tryout SKD Set 1 · 92 menit dari 100 menit
        </p>
      </header>
      <ReadinessBanner readiness={ready} total={ATTEMPT.score_total} gaps={gaps} />
      <div className="grid gap-5 lg:grid-cols-2">
        <PeerComparison insights={INSIGHTS} scores={{ total: 412, twk: 100, tiu: 130, tkp: 182 }} />
        <RecommendationList items={recs} />
        <HistoryTrend history={HISTORY} currentId="demo-attempt" />
      </div>
    </div>
  );
}

function PembahasanView() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <QuestionResultCard
        question={TWK_QUESTION}
        displayNumber={14}
        userAnswer="C"
        isFlagged
        showExplanation
        attemptId="demo-attempt"
        canReport
      />
    </div>
  );
}

function PracticeView() {
  const items = [
    { q: TKP_QUESTION, no: 68 },
    { q: TWK_QUESTION, no: 14 },
  ];
  return (
    <div className="min-h-screen">
      <PracticeMode
        open
        onOpenChange={() => {}}
        items={items}
        answers={{ [TKP_QUESTION.id]: "C", [TWK_QUESTION.id]: "C" }}
        flagged={[]}
        attemptId="demo-attempt"
      />
    </div>
  );
}

function LeaderboardView() {
  return (
    <div className="container-page space-y-4 py-8">
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          1.284 peserta · peringkat dari skor terbaik tiap peserta
        </span>
        <span className="font-semibold">
          Posisi kamu: <span className="text-primary">#87</span> · skor 412
        </span>
      </div>
      <LeaderboardTable entries={LEADERBOARD} />
    </div>
  );
}

// ─── Tampilan komponen dashboard/beli (redesign tahap 2) ────────────────────

const SETS = [
  {
    id: "set-1",
    name: "Tryout SKD Set 1",
    description: "Set latihan SKD pertama dengan 110 soal campuran sesuai kisi-kisi BKN.",
    total_questions: 110,
    duration_minutes: 100,
    twk_count: 30,
    tiu_count: 35,
    tkp_count: 45,
  },
  {
    id: "set-2",
    name: "Tryout SKD Set 2",
    is_free_preview: true,
    description: "Set lanjutan dengan fokus soal numerik dan studi kasus pelayanan publik.",
    total_questions: 110,
    duration_minutes: 100,
    twk_count: 30,
    tiu_count: 35,
    tkp_count: 45,
  },
];

const ATTEMPTS: TryoutAttemptSummary[] = [
  [412, 100, 130, 182, true, "2026-11-05"],
  [389, 95, 120, 174, true, "2026-11-01"],
  [344, 70, 95, 179, false, "2026-10-25"],
].map(([t, w, i, k, pass, d], n) => ({
  id: `a${n}`,
  exam_set_id: "set-1",
  status: "completed" as const,
  started_at: `${d}T08:00:00.000Z`,
  finished_at: `${d}T09:32:00.000Z`,
  duration_seconds: 5520,
  score_total: t as number,
  score_twk: w as number,
  score_tiu: i as number,
  score_tkp: k as number,
  pass_overall: pass as boolean,
  pass_twk: (w as number) >= 65,
  pass_tiu: (i as number) >= 80,
  pass_tkp: (k as number) >= 166,
  created_at: `${d}T08:00:00.000Z`,
  exam_name: "Tryout SKD Set 1",
}));

function DashboardView() {
  return (
    <div className="container-page space-y-6 py-8">
      <TryoutPageHeader
        eyebrow="Tryout SKD CPNS"
        title="Halo, Dewi! 👋"
        description="Lanjutkan latihanmu — fokus pada subtes yang belum lulus passing grade."
        actions={
          <>
            <Button variant="outline" className="h-10 rounded-xl">
              Info tryout
            </Button>
            <Button className="h-10 rounded-xl">Beli kredit</Button>
          </>
        }
      />
      <ResumeBanner examId="set-2" examName="Tryout SKD Set 2" remainingSeconds={2832} />
      <ProgressStats summary={summarizeProgress(ATTEMPTS)} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section>
            <SectionTitle title="Pilih set tryout" />
            <div className="grid gap-4 sm:grid-cols-2">
              <ExamSetCard set={SETS[0]} attempts={ATTEMPTS} hasCredits onOpen={() => {}} />
              <ExamSetCard set={SETS[1]} attempts={[]} hasCredits={false} onOpen={() => {}} />
            </div>
          </section>
          <section>
            <SectionTitle title="Riwayat tryout" />
            <AttemptHistoryList attempts={ATTEMPTS} />
          </section>
        </div>
        <aside className="space-y-6">
          <CreditBalance totalCredits={5} usedCredits={4} remainingCredits={1} />
          <section>
            <SectionTitle
              title="Leaderboard"
              action={{ to: "/tryout/leaderboard", label: "Lihat semua" }}
            />
            <LeaderboardTable entries={LEADERBOARD} limit={5} variant="compact" />
          </section>
        </aside>
      </div>
    </div>
  );
}

function PackagesView() {
  return (
    <div className="container-page py-8">
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <TryoutPackageCard
          slug="satuan"
          name="Tryout Satuan"
          description="1x akses tryout SKD lengkap 110 soal dengan timer 100 menit dan hasil skor langsung."
          price={15000}
          credits={1}
          features={[
            "110 soal TWK + TIU + TKP",
            "Timer 100 menit realistis",
            "Hasil skor langsung keluar",
            "Passing grade sesuai BKN",
          ]}
          onBuy={() => {}}
        />
        <TryoutPackageCard
          slug="lengkap"
          name="Paket Lengkap"
          description="5x akses tryout + pembahasan lengkap + analisis kelemahan + akses leaderboard nasional."
          price={50000}
          credits={5}
          featured
          savingsPercent={33}
          features={[
            "5x akses tryout SKD",
            "Pembahasan lengkap setiap soal",
            "Analisis kelemahan per kategori",
            "Akses leaderboard nasional",
            "Statistik per attempt",
          ]}
          onBuy={() => {}}
        />
      </div>
    </div>
  );
}

function SkeletonsView() {
  return (
    <div className="container-page space-y-8 py-8">
      <PageHeaderSkeleton />
      <ProgressStatsSkeleton />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <ExamSetGridSkeleton />
          <AttemptListSkeleton />
        </div>
        <div className="space-y-6">
          <CreditBalanceSkeleton />
          <LeaderboardSkeleton compact />
        </div>
      </div>
      <PackageGridSkeleton />
      <LeaderboardSkeleton podium rows={3} />
      <ExamDetailSkeleton />
    </div>
  );
}

// ─── Soal TIU figural (gambar dari generator) ───────────────────────────────
// URL gambar meniru URL publik bucket tryout-images; saat cek visual, browser
// otomatis mengisi URL ini dengan SVG hasil generator (seed sama).
function demoFigural(type: FiguralType, seed: number): TryoutQuestionFull {
  const q = generateFigural(type, "medium", seed);
  const base = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/tryout-images/demo/${type}-${seed}`;
  return {
    id: `fig-${type}`,
    subtest: "tiu",
    question_number: 50,
    question_text: q.question_text,
    question_image_url: q.question_svg ? `${base}/soal.svg` : null,
    options: q.options.map((o) => ({ key: o.key, text: o.alt, image_url: `${base}/${o.key}.svg` })),
    category: "Figural",
    difficulty: "medium",
    correct_answer: q.correct_answer,
    scores: null,
    explanation: q.explanation,
    explanation_image_url: null,
    explanation_detail: q.explanation_detail,
  };
}

function FiguralView() {
  const serialQ = demoFigural("serial", 101);
  const analogQ = demoFigural("analogi", 202);
  const oddQ = demoFigural("ketidaksamaan", 303);
  const [ans, setAns] = useState<string | undefined>(undefined);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <QuestionCard
        question={serialQ}
        displayNumber={50}
        totalQuestions={110}
        selectedAnswer={ans ?? serialQ.correct_answer!}
        onAnswer={setAns}
        onToggleFlag={() => {}}
      />
      <QuestionResultCard
        question={analogQ}
        displayNumber={51}
        userAnswer={analogQ.correct_answer === "A" ? "B" : "A"}
        showExplanation
        attemptId="demo"
      />
      <QuestionCard question={oddQ} displayNumber={52} totalQuestions={110} onAnswer={() => {}} />
    </div>
  );
}
