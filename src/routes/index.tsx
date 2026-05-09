import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Target, Bot, ShieldCheck, FileText, Download,
  CheckCircle2, ArrowRight, Star, Zap, BookOpen,
  UserCircle, Crown, Heart, Clock, Award, TrendingUp,
  Briefcase, Mic, Gift, Search,
} from "lucide-react";
import { BaliTemplate } from "@/components/cv/templates/BaliTemplate";
import { JakartaTemplate } from "@/components/cv/templates/JakartaTemplate";
import { MakassarTemplate } from "@/components/cv/templates/MakassarTemplate";
import { BandungTemplate } from "@/components/cv/templates/BandungTemplate";
import { MedanTemplate } from "@/components/cv/templates/MedanTemplate";
import { previewData } from "@/components/site/TemplatePreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    buildSeo({
      title: "CV ATS Indonesia — Buat CV ATS Friendly dengan AI Gratis",
      description:
        "Bikin CV ATS friendly Bahasa Indonesia dalam 10 menit. Template profesional, saran AI, scoring otomatis, & tips interview. Mulai gratis tanpa kartu kredit.",
      path: "/",
      keywords:
        "buat cv ats, cv ats indonesia, template cv ats, cv generator ai, contoh cv ats, cv lolos screening, ai cv builder indonesia",
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
          name: "CV ATS Indonesia",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "50000" },
        },
      ],
    }),
  component: LandingPage,
});

const features = [
  { icon: FileText, title: "Template ATS-Friendly", desc: "Format single-column standar yang disukai mesin ATS perusahaan Indonesia & multinasional." },
  { icon: Bot, title: "Saran AI Bahasa Indonesia", desc: "Tombol 'Sarankan' di tiap bagian — AI bantu menulis ringkasan, deskripsi pengalaman, & skill." },
  { icon: Target, title: "CV Scoring Otomatis", desc: "Cek kecocokan CV dengan job description: keyword, skill, format, & saran perbaikan instan." },
  { icon: UserCircle, title: "Review CV by HR Expert", desc: "Analisis mendalam dari HR profesional 20+ tahun — temukan kekuatan, kelemahan, & quick wins.", badge: "Starter" },
  { icon: Briefcase, title: "Pelacak Lamaran", desc: "Catat & lacak status lamaran kerja kamu dalam satu dashboard. Kanban view, stats, reminder.", badge: "Baru" },
  { icon: Mic, title: "Simulasi Wawancara AI", desc: "Latihan interview dengan AI — dapatkan pertanyaan, jawab, dan terima feedback instan.", badge: "Pro+" },
  { icon: Search, title: "Lowongan Pekerjaan", desc: "Temukan lowongan terbaru yang relevan. Buat CV ATS dan lamar dengan percaya diri.", badge: "Baru" },
  { icon: Gift, title: "Program Referral", desc: "Ajak teman gabung, kamu dapat 1 bulan Starter gratis per referral yang upgrade.", badge: "Baru" },
  { icon: Download, title: "Export PDF Berkualitas", desc: "Hasil PDF rapi, ringan, dan terbaca sempurna oleh ATS maupun rekruter manusia." },
  { icon: ShieldCheck, title: "Aman & Privasi Terjaga", desc: "Data terenkripsi, hanya kamu yang bisa akses CV. Tidak dijual ke pihak ketiga." },
];

const steps = [
  { n: "01", title: "Daftar Gratis", desc: "Buat akun dengan email — verifikasi sekali, langsung mulai." },
  { n: "02", title: "Pilih Template", desc: "Pilih dari koleksi template ATS yang sudah teruji." },
  { n: "03", title: "Isi dengan Bantuan AI", desc: "AI membantu menulis & mengoptimalkan tiap bagian CV." },
  { n: "04", title: "Download & Lamar", desc: "Export PDF, lalu kirim ke perusahaan impian dengan percaya diri." },
];

const faqs = [
  { q: "Apa itu CV ATS friendly?", a: "CV yang formatnya bisa dibaca dengan baik oleh sistem Applicant Tracking System (ATS) yang dipakai perusahaan untuk menyaring lamaran. Cirinya: single-column, font standar, tanpa tabel/grafik rumit, struktur heading jelas." },
  { q: "Apakah benar-benar gratis?", a: "Ya. Paket Free bisa dipakai selamanya tanpa kartu kredit. Upgrade hanya jika butuh lebih banyak CV, AI, atau scoring." },
  { q: "Bisa untuk fresh graduate?", a: "Sangat bisa. Tersedia template khusus fresh graduate dan panduan AI yang membantu menonjolkan organisasi, magang, & proyek kuliah." },
  { q: "Apakah data CV saya aman?", a: "Aman. Semua data terenkripsi, akses dibatasi dengan otorisasi ketat (Row Level Security), dan kami tidak menjual data ke pihak manapun." },
  { q: "Bagaimana metode pembayaran?", a: "Berlangganan dapat dilakukan via QRIS, e-wallet (GoPay, OVO, Dana), dan transfer VA bank lokal Indonesia." },
];

