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
  Minus,
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
import { buildSeo } from "@/lib/seo";
import { CtaBanner, Eyebrow, PageHero, SectionHeader } from "@/components/site/marketing";

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
      "1x saran AI / bulan",
      "1x scoring / bulan",
      "1x perbaiki teks / bulan",
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
  [
    "Foto Profesional AI",
    "Rp 5.000 / Kuota",
    "2x / bln (+Rp 5rb/Add-on)",
    "5x / bln (+Rp 5rb/Add-on)",
  ],
  ["AI suggestions", "1x", "50x", "200x"],
  ["ATS scoring", "1x", "10x", "50x"],
  ["Perbaiki teks AI", "1x", "50x", "200x"],
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

const PER_DAY: Record<string, string> = {
  Starter: "≈ Rp 500 / hari",
  Pro: "≈ Rp 1.200 / hari",
};

const KEY_FEATURE_COUNT = 8;

function NewTabHint() {
  return <span className="sr-only"> (membuka tab baru)</span>;
}

function HargaPage() {
  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Harga sederhana, hasilnya serius
          </>
        }
        title={
          <>
            Mulai gratis.{" "}
            <span className="text-green-700">Upgrade saat CV kamu mulai bekerja lebih keras.</span>
          </>
        }
        desc="Pilih paket sesuai ritme lamaranmu. Tanpa kontrak panjang, tanpa biaya tersembunyi."
      >
        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {guarantees.map((g) => (
            <li
              key={g.label}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm"
            >
              <g.icon aria-hidden="true" className="h-4 w-4 text-green-700" />
              {g.label}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* Pricing cards — right after hero */}
      <section
        id="pilih-paket"
        aria-labelledby="paket-heading"
        className="scroll-mt-20 pb-20 lg:pb-28"
      >
        <div className="container-page">
          <h2 id="paket-heading" className="sr-only">
            Pilih paket
          </h2>
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3 lg:items-start">
            {tiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-600">
            Butuh detail kuota?{" "}
            <a
              href="#perbandingan"
              className="font-bold text-green-800 underline underline-offset-4"
            >
              Lihat perbandingan lengkap
            </a>
          </p>
        </div>
      </section>

      {/* Which plan fits */}
      <section aria-labelledby="fit-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="fit-heading"
            eyebrow="Panduan memilih"
            title="Paket mana yang cocok untukmu?"
            desc="Free cukup untuk mulai. Starter cocok untuk apply aktif. Pro memberi ruang lebih besar saat kamu mengejar beberapa peluang sekaligus."
          />
          <ol className="grid gap-5 md:grid-cols-3">
            {quickFit.map((item, i) => (
              <li
                key={item.title}
                className={`relative rounded-2xl border bg-white p-7 ${
                  i === 1 ? "border-2 border-green-700 shadow-xl" : "border-gray-200"
                }`}
              >
                {i === 1 && (
                  <span className="absolute -top-3 left-7 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold text-gray-900">
                    Paling banyak dipilih
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <item.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Job match highlight */}
      <section aria-labelledby="lowongan-heading" className="py-20 lg:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Eyebrow>Fitur lowongan</Eyebrow>
            <h2
              id="lowongan-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Paket berbayar bikin CV-mu{" "}
              <span className="text-green-700">lebih pas ke lowongan target.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Starter memberi kuota AI Job Match Score untuk mengecek kecocokan CV. Pro menambahkan
              Auto Tailor CV agar kamu bisa membuat versi yang lebih relevan untuk tiap lowongan.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: FileSearch,
                title: "AI Job Match Score",
                tier: "Starter 20x · Pro 100x / bulan",
                desc: "Bandingkan CV dengan lowongan dari database, URL, atau job description untuk melihat match score dan keyword gap.",
              },
              {
                icon: RefreshCw,
                title: "Auto Tailor CV",
                tier: "Pro 30x / bulan",
                desc: "AI menyesuaikan ringkasan, urutan skill, dan bullet pengalaman agar lebih relevan tanpa mengarang data.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white">
                  <item.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                  {item.tier}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Add-ons */}
      <section aria-labelledby="addon-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="addon-heading"
            eyebrow="Add-on satuan"
            title="Cuma butuh satu fitur? Beli satuan."
            desc="Tanpa langganan paket. Cukup Rp 5.000 untuk fitur yang kamu perlukan."
          />
          <ul className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {[
              {
                icon: Upload,
                title: "Upload CV Lama",
                desc: "Upload CV lama (PDF/DOCX), biarkan AI membaca dan mengisi datanya otomatis ke template baru.",
                price: "Rp 5.000",
                unit: "/ bulan",
                href: "https://lynk.id/ben-yt-ai/qqom281ddwwm",
                cta: "Beli Upload CV",
              },
              {
                icon: Sparkles,
                title: "Foto Profesional AI",
                desc: "Ubah foto kasual menjadi pas foto formal jas hitam & dasi rapi kualitas studio foto secara instan.",
                price: "Rp 5.000",
                unit: "/ kuota",
                href: "https://lynk.id/ben-yt-ai/zz5m163mknj6",
                cta: "Beli Kuota Foto Pro AI",
              },
            ].map((a) => (
              <li
                key={a.title}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-gray-900">
                    <a.icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900">{a.title}</h3>
                    <p className="mt-1">
                      <span className="font-display text-2xl font-extrabold text-gray-900">
                        {a.price}
                      </span>{" "}
                      <span className="text-sm font-medium text-gray-600">{a.unit}</span>
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600">{a.desc}</p>
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-white px-6 text-base font-bold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
                >
                  {a.cta}
                  <CreditCard aria-hidden="true" className="h-4 w-4" />
                  <NewTabHint />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comparison */}
      <section
        id="perbandingan"
        aria-labelledby="compare-heading"
        className="scroll-mt-20 py-20 lg:py-28"
      >
        <div className="container-page">
          <SectionHeader
            id="compare-heading"
            eyebrow="Detail fitur"
            title="Perbedaan paket yang mudah dibaca."
            desc="Fokus pada kuota yang benar-benar memengaruhi proses apply: jumlah CV, bantuan AI, scoring, review, dan interview."
          />
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Tabel perbandingan paket, bisa digeser"
            >
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Perbandingan fitur paket CV Pintar</caption>
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="p-4 text-left font-bold text-gray-900">
                      Fitur
                    </th>
                    <th scope="col" className="p-4 text-center font-bold text-gray-900">
                      Free
                    </th>
                    <th scope="col" className="bg-green-700 p-4 text-center font-bold text-white">
                      Starter
                    </th>
                    <th scope="col" className="p-4 text-center font-bold text-gray-900">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row[0]} className="border-t border-gray-200">
                      <th scope="row" className="p-4 text-left font-semibold text-gray-900">
                        {row[0]}
                      </th>
                      {row.slice(1).map((cell, i) => (
                        <td
                          key={i}
                          className={`p-4 text-center ${i === 1 ? "bg-green-50 font-semibold text-gray-900" : "text-gray-700"}`}
                        >
                          {cell === "-" ? (
                            <>
                              <Minus aria-hidden="true" className="mx-auto h-4 w-4 text-gray-500" />
                              <span className="sr-only">Tidak tersedia</span>
                            </>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Proof */}
      <section aria-label="Bukti performa" className="container-page">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 md:grid-cols-4">
          {proof.map((item) => (
            <div key={item.label} className="flex items-center gap-4 bg-white p-5 sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                <item.icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-sm font-medium capitalize text-gray-600">{item.label}</dt>
                <dd className="font-display text-2xl font-extrabold leading-none text-gray-900">
                  {item.stat}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="py-20 lg:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2
              id="faq-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Pertanyaan sebelum memilih paket.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Pricing yang baik harus jelas dari awal. Masih ragu?{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-green-800 underline underline-offset-4"
              >
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                Tanya via WhatsApp
                <NewTabHint />
              </a>
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${index}`}
                className="rounded-xl border border-gray-200 bg-white px-5 shadow-sm"
              >
                <AccordionTrigger className="min-h-11 text-left text-base font-bold text-gray-900 hover:no-underline hover:text-green-800">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-gray-600 sm:text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <CtaBanner
        title="CV yang lebih siap bisa dimulai tanpa bayar dulu."
        desc="Buat akun, pilih template, isi CV, lalu upgrade hanya saat kamu butuh kuota dan fitur yang lebih kuat."
        cta="Mulai Gratis"
        points={["Paket Free selamanya", "Refund 7 hari", "Bayar aman via Lynk"]}
        secondary={{ href: STARTER_PAYMENT_URL, label: "Langsung Pilih Starter" }}
      />
    </div>
  );
}

function PricingCard({ tier }: { tier: (typeof tiers)[number] }) {
  const featured = !!tier.popular;
  const isFree = tier.name === "Free";
  const keyFeatures = tier.features.slice(0, KEY_FEATURE_COUNT);
  const more = tier.features.length - keyFeatures.length;
  const Icon = isFree ? Gift : tier.name === "Starter" ? Wand2 : BadgeCheck;

  const btnBase =
    "mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-bold transition-colors";
  const btnTone = featured
    ? "bg-yellow-300 text-gray-950 hover:bg-yellow-200"
    : "border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white";

  return (
    <article
      aria-labelledby={`tier-${tier.name}`}
      className={`relative flex h-full flex-col rounded-3xl p-7 ${
        featured
          ? "order-first bg-green-800 text-white shadow-2xl lg:order-none shadow-green-900/30 lg:-mt-4 lg:pb-11 lg:pt-11"
          : "border border-gray-200 bg-white shadow-sm"
      }`}
    >
      {tier.badge && (
        <p
          className={`absolute -top-3.5 left-7 rounded-full px-3 py-1 text-xs font-bold ${
            featured ? "bg-yellow-300 text-gray-900" : "bg-gray-900 text-white"
          }`}
        >
          {tier.badge}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <h3 id={`tier-${tier.name}`} className="font-display text-2xl font-extrabold">
          {tier.name}
        </h3>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            featured ? "bg-white/15 text-yellow-300" : "bg-green-100 text-green-800"
          }`}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-2 text-sm leading-relaxed ${featured ? "text-green-50" : "text-gray-600"}`}>
        {tier.desc}
      </p>

      <div className={`mt-6 border-y py-5 ${featured ? "border-white/20" : "border-gray-200"}`}>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-4xl font-extrabold">{tier.price}</span>
          <span className={`font-medium ${featured ? "text-green-100" : "text-gray-600"}`}>
            {tier.period}
          </span>
        </p>
        <p
          className={`mt-1 text-sm font-semibold ${featured ? "text-yellow-200" : "text-green-800"}`}
        >
          {PER_DAY[tier.name] ?? tier.highlight}
        </p>
        {PER_DAY[tier.name] && (
          <p className={`mt-1 text-sm ${featured ? "text-green-50" : "text-gray-600"}`}>
            {tier.highlight}
          </p>
        )}
      </div>

      {isFree ? (
        <Link
          to="/register"
          data-analytics-event="click_pricing_free"
          className={`${btnBase} ${btnTone}`}
        >
          {tier.cta}
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
      ) : (
        <a
          href={getUpgradeUrl(tier.name)}
          target="_blank"
          rel="noreferrer"
          data-analytics-event={`click_pricing_${tier.name.toLowerCase()}`}
          className={`${btnBase} ${btnTone}`}
        >
          {tier.cta}
          <CreditCard aria-hidden="true" className="h-5 w-5" />
          <NewTabHint />
        </a>
      )}
      <p className={`mt-3 text-center text-xs ${featured ? "text-green-50" : "text-gray-600"}`}>
        {isFree ? "Bisa upgrade kapan saja" : "Pembayaran aman via Lynk · Refund 7 hari"}
      </p>

      <ul className="mt-6 space-y-3 text-sm">
        {keyFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              className={`mt-0.5 h-5 w-5 shrink-0 ${featured ? "text-yellow-300" : "text-green-700"}`}
            />
            <span className={featured ? "text-white" : "text-gray-800"}>{feature}</span>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <details className="group mt-3 text-sm">
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center gap-1 font-bold underline underline-offset-4 ${
              featured ? "text-yellow-200" : "text-green-800"
            }`}
          >
            <span className="group-open:hidden">+ {more} fitur lainnya</span>
            <span className="hidden group-open:inline">Sembunyikan</span>
          </summary>
          <ul className="mt-2 space-y-3">
            {tier.features.slice(KEY_FEATURE_COUNT).map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2
                  aria-hidden="true"
                  className={`mt-0.5 h-5 w-5 shrink-0 ${featured ? "text-yellow-300" : "text-green-700"}`}
                />
                <span className={featured ? "text-white" : "text-gray-800"}>{feature}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function HargaLoading() {
  return (
    <div className="overflow-x-clip bg-white">
      <section className="border-b border-gray-100">
        <div className="container-page py-16 md:py-24">
          <div className="mx-auto h-9 w-64 animate-pulse rounded-full bg-gray-100" />
          <div className="mx-auto mt-8 h-14 max-w-3xl animate-pulse rounded-lg bg-gray-100" />
          <div className="mx-auto mt-4 h-8 max-w-2xl animate-pulse rounded-lg bg-gray-100" />
        </div>
      </section>
      <div className="container-page py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
