import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://cvats.id";

const staticPaths = [
  { path: "/", priority: "1.0", changefreq: "weekly" as const },
  { path: "/fitur", priority: "0.8", changefreq: "monthly" as const },
  { path: "/template", priority: "0.9", changefreq: "weekly" as const },
  { path: "/harga", priority: "0.8", changefreq: "monthly" as const },
  { path: "/panduan-cv-ats", priority: "0.7", changefreq: "monthly" as const },
  { path: "/tips-interview", priority: "0.7", changefreq: "weekly" as const },
  { path: "/blog", priority: "0.7", changefreq: "weekly" as const },
  { path: "/tentang", priority: "0.5", changefreq: "monthly" as const },
  { path: "/kontak", priority: "0.4", changefreq: "monthly" as const },
  { path: "/kebijakan-privasi", priority: "0.4", changefreq: "yearly" as const },
  { path: "/syarat-ketentuan", priority: "0.4", changefreq: "yearly" as const },
];

// Mirror of data from routes/tips-interview.tsx
const tipsSlugs = [
  "persiapan-interview-pertama",
  "pertanyaan-hr-umum",
  "interview-technical-tech",
  "negosiasi-gaji",
  "pertanyaan-balik-ke-hr",
  "behavioral-star-method",
];

// Mirror of data from routes/blog.tsx
const blogSlugs = [
  "apa-itu-cv-ats",
  "keyword-cv-ats",
  "template-cv-gratis-vs-premium",
  "cara-menulis-ringkasan-cv",
];

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);

        const urls = [
          ...staticPaths.map((s) => ({
            loc: `${SITE_URL}${s.path}`,
            priority: s.priority,
            changefreq: s.changefreq,
          })),
          ...tipsSlugs.map((slug) => ({
            loc: `${SITE_URL}/tips-interview/${slug}`,
            priority: "0.6",
            changefreq: "monthly" as const,
          })),
          ...blogSlugs.map((slug) => ({
            loc: `${SITE_URL}/blog/${slug}`,
            priority: "0.6",
            changefreq: "monthly" as const,
          })),
        ];

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(body, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
