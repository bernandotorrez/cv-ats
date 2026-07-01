import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Crown,
  Download,
  FileSearch,
  FileText,
  Gauge,
  LockKeyhole,
  MessageCircle,
  Mic,
  Quote,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRoundCheck,
  Users,
  Video,
  Zap,
} from "lucide-react";

import { BaliTemplate } from "@/components/cv/templates/BaliTemplate";
import { BandungTemplate } from "@/components/cv/templates/BandungTemplate";
import { JakartaTemplate } from "@/components/cv/templates/JakartaTemplate";
import { MedanTemplate } from "@/components/cv/templates/MedanTemplate";
import { previewData } from "@/components/site/TemplatePreview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/")(
  {
    head: () =>
      buildSeo({
        title: "CV Pintar - Buat CV ATS Friendly dengan AI Gratis",
        description:
          "Buat CV ATS friendly Bahasa Indonesia yang rapi, kuat, dan siap kirim. Template profesional, saran AI, scoring otomatis, dan export PDF.",
        path: "/",
        keywords:
          "buat cv ats, cv pintar, template cv ats, cv generator ai, contoh cv ats, cv lolos screening, ai cv builder indonesia",
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "CV Pintar",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "50000" },
          },
        ],
      }),
    component: LandingPage,
  },
);

/* ─── DATA ─── */

const proofPoints = [
  { icon: Users, value: "5.000+", label: "Pengguna Aktif" },
  { icon: FileText, value: "10.000+", label: "CV Dibuat" },
  { icon: TrendingUp, value: "92%", label: "Skor ATS Rata-rata" },
  { icon: Star, value: "4.9/5", label: "Rating Pengguna" },
] as const;

const heroChecks = ["Gratis mulai hari ini", "Tanpa kartu kredit", "PDF siap kirim"] as const;

const features = [
  {
    icon: FileText,
    title: "Template ATS-ready",
    desc: "Struktur bersih, single-column, dan mudah dibaca sistem rekrutmen.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Bot,
    title: "AI Bahasa Indonesia + Inggris",
    desc: "Tulis ringkasan, pengalaman, dan skill dalam dua bahasa dengan kalimat yang tajam.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Gauge,
    title: "Skor ATS sebelum kirim",
    desc: "Cek format, keyword, dan kekuatan isi sebelum CV masuk portal kerja.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Search,
    title: "Keyword lowongan",
    desc: "Ambil kata kunci penting dari job description agar CV lebih relevan.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: FileSearch,
    title: "AI Job Match Score",
    desc: "Cocokkan CV dengan lowongan untuk melihat skor kecocokan dan keyword gap.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    icon: RefreshCw,
    title: "Auto Tailor CV",
    desc: "Sesuaikan ringkasan, skill, dan bullet pengalaman ke job description tanpa mengarang data.",
    color: "bg-teal-100 text-teal-600",
  },
  {
    icon: Briefcase,
    title: "Pelacak lamaran",
    desc: "Simpan posisi, status, catatan interview, dan langkah berikutnya.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Mic,
    title: "Simulasi Wawancara AI",
    desc: "Latihan interview dengan AI: dapatkan pertanyaan, jawab, dan terima feedback instan.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: UserRoundCheck,
    title: "Review CV by HR Expert AI",
    desc: "Analisis mendalam dari HR profesional 20+ tahun: temukan kekuatan, kelemahan, dan quick wins.",
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    icon: ShieldCheck,
    title: "Privasi dijaga",
    desc: "Data CV tetap milik kamu dan aksesnya dibatasi dengan aman.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Download,
    title: "Export PDF Berkualitas",
    desc: "Hasil PDF rapi, ringan, dan terbaca sempurna oleh ATS maupun rekruter manusia.",
    color: "bg-sky-100 text-sky-600",
  },
  {
    icon: MessageCircle,
    title: "Cover Letter AI",
    desc: "Generate surat lamaran yang dipersonalisasi untuk setiap posisi yang kamu lamar.",
    color: "bg-pink-100 text-pink-600",
  },
] as const;

const steps = [
  {
    n: "01",
    title: "Pilih template",
    desc: "Mulai dari template ATS, CV lama, atau job description target.",
    icon: FileText,
  },
  {
    n: "02",
    title: "Isi & rapikan",
    desc: "AI bantu membuat kalimat lebih konkret, ringkas, dan percaya diri.",
    icon: Bot,
  },
  {
    n: "03",
    title: "Cek skor ATS",
    desc: "Temukan bagian yang lemah sebelum rekruter melihatnya.",
    icon: Gauge,
  },
  {
    n: "04",
    title: "Export & kirim",
    desc: "Export PDF yang bersih, ringan, dan siap masuk portal ATS.",
    icon: Download,
  },
] as const;

