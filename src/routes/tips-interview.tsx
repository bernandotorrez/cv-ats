import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  BookOpen,
  Target,
  Zap,
  Award,
  Lightbulb,
  GraduationCap,
  MessageSquare,
  Laptop,
  CircleDollarSign,
  Sparkles,
  Flame,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ArticleCardSkeleton } from "@/components/ui/skeleton-loading";

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
    color: "from-blue-500/10 to-cyan-500/10",
    borderColor: "hover:border-blue-300",
  },
  {
    slug: "pertanyaan-hr-umum",
    category: "HR Interview",
    title: "10 Pertanyaan HR Paling Sering Ditanyakan & Cara Jawabnya",
    excerpt:
      "Dari 'Ceritakan tentang diri Anda' sampai 'Apa kelemahan Anda' — lengkap dengan contoh jawaban.",
    icon: "MessageSquare" as IconName,
    readTime: "8 menit",
    level: "Semua Level",
    color: "from-purple-500/10 to-pink-500/10",
    borderColor: "hover:border-purple-300",
  },
  {
    slug: "interview-technical-tech",
    category: "Technical",
    title: "Tips Interview Technical untuk Posisi Software Engineer",
    excerpt:
      "Live coding, system design, dan behavioral di perusahaan tech Indonesia & global.",
    icon: "Laptop" as IconName,
    readTime: "10 menit",
    level: "Menengah",
    color: "from-green-500/10 to-emerald-500/10",
    borderColor: "hover:border-green-300",
  },
  {
    slug: "negosiasi-gaji",
    category: "Karier",
    title: "Cara Negosiasi Gaji Tanpa Bikin Awkward",
    excerpt:
      "Riset salary range, framing pertanyaan, dan kapan waktu yang tepat membahas gaji.",
    icon: "CircleDollarSign" as IconName,
    readTime: "6 menit",
    level: "Semua Level",
    color: "from-amber-500/10 to-orange-500/10",
    borderColor: "hover:border-amber-300",
  },
  {
    slug: "pertanyaan-balik-ke-hr",
    category: "HR Interview",
    title: "5 Pertanyaan Cerdas yang Bikin HR Terkesan",
    excerpt:
      "Pertanyaan yang menunjukkan kamu serius dan sudah riset perusahaan.",
    icon: "Sparkles" as IconName,
    readTime: "4 menit",
    level: "Pemula",
    color: "from-rose-500/10 to-red-500/10",
    borderColor: "hover:border-rose-300",
  },
  {
    slug: "behavioral-star-method",
    category: "Behavioral",
    title: "Metode STAR untuk Jawab Pertanyaan Behavioral",
    excerpt:
      "Situation, Task, Action, Result — framework jawaban yang terstruktur dan meyakinkan.",
    icon: "Target" as IconName,
    readTime: "7 menit",
    level: "Menengah",
    color: "from-indigo-500/10 to-violet-500/10",
    borderColor: "hover:border-indigo-300",
  },
];

const featuredTips = tips.slice(0, 2);

const categories = [
  { name: "Fresh Graduate", icon: "GraduationCap" as IconName, count: 8, color: "text-blue-600" },
  { name: "HR Interview", icon: "MessageSquare" as IconName, count: 12, color: "text-purple-600" },
  { name: "Technical", icon: "Laptop" as IconName, count: 6, color: "text-green-600" },
  { name: "Karier", icon: "CircleDollarSign" as IconName, count: 10, color: "text-amber-600" },
  { name: "Behavioral", icon: "Target" as IconName, count: 5, color: "text-indigo-600" },
];

function TipIcon({ name }: { name: IconName }) {
  const Icon = iconMap[name];
  return Icon ? <Icon className="w-full h-full" /> : null;
}

export const Route = createFileRoute("/tips-interview")({
  pendingComponent: TipsLoading,
  head: () =>
    buildSeo({
      title: "Tips & Trik Interview Kerja — CV Pintar",
      description:
        "Kumpulan tips interview kerja: HR, technical, behavioral, negosiasi gaji, dan strategi untuk fresh graduate sampai senior.",
      path: "/tips-interview",
      keywords:
        "tips interview kerja, persiapan interview, pertanyaan hr, interview technical, negosiasi gaji",
    }),
  component: TipsHubPage,
});

const PER_PAGE = 6;

function TipsHubPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/tips-interview") {
    return <Outlet />;
  }

  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const categoryList = useMemo(
    () => [...new Set(tips.map((t) => t.category))],
    [],
  );
  const filtered = useMemo(
    () => (filter ? tips.filter((t) => t.category === filter) : tips),
    [filter],
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <>
      <PageHero
        eyebrow="Tips Interview"
        title="Kuasai Interview, Raih Posisi Impian!"
        description="Strategi jitu dari rekruter & profesional Indonesia. Langsung praktik, langsung hasil."
      />

      <div className="container-page py-12 space-y-16">
        {/* Featured Tips */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl md:text-3xl font-bold">
                <Flame className="w-7 h-7 text-orange-500" />
                Tips Wajib Dibaca
              </h2>
              <p className="text-muted-foreground mt-1">
                Artikel paling populer minggu ini
              </p>
            </div>
            <Badge variant="outline" className="hidden md:flex items-center gap-1">
              <Star className="w-3 h-3" />
              Featured
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredTips.map((t) => (
              <Link
                key={t.slug}
                to="/tips-interview/$slug"
                params={{ slug: t.slug }}
                className="group block"
              >
                <Card
                  className={cn(
                    "h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2",
                    t.borderColor,
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br text-3xl w-16 h-16",
                          t.color,
                        )}
                      >
                        <TipIcon name={t.icon} />
                      </div>
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">
                          {t.category}
                        </Badge>
                        <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors">
                          {t.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {t.excerpt}
                        </p>
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.readTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {t.level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-6">
          <div>
            <h2 className="flex items-center gap-2 text-2xl md:text-3xl font-bold">
              <Library className="w-7 h-7 text-primary" />
              Semua Kategori
            </h2>
            <p className="text-muted-foreground mt-1">
              Pilih topik yang kamu butuhkan
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map((cat, i) => (
              <Card
                key={i}
                className="hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-9 h-9 text-primary">
                      <TipIcon name={cat.icon} />
                    </div>
                  </div>
                  <h3 className={cn("font-semibold text-sm", cat.color)}>
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.count} artikel
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* All Tips Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl md:text-3xl font-bold">
                <BookOpen className="w-7 h-7 text-primary" />
                Semua Tips Interview
              </h2>
              <p className="text-muted-foreground mt-1">
                {tips.length} artikel tersedia
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(null);
                setPage(0);
              }}
              className="gap-1"
            >
              <BookOpen className="w-4 h-4" />
              Semua
            </Button>
            {categoryList.map((cat) => {
              const catInfo = categories.find((c) => c.name === cat);
              if (!catInfo) return null;
              const CatIcon = iconMap[catInfo.icon];
              return (
                <Button
                  key={cat}
                  variant={filter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter(cat);
                    setPage(0);
                  }}
                  className="gap-1"
                >
                  {CatIcon && <CatIcon className="w-4 h-4" />}
                  {cat}
                </Button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((t) => (
              <Link
                key={t.slug}
                to="/tips-interview/$slug"
                params={{ slug: t.slug }}
                className="group block"
              >
                <Card
                  className={cn(
                    "h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2",
                    t.borderColor,
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">{t.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t.readTime}
                      </span>
                    </div>
                    <div className="flex justify-center mb-3 w-10 h-10 text-foreground">
                      <TipIcon name={t.icon} />
                    </div>
                    <h3 className="font-bold leading-snug group-hover:text-primary transition-colors">
                      {t.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {t.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {t.level}
                      </span>
                      <span className="inline-flex items-center text-sm font-medium text-primary">
                        Baca
                        <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="space-y-6">
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-blue-600 border-0 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI2Ii8+PGNpcmNsZSBjeD0iMCIgY3k9IjYwIiByPSI2Ii8+PGNpcmNsZSBjeD0iMzAiIGN5PSIwIiByPSI2Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            <CardContent className="p-10 md:p-12 text-center relative z-10">
              <div className="p-4 rounded-full bg-white/20 w-fit mx-auto mb-6">
                <Lightbulb className="w-12 h-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Taklukkan Interview?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Setelah baca tips, praktikkan dengan CV yang sudah dioptimasi
                ATS. kami bantu dari awal sampai diterima!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                >
                  <Link to="/cv" className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Buat CV ATS Sekarang
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 bg-transparent"
                >
                  <Link to="/panduan-cv-ats" className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Panduan CV ATS
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

function TipsLoading() {
  return (
    <>
      <PageHero
        eyebrow="Tips Interview"
        title="Kuasai Interview, Raih Posisi Impian!"
        description="Strategi jitu dari rekruter & profesional Indonesia. Langsung praktik, langsung hasil."
      />
      <div className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
