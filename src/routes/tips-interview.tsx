import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Flame,
  GraduationCap,
  Laptop,
  Library,
  MessageSquare,
  Mic,
  Search,
  Sparkles,
  Star,
  Target,
  UserRoundCheck,
  Zap,
} from "lucide-react";

import { ArticleCardSkeleton } from "@/components/ui/skeleton-loading";
import { Button } from "@/components/ui/button";
import { buildSectionHead } from "@/lib/seo";
import {
  AnchorCta,
  CtaBanner,
  PageHero,
  PrimaryCta,
  SectionHeader,
  TrustChecks,
} from "@/components/site/marketing";

type IconName =
  "GraduationCap" | "MessageSquare" | "Laptop" | "CircleDollarSign" | "Sparkles" | "Target";

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  MessageSquare,
  Laptop,
  CircleDollarSign,
  Sparkles,
  Target,
};

const tips = [
  {
    slug: "persiapan-interview-pertama",
    category: "Fresh Graduate",
    title: "Persiapan Interview Pertama untuk Fresh Graduate",
    excerpt:
      "Riset perusahaan, latihan jawaban STAR, dan tips berpakaian untuk interview pertamamu.",
    icon: "GraduationCap" as IconName,
    readTime: "5 menit",
    level: "Pemula",
  },
  {
    slug: "pertanyaan-hr-umum",
    category: "HR Interview",
    title: "10 Pertanyaan HR Paling Sering Ditanyakan & Cara Jawabnya",
    excerpt:
      "Dari 'Ceritakan tentang diri Anda' sampai 'Apa kelemahan Anda', lengkap dengan contoh jawaban.",
    icon: "MessageSquare" as IconName,
    readTime: "8 menit",
    level: "Semua Level",
  },
  {
    slug: "interview-technical-tech",
    category: "Technical",
    title: "Tips Interview Technical untuk Posisi Software Engineer",
    excerpt: "Live coding, system design, dan behavioral di perusahaan tech Indonesia dan global.",
    icon: "Laptop" as IconName,
    readTime: "10 menit",
    level: "Menengah",
  },
  {
    slug: "negosiasi-gaji",
    category: "Karier",
    title: "Cara Negosiasi Gaji Tanpa Bikin Awkward",
    excerpt: "Riset salary range, framing pertanyaan, dan kapan waktu yang tepat membahas gaji.",
    icon: "CircleDollarSign" as IconName,
    readTime: "6 menit",
    level: "Semua Level",
  },
  {
    slug: "pertanyaan-balik-ke-hr",
    category: "HR Interview",
    title: "5 Pertanyaan Cerdas yang Bikin HR Terkesan",
    excerpt: "Pertanyaan yang menunjukkan kamu serius, matang, dan sudah riset perusahaan.",
    icon: "Sparkles" as IconName,
    readTime: "4 menit",
    level: "Pemula",
  },
  {
    slug: "behavioral-star-method",
    category: "Behavioral",
    title: "Metode STAR untuk Jawab Pertanyaan Behavioral",
    excerpt: "Situation, Task, Action, Result: framework jawaban yang terstruktur dan meyakinkan.",
    icon: "Target" as IconName,
    readTime: "7 menit",
    level: "Menengah",
  },
];

const categories = [
  { name: "Fresh Graduate", icon: "GraduationCap" as IconName, count: 8 },
  { name: "HR Interview", icon: "MessageSquare" as IconName, count: 12 },
  { name: "Technical", icon: "Laptop" as IconName, count: 6 },
  { name: "Karier", icon: "CircleDollarSign" as IconName, count: 10 },
  { name: "Behavioral", icon: "Target" as IconName, count: 5 },
];

const featuredTips = tips.slice(0, 2);
const perPage = 6;

export const Route = createFileRoute("/tips-interview")({
  pendingComponent: TipsLoading,
  head: ({ matches }) =>
    buildSectionHead(
      {
        title: "Tips Interview Kerja - CV Pintar",
        description:
          "Kumpulan tips interview kerja: HR, technical, behavioral, negosiasi gaji, dan strategi untuk fresh graduate sampai senior.",
        path: "/tips-interview",
        keywords:
          "tips interview kerja, persiapan interview, pertanyaan hr, interview technical, negosiasi gaji",
      },
      matches[matches.length - 1].pathname,
    ),
  component: TipsHubPage,
});

