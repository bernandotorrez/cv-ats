import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { ArticleView } from "@/components/blog/ArticleView";
import { buildArticleHead } from "@/lib/article-seo";
import { tipPostsBySlug, type TipPost } from "@/lib/tips-posts";

export const Route = createFileRoute("/tips-interview/$slug")({
  pendingComponent: TipDetailSkeleton,
  loader: ({ params }) => {
    const tip = tipPostsBySlug[params.slug];
    if (!tip) throw notFound();
    return { tip, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Tips tidak ditemukan" }] };
    const { tip } = loaderData;
    return buildArticleHead(
      tip,
      "tips-interview",
      `tips interview ${tip.category.toLowerCase()}, ${tip.title.toLowerCase()}`,
    );
  },
  component: TipDetailPage,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Tips tidak ditemukan</h1>
      <p className="mt-2 text-muted-foreground">Artikel yang kamu cari tidak tersedia.</p>
      <Button asChild className="mt-6">
        <Link to="/tips-interview">Kembali ke Tips Interview</Link>
      </Button>
    </div>
  ),
});

function TipDetailSkeleton() {
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

function TipDetailPage() {
  const { tip } = Route.useLoaderData();
  const related = tip.related
    .map((slug) => tipPostsBySlug[slug])
    .filter((p): p is TipPost => Boolean(p));
  return (
    <ArticleView
      post={tip}
      section="tips-interview"
      related={related}
      meta={
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Award aria-hidden="true" className="h-3 w-3" />
          {tip.level}
        </span>
      }
    />
  );
}
