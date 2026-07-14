import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Download, FileText, Printer, Share2 } from "lucide-react";
import { useEffect } from "react";

import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import { CvPreview, cvPrintStyles } from "@/components/cv/CvPreview";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { emptyCv, type CvData, type TemplateId } from "@/lib/cv-types";
import { buildSeo, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/share/$token")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("cvs")
      .select("id, user_id, title, template_id, data, created_at, share_token")
      .eq("share_token", params.token)
      .eq("share_enabled", true)
      .single();

    if (error || !data) throw notFound();

    const cvData = { ...emptyCv, ...(data.data as unknown as CvData) };
    cvData.personal.linkedin = "";
    cvData.personal.website = "";

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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md px-4 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">CV tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Link CV ini tidak valid atau sudah dinonaktifkan oleh pemilik.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  ),
});

function SharedCvPage() {
  const { templateId, cvData, createdAt, cvId, userId, fullName, token } = Route.useLoaderData();
  const shareUrl = `${SITE_URL}/share/${token}`;

  useEffect(() => {
    if (!cvId || !userId) return;
    void (supabase as any).from("cv_analytics").insert({
      cv_id: cvId,
      user_id: userId,
      event_type: "view",
    });
  }, [cvId, userId]);

  const handlePrint = () => {
    window.print();
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
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" aria-hidden />
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
            <Button onClick={handlePrint} size="lg" className="gap-2">
              <Download className="h-4 w-4" aria-hidden />
              Download / Cetak PDF
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
