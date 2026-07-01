import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CoverLetterPreview } from "@/components/cv/CoverLetterPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { generateCoverLetter } from "@/lib/ai-functions";
import { useAuth } from "@/lib/auth-context";
import type { CvData } from "@/lib/cv-types";
import { emptyCv } from "@/lib/cv-types";
import { buildSeo } from "@/lib/seo";
import { checkFeatureAccess } from "@/lib/subscription";
import { generateCoverLetterDocx, downloadBlob, parseCoverLetter } from "@/lib/cv-export";

export const Route = createFileRoute("/_authenticated/tools/cover-letter/$cvId")({
  head: () =>
    buildSeo({
      title: "Cover Letter Generator - CV Pintar",
      description:
        "Buat surat lamaran profesional dengan AI berdasarkan CV, posisi, perusahaan, dan job description.",
      path: "/tools/cover-letter",
      noindex: true,
    }),
  component: CoverLetterPage,
});

const modeOptions = [
  {
    value: "specific" as const,
    icon: FileText,
    label: "Spesifik",
    description: "Pakai job description asli untuk hasil paling relevan.",
  },
  {
    value: "general" as const,
    icon: Sparkles,
    label: "Umum",
    description: "Buat draft cepat berdasarkan posisi dan isi CV.",
  },
];

const writingNotes = [
  "AI membaca pengalaman, skill, dan headline dari CV yang kamu pilih.",
  "Job description membantu surat lebih tajam dan tidak terasa generik.",
  "Tetap edit kalimat akhir agar terdengar seperti gaya bicaramu sendiri.",
];

