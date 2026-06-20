import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Download,
  FileSearch,
  FileText,
  Gauge,
  LockKeyhole,
  MessageCircle,
  Mic,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  RefreshCw,
  TrendingUp,
  UserRoundCheck,
  Video,
} from "lucide-react";

import { BaliTemplate } from "@/components/cv/templates/BaliTemplate";
import { BandungTemplate } from "@/components/cv/templates/BandungTemplate";
import { JakartaTemplate } from "@/components/cv/templates/JakartaTemplate";
import { MalangTemplate } from "@/components/cv/templates/MalangTemplate";
import { SoloTemplate } from "@/components/cv/templates/SoloTemplate";
import { DenpasarTemplate } from "@/components/cv/templates/DenpasarTemplate";
import { BatuTemplate } from "@/components/cv/templates/BatuTemplate";
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

export const Route = createFileRoute("/")({
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
});

const proofPoints = [
  ["5.000+", "pengguna aktif"],
  ["10.000+", "CV dibuat"],
  ["92%", "skor ATS rata-rata"],
  ["4.9/5", "rating pengguna"],
] as const;

const heroChecks = ["Gratis mulai hari ini", "Tanpa kartu kredit", "PDF siap kirim"] as const;

const features = [
  {
    icon: FileText,
    title: "Template ATS-ready",
    desc: "Struktur bersih, single-column, dan mudah dibaca sistem rekrutmen.",
  },
  {
    icon: Bot,
    title: "AI Bahasa Indonesia + Inggris",
    desc: "Tulis ringkasan, pengalaman, dan skill dalam dua bahasa dengan kalimat yang tajam.",
  },
  {
    icon: Gauge,
    title: "Skor sebelum kirim",
    desc: "Cek format, keyword, dan kekuatan isi sebelum CV masuk portal kerja.",
  },
  {
    icon: Search,
    title: "Keyword lowongan",
    desc: "Ambil kata kunci penting dari job description agar CV lebih relevan.",
  },
  {
    icon: FileSearch,
    title: "AI Job Match Score",
    desc: "Cocokkan CV dengan lowongan untuk melihat skor kecocokan, keyword gap, dan prioritas perbaikan.",
  },
  {
    icon: RefreshCw,
    title: "Tailor CV untuk lowongan",
    desc: "Sesuaikan ringkasan, skill, dan bullet pengalaman ke job description tanpa mengarang data.",
  },
  {
    icon: Briefcase,
    title: "Pelacak lamaran",
    desc: "Simpan posisi, status, catatan interview, dan langkah berikutnya.",
  },
  {
    icon: ShieldCheck,
    title: "Privasi dijaga",
    desc: "Data CV tetap milik kamu dan aksesnya dibatasi dengan aman.",
  },
  {
    icon: Mic,
    title: "Simulasi Wawancara AI",
    desc: "Latihan interview dengan AI: dapatkan pertanyaan, jawab, dan terima feedback instan.",
  },
  {
    icon: UserRoundCheck,
    title: "Review CV by HR Expert AI",
    desc: "Analisis mendalam dari HR profesional 20+ tahun: temukan kekuatan, kelemahan, dan quick wins.",
  },
  {
    icon: Download,
    title: "Export PDF Berkualitas",
    desc: "Hasil PDF rapi, ringan, dan terbaca sempurna oleh ATS maupun rekruter manusia.",
  },
] as const;

