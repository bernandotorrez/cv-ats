import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { extractKeywords } from "@/lib/ai-functions";
import type { CvData } from "@/lib/cv-types";
import { emptyCv } from "@/lib/cv-types";
import {
  ArrowLeft, Sparkles, Loader2, Key, ListFilter, RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools/keyword/$cvId")({
  head: () => buildSeo({ 
    title: "Keyword Extractor — CV ATS Indonesia", 
    description: "Ekstrak keyword penting dari job description untuk optimasi CV ATS.", 
    path: "/tools/keyword-extractor", 
    noindex: true 
  }),
  component: KeywordExtractorPage,
});

function KeywordExtractorPage() {
  const { cvId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");

  // Keyword state
  const [kwJobDesc, setKwJobDesc] = useState("");
  const [kwTargetRole, setKwTargetRole] = useState("");
  const [kwResult, setKwResult] = useState<{
    hardSkills: string[];
    softSkills: string[];
    qualifications: string[];
    actionVerbs: string[];
    keywordsSummary: string;
  } | null>(null);
  const [kwLoading, setKwLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase
        .from("cvs").select("*").eq("id", cvId).single();
      if (error) { 
        toast.error(error.message); 
        setLoading(false); 
        return; 
      }
      setCvTitle(row.title);
      const d = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(d);
      setKwTargetRole(d.personal.headline || "");
      setLoading(false);
    })();
  }, [cvId]);

  const handleExtractKeywords = async () => {
    if (!kwJobDesc.trim()) { 
      toast.error("Deskripsi pekerjaan wajib diisi"); 
      return; 
    }
    setKwLoading(true);
    try {
      const res = await extractKeywords({
        data: {
          jobDescription: kwJobDesc.trim(),
          targetRole: kwTargetRole.trim() || undefined,
        },
      });
      setKwResult(res);
      toast.success("Keyword berhasil diekstrak!");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengekstrak keyword");
    } finally {
      setKwLoading(false);
    }
  };

  const handleReset = () => {
    setKwJobDesc("");
    setKwResult(null);
  };

  if (loading) {
    return (
      <div className="container-page py-10 text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/tools" search={{ cvId }}>
            <ArrowLeft className="h-4 w-4" /> Kembali ke Tools
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Keyword Extractor
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ekstrak keyword penting dari job description untuk optimasi CV ATS — {cvTitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Input Job Description</CardTitle>
            <CardDescription>
              Masukkan deskripsi pekerjaan untuk mengekstrak keyword yang relevan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="targetRole">Target Posisi</Label>
              <Input
                id="targetRole"
                value={kwTargetRole}
                onChange={(e) => setKwTargetRole(e.target.value)}
                placeholder="Frontend Developer"
              />
              <p className="text-xs text-muted-foreground">
                Opsional: Posisi yang kamu targetkan
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobDesc">Deskripsi Pekerjaan *</Label>
              <Textarea
                id="jobDesc"
                value={kwJobDesc}
                onChange={(e) => setKwJobDesc(e.target.value)}
                placeholder="Tempel deskripsi pekerjaan / job description di sini...&#10;&#10;Contoh:&#10;- Requirements: 3+ years experience in React&#10;- Strong knowledge of TypeScript&#10;- Experience with REST APIs&#10;- Excellent communication skills"
                rows={12}
                maxLength={10000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {kwJobDesc.length}/10000 karakter
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleExtractKeywords} 
                disabled={kwLoading || !kwJobDesc.trim()} 
                className="gap-2 flex-1"
              >
                {kwLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 
                    Mengekstrak...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> 
                    Ekstrak Keyword
                  </>
                )}
              </Button>
              {kwResult && (
                <Button 
                  onClick={handleReset} 
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hasil Ekstraksi</CardTitle>
            <CardDescription>
              Keyword yang diekstrak dari job description
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!kwResult ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Key className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Masukkan job description dan klik "Ekstrak Keyword" untuk melihat hasil
                </p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in-50">
                {/* Summary */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm leading-relaxed">{kwResult.keywordsSummary}</p>
                </div>

                {/* Hard Skills */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-semibold mb-2 block">
                    Hard Skills ({kwResult.hardSkills.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {kwResult.hardSkills.length > 0 ? (
                      kwResult.hardSkills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Tidak ada hard skills ditemukan</p>
                    )}
                  </div>
                </div>

                {/* Soft Skills */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-semibold mb-2 block">
                    Soft Skills ({kwResult.softSkills.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {kwResult.softSkills.length > 0 ? (
                      kwResult.softSkills.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Tidak ada soft skills ditemukan</p>
                    )}
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-semibold mb-2 block">
                    Kualifikasi ({kwResult.qualifications.length})
                  </Label>
                  {kwResult.qualifications.length > 0 ? (
                    <ul className="space-y-2">
                      {kwResult.qualifications.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <ListFilter className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tidak ada kualifikasi ditemukan</p>
                  )}
                </div>

                {/* Action Verbs */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-semibold mb-2 block">
                    Action Verbs untuk CV ({kwResult.actionVerbs.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {kwResult.actionVerbs.length > 0 ? (
                      kwResult.actionVerbs.map((s, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Tidak ada action verbs ditemukan</p>
                    )}
                  </div>
                </div>

                {/* Tips */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mt-6">
                  <p className="text-xs font-semibold text-primary mb-2">💡 Tips Penggunaan:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Masukkan keyword ini ke dalam CV kamu untuk meningkatkan ATS score</li>
                    <li>• Gunakan action verbs di bagian pengalaman kerja</li>
                    <li>• Sesuaikan hard skills dengan keahlian yang kamu miliki</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
