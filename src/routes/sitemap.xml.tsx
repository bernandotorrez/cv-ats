import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://cvpintar.web.id";

const staticPaths: {
  path: string;
  priority: string;
  changefreq: "weekly" | "monthly" | "yearly";
  lastmod: string;
}[] = [
  { path: "/", priority: "1.0", changefreq: "weekly", lastmod: "2026-05-10" },
  { path: "/fitur", priority: "0.8", changefreq: "monthly", lastmod: "2026-05-01" },
  { path: "/template", priority: "0.9", changefreq: "weekly", lastmod: "2026-05-08" },
  { path: "/harga", priority: "0.8", changefreq: "monthly", lastmod: "2026-05-01" },
  { path: "/panduan-cv-ats", priority: "0.7", changefreq: "monthly", lastmod: "2026-05-05" },
  { path: "/tips-interview", priority: "0.7", changefreq: "weekly", lastmod: "2026-05-10" },
  { path: "/blog", priority: "0.7", changefreq: "weekly", lastmod: "2026-05-10" },
  { path: "/lowongan", priority: "0.8", changefreq: "weekly", lastmod: "2026-05-12" },
  { path: "/tentang", priority: "0.5", changefreq: "monthly", lastmod: "2026-04-15" },
  { path: "/changelog", priority: "0.4", changefreq: "monthly", lastmod: "2026-06-01" },
  { path: "/kontak", priority: "0.4", changefreq: "monthly", lastmod: "2026-04-15" },
  { path: "/kebijakan-privasi", priority: "0.4", changefreq: "yearly", lastmod: "2026-04-01" },
  { path: "/syarat-ketentuan", priority: "0.4", changefreq: "yearly", lastmod: "2026-04-01" },
];

// Mirror of content from tips-interview.$slug.tsx
const tipsSlugs: { slug: string; date: string }[] = [
  { slug: "persiapan-interview-pertama", date: "2026-05-01" },
  { slug: "pertanyaan-hr-umum", date: "2026-05-02" },
  { slug: "interview-technical-tech", date: "2026-05-03" },
  { slug: "negosiasi-gaji", date: "2026-05-04" },
  { slug: "pertanyaan-balik-ke-hr", date: "2026-05-05" },
  { slug: "behavioral-star-method", date: "2026-05-06" },
];

// Mirror of content from blog.$slug.tsx
const blogSlugs: { slug: string; date: string }[] = [
  { slug: "apa-itu-cv-ats", date: "2026-04-15" },
  { slug: "keyword-cv-ats", date: "2026-04-20" },
  { slug: "template-cv-gratis-vs-premium", date: "2026-04-25" },
  { slug: "cara-menulis-ringkasan-cv", date: "2026-05-01" },
];

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: { loc: string; priority: string; changefreq: string; lastmod: string }[] = [];

        // Static pages
        for (const s of staticPaths) {
          urls.push({
            loc: `${SITE_URL}${s.path}`,
            priority: s.priority,
            changefreq: s.changefreq,
            lastmod: s.lastmod,
          });
        }

        // Tips interview detail pages
        for (const t of tipsSlugs) {
          urls.push({
            loc: `${SITE_URL}/tips-interview/${t.slug}`,
            priority: "0.6",
            changefreq: "monthly",
            lastmod: t.date,
          });
        }

        // Blog detail pages
        for (const b of blogSlugs) {
          urls.push({
            loc: `${SITE_URL}/blog/${b.slug}`,
            priority: "0.6",
            changefreq: "monthly",
            lastmod: b.date,
          });
        }

        // Fetch lowongan slugs from Supabase
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data } = await supabase
            .from("job_listings")
            .select("slug, updated_at")
            .eq("is_active", true)
            .limit(500);
          if (data) {
            for (const job of data) {
              urls.push({
                loc: `${SITE_URL}/lowongan/${job.slug}`,
                priority: "0.6",
                changefreq: "weekly",
                lastmod: job.updated_at
                  ? new Date(job.updated_at).toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10),
              });
            }
          }
        } catch {
          // Supabase unavailable — skip dynamic lowongan
        }

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
