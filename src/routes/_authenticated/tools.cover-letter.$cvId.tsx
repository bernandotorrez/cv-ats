import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { CoverLetterPreview } from "@/components/cv/CoverLetterPreview";
import type { CvData } from "@/lib/cv-types";
import { emptyCv } from "@/lib/cv-types";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  BookOpen,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools/cover-letter/$cvId")({
  head: () =>
    buildSeo({
      title: "Cover Letter Generator — CV Pintar",
      description: "Buat surat lamaran profesional dengan AI.",
      path: "/tools/cover-letter",
      noindex: true,
    }),
  component: CoverLetterPage,
});

function CoverLetterPage() {
  const { cvId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");

  // Mode: "specific" or "general"
  const [mode, setMode] = useState<"specific" | "general">("specific");
  const [jobDesc, setJobDesc] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [result, setResult] = useState("");
  const [editedResult, setEditedResult] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      // Check subscription access first
      if (user?.id) {
        const { data } = await (supabase as any)
          .from("user_subscriptions")
          .select(`subscription_tiers!inner(enable_cover_letter)`)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();
        
        if (data?.subscription_tiers?.enable_cover_letter === false) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        setHasAccess(true);
      }
      
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
  }, [cvId, user?.id]);

  const handleGenerate = async () => {
    // Validation based on mode
    if (mode === "specific" && !jobDesc.trim()) {
      toast.error("Deskripsi pekerjaan wajib diisi untuk mode spesifik");
      return;
    }
    if (mode === "general" && !position.trim()) {
      toast.error("Posisi yang dilamar wajib diisi");
      return;
    }

    setGenerating(true);
    try {
      // For general mode, generate a generic job description from position
      let finalJobDesc = jobDesc.trim();
      if (mode === "general") {
        finalJobDesc = `Posisi: ${position.trim()}${company.trim() ? `\nPerusahaan: ${company.trim()}` : ""}\n\nGenerate cover letter umum berdasarkan CV dan posisi yang dilamar.`;
      }

      const res = await generateCoverLetter({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          jobDescription: finalJobDesc,
          companyName: company.trim() || undefined,
          positionName: position.trim() || undefined,
        },
      });
      setResult(res.coverLetter);
      setEditedResult(res.coverLetter);
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

  const handleDownloadPdf = async () => {
    try {
      toast.loading("Membuat PDF...");
      
      // Create HTML content for PDF
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cover Letter - ${cvData.personal.fullName || "Nama Anda"}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 25mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20mm 25mm;
    }
    .header {
      margin-bottom: 10mm;
    }
    .sender-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    .sender-info {
      font-size: 10pt;
      color: #333;
      line-height: 1.3;
    }
    .sender-info span {
      display: block;
    }
    .date-section {
      margin-bottom: 10mm;
    }
    .recipient-section {
      margin-bottom: 10mm;
    }
    .recipient-section span {
      display: block;
    }
    .salutation {
      margin-bottom: 6mm;
    }
    .body-text {
      text-align: justify;
      margin-bottom: 8mm;
    }
    .body-text p {
      margin: 0;
      margin-bottom: 6pt;
    }
    .closing {
      margin-top: 12mm;
    }
    .signature {
      margin-top: 25mm;
    }
    .signature-name {
      font-weight: bold;
    }
    @media print {
      body {
        padding: 15mm 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="sender-name">${cvData.personal.fullName || "Nama Anda"}</div>
    <div class="sender-info">
      ${cvData.personal.email ? `<span>${cvData.personal.email}</span>` : ""}
      ${cvData.personal.phone ? `<span>${cvData.personal.phone}</span>` : ""}
      ${cvData.personal.location ? `<span>${cvData.personal.location}</span>` : ""}
    </div>
  </div>
  
  <div class="date-section">
    ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
  </div>
  
  ${company ? `
  <div class="recipient-section">
    <span>Kepada Yth.,</span>
    <span><strong>HRD ${company}</strong></span>
    ${position ? `<span>Posisi: ${position}</span>` : ""}
  </div>
  ` : ""}
  
  <div class="salutation">Dengan hormat,</div>
  
  <div class="body-text">
    ${result.split("\n\n").map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`).join("\n")}
  </div>
  
  <div class="closing">
    <p>Hormat saya,</p>
  </div>
  
  <div class="signature">
    <p class="signature-name">${cvData.personal.fullName || "Nama Anda"}</p>
  </div>
</body>
</html>`;

      // Create blob URL and open in new window for printing to PDF
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab for user to print/save as PDF
      const printWindow = window.open(url, "_blank");
      
      toast.dismiss();
      
      if (printWindow) {
        printWindow.onload = () => {
          toast.success("PDF siap di-print! Tekan Ctrl+P untuk menyimpan sebagai PDF.");
        };
      } else {
        // Fallback if popup is blocked
        const a = document.createElement("a");
        a.href = url;
        a.download = `cover-letter-${cvTitle || "document"}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("File berhasil dibuat! Buka file dan tekan Ctrl+P untuk menyimpan sebagai PDF.");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || "Gagal membuat PDF");
    }
  };

  const handleReset = () => {
    setJobDesc("");
    setCompany("");
    setPosition(cvData.personal.headline || "");
    setResult("");
    setEditedResult("");
  };

  const handleResultChange = (value: string) => {
    setResult(value);
    setEditedResult(value);
  };

  if (loading)
    return (
      <div className="container-page py-10 text-sm text-muted-foreground">
        Memuat...
      </div>
    );

  if (hasAccess === false) {
    return (
      <div className="container-page py-10">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Akses Terbatas</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fitur Cover Letter Generator memerlukan paket langganan yang mendukung fitur ini.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/tools">Kembali ke Tools</Link>
              </Button>
              <Button asChild>
                <Link to="/harga">Upgrade Paket</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Pilih mode generate cover letter sesuai kebutuhanmu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selector */}
            <div className="space-y-2">
              <Label>Mode Generate</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "specific" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("specific")}
                  className="flex-1"
                >
                  📋 Spesifik
                </Button>
                <Button
                  type="button"
                  variant={mode === "general" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("general")}
                  className="flex-1"
                >
                  ✨ Umum
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {mode === "specific" 
                  ? "Paste job description dari posting pekerjaan yang kamu lamar (lebih akurat)"
                  : "AI generate cover letter umum berdasarkan posisi dan CV-mu (untuk latihan/template)"}
              </p>
            </div>

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
              <Label htmlFor="position">
                Posisi yang Dilamar {mode === "general" && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Frontend Developer"
              />
            </div>

            {/* Conditional: Show textarea only in specific mode */}
            {mode === "specific" && (
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
                  className="font-mono text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {jobDesc.length}/10,000 karakter
                </p>
              </div>
            )}

            {/* Info for general mode */}
            {mode === "general" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Mode Umum:</strong> AI akan generate cover letter berdasarkan:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Data dari CV-mu ({cvData.personal.fullName})</li>
                  <li>• Posisi yang kamu lamar</li>
                  <li>• Pengalaman dan skills dari CV</li>
                  <li>• Template cover letter profesional</li>
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  💡 Untuk hasil lebih akurat, gunakan <strong>Mode Spesifik</strong> dengan job description asli.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generating || (mode === "specific" && !jobDesc.trim()) || (mode === "general" && !position.trim())}
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
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Hasil Cover Letter</CardTitle>
                <CardDescription>
                  {viewMode === "preview" ? "Preview cover letter" : "Edit teks cover letter"}
                </CardDescription>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setViewMode("preview")}
                      className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                        viewMode === "preview" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      <Eye className="h-3 w-3" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedResult(result);
                        setViewMode("edit");
                      }}
                      className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                        viewMode === "edit" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                  </div>
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
                    <Download className="h-3 w-3" /> TXT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" /> PDF
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
            ) : viewMode === "preview" ? (
              <div className="bg-muted/20 rounded-lg p-4 overflow-auto max-h-[650px] flex justify-center">
                <CoverLetterPreview
                  coverLetter={result}
                  cvData={cvData}
                  company={company}
                  position={position}
                  scale={0.7}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={editedResult}
                  onChange={(e) => setEditedResult(e.target.value)}
                  rows={20}
                  className="font-mono text-sm resize-none"
                  placeholder="Edit cover letter di sini..."
                />
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedResult(result);
                      toast.success("Reset ke hasil generate");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setResult(editedResult);
                      setViewMode("preview");
                      toast.success("Preview diperbarui!");
                    }}
                  >
                    Update Preview
                  </Button>
                </div>
              </div>
            )}
            {result && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Tips:</strong> Review dan sesuaikan cover letter dengan
                  gaya bahasa kamu. Klik <strong>Edit</strong> untuk mengubah teks,
                  lalu klik <strong>Update Preview</strong> untuk melihat hasilnya.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
