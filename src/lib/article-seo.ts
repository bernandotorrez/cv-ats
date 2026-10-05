import { buildSeo, fitDescription, fitTitle, SITE_URL } from "@/lib/seo";
import type { BlogBlock, BlogPost } from "@/lib/blog-posts";

export type ArticleSection = "blog" | "tips-interview";

export const SECTION_META: Record<ArticleSection, { label: string; hubLabel: string }> = {
  blog: { label: "Blog", hubLabel: "Semua artikel" },
  "tips-interview": { label: "Tips Interview", hubLabel: "Semua Tips Interview" },
};

export function articleWordCount(post: BlogPost): number {
  const blocks = post.body.map((b: BlogBlock) =>
    b.t === "ul" || b.t === "ol"
      ? b.items.join(" ")
      : b.t === "callout"
        ? `${b.title} ${b.text}`
        : b.text,
  );
  return blocks.join(" ").split(/\s+/).length;
}

/** `head()` bersama untuk artikel blog dan tips: meta, Article, BreadcrumbList, FAQPage. */
export function buildArticleHead(post: BlogPost, section: ArticleSection, keywords?: string) {
  const path = `/${section}/${post.slug}`;
  const url = `${SITE_URL}${path}`;
  return buildSeo({
    title: fitTitle(post.title),
    description: fitDescription(post.excerpt),
    path,
    type: "article",
    keywords,
    articlePublishedTime: post.date,
    articleModifiedTime: post.updated,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: SECTION_META[section].label,
            item: `${SITE_URL}/${section}`,
          },
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
}
