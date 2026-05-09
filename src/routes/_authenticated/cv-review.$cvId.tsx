import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
      setLoading(false);
    })();
  }, [cvId, user?.id]);

  const handleReview = async () => {
    setReviewing(true);
    setResult(null);
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
      </div>

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
              <Button
                onClick={handleReview}
                disabled={reviewing}
                size="lg"
                className="gap-2 w-full sm:w-auto"
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
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6">
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
