import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ErrorState } from "@/components/site/ErrorState";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Copy,
  Download,
  FileText,
  Link2Off,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import { CvPreview, cvPrintStyles } from "@/components/cv/CvPreview";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { downloadPdf } from "@/lib/cv-export";
import { emptyCv, type CvData, type TemplateId } from "@/lib/cv-types";
import { buildSeo, SITE_URL } from "@/lib/seo";

interface SharedCvRow {
  id: string;
  user_id: string | null;
  title: string;
  template_id: string;
  data: unknown;
  created_at: string;
  updated_at: string;
}

// RPC belum ada di types.ts hasil generate — tipe minimal untuk pemanggilan ini.
interface SharedRpcClient {
  rpc: (
    fn: "get_shared_cv",
    args: { p_token: string },
  ) => PromiseLike<{ data: SharedCvRow[] | SharedCvRow | null; error: unknown }>;
}

export const Route = createFileRoute("/share/$token")({
  loader: async ({ params }) => {
    // SECURITY: CV yang dibagikan hanya bisa dibaca lewat RPC per-token.
    // LinkedIn & website sudah disamarkan di server (get_shared_cv);
    // user_id hanya terisi bila pemirsa adalah pemilik CV.
    const { data: rows, error } = await (supabase as unknown as SharedRpcClient).rpc(
      "get_shared_cv",
      { p_token: params.token },
    );
    const data = (Array.isArray(rows) ? rows[0] : rows) as SharedCvRow | undefined;

    if (error || !data) throw notFound();

    const cvData = { ...emptyCv, ...(data.data as unknown as CvData) };

    return {
      title: data.title,
      templateId: data.template_id as TemplateId,
      cvData,
      createdAt: data.created_at,
      cvId: data.id,
      userId: data.user_id,
      fullName: cvData.personal.fullName,
      headline: cvData.personal.headline,
      token: params.token,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "CV tidak ditemukan" }], links: [], scripts: [] };
    return buildSeo({
      title: `${loaderData.fullName || "CV"} - CV ATS Friendly`,
      description: `CV profesional ${loaderData.fullName || ""} - ${loaderData.headline || ""}. Dibuat dengan CV Pintar.`,
      path: `/share/${loaderData.token}`,
      noindex: true,
    });
  },
  component: SharedCvPage,
  notFoundComponent: () => (
    <ErrorState
      standalone
      icon={Link2Off}
      eyebrow="Link CV tidak aktif"
      title="CV ini tidak bisa ditampilkan."
      description="Link CV ini tidak valid atau sudah dinonaktifkan oleh pemiliknya. Minta link terbaru ke orang yang membagikannya."
      primary={{ label: "Buat CV-mu Sendiri", to: "/register" }}
      secondary={{ label: "Ke Beranda", to: "/" }}
    />
  ),
});

// Lebar A4 (210mm) dalam px CSS. CV selalu dirender selebar ini, lalu diperkecil dengan CSS zoom
// agar muat di layar kecil — zoom ikut mengubah ukuran layout, jadi tidak ada scroll samping.
const A4_PX = (210 * 96) / 25.4;

// CvPreview memberi wadah tinggi tetap 297mm; CV 2 halaman lebih tinggi dari itu dan meluap
// menimpa konten di bawahnya. Di sini tinggi dibiarkan mengikuti isi CV.
const shareStyles = `
.share-cv-zoom .cv-preview-container { height: auto !important; min-height: 0 !important; }
@media print { .share-cv-zoom { zoom: 1 !important; } }
`;

function SharedCvPage() {
  const { templateId, cvData, createdAt, cvId, userId, fullName, headline, token } =
    Route.useLoaderData();
  const shareUrl = `${SITE_URL}/share/${token}`;
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cvId || !userId) return;
    void (supabase as any).from("cv_analytics").insert({
      cv_id: cvId,
      user_id: userId,
      event_type: "view",
    });
  }, [cvId, userId]);

  // Sesuaikan lebar CV dengan lebar wadah (maks 100%, tidak pernah diperbesar).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setZoom(Math.min(1, frame.clientWidth / A4_PX));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadPdf(cvData, `${fullName || "CV"}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Gagal membuat file PDF. Coba lagi sebentar.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link CV disalin");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Tidak bisa menyalin otomatis. Salin dari kolom alamat browser.");
    }
  };

  const sharedOn = new Date(createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const downloadLabel = downloading ? "Membuat PDF..." : "Unduh PDF";
  const downloadIcon = downloading ? (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
  ) : (
    <Download className="h-4 w-4" aria-hidden />
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <style>{cvPrintStyles}</style>
      <style>{shareStyles}</style>

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur print:hidden">
        <div className="container-page flex items-center justify-between gap-3 py-2.5">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold tracking-tight">CV Pintar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link to="/register">Buat CV Sendiri</Link>
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={downloading} className="gap-1.5">
              {downloadIcon}
              {downloadLabel}
            </Button>
          </div>
        </div>
      </header>

      <main className="container-page py-6 sm:py-10 print:py-0">
        <section className="mx-auto mb-5 max-w-[210mm] print:hidden">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                CV yang dibagikan
              </p>
              <h1 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">
                {fullName || "CV"}
              </h1>
              {headline && (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{headline}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  ATS friendly
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  Dibagikan {sharedOn}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <WhatsAppShare shareUrl={shareUrl} fullName={fullName} size="sm" />
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                {copied ? "Tersalin" : "Salin Link"}
              </Button>
            </div>
          </div>
        </section>

        <div ref={frameRef} className="mx-auto max-w-[210mm] [overflow-x:clip] print:max-w-none">
          <div
            className="share-cv-zoom overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0"
            style={{ zoom: zoom ?? 1, visibility: zoom === null ? "hidden" : "visible" }}
          >
            <div className="cv-print-area p-0">
              <CvPreview data={cvData} template={templateId} />
            </div>
          </div>
        </div>

        <section className="mx-auto mt-8 max-w-[210mm] print:hidden sm:mt-10">
          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center sm:p-8">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-lg font-bold tracking-tight sm:text-xl">
              Mau CV serapi ini? Buat CV ATS-mu dalam 1 menit
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              Pilih template, isi data, lalu unduh PDF yang lolos sistem pelamar kerja. Gratis untuk
              mulai.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/register">Buat CV Gratis</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDownload}
                disabled={downloading}
                className="gap-2 bg-background"
              >
                {downloadIcon}
                {downloadLabel}
              </Button>
            </div>
          </div>
          <p className="mt-5 pb-4 text-center text-xs text-muted-foreground">
            CV ini dibuat dengan{" "}
            <Link to="/" className="font-medium text-foreground underline-offset-2 hover:underline">
              CV Pintar
            </Link>
            . Buat CV ATS friendly dalam 1 menit.
          </p>
        </section>
      </main>
    </div>
  );
}
