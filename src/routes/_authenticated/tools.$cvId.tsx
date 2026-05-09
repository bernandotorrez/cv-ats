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
import { generateCoverLetter, extractKeywords } from "@/lib/ai-functions";
import type { CvData } from "@/lib/cv-types";
import { emptyCv } from "@/lib/cv-types";
import {
  ArrowLeft, Sparkles, Loader2, FileText, Key, Copy, Check,
  BookOpen, ListFilter,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools/$cvId")({
  head: () => buildSeo({ title: "AI Tools — CV ATS Indonesia", description: "Cover Letter & Keyword Extractor.", path: "/tools", noindex: true }),
  component: CvToolsPage,
});

function CvToolsPage() {
  const { cvId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");

  // Cover Letter state
  const [clJobDesc, setClJobDesc] = useState("");
  const [clCompany, setClCompany] = useState("");
  const [clPosition, setClPosition] = useState("");
  const [clResult, setClResult] = useState("");
  const [clLoading, setClLoading] = useState(false);

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
      if (error) { toast.error(error.message); setLoading(false); return; }
      setCvTitle(row.title);
      const d = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(d);
      setKwTargetRole(d.personal.headline || "");
      setClPosition(d.personal.headline || "");
      setLoading(false);
    })();
  }, [cvId]);

  // ─── Cover Letter ───────────────────────────────────────────────

  const handleGenerateCoverLetter = async () => {
    if (!clJobDesc.trim()) { toast.error("Deskripsi pekerjaan wajib diisi"); return; }
    setClLoading(true);
    try {
      const res = await generateCoverLetter({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          jobDescription: clJobDesc.trim(),
          companyName: clCompany.trim() || undefined,
          positionName: clPosition.trim() || undefined,
        },
      });
      setClResult(res.coverLetter);
      toast.success("Cover letter berhasil dibuat!");
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat cover letter");
    } finally {
      setClLoading(false);
    }
  };

  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(clResult);
      toast.success("Cover letter disalin ke clipboard!");
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  // ─── Keyword Extractor ──────────────────────────────────────────

  const handleExtractKeywords = async () => {
    if (!kwJobDesc.trim()) { toast.error("Deskripsi pekerjaan wajib diisi"); return; }
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

  if (loading) return <div className="container-page py-10 text-sm text-muted-foreground">Memuat...</div>;

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/cv/$id" params={{ id: cvId }}><ArrowLeft className="h-4 w-4" /> Kembali ke Editor</Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">AI Tools: {cvTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cover letter generator & keyword extractor untuk CV kamu.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ─── COVER LETTER GENERATOR ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" /> AI Cover Letter Generator
            </CardTitle>
            <CardDescription>
              Buat surat lamaran profesional otomatis dari CV + deskripsi pekerjaan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Perusahaan</Label>
              <Input
                value={clCompany}
                onChange={(e) => setClCompany(e.target.value)}
                placeholder="PT. Contoh Teknologi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Posisi yang Dilamar</Label>
              <Input
                value={clPosition}
                onChange={(e) => setClPosition(e.target.value)}
                placeholder="Frontend Developer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi Pekerjaan *</Label>
              <Textarea
                value={clJobDesc}
                onChange={(e) => setClJobDesc(e.target.value)}
                placeholder="Tempel deskripsi pekerjaan / job description di sini..."
                rows={6}
                maxLength={10000}
              />
            </div>
            <Button onClick={handleGenerateCoverLetter} disabled={clLoading} className="gap-2 w-full">
              {clLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Membuat Cover Letter...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Buat Cover Letter</>
              )}
            </Button>

            {clResult && (
              <div className="mt-4 space-y-3 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <Label>Hasil Cover Letter</Label>
                  <Button variant="ghost" size="sm" onClick={handleCopyCoverLetter} className="gap-1">
                    <Copy className="h-3 w-3" /> Salin
                  </Button>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans">{clResult}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── KEYWORD EXTRACTOR ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4 text-primary" /> Keyword Extractor
            </CardTitle>
            <CardDescription>
              Ekstrak keyword penting dari deskripsi pekerjaan untuk optimasi CV ATS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Target Posisi</Label>
              <Input
                value={kwTargetRole}
                onChange={(e) => setKwTargetRole(e.target.value)}
                placeholder="Frontend Developer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi Pekerjaan *</Label>
              <Textarea
                value={kwJobDesc}
                onChange={(e) => setKwJobDesc(e.target.value)}
                placeholder="Tempel deskripsi pekerjaan / job description di sini..."
                rows={6}
                maxLength={10000}
              />
            </div>
            <Button onClick={handleExtractKeywords} disabled={kwLoading} className="gap-2 w-full">
              {kwLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mengekstrak Keyword...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Ekstrak Keyword</>
              )}
            </Button>

            {kwResult && (
              <div className="mt-4 space-y-4 animate-in fade-in-50">
                {/* Summary */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm">{kwResult.keywordsSummary}</p>
                </div>

                {/* Hard Skills */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Hard Skills</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {kwResult.hardSkills.map((s, i) => (
                      <Badge key={i} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>

                {/* Soft Skills */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Soft Skills</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {kwResult.softSkills.map((s, i) => (
                      <Badge key={i} variant="outline">{s}</Badge>
                    ))}
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Kualifikasi</Label>
                  <ul className="mt-1 space-y-1 text-sm">
                    {kwResult.qualifications.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <ListFilter className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Verbs */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Action Verbs (untuk CV)</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {kwResult.actionVerbs.map((s, i) => (
                      <Badge key={i} variant="secondary" className="bg-info/50">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