const steps = [
  {
    n: "01",
    title: "Pilih arah",
    desc: "Mulai dari template, CV lama, atau job description target.",
  },
  {
    n: "02",
    title: "Rapikan isi",
    desc: "AI bantu membuat kalimat lebih konkret, ringkas, dan percaya diri.",
  },
  {
    n: "03",
    title: "Cek skor",
    desc: "Temukan bagian yang lemah sebelum rekruter melihatnya.",
  },
  {
    n: "04",
    title: "Kirim",
    desc: "Export PDF yang bersih, ringan, dan siap masuk ATS.",
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
] as const;

const testimonials = [
  {
    name: "Rina",
    role: "Fresh Graduate",
    text: "Awalnya bingung harus menulis apa. AI-nya bantu mengubah pengalaman organisasi jadi poin yang terlihat profesional. Dalam 2 minggu dapat 3 panggilan interview.",
  },
  {
    name: "Andi",
    role: "Software Engineer",
    text: "Fitur scoring paling terasa manfaatnya. Saya langsung tahu keyword yang kurang sebelum kirim lamaran ke portal kerja.",
  },
  {
    name: "Sari",
    role: "Career Switcher",
    text: "Template-nya rapi dan mudah dibaca. Review CV-nya membantu saya menjelaskan pengalaman lama agar relevan dengan role baru.",
  },
] as const;

function LandingPage() {
  return (
    <>
      <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden bg-foreground text-white">
        <img
          src="/hero-banner.webp"
          alt="Orang-orang bergembira setelah diterima kerja di perusahaan impian"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/78 via-black/54 to-black/18" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="container-page flex min-h-[calc(100svh-5rem)] items-end pb-10 pt-20 md:pb-14 md:pt-24">
          <div className="w-full max-w-4xl">
            <Badge className="gap-1.5 border-white/20 bg-white/15 text-white hover:bg-white/15">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Dari CV kosong jadi ATS-friendly, sampai siap menyambut kabar diterima kerja
            </Badge>

            <h1 className="mt-5 max-w-4xl break-words font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-7xl">
              CV yang membuat rekruter paham{" "}
              <span className="underline decoration-white/80 decoration-4 underline-offset-[0.16em]">
                kenapa kamu layak dipanggil.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl break-words text-base leading-8 text-white/86 sm:text-lg">
              Mulai dari template ATS, saran AI, skor CV, review ala HR, Job Match, Auto Tailor CV,
              sampai cover letter dan export PDF/DOCX yang siap dikirim.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full px-6 text-base sm:w-auto">
                <Link to="/register">
                  Buat CV gratis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 w-full bg-white/92 px-6 text-base text-foreground hover:bg-white sm:w-auto"
              >
                <Link to="/template">Lihat template</Link>
              </Button>
            </div>

            <ul className="mt-6 grid max-w-2xl gap-2 text-sm text-white/86 sm:grid-cols-3">
              {heroChecks.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 grid gap-3 rounded-lg border border-white/18 bg-black/28 p-3 backdrop-blur sm:max-w-2xl sm:grid-cols-3">
              {[
                ["92%", "skor ATS rata-rata"],
                ["10.000+", "CV dibuat"],
                ["4.9/5", "rating pengguna"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md bg-white/12 px-4 py-3">
                  <div className="font-display text-2xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-xs font-medium text-white/78">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Bukti sosial" className="border-y border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-px py-4 sm:grid-cols-4">
          {proofPoints.map(([value, label]) => (
            <div key={label} className="px-3 py-5 text-center">
              <div className="font-display text-2xl font-bold text-primary md:text-3xl">
                {value}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground md:text-sm">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Badge variant="secondary">Masalahnya sederhana</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              CV yang bagus belum tentu terbaca.
            </h2>
          </div>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground">
            Banyak CV gagal karena formatnya sulit dipindai, kata kuncinya kurang pas, atau
            pencapaiannya terdengar biasa saja. CV Pintar mengubah proses itu menjadi alur yang
            ringan: tulis, perbaiki, cek, lalu kirim.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Format aman", "Layout bersih yang ramah ATS dan nyaman dibaca HR."],
            ["Isi bernilai", "Copywriting CV fokus pada dampak, angka, dan konteks."],
            ["Aksi jelas", "Setiap saran punya langkah perbaikan yang mudah dilakukan."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fitur" className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Fitur inti"
            title="Semua alat penting, tanpa rasa ribet."
            desc="Didesain minimalis agar kamu fokus pada satu hal: membuat CV yang jelas, kuat, dan siap bersaing."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="rounded-lg border-border bg-card shadow-none">
                <CardContent className="p-6">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge className="bg-info text-info-foreground hover:bg-info">
              AI Job Match + Tailor CV
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Jangan kirim CV yang sama ke semua lowongan.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Setelah punya CV dasar yang rapi, bandingkan CV dengan lowongan target. AI Job Match
              Score menunjukkan seberapa cocok CV kamu, keyword yang belum muncul, dan bagian yang
              perlu dinaikkan. Kalau sudah siap, Tailor CV membantu membuat versi yang lebih relevan
              tanpa menambahkan pengalaman palsu.
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
                <div key={title as string} className="rounded-lg border border-border bg-card p-4">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title as string}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc as string}</p>
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

          <div className="rounded-lg border border-border bg-card p-4 shadow-xl shadow-primary/10">
            <div className="rounded-md bg-background p-5">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
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
                <div className="rounded-lg bg-primary p-5 text-primary-foreground">
                  <p className="text-sm font-medium text-primary-foreground/85">Kesiapan apply</p>
                  <div className="mt-3 font-display text-5xl font-bold">78%</div>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/90">
                    Cukup kuat, tapi masih bisa naik dengan keyword dan bukti impact yang lebih
                    tepat.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    ["Keyword cocok", "Project management, reporting, stakeholder."],
                    ["Keyword gap", "Budgeting, vendor management, risk tracking."],
                    ["Tailor next", "Naikkan bullet pengalaman yang paling relevan."],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-info p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-info-foreground" aria-hidden />
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

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge className="bg-info text-info-foreground hover:bg-info">
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
                <div key={title} className="rounded-lg border border-border bg-card p-4">
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

          <div className="rounded-lg border border-border bg-card p-4 shadow-xl shadow-primary/10">
            <div className="rounded-md bg-background p-5">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
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
                <div className="rounded-lg bg-primary p-5 text-primary-foreground">
                  <p className="text-sm font-medium text-primary-foreground/85">Skor kesiapan</p>
                  <div className="mt-3 font-display text-5xl font-bold">85</div>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/90">
                    Kuat, tapi masih bisa naik dengan bukti angka dan keyword role target.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    [
                      "Kekuatan",
                      "Ringkasan profil sudah fokus dan mudah dipindai.",
                      "bg-primary/10",
                    ],
                    [
                      "Perlu diperbaiki",
                      "Pengalaman kerja butuh metrik kuantitatif.",
                      "bg-warning/25",
                    ],
                    ["Quick win", "Tambahkan 3 keyword utama dari job description.", "bg-info"],
                  ].map(([title, desc, tone]) => (
                    <div key={title} className={`rounded-lg p-4 ${tone}`}>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border p-4">
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
        </div>
      </section>

      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge className="bg-info text-info-foreground hover:bg-info">
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
                <div key={title as string} className="rounded-lg border border-border bg-card p-4">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title as string}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc as string}</p>
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

          <div className="rounded-lg border border-border bg-card p-4 shadow-xl shadow-primary/10">
            <div className="rounded-md bg-background p-5">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
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
                  ["Latihan interview", "Rapikan cara menjawab agar lebih jelas dan percaya diri."],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-lg border border-border p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
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

      <section className="container-page py-16 md:py-24">
        <SectionIntro
          eyebrow="Cara kerja"
          title="Dari blank page ke CV siap kirim."
          desc="Empat langkah pendek yang membuat proses menulis CV terasa lebih tenang."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="rounded-lg border border-border bg-card p-6">
              <div className="font-display text-sm font-bold text-primary">{step.n}</div>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge variant="secondary">Template</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Rapi untuk sistem. Tetap enak dilihat manusia.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Pilih gaya yang sesuai profesi kamu. Semua template dibuat untuk keterbacaan, hierarki
              informasi, dan export PDF yang bersih.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link to="/template">
                Jelajahi template
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
              { name: "Malang", template: MalangTemplate, data: previewData.malang },
              { name: "Solo", template: SoloTemplate, data: previewData.solo },
              { name: "Denpasar", template: DenpasarTemplate, data: previewData.denpasar },
              { name: "Batu", template: BatuTemplate, data: previewData.batu },
            ].map(({ name, template: Template, data }) => (
              <Link key={name} to="/template" className="group block">
                <div className="aspect-[3/4] overflow-hidden rounded-lg border border-border bg-background p-3 transition-shadow group-hover:shadow-md">
                  <div
                    className="h-full overflow-hidden rounded-md bg-white shadow-sm"
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
      </section>

      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Cerita pengguna"
            title="Dipakai untuk melamar dengan lebih percaya diri."
            desc="Pengguna CV Pintar datang dari fresh graduate, profesional, sampai career switcher."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.name} className="rounded-lg border-border bg-card shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <Quote className="h-6 w-6 text-primary" aria-hidden />
                    <div className="flex gap-0.5 text-warning" aria-label="Rating 5 dari 5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-warning" aria-hidden />
                      ))}
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-foreground">"{item.text}"</p>
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="secondary">FAQ</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Pertanyaan cepat sebelum mulai.
            </h2>
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

      <section className="container-page pb-16 md:pb-24">
        <div className="rounded-lg bg-primary px-6 py-12 text-center text-primary-foreground md:px-10 md:py-16">
          <LockKeyhole className="mx-auto h-8 w-8" aria-hidden />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">
            Kirim CV yang terasa siap, bukan sekadar selesai.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-primary-foreground/90 md:text-base">
            Buat CV pertama gratis, perbaiki dengan AI, lalu export PDF saat kamu siap melamar.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-7 text-base">
            <Link to="/register">
              Mulai sekarang
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function SectionIntro({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge variant="secondary">{eyebrow}</Badge>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-muted-foreground">{desc}</p>
    </div>
  );
}
