import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Eye, Sparkles, Target, Wand2, Zap } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildSeo } from "@/lib/seo";
import { templatesData } from "@/lib/cv-templates-data";
import {
  CtaBanner,
  PageHero,
  PrimaryCta,
  SectionHeader,
  TrustChecks,
} from "@/components/site/marketing";

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
type Template = (typeof templates)[number];

const filterCategories = [
  "Semua",
  "Gratis",
  "ATS-Friendly",
  "Kreatif",
  "Korporat",
  "Tech",
  "HR",
  "Finance",
  "PM",
  "Startup",
];

function matchesFilter(template: Template, filter: string) {
  if (filter === "Semua") return true;
  if (filter === "Gratis") return template.isFree;
  if (filter === "ATS-Friendly" || filter === "Kreatif") return template.type === filter;
  const f = filter.toLowerCase();
  return template.tags.some(
    (tag) => tag.toLowerCase().includes(f) || f.includes(tag.toLowerCase()),
  );
}

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

function PlanBadge({ template }: { template: Template }) {
  const tone =
    template.badge === "Gratis"
      ? "bg-yellow-300 text-gray-900"
      : template.badge === "Pro"
        ? "bg-gray-900 text-white"
        : "bg-green-100 text-green-800";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      {template.badge !== "Gratis" && <span className="sr-only">Paket </span>}
      {template.badge}
    </span>
  );
}

/** Scaled, non-interactive render of a template. Hidden from assistive tech. */
function TemplateThumb({ slug, scale = 0.5 }: { slug: TemplateSlug; scale?: number }) {
  const Component = templateComponents[slug as keyof typeof templateComponents];
  const data = previewData[slug as keyof typeof previewData] || previewData.jakarta;
  const size = `${100 / scale}%`;
  return (
    <div aria-hidden="true" inert className="relative h-full w-full overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute left-0 top-0"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: size,
          height: size,
        }}
      >
        <div style={{ padding: "12px", fontSize: "10px", lineHeight: 1.3 }}>
          {Component && <Component data={data} showHeader={true} />}
        </div>
      </div>
    </div>
  );
}

