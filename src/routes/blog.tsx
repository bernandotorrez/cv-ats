import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArticleCardSkeleton } from "@/components/ui/skeleton-loading";

const posts = [
  {
    slug: "apa-itu-cv-ats",
    category: "CV & Karier",
    title: "Apa Itu CV ATS Friendly dan Kenapa Penting?",
    excerpt:
      "Pelajari apa itu Applicant Tracking System, bagaimana cara kerjanya, dan kenapa CV kamu harus lolos screening ATS.",
    date: "2026-04-15",
  },
  {
    slug: "keyword-cv-ats",
    category: "CV & Karier",
    title: "Cara Riset Keyword untuk CV ATS Friendly",
    excerpt:
      "Panduan lengkap riset keyword dari job description agar CV kamu muncul di pencarian rekruter.",
    date: "2026-04-20",
  },
  {
    slug: "template-cv-gratis-vs-premium",
    category: "CV & Karier",
    title: "Template CV Gratis vs Premium: Mana yang Kamu Butuhkan?",
    excerpt:
      "Perbandingan jujur template CV gratis dan premium, plus tips memilih yang tepat untuk jenjang kariermu.",
    date: "2026-04-25",
  },
  {
    slug: "cara-menulis-ringkasan-cv",
    category: "CV & Karier",
    title: "Cara Menulis Ringkasan CV yang Bikin Rekruter Berhenti Scroll",
    excerpt:
      "Ringkasan profil adalah bagian paling krusial di CV. Pelajari formula menulis ringkasan yang memikat.",
    date: "2026-05-01",
  },
];

export const Route = createFileRoute("/blog")({
  pendingComponent: BlogLoading,
  head: () =>
    buildSeo({
      title: "Blog — CV Pintar",
      description:
        "Artikel terbaru tentang karier, lamaran kerja, dan pengembangan profesional di Indonesia.",
      path: "/blog",
      keywords: "blog karier indonesia, tips cv, panduan lamaran kerja",
    }),
  component: BlogHubPage,
});

const PER_PAGE = 6;

function BlogHubPage() {
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const categories = useMemo(() => [...new Set(posts.map((p) => p.category))], []);
  const filtered = useMemo(
    () => (filter ? posts.filter((p) => p.category === filter) : posts),
    [filter],
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Wawasan karier untuk profesional Indonesia"
        description="Artikel praktis dari rekruter, engineer, dan profesional berpengalaman."
      />
      <div className="container-page py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={filter === null ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(null);
              setPage(0);
            }}
          >
            Semua
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(cat);
                setPage(0);
              }}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {pageItems.map((p) => (
            <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group block">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{p.category}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-primary">
                    {p.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    Baca selengkapnya <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
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

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Lebih banyak artikel segera hadir. Lihat juga{" "}
            <Link to="/tips-interview" className="text-primary underline">
              Tips Interview
            </Link>{" "}
            &{" "}
            <Link to="/panduan-cv-ats" className="text-primary underline">
              Panduan CV ATS
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}

function BlogLoading() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Wawasan karier untuk profesional Indonesia"
        description="Artikel praktis dari rekruter, engineer, dan profesional berpengalaman."
      />
      <div className="container-page py-16">
        <div className="flex flex-wrap gap-2 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-20 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
