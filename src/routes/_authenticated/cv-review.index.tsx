import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { useAuth } from "@/lib/auth-context";
import { getUserTierConfig } from "@/lib/subscription";
import { reviewCvUpload, type CvReviewResult, extractCvTextWithAi } from "@/lib/ai-functions";
import { extractCvText, renderPdfToImages } from "@/lib/cv-text-extractor";
import { CvFileUpload } from "@/components/cv/CvFileUpload";
import { CvScannerAnimation } from "@/components/cv/CvScannerAnimation";
import {
  HiraCard,
  ReviewDeliverables,
  ReviewPaywall,
  ReviewSummary,
  SuggestionList,
} from "@/components/cv-review/review-ui";
import { scoreTone } from "@/components/cv-review/review-utils";
import { TEMPLATES } from "@/lib/cv-types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv-review/")({
  head: () =>
    buildSeo({
      title: "Review CV - CV Pintar",
      description: "Pilih CV atau upload file CV dan dapatkan review dari AI HR profesional.",
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

interface CvReviewScoreRow {
  cv_id: string | null;
  overall_score: number;
  created_at: string;
}

interface CvReviewSelectTable {
  select: (columns: string) => {
    eq: (
      column: string,
      value: unknown,
    ) => {
      order: (
        column: string,
        options: { ascending: boolean },
      ) => Promise<{ data: CvReviewScoreRow[] | null; error: DbError | null }>;
    };
  };
}

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  status: string;
  updated_at: string;
}

type ReviewSource = "existing" | "upload";

const cvReviews = () =>
  (supabase.from as unknown as (table: string) => CvReviewInsertTable)("cv_reviews");

const cvReviewsSelect = () =>
  (supabase.from as unknown as (table: string) => CvReviewSelectTable)("cv_reviews");

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
  const [source, setSource] = useState<ReviewSource | null>(null);
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [cvsLoading, setCvsLoading] = useState(true);
  const [lastScores, setLastScores] = useState<Record<string, { score: number; at: string }>>({});
  const resultRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let active = true;

    async function loadCvs(uid: string) {
      const [cvResult, reviewResult] = await Promise.all([
        supabase
          .from("cvs")
          .select("id, title, template_id, status, updated_at")
          .eq("user_id", uid)
          .order("updated_at", { ascending: false }),
        cvReviewsSelect()
          .select("cv_id, overall_score, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
      ]);
      if (!active) return;

      if (cvResult.error) toast.error(cvResult.error.message);
      setCvs((cvResult.data as CvRow[] | null) ?? []);

      // Baris pertama per cv_id = review terbaru (sudah diurutkan menurun).
      const latest: Record<string, { score: number; at: string }> = {};
      for (const row of reviewResult.data ?? []) {
        if (row.cv_id && !latest[row.cv_id]) {
          latest[row.cv_id] = { score: row.overall_score, at: row.created_at };
        }
      }
      setLastScores(latest);
      setCvsLoading(false);
    }

    loadCvs(userId);
    return () => {
      active = false;
    };
  }, [user?.id]);

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
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );

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
      <ReviewPaywall
        title="Review CV seperti dibaca HR senior"
        description="Dapatkan analisis kekuatan, kelemahan, benchmark, dan perbaikan cepat dari Hira AI, persona HR profesional dengan pengalaman 20+ tahun."
        backTo="/cv"
        backLabel="Kembali ke CV Saya"
      />
    );
  }

  const activeSource: ReviewSource = source ?? (cvs.length > 0 ? "existing" : "upload");
  const sourceTabs: Array<{ id: ReviewSource; label: string; icon: typeof FileText }> = [
    {
      id: "existing",
      label: `CV Saya${cvs.length > 0 ? ` (${cvs.length})` : ""}`,
      icon: FileText,
    },
    { id: "upload", label: "Upload file", icon: Upload },
  ];

  return (
    <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10">
      {/* Header */}
      <header className="min-w-0">
        <Link
          to="/dashboard"
          className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Review CV oleh HR Expert AI
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          Hira AI membaca CV-mu seperti screening awal rekruter: kesan pertama, format ATS,
          relevansi, pencapaian, lalu memberi saran yang bisa langsung kamu terapkan.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          {/* Pilih sumber */}
          <div
            role="tablist"
            aria-label="Sumber CV"
            className="grid grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1"
          >
            {sourceTabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeSource === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setSource(tab.id)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                    selected
                      ? "bg-white text-green-800 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeSource === "existing" ? (
            <div id="panel-existing" role="tabpanel" aria-labelledby="tab-existing">
              <ExistingCvSection
                cvs={cvs}
                loading={cvsLoading}
                lastScores={lastScores}
                onUpload={() => setSource("upload")}
              />
            </div>
          ) : (
            <div
              id="panel-upload"
              role="tabpanel"
              aria-labelledby="tab-upload"
              className="space-y-5"
            >
              {!extractedText ? (
                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-5 flex flex-col gap-1">
                    <h2 className="font-display text-xl font-extrabold tracking-tight text-gray-900">
                      Upload CV dari file
                    </h2>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Cocok untuk CV yang kamu buat di luar CV Pintar. PDF berbasis teks memberi
                      hasil paling akurat.
                    </p>
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
                <>
                  <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
                          <FileText aria-hidden="true" className="h-6 w-6" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-display text-base font-extrabold text-gray-900">
                            {fileName}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">{fileMeta}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleClear}
                        className="h-10 shrink-0 gap-2 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50 hover:text-green-800"
                      >
                        <Upload aria-hidden="true" className="h-4 w-4" />
                        Ganti file
                      </Button>
                    </div>
                  </section>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleReview();
                    }}
                    className="space-y-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div>
                      <h2 className="font-display text-xl font-extrabold tracking-tight text-gray-900">
                        Atur fokus review
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        Opsional, tapi target posisi membuat saran Hira AI jauh lebih tajam.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target-role" className="text-sm font-bold text-gray-900">
                        Target posisi <span className="font-normal text-gray-600">(opsional)</span>
                      </Label>
                      <input
                        id="target-role"
                        value={targetRole}
                        onChange={(event) => setTargetRole(event.target.value)}
                        placeholder="Contoh: Frontend Developer"
                        autoComplete="off"
                        className="flex h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 transition-colors placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <Label
                          htmlFor="job-description"
                          className="text-sm font-bold text-gray-900"
                        >
                          Deskripsi pekerjaan{" "}
                          <span className="font-normal text-gray-600">(opsional)</span>
                        </Label>
                        <span className="text-xs tabular-nums text-gray-600">
                          {jobDescription.length.toLocaleString("id-ID")} / 10.000
                        </span>
                      </div>
                      <Textarea
                        id="job-description"
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        placeholder="Tempel job description di sini agar AI bisa membandingkan CV dengan kebutuhan role."
                        rows={6}
                        maxLength={10000}
                        className="resize-y rounded-xl border-gray-300 px-4 py-3 text-base placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:ring-2 focus-visible:ring-green-700/20"
                      />
                    </div>
                    <div className="space-y-3 border-t border-gray-100 pt-5">
                      <Button
                        type="submit"
                        disabled={reviewing}
                        size="lg"
                        className="h-12 w-full gap-2 rounded-xl bg-green-700 text-base font-extrabold text-white shadow-md shadow-green-700/20 hover:bg-green-800"
                      >
                        {reviewing ? (
                          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                        ) : (
                          <Brain aria-hidden="true" className="h-5 w-5" />
                        )}
                        {reviewing ? "Menganalisis CV…" : "Mulai Review CV"}
                      </Button>
                      <p className="text-center text-sm text-gray-600">
                        Analisis memakan waktu 10–30 detik.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <HiraCard />
          <ReviewDeliverables />
        </aside>
      </div>

      {reviewing && <CvScannerAnimation cvTitle={fileName} />}

      {result && !reviewing && (
        <div ref={resultRef} className="scroll-mt-24 space-y-8">
          <section aria-labelledby="hasil-heading" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="hasil-heading"
                  className="font-display text-2xl font-extrabold tracking-tight text-gray-900"
                >
                  Hasil review
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {fileName}
                  {targetRole ? ` · target ${targetRole}` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleClear}
                className="h-11 gap-2 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Review CV lain
              </Button>
            </div>
            <ReviewSummary review={result.review} />
          </section>

          <section aria-labelledby="saran-heading" className="space-y-4">
            <div>
              <h2
                id="saran-heading"
                className="font-display text-xl font-extrabold tracking-tight text-gray-900"
              >
                Saran perbaikan spesifik
              </h2>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                Kerjakan yang berprioritas tinggi dulu sebelum melamar. Mau menerapkannya langsung
                di CV?{" "}
                <button
                  type="button"
                  onClick={() => setSource("existing")}
                  className="font-semibold text-green-800 underline underline-offset-4"
                >
                  Buat CV di CV Pintar
                </button>{" "}
                lalu review dari sana.
              </p>
            </div>
            <SuggestionList suggestions={result.review.suggestions} />
          </section>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pilih dari CV yang sudah ada                                        */
/* ------------------------------------------------------------------ */

function ExistingCvSection({
  cvs,
  loading,
  lastScores,
  onUpload,
}: {
  cvs: CvRow[];
  loading: boolean;
  lastScores: Record<string, { score: number; at: string }>;
  onUpload: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? cvs.filter(
        (cv) =>
          cv.title.toLowerCase().includes(normalized) ||
          templateName(cv.template_id).toLowerCase().includes(normalized),
      )
    : cvs;

  return (
    <section
      aria-labelledby="pilih-cv-heading"
      className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="pilih-cv-heading"
            className="font-display text-xl font-extrabold tracking-tight text-gray-900"
          >
            Pilih CV yang mau direview
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Klik salah satu CV. Saran AI bisa kamu terapkan langsung ke CV tersebut.
          </p>
        </div>
        {cvs.length > 4 && (
          <div className="relative sm:w-64">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul atau template"
              aria-label="Cari CV"
              className="h-10 rounded-xl border-gray-300 pl-9 text-sm shadow-none placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:ring-2 focus-visible:ring-green-700/20"
            />
          </div>
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            role="status"
            aria-label="Memuat CV"
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : cvs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
              <FileText aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="mt-3 font-bold text-gray-900">Kamu belum punya CV di CV Pintar</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">
              Buat CV baru, atau upload file CV yang sudah kamu punya untuk langsung direview.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                to="/cv"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 text-sm font-bold text-white transition-colors hover:bg-green-800"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Buat CV Baru
              </Link>
              <Button
                variant="outline"
                onClick={onUpload}
                className="h-11 gap-2 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50"
              >
                <Upload aria-hidden="true" className="h-4 w-4" />
                Upload file CV
              </Button>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
            Tidak ada CV yang cocok dengan “{query}”.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((cv) => {
              const last = lastScores[cv.id];
              const tone = last ? scoreTone(last.score) : null;
              return (
                <li key={cv.id}>
                  <Link
                    to="/cv-review/$cvId"
                    params={{ cvId: cv.id }}
                    className="group flex h-full flex-col gap-3 rounded-2xl border-2 border-gray-200 bg-white p-4 transition-colors hover:border-green-700 hover:bg-green-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 ring-1 ring-green-200">
                        <FileText aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-extrabold text-gray-900">
                          {cv.title}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-gray-600">
                          Template {templateName(cv.template_id)} · diedit {timeAgo(cv.updated_at)}
                        </p>
                      </div>
                      {cv.status === "draft" && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                      {tone && last ? (
                        <span className="flex items-center gap-2 text-sm text-gray-700">
                          <span
                            className={cn(
                              "flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 font-display text-sm font-extrabold ring-1",
                              tone.pill,
                            )}
                          >
                            {last.score}
                          </span>
                          Review terakhir {timeAgo(last.at)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">Belum pernah direview</span>
                      )}
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-green-800">
                        {last ? "Review lagi" : "Review"}
                        <ArrowRight
                          aria-hidden="true"
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function CvReviewSkeleton() {
  return (
    <div
      className="container-page space-y-6 py-6 md:space-y-8 md:py-10"
      role="status"
      aria-label="Memuat halaman review"
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function templateName(id: string) {
  return TEMPLATES.find((t) => t.id === id)?.name ?? id;
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return `pada ${new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}
