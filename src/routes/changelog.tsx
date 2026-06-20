import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Bug,
  Chrome,
  FileSearch,
  FileText,
  GitBranch,
  LayoutDashboard,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_VERSION } from "@/lib/app-version";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/changelog")({
  head: () =>
    buildSeo({
      title: "Changelog - Update CV Pintar",
      description:
        "Catatan perubahan CV Pintar: fitur baru, perbaikan bug, peningkatan performa, dan update pengalaman pengguna.",
      path: "/changelog",
      keywords: "changelog cv pintar, update aplikasi cv pintar, fitur baru cv pintar",
    }),
  component: ChangelogPage,
});

const changelog = [
  {
    version: APP_VERSION,
    date: "20 Juni 2026",
    title: "Fitur Upload Foto Profil (Opsional)",
    summary:
      "Kini Anda dapat mengunggah foto profil ke CV secara opsional dengan sistem penyimpanan aman (private bucket) berbasis Supabase Storage.",
    highlights: [
      {
        icon: Sparkles,
        type: "Fitur baru",
        text: "Menambahkan input upload foto profil di bagian Data Pribadi dengan validasi ukuran maks 2MB (JPG, PNG, WebP).",
      },
      {
        icon: ShieldCheck,
        type: "Keamanan",
        text: "Penyimpanan foto profil yang aman untuk menjaga privasi data pengguna.",
      },
      {
        icon: FileText,
        type: "Peningkatan",
        text: "Mengintegrasikan tampilan foto profil secara opsional dengan posisi layout yang ATS-friendly pada seluruh template CV.",
      },
    ],
  },
  {
    version: "v1.5.0-live",
    date: "15 Juni 2026",
    title: "Sign in & Sign Up dengan Google",
    summary:
      "Fitur Baru! Sign in dan Sign Up dengan Google, sekarang daftar dan login jadi lebih mudah!",
    highlights: [
      {
        icon: Chrome,
        type: "Fitur baru",
        text: "Menambahkan fitur Sign in dan Sign Up dengan Google agar pengguna bisa daftar dan login hanya dalam satu klik tanpa perlu isi form.",
      },
      {
        icon: Sparkles,
        type: "Peningkatan",
        text: "Menyederhanakan alur autentikasi sehingga pengalaman pertama memakai CV Pintar terasa lebih cepat dan nyaman.",
      },
    ],
  },
  {
    version: "v1.4.1-live",
    date: "1 Juni 2026",
    title: "Auto Tailor CV, quota Pro, dan AI Job Match Score",
    summary:
      "Update ini menghadirkan Auto Tailor CV end-to-end, quota khusus untuk paket Pro, serta alur job match dan portfolio yang lebih siap dipakai.",
    highlights: [
      {
        icon: RefreshCw,
        type: "Fitur baru",
        text: "Menambahkan Auto Tailor CV untuk Lowongan agar pengguna bisa menyesuaikan ringkasan, skill, dan bullet pengalaman berdasarkan job description tanpa mengarang data.",
      },
      {
        icon: FileSearch,
        type: "Fitur baru",
        text: "Menambahkan AI Job Match Score untuk membandingkan CV dengan lowongan kerja.",
      },
      {
        icon: BadgeCheck,
        type: "Subscription",
        text: "Menambahkan quota khusus Auto Tailor CV sebesar 30x/bulan untuk pengguna Pro.",
      },
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Menampilkan penggunaan Auto Tailor CV di dashboard agar sisa quota lebih mudah dipantau.",
      },
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Menambahkan akses Job Match di dashboard agar alur cek kecocokan CV lebih cepat.",
      },
      {
        icon: Share2,
        type: "Fitur baru",
        text: "Menambahkan Portfolio Page terpisah di /portfolio yang berisi hero profil, skill, pengalaman, pendidikan, kontak, dan preview CV.",
      },
      {
        icon: FileText,
        type: "Peningkatan",
        text: "Mempertahankan Shared CV di /share sebagai halaman khusus preview CV yang ringan, printable, dan mudah dibagikan.",
      },
      {
        icon: BadgeCheck,
        type: "Subscription",
        text: "Menambahkan kuota bulanan untuk AI Job Match Score pada tier Starter dan Pro.",
      },
      {
        icon: Wrench,
        type: "Perbaikan",
        text: "Merapikan tampilan card fitur dan menambahkan label New untuk fitur yang baru dirilis.",
      },
    ],
  },
  {
    version: "v1.3.x-live",
    date: "Mei 2026",
    title: "Lowongan pekerjaan dan penyimpanan lowongan",
    summary:
      "Rangkaian update untuk membantu pengguna menemukan, membaca, menyimpan, dan mengelola lowongan dari CV Pintar.",
    highlights: [
      {
        icon: Sparkles,
        type: "Fitur baru",
        text: "Menambahkan halaman Lowongan Pekerjaan dengan pencarian dan daftar lowongan yang lebih informatif.",
      },
      {
        icon: FileText,
        type: "Fitur baru",
        text: "Menambahkan halaman detail lowongan dengan ringkasan posisi, kualifikasi, deskripsi, dan sumber lowongan.",
      },
      {
        icon: BadgeCheck,
        type: "Fitur baru",
        text: "Menambahkan fitur simpan lowongan untuk pengguna yang sudah login.",
      },
      {
        icon: ShieldCheck,
        type: "Admin",
        text: "Menambahkan CRUD lowongan di Admin agar data lowongan bisa dikelola manual.",
      },
    ],
  },
  {
    version: "v1.2.x-live",
    date: "Mei 2026",
    title: "Peningkatan AI tools dan pengalaman mobile",
    summary:
      "Update fokus pada fitur AI lanjutan, tampilan mobile, serta stabilitas halaman authenticated.",
    highlights: [
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Menambahkan bottom navigation mobile untuk akses cepat ke Dashboard, ATS Scoring, Kelola CV, CV Review, dan Cover Letter.",
      },
      {
        icon: Sparkles,
        type: "Peningkatan",
        text: "Merapikan beberapa halaman publik agar lebih playful, informatif, dan konsisten secara visual.",
      },
      {
        icon: Bug,
        type: "Perbaikan",
        text: "Memperbaiki beberapa error navigasi, loader, dan integrasi Supabase pada halaman tertentu.",
      },
      {
        icon: Wrench,
        type: "Performa",
        text: "Mengubah beberapa tabel admin menjadi server-side pagination agar data besar tetap ringan dibuka.",
      },
    ],
  },
  {
    version: "v1.1.x-live",
    date: "April 2026",
    title: "Fondasi fitur premium dan halaman pendukung",
    summary:
      "Update awal untuk memperjelas paket, menambah halaman informatif, dan menyiapkan pengalaman pengguna yang lebih lengkap.",
    highlights: [
      {
        icon: FileText,
        type: "Fitur",
        text: "Menambahkan dan merapikan fitur CV ATS Scoring, CV Review, Cover Letter Generator, dan tools pendukung CV.",
      },
      {
        icon: BadgeCheck,
        type: "Pricing",
        text: "Merapikan tier Free, Starter, dan Pro agar benefit setiap paket lebih mudah dipahami.",
      },
      {
        icon: ShieldCheck,
        type: "Keamanan",
        text: "Menambahkan halaman legal, privacy, dan pengaturan dasar untuk informasi pengguna.",
      },
      {
        icon: GitBranch,
        type: "Maintenance",
        text: "Menambahkan versioning aplikasi di footer agar perubahan produk lebih mudah dilacak.",
      },
    ],
  },
] as const;

