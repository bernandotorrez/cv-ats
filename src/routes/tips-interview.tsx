import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Filter,
  Flame,
  GraduationCap,
  Laptop,
  Library,
  Lightbulb,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

type IconName =
  | "GraduationCap"
  | "MessageSquare"
  | "Laptop"
  | "CircleDollarSign"
  | "Sparkles"
  | "Target";

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
  head: () =>
    buildSeo({
      title: "Tips Interview Kerja - CV Pintar",
      description:
        "Kumpulan tips interview kerja: HR, technical, behavioral, negosiasi gaji, dan strategi untuk fresh graduate sampai senior.",
      path: "/tips-interview",
      keywords:
        "tips interview kerja, persiapan interview, pertanyaan hr, interview technical, negosiasi gaji",
    }),
  component: TipsHubPage,
});

function TipsHubPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const categoryList = useMemo(() => [...new Set(tips.map((tip) => tip.category))], []);
  const filtered = useMemo(
    () => (filter ? tips.filter((tip) => tip.category === filter) : tips),
    [filter],
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice(page * perPage, (page + 1) * perPage);

  if (pathname !== "/tips-interview") {
    return <Outlet />;
  }

  return (
    <main className="overflow-x-clip bg-background">
      <section className="border-b border-border/70">
        <div className="container-page grid gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)] md:items-center md:py-24">
          <div>
            <Badge className="mb-6 gap-2 border-yellow-200 bg-yellow-100 px-4 py-2 text-sm text-yellow-950 shadow-sm hover:bg-yellow-100">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Tips interview yang bisa langsung dipakai
            </Badge>

            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] text-foreground sm:text-5xl lg:text-6xl">
              Jawaban interview yang bagus tidak terasa dihafal. Ia terasa siap.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Pelajari cara menjawab HR, technical, behavioral, sampai negosiasi gaji dengan
              struktur yang jelas, percaya diri, dan tetap natural.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <a href="#semua-tips">
                  Mulai belajar
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link to="/register">Latihan dengan AI</Link>
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-3">
              {[
                ["6", "artikel inti"],
                ["5", "kategori"],
                ["STAR", "framework"],
              ].map(([stat, label]) => (
                <div key={label} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                  <dt className="font-display text-xl font-bold text-foreground">{stat}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <InterviewPreview />
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
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
          ].map((item) => (
            <Card key={item.title} className="border-border/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">{item.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Wajib dibaca"
            title="Mulai dari artikel yang paling sering menyelamatkan kandidat."
            desc="Dua topik ini biasanya muncul paling awal: persiapan interview pertama dan pertanyaan HR umum."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {featuredTips.map((tip) => (
              <TipCard key={tip.slug} tip={tip} featured />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4 gap-2 px-3 py-1.5">
              <Library className="h-4 w-4" aria-hidden="true" />
              Kategori
            </Badge>
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Pilih topik sesuai tahap interview-mu.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Kamu bisa mulai dari HR interview, technical, behavioral, atau langsung belajar
              negosiasi gaji.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((category) => {
              const Icon = iconMap[category.icon];
              return (
                <button
                  key={category.name}
                  type="button"
                  className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => {
                    setFilter(category.name);
                    setPage(0);
                  }}
                >
                  <Icon className="mb-4 h-7 w-7 text-primary" aria-hidden="true" />
                  <span className="block font-bold text-foreground">{category.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {category.count} artikel
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="semua-tips" className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Semua tips"
            title="Baca yang kamu butuhkan, praktikkan sebelum jadwal interview."
            desc="Filter topik, simpan pola jawabannya, lalu latih dengan suara agar jawabanmu terasa lebih natural."
          />

          <div className="mt-10 rounded-xl border border-border bg-background p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-muted-foreground">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filter topik
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filter tips interview"
            >
              <Button
                type="button"
                variant={filter === null ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                aria-pressed={filter === null}
                onClick={() => {
                  setFilter(null);
                  setPage(0);
                }}
              >
                Semua
              </Button>
              {categoryList.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={filter === category ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  aria-pressed={filter === category}
                  onClick={() => {
                    setFilter(category);
                    setPage(0);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((tip) => (
              <TipCard key={tip.slug} tip={tip} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 0}
                aria-label="Halaman sebelumnya"
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              {Array.from({ length: totalPages }, (_, index) => (
                <Button
                  key={index}
                  variant={page === index ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-9"
                  aria-label={`Halaman ${index + 1}`}
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
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <Badge className="mb-5 bg-primary text-primary-foreground">Langkah berikutnya</Badge>
            <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Interview lebih mudah saat CV, cerita, dan jawabanmu nyambung.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Rapikan CV, siapkan bukti pencapaian, lalu latih jawaban supaya kamu tidak sekadar
              menjawab, tapi meyakinkan.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/register">
                Latihan dengan AI
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <Link to="/panduan-cv-ats">Panduan CV ATS</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function TipCard({ tip, featured = false }: { tip: (typeof tips)[number]; featured?: boolean }) {
  const Icon = iconMap[tip.icon];

  return (
    <Link to="/tips-interview/$slug" params={{ slug: tip.slug }} className="group block h-full">
      <Card
        className={`h-full border-border/80 bg-card shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lg ${
          featured ? "md:min-h-[260px]" : ""
        }`}
      >
        <CardContent className="flex h-full flex-col p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <Badge variant="secondary">{tip.category}</Badge>
          </div>
          <h3 className="font-display text-xl font-bold leading-tight text-foreground transition group-hover:text-primary">
            {tip.title}
          </h3>
          <p className="mt-3 flex-1 leading-7 text-muted-foreground">{tip.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {tip.readTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-4 w-4" aria-hidden="true" />
              {tip.level}
            </span>
          </div>
          <div className="mt-5 inline-flex items-center font-semibold text-primary">
            Baca tips
            <ArrowRight
              className="ml-2 h-4 w-4 transition group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function InterviewPreview() {
  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Interview prep
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Jawaban siap</h2>
            </div>
            <Badge className="bg-primary text-primary-foreground">STAR</Badge>
          </div>

          <div className="space-y-3">
            {[
              { icon: BriefcaseBusiness, title: "Situation", desc: "Konteks singkat" },
              { icon: Target, title: "Task", desc: "Tanggung jawabmu" },
              { icon: Zap, title: "Action", desc: "Langkah yang kamu ambil" },
              { icon: Star, title: "Result", desc: "Hasil yang terukur" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-lg bg-muted/70 p-4">
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
            <div className="mb-2 flex items-center gap-2">
              <Mic className="h-5 w-5" aria-hidden="true" />
              <p className="font-bold">Latihan terbaik</p>
            </div>
            <p className="leading-7 text-primary-foreground/90">
              Jawab dengan suara, rekam, lalu perbaiki bagian yang terlalu panjang atau belum punya
              bukti konkret.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionIntro({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Badge variant="secondary" className="mb-4 px-3 py-1.5">
        {eyebrow}
      </Badge>
      <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{desc}</p>
    </div>
  );
}

function TipsLoading() {
  return (
    <main className="overflow-x-clip bg-background">
      <section className="border-b border-border/70">
        <div className="container-page py-16 md:py-24">
          <div className="h-9 w-64 animate-pulse rounded-full bg-muted" />
          <div className="mt-8 h-14 max-w-3xl animate-pulse rounded-lg bg-muted" />
          <div className="mt-4 h-8 max-w-2xl animate-pulse rounded-lg bg-muted" />
        </div>
      </section>
      <div className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
