/**
 * /tryout/$examId — Detail exam set, tombol mulai, dan info.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Coins, Loader2, AlertCircle, BookOpen, Trophy } from "lucide-react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/back-button";

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
};

function TryoutExamDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { examId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [examSet, setExamSet] = useState<ExamSetRow | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [inProgressAttemptId, setInProgressAttemptId] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, user?.id]);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const [{ data: exam }, { data: credits }, { data: inProgress }] = await Promise.all([
      supabase
        .from("tryout_exam_sets")
        .select("*")
        .eq("id", examId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("tryout_credits")
        .select("remaining_credits")
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("tryout_attempts")
        .select("id, started_at")
        .eq("user_id", user.id)
        .eq("exam_set_id", examId)
        .eq("status", "in_progress")
        .maybeSingle(),
    ]);

    setExamSet(exam as ExamSetRow);

    if (credits) {
      const total = credits.reduce((s, c) => s + c.remaining_credits, 0);
      setRemainingCredits(total);
    } else {
      setRemainingCredits(0);
    }

    if (inProgress) {
      setInProgressAttemptId(inProgress.id);
    }

    setLoading(false);
  }

  async function handleStart() {
    if (!user?.id) return;
    setStarting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${supabaseUrl}/functions/v1/tryout-start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exam_set_id: examId }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "NO_CREDITS") {
          toast.error(data.message || "Kredit tidak cukup");
          navigate({ to: "/tryout/beli" as never });
          return;
        }
        throw new Error(data.error || "Gagal memulai tryout");
      }

      toast.success(data.resumed ? "Melanjutkan ujian..." : "Ujian dimulai!");
      navigate({
        to: "/tryout/$examId/ujian" as never,
        params: { examId } as never,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memulai tryout";
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!examSet) {
    return (
      <div className="container-page py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Set Tryout Tidak Ditemukan</h1>
        <Button asChild className="mt-6">
          <Link to={"/tryout" as never}>Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  const noCredits = (remainingCredits ?? 0) === 0;

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <BackButton />

      {/* Header */}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5 bg-primary/10 text-primary">
              <Trophy className="h-3 w-3" /> {examSet.total_questions} Soal · {examSet.duration_minutes} Menit
            </Badge>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{examSet.name}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              {examSet.description ||
                `Simulasi SKD dengan ${examSet.total_questions} soal dan timer ${examSet.duration_minutes} menit.`}
            </p>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-emerald-50 to-amber-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Coins className="h-4 w-4 text-amber-500" /> Kredit kamu
            </div>
            <div className="mt-1 font-display text-3xl font-bold text-foreground">
              {remainingCredits ?? 0}
            </div>
            {noCredits ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Tidak cukup. Beli paket dulu.</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">1x tryout = 1 kredit</p>
            )}
          </div>
        </div>
      </section>

      {/* Format breakdown */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Format Ujian</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormatCard label="TWK" fullName="Wawasan Kebangsaan" count={examSet.twk_count} passing={examSet.passing_grade_twk} color="amber" />
          <FormatCard label="TIU" fullName="Intelegensi Umum" count={examSet.tiu_count} passing={examSet.passing_grade_tiu} color="sky" />
          <FormatCard label="TKP" fullName="Karakteristik Pribadi" count={examSet.tkp_count} passing={examSet.passing_grade_tkp} color="emerald" />
        </div>
      </section>

      {/* Rules */}
      <section className="rounded-2xl border bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
        <h2 className="mb-2 font-bold">⚠️ Aturan Ujian</h2>
        <ul className="space-y-1 text-amber-800">
          <li>• Soal akan dikirim <strong>tanpa kunci jawaban</strong> ke browser kamu. Server yang akan menilai.</li>
          <li>• Timer 100 menit. Auto-submit saat waktu habis.</li>
          <li>• Menjawab/mengubah browser tab akan <strong>menyimpan otomatis</strong> ke server setiap ada perubahan.</li>
          <li>• Tidak bisa reload halaman tanpa kehilangan waktu. Hubungi admin jika ada masalah.</li>
          <li>• 1 attempt = 1 kredit. Tidak ada pengembalian jika di-cancel.</li>
        </ul>
      </section>

      {/* Action */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to={"/tryout" as never}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </Button>
        {inProgressAttemptId ? (
          <Button
            size="lg"
            className="gap-2"
            disabled={starting}
            onClick={handleStart}
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Lanjutkan Ujian
          </Button>
        ) : (
          <Button
            size="lg"
            className="gap-2"
            disabled={noCredits || starting}
            onClick={handleStart}
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : noCredits ? (
              "Beli Kredit Dulu"
            ) : (
              <>
                <Play className="h-4 w-4" /> Mulai Tryout
              </>
            )}
          </Button>
        )}
      </section>

      {noCredits && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40 text-sm">
          <p className="font-bold text-amber-900">Kredit tidak cukup.</p>
          <p className="mt-1 text-amber-800">
            Beli paket Satuan (1x) atau Lengkap (5x) untuk mulai tryout.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to={"/tryout/beli" as never}>Lihat Paket</Link>
          </Button>
        </section>
      )}
    </div>
  );
}

function FormatCard({
  label,
  fullName,
  count,
  passing,
  color,
}: {
  label: string;
  fullName: string;
  count: number;
  passing: number;
  color: "amber" | "sky" | "emerald";
}) {
  const colorClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
    sky: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-400",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
  }[color];
  return (
    <div className={`rounded-xl border-2 p-4 ${colorClass}`}>
      <div className="font-display text-2xl font-bold">{label}</div>
      <div className="text-xs">{fullName}</div>
      <div className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Jumlah</span>
          <span className="font-bold">{count} soal</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span>Passing grade</span>
          <span className="font-bold">{passing}</span>
        </div>
      </div>
    </div>
  );
}