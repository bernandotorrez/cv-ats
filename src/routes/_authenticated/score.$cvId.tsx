import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Lightbulb,
  Loader2,
  Pencil,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CvPreview } from "@/components/cv/CvPreview";
import { HighlightedCvPreview } from "@/components/cv/HighlightedCvPreview";
import { SuggestionEditor } from "@/components/cv/SuggestionEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScorePageSkeleton } from "@/components/ui/skeleton-loading";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { scoreCv } from "@/lib/ai-functions";
import { TEMPLATES, emptyCv, type CvData, type TemplateId } from "@/lib/cv-types";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/score/$cvId")({
  head: () =>
    buildSeo({
      title: "Skor CV - CV Pintar",
      description:
        "Analisis skor CV berbasis AI untuk mengecek ATS, keyword, format, dan relevansi posisi.",
      path: "/score",
      noindex: true,
    }),
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

const scoreTips = [
  "Tambahkan target posisi agar AI membaca CV dengan konteks yang tepat.",
  "Tempel job description untuk mengecek keyword dan relevansi secara lebih tajam.",
  "Gunakan hasilnya sebagai checklist sebelum kirim lamaran.",
];

/**
 * Extract current text from suggestion for highlighting
 * Tries to find matching text in CV data
 */
function extractCurrentFromSuggestion(
  suggestion: string,
  cvData: CvData,
): string {
  // Common patterns in suggestions
  const patterns = [
    /"([^"]+)"/, // text in double quotes
    /'([^']+)'/, // text in single quotes
    /\"([^\"]+)\"/, // escaped quotes
  ];

  for (const pattern of patterns) {
    const match = suggestion.match(pattern);
    if (match && match[1]) {
      // Verify the match exists in CV data
      const text = match[1];
      const textLower = text.toLowerCase();

      if (
        cvData.personal.summary?.toLowerCase().includes(textLower) ||
        cvData.personal.headline?.toLowerCase().includes(textLower) ||
        cvData.experiences.some((e) => e.description?.toLowerCase().includes(textLower)) ||
        cvData.educations.some((e) => e.description?.toLowerCase().includes(textLower))
      ) {
        return text;
      }
    }
  }

  // Fallback: return empty string (no highlight)
  return "";
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
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [prevScores, setPrevScores] = useState<Database["public"]["Tables"]["cv_scores"]["Row"][]>(
    [],
  );
  const [showHighlights, setShowHighlights] = useState(true);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase.from("cvs").select("*").eq("id", cvId).single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setCvTitle(row.title);
      setTemplateId(row.template_id as TemplateId);
      const data = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(data);
      setTargetRole(data.personal.headline || "");

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
    setScoreError(null);

    try {
      const res = await scoreCv({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          jobDescription: jobDescription.trim() || undefined,
          targetRole: targetRole || undefined,
        },
      });

      setResult(res);

      const { data: scores } = await supabase
        .from("cv_scores")
        .select("*")
        .eq("cv_id", cvId)
        .order("created_at", { ascending: false });

      setPrevScores((scores ?? []) as typeof prevScores);
      toast.success("Skor CV berhasil dianalisis.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI scoring tidak tersedia";
      console.warn("AI scoring gagal:", message);
      setScoreError(message);
      toast.error(message);
    } finally {
      setScoring(false);
    }
  };

  if (loading) return <ScorePageSkeleton />;

  const templateName =
    TEMPLATES.find((template) => template.id === templateId)?.name ?? "Template CV";

  // Convert score suggestions to CV Review format for highlighting
  const highlightSuggestions = useMemo(() => {
    if (!result?.suggestions) return [];
    return result.suggestions.map((s, i) => ({
      priority: (i < 2 ? "high" : i < 4 ? "medium" : "low") as "high" | "medium" | "low",
      category: "Perbaikan",
      current: extractCurrentFromSuggestion(s, cvData),
      suggested: s,
      impact: "Meningkatkan kualitas CV",
    }));
  }, [result, cvData]);

  const handleApplySuggestion = useCallback(
    async (index: number, newText: string) => {
      const suggestion = highlightSuggestions[index];
      if (!suggestion) return;

      const updatedCvData = JSON.parse(JSON.stringify(cvData)); // Deep clone
      const suggestedLower = suggestion.suggested.toLowerCase();
      let applied = false;

      // Determine which section based on suggestion content
      const isSummary = suggestedLower.includes("summary") || suggestedLower.includes("ringkasan") || suggestedLower.includes("profil") || suggestedLower.includes("deskripsi diri");
      const isHeadline = suggestedLower.includes("headline") || suggestedLower.includes("judul") || suggestedLower.includes("posisi");
      const isExperience = suggestedLower.includes("experience") || suggestedLower.includes("pengalaman") || suggestedLower.includes("bullet") || suggestedLower.includes("kerja");

      if (isSummary) {
        updatedCvData.personal.summary = newText;
        applied = true;
      } else if (isHeadline) {
        updatedCvData.personal.headline = newText;
        applied = true;
      } else if (isExperience) {
        // Try to find matching experience by current text
        if (suggestion.current) {
          const currentLower = suggestion.current.toLowerCase();
          for (let i = 0; i < updatedCvData.experiences.length; i++) {
            if (updatedCvData.experiences[i].description?.toLowerCase().includes(currentLower)) {
              updatedCvData.experiences[i].description = newText;
              applied = true;
              break;
            }
          }
        }
        if (!applied && updatedCvData.experiences.length > 0) {
          updatedCvData.experiences[0].description = newText;
          applied = true;
        }
      } else {
        // Default: apply to summary
        updatedCvData.personal.summary = newText;
        applied = true;
      }

      // Update state
      setCvData(updatedCvData);
      setAppliedSuggestions((prev) => new Set([...prev, index]));

      // Save to database
      try {
        await supabase
          .from("cvs")
          .update({ data: updatedCvData })
          .eq("id", cvId);
      } catch (err) {
        console.warn("Gagal menyimpan ke database:", err);
      }

      toast.success(`Saran #${index + 1} berhasil diterapkan dan disimpan!`);
    },
    [cvData, cvId, highlightSuggestions],
  );

  const handleApplyAllSuggestions = useCallback(async () => {
    const updatedCvData = JSON.parse(JSON.stringify(cvData)); // Deep clone
    let appliedCount = 0;
    const newApplied = new Set(appliedSuggestions);

    highlightSuggestions.forEach((suggestion, index) => {
      if (newApplied.has(index)) return;

      const suggestedLower = suggestion.suggested.toLowerCase();
      let applied = false;

      const isSummary = suggestedLower.includes("summary") || suggestedLower.includes("ringkasan") || suggestedLower.includes("profil") || suggestedLower.includes("deskripsi diri");
      const isHeadline = suggestedLower.includes("headline") || suggestedLower.includes("judul") || suggestedLower.includes("posisi");
      const isExperience = suggestedLower.includes("experience") || suggestedLower.includes("pengalaman") || suggestedLower.includes("bullet") || suggestedLower.includes("kerja");

      if (isSummary) {
        updatedCvData.personal.summary = suggestion.suggested;
        applied = true;
      } else if (isHeadline) {
        updatedCvData.personal.headline = suggestion.suggested;
        applied = true;
      } else if (isExperience) {
        if (suggestion.current) {
          const currentLower = suggestion.current.toLowerCase();
          for (let i = 0; i < updatedCvData.experiences.length; i++) {
            if (updatedCvData.experiences[i].description?.toLowerCase().includes(currentLower)) {
              updatedCvData.experiences[i].description = suggestion.suggested;
              applied = true;
              break;
            }
          }
        }
        if (!applied && updatedCvData.experiences.length > 0) {
          updatedCvData.experiences[0].description = suggestion.suggested;
          applied = true;
        }
      } else {
        updatedCvData.personal.summary = suggestion.suggested;
        applied = true;
      }

      if (applied) {
        newApplied.add(index);
        appliedCount++;
      }
    });

    // Update state
    setCvData(updatedCvData);
    setAppliedSuggestions(newApplied);

    // Save to database
    try {
      await supabase
        .from("cvs")
        .update({ data: updatedCvData })
        .eq("id", cvId);
    } catch (err) {
      console.warn("Gagal menyimpan ke database:", err);
    }

    toast.success(`${appliedCount} saran berhasil diterapkan dan disimpan!`);
  }, [cvData, cvId, highlightSuggestions, appliedSuggestions]);

  return (
    <main className="container-page overflow-x-hidden py-6 sm:py-8 lg:py-10">
      <div className="mb-6">
        <BackButton />
      </div>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-stretch">
        <Card className="min-w-0 overflow-hidden border-border bg-card">
          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary-soft/80 to-transparent" />
            <div className="relative">
              <Badge className="gap-2 rounded-full px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI CV Score
              </Badge>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-5xl">
                Cari tahu seberapa siap CV kamu untuk ATS dan rekruter.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                Analisis format, keyword, pengalaman, dan relevansi posisi dalam satu tempat.
                Hasilnya dibuat praktis: apa yang sudah kuat, apa yang perlu diperbaiki, dan langkah
                berikutnya.
              </p>

              <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-3">
                {[
                  { icon: Target, label: "Target posisi", value: targetRole || "Belum diisi" },
                  { icon: FileText, label: "CV aktif", value: cvTitle || "CV kamu" },
                  { icon: ClipboardList, label: "Template", value: templateName },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="min-w-0 rounded-xl border border-border/80 bg-background/90 p-4"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-xs font-medium uppercase tracking-normal text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border bg-primary text-primary-foreground">
          <CardContent className="flex h-full flex-col justify-between p-5 sm:p-7">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">
                Skor bagus bukan tujuan akhir. Interview call itu tujuannya.
              </h2>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
                Pakai score ini untuk menyunting CV dengan lebih tenang: tambahkan bukti, rapikan
                struktur, dan cocokkan keyword dengan lowongan yang kamu incar.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {scoreTips.map((tip) => (
                <div key={tip} className="flex gap-3 text-sm leading-6">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="text-primary-foreground/85">{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-6">
          <Card className="min-w-0 border-border bg-card">
            <CardHeader className="pb-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Badge variant="secondary" className="rounded-full">
                    Input analisis
                  </Badge>
                  <CardTitle className="mt-3 text-wrap font-display text-xl sm:text-2xl">
                    Beri konteks agar skor lebih tajam
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-2xl leading-6">
                    Job description opsional, tapi sangat membantu untuk membaca relevansi skill,
                    keyword, dan pengalaman.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleScore}
                  disabled={scoring}
                  className="h-11 w-full shrink-0 rounded-lg sm:w-auto"
                >
                  {scoring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menganalisis
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analisis CV
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="target-role">Target posisi</Label>
                <Input
                  id="target-role"
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Contoh: Frontend Developer, HR Generalist, Sales Manager"
                  className="h-11 w-full min-w-0 rounded-lg"
                />
              </div>
              <div className="grid min-w-0 gap-2">
                <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
                  <Label htmlFor="job-description">Deskripsi pekerjaan</Label>
                  <span className="text-xs text-muted-foreground">
                    {jobDescription.length}/10.000
                  </span>
                </div>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Tempel job description di sini. AI akan membaca keyword, tanggung jawab utama, dan sinyal kompetensi yang perlu muncul di CV."
                  rows={7}
                  maxLength={10000}
                  className="w-full min-w-0 rounded-lg text-sm leading-6"
                />
              </div>
            </CardContent>
          </Card>

          {result ? (
            <ScoreResultPanel result={result} />
          ) : scoreError ? (
            <Card className="border-destructive/35 bg-destructive/5">
              <CardContent className="p-6 text-center sm:p-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-background text-destructive">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
                  AI scoring gagal.
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  {scoreError}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border bg-muted/30">
              <CardContent className="p-6 text-center sm:p-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-background text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold">Skor akan muncul di sini.</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Klik tombol analisis setelah target posisi siap. Dalam beberapa detik kamu akan
                  dapat ringkasan, breakdown skor, dan prioritas perbaikan.
                </p>
              </CardContent>
            </Card>
          )}

          {prevScores.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Riwayat skor
                </CardTitle>
                <CardDescription>
                  Bandingkan progres CV kamu setelah setiap perbaikan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prevScores.slice(0, 5).map((score) => (
                    <div
                      key={score.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-2xl font-bold">
                            {score.overall_score}
                          </span>
                          <span className="text-sm text-muted-foreground">/100</span>
                          {score.job_description && (
                            <Badge variant="secondary" className="rounded-full">
                              + Job desc
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(score.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Progress value={score.overall_score ?? 0} className="h-2 w-full sm:w-40" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <Card className="min-w-0 overflow-hidden border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="rounded-full">
                    Preview CV
                  </Badge>
                  <CardTitle className="mt-3 font-display text-xl">
                    Lihat dokumen yang sedang dinilai
                  </CardTitle>
                </div>
                <Button asChild variant="outline" size="icon" className="rounded-lg">
                  <Link to="/cv/$id" params={{ id: cvId }} aria-label="Edit CV">
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[620px] max-w-full overflow-hidden rounded-xl border border-border bg-muted/30 p-2 sm:overflow-auto">
                <div
                  style={{
                    transform: "scale(0.45)",
                    transformOrigin: "top left",
                    width: "min(210mm, 222%)",
                  }}
                >
                  <HighlightedCvPreview
                    data={cvData}
                    template={templateId}
                    suggestions={highlightSuggestions}
                    activeSuggestionIndex={activeSuggestionIndex}
                    onSuggestionClick={(index) => {
                      setActiveSuggestionIndex(index);
                      setShowEditor(true);
                    }}
                    showHighlights={showHighlights && result !== null}
                    onToggleHighlights={() => setShowHighlights(!showHighlights)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 rounded-lg">
                  <Link to="/cv/$id" params={{ id: cvId }}>
                    Edit CV
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {highlightSuggestions.length > 0 && result && (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowEditor(!showEditor)}
                  >
                    <Sparkles className="h-4 w-4" />
                    {showEditor ? "Tutup Editor" : "Buka Editor"}
                  </Button>
                )}
              </div>

              {/* Suggestion Editor */}
              {showEditor && highlightSuggestions.length > 0 && (
                <SuggestionEditor
                  suggestions={highlightSuggestions}
                  highlightRegions={[]}
                  activeHighlight={activeSuggestionIndex}
                  onHighlightClick={setActiveSuggestionIndex}
                  onApplySuggestion={handleApplySuggestion}
                  onApplyAll={handleApplyAllSuggestions}
                  onClose={() => setShowEditor(false)}
                />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function ScoreResultPanel({ result }: { result: ScoreResult }) {
  const tone = getScoreTone(result.overallScore);

  return (
    <div className="animate-in fade-in-50 duration-300">
      <Card className="overflow-hidden border-primary/20 bg-card">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-border bg-background p-5 text-center">
              <p className="text-sm font-medium text-muted-foreground">Skor kesiapan</p>
              <div className={`mt-3 font-display text-6xl font-bold ${tone.text}`}>
                {result.overallScore}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">dari 100</p>
              <Badge className={`mt-4 rounded-full ${tone.badge}`}>{tone.label}</Badge>
            </div>

            <div>
              <Badge variant="secondary" className="rounded-full">
                Hasil analisis
              </Badge>
              <h2 className="mt-3 font-display text-2xl font-bold">{tone.headline}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.summary}</p>

              <div className="mt-6 grid gap-3">
                {Object.entries(result.breakdown).map(([key, rawValue]) => {
                  // Normalize legacy or varying AI scores (supports 0-1 ratio, 0-10 scale, and 0-100 scale)
                  let value = rawValue;
                  if (result.overallScore > 15) {
                    if (rawValue <= 1) {
                      value = rawValue * 100;
                    } else if (rawValue <= 10) {
                      value = rawValue * 10;
                    }
                  }
                  return (
                    <div key={key} className="rounded-xl border border-border/70 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">
                          {formatBreakdownLabel(key)}
                        </span>
                        <span className="font-semibold">{value}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InsightCard
          icon={CheckCircle2}
          title="Yang sudah kuat"
          description="Pertahankan bagian ini karena sudah membantu CV terlihat relevan."
          items={result.strengths}
          tone="positive"
        />
        <InsightCard
          icon={AlertCircle}
          title="Yang perlu ditingkatkan"
          description="Perbaiki bagian ini dulu karena biasanya paling berdampak ke skor."
          items={result.weaknesses}
          tone="negative"
        />
      </div>

      <Card className="mt-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Lightbulb className="h-5 w-5 text-primary" />
            Quick wins perbaikan
          </CardTitle>
          <CardDescription>
            Langkah praktis yang bisa kamu eksekusi sebelum mengirim lamaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3">
            {result.suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className="flex gap-3 rounded-xl border border-border/70 bg-background p-4 text-sm leading-6"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{suggestion}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  description,
  items,
  tone,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <Icon
            className={tone === "positive" ? "h-5 w-5 text-primary" : "h-5 w-5 text-destructive"}
          />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6">
              <span
                className={
                  tone === "positive"
                    ? "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
                }
              />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function formatBreakdownLabel(key: string) {
  const labels: Record<string, string> = {
    relevance: "Relevansi posisi",
    skills_match: "Kecocokan skill",
    experience: "Kekuatan pengalaman",
    format: "Format ATS",
    keywords: "Keyword penting",
  };

  return labels[key] ?? key.replaceAll("_", " ");
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      label: "Siap dikirim",
      headline: "CV kamu sudah punya fondasi yang kuat.",
      text: "text-primary",
      badge: "bg-primary text-primary-foreground",
    };
  }

  if (score >= 60) {
    return {
      label: "Hampir siap",
      headline: "CV kamu sudah cukup baik, tinggal dibuat lebih tajam.",
      text: "text-amber-600",
      badge: "bg-amber-100 text-amber-900 hover:bg-amber-100",
    };
  }

  return {
    label: "Perlu dirapikan",
    headline: "CV kamu butuh beberapa perbaikan sebelum dikirim.",
    text: "text-destructive",
    badge: "bg-destructive text-destructive-foreground",
  };
}
