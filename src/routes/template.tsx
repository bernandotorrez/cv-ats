import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Sparkles, Zap, BookOpen } from "lucide-react";
import { TemplateCardSkeleton } from "@/components/ui/skeleton-loading";
import { previewData } from "@/components/site/TemplatePreview";

// Import semua template
import { BaliTemplate } from "@/components/cv/templates/BaliTemplate";
import { JakartaTemplate } from "@/components/cv/templates/JakartaTemplate";
import { MakassarTemplate } from "@/components/cv/templates/MakassarTemplate";
import { BandungTemplate } from "@/components/cv/templates/BandungTemplate";
import { MedanTemplate } from "@/components/cv/templates/MedanTemplate";
import { SemarangTemplate } from "@/components/cv/templates/SemarangTemplate";
import { SurabayaTemplate } from "@/components/cv/templates/SurabayaTemplate";
import { YogyaTemplate } from "@/components/cv/templates/YogyaTemplate";
import type { TemplateSlug } from "@/components/site/TemplatePreview";

// Template component mapping
const templateComponents = {
  bali: BaliTemplate,
  jakarta: JakartaTemplate,
  makassar: MakassarTemplate,
  bandung: BandungTemplate,
  medan: MedanTemplate,
  semarang: SemarangTemplate,
  surabaya: SurabayaTemplate,
  yogya: YogyaTemplate,
};

// Free templates: jakarta, bandung (tanpa badge)
const FREE_TEMPLATES = ["jakarta", "bandung"];

// Pro templates: semarang, surabaya
const PRO_TEMPLATES = ["semarang", "surabaya"];

export const Route = createFileRoute("/template")({
  pendingComponent: TemplateLoading,
  head: () =>
    buildSeo({
      title: "Template CV ATS Gratis — CV ATS Indonesia",
      description:
        "Pilih dari koleksi template CV ATS friendly: klasik, modern, minimalis, profesional. Cocok fresh graduate sampai senior.",
      path: "/template",
      keywords: "template cv ats, contoh cv ats, template cv gratis, template cv fresh graduate",
    }),
  component: TemplatePage,
});

// Data template untuk halaman
const templates = [
  { 
    slug: "bali" as TemplateSlug, 
    name: "Bali", 
    desc: "Format klasik dengan aksen cyan yang menyegarkan. Cocok untuk profesional muda di industri kreatif dan hospitality.", 
    tags: ["Kreatif", "Hospitality", "Modern"] 
  },
  { 
    slug: "jakarta" as TemplateSlug, 
    name: "Jakarta", 
    desc: "Layout terpusat yang bold dan tegas. Ideal untuk corporate dan posisi manajerial.", 
    tags: ["Korporat", "Formal", "Manager"] 
  },
  { 
    slug: "makassar" as TemplateSlug, 
    name: "Makassar", 
    desc: "Two-column design dengan sidebar untuk info kontak dan skill. Cocok untuk HR dan administratif.", 
    tags: ["HR", "Admin", "Sidebar"] 
  },
  { 
    slug: "bandung" as TemplateSlug, 
    name: "Bandung", 
    desc: "Header hijau khas Bandung yang fresh dan profesional. Cocok untuk tech dan startup.", 
    tags: ["Tech", "Startup", "Fresh"] 
  },
  { 
    slug: "medan" as TemplateSlug, 
    name: "Medan", 
    desc: "Format terpusat dengan border bawah header yang elegan. Cocok untuk banking dan finance.", 
    tags: ["Finance", "Banking", "Corporate"] 
  },
  { 
    slug: "semarang" as TemplateSlug, 
    name: "Semarang", 
    desc: "Header gradasi hijau yang dinamis dengan accent border. Cocok untuk project manager dan operations.", 
    tags: ["PM", "Operations", "Dynamic"] 
  },
  { 
    slug: "surabaya" as TemplateSlug, 
    name: "Surabaya", 
    desc: "Border kiri hijau yang bold dan industrial. Cocok untuk supply chain dan manufacturing.", 
    tags: ["Supply Chain", "Manufacturing", "Industrial"] 
  },
  { 
    slug: "yogya" as TemplateSlug, 
    name: "Yogyakarta", 
    desc: "Typography modern dengan heading light yang elegant. Cocok untuk content creator dan kreatif.", 
    tags: ["Kreatif", "Content", "Modern"] 
  },
].map(t => {
  const isFree = FREE_TEMPLATES.includes(t.slug);
  const isPro = PRO_TEMPLATES.includes(t.slug);
  return {
    ...t,
    isFree,
    isPro,
    badge: isFree ? null : (isPro ? "Pro" : "Starter")
  };
});

