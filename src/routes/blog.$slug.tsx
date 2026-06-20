import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton-loading";

// Blog content - mirrors DB seed data
const posts: Record<
  string,
  { title: string; category: string; excerpt: string; body: string[]; date: string }
> = {
  "apa-itu-cv-ats": {
    title: "Apa Itu CV ATS Friendly dan Kenapa Penting?",
    category: "CV & Karier",
    excerpt:
      "Pelajari apa itu Applicant Tracking System, bagaimana cara kerjanya, dan kenapa CV kamu harus lolos screening ATS.",
    date: "2026-04-15",
    body: [
      "ATS (Applicant Tracking System) adalah software yang digunakan perusahaan untuk menyaring ribuan CV secara otomatis sebelum dibaca manusia. Di era digital, hampir semua perusahaan menengah-besar menggunakan ATS untuk efisiensi proses rekrutmen.",
      "Hampir 75% perusahaan besar di Indonesia dan global menggunakan ATS untuk proses rekrutmen. Jika CV kamu tidak ATS-friendly, besar kemungkinan CV langsung tersingkir sebelum dilihat oleh rekruter manusia. Ini adalah realita yang sering tidak disadari oleh pencari kerja.",
      "ATS bekerja dengan cara mengekstrak teks dari CV, mencari keyword yang relevan dengan job description, dan memberi skor berdasarkan kecocokan. CV dengan skor rendah otomatis ditolak sistem. Karena itu, format CV tradisional dengan tabel, kolom, atau gambar sering gagal dibaca oleh ATS.",
      "Tips utama membuat CV ATS-friendly: hindari tabel, gambar, kolom, dan font dekoratif. Gunakan heading standar seperti 'Pengalaman Kerja', 'Pendidikan', 'Keahlian'. Gunakan keyword yang relevan dengan posisi yang dilamar. Format single-column adalah yang paling aman.",
      "Dengan CV Pintar, kamu bisa membuat CV ATS-friendly dalam hitungan menit. Template kami sudah dioptimasi untuk lolos screening ATS, lengkap dengan AI scoring dan saran perbaikan.",
    ],
  },
  "keyword-cv-ats": {
    title: "Cara Riset Keyword untuk CV ATS Friendly",
    category: "CV & Karier",
    excerpt:
      "Panduan lengkap riset keyword dari job description agar CV kamu muncul di pencarian rekruter.",
    date: "2026-04-20",
    body: [
      "Keyword adalah kunci agar CV kamu lolos ATS dan ditemukan rekruter. Tanpa keyword yang tepat, CV terbaik sekalipun bisa terlewat oleh sistem screening otomatis. Inilah kenapa riset keyword menjadi langkah krusial sebelum menulis CV.",
      "Cara riset: baca 3-5 job description posisi yang kamu incar. Catat kata-kata yang sering muncul — itu keyword utama yang dicari ATS. Perhatikan juga sinonim dan variasi penulisan (contoh: 'project management' vs 'manajemen proyek').",
      "Kelompokkan keyword menjadi tiga kategori: hard skills (tools, bahasa pemrograman, sertifikasi), soft skills (komunikasi, kepemimpinan), dan kualifikasi (pengalaman tahun, pendidikan). Pastikan kamu menyertakan semuanya secara natural di CV.",
      "Taburkan keyword secara natural di ringkasan, pengalaman kerja, dan bagian skill. Jangan melakukan keyword stuffing — ATS modern bisa mendeteksi praktik ini dan malah menurunkan skor CV kamu.",
      "Gunakan fitur Keyword Extractor di CV Pintar untuk otomatis mengekstrak keyword dari job description favoritmu. Fitur ini akan mengidentifikasi hard skills, soft skills, kualifikasi, dan action verbs yang harus ada di CV kamu.",
    ],
  },
  "template-cv-gratis-vs-premium": {
    title: "Template CV Gratis vs Premium: Mana yang Kamu Butuhkan?",
    category: "CV & Karier",
    excerpt:
      "Perbandingan jujur template CV gratis dan premium, plus tips memilih yang tepat untuk jenjang kariermu.",
    date: "2026-04-25",
    body: [
      "Template CV gratis biasanya cukup untuk fresh graduate atau yang baru pertama kali bikin CV. Namun ada keterbatasan: pilihan desain sedikit, fitur AI terbatas, dan sering ada watermark di hasil export PDF. Ini wajar untuk pemula, tapi bisa jadi hambatan saat kamu serius mencari kerja.",
      "Template premium menawarkan: desain lebih profesional dan bervariasi, AI scoring unlimited, cover letter generator, export tanpa watermark, dan prioritas akses fitur AI. Investasi kecil ini bisa jadi pembeda antara CV yang dilirik dan yang terlewat.",
      "Kapan upgrade ke premium? Jika kamu: melamar ke 10+ perusahaan sekaligus, ingin ganti industri atau posisi, target posisi senior/managerial, atau butuh CV dalam berbagai format untuk berbagai keperluan.",
      "Di CV Pintar, semua template — baik gratis maupun premium — sudah ATS-friendly dan dioptimasi untuk screening otomatis. Perbedaannya ada di variasi desain, fitur AI, dan pengalaman export.",
      "Mulai dari paket Free (Rp 0 selamanya) dengan 1 CV dan 2 template. Upgrade ke Starter (Rp 14.900/bln) untuk 3 CV dan semua fitur AI, atau Pro (Rp 39.000/bln) untuk 10 CV dan fitur lengkap.",
    ],
  },
  "cara-menulis-ringkasan-cv": {
    title: "Cara Menulis Ringkasan CV yang Bikin Rekruter Berhenti Scroll",
    category: "CV & Karier",
    excerpt:
      "Ringkasan profil adalah bagian paling krusial di CV. Pelajari formula menulis ringkasan yang memikat dalam 7 detik pertama.",
    date: "2026-05-01",
    body: [
      "Ringkasan profil adalah 2-4 kalimat di bagian atas CV yang menjadi first impression rekruter. Rata-rata rekruter hanya membaca 7 detik pertama — pastikan ringkasanmu powerful dan langsung menunjukkan value kamu.",
      "Formula ringkasan yang efektif: [Posisi / Peran] + [pengalaman tahun] + [keahlian utama yang relevan] + [pencapaian signifikan dengan metrik] + [value proposition / apa yang kamu tawarkan ke perusahaan].",
      "Contoh ringkasan bagus: 'Frontend Developer dengan 5+ tahun pengalaman membangun web application skala enterprise. Spesialis React, TypeScript, dan performa web, berhasil meningkatkan Core Web Vitals aplikasi sebesar 40%. Berpengalaman memimpin tim engineering 5 orang dan berkolaborasi dengan product & design.'",
      "Hindari kesalahan umum: kalimat klise seperti 'saya pekerja keras' atau 'saya mudah beradaptasi' tanpa bukti, penggunaan kata ganti orang pertama yang berlebihan, dan informasi yang tidak relevan dengan posisi yang dilamar.",
      "Gunakan fitur AI Saran di editor CV Pintar untuk otomatis membuat ringkasan profesional yang ATS-friendly dan disesuaikan dengan target posisi kamu.",
    ],
  },
};

