import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { generateCoverLetter } from "@/lib/ai-functions";
import type { CvData } from "@/lib/cv-types";
import { emptyCv } from "@/lib/cv-types";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  BookOpen,
  Download,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools/cover-letter/$cvId")({
  head: () =>
    buildSeo({
      title: "Cover Letter Generator — CV ATS Indonesia",
      description: "Buat surat lamaran profesional dengan AI.",
      path: "/tools/cover-letter",
      noindex: true,
    }),
  component: CoverLetterPage,
});

function CoverLetterPage() {
  const { cvId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");

  const [jobDesc, setJobDesc] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
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
      const d = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(d);
      setPosition(d.personal.headline || "");
      setLoading(false);
    })();
  }, [cvId]);

  const handleGenerate = async () => {
    if (!jobDesc.trim()) {
      toast.error("Deskripsi pekerjaan wajib diisi");
      return;
    }
    setGenerating(true);
    try {
      const res = await generateCoverLetter({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          jobDescription: jobDesc.trim(),
          companyName: company.trim() || undefined,
          positionName: position.trim() || undefined,
        },
      });
      setResult(res.coverLetter);
      toast.success("Cover letter berhasil dibuat!");
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat cover letter");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success("Cover letter disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${cvTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Cover letter berhasil didownload!");
  };

  const handleReset = () => {
    setJobDesc("");
    setCompany("");
    setPosition(cvData.personal.headline || "");
    setResult("");
  };

  if (loading)
    return (
      <div className="container-page py-10 text-sm text-muted-foreground">
        Memuat...
      </div>
    );

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools" search={{ cvId }}>
            <ArrowLeft className="h-4 w-4" /> Kembali ke AI Tools
          </Link>
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Cover Letter Generator
            </h1>
            <p className="text-sm text-muted-foreground">
              CV: {cvTitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Lamaran</CardTitle>
            <CardDescription>
              Isi informasi pekerjaan yang kamu lamar untuk generate cover letter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Nama Perusahaan</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="PT. Contoh Teknologi Indonesia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Posisi yang Dilamar</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Frontend Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobdesc">
                Deskripsi Pekerjaan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="jobdesc"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste job description lengkap di sini...&#10;&#10;Contoh:&#10;- Requirements: Bachelor degree in Computer Science&#10;- Experience: 2+ years in React development&#10;- Skills: JavaScript, TypeScript, React, Node.js&#10;- Responsibilities: Develop and maintain web applications..."
                rows={12}
                maxLength={10000}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {jobDesc.length}/10,000 karakter
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generating || !jobDesc.trim()}
                className="flex-1 gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat Cover Letter...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
              {result && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Reset Form"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Hasil Cover Letter</CardTitle>
                <CardDescription>
                  Review dan edit sebelum digunakan
                </CardDescription>
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1"
                  >
                    {copied ? (
                      <>
                        <Copy className="h-3 w-3" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Salin
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Belum Ada Hasil</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Isi form di sebelah kiri dan klik "Generate Cover Letter" untuk
                  membuat surat lamaran otomatis dengan AI.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-6 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                    {result}
                  </pre>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tips:</strong> Review dan sesuaikan cover letter dengan
                    gaya bahasa kamu. Pastikan informasi personal dan kontak sudah
                    benar sebelum dikirim.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