function TemplatePage() {
  const [filter, setFilter] = useState("Semua");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateSlug | null>(null);

  const filtered = useMemo(() => templates.filter((t) => matchesFilter(t, filter)), [filter]);

  const preview = templates.find((template) => template.slug === previewTemplate);
  const PreviewComponent = previewTemplate ? templateComponents[previewTemplate] : null;
  const previewDataForTemplate = previewTemplate ? previewData[previewTemplate] : null;
  const freeCount = templates.filter((t) => t.isFree).length;

  return (
    <>
      <div className="overflow-hidden bg-white">
        <PageHero
          eyebrow={
            <>
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {templates.length} template · {freeCount} gratis selamanya
            </>
          }
          title={
            <>
              Template CV yang bikin rekruter{" "}
              <span className="text-green-700">cepat paham & percaya.</span>
            </>
          }
          desc="Semua template bersih, terstruktur, dan aman untuk ATS. Pilih gaya yang cocok dengan target role, lalu biarkan AI merapikan isinya."
          aside={<TemplateHeroPreview />}
        >
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <PrimaryCta to="/register">Pakai Template Gratis</PrimaryCta>
            <a
              href="#koleksi-template"
              className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-8 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
            >
              Lihat Koleksi
            </a>
          </div>
          <TrustChecks items={["ATS friendly", "PDF rapi", "Bisa dibantu AI"]} />
        </PageHero>

        {/* How to choose */}
        <section aria-labelledby="pilih-heading" className="container-page relative z-10 -mt-6 lg:-mt-10">
          <h2 id="pilih-heading" className="sr-only">
            Cara memilih template
          </h2>
          <ol className="grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-lg md:grid-cols-3">
            {chooserSteps.map((step, i) => (
              <li key={step.title} className="flex gap-4 bg-white p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <step.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-800">
                    Langkah {i + 1}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Collection */}
        <section
          id="koleksi-template"
          aria-labelledby="koleksi-heading"
          className="scroll-mt-20 py-20 lg:py-28"
        >
          <div className="container-page">
            <SectionHeader
              id="koleksi-heading"
              eyebrow="Koleksi template"
              title="Bukan sekadar cantik. Bikin rekruter cepat paham."
              desc="Filter berdasarkan arah kariermu, buka preview, lalu pilih template yang paling natural untuk cerita profesionalmu."
            />

            <div className="sticky top-16 z-20 -mx-4 mb-8 border-y border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-3">
              <div
                role="group"
                aria-label="Filter template"
                className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {filterCategories.map((category) => {
                  const active = filter === category;
                  const count = templates.filter((t) => matchesFilter(t, category)).length;
                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(category)}
                      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-green-700 text-white"
                          : "border border-gray-300 bg-white text-gray-800 hover:border-green-700 hover:text-green-800"
                      }`}
                    >
                      {category}
                      <span
                        className={`rounded-full px-1.5 text-xs ${active ? "bg-green-800 text-white" : "bg-gray-100 text-gray-700"}`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p aria-live="polite" className="mb-6 text-sm font-medium text-gray-600">
              Menampilkan <strong className="text-gray-900">{filtered.length}</strong> template
              {filter !== "Semua" && <> untuk “{filter}”</>}
            </p>

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((template) => (
                <li
                  key={template.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:border-green-600 hover:shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template.slug)}
                    aria-label={`Lihat preview template ${template.name}`}
                    className="relative block aspect-[3/4] w-full bg-green-50 px-4 pb-4 pt-12 text-left"
                  >
                    <span className="absolute left-3 top-3 z-10">
                      <PlanBadge template={template} />
                    </span>
                    <span className="block h-full overflow-hidden rounded-lg shadow-sm ring-1 ring-gray-200">
                      <TemplateThumb slug={template.slug} />
                    </span>
                    <span className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/0 transition-colors group-hover:bg-gray-900/10">
                      <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <Eye aria-hidden="true" className="h-4 w-4" /> Preview
                      </span>
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-800">
                      {template.bestFor}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold text-gray-900">
                      {template.name}
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
                      {template.desc}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tag">
                      {template.tags.slice(0, 3).map((tag) => (
                        <li
                          key={tag}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                      <Button
                        asChild
                        className="h-11 rounded-lg bg-green-700 font-bold text-white hover:bg-green-800"
                      >
                        <Link to="/register" aria-label={`Pakai template ${template.name}`}>
                          Pakai Template
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPreviewTemplate(template.slug)}
                        aria-label={`Preview template ${template.name}`}
                        className="h-11 w-11 rounded-lg border-gray-300 p-0 text-gray-800 hover:border-green-700 hover:text-green-800"
                      >
                        <Eye aria-hidden="true" className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {filtered.length === 0 && (
              <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="font-medium text-gray-900">
                  Belum ada template untuk kategori “{filter}”.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 h-11 rounded-lg border-gray-300"
                  onClick={() => setFilter("Semua")}
                >
                  Lihat semua template
                </Button>
              </div>
            )}
          </div>
        </section>

        <CtaBanner
          title="Mulai dari template yang benar. Biarkan AI membuat isinya lebih tajam."
          desc="Buat CV dalam hitungan menit, cek struktur, tambah keyword, lalu export PDF yang siap dikirim."
          cta="Buat CV Sekarang"
        />
      </div>

      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="font-display text-2xl">Template {preview?.name}</DialogTitle>
              {preview && <PlanBadge template={preview} />}
            </div>
            <DialogDescription className="text-gray-600">{preview?.desc}</DialogDescription>
          </DialogHeader>

          {PreviewComponent && previewDataForTemplate && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div style={{ fontSize: "12px", lineHeight: 1.4 }}>
                <PreviewComponent data={previewDataForTemplate} showHeader={true} />
              </div>
            </div>
          )}

          <ul className="flex flex-wrap gap-1.5" aria-label="Tag">
            {preview?.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
              >
                {tag}
              </li>
            ))}
          </ul>

          <Button
            asChild
            className="h-12 w-full rounded-xl bg-green-700 text-base font-bold text-white hover:bg-green-800"
          >
            <Link to="/register">
              {preview?.isFree ? "Pakai Template Ini Gratis" : "Pakai Template Ini"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TemplateHeroPreview() {
  const fan: { slug: TemplateSlug; cls: string }[] = [
    { slug: "bali" as TemplateSlug, cls: "left-0 top-10 -rotate-6" },
    { slug: "medan" as TemplateSlug, cls: "right-0 top-10 rotate-6" },
    { slug: "jakarta" as TemplateSlug, cls: "left-1/2 top-0 z-10 -translate-x-1/2" },
  ];
  return (
    <div
      role="img"
      aria-label="Contoh tiga template CV Pintar: Bali, Medan, dan Jakarta"
      className="relative mx-auto h-[26rem] w-full max-w-md sm:h-[30rem]"
    >
      {fan.map((t) => (
        <div
          key={t.slug}
          className={`absolute aspect-[3/4] w-[58%] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl ${t.cls}`}
        >
          <TemplateThumb slug={t.slug} scale={0.42} />
        </div>
      ))}
      <div className="absolute -bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-green-800 px-4 py-2 text-sm font-bold text-white shadow-xl">
        <Sparkles className="h-4 w-4 text-yellow-300" />
        Lolos ATS · Enak dibaca manusia
      </div>
    </div>
  );
}

function TemplateLoading() {
  return (
    <div className="overflow-x-clip bg-white">
      <section className="border-b border-gray-100">
        <div className="container-page py-16 md:py-24">
          <div className="h-9 w-64 rounded-full bg-gray-100" />
          <div className="mt-8 h-14 max-w-3xl rounded-lg bg-gray-100" />
          <div className="mt-4 h-8 max-w-2xl rounded-lg bg-gray-100" />
        </div>
      </section>
      <div className="container-page py-16">
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-11 w-24 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <TemplateCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
