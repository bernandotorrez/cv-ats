import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
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
  X,
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
  const [showSummary, setShowSummary] = useState(false);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800";
    if (score >= 60) return "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800";
    return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800";
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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

      const replaceBulletPoint = (description: string, bulletIdx: number, newBulletText: string): string => {
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

      const setValueByPath = (obj: any, path: string, value: string, bulletIdx?: number | null): boolean => {
        try {
          const match = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
          if (match) {
            const [, arrayName, indexStr, field] = match;
            const idx = parseInt(indexStr);
            if (obj[arrayName] && obj[arrayName][idx]) {
              if (bulletIdx !== null && bulletIdx !== undefined && field === "description") {
                obj[arrayName][idx][field] = replaceBulletPoint(obj[arrayName][idx][field] || "", bulletIdx, value);
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
                updatedCvData.experiences[i].description = replaceBulletPoint(desc, bulletIndex, newText);
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
        const isSummary = categoryLower.includes("summary") || categoryLower.includes("ringkasan") || categoryLower.includes("content");
        const isExperience = categoryLower.includes("experience") || categoryLower.includes("pengalaman") || categoryLower.includes("achievement");
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
                  updatedCvData.experiences[i].description = replaceBulletPoint(exp.description || "", bulletIndex, newText);
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
              updatedCvData.experiences[0].description = replaceBulletPoint(updatedCvData.experiences[0].description || "", bulletIndex, newText);
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
        await supabase
          .from("cvs")
          .update({ data: updatedCvData })
          .eq("id", cvId);
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

    const replaceBulletPoint = (description: string, bulletIdx: number, newBulletText: string): string => {
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

    const setValueByPath = (obj: any, path: string, value: string, bulletIdx?: number | null): boolean => {
      try {
        const match = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
        if (match) {
          const [, arrayName, indexStr, field] = match;
          const idx = parseInt(indexStr);
          if (obj[arrayName] && obj[arrayName][idx]) {
            if (bulletIdx !== null && bulletIdx !== undefined && field === "description") {
              obj[arrayName][idx][field] = replaceBulletPoint(obj[arrayName][idx][field] || "", bulletIdx, value);
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
                updatedCvData.experiences[i].description = replaceBulletPoint(desc, bulletIndex, suggestion.suggested);
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
        const isSummary = categoryLower.includes("summary") || categoryLower.includes("ringkasan") || categoryLower.includes("content");
        const isExperience = categoryLower.includes("experience") || categoryLower.includes("pengalaman") || categoryLower.includes("achievement");
        const isHeadline = categoryLower.includes("headline") || categoryLower.includes("judul");

        if (isSummary) {
          updatedCvData.personal.summary = suggestion.suggested;
          applied = true;
        } else if (isHeadline) {
          updatedCvData.personal.headline = suggestion.suggested;
          applied = true;
        } else if (isExperience && updatedCvData.experiences.length > 0) {
          if (bulletIndex !== null && bulletIndex !== undefined) {
            updatedCvData.experiences[0].description = replaceBulletPoint(updatedCvData.experiences[0].description || "", bulletIndex, suggestion.suggested);
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
      await supabase
        .from("cvs")
        .update({ data: updatedCvData })
        .eq("id", cvId);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">
                AI CV Review
              </h1>
              <p className="text-xs text-muted-foreground">{cvTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {phase === "result" && result && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSummary(!showSummary)}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {showSummary ? "Tutup Summary" : "Lihat Summary"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhase("input");
                    setResult(null);
                    setSelectedHistoryId(null);
                  }}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Review Baru
                </Button>
              </>
            )}
            {reviewHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Riwayat ({reviewHistory.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && reviewHistory.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b bg-muted/30"
          >
            <div className="container-page py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Riwayat Review</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {reviewHistory.map((history) => (
                  <button
                    key={history.id}
                    onClick={() => loadReviewDetail(history.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all hover:border-primary/40 hover:bg-primary/5 shrink-0",
                      selectedHistoryId === history.id && "border-primary bg-primary/5"
                    )}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">{history.target_role || "Tanpa target"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(history.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={cn("font-bold text-lg", scoreColor(history.overall_score))}>
                      {history.overall_score}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {phase === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container-page py-8"
          >
            <div className="mx-auto max-w-2xl">
              {/* Hero section */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                  Review CV oleh HR Expert AI
                </h2>
                <p className="text-muted-foreground">
                  Dapatkan analisis mendalam dari AI HR dengan pengalaman 20+ tahun
                </p>
              </div>

              {/* Input form */}
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  {/* HR Persona */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shrink-0">
                      <span className="text-lg font-bold text-white">HA</span>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-400">Hira AI</p>
                      <p className="text-sm text-amber-700 dark:text-amber-500">Senior HR Consultant • 20+ tahun</p>
                    </div>
                  </div>

                  {/* Target Role */}
                  <div className="space-y-2">
                    <Label htmlFor="target-role" className="text-sm font-medium">
                      Target Posisi <span className="text-muted-foreground">(opsional)</span>
                    </Label>
                    <input
                      id="target-role"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Contoh: Frontend Developer, Marketing Manager"
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  {/* Job Description */}
                  <div className="space-y-2">
                    <Label htmlFor="job-description" className="text-sm font-medium">
                      Deskripsi Pekerjaan <span className="text-muted-foreground">(opsional)</span>
                    </Label>
                    <Textarea
                      id="job-description"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Tempel job description di sini untuk analisis yang lebih akurat..."
                      rows={5}
                      maxLength={10000}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Menambahkan job description membantu AI mengecek relevansi CV dengan posisi target
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleReview}
                    size="lg"
                    className="w-full gap-2 h-12 text-base"
                  >
                    <Brain className="h-5 w-5" />
                    Mulai Review CV
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Proses analisis membutuhkan waktu 10-30 detik
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CvScannerAnimation cvTitle={cvTitle} />
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-4"
          >
            {/* Summary Panel */}
            <AnimatePresence>
              {showSummary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Score */}
                        <div className={cn("rounded-xl border-2 p-4 text-center", scoreBg(result.review.scores.overall))}>
                          <p className="text-sm text-muted-foreground mb-1">Skor Keseluruhan</p>
                          <p className={cn("text-5xl font-bold", scoreColor(result.review.scores.overall))}>
                            {result.review.scores.overall}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">/100</p>
                        </div>

                        {/* Verdict */}
                        <div className="rounded-xl border-2 p-4">
                          <p className="text-sm text-muted-foreground mb-2">Verdict HR</p>
                          <Badge className="bg-primary text-primary-foreground">
                            {result.review.hrVerdict.verdict}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {result.review.hrVerdict.reason}
                          </p>
                        </div>

                        {/* Strengths */}
                        <div className="rounded-xl border-2 p-4">
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Kekuatan
                          </p>
                          <ul className="space-y-1">
                            {result.review.strengths.slice(0, 2).map((s, i) => (
                              <li key={i} className="text-xs line-clamp-1">{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="rounded-xl border-2 p-4">
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            Perlu Diperbaiki
                          </p>
                          <ul className="space-y-1">
                            {result.review.weaknesses.slice(0, 2).map((w, i) => (
                              <li key={i} className="text-xs line-clamp-1">{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Score breakdown */}
                      <div className="mt-6 grid grid-cols-5 gap-3">
                        {[
                          { label: "First Impression", value: result.review.scores.firstImpression },
                          { label: "Format ATS", value: result.review.scores.format },
                          { label: "Konten", value: result.review.scores.content },
                          { label: "Pencapaian", value: result.review.scores.achievement },
                          { label: "Presentasi", value: result.review.scores.presentation },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <div className="relative h-16 w-16 mx-auto mb-2">
                              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-muted"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  className={item.value >= 80 ? "text-emerald-500" : item.value >= 60 ? "text-amber-500" : "text-red-500"}
                                  strokeWidth="3"
                                  strokeDasharray={`${item.value}, 100`}
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                {item.value}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline CV Editor - side-by-side */}
            <InlineCvEditor
              cvData={cvData}
              templateId={templateId}
              suggestions={suggestions}
              onApplySuggestion={handleApplySuggestion}
              onApplyAll={handleApplyAllSuggestions}
              onSave={handleSaveAndReturn}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CvReviewSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container-page py-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-4" />
          <Skeleton className="h-10 w-64 mx-auto mb-2" />
          <Skeleton className="h-6 w-80 mx-auto mb-8" />
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
