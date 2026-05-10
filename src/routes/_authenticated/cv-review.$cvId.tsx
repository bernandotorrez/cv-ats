import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getUserTierConfig } from "@/lib/subscription";
import { reviewCv, type CvReviewResult } from "@/lib/ai-functions";
import { CvPreview } from "@/components/cv/CvPreview";
import { TEMPLATES, type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  Brain,
  Star,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Shield,
  User,
  Sparkles,
  History,
  ChevronRight,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cv-review/$cvId")({
  head: () =>
    buildSeo({
      title: "CV Review HR — CV ATS Indonesia",
      description: "Review CV oleh AI HR profesional.",
      path: "/cv-review",
      noindex: true,
    }),
  component: CvReviewPage,
});

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
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;

      const config = await getUserTierConfig(user.id);
      if (!config.enableCvReview) {
        setLoading(false);
        return;
      }
      setTierOk(true);

      const { data: row, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("id", cvId)
        .single();
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      setCvTitle(row.title);
      setTemplateId(row.template_id as TemplateId);
      const d = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(d);
      setTargetRole(d.personal.headline || "");

      // Load review history
      await loadHistory();
      setLoading(false);
    })();
  }, [cvId, user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    const { data, error } = await (supabase as any)
      .from("cv_reviews")
      .select("id, target_role, overall_score, created_at")
      .eq("user_id", user.id)
      .eq("cv_id", cvId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setReviewHistory(data);
    }
  };

  const loadReviewDetail = async (reviewId: string) => {
    const { data, error } = await (supabase as any)
      .from("cv_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();
    if (!error && data) {
      // Reconstruct CvReviewResult from DB row
      const restored: CvReviewResult = {
        success: true,
        review: {
          reviewer: { name: "", title: "", experience: "" },
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
          industryBenchmark: data.industry_benchmark ?? { level: "", comparison: "", percentile: "" },
          hrVerdict: data.hr_verdict ?? { verdict: "", reason: "", nextSteps: [] },
          quickWins: data.quick_wins ?? [],
        },
        tier: "",
        isHrPersona: true,
      };
      setResult(restored);
      setSelectedHistoryId(reviewId);
      setShowHistory(false);
      toast.success("Melihat review sebelumnya");
    }
  };

  const saveReviewResult = async (res: CvReviewResult) => {
    if (!user?.id) return;
    const { error } = await (supabase as any)
      .from("cv_reviews")
      .insert({
        user_id: user.id,
        cv_id: cvId,
        target_role: targetRole || null,
        job_description: jobDescription.trim() || null,
        overall_score: res.review.scores.overall,
        scores: res.review.scores,
        strengths: res.review.strengths,
        weaknesses: res.review.weaknesses,
        suggestions: res.review.suggestions,
        industry_benchmark: res.review.industryBenchmark,
        hr_verdict: res.review.hrVerdict,
        quick_wins: res.review.quickWins,
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
      const res = await reviewCv({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription.trim() || undefined,
        },
      });
      setResult(res);
      await saveReviewResult(res);
      toast.success("Review CV berhasil!");
    } catch (e: any) {
      toast.error(e.message || "Gagal mereview CV");
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-20 text-center text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }

  if (!tierOk) {
    return (
      <div className="container-page py-20">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="py-12 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/20 mx-auto">
              <Shield className="h-7 w-7 text-warning" />
            </div>
            <h2 className="font-display text-xl font-bold">
              Fitur CV Review HR
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Fitur ini hanya tersedia untuk paket Starter ke atas. Dapatkan
              review CV dari AI HR profesional dengan pengalaman 20+ tahun.
            </p>
            <Button asChild className="gap-1.5">
              <Link to="/harga">
                <Zap className="h-4 w-4" /> Upgrade ke Starter — Rp 19.000/bln
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreColor = (s: number) =>
    s >= 80 ? "text-primary" : s >= 60 ? "text-warning" : "text-destructive";

  return (
    <div className="container-page py-8 md:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/cv/$id" params={{ id: cvId }}>
              <ArrowLeft className="h-4 w-4" /> Kembali ke Editor
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            CV Review HR: {cvTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Direview oleh AI dengan persona HR profesional berpengalaman 20+
            tahun.
          </p>
        </div>
        {reviewHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
            Riwayat Review ({reviewHistory.length})
          </Button>
        )}
      </div>

      {/* History Panel */}
      {showHistory && reviewHistory.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" /> Riwayat Review CV Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-1">
              {reviewHistory.map((h: any) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => loadReviewDetail(h.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors",
                    selectedHistoryId === h.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {h.target_role || "Tanpa target"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        scoreColor(h.overall_score),
                      )}
                    >
                      {h.overall_score}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Input + Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Target & Deskripsi Pekerjaan
              </CardTitle>
              <CardDescription>
                Makin detail deskripsi pekerjaan, makin akurat review-nya.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Target Posisi</Label>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Contoh: Frontend Developer"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi Pekerjaan</Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Tempel deskripsi pekerjaan di sini..."
                  rows={5}
                  maxLength={10000}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={handleReview}
                  disabled={reviewing}
                  size="lg"
                  className="gap-2"
                >
                  {reviewing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Menganalisis CV...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" /> Review CV dengan AI HR
                    </>
                  )}
                </Button>
                {selectedHistoryId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResult(null);
                      setSelectedHistoryId(null);
                    }}
                    className="gap-1.5 text-xs"
                  >
                    + Review Baru
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* History badge */}
              {selectedHistoryId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Menampilkan review sebelumnya</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => {
                      setResult(null);
                      setSelectedHistoryId(null);
                    }}
                  >
                    Tutup
                  </Button>
                </div>
              )}

              {/* Reviewer Card */}
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">
                      {result.review.reviewer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {result.review.reviewer.title} ·{" "}
                      {result.review.reviewer.experience}
                    </p>
                  </div>
                  <div className="ml-auto text-center">
                    <div
                      className={cn(
                        "text-5xl font-bold font-display",
                        scoreColor(result.review.scores.overall),
                      )}
                    >
                      {result.review.scores.overall}
                    </div>
                    <div className="text-xs text-muted-foreground">/100</div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />{" "}
                    Breakdown Skor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      label: "First Impression",
                      key: "firstImpression" as const,
                    },
                    { label: "Format ATS", key: "format" as const },
                    { label: "Konten & Relevansi", key: "content" as const },
                    {
                      label: "Pencapaian",
                      key: "achievement" as const,
                    },
                    {
                      label: "Presentasi & Writing",
                      key: "presentation" as const,
                    },
                  ].map((item) => (
                    <div key={item.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="font-medium">
                          {result.review.scores[item.key]}%
                        </span>
                      </div>
                      <Progress
                        value={result.review.scores[item.key]}
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Kekuatan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {result.review.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary mt-0.5 shrink-0">
                            •
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" /> Perlu Ditingkatkan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {result.review.weaknesses.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-destructive mt-0.5 shrink-0">
                            •
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Actionable Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-warning" /> Saran
                    Perbaikan Spesifik
                  </CardTitle>
                  <CardDescription>
                    Rekomendasi konkret dengan contoh before/after.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.review.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px]",
                            s.priority === "high"
                              ? "bg-destructive/10 text-destructive"
                              : s.priority === "medium"
                                ? "bg-warning/10 text-warning"
                                : "bg-muted-foreground/10 text-muted-foreground",
                          )}
                        >
                          {s.priority === "high"
                            ? "Prioritas Tinggi"
                            : s.priority === "medium"
                              ? "Prioritas Sedang"
                              : "Prioritas Rendah"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {s.category}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Saat ini:
                          </span>
                          <p className="text-destructive/80 line-through decoration-destructive/30">
                            {s.current}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-primary font-medium">
                            Rekomendasi:
                          </span>
                          <p className="text-primary font-medium">
                            {s.suggested}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          Dampak: {s.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Industry Benchmark */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-warning" /> Benchmark
                    Industri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-sm font-semibold capitalize">
                        {result.review.industryBenchmark.level}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Percentile
                      </p>
                      <p className="text-sm font-semibold">
                        {result.review.industryBenchmark.percentile}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Perbandingan
                      </p>
                      <p className="text-sm font-semibold">
                        {result.review.industryBenchmark.comparison}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* HR Verdict */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" /> Verdict HR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {result.review.hrVerdict.verdict}
                    </Badge>
                  </div>
                  <p className="text-sm">{result.review.hrVerdict.reason}</p>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Langkah Selanjutnya:
                    </p>
                    <ul className="space-y-1 text-sm">
                      {result.review.hrVerdict.nextSteps.map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Wins */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-warning" /> Quick Wins
                  </CardTitle>
                  <CardDescription>
                    Perbaikan kecil dengan dampak besar — bisa dilakukan
                    sekarang.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {result.review.quickWins.map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <Sparkles className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right: CV Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Preview CV
            </h3>
            <div className="overflow-auto rounded-lg border border-border bg-muted/30 p-2 max-h-[70vh]">
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
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/cv/$id" params={{ id: cvId }}>
                <ArrowLeft className="h-4 w-4" /> Edit CV
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
