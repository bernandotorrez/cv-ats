import { createFileRoute } from "@tanstack/react-router";
import { blogPosts } from "@/lib/blog-posts";
import { tipPosts } from "@/lib/tips-posts";

const SITE_URL = "https://cvpintar.web.id";

// Fresh lastmod so Google re-crawls after each deploy; computed at request time.
const lastmodNow = () => new Date().toISOString().slice(0, 10);

const staticPaths: {
  path: string;
  priority: string;
  changefreq: "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/fitur", priority: "0.8", changefreq: "monthly" },
  { path: "/template", priority: "0.9", changefreq: "weekly" },
  { path: "/harga", priority: "0.8", changefreq: "monthly" },
  { path: "/panduan-cv-ats", priority: "0.7", changefreq: "monthly" },
  { path: "/tips-interview", priority: "0.7", changefreq: "weekly" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/lowongan", priority: "0.8", changefreq: "weekly" },
  { path: "/tentang", priority: "0.5", changefreq: "monthly" },
  { path: "/changelog", priority: "0.4", changefreq: "monthly" },
  { path: "/kontak", priority: "0.4", changefreq: "monthly" },
  { path: "/private-coaching", priority: "0.5", changefreq: "monthly" },
  { path: "/kebijakan-privasi", priority: "0.4", changefreq: "yearly" },
  { path: "/syarat-ketentuan", priority: "0.4", changefreq: "yearly" },
  { path: "/tryout-cpns", priority: "1.0", changefreq: "weekly" },
];

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: { loc: string; priority: string; changefreq: string; lastmod: string }[] = [];
        const lastmod = lastmodNow();

        // Static pages
        for (const s of staticPaths) {
          urls.push({
            loc: `${SITE_URL}${s.path}`,
            priority: s.priority,
            changefreq: s.changefreq,
            lastmod,
          });
        }

        // Tips interview detail pages
        for (const t of tipPosts) {
          urls.push({
            loc: `${SITE_URL}/tips-interview/${t.slug}`,
            priority: "0.6",
            changefreq: "monthly",
            lastmod: t.updated,
          });
        }

        // Blog detail pages
        for (const b of blogPosts) {
          urls.push({
            loc: `${SITE_URL}/blog/${b.slug}`,
            priority: "0.7",
            changefreq: "monthly",
            lastmod: b.updated,
          });
        }

        // Fetch lowongan slugs from Supabase
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data } = await (supabase as any)
            .from("job_listings")
            .select("slug, updated_at")
            .eq("is_active", true)
            .or(
              `deadline.is.null,deadline.gte.${new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)}`,
            )
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
