import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { buildSeo, fitDescription, fitTitle, SITE_URL } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { RichText } from "@/components/blog/RichText";
import {
  blogPostsBySlug,
  headingId,
  readingMinutes,
  type BlogBlock,
  type BlogPost,
} from "@/lib/blog-posts";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

function articleWordCount(post: BlogPost): number {
  return post.body
    .map((b) => (b.t === "ul" || b.t === "ol" ? b.items.join(" ") : "text" in b ? b.text : ""))
    .join(" ")
    .split(/\s+/).length;
}

export const Route = createFileRoute("/blog/$slug")({
  pendingComponent: ArticleDetailSkeleton,
  loader: ({ params }) => {
    const post = blogPostsBySlug[params.slug];
    if (!post) throw notFound();
    return { post, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Artikel tidak ditemukan" }] };
    const { post, slug } = loaderData;
    const url = `${SITE_URL}/blog/${slug}`;
    return buildSeo({
      title: fitTitle(post.title),
      description: fitDescription(post.excerpt),
      path: `/blog/${slug}`,
      type: "article",
      articlePublishedTime: post.date,
      articleModifiedTime: post.updated,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          articleSection: post.category,
          datePublished: post.date,
          dateModified: post.updated,
          inLanguage: "id-ID",
          wordCount: articleWordCount(post),
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          author: { "@type": "Organization", name: "CV Pintar", url: SITE_URL },
          publisher: { "@type": "Organization", name: "CV Pintar", url: SITE_URL },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    });
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

function Block({ block }: { block: BlogBlock }) {
  switch (block.t) {
    case "h2":
      return (
        <h2
          id={headingId(block.text)}
          className="mt-10 scroll-mt-24 font-display text-2xl font-bold leading-snug"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 className="mt-6 font-display text-lg font-bold">{block.text}</h3>;
    case "ul":
      return (
        <ul className="list-disc space-y-2 pl-6 marker:text-primary">
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-primary">
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <aside className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="font-display font-bold text-foreground">{block.title}</p>
          <p className="mt-1.5 text-[15px] leading-relaxed">
            <RichText text={block.text} />
          </p>
        </aside>
      );
    default:
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
  }
}

function BlogArticlePage() {
  const { post } = Route.useLoaderData();
  const headings = post.body.filter((b): b is Extract<BlogBlock, { t: "h2" }> => b.t === "h2");
  const related = post.related
    .map((slug) => blogPostsBySlug[slug])
    .filter((p): p is BlogPost => Boolean(p));
  const modified = post.updated !== post.date;

  return (
    <article className="container-page max-w-3xl py-12 md:py-16">
      <nav aria-label="Breadcrumb">
        <Link
          to="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Semua artikel
        </Link>
      </nav>

      <header>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar aria-hidden="true" className="h-3 w-3" />
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {modified && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Diperbarui <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </span>
              </>
            )}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock aria-hidden="true" className="h-3 w-3" />
            {readingMinutes(post)} menit baca
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
      </header>

      {headings.length >= 4 && (
        <nav
          aria-labelledby="toc-title"
          className="mt-8 rounded-2xl border border-border bg-muted/30 p-5"
        >
          <p id="toc-title" className="font-display font-bold">
            Isi artikel
          </p>
          <ol className="mt-2 space-y-1.5 text-sm">
            {headings.map((h) => (
              <li key={h.text}>
                <a
                  href={`#${headingId(h.text)}`}
                  className="text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="mt-8 space-y-4 text-[17px] leading-relaxed text-foreground/90">
        {post.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <section aria-labelledby="faq-title" className="mt-12">
        <h2 id="faq-title" className="font-display text-2xl font-bold">
          Pertanyaan yang sering diajukan
        </h2>
        <dl className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {post.faq.map((f) => (
            <div key={f.q} className="p-5">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className="mt-12 overflow-hidden rounded-3xl bg-green-800 p-7 text-white sm:p-9">
        <h2 className="font-display text-2xl font-extrabold leading-tight">{post.cta.title}</h2>
        <p className="mt-2 max-w-xl text-green-50/90">{post.cta.text}</p>
        <Link
          to={post.cta.to as "/register"}
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-yellow-300 px-6 text-sm font-extrabold text-gray-950 transition hover:bg-yellow-200"
        >
          {post.cta.label}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </aside>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-12">
          <h2 id="related-title" className="font-display text-xl font-bold">
            Baca juga
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="group block h-full rounded-2xl border border-border p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold text-primary">{r.category}</span>
                  <span className="mt-1 block font-display font-bold leading-snug group-hover:text-primary">
                    {r.title}
                  </span>
                  <span className="mt-1.5 block text-sm text-muted-foreground line-clamp-2">
                    {r.excerpt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12 border-t border-border pt-8">
        <Button asChild variant="outline">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Blog
          </Link>
        </Button>
      </div>
    </article>
  );
}
