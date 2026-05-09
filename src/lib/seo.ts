const SITE_URL = "https://cvats.id";

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
};

export function buildSeo({ title, description, path, image, type = "website", keywords, jsonLd, noindex }: SeoInput) {
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
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
  ];
  const links = [{ rel: "canonical", href: url }];
  const scripts = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((data) => ({
        type: "application/ld+json",
        children: JSON.stringify(data),
      }))
    : [];
  return { meta, links, scripts };
}

export { SITE_URL };