const pricingTiers = [
  {
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    desc: "Untuk mulai bikin CV pertama tanpa risiko.",
    features: [
      "1 CV aktif",
      "2 template basic",
      "5x saran AI / bulan",
      "1x scoring / bulan",
      "Export PDF dengan watermark",
    ],
    cta: "Mulai Gratis",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Starter",
    price: "Rp 15.000",
    period: "/bulan",
    desc: "Untuk pencari kerja aktif yang ingin CV lebih tajam.",
    features: [
      "3 CV aktif",
      "Semua template premium",
      "50x saran AI / bulan",
      "10x scoring / bulan",
      "10x cover letter / bulan",
      "10x CV review HR / bulan",
      "20x AI Job Match / bulan",
      "Export PDF tanpa watermark",
    ],
    cta: "Pilih Starter",
    ctaVariant: "default" as const,
    popular: true,
  },
  {
    name: "Pro",
    price: "Rp 35.000",
    period: "/bulan",
    desc: "Untuk profesional yang butuh insight lengkap.",
    features: [
      "10 CV aktif",
      "Semua template premium",
      "200x saran AI / bulan",
      "50x scoring / bulan",
      "50x cover letter / bulan",
      "50x CV review HR / bulan",
      "100x AI Job Match / bulan",
      "30x Auto Tailor CV / bulan",
      "50x simulasi wawancara / bulan",
      "Dukungan prioritas 24/7",
    ],
    cta: "Pilih Pro",
    ctaVariant: "outline" as const,
    popular: false,
  },
] as const;

const faqs = [
  {
    q: "Apa itu CV ATS friendly?",
    a: "CV ATS friendly adalah CV dengan struktur yang mudah dibaca Applicant Tracking System. Biasanya memakai layout single-column, heading jelas, font standar, dan tanpa tabel atau elemen visual rumit.",
  },
  {
    q: "Apakah CV Pintar gratis?",
    a: "Ya. Kamu bisa mulai gratis tanpa kartu kredit. Upgrade hanya diperlukan jika membutuhkan kuota atau fitur lanjutan yang lebih besar.",
  },
  {
    q: "Cocok untuk fresh graduate?",
    a: "Cocok. CV Pintar membantu mengubah pengalaman magang, organisasi, proyek, dan skill menjadi cerita profesional yang lebih kuat.",
  },
  {
    q: "Apakah data CV saya aman?",
    a: "Data CV disimpan dengan akses terbatas dan tidak dijual ke pihak ketiga. Kamu tetap memegang kendali atas data yang kamu masukkan.",
  },
  {
    q: "Bisa export ke PDF dan DOCX?",
    a: "Ya. Kamu bisa export CV dalam format PDF yang rapi dan ATS-friendly. Format DOCX juga tersedia untuk kebutuhan editing lanjutan.",
  },
  {
    q: "Berapa lama waktu membuat CV?",
    a: "Dengan bantuan AI, kamu bisa membuat CV profesional dalam 15-30 menit. Jauh lebih cepat dibandingkan menulis dari nol.",
  },
] as const;

const testimonials = [
  {
    name: "Rina Kartika",
    role: "Fresh Graduate — UI/UX Designer",
    text: "Awalnya bingung harus menulis apa. AI-nya bantu mengubah pengalaman organisasi jadi poin yang terlihat profesional. Dalam 2 minggu dapat 3 panggilan interview!",
    avatar: "RK",
    avatarColor: "bg-pink-500",
  },
  {
    name: "Andi Pratama",
    role: "Software Engineer — 5 tahun",
    text: "Fitur scoring paling terasa manfaatnya. Saya langsung tahu keyword yang kurang sebelum kirim lamaran ke portal kerja. Skor ATS naik dari 62% ke 91%.",
    avatar: "AP",
    avatarColor: "bg-blue-500",
  },
  {
    name: "Sari Dewi",
    role: "Career Switcher — Marketing → PM",
    text: "Template-nya rapi dan mudah dibaca. Review CV-nya membantu saya menjelaskan pengalaman lama agar relevan dengan role baru. Sekarang sudah diterima!",
    avatar: "SD",
    avatarColor: "bg-emerald-500",
  },
  {
    name: "Budi Setiawan",
    role: "Project Manager — 8 tahun",
    text: "Auto Tailor CV sangat membantu! Saya punya 1 CV master dan tinggal generate versi tailored untuk setiap lowongan. Hemat waktu banget.",
    avatar: "BS",
    avatarColor: "bg-violet-500",
  },
] as const;

