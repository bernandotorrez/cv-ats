import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  LayoutTemplate,
  LockKeyhole,
  MousePointer2,
  Sparkles,
  Star,
  Target,
  Wand2,
  Zap,
} from "lucide-react";

import { BandungTemplate } from "@/components/cv/templates/BandungTemplate";
import { BaliTemplate } from "@/components/cv/templates/BaliTemplate";
import { JakartaTemplate } from "@/components/cv/templates/JakartaTemplate";
import { MakassarTemplate } from "@/components/cv/templates/MakassarTemplate";
import { MedanTemplate } from "@/components/cv/templates/MedanTemplate";
import { SemarangTemplate } from "@/components/cv/templates/SemarangTemplate";
import { SurabayaTemplate } from "@/components/cv/templates/SurabayaTemplate";
import { YogyaTemplate } from "@/components/cv/templates/YogyaTemplate";
import { MalangTemplate } from "@/components/cv/templates/MalangTemplate";
import { UbudTemplate } from "@/components/cv/templates/UbudTemplate";
import { BogorTemplate } from "@/components/cv/templates/BogorTemplate";
import { previewData, type TemplateSlug } from "@/components/site/TemplatePreview";
import { TemplateCardSkeleton } from "@/components/ui/skeleton-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildSeo } from "@/lib/seo";
import { templatesData } from "@/lib/cv-templates-data";

const templateComponents = {
  bali: BaliTemplate,
  jakarta: JakartaTemplate,
  makassar: MakassarTemplate,
  bandung: BandungTemplate,
  medan: MedanTemplate,
  semarang: SemarangTemplate,
  surabaya: SurabayaTemplate,
  yogya: YogyaTemplate,
  malang: MalangTemplate,
  ubud: UbudTemplate,
  bogor: BogorTemplate,
};

const FREE_TEMPLATES = ["jakarta", "bandung"];
const PRO_TEMPLATES = ["semarang", "surabaya", "malang", "ubud"];

export const Route = createFileRoute("/template")({
  pendingComponent: TemplateLoading,
  head: () =>
    buildSeo({
      title: "Template CV ATS Gratis - CV Pintar",
      description:
        "Pilih template CV ATS friendly yang rapi, modern, dan siap dipakai untuk fresh graduate, profesional, tech, finance, HR, hingga creative role.",
      path: "/template",
      keywords:
        "template cv ats, contoh cv ats, template cv gratis, template cv fresh graduate, template cv profesional",
    }),
  component: TemplatePage,
});

const templates = templatesData;

const filterCategories = ["Semua", "Korporat", "Tech", "Kreatif", "HR", "Finance", "PM", "Startup"];

const trustPoints = [
  { icon: BadgeCheck, label: "ATS friendly" },
  { icon: LockKeyhole, label: "Struktur aman" },
  { icon: FileText, label: "PDF rapi" },
  { icon: Sparkles, label: "Bisa dibantu AI" },
] as const;

const chooserSteps = [
  {
    icon: Target,
    title: "Pilih sesuai target",
    desc: "Mulai dari industri dan karakter posisi, bukan sekadar warna yang kamu suka.",
  },
  {
    icon: Wand2,
    title: "Isi dengan AI",
    desc: "Ubah pengalaman kerja menjadi bullet yang lebih tajam dalam Indonesia atau Inggris.",
  },
  {
    icon: Zap,
    title: "Export dan kirim",
    desc: "Download PDF yang ringan, bersih, dan siap dibaca ATS maupun rekruter.",
  },
] as const;

