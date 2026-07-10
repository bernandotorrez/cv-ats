import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  FileSearch,
  FileText,
  Gift,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

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

const WHATSAPP_NUMBER = "6285190607141";
const STARTER_PAYMENT_URL = "https://lynk.id/ben-yt-ai/rj687wre6kr0";
const PRO_PAYMENT_URL = "http://lynk.id/ben-yt-ai/zq1y83lq1kek";

function getUpgradeWhatsAppUrl(tierName: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Halo, saya ingin Upgrade ${tierName}. Mohon info nomor rekening untuk transfer.`,
  )}`;
}

function getUpgradeUrl(tierName: string) {
  if (tierName === "Starter") return STARTER_PAYMENT_URL;
  if (tierName === "Pro") return PRO_PAYMENT_URL;
  return getUpgradeWhatsAppUrl(tierName);
}

const tiers = [
  {
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    desc: "Untuk mulai bikin CV pertama tanpa risiko.",
    highlight: "Tidak perlu kartu kredit",
    tone: "calm",
    features: [
      "1 CV aktif",
      "2 template basic",
      "5x saran AI / bulan",
      "1x scoring / bulan",
      "5x perbaiki teks / bulan",
      "10x guided mode / bulan",
      "5x AI chat / bulan",
      "Export PDF dengan watermark",
    ],
    cta: "Mulai gratis",
    ctaVariant: "outline" as const,
  },
  {
    name: "Starter",
    price: "Rp 15.000",
    period: "/bulan",
    badge: "Paling pas untuk apply kerja",
    desc: "Untuk pencari kerja aktif yang ingin CV lebih rapi, tajam, dan siap kirim.",
    highlight: "Setara 1 kopi, tapi bantu banyak lamaran",
    tone: "featured",
    features: [
      "3 CV aktif",
      "Sebagian template premium",
      "50x saran AI / bulan",
      "10x scoring / bulan",
      "50x perbaiki teks / bulan",
      "30x guided mode / bulan",
      "10x cover letter / bulan",
      "10x CV review HR / bulan",
      "20x AI Job Match Score / bulan",
      "20x keyword extractor / bulan",
      "10x Upload CV / bulan",
      "2x Enhance Foto / bulan",
      "50x AI chat / bulan",
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
    badge: "Untuk karier yang serius naik kelas",
    desc: "Untuk profesional yang butuh banyak versi CV, simulasi interview, dan insight lengkap.",
    highlight: "Paket paling lengkap",
    tone: "sharp",
    features: [
      "10 CV aktif",
      "Semua template premium",
      "200x saran AI / bulan",
      "50x scoring / bulan",
      "200x perbaiki teks / bulan",
      "100x guided mode / bulan",
      "50x cover letter / bulan",
      "50x CV review HR / bulan",
      "100x AI Job Match Score / bulan",
      "30x Auto Tailor CV / bulan",
      "100x keyword extractor / bulan",
      "20x Upload CV / bulan",
      "5x Enhance Foto / bulan",
      "50x simulasi wawancara / bulan",
      "200x AI chat / bulan",
      "CV comparison dan analitik CV",
      "Dukungan prioritas 24/7",
    ],
    cta: "Pilih Pro",
    ctaVariant: "outline" as const,
  },
];

const proof = [
  { icon: Users, stat: "5.000+", label: "pengguna aktif" },
  { icon: FileText, stat: "10.000+", label: "CV dibuat" },
  { icon: TrendingUp, stat: "92%", label: "skor ATS rata-rata" },
  { icon: Star, stat: "4.9/5", label: "rating pengguna" },
] as const;

const quickFit = [
  {
    icon: Gift,
    title: "Mulai dari Free",
    desc: "Coba alurnya dulu, buat CV pertama, dan lihat bagaimana AI membantu.",
  },
  {
    icon: Target,
    title: "Naik ke Starter",
    desc: "Pilihan paling masuk akal kalau kamu aktif apply dan ingin cek kecocokan CV dengan lowongan.",
  },
  {
    icon: Zap,
    title: "Pakai Pro",
    desc: "Untuk banyak role, versi CV tailored, dan latihan interview yang lebih intens.",
  },
] as const;

const comparison = [
  ["CV aktif", "1", "3", "10"],
  ["Template", "2 basic", "Semua", "Semua"],
  ["Upload CV (PDF/DOCX)", "Add-on (Rp 5.000 / bln)", "10x / bulan", "20x / bulan"],
  ["Foto Profesional AI", "Rp 5.000 / Kuota", "2x / bln (+Rp 5rb/Add-on)", "5x / bln (+Rp 5rb/Add-on)"],
  ["AI suggestions", "5x", "50x", "200x"],
  ["ATS scoring", "1x", "10x", "50x"],
  ["Perbaiki teks AI", "5x", "50x", "200x"],
  ["Cover letter", "-", "10x", "50x"],
  ["AI Job Match Score", "-", "20x", "100x"],
  ["Auto Tailor CV", "-", "-", "30x"],
  ["Keyword extractor", "-", "20x", "100x"],
  ["Review CV HR", "-", "10x", "50x"],
  ["Simulasi wawancara", "-", "-", "50x"],
  ["Export PDF", "Watermark", "Bersih", "Bersih"],
  ["CV comparison", "-", "-", "Ada"],
  ["Analitik CV", "-", "-", "Ada"],
];

const guarantees = [
  { icon: ShieldCheck, label: "Refund 7 hari" },
  { icon: LockKeyhole, label: "Data terenkripsi" },
  { icon: CreditCard, label: "Bayar via Lynk" },
] as const;

const faqs = [
  {
    q: "Apakah ada uji coba gratis?",
    a: "Ada. Paket Free bisa dipakai selamanya tanpa kartu kredit. Kamu bisa upgrade saat butuh kuota dan fitur yang lebih lengkap.",
  },
  {
    q: "Metode pembayaran apa saja?",
    a: "Paket Starter dan Pro bisa dibayar langsung lewat Lynk. Setelah pembayaran selesai diproses, akses paket akan diaktifkan.",
  },
  {
    q: "Bisa ganti atau berhenti paket kapan saja?",
    a: "Bisa. Paket berbayar aktif setelah pembayaran Lynk selesai diproses. Downgrade atau berhenti paket bisa dikonfirmasi lewat WhatsApp sebelum periode berikutnya.",
  },
  {
    q: "Bagaimana jika tidak cocok?",
    a: "Kamu bisa meminta refund 100% dalam 7 hari pertama untuk paket berbayar jika merasa fiturnya belum cocok.",
  },
  {
    q: "Apakah CV dan data saya aman?",
    a: "Ya. Data disimpan dengan proteksi keamanan, tidak dijual ke pihak ketiga, dan bisa kamu hapus kapan saja dari akunmu.",
  },
];

export const Route = createFileRoute("/harga")({
  pendingComponent: HargaLoading,
  head: () =>
    buildSeo({
      title: "Harga CV Pintar - Mulai Gratis, Upgrade Saat Siap",
      description:
        "Pilih paket CV Pintar: Free selamanya, Starter Rp 15.000/bulan, atau Pro Rp 35.000/bulan untuk AI CV, scoring ATS, review HR, Job Match Score, Tailor CV, cover letter, dan interview.",
      path: "/harga",
      keywords: "harga cv builder, cv ats murah, langganan cv ai indonesia, paket cv pintar",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: "CV Pintar Subscription",
          offers: tiers.map((tier) => ({
            "@type": "Offer",
            name: tier.name,
            price: tier.name === "Free" ? "0" : tier.name === "Starter" ? "15000" : "35000",
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        },
      ],
    }),
  component: HargaPage,
});

function HargaPage() {
  return (
    <main className="overflow-x-clip bg-background">
      <section className="border-b border-border/70">
        <div className="container-page grid gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.86fr)] md:items-center md:py-24">
          <div>
            <Badge className="mb-6 gap-2 border-yellow-200 bg-yellow-100 px-4 py-2 text-sm text-yellow-950 shadow-sm hover:bg-yellow-100">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Harga sederhana, hasilnya serius
            </Badge>

            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] text-foreground sm:text-5xl lg:text-6xl">
              Mulai gratis. Upgrade saat CV kamu mulai bekerja lebih keras.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Pilih paket sesuai ritme lamaranmu. Tidak ada kontrak panjang, tidak ada biaya
              tersembunyi, dan kamu bisa mengecek kecocokan CV dengan lowongan sebelum kirim.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <a href="#pilih-paket">
                  Bandingkan paket
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link to="/register">Mulai gratis</Link>
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {proof.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border bg-card p-3 shadow-sm"
                >
                  <item.icon className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
                  <dt className="font-display text-xl font-bold text-foreground">{item.stat}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <PriceSignal />
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {quickFit.map((item) => (
            <Card key={item.title} className="border-border/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">{item.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-card py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-4 px-3 py-1.5">
              Fitur lowongan
            </Badge>
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Paket berbayar membantu CV kamu lebih pas ke lowongan target.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Starter memberi kuota AI Job Match Score untuk mengecek kecocokan CV. Pro menambahkan
              Auto Tailor CV agar kamu bisa membuat versi yang lebih relevan untuk tiap lowongan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: FileSearch,
                title: "AI Job Match Score",
                tier: "Starter 20x, Pro 100x / bulan",
                desc: "Bandingkan CV dengan lowongan dari database, URL, atau job description untuk melihat match score dan keyword gap.",
              },
              {
                icon: RefreshCw,
                title: "Auto Tailor CV",
                tier: "Pro 30x / bulan",
                desc: "AI menyesuaikan ringkasan, urutan skill, dan bullet pengalaman agar lebih relevan tanpa mengarang data.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-border/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-bold text-foreground">{item.title}</h3>
                    <Badge className="bg-info text-info-foreground hover:bg-info">
                      {item.tier}
                    </Badge>
                  </div>
                  <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pilih-paket" className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Pilih paket"
            title="Bayar untuk momentum, bukan untuk fitur yang membingungkan."
            desc="Free cukup untuk mulai. Starter cocok untuk apply aktif. Pro memberi ruang lebih besar saat kamu mengejar beberapa peluang sekaligus."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {tiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="container-page py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Upload CV */}
          <Card className="border-yellow-200 bg-yellow-50/50 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-yellow-200/20 to-transparent pointer-events-none" />
            <CardContent className="p-8 flex-1 flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
                <Upload className="h-7 w-7" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-xl font-bold text-foreground">Hanya Butuh Fitur Upload CV?</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Upload CV lama (PDF/DOCX), biarkan AI membaca dan mengisi datanya otomatis ke template baru. Beli satuan hanya Rp 5.000 / bulan.
                </p>
              </div>
            </CardContent>
            <div className="px-8 pb-8 pt-0 z-10">
              <Button asChild size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                <a href="https://lynk.id/ben-yt-ai/qqom281ddwwm" target="_blank" rel="noopener noreferrer">
                  Beli Upload CV (Rp 5rb / bln)
                </a>
              </Button>
            </div>
          </Card>

          {/* Card 2: Foto Profesional */}
          <Card className="border-purple-200 bg-purple-50/50 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-purple-200/20 to-transparent pointer-events-none" />
            <CardContent className="p-8 flex-1 flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-xl font-bold text-foreground">Hanya Butuh Foto Profesional?</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Ubah foto kasual kamu menjadi pas foto formal jas hitam & dasi rapi kualitas studio foto secara instan. Beli satuan hanya Rp 5.000 / bulan.
                </p>
              </div>
            </CardContent>
            <div className="px-8 pb-8 pt-0 z-10">
              <Button asChild size="lg" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold">
                <a href="https://lynk.id/ben-yt-ai/zz5m163mknj6" target="_blank" rel="noopener noreferrer">
                  Beli Kuota Foto Pro AI (Rp 5rb / Kuota)
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <SectionIntro
          eyebrow="Detail fitur"
          title="Perbedaan paket yang mudah dibaca."
          desc="Fokus pada kuota yang benar-benar memengaruhi proses apply: jumlah CV, bantuan AI, scoring, review, dan interview."
        />

        <Card className="mt-10 overflow-hidden border-border/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Perbandingan fitur paket CV Pintar</caption>
              <thead>
                <tr className="border-b bg-muted/70">
                  <th scope="col" className="p-4 text-left font-bold text-foreground">
                    Fitur
                  </th>
                  <th scope="col" className="p-4 text-center font-bold text-foreground">
                    Free
                  </th>
                  <th
                    scope="col"
                    className="bg-primary/10 p-4 text-center font-bold text-foreground"
                  >
                    Starter
                  </th>
                  <th scope="col" className="p-4 text-center font-bold text-foreground">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row[0]} className="border-b last:border-0">
                    <th scope="row" className="p-4 text-left font-semibold text-foreground">
                      {row[0]}
                    </th>
                    <td className="p-4 text-center text-muted-foreground">{row[1]}</td>
                    <td className="bg-primary/5 p-4 text-center font-semibold text-foreground">
                      {row[2]}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container-page grid gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
          <div>
            <Badge className="mb-5 border-white/25 bg-white/15 text-white hover:bg-white/15">
              Pembayaran
            </Badge>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Starter dan Pro bisa langsung dibayar lewat Lynk.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-primary-foreground/85">
              Klik tombol Starter atau Pro untuk menuju halaman pembayaran Lynk sesuai paket yang
              kamu pilih.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {guarantees.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-4"
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4 px-3 py-1.5">
              FAQ
            </Badge>
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Pertanyaan sebelum memilih paket.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Pricing yang baik harus jelas dari awal. Ini beberapa hal yang biasanya ditanyakan
              sebelum upgrade.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="rounded-xl border border-border bg-card px-4"
          >
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="leading-7 text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="container-page pb-16 md:pb-24">
        <div className="grid gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <Badge className="mb-5 bg-primary text-primary-foreground">Mulai hari ini</Badge>
            <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              CV yang lebih siap bisa dimulai tanpa bayar dulu.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Buat akun, pilih template, isi CV, lalu upgrade hanya saat kamu butuh kuota dan fitur
              yang lebih kuat.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <a href={STARTER_PAYMENT_URL} target="_blank" rel="noreferrer">
                Bayar Starter
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <Link to="/register">Mulai gratis</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function PricingCard({ tier }: { tier: (typeof tiers)[number] }) {
  const featured = tier.popular;
  const isStarter = tier.name === "Starter";
  const isPro = tier.name === "Pro";
  const isLynkPayment = isStarter || isPro;

  return (
    <Card
      className={`relative h-full border-border/80 shadow-sm ${
        featured ? "border-primary bg-background shadow-lg shadow-primary/10" : "bg-card"
      }`}
    >
      {tier.badge && (
        <div className="absolute -top-4 left-5 right-5 flex justify-center">
          <Badge
            className={
              featured
                ? "bg-primary px-4 py-1.5 text-primary-foreground"
                : "border-yellow-200 bg-yellow-100 px-4 py-1.5 text-yellow-950 hover:bg-yellow-100"
            }
          >
            {tier.badge}
          </Badge>
        </div>
      )}

      <CardContent className="flex h-full flex-col p-6 pt-9">
        <div>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">{tier.name}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{tier.desc}</p>
            </div>
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                featured ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}
            >
              {tier.name === "Free" ? (
                <Gift className="h-5 w-5" aria-hidden="true" />
              ) : tier.name === "Starter" ? (
                <Wand2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
          </div>

          <div className="border-y border-border py-5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-display text-4xl font-bold text-foreground">{tier.price}</span>
              <span className="font-medium text-muted-foreground">{tier.period}</span>
            </div>
            <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-primary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {tier.highlight}
            </p>
          </div>
        </div>

        {tier.name === "Free" ? (
          <Button
            asChild
            size="lg"
            variant={tier.ctaVariant}
            className={`mt-6 h-12 w-full text-base ${featured ? "shadow-sm" : ""}`}
          >
            <Link to="/register">
              {tier.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <>
            <Button
              asChild
              size="lg"
              variant={tier.ctaVariant}
              className={`mt-6 h-12 w-full text-base ${featured ? "shadow-sm" : ""}`}
            >
              <a href={getUpgradeUrl(tier.name)} target="_blank" rel="noreferrer">
                {tier.cta}
                {isLynkPayment ? (
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                )}
              </a>
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
              {isLynkPayment
                ? `Tombol ini membuka halaman pembayaran Lynk untuk paket ${tier.name}.`
                : `Tombol ini membuka WhatsApp untuk konfirmasi Upgrade ${tier.name}.`}
            </p>
          </>
        )}

        <ul className="mt-6 space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm leading-6">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PriceSignal() {
  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Rekomendasi cepat
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Starter</h2>
            </div>
            <Badge className="bg-primary text-primary-foreground">Rp 15.000</Badge>
          </div>

          <div className="space-y-3">
            {[
              { icon: Wand2, title: "Banyak apply", desc: "50x saran AI dan 10x scoring" },
              {
                icon: FileSearch,
                title: "Cek kecocokan",
                desc: "20x AI Job Match Score / bulan",
              },
              {
                icon: MessageSquareText,
                title: "Lebih siap kirim",
                desc: "Cover letter, keyword extractor, dan review HR",
              },
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
            <p className="font-bold">Untuk kebanyakan pencari kerja aktif:</p>
            <p className="mt-2 leading-7 text-primary-foreground/90">
              Starter biasanya sudah cukup untuk memperbaiki CV, menyesuaikan lamaran, dan menjaga
              PDF tetap bersih tanpa watermark.
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

function HargaLoading() {
  return (
    <main className="overflow-x-clip bg-background">
      <section className="border-b border-border/70">
        <div className="container-page py-16 md:py-24">
          <div className="h-9 w-64 animate-pulse rounded-full bg-muted" />
          <div className="mt-8 h-14 max-w-3xl animate-pulse rounded-lg bg-muted" />
          <div className="mt-4 h-8 max-w-2xl animate-pulse rounded-lg bg-muted" />
        </div>
      </section>
      <div className="container-page py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
