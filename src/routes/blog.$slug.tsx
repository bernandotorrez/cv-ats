import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { ArticleView } from "@/components/blog/ArticleView";
import { blogPostsBySlug, type BlogPost } from "@/lib/blog-posts";
import { buildArticleHead } from "@/lib/article-seo";

export const Route = createFileRoute("/blog/$slug")({
  pendingComponent: ArticleDetailSkeleton,
  loader: ({ params }) => {
    const post = blogPostsBySlug[params.slug];
    if (!post) throw notFound();
    return { post, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Artikel tidak ditemukan" }] };
    return buildArticleHead(loaderData.post, "blog");
  },
  component: BlogArticlePage,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Artikel tidak ditemukan</h1>
      <Button asChild className="mt-6">
        <Link to="/blog">Kembali ke Blog</Link>
      </Button>
    </div>
  ),
});

function ArticleDetailSkeleton() {
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-3 h-10 w-full" />
      <Skeleton className="mt-4 h-6 w-2/3" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

function BlogArticlePage() {
  const { post } = Route.useLoaderData();
  const related = post.related
    .map((slug) => blogPostsBySlug[slug])
    .filter((p): p is BlogPost => Boolean(p));
  return <ArticleView post={post} section="blog" related={related} />;
}
