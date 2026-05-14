import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  ImageOff,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Type,
  UserRound,
  Wand2,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/panduan-cv-ats")({
  head: () =>
    buildSeo({
      title: "Panduan Lengkap Membuat CV ATS Friendly 2026",
      description:
        "Pelajari cara membuat CV ATS friendly Bahasa Indonesia: format, struktur, keyword, kesalahan umum, dan checklist praktis sebelum kirim lamaran.",
      path: "/panduan-cv-ats",
      type: "article",
      keywords: "cara buat cv ats, panduan CV Pintar, format cv ats, contoh cv ats friendly",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Beranda",
              item: "https://cvpintar.web.id",
            },
            { "@type": "ListItem", position: 2, name: "Panduan CV ATS" },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Panduan Lengkap Membuat CV ATS Friendly 2026",
          inLanguage: "id-ID",
          author: { "@type": "Organization", name: "CV Pintar" },
          publisher: {
            "@type": "Organization",
            name: "CV Pintar",
            url: "https://cvpintar.web.id",
          },
          datePublished: "2026-05-05",
          dateModified: "2026-05-05",
        },
      ],
    }),
  component: PanduanPage,
});

const principles = [
  {
    icon: FileText,
    title: "Single column",
    desc: "Satu kolom membuat urutan informasi lebih mudah dibaca ATS dan rekruter.",
  },
  {
    icon: Type,
    title: "Font standar",
    desc: "Gunakan Inter, Arial, Calibri, atau font umum lain yang tetap jelas saat diekspor.",
  },
  {
    icon: ImageOff,
    title: "Minim elemen visual",
    desc: "Hindari grafik, foto, tabel rumit, dan informasi penting di header atau footer.",
  },
  {
    icon: BadgeCheck,
    title: "Heading jelas",
    desc: "Pakai label umum seperti Ringkasan, Pengalaman, Pendidikan, Skill, dan Sertifikasi.",
  },
  {
    icon: Download,
    title: "PDF text-based",
    desc: "Kirim PDF yang teksnya bisa diseleksi, bukan hasil scan atau gambar.",
  },
  {
    icon: Search,
    title: "Keyword natural",
    desc: "Ambil kata kunci dari job description, lalu masukkan ke pengalaman dan skill.",
  },
] as const;

const structure = [
  {
    icon: UserRound,
    num: "01",
    title: "Header dan kontak",
    desc: "Nama, posisi target, kota, email aktif, nomor HP, dan LinkedIn bila relevan.",
  },
  {
    icon: Target,
    num: "02",
    title: "Ringkasan profesional",
    desc: "2 sampai 3 kalimat yang menjelaskan peran, kekuatan utama, dan arah karier.",
  },
  {
    icon: Briefcase,
    num: "03",
    title: "Pengalaman kerja",
    desc: "Mulai dari yang terbaru, gunakan action verb, angka, dan impact yang terukur.",
  },
  {
    icon: GraduationCap,
    num: "04",
    title: "Pendidikan",
    desc: "Tulis institusi, jurusan, tahun, IPK bila kuat, dan pencapaian akademik penting.",
  },
  {
    icon: Wrench,
    num: "05",
    title: "Skill",
    desc: "Pisahkan tools, technical skills, bahasa, dan soft skill yang relevan dengan lowongan.",
  },
  {
    icon: Award,
    num: "06",
    title: "Sertifikasi dan proyek",
    desc: "Tambahkan bukti kredibel seperti sertifikat, portfolio, organisasi, atau proyek.",
  },
] as const;

const mistakes = [
  "Template berbasis tabel rumit",
  "Paragraf panjang tanpa bullet",
  "Keyword lowongan tidak muncul",
  "Informasi pribadi yang tidak relevan",
  "CV terlalu panjang tanpa prioritas",
  "PDF hasil scan atau file yang sulit dibaca",
] as const;

const recruiterNotes = [
  {
    icon: Clock,
    stat: "6 detik",
    title: "Waktu scan awal",
    desc: "Bagian atas CV harus langsung menjawab: kamu siapa, bisa apa, dan cocok untuk role apa.",
  },
  {
    icon: TrendingUp,
    stat: ">75%",
    title: "Target skor ATS",
    desc: "Skor bukan segalanya, tapi membantu melihat apakah format dan keyword sudah cukup kuat.",
  },
  {
    icon: Lightbulb,
    stat: "1 halaman",
    title: "Untuk early career",
    desc: "Kalau pengalaman masih di bawah 5 tahun, satu halaman yang tajam biasanya lebih kuat.",
  },
] as const;

const checklist = [
  "Format PDF text-based",
  "Layout single column",
  "Font standar dan mudah dibaca",
  "Tanpa grafik, tabel rumit, atau foto wajib",
  "Keyword dari job description sudah masuk",
  "Maksimal 1 sampai 2 halaman",
  "Bullet pengalaman memakai action verb",
  "Ada angka, scope, atau impact",
  "Email dan nomor HP aktif",
  "LinkedIn atau portfolio relevan",
] as const;