const categories = [
  ["Fitur baru", "Penambahan kemampuan baru yang bisa langsung dipakai pengguna."],
  ["Peningkatan", "Perbaikan alur, tampilan, copy, dan pengalaman memakai produk."],
  ["Perbaikan bug", "Fix error, validasi, loading state, atau perilaku yang tidak sesuai."],
  ["Maintenance", "Update teknis, versi aplikasi, migration, dan optimasi sistem."],
] as const;

function ChangelogPage() {
  return (
    <>
      <section className="overflow-hidden bg-background">
        <div className="container-page grid gap-10 py-14 md:grid-cols-[1fr_0.9fr] md:items-center md:py-20 lg:py-24">
          <div>
            <Badge className="gap-1.5 bg-info text-info-foreground hover:bg-info">
              <GitBranch className="h-3.5 w-3.5" aria-hidden />
              Changelog CV Pintar
            </Badge>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Catatan update produk, fitur baru, dan perbaikan aplikasi.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Kami terus mengembangkan CV Pintar agar proses membuat CV, mencari lowongan, dan
              menyiapkan lamaran terasa lebih jelas, cepat, dan percaya diri.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/fitur">
                  Lihat semua fitur
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/harga">Lihat paket</Link>
              </Button>
            </div>
          </div>

          <Card className="rounded-lg border-border bg-card shadow-xl shadow-primary/10">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current version
              </p>
              <div className="mt-3 rounded-lg bg-primary p-5 text-primary-foreground">
                <p className="font-mono text-2xl font-bold">{APP_VERSION}</p>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/90">
                  Versi live terbaru yang sedang berjalan di CV Pintar.
                </p>
              </div>
              <div className="mt-5 grid gap-3">
                {categories.map(([title, desc]) => (
                  <div key={title} className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">Release Notes</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Perubahan terbaru
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Ringkasan umum dari update produk. Beberapa perubahan teknis kecil digabung agar
              changelog tetap mudah dibaca.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl space-y-6">
            {changelog.map((release) => (
              <article
                key={release.version}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                      {release.version}
                    </Badge>
                    <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
                      {release.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {release.summary}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-muted-foreground">
                    {release.date}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {release.highlights.map((item) => (
                    <div
                      key={`${release.version}-${item.text}`}
                      className="rounded-lg bg-muted/55 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <item.icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {item.type}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
