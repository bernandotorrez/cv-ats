const SITE_URL = "https://cvats.id";
const OG_IMAGE_WIDTH = "1200";
const OG_IMAGE_HEIGHT = "630";
const OG_IMAGE_ALT = "CV Pintar — Buat CV ATS Friendly dengan AI";

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
};

export function buildSeo({
  title,
  description,
  path,
  image,
  type = "website",
  keywords,
  jsonLd,
  noindex,
  articlePublishedTime,
  articleModifiedTime,
}: SeoInput) {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/og-default.png`;
  const meta = [
    { title },
    { name: "description", content: description },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: OG_IMAGE_WIDTH },
    { property: "og:image:height", content: OG_IMAGE_HEIGHT },
    { property: "og:image:alt", content: OG_IMAGE_ALT },
    { property: "og:locale", content: "id_ID" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: OG_IMAGE_ALT },
    ...(articlePublishedTime ? [{ property: "article:published_time", content: articlePublishedTime }] : []),
    ...(articleModifiedTime ? [{ property: "article:modified_time", content: articleModifiedTime }] : []),
    ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
  ];
  const links = [
    { rel: "canonical", href: url },
    { rel: "alternate", hrefLang: "id", href: url },
    { rel: "alternate", hrefLang: "x-default", href: url },
  ];
  const scripts = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((data) => ({
        type: "application/ld+json",
        children: JSON.stringify(data),
      }))
    : [];
  return { meta, links, scripts };
}

export { SITE_URL };
