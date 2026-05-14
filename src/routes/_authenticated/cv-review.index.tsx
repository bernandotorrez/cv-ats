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
import { useAuth } from "@/lib/auth-context";
import { getUserTierConfig } from "@/lib/subscription";
import { reviewCvUpload, type CvReviewResult, extractCvTextWithAi } from "@/lib/ai-functions";
import { extractCvText, renderPdfToImages } from "@/lib/cv-text-extractor";
import { CvFileUpload } from "@/components/cv/CvFileUpload";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
  Lightbulb,
  Loader2,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Upload,
  User,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv-review/")({
  head: () =>
    buildSeo({
      title: "Upload & Review CV - CV Pintar",
      description: "Upload CV kamu dan dapatkan review dari AI HR profesional.",
      path: "/cv-review",
      noindex: true,
    }),
  component: CvReviewUploadPage,
});

interface DbError {
  message: string;
}

interface CvReviewInsertTable {
  insert: (value: unknown) => Promise<{ error: DbError | null }>;
}

const cvReviews = () =>
  (supabase.from as unknown as (table: string) => CvReviewInsertTable)("cv_reviews");

function CvReviewUploadPage() {
  const { user } = useAuth();
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "docx" | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<CvReviewResult | null>(null);
  const [tierOk, setTierOk] = useState<boolean | null>(null);
  const [pageCount, setPageCount] = useState<number | undefined>();

  useEffect(() => {
    let active = true;

    async function loadTier() {
      if (!user?.id) return;
      const config = await getUserTierConfig(user.id);
      if (active) setTierOk(config.enableCvReview);
    }

    loadTier();
    return () => {
      active = false;
    };
  }, [user?.id]);

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

  const handleFileReady = useCallback(async (file: File) => {
    setCurrentFile(file);
    setFileError(null);
    setExtracting(true);
    setResult(null);

    try {
      const { text, fileType: nextFileType, pageCount: nextPageCount } = await extractCvText(file);
      const minChars = 50;

      if (text.trim().length < minChars && nextFileType === "pdf") {
        toast.info("CV tampaknya berupa gambar. Mencoba ekstraksi dengan AI...");

        try {
          const images = await renderPdfToImages(file);
          if (images.length > 0) {
            const aiResult = await extractCvTextWithAi({
              data: { images, fileName: file.name },
            });
            const aiText = aiResult.text.trim();
            if (aiText.length >= minChars) {
              setExtractedText(aiText);
              setFileName(file.name);
              setFileType(nextFileType);
              setPageCount(nextPageCount);
              toast.success(
                `CV berhasil dibaca dengan AI OCR - ${aiText.length.toLocaleString()} karakter`,
              );
              return;
            }
          }
        } catch (error: unknown) {
          console.warn("AI OCR fallback gagal:", error);
        }

        setFileError(
          "CV ini tampaknya berupa gambar atau hasil scan. Gunakan CV berbasis teks agar review lebih akurat.",
        );
        setCurrentFile(null);
        return;
      }

      if (text.trim().length < minChars) {
        setFileError("Teks yang diekstrak terlalu sedikit. Pastikan CV berisi teks yang cukup.");
        setCurrentFile(null);
        return;
      }

      setExtractedText(text);
      setFileName(file.name);
      setFileType(nextFileType);
      setPageCount(nextPageCount);
      toast.success(
        `CV berhasil dibaca - ${nextFileType.toUpperCase()}, ${text.length.toLocaleString()} karakter`,
      );
    } catch (error: unknown) {
      setFileError(toErrorMessage(error));
      setCurrentFile(null);
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleClear = () => {
    setCurrentFile(null);
    setExtractedText("");
    setFileName("");
    setFileType(null);
    setPageCount(undefined);
    setFileError(null);
    setResult(null);
  };

  const handleReview = async () => {
    if (!extractedText.trim()) {
      toast.error("Upload CV terlebih dahulu.");
      return;
    }

    setReviewing(true);
    setResult(null);

    try {
      const response = await reviewCvUpload({
        data: {
          rawText: extractedText,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription.trim() || undefined,
        },
      });
      setResult(response);

      if (user?.id) {
        const { error } = await cvReviews().insert({
          user_id: user.id,
          cv_id: null,
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
        if (error) console.warn("[Review Save] Gagal menyimpan history:", error);
      }

      toast.success("Review CV berhasil!");
    } catch (error: unknown) {
      toast.error(toErrorMessage(error));
    } finally {
      setReviewing(false);
    }
  };

  const fileMeta = useMemo(() => {
    if (!extractedText) return null;
    return [
      fileType?.toUpperCase(),
      pageCount ? `${pageCount} halaman` : null,
      `${extractedText.length.toLocaleString()} karakter`,
    ]
      .filter(Boolean)
      .join(" - ");
  }, [extractedText, fileType, pageCount]);

  if (tierOk === null) {
    return <CvReviewSkeleton />;
  }

  if (tierOk === false) {
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
            Review CV seperti dibaca HR senior.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Dapatkan analisis kekuatan, kelemahan, benchmark, dan quick wins dari persona HR
            profesional 20+ tahun.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/harga">
                <Zap className="h-4 w-4" />
                Upgrade ke Starter
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/cv">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke CV Saya
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 gap-2">
              <Link to="/cv">
                <ArrowLeft className="h-4 w-4" />
                CV Saya
              </Link>
            </Button>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Brain className="h-3.5 w-3.5" />
              HR review workspace
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Upload CV, lalu temukan alasan rekruter harus memanggilmu.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              AI HR membaca CV kamu seperti screening awal: first impression, ATS, relevansi role,
              achievement, dan quick wins yang paling cepat menaikkan kualitas.
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Fokus review</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Bukan sekadar skor. Kamu dapat prioritas perbaikan yang bisa langsung dieksekusi.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Upload", "Konteks", "Review"].map((item, index) => (
                <div key={item} className="rounded-xl border bg-background p-3 text-center">
                  <p className="text-xs font-bold text-primary">0{index + 1}</p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {!extractedText ? (
            <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    File CV
                  </p>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Upload PDF atau DOCX yang siap dibaca.
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    File berbasis teks memberi hasil review paling akurat.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit">
                  Maks 10MB
                </Badge>
              </div>
              <CvFileUpload
                onFileReady={handleFileReady}
                extracting={extracting}
                error={fileError}
                currentFile={currentFile}
                onClear={handleClear}
              />
            </section>
          ) : (
            <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-foreground">{fileName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{fileMeta}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleClear} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Ganti File
                </Button>
              </div>
            </section>
          )}

          {extractedText && (
            <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Konteks role
                  </p>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Beri target agar review lebih tajam.
                  </h2>
                </div>
                <Badge variant="outline" className="w-fit">
                  Opsional, tapi disarankan
                </Badge>
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
                    placeholder="Tempel job description di sini agar AI bisa membandingkan CV dengan kebutuhan role."
                    rows={6}
                    maxLength={10000}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Review akan menilai impresi HR, ATS, relevansi, achievement, dan writing.
                  </p>
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
            </section>
          )}
        </div>

        <aside className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Agar review makin presisi</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Target role membantu AI membedakan CV yang sekadar rapi dari CV yang benar-benar
                relevan.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              "Gunakan CV versi terbaru.",
              "Tambahkan job description bila ada.",
              "Fokus pada quick wins sebelum apply.",
            ].map((item) => (
              <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {reviewing && <ReviewLoadingPanel />}
      {result && (
        <ReviewResultPanel result={result} scoreColor={scoreColor} scoreTone={scoreTone} />
      )}
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
        HR AI sedang membaca CV kamu.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Kami mengecek struktur, relevansi, bukti pencapaian, dan hal kecil yang bisa menaikkan
        peluang screening.
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
                {result.review.reviewer.title || "HR Professional"} -{" "}
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
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
            <p className="mt-1 text-sm text-muted-foreground">
              Prioritaskan item berlabel tinggi sebelum apply.
            </p>
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
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-display font-bold text-foreground">
              <Trophy className="h-5 w-5 text-amber-600" />
              Benchmark
            </h3>
            <div className="mt-4 grid gap-3">
              <BenchmarkItem label="Level" value={result.review.industryBenchmark.level} />
              <BenchmarkItem
                label="Percentile"
                value={result.review.industryBenchmark.percentile}
              />
              <BenchmarkItem
                label="Perbandingan"
                value={result.review.industryBenchmark.comparison}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
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
            <div className="mt-4 space-y-2">
              {result.review.hrVerdict.nextSteps.map((step, index) => (
                <div key={index} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-display font-bold text-foreground">
              <Zap className="h-5 w-5 text-amber-600" />
              Quick wins
            </h3>
            <div className="mt-4 space-y-3">
              {result.review.quickWins.map((win, index) => (
                <div key={index} className="flex gap-2 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{win}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
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

function BenchmarkItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || "-"}</p>
    </div>
  );
}

function CvReviewSkeleton() {
  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="mt-4 h-7 w-44 rounded-full" />
            <Skeleton className="mt-5 h-10 w-full max-w-2xl sm:h-12" />
            <Skeleton className="mt-3 h-10 w-4/5 max-w-xl sm:h-12" />
            <Skeleton className="mt-5 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-5/6 max-w-lg" />
          </div>
          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-4/5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="mt-3 h-7 w-full max-w-xl" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          <Skeleton className="mt-5 h-64 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-4/5" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-5 w-full" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