/* ─── PAGE ─── */

function LandingPage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION — Blue gradient + illustration
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden bg-grad-hero-blue">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <div className="container-page grid min-h-[calc(100svh-5rem)] items-center gap-10 pb-16 pt-20 md:pb-20 md:pt-24 lg:grid-cols-2 lg:gap-16">
          {/* Left — Copy */}
          <div className="relative z-10 max-w-2xl">
            <Badge className="gap-1.5 border-white/20 bg-white/15 text-white hover:bg-white/15">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI-Powered CV Builder #1 Indonesia
            </Badge>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Buat CV ATS-Friendly
              <br />
              <span className="text-yellow-300">yang Bikin Rekruter</span>
              <br />
              Langsung Tertarik.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
              Template profesional, saran AI bilingual, scoring ATS otomatis, Job Match,
              simulasi interview — semua dalam satu platform. Gratis untuk mulai.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-13 w-full bg-white px-8 text-base font-semibold text-blue-700 shadow-lg shadow-white/20 hover:bg-white/95 sm:w-auto"
              >
                <Link to="/register">
                  Buat CV Gratis Sekarang
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-13 w-full border-white/25 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/20 sm:w-auto"
              >
                <Link to="/template">Lihat Template</Link>
              </Button>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              {heroChecks.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-yellow-300" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Illustration / Mockup */}
          <div className="relative hidden lg:block">
            <div className="animate-float relative mx-auto w-full max-w-md">
              {/* Floating stat cards around the illustration */}
              <div className="absolute -left-16 top-8 z-20 rounded-xl border border-white/15 bg-white/10 px-5 py-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-400/20">
                    <TrendingUp className="h-5 w-5 text-green-300" aria-hidden />
                  </div>
                  <div>
                    <div className="font-display text-xl font-bold text-white">92%</div>
                    <div className="text-xs text-white/70">Skor ATS</div>
                  </div>
                </div>
              </div>

              <div className="animate-float-delayed absolute -right-8 bottom-20 z-20 rounded-xl border border-white/15 bg-white/10 px-5 py-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-yellow-400/20">
                    <Star className="h-5 w-5 text-yellow-300" aria-hidden />
                  </div>
                  <div>
                    <div className="font-display text-xl font-bold text-white">4.9/5</div>
                    <div className="text-xs text-white/70">Rating</div>
                  </div>
                </div>
              </div>

              {/* Main illustration */}
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
                <div className="rounded-xl bg-white p-4 shadow-lg">
                  <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <FileText className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">CV Pintar Editor</div>
                      <div className="text-xs text-gray-500">AI-powered builder</div>
                    </div>
                  </div>
                  {/* Mini CV preview */}
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                    <div className="h-2 w-full rounded bg-gray-100" />
                    <div className="h-2 w-5/6 rounded bg-gray-100" />
                    <div className="mt-3 h-2 w-1/2 rounded bg-primary/30" />
                    <div className="h-2 w-full rounded bg-gray-100" />
                    <div className="h-2 w-4/5 rounded bg-gray-100" />
                    <div className="mt-3 h-2 w-2/3 rounded bg-primary/30" />
                    <div className="h-2 w-full rounded bg-gray-100" />
                    <div className="h-2 w-3/4 rounded bg-gray-100" />
                  </div>
                  {/* ATS Score bar */}
                  <div className="mt-4 rounded-lg bg-green-50 p-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-semibold text-green-700">ATS Score</span>
                      <span className="font-bold text-green-700">92%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-green-200">
                      <div className="h-full w-[92%] rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute inset-x-0 bottom-0">
          <svg viewBox="0 0 1440 56" fill="none" className="w-full" preserveAspectRatio="none">
            <path
              d="M0 56h1440V28c-240 20-480 28-720 28S240 48 0 28v28z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SOCIAL PROOF BAR
      ══════════════════════════════════════════════════════════════ */}
      <section aria-label="Bukti sosial" className="border-b border-border bg-background">
        <div className="container-page grid grid-cols-2 gap-4 py-8 sm:grid-cols-4">
          {proofPoints.map((point) => (
            <div key={point.label} className="flex items-center gap-3 px-3 py-3 sm:justify-center">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <point.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-foreground md:text-2xl">
                  {point.value}
                </div>
                <div className="text-xs font-medium text-muted-foreground">{point.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROBLEM-SOLUTION SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Masalahnya sederhana
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Kenapa <span className="text-primary">75% CV</span> Gagal di Tahap Screening?
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            Kebanyakan CV ditolak bukan karena kurang pengalaman, tapi karena format yang salah, keyword
            yang kurang tepat, atau pencapaian yang terdengar biasa saja.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              emoji: "🎯",
              title: "Format aman ATS",
              desc: "Layout bersih yang ramah Applicant Tracking System dan nyaman dibaca HR manusia.",
            },
            {
              emoji: "✍️",
              title: "Isi bernilai tinggi",
              desc: "Copywriting CV fokus pada dampak nyata, angka pencapaian, dan konteks yang relevan.",
            },
            {
              emoji: "⚡",
              title: "Aksi yang jelas",
              desc: "Setiap saran AI punya langkah perbaikan spesifik yang langsung bisa kamu terapkan.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="text-3xl">{item.emoji}</div>
              <h3 className="mt-4 font-display text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════════════════════════ */}
      <section id="fitur" className="bg-muted/40 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Fitur lengkap"
            title="Semua yang kamu butuhkan untuk CV yang menang."
            desc="12 fitur AI canggih yang membantu kamu dari menulis, memperbaiki, sampai mengirim CV yang profesional."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group rounded-2xl border-border bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
              >
                <CardContent className="p-6">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-5 font-display text-base font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="container-page py-16 md:py-24">
        <SectionIntro
          eyebrow="Cara kerja"
          title="Dari blank page ke CV siap kirim."
          desc="Empat langkah pendek yang membuat proses menulis CV terasa lebih tenang dan terarah."
        />

        <div className="relative mt-12 grid gap-6 md:grid-cols-4">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 md:block" />

          {steps.map((step, i) => (
            <div key={step.n} className="relative text-center">
              <div className="relative mx-auto mb-5 grid h-24 w-24 place-items-center rounded-2xl border-2 border-primary/20 bg-primary/5 transition-all duration-300 hover:border-primary/40 hover:bg-primary/10">
                <step.icon className="h-8 w-8 text-primary" aria-hidden />
                <div className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground shadow-lg">
                  {i + 1}
                </div>
              </div>
              <h3 className="font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          AI JOB MATCH + TAILOR SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              <FileSearch className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              AI Job Match + Tailor CV
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Jangan kirim CV yang sama ke semua lowongan.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Bandingkan CV dengan lowongan target. AI Job Match Score menunjukkan seberapa cocok
              CV kamu, keyword yang belum muncul, dan bagian yang perlu dinaikkan. Tailor CV
              membantu membuat versi yang lebih relevan tanpa pengalaman palsu.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                [
                  FileSearch,
                  "Cek kecocokan lowongan",
                  "Lihat match score, keyword gap, dan rekomendasi perbaikan sebelum apply.",
                ],
                [
                  RefreshCw,
                  "Buat versi tailored",
                  "Sesuaikan summary, skill, dan bullet pengalaman berdasarkan job description.",
                ],
              ].map(([Icon, title, desc]) => (
                <div
                  key={title as string}
                  className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {title as string}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {desc as string}
                  </p>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="mt-8 h-12 px-6 text-base">
              <Link to="/harga">
                Lihat paket Job Match
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {/* Job Match Mockup */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/8">
            <div className="rounded-xl bg-background p-5">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <FileSearch className="h-7 w-7" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Job Match Report</h3>
                    <p className="text-sm text-muted-foreground">CV vs job description target</p>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit">
                  Match 78%
                </Badge>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-xl bg-primary p-5 text-primary-foreground">
                  <p className="text-sm font-medium text-primary-foreground/85">Kesiapan apply</p>
                  <div className="mt-3 font-display text-5xl font-bold">78%</div>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/90">
                    Cukup kuat, tapi masih bisa naik dengan keyword dan bukti impact.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    ["Keyword cocok", "Project management, reporting, stakeholder."],
                    ["Keyword gap", "Budgeting, vendor management, risk tracking."],
                    ["Tailor next", "Naikkan bullet pengalaman yang paling relevan."],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-info p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw
                    className="mt-0.5 h-5 w-5 shrink-0 text-info-foreground"
                    aria-hidden
                  />
                  <p className="text-sm leading-6 text-info-foreground">
                    Tailor CV menjaga fakta tetap sama, lalu mengatur ulang pesan agar lebih dekat
                    dengan kebutuhan lowongan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HR EXPERT REVIEW SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          {/* Mockup — Left on desktop */}
          <div className="order-2 rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/8 lg:order-1">
            <div className="rounded-xl bg-background p-5">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <UserRoundCheck className="h-7 w-7" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Hira AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Senior HR Recruitment Consultant
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit">
                  20+ tahun pengalaman
                </Badge>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-xl bg-primary p-5 text-primary-foreground">
                  <p className="text-sm font-medium text-primary-foreground/85">Skor kesiapan</p>
                  <div className="mt-3 font-display text-5xl font-bold">85</div>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/90">
                    Kuat, tapi masih bisa naik dengan bukti angka dan keyword role target.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    ["Kekuatan", "Ringkasan profil sudah fokus dan mudah dipindai.", "bg-primary/10"],
                    ["Perlu diperbaiki", "Pengalaman kerja butuh metrik kuantitatif.", "bg-warning/25"],
                    ["Quick win", "Tambahkan 3 keyword utama dari job description.", "bg-info"],
                  ].map(([title, desc, tone]) => (
                    <div key={title} className={`rounded-xl p-4 ${tone}`}>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                  Prioritas perbaikan
                </div>
                <div className="space-y-3">
                  {[
                    ["Tambahkan angka hasil", "75%"],
                    ["Perkuat keyword role", "64%"],
                    ["Ringkas bullet panjang", "48%"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copy — Right on desktop */}
          <div className="order-1 lg:order-2">
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
              <UserRoundCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Review CV by HR Expert AI
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Feedback tajam sebelum CV kamu dikirim.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Dapat analisis mendalam dari perspektif HR profesional 20+ tahun. Bukan sekadar
              komentar umum, tapi prioritas perbaikan yang jelas: apa yang sudah kuat, apa yang
              melemahkan peluang, dan bagian mana yang bisa cepat dinaikkan kualitasnya.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["Kekuatan CV", "Bagian yang sudah meyakinkan rekruter."],
                ["Risiko screening", "Hal yang bisa membuat CV dilewati ATS atau HR."],
                ["Quick wins", "Perbaikan kecil dengan dampak besar."],
                ["Standar industri", "Benchmark terhadap ekspektasi role target."],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md">
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="mt-8 h-12 px-6 text-base">
              <Link to="/harga">
                Coba review CV
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRIVATE MENTORING SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Private Mentoring by HR Recruiter
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Butuh arahan manusia setelah CV kamu siap?
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Konsultasi 1-on-1 dengan HR Recruiter untuk membedah CV, strategi apply, dan jawaban
              interview. Cocok kalau kamu ingin feedback yang lebih personal sebelum mengirim
              lamaran penting.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                [MessageCircle, "Chat Session", "Rp25.000 via WhatsApp"],
                [Video, "Video Session", "Rp50.000 via Zoom"],
              ].map(([Icon, title, desc]) => (
                <div
                  key={title as string}
                  className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {title as string}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {desc as string}
                  </p>
                </div>
              ))}
            </div>
            <Button asChild size="lg" className="mt-8 h-12 px-6 text-base">
              <Link to="/private-coaching">
                Lihat Private Mentoring
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {/* Mentoring Mockup */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/8">
            <div className="rounded-xl bg-background p-5">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <UserRoundCheck className="h-7 w-7" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">HR Recruiter 1-on-1</h3>
                    <p className="text-sm text-muted-foreground">CV, apply strategy, interview</p>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit">
                  Mulai Rp25.000
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Review CV personal", "Cari pesan utama yang harus terlihat oleh recruiter."],
                  [
                    "Strategi apply",
                    "Pilih target role, keyword, dan angle pengalaman yang tepat.",
                  ],
                  [
                    "Latihan interview",
                    "Rapikan cara menjawab agar lebih jelas dan percaya diri.",
                  ],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <CalendarClock
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Chat berjalan via WhatsApp. Untuk video session, link Zoom dikirim setelah
                    pembayaran dan jadwal dikonfirmasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TEMPLATE SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-card py-16 md:py-24">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <Badge variant="secondary" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Template profesional
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Rapi untuk sistem.
                <br />
                Tetap enak dilihat manusia.
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Pilih gaya yang sesuai profesi kamu. Semua template dibuat untuk keterbacaan,
                hierarki informasi, dan export PDF yang bersih.
              </p>
              <Button asChild variant="outline" className="mt-7">
                <Link to="/template">
                  Jelajahi semua template
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { name: "Jakarta", template: JakartaTemplate, data: previewData.jakarta },
                { name: "Bandung", template: BandungTemplate, data: previewData.bandung },
                { name: "Bali", template: BaliTemplate, data: previewData.bali },
                { name: "Medan", template: MedanTemplate, data: previewData.medan },
              ].map(({ name, template: Template, data }) => (
                <Link key={name} to="/template" className="group block">
                  <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-background p-3 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/5">
                    <div
                      className="h-full overflow-hidden rounded-xl bg-white shadow-sm"
                      style={{
                        transform: "scale(0.55)",
                        transformOrigin: "top left",
                        width: "182%",
                        height: "182%",
                      }}
                    >
                      <div className="p-4" style={{ fontSize: "11px", lineHeight: 1.4 }}>
                        <Template data={data} showHeader />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-foreground">{name}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRICING SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section id="harga" className="py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Harga transparan"
            title="Mulai gratis, upgrade kapan saja."
            desc="Tanpa biaya tersembunyi. Pilih paket yang sesuai dengan kebutuhanmu."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border-2 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  tier.popular
                    ? "border-primary bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 bg-primary px-4 py-1 text-primary-foreground shadow-lg">
                      <Crown className="h-3.5 w-3.5" aria-hidden />
                      Paling Populer
                    </Badge>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="font-display text-xl font-bold">{tier.name}</h3>
                  <div className="mt-3">
                    <span className="font-display text-4xl font-extrabold text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      {tier.period}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{tier.desc}</p>
                </div>

                <ul className="mt-7 space-y-3">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={tier.ctaVariant}
                  className={`mt-8 h-12 w-full text-base ${
                    tier.popular ? "shadow-lg shadow-primary/20" : ""
                  }`}
                >
                  <Link to={tier.popular ? "/register" : "/harga"}>
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Butuh detail lebih?{" "}
            <Link to="/harga" className="font-medium text-primary underline-offset-4 hover:underline">
              Lihat perbandingan lengkap semua paket →
            </Link>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Cerita pengguna"
            title="Dipakai untuk melamar dengan lebih percaya diri."
            desc="Pengguna CV Pintar datang dari fresh graduate, profesional, sampai career switcher."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((item) => (
              <Card
                key={item.name}
                className="group rounded-2xl border-border bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-0.5 text-warning" aria-label="Rating 5 dari 5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-warning" aria-hidden />
                      ))}
                    </div>
                    <Quote className="h-5 w-5 text-muted-foreground/30" aria-hidden />
                  </div>

                  <p className="mt-4 text-sm leading-7 text-foreground">"{item.text}"</p>

                  <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${item.avatarColor}`}
                    >
                      {item.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              FAQ
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Pertanyaan yang sering ditanyakan.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Belum menemukan jawaban?{" "}
              <Link
                to="/kontak"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Hubungi kami
              </Link>
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="container-page pb-16 md:pb-24">
        <div className="relative isolate overflow-hidden rounded-3xl bg-grad-cta px-6 py-14 text-center text-white md:px-12 md:py-20">
          {/* Decorative */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <Sparkles className="mx-auto h-10 w-10 text-yellow-300" aria-hidden />
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Siap bikin CV yang membuka pintu karier?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/85 md:text-lg">
            Buat CV pertama gratis, perbaiki dengan AI, dan export PDF saat kamu siap melamar.
            Tanpa kartu kredit. Tanpa batas waktu.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-13 bg-white px-8 text-base font-semibold text-blue-700 shadow-lg shadow-black/10 hover:bg-white/95"
            >
              <Link to="/register">
                Mulai Buat CV Gratis
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-13 border-white/25 bg-white/15 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/25"
            >
              <Link to="/harga">Lihat Harga</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── SHARED COMPONENTS ─── */

function SectionIntro({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge variant="secondary" className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {eyebrow}
      </Badge>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">{desc}</p>
    </div>
  );
}
