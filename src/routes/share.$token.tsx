import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo, SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { CvPreview, cvPrintStyles } from "@/components/cv/CvPreview";
import type { CvData, TemplateId } from "@/lib/cv-types";
import { emptyCv } from "@/lib/cv-types";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Printer, Share2 } from "lucide-react";
import { WhatsAppShare } from "@/components/share/WhatsAppShare";

export const Route = createFileRoute("/share/$token")({
  loader: async ({ params }: { params: { token: string } }) => {
    const { data, error } = await (supabase as any)
      .from("cvs")
      .select("*")
      .eq("share_token", params.token)
      .eq("share_enabled", true)
      .single();

    if (error || !data) throw notFound();

    const cvData = { ...emptyCv, ...(data.data as unknown as CvData) };
    cvData.personal.email = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
    cvData.personal.phone = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
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
  head: ({ loaderData }: any) => {
    if (!loaderData) return { meta: [{ title: "CV tidak ditemukan" }], links: [], scripts: [] };
    return buildSeo({
      title: `${loaderData.fullName || "CV"} — CV ATS Friendly`,
      description: `CV profesional ${loaderData.fullName || ""} — ${loaderData.headline || ""}. Dibuat dengan CV Pintar.`,
      path: `/share/${loaderData.token}`,
      noindex: true,
    });
  },
  component: SharePage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
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

function SharePage() {
  const { title, templateId, cvData, createdAt, cvId, userId, fullName, token } = Route.useLoaderData();
  const shareUrl = `${SITE_URL}/share/${token}`;
  const [autoPrintDone, setAutoPrintDone] = useState(false);

  // Log analytics view
  useEffect(() => {
    if (!cvId || !userId) return;
    (async () => {
      const { error } = await (supabase as any).from("cv_analytics").insert({
        cv_id: cvId,
        user_id: userId,
        event_type: "view",
      });
      if (error) console.error("Analytics insert error:", error);
    })();
  }, [cvId, userId]);

  // Auto-open print dialog after page loads (gives PDF view)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!autoPrintDone) {
        setAutoPrintDone(true);
        window.print();
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [autoPrintDone]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <style>{cvPrintStyles}</style>

      {/* Top Bar - hidden when printing */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 print:hidden">
        <div className="container-page flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">CV Pintar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Dibagikan {new Date(createdAt).toLocaleDateString("id-ID")}
            </span>
            <WhatsAppShare shareUrl={shareUrl} fullName={fullName} size="sm" />
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Buat CV Sendiri</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div className="container-page py-8 print:py-0">
        <div className="mx-auto max-w-[210mm] bg-white shadow-lg print:shadow-none print:max-w-none">
          <div className="cv-print-area p-0">
            <CvPreview data={cvData} template={templateId} />
          </div>
        </div>
      </div>

      {/* Bottom Actions - hidden when printing */}
      <div className="container-page py-8 text-center print:hidden">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            CV ini dibuat dengan CV Pintar — Buat CV ATS friendly dalam 1 menit
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handlePrint} size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Download / Cetak PDF
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/register">Buat CV Gratis</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Bagikan:</span>
            <WhatsAppShare shareUrl={shareUrl} fullName={fullName} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="text-xs">Salin Link</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
