import { createFileRoute, Link } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  Users,
  TrendingUp,
  Target,
  Shield,
  Zap,
  Sparkles,
  Globe,
  Heart,
  ArrowRight,
} from "lucide-react";

const stats = [
  { icon: Users, value: "10.000+", label: "CV telah dibuat" },
  { icon: FileCheck, value: "85%", label: "lolos screening ATS" },
  { icon: TrendingUp, value: "3×", label: "lebih banyak interview" },
  { icon: Target, value: "2024", label: "melayani pencari kerja" },
];

const values = [
  {
    icon: Heart,
    title: "Akses Setara",
    description:
      "Kami percaya setiap orang — fresh graduate, career switcher, atau profesional senior — berhak atas CV berkualitas tanpa biaya selangit.",
  },
  {
    icon: Shield,
    title: "By Indonesian, For Indonesian",
    description:
      "Dibangun oleh tim yang paham pasar kerja Indonesia. HRD di sini punya ekspektasi berbeda — dan kami tahu persis apa yang mereka cari.",
  },
  {
    icon: Zap,
    title: "AI yang Ngerti Konteks Lokal",
    description:
      "AI kami dilatih memahami istilah, jabatan, dan preferensi industri di Indonesia. Bukan sekadar terjemahan template luar negeri.",
  },
  {
    icon: Sparkles,
    title: "Simpel Tapi Powerful",
    description:
      "Gak perlu belajar desain. Tulis pengalamanmu, pilih template, dan CV siap kirim dalam hitungan menit.",
  },
  {
    icon: Globe,
    title: "Bahasa Indonesia Dulu",
    description:
      "Mayoritas tools CV berbahasa Inggris. Kami hadir sepenuhnya dalam Bahasa Indonesia — dari UI sampai konten panduan.",
  },
  {
    icon: TrendingUp,
    title: "Terbukti Meningkatkan Peluang",
    description:
      "Rata-rata pengguna kami melaporkan peningkatan panggilan interview hingga 3× lipat setelah pakai CV ATS-friendly.",
  },
];

const storyParagraphs = [
  {
    highlight: "Awalnya dari frustrasi.",
    text: "Tim kami pernah duduk di sisi perekrut — menyortir ratusan CV per minggu untuk startup dan korporat di Indonesia. Polanya selalu sama: kandidat hebat gugur bukan karena skill, tapi karena CV mereka berantakan di mata ATS.",
  },
  {
    highlight: "Lalu kami riset.",
    text: "Kami wawancarai 50+ HRD dan hiring manager di Jakarta, Bandung, Surabaya. Kami pelajari pola screening ATS yang dipakai perusahaan Indonesia. Hasilnya mengejutkan: 70% CV yang masuk tidak terformat dengan benar untuk mesin.",
  },
  {
    highlight: "Dari situ kami membangun solusi.",
    text: "CV Pintar lahir dari perpaduan pengalaman sebagai rekruter dan engineer. Kami menggabungkan pemahaman mendalam tentang pasar kerja lokal dengan teknologi AI untuk menciptakan tools yang sederhana, terjangkau, dan benar-benar bekerja.",
  },
];

export const Route = createFileRoute("/tentang")({
  head: () =>
    buildSeo({
      title: "Tentang Kami — CV Pintar",
      description:
        "Misi kami: bantu setiap pencari kerja Indonesia bikin CV yang lolos ATS dan dapat panggilan interview lebih banyak.",
      path: "/tentang",
    }),
  component: TentangPage,
});

function TentangPage() {
  return (
    <>
      {/* ── Hero ── */}
      <PageHero
        eyebrow="Tentang Kami"
        title="CV kamu pantas dilihat manusia, bukan cuma dilewatin mesin."
        description="Kami bikin tools CV yang bikin lamaranmu lolos ATS, dilirik HRD, dan berujung panggilan interview — tanpa ribet dan tanpa mahal."
      />

      

      {/* ── Misi ── */}
      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-3">
            Misi Kami
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Nggak ada lagi CV bagus cuma buat yang bisa bayar mahal.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tools profesional. Harga terjangkau. Dibuat khusus buat pencari
            kerja Indonesia. Karena kami percaya kesempatan kerja yang adil
            dimulai dari CV yang setara.
          </p>
        </div>
      </section>

      {/* ── Nilai / Value Cards ── */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3">
              Yang Bikin Kami Beda
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Dibangun oleh orang yang ngerti dua sisi meja interview.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title} className="border bg-card transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                    <v.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cerita Kami ── */}
      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Cerita Kami
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Dari meja rekruter, untuk meja pelamar.
            </h2>
          </div>
          <div className="mt-12 space-y-10">
            {storyParagraphs.map((p, i) => (
              <div key={i} className="flex gap-5">
                <div className="hidden flex-col items-center sm:flex">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  {i < storyParagraphs.length - 1 && (
                    <div className="mt-1 h-full w-px bg-border" />
                  )}
                </div>
                <div className="pt-1">
                  <p className="text-lg leading-relaxed">
                    <span className="font-semibold text-primary">
                      {p.highlight}{" "}
                    </span>
                    {p.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-grad-hero py-16 md:py-20">
        <div className="container-page text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Siap bikin CV yang beneran dilirik?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
            Mulai gratis sekarang. Gak perlu kartu kredit. Cukup ceritain
            pengalamanmu dan biarin AI kami yang susun.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link to="/cv">
                Buat CV Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