function CoverLetterPage() {
  const { cvId } = Route.useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");
  const [mode, setMode] = useState<"specific" | "general">("specific");
  const [jobDesc, setJobDesc] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [result, setResult] = useState("");
  const [editedResult, setEditedResult] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [jobSource, setJobSource] = useState("");
  const [customJobSource, setCustomJobSource] = useState("");

  useEffect(() => {
    (async () => {
      if (user?.id) {
        const canUseCoverLetter = await checkFeatureAccess(user.id, "canCoverLetter");

        if (!canUseCoverLetter) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        setHasAccess(true);
      }

      const { data: row, error } = await supabase.from("cvs").select("*").eq("id", cvId).single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setCvTitle(row.title);
      const data = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(data);
      setPosition(data.personal.headline || "");
      setLoading(false);
    })();
  }, [cvId, user?.id]);

  const handleGenerate = async () => {
    if (mode === "specific" && !jobDesc.trim()) {
      toast.error("Deskripsi pekerjaan wajib diisi untuk mode spesifik.");
      return;
    }

    if (mode === "general" && !position.trim()) {
      toast.error("Posisi yang dilamar wajib diisi.");
      return;
    }

    if (jobSource === "Lainnya" && !customJobSource.trim()) {
      toast.error("Silakan isi nama sumber lowongan.");
      return;
    }

    setGenerating(true);
    try {
      let finalJobDesc = jobDesc.trim();
      if (mode === "general") {
        finalJobDesc = `Posisi: ${position.trim()}${
          company.trim() ? `\nPerusahaan: ${company.trim()}` : ""
        }\n\nGenerate cover letter umum berdasarkan CV dan posisi yang dilamar.`;
      }

      let finalSource = "";
      if (jobSource === "Lainnya") {
        finalSource = customJobSource.trim();
      } else if (jobSource && jobSource !== "none") {
        finalSource = jobSource;
      }

      const res = await generateCoverLetter({
        data: {
          cvId,
          cvData: cvData as unknown as Record<string, unknown>,
          jobDescription: finalJobDesc,
          companyName: company.trim() || undefined,
          positionName: position.trim() || undefined,
          jobSource: finalSource || undefined,
        },
      });

      setResult(res.coverLetter);
      setEditedResult(res.coverLetter);
      setViewMode("preview");
      toast.success("Cover letter berhasil dibuat.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat cover letter";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success("Cover letter disalin ke clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cover-letter-${cvTitle}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("Cover letter berhasil diunduh.");
  };

  const handleDownloadPdf = async () => {
    const toastId = toast.loading("Membuat PDF...");
    try {
      const parsed = parseCoverLetter(result, cvData);
      const salutationText = parsed.salutation || "Dengan hormat,";
      const bodyHtml = (parsed.paragraphs.length > 0 ? parsed.paragraphs : [result])
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
      const closingText = parsed.closing || "Hormat saya,";

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cover Letter - ${cvData.personal.fullName || "Nama Anda"}</title>
  <style>
    @page { size: A4; margin: 20mm 25mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20mm 25mm;
    }
    .header { margin-bottom: 10mm; }
    .sender-name { font-size: 14pt; font-weight: bold; margin-bottom: 2mm; }
    .sender-info { font-size: 10pt; color: #333; line-height: 1.3; }
    .sender-info span { display: block; }
    .date-section, .recipient-section { margin-bottom: 10mm; }
    .recipient-section span { display: block; }
    .salutation { margin-bottom: 6mm; }
    .body-text { text-align: justify; margin-bottom: 8mm; }
    .body-text p { margin: 0 0 6pt; }
    .closing { margin-top: 12mm; }
    .signature { margin-top: 25mm; }
    .signature-name { font-weight: bold; }
    @media print {
      body {
        padding: 0;
        margin: 0;
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
    ${new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}
  </div>
  ${
    company
      ? `
  <div class="recipient-section">
    <span>Kepada Yth.,</span>
    <span><strong>HRD ${company}</strong></span>
    ${position ? `<span>Posisi: ${position}</span>` : ""}
  </div>`
      : ""
  }
  <div class="salutation">${salutationText}</div>
  <div class="body-text">
    ${bodyHtml}
  </div>
  <div class="closing"><p>${closingText}</p></div>
  <div class="signature">
    <p class="signature-name">${cvData.personal.fullName || "Nama Anda"}</p>
  </div>
</body>
</html>`;

      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      document.body.appendChild(iframe);

      const printDocument = iframe.contentDocument;
      const printWindow = iframe.contentWindow;

      if (!printDocument || !printWindow) {
        iframe.remove();
        throw new Error("Gagal membuka jendela cetak.");
      }

      printDocument.open();
      printDocument.write(htmlContent);
      printDocument.close();

      toast.dismiss(toastId);

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        setTimeout(() => iframe.remove(), 1000);
      };

      printWindow.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        toast.success("PDF siap dicetak.");
      }, 250);
      setTimeout(cleanup, 60000);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat PDF";
      toast.dismiss(toastId);
      toast.error(message);
    }
  };

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    const toastId = toast.loading("Membuat Word...");
    try {
      const blob = await generateCoverLetterDocx(
        result,
        cvData,
        company.trim() || undefined,
        position.trim() || undefined,
      );
      downloadBlob(blob, `cover-letter-${cvTitle || "document"}.docx`);
      toast.dismiss(toastId);
      toast.success("Cover letter berhasil diunduh dalam format Word.");
    } catch (error) {
      console.error("Gagal mengunduh Word:", error);
      toast.dismiss(toastId);
      const message = error instanceof Error ? error.message : "Gagal membuat Word";
      toast.error(message);
    } finally {
      setDownloadingDocx(false);
    }
  };


  const handleReset = () => {
    setJobDesc("");
    setCompany("");
    setPosition(cvData.personal.headline || "");
    setResult("");
    setEditedResult("");
    setViewMode("preview");
    setJobSource("");
    setCustomJobSource("");
  };

  if (loading) return <CoverLetterSkeleton />;

  if (hasAccess === false) {
    return <LockedCoverLetter />;
  }

  const canGenerate =
    !generating &&
    ((mode === "specific" && Boolean(jobDesc.trim())) ||
      (mode === "general" && Boolean(position.trim())));

  return (
    <main className="container-page py-6 sm:py-8 lg:py-10">
      <div className="mb-6">
        <BackButton />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary-soft/80 to-transparent" />
            <div className="relative">
              <Badge className="gap-2 rounded-full px-3 py-1.5">
                <WandSparkles className="h-3.5 w-3.5" />
                Cover Letter AI
              </Badge>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-5xl">
                Surat lamaran yang terasa personal, bukan template kosong.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                Buat draft cover letter dari CV kamu, posisi yang dituju, dan bahasa lowongan. Cocok
                untuk melamar cepat tanpa kehilangan sentuhan manusia.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroMetric icon={BookOpen} label="CV aktif" value={cvTitle || "CV kamu"} />
                <HeroMetric icon={Target} label="Posisi" value={position || "Belum diisi"} />
                <HeroMetric
                  icon={BriefcaseBusiness}
                  label="Perusahaan"
                  value={company || "Opsional"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-primary text-primary-foreground">
          <CardContent className="p-5 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Send className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">
              Bukan sekadar formalitas. Ini pembuka percakapan.
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
              Cover letter yang baik menjawab satu hal: kenapa kamu relevan untuk posisi ini,
              sekarang, di perusahaan ini.
            </p>
            <div className="mt-6 space-y-3">
              {writingNotes.map((note) => (
                <div key={note} className="flex gap-3 text-sm leading-6">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="text-primary-foreground/85">{note}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card className="border-border bg-card">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full">
              Informasi lamaran
            </Badge>
            <CardTitle className="font-display text-2xl">
              Pilih konteks, lalu biarkan AI membuat draft pertama.
            </CardTitle>
            <CardDescription className="leading-6">
              Gunakan mode spesifik untuk lowongan nyata. Gunakan mode umum untuk membuat template
              awal yang bisa kamu adaptasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mode === option.value}
                  onClick={() => setMode(option.value)}
                  className={
                    mode === option.value
                      ? "rounded-xl border border-primary bg-primary-soft p-4 text-left ring-2 ring-primary/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      : "rounded-xl border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary">
                      <option.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="company">Nama perusahaan</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Contoh: PT Talenta Nusantara"
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">
                  Posisi yang dilamar
                  {mode === "general" && <span className="ml-1 text-destructive">*</span>}
                </Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="Contoh: Frontend Developer"
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="source">Sumber lowongan</Label>
                <Select value={jobSource} onValueChange={setJobSource}>
                  <SelectTrigger id="source" className="h-11 rounded-lg bg-background">
                    <SelectValue placeholder="Pilih sumber lowongan (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak disebutkan / Opsional</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Jobstreet">Jobstreet</SelectItem>
                    <SelectItem value="Glints">Glints</SelectItem>
                    <SelectItem value="Website Perusahaan">Website Perusahaan</SelectItem>
                    <SelectItem value="Karir.com">Karir.com</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {jobSource === "Lainnya" && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="customSource">Sebutkan sumber lowongan</Label>
                  <Input
                    id="customSource"
                    value={customJobSource}
                    onChange={(event) => setCustomJobSource(event.target.value)}
                    placeholder="Contoh: Instagram / Teman"
                    className="h-11 rounded-lg"
                  />
                </div>
              )}
            </div>

            {mode === "specific" ? (
              <div className="grid gap-2">
                <div className="flex items-end justify-between gap-3">
                  <Label htmlFor="jobdesc">
                    Deskripsi pekerjaan
                    <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">{jobDesc.length}/10.000</span>
                </div>
                <Textarea
                  id="jobdesc"
                  value={jobDesc}
                  onChange={(event) => setJobDesc(event.target.value)}
                  placeholder="Tempel job description lengkap di sini. Sertakan requirements, responsibilities, skill, dan kualifikasi agar surat lamaran lebih relevan."
                  rows={11}
                  maxLength={10000}
                  className="resize-none rounded-lg text-sm leading-6"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Mode umum cocok untuk draft awal.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      AI akan memakai nama, headline, pengalaman, dan skill dari CV kamu untuk
                      membuat surat lamaran yang rapi. Untuk hasil paling tajam, pindah ke mode
                      spesifik dan tempel job description asli.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="h-11 flex-1 rounded-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat draft
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-4 w-4" />
                    Generate cover letter
                  </>
                )}
              </Button>
              {result && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="h-11 rounded-lg"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge variant="secondary" className="w-fit rounded-full">
                  Hasil surat
                </Badge>
                <CardTitle className="mt-3 font-display text-2xl">
                  Preview dan edit sebelum dikirim.
                </CardTitle>
                <CardDescription className="mt-2 leading-6">
                  Rapikan detail kecil, lalu salin, unduh TXT, atau buka versi print untuk PDF.
                </CardDescription>
              </div>

              {result && (
                <div className="flex flex-wrap gap-2">
                  <div className="flex overflow-hidden rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setViewMode("preview")}
                      aria-pressed={viewMode === "preview"}
                      className={
                        viewMode === "preview"
                          ? "inline-flex h-9 items-center gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground"
                          : "inline-flex h-9 items-center gap-1.5 bg-background px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                      }
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedResult(result);
                        setViewMode("edit");
                      }}
                      aria-pressed={viewMode === "edit"}
                      className={
                        viewMode === "edit"
                          ? "inline-flex h-9 items-center gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground"
                          : "inline-flex h-9 items-center gap-1.5 bg-background px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                      }
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {copied ? "Tersalin" : "Salin"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    TXT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadDocx}
                    disabled={downloadingDocx}
                  >
                    {downloadingDocx ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Word
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!result ? (
              <EmptyResultState generating={generating} />
            ) : viewMode === "preview" ? (
              <div className="flex max-h-[720px] justify-center overflow-auto rounded-xl border border-border bg-muted/25 p-4">
                <CoverLetterPreview
                  coverLetter={result}
                  cvData={cvData}
                  company={company}
                  position={position}
                  scale={0.7}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  value={editedResult}
                  onChange={(event) => setEditedResult(event.target.value)}
                  rows={22}
                  className="resize-none rounded-lg text-sm leading-6"
                  placeholder="Edit cover letter di sini..."
                />
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedResult(result);
                      toast.success("Teks dikembalikan ke hasil generate.");
                    }}
                    className="rounded-lg"
                  >
                    Reset teks
                  </Button>
                  <Button
                    onClick={() => {
                      setResult(editedResult);
                      setViewMode("preview");
                      toast.success("Preview diperbarui.");
                    }}
                    className="rounded-lg"
                  >
                    Update preview
                  </Button>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                <div className="flex gap-3 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-muted-foreground">
                    Baca ulang bagian pembuka dan penutup. Pastikan nama perusahaan, posisi, dan
                    alasan melamar sudah terasa spesifik sebelum dikirim.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/90 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function EmptyResultState({ generating }: { generating: boolean }) {
  return (
    <div className="flex min-h-[440px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background text-primary">
        {generating ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <BookOpen className="h-7 w-7" />
        )}
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">
        {generating ? "Draft sedang disusun." : "Hasil akan muncul di sini."}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {generating
          ? "AI sedang membaca CV dan konteks lamaranmu. Sebentar lagi surat lamaran siap diedit."
          : "Isi informasi lamaran di panel kiri, lalu generate draft pertama. Kamu bisa edit sebelum menyalin atau mengunduhnya."}
      </p>
    </div>
  );
}

function LockedCoverLetter() {
  const { cvId } = Route.useParams();
  return (
    <main className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-xl border-border bg-card">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Lock className="h-7 w-7" />
          </div>
          <Badge variant="secondary" className="mt-5 rounded-full">
            Fitur premium
          </Badge>
          <h1 className="mt-4 font-display text-2xl font-bold">
            Cover Letter Generator belum aktif di paketmu.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Upgrade paket untuk membuat surat lamaran otomatis berdasarkan CV, posisi, perusahaan,
            dan job description.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" asChild className="rounded-lg">
              <Link to="/tools" search={{ cvId }}>Kembali ke Tools</Link>
            </Button>
            <Button asChild className="rounded-lg">
              <Link to="/harga">Upgrade paket</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function CoverLetterSkeleton() {
  return (
    <main className="container-page space-y-6 py-6 sm:py-8 lg:py-10">
      <Skeleton className="h-9 w-40 rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-7 lg:p-8">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="mt-5 h-10 w-full max-w-3xl sm:h-12" />
          <Skeleton className="mt-3 h-10 w-4/5 max-w-2xl sm:h-12" />
          <Skeleton className="mt-5 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-xl" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-border p-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="mt-3 h-3 w-24" />
                <Skeleton className="mt-2 h-5 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="mt-5 h-8 w-full max-w-sm" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="mt-3 h-8 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-11 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-64 rounded-lg" />
          <Skeleton className="mt-5 h-11 rounded-lg" />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="mt-3 h-8 w-64 max-w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <Skeleton className="mt-5 h-[560px] rounded-xl" />
        </div>
      </div>
    </main>
  );
}
