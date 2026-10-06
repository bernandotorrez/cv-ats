import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ErrorState } from "@/components/site/ErrorState";
import { Download, FileText, Loader2, Printer, Share2, Link2Off } from "lucide-react";
import { useEffect, useState } from "react";
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

function SharedCvPage() {
  const { templateId, cvData, createdAt, cvId, userId, fullName, token } = Route.useLoaderData();
  const shareUrl = `${SITE_URL}/share/${token}`;
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!cvId || !userId) return;
    void (supabase as any).from("cv_analytics").insert({
      cv_id: cvId,
      user_id: userId,
      event_type: "view",
    });
  }, [cvId, userId]);

  const handlePrint = async () => {
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

  return (
    <div className="min-h-screen bg-muted/30">
      <style>{cvPrintStyles}</style>

      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur print:hidden">
        <div className="container-page flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <span className="hidden text-sm font-medium sm:inline">CV Pintar</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Dibagikan {new Date(createdAt).toLocaleDateString("id-ID")}
            </span>
            <WhatsAppShare shareUrl={shareUrl} fullName={fullName} size="sm" />
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              disabled={downloading}
              className="gap-1.5"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Printer className="h-3.5 w-3.5" aria-hidden />
              )}
              <span className="hidden sm:inline">Cetak</span>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Buat CV Sendiri</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container-page py-8 print:py-0">
        <div className="mx-auto max-w-[210mm] bg-white shadow-lg print:max-w-none print:shadow-none">
          <div className="cv-print-area p-0">
            <CvPreview data={cvData} template={templateId} />
          </div>
        </div>
      </div>

      <div className="container-page py-8 text-center print:hidden">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            CV ini dibuat dengan CV Pintar. Buat CV ATS friendly dalam 1 menit.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={handlePrint} disabled={downloading} size="lg" className="gap-2">
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              {downloading ? "Membuat PDF..." : "Download / Cetak PDF"}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/register">Buat CV Gratis</Link>
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Bagikan:</span>
            <WhatsAppShare shareUrl={shareUrl} fullName={fullName} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
              }}
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              <span className="text-xs">Salin Link</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
