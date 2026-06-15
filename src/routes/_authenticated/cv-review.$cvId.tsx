import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getUserTierConfig } from "@/lib/subscription";
import { reviewCv, type CvReviewResult } from "@/lib/ai-functions";
import { CvPreview } from "@/components/cv/CvPreview";
import { type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Lightbulb,
  Loader2,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export const Route = createFileRoute("/_authenticated/cv-review/$cvId")({
  head: () =>
    buildSeo({
      title: "CV Review HR - CV Pintar",
      description: "Review CV oleh AI HR profesional.",
      path: "/cv-review",
      noindex: true,
    }),
  component: CvReviewPage,
});

interface DbError {
  message: string;
}

interface ReviewHistory {
  id: string;
  target_role: string | null;
  overall_score: number;
  created_at: string;
}

interface ReviewRow extends ReviewHistory {
  scores: CvReviewResult["review"]["scores"] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  suggestions: CvReviewResult["review"]["suggestions"] | null;
  industry_benchmark: CvReviewResult["review"]["industryBenchmark"] | null;
  hr_verdict: CvReviewResult["review"]["hrVerdict"] | null;
  quick_wins: string[] | null;
}

interface SelectQuery<T> {
  eq: (column: string, value: unknown) => SelectQuery<T>;
  order: (column: string, options: { ascending: boolean }) => SelectQuery<T>;
  single: () => Promise<{ data: T | null; error: DbError | null }>;
  then: Promise<{ data: T | null; error: DbError | null }>["then"];
}

interface InsertTable {
  insert: (value: unknown) => Promise<{ error: DbError | null }>;
}

interface CvReviewsTable {
  select: <T>(columns: string) => SelectQuery<T>;
  insert: (value: unknown) => Promise<{ error: DbError | null }>;
}

const cvReviews = () =>
  (supabase.from as unknown as (table: string) => CvReviewsTable)("cv_reviews");

const insertCvReviews = () =>
  (supabase.from as unknown as (table: string) => InsertTable)("cv_reviews");

function CvReviewPage() {
  const { user } = useAuth();
  const { cvId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("jakarta");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [result, setResult] = useState<CvReviewResult | null>(null);
  const [tierOk, setTierOk] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700";
    if (score >= 60) return "text-amber-700";
    return "text-red-700";
  };

  const scoreTone = (score: number) => {
    if (score >= 80) return "border-emerald-500/25 bg-emerald-500/5";
    if (score >= 60) return "border-amber-500/25 bg-amber-500/5";
    return "border-red-500/25 bg-red-500/5";
  };

  const toErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Terjadi kesalahan";

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await cvReviews()
      .select<ReviewHistory[]>("id, target_role, overall_score, created_at")
      .eq("user_id", user.id)
      .eq("cv_id", cvId)
      .order("created_at", { ascending: false });

    if (!error && data) setReviewHistory(data);
  }, [cvId, user?.id]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      if (!user?.id) return;

      const config = await getUserTierConfig(user.id);
      if (!active) return;

      if (!config.enableCvReview) {
        setLoading(false);
        return;
      }

      setTierOk(true);
      const { data: row, error } = await supabase.from("cvs").select("*").eq("id", cvId).single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!active) return;
      setCvTitle(row.title);
      setTemplateId(row.template_id as TemplateId);
      const nextCvData = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(nextCvData);
      setTargetRole(nextCvData.personal.headline || "");
      await loadHistory();
      if (active) setLoading(false);
    }

    loadPage();
    return () => {
      active = false;
    };
  }, [cvId, loadHistory, user?.id]);

  const loadReviewDetail = async (reviewId: string) => {
    const { data, error } = await cvReviews().select<ReviewRow>("*").eq("id", reviewId).single();

    if (error || !data) {
      toast.error("Gagal memuat review sebelumnya.");
      return;
    }

    const restored: CvReviewResult = {
      success: true,
      review: {
        reviewer: { name: "Hira AI", title: "AI HR Reviewer", experience: "20+ tahun" },
        scores: {
          overall: data.overall_score,
          firstImpression: data.scores?.firstImpression ?? 0,
          format: data.scores?.format ?? 0,
          content: data.scores?.content ?? 0,
          achievement: data.scores?.achievement ?? 0,
          presentation: data.scores?.presentation ?? 0,
        },
        strengths: data.strengths ?? [],
        weaknesses: data.weaknesses ?? [],
        suggestions: data.suggestions ?? [],
        industryBenchmark: data.industry_benchmark ?? {
          level: "",
          comparison: "",
          percentile: "",
        },
        hrVerdict: data.hr_verdict ?? { verdict: "", reason: "", nextSteps: [] },
        quickWins: data.quick_wins ?? [],
      },
      tier: "",
      isHrPersona: true,
    };

    setResult(restored);
    setSelectedHistoryId(reviewId);
    setShowHistory(false);
    toast.success("Menampilkan review sebelumnya");
  };

  const saveReviewResult = async (response: CvReviewResult) => {
    if (!user?.id) return;
    const { error } = await insertCvReviews().insert({
      user_id: user.id,
      cv_id: cvId,
      target_role: targetRole || null,
      job_description: jobDescription.trim() || null,
      overall_score: response.review.scores.overall,
      scores: response.review.scores,
      strengths: response.review.strengths,
      weaknesses: response.review.weaknesses,
      suggestions: response.review.suggestions,
      industry_benchmark: response.review.industryBenchmark,
      hr_verdict: response.review.hrVerdict,
      quick_wins: response.review.quickWins,
    });

    if (error) {
      console.warn("[Review Save] Gagal menyimpan history:", error);
    } else {
      await loadHistory();
    }
  };

  const handleReview = async () => {
    setReviewing(true);
    setResult(null);
    setSelectedHistoryId(null);

    try {
      const response = await reviewCv({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription.trim() || undefined,
        },
      });
      setResult(response);
      await saveReviewResult(response);
      toast.success("Review CV berhasil!");
    } catch (error: unknown) {
      toast.error(toErrorMessage(error));
    } finally {
      setReviewing(false);
    }
  };

  const previewTemplateName = useMemo(() => templateId.replace(/-/g, " "), [templateId]);

  if (loading) {
    return <CvReviewDetailSkeleton />;
  }

  if (!tierOk) {
    return (
      <div className="container-page py-8 md:py-12">
        <section className="mx-auto max-w-3xl rounded-[1.25rem] border bg-card p-6 text-center shadow-sm md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/20 text-warning">
            <Shield className="h-8 w-8" />
          </div>
          <Badge className="mt-5 bg-warning/20 text-warning hover:bg-warning/20">
            Starter ke atas
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground">
            Review CV by HR Expert AI tersedia di paket Starter.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Upgrade untuk membuka review mendalam dari AI HR profesional dengan pengalaman 20+
            tahun.
          </p>
          <Button asChild size="lg" className="mt-7 gap-2">
            <Link to="/harga">
              <Zap className="h-4 w-4" />
              Upgrade ke Starter
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <BackButton />
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Brain className="h-3.5 w-3.5" />
              HR review for saved CV
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Baca ulang <span className="text-primary">{cvTitle}</span> dari sudut pandang HR.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Dapatkan skor, verdict, benchmark, dan daftar perbaikan paling berdampak sebelum CV
              kamu dikirim.
            </p>
          </div>

          {reviewHistory.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 lg:mt-10"
              onClick={() => setShowHistory((value) => !value)}
            >
              <History className="h-4 w-4" />
              Riwayat ({reviewHistory.length})
            </Button>
          )}
        </div>
      </section>

      {showHistory && reviewHistory.length > 0 && (
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="font-display font-bold text-foreground">Riwayat review CV ini</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {reviewHistory.map((history) => (
              <button
                key={history.id}
                type="button"
                onClick={() => loadReviewDetail(history.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selectedHistoryId === history.id && "border-primary bg-primary/5",
                )}
              >
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {history.target_role || "Tanpa target role"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(history.created_at).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "font-display text-xl font-bold",
                    scoreColor(history.overall_score),
                  )}
                >
                  {history.overall_score}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Konteks review
                </p>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Beri target supaya feedback tidak generik.
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Target role dan job description membantu AI membaca relevansi CV dengan lebih
                  tajam.
                </p>
              </div>
              {selectedHistoryId && (
                <Badge variant="outline" className="w-fit">
                  Review lama
                </Badge>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-role">Target Posisi</Label>
                <input
                  id="target-role"
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Contoh: Frontend Developer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-description">Deskripsi Pekerjaan</Label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Tempel job description di sini untuk membandingkan CV dengan kebutuhan role."
                  rows={6}
                  maxLength={10000}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  Template aktif: <span className="capitalize">{previewTemplateName}</span>
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {selectedHistoryId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResult(null);
                        setSelectedHistoryId(null);
                      }}
                    >
                      Review Baru
                    </Button>
                  )}
                  <Button onClick={handleReview} disabled={reviewing} size="lg" className="gap-2">
                    {reviewing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    {reviewing ? "Menganalisis CV" : "Review CV"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {reviewing && <ReviewLoadingPanel />}
          {selectedHistoryId && result && (
            <div className="rounded-xl border bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
              Menampilkan review sebelumnya. Klik <strong>Review Baru</strong> untuk membuat
              analisis baru.
            </div>
          )}
          {result && (
            <ReviewResultPanel result={result} scoreColor={scoreColor} scoreTone={scoreTone} />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-foreground">Preview CV</h3>
                <p className="text-xs text-muted-foreground">Cek visual sambil membaca feedback.</p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border bg-muted/30 p-2">
              <div
                style={{
                  transform: "scale(0.45)",
                  transformOrigin: "top left",
                  width: "210mm",
                }}
              >
                <CvPreview data={cvData} template={templateId} />
              </div>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full gap-2">
              <Link to="/cv/$id" params={{ id: cvId }}>
                <ArrowLeft className="h-4 w-4" />
                Edit CV
              </Link>
            </Button>
          </section>
        </aside>
      </main>
    </div>
  );
}

function ReviewLoadingPanel() {
  return (
    <section className="rounded-[1.25rem] border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold text-foreground">
        HR AI sedang menilai CV ini.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Analisis akan membaca kesan pertama, format ATS, relevansi role, pencapaian, dan writing.
      </p>
    </section>
  );
}

function ReviewResultPanel({
  result,
  scoreColor,
  scoreTone,
}: {
  result: CvReviewResult;
  scoreColor: (score: number) => string;
  scoreTone: (score: number) => string;
}) {
  const scores = [
    { label: "First Impression", key: "firstImpression" as const },
    { label: "Format ATS", key: "format" as const },
    { label: "Konten & Relevansi", key: "content" as const },
    { label: "Pencapaian", key: "achievement" as const },
    { label: "Presentasi & Writing", key: "presentation" as const },
  ];

  return (
    <section className="space-y-5">
      <div
        className={cn(
          "rounded-[1.25rem] border p-6 shadow-sm md:p-8",
          scoreTone(result.review.scores.overall),
        )}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
              <User className="h-7 w-7" />
            </div>
            <div>
              <Badge className="mb-2 bg-primary text-primary-foreground">Hira AI</Badge>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Verdict dari kacamata HR senior
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {result.review.reviewer.title || "AI HR Reviewer"} -{" "}
                {result.review.reviewer.experience || "20+ tahun pengalaman"}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-center">
            <p
              className={cn(
                "font-display text-6xl font-bold",
                scoreColor(result.review.scores.overall),
              )}
            >
              {result.review.scores.overall}
            </p>
            <p className="text-xs font-medium text-muted-foreground">skor keseluruhan</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Target className="h-5 w-5 text-primary" />
          Breakdown skor
        </h3>
        <div className="mt-5 space-y-4">
          {scores.map((item) => {
            const value = result.review.scores[item.key];
            return (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InsightList
          icon={CheckCircle2}
          title="Kekuatan"
          items={result.review.strengths}
          tone="emerald"
        />
        <InsightList
          icon={AlertCircle}
          title="Perlu Ditingkatkan"
          items={result.review.weaknesses}
          tone="red"
        />
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          Saran perbaikan spesifik
        </h3>
        <div className="mt-5 space-y-4">
          {result.review.suggestions.map((suggestion, index) => (
            <article key={index} className="rounded-xl border bg-muted/25 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={cn(
                    "text-[10px] hover:bg-inherit",
                    suggestion.priority === "high"
                      ? "bg-red-500/10 text-red-700"
                      : suggestion.priority === "medium"
                        ? "bg-amber-500/10 text-amber-700"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {suggestion.priority === "high"
                    ? "Prioritas Tinggi"
                    : suggestion.priority === "medium"
                      ? "Prioritas Sedang"
                      : "Prioritas Rendah"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {suggestion.category}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Saat ini</p>
                  <p className="mt-1 text-muted-foreground line-through decoration-red-500/40">
                    {suggestion.current}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary">Rekomendasi</p>
                  <p className="mt-1 font-medium text-foreground">{suggestion.suggested}</p>
                </div>
              </div>
              <p className="mt-3 flex gap-2 text-xs leading-5 text-muted-foreground">
                <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Dampak: {suggestion.impact}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <SidePanelBenchmark result={result} />
        <SidePanelVerdict result={result} />
        <SidePanelQuickWins result={result} />
      </section>
    </section>
  );
}

function InsightList({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  tone: "emerald" | "red";
}) {
  const toneClass =
    tone === "emerald" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700";

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-display font-bold text-foreground">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h3>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SidePanelBenchmark({ result }: { result: CvReviewResult }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-display font-bold text-foreground">
        <Trophy className="h-5 w-5 text-amber-600" />
        Benchmark
      </h3>
      <div className="mt-4 space-y-3">
        <BenchmarkItem label="Level" value={result.review.industryBenchmark.level} />
        <BenchmarkItem label="Percentile" value={result.review.industryBenchmark.percentile} />
        <BenchmarkItem label="Perbandingan" value={result.review.industryBenchmark.comparison} />
      </div>
    </section>
  );
}

function SidePanelVerdict({ result }: { result: CvReviewResult }) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm md:col-span-2">
      <h3 className="flex items-center gap-2 font-display font-bold text-foreground">
        <Star className="h-5 w-5 text-primary" />
        Verdict HR
      </h3>
      <Badge className="mt-4 bg-primary text-primary-foreground">
        {result.review.hrVerdict.verdict}
      </Badge>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {result.review.hrVerdict.reason}
      </p>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {result.review.hrVerdict.nextSteps.map((step, index) => (
          <div key={index} className="flex gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SidePanelQuickWins({ result }: { result: CvReviewResult }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm md:col-span-3">
      <h3 className="flex items-center gap-2 font-display font-bold text-foreground">
        <Zap className="h-5 w-5 text-amber-600" />
        Quick wins
      </h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {result.review.quickWins.map((win, index) => (
          <div key={index} className="flex gap-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>{win}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BenchmarkItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || "-"}</p>
    </div>
  );
}

function CvReviewDetailSkeleton() {
  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-7 w-44 rounded-full" />
        <Skeleton className="mt-5 h-10 w-full max-w-2xl sm:h-12" />
        <Skeleton className="mt-3 h-10 w-4/5 max-w-xl sm:h-12" />
        <Skeleton className="mt-5 h-4 w-full max-w-xl" />
      </section>

      <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="mt-3 h-7 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
            <div className="mt-5 space-y-4">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <div className="flex justify-end">
                <Skeleton className="h-11 w-full sm:w-36" />
              </div>
            </div>
          </section>
          <section className="rounded-[1.25rem] border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="mt-3 h-7 w-64" />
                  <Skeleton className="mt-2 h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-16 w-20" />
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-[520px] w-full rounded-xl" />
          <Skeleton className="mt-4 h-10 w-full" />
        </aside>
      </main>
    </div>
  );
}