function TemplatePage() {
  const [filter, setFilter] = useState("Semua");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateSlug | null>(null);

  const filtered = useMemo(() => {
    if (filter === "Semua") return templates;

    return templates.filter((template) =>
      template.tags.some(
        (tag) =>
          tag.toLowerCase().includes(filter.toLowerCase()) ||
          filter.toLowerCase().includes(tag.toLowerCase()),
      ),
    );
  }, [filter]);

  const preview = templates.find((template) => template.slug === previewTemplate);
  const PreviewComponent = previewTemplate ? templateComponents[previewTemplate] : null;
  const previewDataForTemplate = previewTemplate ? previewData[previewTemplate] : null;

  return (
    <>
      <main className="overflow-x-clip bg-background">
        <section className="border-b border-border/70">
          <div className="container-page grid gap-12 py-16 md:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] md:items-center md:py-24">
            <div>
              <Badge className="mb-6 gap-2 border-yellow-200 bg-yellow-100 px-4 py-2 text-sm text-yellow-950 shadow-sm hover:bg-yellow-100">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Template CV yang siap diajak kerja keras
              </Badge>

              <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] text-foreground sm:text-5xl lg:text-6xl">
                Pilih template yang bikin isi CV kamu lebih mudah dipercaya.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Semua template dibuat bersih, terstruktur, dan aman untuk ATS. Tinggal pilih gaya
                yang paling cocok dengan target role, lalu biarkan AI membantu merapikan isinya.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link to="/register">
                    Pakai template gratis
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                  <a href="#koleksi-template">Lihat koleksi</a>
                </Button>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {trustPoints.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border bg-card p-3 text-sm font-semibold text-foreground shadow-sm"
                  >
                    <item.icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                    <dt>{item.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <TemplateHeroPreview />
          </div>
        </section>

        <section className="container-page py-14 md:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            {chooserSteps.map((step, index) => (
              <Card key={step.title} className="border-border/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground">{step.title}</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="koleksi-template" className="bg-muted/45 py-16 md:py-24">
          <div className="container-page">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4 gap-2 px-3 py-1.5">
                <LayoutTemplate className="h-4 w-4" aria-hidden="true" />
                Koleksi template
              </Badge>
              <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Bukan sekadar cantik. Template ini membantu rekruter cepat paham.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Filter berdasarkan arah kariermu, buka preview, lalu pilih template yang terasa
                paling natural untuk cerita profesionalmu.
              </p>
            </div>

            <div className="mt-10 rounded-xl border border-border bg-background p-3 shadow-sm">
              <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-muted-foreground">
                <Filter className="h-4 w-4" aria-hidden="true" />
                Filter template
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="group"
                aria-label="Filter template"
              >
                {filterCategories.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={filter === category ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    aria-pressed={filter === category}
                    onClick={() => setFilter(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((template) => {
                const TemplateComponent = templateComponents[template.slug as keyof typeof templateComponents];
                const data = (previewData as any)[template.slug] || (previewData as any).jakarta;

                return (
                  <article key={template.slug} className="group">
                    <Card className="h-full overflow-hidden border-border/80 bg-card shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
                      <CardContent className="flex h-full flex-col p-0">
                        <button
                          type="button"
                          className="relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label={`Preview template ${template.name}`}
                          onClick={() => setPreviewTemplate(template.slug)}
                        >
                          <div className="relative aspect-[3/4] overflow-hidden bg-[#eef4ec] p-4">
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/0 transition group-hover:bg-foreground/10">
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-foreground opacity-0 shadow-lg transition group-hover:opacity-100">
                                <Eye className="h-5 w-5" aria-hidden="true" />
                              </span>
                            </div>
                            <div className="relative h-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-border">
                              <div
                                className="absolute left-0 top-0"
                                style={{
                                  transform: "scale(0.5)",
                                  transformOrigin: "top left",
                                  width: "200%",
                                  height: "200%",
                                }}
                              >
                                <div style={{ padding: "12px", fontSize: "10px", lineHeight: 1.3 }}>
                                  <TemplateComponent data={data} showHeader={true} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>

                        <div className="flex flex-1 flex-col p-5">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                                {template.bestFor}
                              </p>
                              <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                                {template.name}
                              </h3>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <Badge
                                className={
                                  template.isFree
                                    ? "border-emerald-200 bg-emerald-100 text-emerald-950 hover:bg-emerald-100"
                                    : "border-yellow-200 bg-yellow-100 text-yellow-950 hover:bg-yellow-100"
                                }
                              >
                                {template.badge}
                              </Badge>
                              <MousePointer2
                                className="h-5 w-5 text-muted-foreground"
                                aria-hidden="true"
                              />
                            </div>
                          </div>
                          <p className="leading-7 text-muted-foreground">{template.desc}</p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-6 w-full"
                            onClick={() => setPreviewTemplate(template.slug)}
                          >
                            Preview template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </article>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="mt-10 rounded-xl border border-border bg-background p-8 text-center shadow-sm">
                <p className="font-medium text-foreground">
                  Belum ada template untuk kategori "{filter}".
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setFilter("Semua")}
                >
                  Lihat semua template
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <div className="grid gap-8 rounded-2xl border border-border bg-primary p-6 text-primary-foreground shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <Badge className="mb-5 border-white/25 bg-white/15 text-white hover:bg-white/15">
                Siap mulai
              </Badge>
              <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight md:text-4xl">
                Mulai dari template yang benar. Biarkan AI membuat isinya lebih tajam.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-primary-foreground/85">
                Buat CV dalam hitungan menit, cek struktur, tambah keyword, lalu export PDF yang
                siap dikirim.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6 text-base">
                <Link to="/register">
                  Buat CV sekarang
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/45 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#koleksi-template">Bandingkan template</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle>Preview: {preview?.name}</DialogTitle>
              {preview?.badge && (
                <Badge
                  className={
                    preview.isFree
                      ? "border-emerald-200 bg-emerald-100 text-emerald-950 hover:bg-emerald-100"
                      : "border-yellow-200 bg-yellow-100 text-yellow-950 hover:bg-yellow-100"
                  }
                >
                  {preview.badge}
                </Badge>
              )}
            </div>
            <DialogDescription>{preview?.desc}</DialogDescription>
          </DialogHeader>

          {PreviewComponent && previewDataForTemplate && (
            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div style={{ fontSize: "12px", lineHeight: 1.4 }}>
                <PreviewComponent data={previewDataForTemplate} showHeader={true} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {preview?.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <Button asChild className="w-full">
            <Link to="/register">
              Pakai template ini gratis
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TemplateHeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -right-4 -top-4 hidden rounded-lg bg-yellow-100 px-4 py-3 text-sm font-bold text-yellow-950 shadow-sm sm:block">
        8 gaya, 1 tujuan: lebih cepat dipahami
      </div>
      <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Template matcher
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-foreground">CV Pintar</h2>
              </div>
              <Badge className="bg-primary text-primary-foreground">ATS-ready</Badge>
            </div>

            <div className="space-y-3">
              {[
                { icon: BriefcaseBusiness, title: "Corporate", desc: "Jakarta, Medan" },
                { icon: BookOpenCheck, title: "Creative", desc: "Bali, Yogyakarta" },
                { icon: LayoutTemplate, title: "Operations", desc: "Makassar, Surabaya" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-lg bg-muted/70 p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-primary p-5 text-primary-foreground">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <p className="font-bold">Rekomendasi cepat</p>
              </div>
              <p className="leading-7 text-primary-foreground/90">
                Untuk lamaran pertama, pilih template yang paling mudah dibaca. Gaya bisa menyusul,
                kejelasan harus menang dulu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateLoading() {
  return (
    <main className="overflow-x-clip bg-background">
      <section className="border-b border-border/70">
        <div className="container-page py-16 md:py-24">
          <div className="h-9 w-64 rounded-full bg-muted" />
          <div className="mt-8 h-14 max-w-3xl rounded-lg bg-muted" />
          <div className="mt-4 h-8 max-w-2xl rounded-lg bg-muted" />
        </div>
      </section>
      <div className="container-page py-16">
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <TemplateCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