export const Route = createFileRoute("/blog/$slug")({
  pendingComponent: ArticleDetailSkeleton,
  loader: ({ params }) => {
    const post = posts[params.slug];
    if (!post) throw notFound();
    return { post, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Artikel tidak ditemukan" }] };
    const { post, slug } = loaderData;
    return buildSeo({
      title: `${post.title} — Blog CV Pintar`,
      description: post.excerpt,
      path: `/blog/${slug}`,
      type: "article",
      articlePublishedTime: post.date,
      articleModifiedTime: post.date,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Beranda", item: "https://cvpintar.web.id" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: "https://cvpintar.web.id/blog",
            },
            { "@type": "ListItem", position: 3, name: post.title },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          articleSection: post.category,
          datePublished: post.date,
          dateModified: post.date,
          inLanguage: "id-ID",
          author: { "@type": "Organization", name: "CV Pintar" },
          publisher: { "@type": "Organization", name: "CV Pintar", url: "https://cvpintar.web.id" },
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

function BlogArticlePage() {
  const { post } = Route.useLoaderData();
  return (
    <article className="container-page max-w-3xl py-12 md:py-16">
      <Link
        to="/blog"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Semua artikel
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <Badge variant="secondary">{post.category}</Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(post.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
        {post.title}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
      <div className="mt-8 space-y-4 text-foreground leading-relaxed">
        {post.body.map((p: string, i: number) => (
          <p key={i}>{p}</p>
        ))}
      </div>
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
