/**
 * /belajar-skd/$slug — Detail modul belajar SKD CPNS.
 * Memakai ArticleView bersama (SEO: Article, BreadcrumbList, FAQPage dari buildArticleHead).
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Award, BookOpen, Layers } from "lucide-react";

import { ErrorState } from "@/components/site/ErrorState";
import { SkdExamples } from "@/components/belajar/SkdExamples";
import { skdExamplesBySlug } from "@/lib/skd-examples";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { ArticleView } from "@/components/blog/ArticleView";
import { buildArticleHead } from "@/lib/article-seo";
import { SKD_TOPIC_LABEL, skdModules, skdModulesBySlug, type SkdModule } from "@/lib/skd-modules";

export const Route = createFileRoute("/belajar-skd/$slug")({
  pendingComponent: ModuleSkeleton,
  loader: ({ params }) => {
    const mod = skdModulesBySlug[params.slug];
    if (!mod) throw notFound();
    return { mod };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Modul tidak ditemukan" }] };
    const { mod } = loaderData;
    const topic = SKD_TOPIC_LABEL[mod.topic].toLowerCase();
    return buildArticleHead(
      mod,
      "belajar-skd",
      `${topic} cpns, materi ${topic} skd, tips ${topic} cpns, belajar skd cpns, ${mod.title.toLowerCase()}`,
    );
  },
  component: ModulePage,
  notFoundComponent: () => (
    <ErrorState
      code="404"
      icon={BookOpen}
      eyebrow="Modul tidak ditemukan"
      title="Modul belajar ini tidak tersedia."
      description="Modul yang kamu cari sudah dipindahkan atau tidak ada. Lihat daftar modul belajar SKD lainnya."
      primary={{ label: "Lihat Semua Modul", to: "/belajar-skd" }}
      secondary={{ label: "Ke Beranda", to: "/" }}
    />
  ),
});

function ModuleSkeleton() {
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-3 h-12 w-full" />
      <Skeleton className="mt-4 h-6 w-2/3" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

function ModulePage() {
  const { mod } = Route.useLoaderData();
  const index = skdModules.findIndex((m) => m.slug === mod.slug);
  const prev = index > 0 ? skdModules[index - 1] : null;
  const next = index < skdModules.length - 1 ? skdModules[index + 1] : null;
  const examples = skdExamplesBySlug[mod.slug] ?? [];
  const related = mod.related
    .map((slug) => skdModulesBySlug[slug])
    .filter((m): m is SkdModule => Boolean(m) && m.slug !== next?.slug);

  return (
    <ArticleView
      post={mod}
      section="belajar-skd"
      related={related}
      afterBody={examples.length > 0 ? <SkdExamples examples={examples} /> : null}
      extraToc={
        examples.length > 0 ? [{ id: "contoh-soal", label: "Contoh soal & pembahasan" }] : []
      }
      meta={
        <>
          <span className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Layers aria-hidden="true" className="h-3 w-3" />
            Modul {index + 1} dari {skdModules.length}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Award aria-hidden="true" className="h-3 w-3" />
            {mod.level}
          </span>
        </>
      }
      extra={
        <nav aria-label="Navigasi modul" className="mt-12">
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${((index + 1) / skdModules.length) * 100}%` }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                to="/belajar-skd/$slug"
                params={{ slug: prev.slug }}
                className="group rounded-2xl border border-border p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <ArrowLeft className="h-3 w-3" aria-hidden /> Modul sebelumnya
                </span>
                <span className="mt-1 block font-display font-bold leading-snug group-hover:text-primary">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next ? (
              <Link
                to="/belajar-skd/$slug"
                params={{ slug: next.slug }}
                className="group rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-right transition hover:border-primary hover:shadow-md"
              >
                <span className="flex items-center justify-end gap-1 text-xs font-semibold text-primary">
                  Lanjut ke modul {index + 2} <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
                <span className="mt-1 block font-display font-bold leading-snug group-hover:text-primary">
                  {next.title}
                </span>
              </Link>
            ) : (
              <Link
                to="/belajar-skd"
                className="group rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-right transition hover:border-primary hover:shadow-md"
              >
                <span className="flex items-center justify-end gap-1 text-xs font-semibold text-primary">
                  Semua modul selesai <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
                <span className="mt-1 block font-display font-bold leading-snug group-hover:text-primary">
                  Kembali ke daftar modul
                </span>
              </Link>
            )}
          </div>
        </nav>
      }
    />
  );
}
