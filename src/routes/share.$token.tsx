import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { buildSeo, SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { CvPreview } from "@/components/cv/CvPreview";
import { TEMPLATES, type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";
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
    // Remove sensitive info
    cvData.personal.email = "••••••••";
    cvData.personal.phone = "••••••••";
    cvData.personal.linkedin = "";
    cvData.personal.website = "";

    return {
      title: data.title,
      templateId: data.template_id as TemplateId,
      cvData,
      createdAt: data.created_at,
      cvId: data.id,
      userId: data.user_id,
    };
  },
  head: ({ loaderData }: any) => {
    if (!loaderData) return { meta: [{ title: "CV tidak ditemukan" }], links: [], scripts: [] };
    return buildSeo({
      title: `${loaderData.cvData.personal.fullName || "CV"} — CV ATS Indonesia`,
      description: `CV profesional ${loaderData.cvData.personal.fullName || ""} — ${loaderData.cvData.personal.headline || ""}`,
      path: `/share/${Route.useParams().token}`,
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
  const { title, templateId, cvData, createdAt, cvId, userId } = Route.useLoaderData();
  const { token } = Route.useParams();
  const shareUrl = `${SITE_URL}/share/${token}`;

  useEffect(() => {
    if (!cvId || !userId) return;
    (supabase as any).from("cv_analytics").insert({
      cv_id: cvId,
      user_id: userId,
      event_type: "view",
    }).catch(() => {});
  }, [cvId, userId]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 print:hidden">
        <div className="container-page flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">CV ATS Indonesia</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Dibagikan {new Date(createdAt).toLocaleDateString("id-ID")}
            </span>
            <WhatsAppShare shareUrl={shareUrl} fullName={cvData.personal.fullName} size="sm" />
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

      {/* Bottom CTA */}
      <div className="container-page py-8 text-center print:hidden">
        <p className="text-sm text-muted-foreground mb-4">
          CV ini dibuat dengan CV ATS Indonesia
        </p>
        <Button asChild variant="outline">
          <Link to="/register">Buat CV ATS Friendly Gratis</Link>
        </Button>
      </div>
    </div>
  );
}