function PanduanPage() {
  return (
    <main className="overflow-x-clip bg-background">
      <article>
        <section className="border-b border-border/70">
          <div className="container-page grid gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)] md:items-center md:py-24">
            <div>
              <Badge className="mb-6 gap-2 border-yellow-200 bg-yellow-100 px-4 py-2 text-sm text-yellow-950 shadow-sm hover:bg-yellow-100">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Panduan CV ATS 2026
              </Badge>

              <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] text-foreground sm:text-5xl lg:text-6xl">
                CV yang lolos ATS dimulai dari struktur yang mudah dipercaya.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                ATS bukan musuh. Ia hanya membaca apa yang kamu susun. Panduan ini membantu CV kamu
                terbaca mesin, tetap nyaman untuk HR, dan lebih kuat saat dibandingkan kandidat
                lain.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link to="/register">
                    Buat CV ATS
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                  <a href="#checklist">Lihat checklist</a>
                </Button>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-3">
                {[
                  ["8 menit", "waktu baca"],
                  ["6 prinsip", "aturan inti"],
                  ["10 poin", "checklist"],
                ].map(([stat, label]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border bg-card p-3 shadow-sm"
                  >
                    <dt className="font-display text-xl font-bold text-foreground">{stat}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <AtsPreview />
          </div>
        </section>

        <section className="container-page py-14 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1fr] lg:items-center">
            <div>
              <Badge variant="secondary" className="mb-4 px-3 py-1.5">
                Dasar dulu
              </Badge>
              <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Apa itu ATS, dan kenapa CV bagus bisa tetap tersaring?
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Applicant Tracking System adalah software yang membantu perusahaan menyimpan,
                membaca, dan menyaring lamaran. Masalahnya, CV yang terlalu visual sering gagal
                dibaca dengan benar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Bot,
                  title: "Mesin membaca struktur",
                  desc: "ATS mencari heading, tanggal, jabatan, skill, dan keyword yang relevan.",
                },
                {
                  icon: ShieldCheck,
                  title: "HR membaca kejelasan",
                  desc: "Setelah lolos mesin, rekruter tetap mencari impact dan bukti kerja nyata.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-border/80 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">{item.title}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/45 py-16 md:py-24">
          <div className="container-page">
            <SectionIntro
              eyebrow="Prinsip inti"
              title="Enam aturan sederhana yang membuat CV lebih mudah dibaca."
              desc="Kuncinya bukan desain yang ramai. Kuncinya adalah struktur yang jelas, teks yang bisa dipindai, dan keyword yang relevan."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {principles.map((item) => (
                <Card key={item.title} className="border-border/80 bg-card shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">{item.title}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <SectionIntro
            eyebrow="Struktur CV"
            title="Urutan informasi yang paling mudah dipahami ATS dan HR."
            desc="Susun dari identitas profesional, nilai utama, bukti pengalaman, lalu kredibilitas pendukung."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {structure.map((item) => (
              <Card key={item.title} className="border-border/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-display text-2xl font-bold text-muted-foreground">
                      {item.num}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground md:py-20">
          <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-start">
            <div>
              <Badge className="mb-5 border-white/25 bg-white/15 text-white hover:bg-white/15">
                Hindari ini
              </Badge>
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
                Kesalahan kecil yang sering membuat CV terlihat lemah.
              </h2>
              <p className="mt-4 text-lg leading-8 text-primary-foreground/85">
                Banyak kandidat gagal bukan karena tidak kompeten, tapi karena CV mereka susah
                diproses. Bagian ini cepat, tapi penting.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {mistakes.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-white/20 bg-white/10 p-4"
                >
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <SectionIntro
            eyebrow="Catatan rekruter"
            title="CV yang kuat membantu rekruter mengambil keputusan lebih cepat."
            desc="Tulis untuk mesin, tapi tetap yakinkan manusia. Dua-duanya butuh kejelasan."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {recruiterNotes.map((item) => (
              <Card key={item.title} className="border-border/80 text-center shadow-sm">
                <CardContent className="p-6">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="font-display text-4xl font-bold text-foreground">{item.stat}</p>
                  <h3 className="mt-3 font-display text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="checklist" className="bg-muted/45 py-16 md:py-24">
          <div className="container-page">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1fr] lg:items-start">
              <div>
                <Badge variant="secondary" className="mb-4 px-3 py-1.5">
                  Checklist
                </Badge>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
                  Sebelum kirim lamaran, cek sepuluh hal ini.
                </h2>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  Checklist sederhana ini membantu memastikan CV kamu tidak kalah karena hal teknis
                  yang sebenarnya bisa dicegah.
                </p>
              </div>

              <Card className="border-border/80 bg-card shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {checklist.map((item) => (
                      <li key={item} className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium leading-6 text-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <div className="grid gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <Badge className="mb-5 bg-primary text-primary-foreground">Praktikkan langsung</Badge>
              <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Cara tercepat memahami ATS adalah mencoba memperbaiki CV sendiri.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                Mulai dari template yang aman, tulis isi CV, lalu gunakan AI untuk scoring, keyword,
                dan perbaikan kalimat.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/register">
                  Buat CV sekarang
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link to="/template">Lihat template ATS</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

function AtsPreview() {
  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                ATS scan preview
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">CV terbaca</h2>
            </div>
            <Badge className="bg-primary text-primary-foreground">92%</Badge>
          </div>

          <div className="space-y-3">
            {[
              { icon: FileCheck, title: "Struktur", desc: "Heading dan urutan jelas" },
              { icon: Search, title: "Keyword", desc: "Skill cocok dengan role" },
              { icon: Wand2, title: "Impact", desc: "Bullet punya angka dan hasil" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-lg bg-muted/70 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-primary p-5 text-primary-foreground">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              <p className="font-bold">Yang perlu diperbaiki</p>
            </div>
            <p className="leading-7 text-primary-foreground/90">
              Tambahkan angka pada pengalaman utama dan samakan istilah skill dengan job description
              target.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionIntro({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Badge variant="secondary" className="mb-4 px-3 py-1.5">
        {eyebrow}
      </Badge>
      <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{desc}</p>
    </div>
  );
}