const FILTER_CATEGORIES = ["Semua", "Korporat", "Tech", "Kreatif", "HR", "Finance", "PM", "Startup"];

function TemplatePage() {
  const [filter, setFilter] = useState("Semua");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateSlug | null>(null);

  const filtered = useMemo(
    () => {
      if (filter === "Semua") return templates;
      return templates.filter((t) => t.tags.some(tag => 
        tag.toLowerCase().includes(filter.toLowerCase()) || 
        filter.toLowerCase().includes(tag.toLowerCase())
      ));
    },
    [filter],
  );

  const preview = templates.find((t) => t.slug === previewTemplate);
  const PreviewComponent = previewTemplate ? templateComponents[previewTemplate] : null;
  const previewDataForTemplate = previewTemplate ? previewData[previewTemplate] : null;

  return (
    <>
      <PageHero
        eyebrow="Template"
        title="Template CV ATS yang teruji"
        description="Semua template format single-column, font standar, struktur heading jelas — siap lolos sistem ATS."
      />
      <div className="container-page py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {FILTER_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => {
            const TemplateComponent = templateComponents[t.slug];
            const data = previewData[t.slug];
            
            return (
              <article key={t.slug} className="group">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setPreviewTemplate(t.slug)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card p-4 transition-all group-hover:shadow-lg group-hover:-translate-y-1 cursor-pointer">
                    {/* Eye icon overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors z-10">
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    {/* Actual Template Preview */}
                    <div className="h-full overflow-hidden rounded bg-white shadow-sm" style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%" }}>
                      <div style={{ padding: "12px", fontSize: "10px", lineHeight: 1.3 }}>
                        <TemplateComponent data={data} showHeader={true} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg font-semibold">{t.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.desc}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    {t.badge && <Badge className="bg-warning text-warning-foreground shrink-0">{t.badge}</Badge>}
                  </div>
                </button>
              </article>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada template untuk kategori "{filter}".</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setFilter("Semua")}>
              Lihat semua template
            </Button>
          </div>
        )}

        {/* CTA */}
        <section className="space-y-6">
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-blue-600 border-0 text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="p-4 rounded-full bg-white/20 w-fit mx-auto mb-6">
                <Sparkles className="w-12 h-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Buatkan CV ATS-mu Sekarang!
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Tak perlu repot-edit manual. AI kami otomatis menyarankan keyword, mengoreksi struktur, dan memberi skor ATS sebelum kamu kirim lamaran.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/cv" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                >
                  <Zap className="w-5 h-5" />
                  Buat CV dengan AI
                </a>
                <a 
                  href="/template" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  Lihat Templates
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Template Preview Lightbox */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Preview: {preview?.name}</span>
              {preview?.badge && <Badge className="bg-warning text-warning-foreground">{preview.badge}</Badge>}
            </DialogTitle>
            <DialogDescription>{preview?.desc}</DialogDescription>
          </DialogHeader>

          {/* Full Template Preview in Dialog */}
          {PreviewComponent && previewDataForTemplate && (
            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div style={{ fontSize: "12px", lineHeight: 1.4 }}>
                <PreviewComponent data={previewDataForTemplate} showHeader={true} />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {preview?.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>

          <Button asChild className="w-full">
            <Link to="/register">Mulai pakai template ini — Gratis</Link>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TemplateLoading() {
  return (
    <>
      <PageHero
        eyebrow="Template"
        title="Template CV ATS yang teruji"
        description="Semua template format single-column, font standar, struktur heading jelas — siap lolos sistem ATS."
      />
      <div className="container-page py-16">
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-20 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