function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-grad-hero relative overflow-hidden">
        <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:py-24 md:gap-16 lg:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="w-fit gap-1 bg-info text-info-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Didukung AI Bahasa Indonesia
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Bikin CV ATS Friendly dalam{" "}
              <span className="text-primary">10 menit</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
              Template profesional, saran AI, dan scoring otomatis — semua dalam Bahasa Indonesia.
              Tingkatkan peluang lolos screening HR & dapat panggilan interview.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/register">
                  Mulai Gratis <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/template">Lihat Template</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["Gratis selamanya", "Tanpa kartu kredit", "Export PDF instan"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-md rotate-1 rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/10">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="font-display text-lg font-bold text-foreground">Budi Santoso</div>
                  <div className="text-xs text-muted-foreground">Software Engineer · Jakarta</div>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15">ATS 92</Badge>
              </div>
              <div className="space-y-3">
                {[
                  ["Ringkasan", "100%"],
                  ["Pengalaman", "95%"],
                  ["Skill", "88%"],
                  ["Pendidikan", "100%"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-foreground">{label}</span>
                      <span className="text-muted-foreground">{val}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: val as string }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg bg-info p-3 text-xs text-info-foreground">
                <Sparkles className="mb-1 inline h-3.5 w-3.5" /> Saran AI: Tambahkan keyword "microservices" untuk lowongan ini.
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
                  <Zap className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Skor naik +18</div>
                  <div className="text-[10px] text-muted-foreground">setelah saran AI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM-SOLUTION */}
      <section className="container-page py-16 md:py-24">
        <div className="mx-auto grid gap-10 max-w-5xl md:grid-cols-2 md:items-center">
          <div>
            <Badge variant="secondary">Masalah</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              85% CV ditolak ATS sebelum dibaca manusia
            </h2>
            <p className="mt-4 text-muted-foreground">
              Mayoritas perusahaan besar di Indonesia dan multinasional menggunakan Applicant Tracking System (ATS) untuk menyaring CV. CV dengan format yang tidak standar, tabel, gambar, atau kolom akan langsung tersingkir — tidak peduli seberapa bagus isinya.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {[
                "Format CV tidak standar = langsung ditolak ATS",
                "Keyword tidak cocok dengan job description = skor rendah",
                "CV terlalu panjang / pendek = tidak optimal",
                "Foto, tabel, kolom = ATS gagal parsing",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <Badge className="bg-primary text-primary-foreground mb-4">Solusi</Badge>
            <h3 className="font-display text-xl font-bold">CVKarir membantu Anda lolos ATS</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { title: "Template ATS-ready", desc: "Format single-column standar, font terbaca mesin" },
                { title: "AI scoring real-time", desc: "Cek skor CV sebelum kirim, perbaiki dengan saran AI" },
                { title: "Keyword otomatis", desc: "AI ekstrak keyword dari job description target" },
                { title: "Panduan langkah demi langkah", desc: "AI bantu isi CV dari nol, cocok untuk pemula" },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section aria-label="Statistik" className="border-y border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            ["5.000+", "Pengguna"],
            ["10.000+", "CV dibuat"],
            ["92%", "Lolos screening ATS"],
            ["4.9/5", "Rating pengguna"],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-2xl font-bold text-primary md:text-3xl">{n}</div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur" className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Fitur Unggulan</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Semua yang kamu butuhkan untuk bikin CV pemenang
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dari template profesional sampai AI yang ngerti bahasa lowongan kerja Indonesia.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className={`border-border/70 transition-shadow hover:shadow-md ${f.badge ? 'relative overflow-visible' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  {f.badge && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      {f.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* HR REVIEW FEATURE HIGHLIGHT */}
      <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <Badge className="bg-amber-500 text-white mb-4">
                  <Crown className="h-3.5 w-3.5 mr-1" />
                  Fitur Eksklusif Starter & Pro
                </Badge>
                <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                  Review CV by <span className="text-amber-600">HR Expert</span>
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                  Dapat feedback langsung dari <strong>Hira AI</strong>, Senior HR Recruitment Consultant dengan pengalaman 20+ tahun di Fortune 500 companies.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Analisis kekuatan & kelemahan CV secara mendalam",
                    "Quick wins — perubahan yang bisa langsung diterapkan",
                    "Benchmark terhadap standar industri",
                    "Saran konkret berdasarkan job description",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8" size="lg">
                  <Link to="/harga">
                    Coba Sekarang <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <Card className="border-amber-200 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">HA</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Hira AI</h4>
                        <p className="text-sm text-muted-foreground">Senior HR Recruitment</p>
                        <p className="text-xs text-amber-600">20+ tahun pengalaman</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Skor Keseluruhan</span>
                          <span className="text-green-600 font-bold">85/100</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-green-500" style={{ width: '85%' }} />
                        </div>
                      </div>
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">✓ Kekuatan</p>
                        <p className="text-xs text-green-600 dark:text-green-500">Ringkasan profil kuat & terstruktur</p>
                      </div>
                      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">⚠️ Perlu Perbaikan</p>
                        <p className="text-xs text-red-600 dark:text-red-500">Tambahkan metrik kuantitatif di pengalaman</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -top-3 -right-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
                  HR Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">Cara Kerja</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              4 langkah, dari nol jadi CV siap kirim
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-card p-6">
                <div className="font-display text-3xl font-bold text-primary/70">{s.n}</div>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMPLATES */}
      <section className="container-page py-16 md:py-24">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <Badge variant="secondary">Template</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Template ATS yang teruji & enak dilihat
            </h2>
            <p className="mt-3 text-muted-foreground">
              Format single-column standar industri. Cocok untuk fresh graduate sampai profesional senior.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/template">Lihat semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Jakarta", template: JakartaTemplate, data: previewData.jakarta },
            { name: "Bandung", template: BandungTemplate, data: previewData.bandung },
            { name: "Bali", template: BaliTemplate, data: previewData.bali, badge: "Starter" },
            { name: "Medan", template: MedanTemplate, data: previewData.medan, badge: "Starter" },
          ].map(({ name, template: Template, data, badge }) => (
            <div key={name} className="group cursor-pointer">
              <Link to="/template">
                <div className="aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card p-3 transition-shadow group-hover:shadow-lg">
                  <div className="h-full overflow-hidden rounded bg-white shadow-sm" style={{ transform: "scale(0.55)", transformOrigin: "top left", width: "182%", height: "182%" }}>
                    <div className="p-4" style={{ fontSize: "11px", lineHeight: 1.4 }}>
                      <Template data={data} showHeader={true} />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-medium">{name}</div>
                {badge && <Badge className="bg-warning text-warning-foreground">{badge}</Badge>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING CTA */}
      <section id="harga" className="bg-muted/40 py-16 md:py-24">
        <div className="container-page text-center max-w-2xl mx-auto">
          <Badge variant="secondary">Harga</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Mulai gratis, upgrade kapan kamu siap
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Harga ramah kantong pelajar & fresh graduate. Mulai dari{" "}
            <strong className="text-foreground">Rp 0</strong> selamanya.
            Paket berbayar mulai Rp 19.000/bulan — setara 1 kopi kekinian.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/harga">
                Lihat Harga Lengkap <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link to="/register">Mulai Gratis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Cerita Pengguna</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Sudah membantu ribuan pelamar Indonesia
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { name: "Rina, Fresh Graduate", text: "Awalnya bingung mau nulis apa, AI-nya bantu banget. Dalam 2 minggu dapat 3 panggilan interview!" },
            { name: "Andi, Software Engineer", text: "Scoring fitur paling juara. Aku bisa langsung tahu kata kunci yang kurang sebelum kirim lamaran." },
            { name: "Sari, Career Switcher", text: "Template-nya rapi dan ATS-friendly beneran. Akhirnya CV-ku terbaca HR meski lewat portal lowongan." },
          ].map((t) => (
            <Card key={t.name}>
              <CardContent className="p-6">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-foreground">"{t.text}"</p>
                <div className="mt-4 text-xs font-medium text-muted-foreground">{t.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container-page max-w-3xl">
          <div className="text-center">
            <Badge variant="secondary">FAQ</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Pertanyaan yang sering ditanyakan
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 md:py-24">
        <div className="rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground md:px-12 md:py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Siap dapat panggilan interview lebih banyak?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Bergabung gratis sekarang. Bikin CV pertama dalam 10 menit dan langsung kirim ke perusahaan impian.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-8 text-base">
            <Link to="/register">Daftar Gratis Sekarang</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
