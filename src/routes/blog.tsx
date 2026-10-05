import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { buildSectionHead } from "@/lib/seo";
import { blogPosts } from "@/lib/blog-posts";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { ArticleCardSkeleton } from "@/components/ui/skeleton-loading";
import { CtaBanner, PageHero } from "@/components/site/marketing";

const posts = blogPosts;

export const Route = createFileRoute("/blog")({
  pendingComponent: BlogLoading,
  head: ({ matches }) =>
    buildSectionHead(
      {
        title: "Blog Karier & Tips CV ATS | CV Pintar",
        description:
          "Artikel terbaru tentang karier, lamaran kerja, dan pengembangan profesional di Indonesia.",
        path: "/blog",
        keywords: "blog karier indonesia, tips cv, panduan lamaran kerja",
      },
      matches[matches.length - 1].pathname,
    ),
  component: BlogRoute,
});

const PER_PAGE = 6;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

/** /blog/$slug is a child route — render it instead of the hub when active. */
function BlogRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/blog" && pathname !== "/blog/") return <Outlet />;
  return <BlogHubPage />;
}

function BlogHubPage() {
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Newest first.
  const sorted = useMemo(() => [...posts].sort((a, b) => b.date.localeCompare(a.date)), []);
  const categories = useMemo(() => [...new Set(posts.map((p) => p.category))], []);
  const filtered = useMemo(
    () => (filter ? sorted.filter((p) => p.category === filter) : sorted),
    [filter, sorted],
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const [featured, ...rest] = pageItems;
  const showFeatured = page === 0 && !!featured;
  const gridItems = showFeatured ? rest : pageItems;

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
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            Blog CV Pintar
          </>
        }
        title={
          <>
            Wawasan karier untuk <span className="text-green-700">profesional Indonesia.</span>
          </>
        }
        desc="Artikel praktis dari rekruter, engineer, dan profesional berpengalaman."
      />

      <section aria-labelledby="artikel-heading" className="pb-20 lg:pb-28">
        <div className="container-page">
          <h2 id="artikel-heading" className="sr-only">
            Daftar artikel
          </h2>

          <div
            role="group"
            aria-label="Filter kategori artikel"
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
              <span className="rounded-full bg-black/10 px-1.5 text-xs">{posts.length}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={filter === cat}
                onClick={() => {
                  setFilter(cat);
                  setPage(0);
                }}
                className={chip(filter === cat)}
              >
                {cat}
                <span className="rounded-full bg-black/10 px-1.5 text-xs">
                  {posts.filter((p) => p.category === cat).length}
                </span>
              </button>
            ))}
          </div>
          <p aria-live="polite" className="mb-8 text-center text-sm text-gray-600">
            Menampilkan <strong className="text-gray-900">{filtered.length}</strong> artikel
          </p>

          {showFeatured && (
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="group mb-6 grid overflow-hidden rounded-3xl bg-green-800 text-white transition-shadow hover:shadow-2xl md:grid-cols-[1.2fr_0.8fr]"
            >
              <div className="p-7 sm:p-10">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-bold text-gray-900">
                    Terbaru
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                    {featured.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-green-50">
                    <Calendar aria-hidden="true" className="h-4 w-4" />
                    <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight group-hover:underline sm:text-3xl">
                  {featured.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-green-50">{featured.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-bold text-yellow-300">
                  Baca selengkapnya
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
              <div
                aria-hidden="true"
                className="hidden items-center justify-center bg-green-900/50 p-10 md:flex"
              >
                <BookOpen className="h-24 w-24 text-green-600" />
              </div>
            </Link>
          )}

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridItems.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-green-600 hover:shadow-xl"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                      {p.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <Calendar aria-hidden="true" className="h-4 w-4" />
                      <time dateTime={p.date}>{formatDate(p.date)}</time>
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold leading-snug text-gray-900 group-hover:text-green-800">
                    {p.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{p.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-green-800">
                    Baca selengkapnya
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Halaman artikel"
              className="mt-10 flex items-center justify-center gap-2"
            >
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                aria-label="Halaman sebelumnya"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i ? "default" : "outline"}
                  className="h-11 w-11"
                  aria-label={`Halaman ${i + 1}`}
                  aria-current={page === i ? "page" : undefined}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                aria-label="Halaman berikutnya"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </nav>
          )}

          <p className="mt-12 text-center text-sm text-gray-600">
            Lebih banyak artikel segera hadir. Lihat juga{" "}
            <Link
              to="/tips-interview"
              className="font-bold text-green-800 underline underline-offset-4"
            >
              Tips Interview
            </Link>{" "}
            &{" "}
            <Link
              to="/panduan-cv-ats"
              className="font-bold text-green-800 underline underline-offset-4"
            >
              Panduan CV ATS
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaBanner
        title="Sudah baca teorinya? Saatnya praktik di CV-mu."
        desc="Terapkan tips dari artikel langsung ke CV dengan bantuan AI CV Pintar."
        cta="Buat CV Gratis"
      />
    </div>
  );
}

function BlogLoading() {
  return (
    <div className="bg-white">
      <div className="container-page py-16">
        <div className="mx-auto h-9 w-48 animate-pulse rounded-full bg-gray-100" />
        <div className="mx-auto mt-6 h-14 max-w-2xl animate-pulse rounded-lg bg-gray-100" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
