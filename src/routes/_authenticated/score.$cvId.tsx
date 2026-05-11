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
import type { Database } from "@/integrations/supabase/types";
import { scoreCv } from "@/lib/ai-functions";
import { scoreCvLocally } from "@/lib/local-scoring";
import { CvPreview } from "@/components/cv/CvPreview";
import { TEMPLATES, type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import {
  ArrowLeft, Sparkles, Loader2, TrendingUp, CheckCircle2, AlertCircle,
  Lightbulb, FileText, BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/score/$cvId")({
  head: () => buildSeo({ title: "Skor CV — CV Pintar", description: "AI CV Scoring.", path: "/score", noindex: true }),
  component: CvScorePage,
});

interface ScoreResult {
  overallScore: number;
  breakdown: Record<string, number>;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

function CvScorePage() {
  const { cvId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("jakarta");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [prevScores, setPrevScores] = useState<Database["public"]["Tables"]["cv_scores"]["Row"][]>([]);

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase
        .from("cvs").select("*").eq("id", cvId).single();
      if (error) { toast.error(error.message); setLoading(false); return; }
      setCvTitle(row.title);
      setTemplateId(row.template_id as TemplateId);
      const d = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(d);
      setTargetRole(d.personal.headline || "");

      // Load previous scores
      const { data: scores } = await supabase
        .from("cv_scores")
        .select("*")
        .eq("cv_id", cvId)
        .order("created_at", { ascending: false });
      setPrevScores((scores ?? []) as typeof prevScores);

      setLoading(false);
    })();
  }, [cvId]);

  const handleScore = async () => {
    setScoring(true);
    setResult(null);
    try {
      // Coba AI scoring dulu
      const res = await scoreCv({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          jobDescription: jobDescription.trim() || undefined,
          targetRole: targetRole || undefined,
        },
      });
      setResult(res);

      // Reload scores
      const { data: scores } = await supabase
        .from("cv_scores")
        .select("*")
        .eq("cv_id", cvId)
        .order("created_at", { ascending: false });
      setPrevScores((scores ?? []) as typeof prevScores);

      toast.success("Skor CV berhasil dianalisis!");
    } catch (e: any) {
      console.warn("AI scoring gagal, fallback ke local scoring:", e.message);
      // Fallback: gunakan local/heuristic scoring jika AI gagal
      const localResult = scoreCvLocally(cvData, targetRole || undefined);
      setResult({
        overallScore: localResult.overallScore,
        breakdown: localResult.breakdown,
        summary: `Skor heuristik (AI tidak tersedia). ${localResult.strengths[0] || ""}`,
        strengths: localResult.strengths,
        weaknesses: localResult.weaknesses,
        suggestions: localResult.suggestions,
      });
      toast.warning("AI scoring tidak dapat diakses. Menggunakan skor heuristik.");
    } finally {
      setScoring(false);
    }
  };

  if (loading) return <div className="container-page py-10 text-sm text-muted-foreground">Memuat...</div>;

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/cv/$id" params={{ id: cvId }}><ArrowLeft className="h-4 w-4" /> Kembali ke Editor</Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">Skor CV: {cvTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analisis ATS-friendly AI untuk CV kamu.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Input + Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Deskripsi Pekerjaan (Opsional)
              </CardTitle>
              <CardDescription>
                Tempel deskripsi pekerjaan yang kamu incar untuk analisis yang lebih akurat.
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
                  placeholder="Tempel deskripsi pekerjaan / job description di sini..."
                  rows={6}
                  maxLength={10000}
                />
              </div>
              <Button onClick={handleScore} disabled={scoring} className="gap-2">
                {scoring ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Menganalisis CV...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Analisis CV dengan AI</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              {/* Overall Score */}
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold">Skor ATS</h2>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-5xl font-bold font-display ${
                          result.overallScore >= 80
                            ? "text-primary"
                            : result.overallScore >= 60
                              ? "text-warning"
                              : "text-destructive"
                        }`}
                      >
                        {result.overallScore}
                      </div>
                      <div className="text-xs text-muted-foreground">/100</div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    {Object.entries(result.breakdown).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-muted-foreground">
                            {key === "relevance" ? "Relevansi" :
                             key === "skills_match" ? "Kecocokan Skill" :
                             key === "experience" ? "Pengalaman" :
                             key === "format" ? "Format ATS" :
                             key === "keywords" ? "Keyword" : key}
                          </span>
                          <span className="font-medium">{val}%</span>
                        </div>
                        <Progress value={val} className="h-2" />
                      </div>
                    ))}
                  </div>
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
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary mt-0.5">•</span>
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
                      {result.weaknesses.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-destructive mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-info-foreground" /> Saran Perbaikan
                  </CardTitle>
                  <CardDescription>
                    Langkah actionable untuk meningkatkan skor CV kamu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm list-decimal list-inside">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="pl-1">{s}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Previous Scores */}
          {prevScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Riwayat Skor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prevScores.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <div>
                        <div className="text-sm font-medium">
                          Skor: <span className="font-bold">{s.overall_score}/100</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {s.job_description && (
                        <Badge variant="secondary" className="text-xs">+ Job Desc</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: CV Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Preview CV</h3>
            <div className="overflow-auto rounded-lg border border-border bg-muted/30 p-2">
              <div style={{ transform: "scale(0.45)", transformOrigin: "top left", width: "210mm" }}>
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
