/**
 * /tryout/$examId — Detail set tryout: komposisi, aturan, riwayat di set ini,
 * dan panel aksi (mulai/lanjutkan). Attempt baru selalu lewat dialog
 * konfirmasi karena langsung memotong 1 kredit dan menjalankan timer.
 */
import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  Clock,
  Coins,
  FileText,
  Flag,
  Keyboard,
  ListChecks,
  Play,
  Save,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  ATTEMPT_SUMMARY_COLUMNS,
  UUID_RE,
  formatDateId,
  isFinished,
  remainingSecondsOf,
  type TryoutAttemptSummary,
} from "@/lib/tryout-display";
import { formatTimer } from "@/lib/tryout-scoring";
import { cn } from "@/lib/utils";
import {
  AttemptHistoryList,
  CompositionBar,
  EmptyState,
  ExamDetailSkeleton,
  StartExamDialog,
  TryoutPageHeader,
} from "@/components/tryout";

export const Route = createFileRoute("/_authenticated/tryout/$examId")({
  head: () =>
    buildSeo({
      title: "Detail Tryout - CV Pintar",
      description: "Detail tryout SKD.",
      path: "/tryout",
      noindex: true,
    }),
  component: TryoutExamDetailPage,
});

type ExamSetRow = {
  id: string;
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
  is_free_preview: boolean;
};

const SUBTESTS = [
  {
    key: "twk",
    label: "TWK",
    name: "Wawasan Kebangsaan",
    cls: "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30",
    bar: "bg-amber-400",
    text: "text-amber-800 dark:text-amber-300",
  },
  {
    key: "tiu",
    label: "TIU",
    name: "Intelegensi Umum",
    cls: "border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30",
    bar: "bg-sky-400",
    text: "text-sky-800 dark:text-sky-300",
  },
  {
    key: "tkp",
    label: "TKP",
    name: "Karakteristik Pribadi",
    cls: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30",
    bar: "bg-emerald-500",
    text: "text-emerald-800 dark:text-emerald-300",
  },
] as const;

const RULES = [
  {
    icon: Clock,
    title: "Timer server",
    desc: "Waktu berjalan sejak ujian dibuka dan tidak berhenti walau halaman ditutup. Dikumpulkan otomatis saat habis.",
  },
  {
    icon: Save,
    title: "Tersimpan otomatis",
    desc: "Setiap jawaban disimpan ke server. Koneksi putus? Buka lagi ujian ini untuk melanjutkan.",
  },
  {
    icon: Target,
    title: "Penilaian resmi BKN",
    desc: "TWK & TIU: benar 5, salah/kosong 0 (tanpa minus). TKP: 1–5 per soal. Isi semua soal.",
  },
  {
    icon: ShieldCheck,
    title: "Lulus ketiga subtes",
    desc: "Dinyatakan lulus hanya jika TWK, TIU, dan TKP masing-masing mencapai passing grade.",
  },
  {
    icon: Flag,
    title: "Tandai ragu-ragu",
    desc: "Tandai soal yang belum yakin dan kembali kapan saja lewat navigasi soal.",
  },
  {
    icon: Keyboard,
    title: "Pintasan keyboard",
    desc: "A–E pilih jawaban, ← → pindah soal, R tandai ragu.",
  },
];

function TryoutExamDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { examId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isExactMatch = pathname === `/tryout/${examId}` || pathname === `/tryout/${examId}/`;
  const validId = UUID_RE.test(examId);

  const [loading, setLoading] = useState(true);
  const [examSet, setExamSet] = useState<ExamSetRow | null>(null);
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [attempts, setAttempts] = useState<TryoutAttemptSummary[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!user?.id || !isExactMatch) return;
    if (!validId) {
      setLoading(false);
      return;
    }
    void load(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, user?.id, isExactMatch]);

  async function load(userId: string) {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const [examRes, creditsRes, attemptsRes] = await Promise.all([
      supabase
        .from("tryout_exam_sets")
        .select(
          "id, name, description, total_questions, duration_minutes, twk_count, tiu_count, tkp_count, passing_grade_twk, passing_grade_tiu, passing_grade_tkp, is_free_preview",
        )
        .eq("id", examId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("tryout_credits")
        .select("remaining_credits")
        .eq("user_id", userId)
        .eq("status", "active")
        .or(`expired_at.is.null,expired_at.gt.${nowIso}`),
      supabase
        .from("tryout_attempts")
        .select(ATTEMPT_SUMMARY_COLUMNS)
        .eq("user_id", userId)
        .eq("exam_set_id", examId)
        .in("status", ["in_progress", "completed", "timed_out"])
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setExamSet((examRes.data as ExamSetRow | null) ?? null);
    setRemainingCredits((creditsRes.data || []).reduce((s, c) => s + c.remaining_credits, 0));
    setAttempts(
      ((attemptsRes.data || []) as TryoutAttemptSummary[]).map((a) => ({
        ...a,
        exam_name: (examRes.data as ExamSetRow | null)?.name ?? null,
        max_total: examRes.data
          ? 5 *
            ((examRes.data as ExamSetRow).twk_count +
              (examRes.data as ExamSetRow).tiu_count +
              (examRes.data as ExamSetRow).tkp_count)
          : 550,
      })),
    );
    setLoading(false);
  }

  if (!isExactMatch) return <Outlet />;

  if (loading) {
    return (
      <div className="container-page py-5 md:py-8">
        <ExamDetailSkeleton />
      </div>
    );
  }

  if (!validId || !examSet) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" aria-hidden />}
          title="Set tryout tidak ditemukan"
          description="Set ini mungkin sudah tidak aktif. Pilih set lain dari dashboard tryout."
          action={
            <Button asChild className="rounded-xl">
              <Link to={"/tryout" as never}>Kembali ke dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const running = attempts.find((a) => a.status === "in_progress");
  const done = attempts.filter(isFinished);
  const best = done.length ? done.reduce((b, a) => (a.score_total > b.score_total ? a : b)) : null;
  const isFree = !!examSet.is_free_preview;
  // Set gratis bisa dimulai tanpa kredit.
  const hasCredits = isFree || remainingCredits > 0;
  const remaining = running ? remainingSecondsOf(running.started_at, examSet.duration_minutes) : 0;
  const passing = {
    twk: examSet.passing_grade_twk,
    tiu: examSet.passing_grade_tiu,
    tkp: examSet.passing_grade_tkp,
  };
  const counts = { twk: examSet.twk_count, tiu: examSet.tiu_count, tkp: examSet.tkp_count };
  const maxTotal = 5 * (counts.twk + counts.tiu + counts.tkp);

  const goExam = () =>
    navigate({ to: "/tryout/$examId/ujian" as never, params: { examId } as never });

  return (
    <div className="container-page space-y-6 py-5 pb-28 md:py-8 lg:pb-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to={"/tryout" as never}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard tryout
        </Link>
      </Button>

      <TryoutPageHeader
        eyebrow="Set tryout"
        icon={<BookOpenCheck className="h-3.5 w-3.5" aria-hidden />}
        title={examSet.name}
        description={
          examSet.description ||
          `Simulasi SKD dengan ${examSet.total_questions} soal dan timer ${examSet.duration_minutes} menit.`
        }
      />

      <ul className="flex flex-wrap gap-2" aria-label="Ringkasan set">
        {[
          ...(isFree ? [{ icon: Coins, text: "Gratis · tanpa kredit" }] : []),
          { icon: FileText, text: `${examSet.total_questions} soal` },
          { icon: Clock, text: `${examSet.duration_minutes} menit` },
          { icon: ListChecks, text: "TWK → TIU → TKP" },
        ].map((c) => (
          <li
            key={c.text}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
          >
            <c.icon className="h-3.5 w-3.5 text-primary" aria-hidden /> {c.text}
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="komposisi" className="space-y-3">
            <h2 id="komposisi" className="font-display text-lg font-bold">
              Komposisi & passing grade
            </h2>
            <CompositionBar twk={counts.twk} tiu={counts.tiu} tkp={counts.tkp} showLegend={false} />
            <div className="grid gap-3 sm:grid-cols-3">
              {SUBTESTS.map((s) => (
                <div key={s.key} className={cn("rounded-2xl border-2 p-4", s.cls)}>
                  <div className={cn("font-display text-2xl font-extrabold", s.text)}>
                    {s.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Jumlah soal</dt>
                      <dd className="font-bold">{counts[s.key]}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Skor maks</dt>
                      <dd className="font-bold">{counts[s.key] * 5}</dd>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <dt className="font-semibold">Passing grade</dt>
                      <dd className={cn("font-extrabold", s.text)}>{passing[s.key]}</dd>
                    </div>
                  </dl>
                  <div className="relative mt-3 h-1.5 rounded-full bg-background/80" aria-hidden>
                    <div
                      className={cn("h-full rounded-full", s.bar)}
                      style={{
                        width: `${Math.min(100, (passing[s.key] / Math.max(1, counts[s.key] * 5)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="aturan" className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 id="aturan" className="font-display text-lg font-bold">
              Aturan & tips ujian
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {RULES.map((r) => (
                <li key={r.title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <r.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="riwayat-set">
            <h2 id="riwayat-set" className="mb-3 font-display text-lg font-bold">
              Riwayat di set ini
            </h2>
            <AttemptHistoryList
              attempts={attempts.slice(0, 5)}
              emptyMessage="Kamu belum pernah mengerjakan set ini."
            />
          </section>
        </div>

        {/* Panel aksi: sidebar di desktop, bar bawah di mobile */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            {best && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Trophy className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground">Skor terbaik di set ini</div>
                  <div>
                    <b className="font-display text-lg font-extrabold">{best.score_total}</b>/
                    {maxTotal} ·{" "}
                    <span
                      className={
                        best.pass_overall
                          ? "font-semibold text-emerald-700 dark:text-emerald-400"
                          : "font-semibold text-amber-700 dark:text-amber-400"
                      }
                    >
                      {best.pass_overall ? "Lulus PG" : "Belum lulus"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {done.length}x dikerjakan · terakhir {formatDateId(done[0]?.finished_at)}
                  </div>
                </div>
              </div>
            )}

            {isFree ? (
              <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950/30">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-800 dark:text-yellow-300">
                  <Coins className="h-4 w-4" aria-hidden /> Tryout gratis
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold text-foreground">
                  Tanpa kredit
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {running
                    ? "Ujian gratis sedang berjalan."
                    : "Kreditmu tidak terpakai. Skor & analisis tersedia; pembahasan detail khusus Paket Lengkap."}
                </p>
              </div>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Coins className="h-4 w-4 text-primary" aria-hidden /> Kredit kamu
                </p>
                <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
                  {remainingCredits}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {running
                    ? "Ujian sedang berjalan — melanjutkan tidak memotong kredit."
                    : hasCredits
                      ? "Memulai tryout memakai 1 kredit."
                      : "Kredit habis. Beli paket untuk memulai."}
                </p>
              </>
            )}

            <div className="mt-4 hidden lg:block">
              <ActionButton
                running={!!running}
                remaining={remaining}
                hasCredits={hasCredits}
                isFree={isFree}
                onResume={goExam}
                onStart={() => setConfirmOpen(true)}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="container-page py-3">
          <ActionButton
            running={!!running}
            remaining={remaining}
            hasCredits={hasCredits}
            isFree={isFree}
            onResume={goExam}
            onStart={() => setConfirmOpen(true)}
          />
        </div>
      </div>

      <StartExamDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        examName={examSet.name}
        totalQuestions={examSet.total_questions}
        durationMinutes={examSet.duration_minutes}
        remainingCredits={remainingCredits}
        isFree={isFree}
        onConfirm={() => {
          setConfirmOpen(false);
          goExam();
        }}
      />
    </div>
  );
}

function ActionButton({
  running,
  remaining,
  hasCredits,
  isFree = false,
  onResume,
  onStart,
}: {
  running: boolean;
  remaining: number;
  hasCredits: boolean;
  isFree?: boolean;
  onResume: () => void;
  onStart: () => void;
}) {
  if (running) {
    return (
      <Button size="lg" className="h-12 w-full gap-2 rounded-xl" onClick={onResume}>
        <Play className="h-4 w-4" aria-hidden />
        {remaining > 0 ? `Lanjutkan · sisa ${formatTimer(remaining)}` : "Buka & kumpulkan"}
      </Button>
    );
  }
  if (!hasCredits) {
    return (
      <Button asChild size="lg" className="h-12 w-full gap-2 rounded-xl">
        <Link to={"/tryout/beli" as never}>
          <Coins className="h-4 w-4" aria-hidden /> Beli kredit untuk mulai
        </Link>
      </Button>
    );
  }
  return (
    <Button size="lg" className="h-12 w-full gap-2 rounded-xl" onClick={onStart}>
      <Play className="h-4 w-4" aria-hidden /> {isFree ? "Mulai tryout gratis" : "Mulai tryout"}
    </Button>
  );
}