const prepSteps = [
  {
    icon: Search,
    title: "Riset dulu",
    desc: "Kenali perusahaan, role, produk, dan alasan kamu cocok untuk kebutuhan mereka.",
  },
  {
    icon: MessageSquare,
    title: "Strukturkan jawaban",
    desc: "Gunakan STAR agar jawaban tidak melebar, tetap konkret, dan mudah diikuti.",
  },
  {
    icon: UserRoundCheck,
    title: "Latih delivery",
    desc: "Jawaban bagus tetap perlu tempo, contoh, dan nada percaya diri yang natural.",
  },
] as const;

function TipsHubPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const categoryList = useMemo(
    () =>
      [...new Set(tips.map((tip) => tip.category))].map((name) => ({
        name,
        icon: categories.find((c) => c.name === name)?.icon ?? ("Sparkles" as IconName),
        count: tips.filter((tip) => tip.category === name).length,
      })),
    [],
  );
  const filtered = useMemo(
    () => (filter ? tips.filter((tip) => tip.category === filter) : tips),
    [filter],
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice(page * perPage, (page + 1) * perPage);

  if (pathname !== "/tips-interview") {
    return <Outlet />;
  }

  const chip = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
      active
        ? "bg-green-700 text-white"
        : "border border-gray-300 bg-white text-gray-800 hover:border-green-700 hover:text-green-800"
    }`;

  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Tips interview yang bisa langsung dipakai
          </>
        }
        title={
          <>
            Jawaban interview yang bagus tidak terasa dihafal.{" "}
            <span className="text-green-700">Ia terasa siap.</span>
          </>
        }
        desc="Pelajari cara menjawab HR, technical, behavioral, sampai negosiasi gaji dengan struktur yang jelas, percaya diri, dan tetap natural."
        aside={<InterviewPreview />}
      >
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <PrimaryCta to="/register">Latihan Interview dengan AI</PrimaryCta>
          <AnchorCta href="#semua-tips">Baca Tips</AnchorCta>
        </div>
        <TrustChecks
          items={[
            `${tips.length} artikel inti`,
            `${categoryList.length} kategori`,
            "Framework STAR",
          ]}
        />
      </PageHero>

      {/* Prep steps */}
      <section aria-labelledby="prep-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="prep-heading"
            eyebrow="Cara persiapan"
            title="Tiga hal yang membedakan kandidat siap dan kandidat nervous."
          />
          <ol className="grid gap-5 md:grid-cols-3">
            {prepSteps.map((item, i) => (
              <li key={item.title} className="rounded-2xl border border-gray-200 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                    <item.icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-extrabold text-green-200"
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured */}
      <section aria-labelledby="featured-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="featured-heading"
            eyebrow={
              <>
                <Flame aria-hidden="true" className="h-4 w-4" /> Wajib dibaca
              </>
            }
            title="Mulai dari artikel yang paling sering menyelamatkan kandidat."
            desc="Dua topik ini biasanya muncul paling awal: persiapan interview pertama dan pertanyaan HR umum."
          />
          <ul className="grid gap-6 md:grid-cols-2">
            {featuredTips.map((tip) => (
              <li key={tip.slug}>
                <TipCard tip={tip} featured />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* All tips with filter */}
      <section
        id="semua-tips"
        aria-labelledby="semua-heading"
        className="scroll-mt-20 py-20 lg:py-28"
      >
        <div className="container-page">
          <SectionHeader
            id="semua-heading"
            eyebrow={
              <>
                <Library aria-hidden="true" className="h-4 w-4" /> Semua tips
              </>
            }
            title="Pilih topik sesuai tahap interview-mu."
            desc="Filter topik, simpan pola jawabannya, lalu latih dengan suara agar jawabanmu terasa lebih natural."
          />

          <div
            role="group"
            aria-label="Filter tips interview"
            className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:justify-center [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              aria-pressed={filter === null}
              onClick={() => {
                setFilter(null);
                setPage(0);
              }}
              className={chip(filter === null)}
            >
              Semua
              <span className="rounded-full bg-black/10 px-1.5 text-xs">{tips.length}</span>
            </button>
            {categoryList.map((category) => {
              const Icon = iconMap[category.icon];
              const active = filter === category.name;
              return (
                <button
                  key={category.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFilter(category.name);
                    setPage(0);
                  }}
                  className={chip(active)}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {category.name}
                  <span className="rounded-full bg-black/10 px-1.5 text-xs">{category.count}</span>
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="mb-8 text-center text-sm text-gray-600">
            Menampilkan <strong className="text-gray-900">{filtered.length}</strong> artikel
            {filter && <> untuk “{filter}”</>}
          </p>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((tip) => (
              <li key={tip.slug}>
                <TipCard tip={tip} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav aria-label="Halaman tips" className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 0}
                aria-label="Halaman sebelumnya"
                className="h-11 w-11"
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              {Array.from({ length: totalPages }, (_, index) => (
                <Button
                  key={index}
                  variant={page === index ? "default" : "outline"}
                  className="h-11 w-11"
                  aria-label={`Halaman ${index + 1}`}
                  aria-current={page === index ? "page" : undefined}
                  onClick={() => setPage(index)}
                >
                  {index + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages - 1}
                aria-label="Halaman berikutnya"
                className="h-11 w-11"
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}

          {/* Pitch */}
          <aside
            aria-label="Simulasi wawancara AI"
            className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl bg-green-800 p-7 text-white sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-yellow-300">
                <Mic aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-xl font-bold">
                  Baca saja tidak cukup. Latih jawabanmu.
                </p>
                <p className="mt-1 text-sm text-green-50">
                  Simulasi Wawancara AI memberi pertanyaan, menilai jawabanmu, dan kasih feedback
                  instan.
                </p>
              </div>
            </div>
            <Link
              to="/fitur"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-yellow-300 px-6 font-bold text-gray-950 transition-colors hover:bg-yellow-200"
            >
              Lihat Fiturnya
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      <CtaBanner
        title="Interview lebih mudah saat CV, cerita, dan jawabanmu nyambung."
        desc="Rapikan CV, siapkan bukti pencapaian, lalu latih jawaban supaya kamu tidak sekadar menjawab, tapi meyakinkan."
        cta="Mulai Gratis"
        points={["CV ATS friendly", "Latihan interview AI", "Tips dari praktisi HR"]}
      />
    </div>
  );
}

function TipCard({ tip, featured = false }: { tip: (typeof tips)[number]; featured?: boolean }) {
  const Icon = iconMap[tip.icon];

  return (
    <Link
      to="/tips-interview/$slug"
      params={{ slug: tip.slug }}
      className={`group flex h-full flex-col rounded-2xl border bg-white p-6 transition-all hover:-translate-y-1 hover:border-green-600 hover:shadow-xl ${
        featured ? "border-green-200 sm:p-8" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            featured ? "bg-green-700 text-white" : "bg-green-100 text-green-800"
          }`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
          {tip.category}
        </span>
      </div>
      <h3
        className={`mt-5 font-display font-bold leading-tight text-gray-900 group-hover:text-green-800 ${
          featured ? "text-2xl" : "text-xl"
        }`}
      >
        {tip.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{tip.excerpt}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {tip.readTime}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Award className="h-4 w-4" aria-hidden="true" />
          {tip.level}
        </span>
      </div>
      <span className="mt-5 inline-flex items-center text-sm font-bold text-green-800">
        Baca tips
        <ArrowRight
          className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function InterviewPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Interview prep
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-gray-900">Metode STAR</p>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
            STAR
          </span>
        </div>
        <ol className="mt-5 grid gap-3">
          {[
            { icon: BriefcaseBusiness, title: "Situation", desc: "Konteks singkat" },
            { icon: Target, title: "Task", desc: "Tanggung jawabmu" },
            { icon: Zap, title: "Action", desc: "Langkah yang kamu ambil" },
            { icon: Star, title: "Result", desc: "Hasil yang terukur" },
          ].map((item) => (
            <li key={item.title} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold text-gray-900">
                  <span className="text-green-700">{item.title.charAt(0)}</span>
                  {item.title.slice(1)}
                </p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 rounded-xl bg-green-800 p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Mic className="h-4 w-4 text-yellow-300" aria-hidden="true" /> Latihan terbaik
          </p>
          <p className="mt-1 text-sm leading-relaxed text-green-50">
            Jawab dengan suara, rekam, lalu perbaiki bagian yang terlalu panjang atau belum punya
            bukti konkret.
          </p>
        </div>
      </div>
    </div>
  );
}

function TipsLoading() {
  return (
    <div className="overflow-x-clip bg-white">
      <section className="border-b border-gray-100">
        <div className="container-page py-16 md:py-24">
          <div className="h-9 w-64 animate-pulse rounded-full bg-gray-100" />
          <div className="mt-8 h-14 max-w-3xl animate-pulse rounded-lg bg-gray-100" />
          <div className="mt-4 h-8 max-w-2xl animate-pulse rounded-lg bg-gray-100" />
        </div>
      </section>
      <div className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
