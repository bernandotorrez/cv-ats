import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getUserTierConfig } from "@/lib/subscription";
import { reviewCv, type CvReviewResult } from "@/lib/ai-functions";
import { CvPreview } from "@/components/cv/CvPreview";
import { CvScannerAnimation } from "@/components/cv/CvScannerAnimation";
import { InlineCvEditor } from "@/components/cv/InlineCvEditor";
import { type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  ChevronDown,
  FileText,
  History,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  HiraCard,
  ReviewDeliverables,
  ReviewHistoryList,
  ReviewPaywall,
  ReviewSummary,
} from "@/components/cv-review/review-ui";

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

type ReviewPhase = "input" | "scanning" | "result";

function CvReviewPage() {
  const { user } = useAuth();
  const { cvId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<ReviewPhase>("input");
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
  const [showSummary, setShowSummary] = useState(true);

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
    setPhase("result");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase("scanning");
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

      // Small delay for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      window.scrollTo({ top: 0, behavior: "smooth" });
      setResult(response);
      setPhase("result");
      await saveReviewResult(response);
      toast.success("Review CV berhasil!");
    } catch (error: unknown) {
      setPhase("input");
      toast.error(toErrorMessage(error));
    }
  };

  const suggestions = useMemo(() => {
    if (!result?.review?.suggestions) return [];
    return result.review.suggestions;
  }, [result]);

  const handleApplySuggestion = useCallback(
    async (index: number, newText: string) => {
      const suggestion = suggestions[index];
      if (!suggestion) return;

      const updatedCvData = JSON.parse(JSON.stringify(cvData));
      const categoryLower = suggestion.category.toLowerCase();
      const currentText = suggestion.current?.trim() || "";
      const targetSection = suggestion.targetSection || "";
      const bulletIndex = suggestion.bulletIndex;
      let applied = false;

      const replaceBulletPoint = (
        description: string,
        bulletIdx: number,
        newBulletText: string,
      ): string => {
        const lines = description.split("\n");
        let nonEmptyCount = 0;
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed !== "") {
            if (nonEmptyCount === bulletIdx) {
              const bulletMatch = trimmed.match(/^([\-•*\d]+\.?\s*)/);
              const prefix = bulletMatch ? bulletMatch[1] : "";
              let cleanNewText = newBulletText;
              const newBulletMatch = newBulletText.match(/^([\-•*\d]+\.?\s*)/);
              if (newBulletMatch) {
                cleanNewText = newBulletText.substring(newBulletMatch[1].length);
              }
              lines[i] = prefix + cleanNewText;
              break;
            }
            nonEmptyCount++;
          }
        }
        return lines.join("\n");
      };

      const setValueByPath = (
        obj: any,
        path: string,
        value: string,
        bulletIdx?: number | null,
      ): boolean => {
        try {
          const match = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
          if (match) {
            const [, arrayName, indexStr, field] = match;
            const idx = parseInt(indexStr);
            if (obj[arrayName] && obj[arrayName][idx]) {
              if (bulletIdx !== null && bulletIdx !== undefined && field === "description") {
                obj[arrayName][idx][field] = replaceBulletPoint(
                  obj[arrayName][idx][field] || "",
                  bulletIdx,
                  value,
                );
              } else {
                obj[arrayName][idx][field] = value;
              }
              return true;
            }
          } else if (path.includes(".")) {
            const parts = path.split(".");
            let current = obj;
            for (let i = 0; i < parts.length - 1; i++) {
              current = current[parts[i]];
              if (!current) return false;
            }
            current[parts[parts.length - 1]] = value;
            return true;
          }
          return false;
        } catch {
          return false;
        }
      };

      if (targetSection && !applied) {
        applied = setValueByPath(updatedCvData, targetSection, newText, bulletIndex);
      }

      if (!applied && currentText && currentText.length > 10) {
        const searchIn = (text: string) => text?.toLowerCase().includes(currentText.toLowerCase());
        const doReplace = (text: string) => {
          const escaped = currentText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return text.replace(new RegExp(escaped, "gi"), newText);
        };

        if (!applied && searchIn(updatedCvData.personal.summary || "")) {
          updatedCvData.personal.summary = doReplace(updatedCvData.personal.summary);
          applied = true;
        }

        if (!applied) {
          for (let i = 0; i < updatedCvData.experiences.length; i++) {
            const desc = updatedCvData.experiences[i].description || "";
            if (searchIn(desc)) {
              if (bulletIndex !== null && bulletIndex !== undefined) {
                updatedCvData.experiences[i].description = replaceBulletPoint(
                  desc,
                  bulletIndex,
                  newText,
                );
              } else {
                updatedCvData.experiences[i].description = doReplace(desc);
              }
              applied = true;
              break;
            }
          }
        }

        if (!applied && searchIn(updatedCvData.personal.headline || "")) {
          updatedCvData.personal.headline = doReplace(updatedCvData.personal.headline);
          applied = true;
        }
      }

      if (!applied) {
        const isSummary =
          categoryLower.includes("summary") ||
          categoryLower.includes("ringkasan") ||
          categoryLower.includes("content");
        const isExperience =
          categoryLower.includes("experience") ||
          categoryLower.includes("pengalaman") ||
          categoryLower.includes("achievement");
        const isHeadline = categoryLower.includes("headline") || categoryLower.includes("judul");

        if (isSummary) {
          updatedCvData.personal.summary = newText;
          applied = true;
        } else if (isHeadline) {
          updatedCvData.personal.headline = newText;
          applied = true;
        } else if (isExperience && updatedCvData.experiences.length > 0) {
          if (currentText) {
            for (let i = 0; i < updatedCvData.experiences.length; i++) {
              const exp = updatedCvData.experiences[i];
              if (exp.company && currentText.includes(exp.company)) {
                if (bulletIndex !== null && bulletIndex !== undefined) {
                  updatedCvData.experiences[i].description = replaceBulletPoint(
                    exp.description || "",
                    bulletIndex,
                    newText,
                  );
                } else {
                  updatedCvData.experiences[i].description = newText;
                }
                applied = true;
                break;
              }
            }
          }
          if (!applied) {
            if (bulletIndex !== null && bulletIndex !== undefined) {
              updatedCvData.experiences[0].description = replaceBulletPoint(
                updatedCvData.experiences[0].description || "",
                bulletIndex,
                newText,
              );
            } else {
              updatedCvData.experiences[0].description = newText;
            }
            applied = true;
          }
        } else {
          updatedCvData.personal.summary = newText;
          applied = true;
        }
      }

      setCvData(updatedCvData);

      try {
        await supabase.from("cvs").update({ data: updatedCvData }).eq("id", cvId);
      } catch (err) {
        console.warn("Gagal menyimpan ke database:", err);
      }

      if (applied) {
        toast.success(`Saran berhasil diterapkan!`);
      }
    },
    [cvData, cvId, suggestions],
  );

  const handleApplyAllSuggestions = useCallback(async () => {
    const updatedCvData = JSON.parse(JSON.stringify(cvData));
    let appliedCount = 0;

    const replaceBulletPoint = (
      description: string,
      bulletIdx: number,
      newBulletText: string,
    ): string => {
      const lines = description.split("\n");
      let nonEmptyCount = 0;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed !== "") {
          if (nonEmptyCount === bulletIdx) {
            const bulletMatch = trimmed.match(/^([\-•*\d]+\.?\s*)/);
            const prefix = bulletMatch ? bulletMatch[1] : "";
            let cleanNewText = newBulletText;
            const newBulletMatch = newBulletText.match(/^([\-•*\d]+\.?\s*)/);
            if (newBulletMatch) {
              cleanNewText = newBulletText.substring(newBulletMatch[1].length);
            }
            lines[i] = prefix + cleanNewText;
            break;
          }
          nonEmptyCount++;
        }
      }
      return lines.join("\n");
    };

    const setValueByPath = (
      obj: any,
      path: string,
      value: string,
      bulletIdx?: number | null,
    ): boolean => {
      try {
        const match = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
        if (match) {
          const [, arrayName, indexStr, field] = match;
          const idx = parseInt(indexStr);
          if (obj[arrayName] && obj[arrayName][idx]) {
            if (bulletIdx !== null && bulletIdx !== undefined && field === "description") {
              obj[arrayName][idx][field] = replaceBulletPoint(
                obj[arrayName][idx][field] || "",
                bulletIdx,
                value,
              );
            } else {
              obj[arrayName][idx][field] = value;
            }
            return true;
          }
        } else if (path.includes(".")) {
          const parts = path.split(".");
          let current = obj;
          for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
            if (!current) return false;
          }
          current[parts[parts.length - 1]] = value;
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    suggestions.forEach((suggestion) => {
      const categoryLower = suggestion.category.toLowerCase();
      const currentText = suggestion.current?.trim() || "";
      const targetSection = suggestion.targetSection || "";
      const bulletIndex = suggestion.bulletIndex;
      let applied = false;

      if (targetSection) {
        applied = setValueByPath(updatedCvData, targetSection, suggestion.suggested, bulletIndex);
      }

      if (!applied && currentText && currentText.length > 10) {
        const searchIn = (text: string) => text?.toLowerCase().includes(currentText.toLowerCase());
        const doReplace = (text: string) => {
          const escaped = currentText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return text.replace(new RegExp(escaped, "gi"), suggestion.suggested);
        };

        if (searchIn(updatedCvData.personal.summary || "")) {
          updatedCvData.personal.summary = doReplace(updatedCvData.personal.summary);
          applied = true;
        }

        if (!applied) {
          for (let i = 0; i < updatedCvData.experiences.length; i++) {
            const desc = updatedCvData.experiences[i].description || "";
            if (searchIn(desc)) {
              if (bulletIndex !== null && bulletIndex !== undefined) {
                updatedCvData.experiences[i].description = replaceBulletPoint(
                  desc,
                  bulletIndex,
                  suggestion.suggested,
                );
              } else {
                updatedCvData.experiences[i].description = doReplace(desc);
              }
              applied = true;
              break;
            }
          }
        }
      }

      if (!applied) {
        const isSummary =
          categoryLower.includes("summary") ||
          categoryLower.includes("ringkasan") ||
          categoryLower.includes("content");
        const isExperience =
          categoryLower.includes("experience") ||
          categoryLower.includes("pengalaman") ||
          categoryLower.includes("achievement");
        const isHeadline = categoryLower.includes("headline") || categoryLower.includes("judul");

        if (isSummary) {
          updatedCvData.personal.summary = suggestion.suggested;
          applied = true;
        } else if (isHeadline) {
          updatedCvData.personal.headline = suggestion.suggested;
          applied = true;
        } else if (isExperience && updatedCvData.experiences.length > 0) {
          if (bulletIndex !== null && bulletIndex !== undefined) {
            updatedCvData.experiences[0].description = replaceBulletPoint(
              updatedCvData.experiences[0].description || "",
              bulletIndex,
              suggestion.suggested,
            );
          } else {
            updatedCvData.experiences[0].description = suggestion.suggested;
          }
          applied = true;
        } else {
          updatedCvData.personal.summary = suggestion.suggested;
          applied = true;
        }
      }

      if (applied) appliedCount++;
    });

    setCvData(updatedCvData);

    try {
      await supabase.from("cvs").update({ data: updatedCvData }).eq("id", cvId);
    } catch (err) {
      console.warn("Gagal menyimpan ke database:", err);
    }

    toast.success(`${appliedCount} saran berhasil diterapkan!`);
  }, [cvData, cvId, suggestions]);

  const handleSaveAndReturn = useCallback(() => {
    toast.success("Perubahan berhasil disimpan!");
  }, []);

  if (loading) {
    return <CvReviewSkeleton />;
  }

  if (!tierOk) {
    return (
      <ReviewPaywall
        title="Review CV oleh HR Expert AI ada di paket Starter"
        description="Upgrade untuk membuka review mendalam dari Hira AI, konsultan HR dengan pengalaman 20+ tahun, lengkap dengan saran yang bisa langsung diterapkan."
        backTo="/dashboard"
        backLabel="Kembali ke Dashboard"
      />
    );
  }

  const inResult = phase === "result" && result;

  return (
    <MotionConfig reducedMotion="user">
      <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/cv-review"
              className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Review CV
            </Link>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Review CV oleh HR Expert AI
            </h1>
            <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 sm:text-base">
              <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-green-700" />
              <span className="max-w-full truncate font-semibold text-gray-900">
                {cvTitle || "CV tanpa judul"}
              </span>
              <span aria-hidden="true">·</span>
              <Link
                to="/cv/$id"
                params={{ id: cvId }}
                className="font-semibold text-green-800 underline-offset-4 hover:underline"
              >
                Buka editor
              </Link>
            </p>
          </div>

          {inResult && (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              {reviewHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  aria-expanded={showHistory}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                >
                  <History aria-hidden="true" className="h-4 w-4" />
                  Riwayat ({reviewHistory.length})
                </button>
              )}
              <Button
                onClick={() => {
                  setPhase("input");
                  setResult(null);
                  setSelectedHistoryId(null);
                  setShowHistory(false);
                }}
                className="h-11 gap-2 rounded-xl bg-green-700 px-5 font-bold text-white shadow-md shadow-green-700/20 hover:bg-green-800"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                Review Baru
              </Button>
            </div>
          )}
        </header>

        {/* Riwayat (saat melihat hasil) */}
        {inResult && showHistory && reviewHistory.length > 0 && (
          <section
            aria-label="Riwayat review"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold text-gray-900">
                Riwayat review CV ini
              </h2>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                aria-label="Tutup riwayat"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <ReviewHistoryList
              layout="row"
              items={reviewHistory}
              selectedId={selectedHistoryId}
              onSelect={loadReviewDetail}
            />
          </section>
        )}

        <AnimatePresence mode="wait">
          {phase === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReview();
                }}
                className="space-y-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
              >
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-gray-900">
                    Atur fokus review
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Semakin spesifik target posisinya, semakin tajam saran dari Hira AI.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-role" className="text-sm font-bold text-gray-900">
                    Target posisi <span className="font-normal text-gray-600">(opsional)</span>
                  </Label>
                  <input
                    id="target-role"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Contoh: Frontend Developer, Marketing Manager"
                    autoComplete="off"
                    className="flex h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 transition-colors placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="job-description" className="text-sm font-bold text-gray-900">
                      Deskripsi pekerjaan{" "}
                      <span className="font-normal text-gray-600">(opsional)</span>
                    </Label>
                    <span className="text-xs tabular-nums text-gray-600" aria-live="off">
                      {jobDescription.length.toLocaleString("id-ID")} / 10.000
                    </span>
                  </div>
                  <Textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Tempel job description di sini untuk analisis yang lebih akurat..."
                    rows={6}
                    maxLength={10000}
                    className="resize-y rounded-xl border-gray-300 px-4 py-3 text-base placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:ring-2 focus-visible:ring-green-700/20"
                  />
                  <p className="text-sm text-gray-600">
                    Dengan job description, Hira AI ikut mengecek seberapa cocok CV-mu dengan
                    lowongan itu.
                  </p>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-5">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full gap-2 rounded-xl bg-green-700 text-base font-extrabold text-white shadow-md shadow-green-700/20 hover:bg-green-800"
                  >
                    <Brain aria-hidden="true" className="h-5 w-5" />
                    Mulai Review CV
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <p className="text-center text-sm text-gray-600">
                    Analisis memakan waktu 10–30 detik. Hasilnya otomatis tersimpan di riwayat.
                  </p>
                </div>
              </form>

              <aside className="space-y-4">
                <HiraCard />
                <ReviewDeliverables />
                {reviewHistory.length > 0 && (
                  <section aria-labelledby="riwayat-heading" className="space-y-2.5">
                    <h2
                      id="riwayat-heading"
                      className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900"
                    >
                      <History aria-hidden="true" className="h-4 w-4 text-green-700" />
                      Riwayat review
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                        {reviewHistory.length}
                      </span>
                    </h2>
                    <ReviewHistoryList
                      items={reviewHistory.slice(0, 5)}
                      selectedId={selectedHistoryId}
                      onSelect={loadReviewDetail}
                    />
                    {reviewHistory.length > 5 && (
                      <p className="text-xs text-gray-600">
                        Menampilkan 5 review terbaru dari {reviewHistory.length}.
                      </p>
                    )}
                  </section>
                )}
              </aside>
            </motion.div>
          )}

          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CvScannerAnimation cvTitle={cvTitle} />
            </motion.div>
          )}

          {inResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <section aria-labelledby="ringkasan-heading" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id="ringkasan-heading"
                    className="font-display text-xl font-extrabold tracking-tight text-gray-900"
                  >
                    Hasil review
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowSummary((v) => !v)}
                    aria-expanded={showSummary}
                    aria-controls="ringkasan-panel"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-green-800 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                  >
                    {showSummary ? "Sembunyikan ringkasan" : "Tampilkan ringkasan"}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("h-4 w-4 transition-transform", showSummary && "rotate-180")}
                    />
                  </button>
                </div>
                <div id="ringkasan-panel" hidden={!showSummary}>
                  <ReviewSummary review={result.review} />
                </div>
              </section>

              <section aria-labelledby="terapkan-heading" className="space-y-4">
                <div>
                  <h2
                    id="terapkan-heading"
                    className="font-display text-xl font-extrabold tracking-tight text-gray-900"
                  >
                    Terapkan saran di CV-mu
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 sm:text-base">
                    Klik teks yang disorot di pratinjau, atau buka daftar saran. Perubahan yang
                    diterapkan tersimpan otomatis ke CV.
                  </p>
                </div>
                <InlineCvEditor
                  cvData={cvData}
                  templateId={templateId}
                  suggestions={suggestions}
                  onApplySuggestion={handleApplySuggestion}
                  onApplyAll={handleApplyAllSuggestions}
                  onSave={handleSaveAndReturn}
                />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
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
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-[26rem] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
