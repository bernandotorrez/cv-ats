/**
 * /tryout-cpns — Landing page publik untuk Tryout SKD.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  Loader2,
  Star,
  Trophy,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { type TryoutPackage } from "@/lib/tryout-types";
import { useCheckout } from "@/lib/payment";
import {
  AnchorCta,
  Eyebrow,
  PrimaryCta,
  SectionHeader,
  TrustChecks,
} from "@/components/site/marketing";

export const Route = createFileRoute("/tryout-cpns")({
  head: () =>
    buildSeo({
      title: "Tryout CPNS SKD 2026: 110 Soal TWK TIU TKP | CV Pintar",
      description:
        "Tryout CPNS SKD 2026 online: 110 soal sesuai kisi-kisi BKN, timer 100 menit, passing grade resmi, skor instan, dan pembahasan lengkap. Mulai Rp 15.000.",
      path: "/tryout-cpns",
      keywords:
        "tryout cpns 2026, tryout SKD online, simulasi SKD CPNS, latihan soal SKD, soal TWK TIU TKP, tryout SKD gratis, passing grade SKD, pembahasan SKD CPNS, simulasi ujian CPNS online, tryout cpns terbaru, bank soal CPNS, kisi-kisi SKD BKN 2026",
      jsonLd: [
        // BreadcrumbList
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
            {
              "@type": "ListItem",
              position: 2,
              name: "Tryout CPNS SKD 2026",
              item: "https://cvpintar.web.id/tryout-cpns",
            },
          ],
        },
        // Course schema
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Tryout Simulasi SKD CPNS 2026 Online",
          description:
            "Simulasi ujian Seleksi Kompetensi Dasar (SKD) CPNS dengan 110 soal (TWK, TIU, TKP), timer 100 menit, passing grade sesuai BKN, pembahasan lengkap, dan leaderboard nasional.",
          provider: {
            "@type": "Organization",
            name: "CV Pintar",
            url: "https://cvpintar.web.id",
          },
          educationalLevel: "Professional",
          teaches: "Seleksi Kompetensi Dasar CPNS",
          timeRequired: "PT100M",
          numberOfCredits: 110,
          isAccessibleForFree: false,
          offers: [
            {
              "@type": "Offer",
              name: "Tryout Satuan",
              price: "15000",
              priceCurrency: "IDR",
              category: "Satuan",
              availability: "https://schema.org/InStock",
              url: "https://cvpintar.web.id/tryout-cpns",
            },
            {
              "@type": "Offer",
              name: "Paket Lengkap 5x Tryout",
              price: "50000",
              priceCurrency: "IDR",
              category: "Lengkap",
              availability: "https://schema.org/InStock",
              url: "https://cvpintar.web.id/tryout-cpns",
            },
          ],
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: "PT100M",
          },
        },
        // FAQPage schema
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Apa itu Tryout SKD CPNS?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Tryout SKD CPNS adalah simulasi ujian Seleksi Kompetensi Dasar yang terdiri dari 110 soal (TWK 30, TIU 35, TKP 45) dengan waktu 100 menit, sesuai format ujian asli dari BKN.",
              },
            },
            {
              "@type": "Question",
              name: "Berapa passing grade SKD CPNS 2026?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Passing grade SKD: TWK minimal 65, TIU minimal 80, TKP minimal 166. Peserta harus memenuhi passing grade ketiga subtes untuk dinyatakan lulus.",
              },
            },
            {
              "@type": "Question",
              name: "Apakah soal tryout sesuai kisi-kisi BKN?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Ya, soal disusun mengikuti kisi-kisi BKN terbaru dengan komposisi 30 soal TWK, 35 soal TIU, dan 45 soal TKP.",
              },
            },
            {
              "@type": "Question",
              name: "Berapa harga tryout SKD?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Tersedia 2 paket: Tryout Satuan Rp 15.000 (1x tryout) dan Paket Lengkap Rp 50.000 (5x tryout + pembahasan + leaderboard).",
              },
            },
            {
              "@type": "Question",
              name: "Bisa diakses lewat HP?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Bisa. Tryout didesain mobile-first dan berjalan lancar di smartphone Android dan iOS menggunakan browser Chrome atau Safari.",
              },
            },
            {
              "@type": "Question",
              name: "Apakah ada pembahasan soal?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Ya, pembahasan lengkap tersedia di Paket Lengkap. Setiap soal dilengkapi penjelasan mengapa jawaban tersebut benar.",
              },
            },
          ],
        },
        // WebPage schema
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Tryout CPNS SKD Online 2026",
          description:
            "Halaman utama Tryout SKD CPNS 2026 di CV Pintar. Latihan soal SKD online dengan 110 soal, timer 100 menit, dan pembahasan.",
          url: "https://cvpintar.web.id/tryout-cpns",
          inLanguage: "id-ID",
          isPartOf: {
            "@type": "WebSite",
            name: "CV Pintar",
            url: "https://cvpintar.web.id",
          },
          about: {
            "@type": "Thing",
            name: "Tryout SKD CPNS",
          },
          datePublished: "2026-08-04",
          dateModified: "2026-08-04",
        },
      ],
    }),
  component: TryoutCpnsLandingPage,
});

const faqs = [
  {
    q: "Apakah soalnya mirip ujian asli?",
    a: "Ya. Soal disusun mengikuti kisi-kisi BKN terbaru dengan komposisi 30 TWK, 35 TIU, dan 45 TKP. Tingkat kesulitan setara ujian asli.",
  },
  {
    q: "Bisa dikerjakan di HP?",
    a: "Bisa. Tryout didesain mobile-first dan berjalan lancar di smartphone. Disarankan menggunakan browser Chrome/Safari terbaru.",
  },
  {
    q: "Berapa passing grade SKD?",
    a: "TWK minimal 65, TIU minimal 80, TKP minimal 166. Ketiga subtes harus memenuhi passing grade agar dinyatakan LULUS.",
  },
  {
    q: "Berapa lama akses tryout berlaku?",
    a: "Kredit tryout berlaku 12 bulan sejak aktivasi. Kamu bisa gunakan kapan saja sesuai kebutuhan persiapan.",
  },
  {
    q: "Bagaimana jika koneksi terputus di tengah ujian?",
    a: "Jawaban otomatis tersimpan lokal (localStorage) setiap ada perubahan. Setelah koneksi pulih, submit akan dilakukan otomatis.",
  },
  {
    q: "Bisa diulang untuk set yang sama?",
    a: "Bisa, selama kamu punya kredit tersisa. Setiap attempt menggunakan 1 kredit.",
  },
];

const features = [
  {
    icon: Clock,
    title: "Timer Realistis",
    desc: "100 menit sesuai standar BKN. Auto-submit saat waktu habis.",
  },
  {
    icon: BarChart3,
    title: "Skor Real-time",
    desc: "Skor TWK, TIU, TKP keluar seketika. Status lulus per subtes.",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    desc: "Bersaing sehat dengan pejuang SKD se-Indonesia. Top 10 tampil di papan peringkat.",
  },
  {
    icon: FileCheck,
    title: "Pembahasan",
    desc: "Setiap soal ada pembahasan detail. Tersedia di paket Lengkap.",
  },
] as const;

const subtests = [
  { label: "TWK", fullName: "Tes Wawasan Kebangsaan", count: 30, passing: 65, max: 150 },
  { label: "TIU", fullName: "Tes Intelegensi Umum", count: 35, passing: 80, max: 175 },
  { label: "TKP", fullName: "Tes Karakteristik Pribadi", count: 45, passing: 166, max: 225 },
] as const;

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

function TryoutCpnsLandingPage() {
  const [packages, setPackages] = useState<TryoutPackage[]>([]);
  const checkout = useCheckout();

  useEffect(() => {
    void supabase
      .from("tryout_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setPackages(data as unknown as TryoutPackage[]);
      });
  }, []);

  // Highest per-tryout price is the baseline for "hemat" badges.
  const basePerCredit = packages.reduce(
    (max, p) => (p.credits > 0 ? Math.max(max, p.price / p.credits) : max),
    0,
  );

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section
        aria-labelledby="tryout-heading"
        className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white pb-16 pt-10 lg:pb-24 lg:pt-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-green-200/50 blur-3xl"
        />
        <div className="container-page relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex max-w-2xl flex-col items-start">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-800 shadow-sm">
                <Trophy aria-hidden="true" className="h-4 w-4" />
                Simulasi SKD Terlengkap 2026
              </span>
              <h1
                id="tryout-heading"
                className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
              >
                Tryout SKD realistis <span className="text-green-700">untuk lulus CPNS.</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                110 soal sesuai kisi-kisi BKN (30 TWK + 35 TIU + 45 TKP), timer 100 menit, passing
                grade sesuai standar, dan pembahasan lengkap di paket premium.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <PrimaryCta to="/tryout">Mulai Tryout Gratis</PrimaryCta>
                <AnchorCta href="#paket">Lihat Paket Harga</AnchorCta>
              </div>
              <TrustChecks
                items={["110 soal standar BKN", "Timer 100 menit", "Passing grade akurat"]}
              />
            </div>

            <div className="relative mx-auto w-full max-w-md px-4 sm:px-8 lg:px-0">
              <img
                src="/images/hero-cpns.webp"
                alt="Dua peserta CPNS SKD yang optimis dan lulus"
                className="h-auto w-full object-contain drop-shadow-xl"
                fetchPriority="high"
              />
              <div
                aria-hidden="true"
                className="absolute -left-2 top-4 w-44 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl animate-float sm:-left-6"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Skor terakhir
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold text-gray-900">
                  405<span className="text-base font-semibold text-gray-600">/550</span>
                </p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Lulus PG
                </p>
              </div>
              <div
                aria-hidden="true"
                className="absolute -right-2 bottom-6 w-48 rounded-2xl bg-green-800 p-4 text-white shadow-xl animate-float-delayed sm:-right-6"
              >
                <p className="flex items-center gap-2 text-sm font-bold">
                  <FileCheck className="h-4 w-4 text-yellow-300" /> Simulasi CAT
                </p>
                <div className="mt-3 space-y-2 text-xs font-semibold">
                  {[
                    ["TWK", "100%"],
                    ["TIU", "100%"],
                    ["TKP", "82%"],
                  ].map(([l, w]) => (
                    <div key={l}>
                      <div className="mb-1 flex justify-between">
                        <span>{l}</span>
                        <span>{w}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-green-950/60">
                        <div className="h-full rounded-full bg-yellow-300" style={{ width: w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="kenapa-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="kenapa-heading"
            eyebrow="Kenapa CV Pintar"
            title="Persiapan SKD yang realistis, terukur, dan terarah."
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white">
                  <f.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="paket"
        aria-labelledby="paket-heading"
        className="scroll-mt-20 bg-gray-50 py-20 lg:py-28"
      >
        <div className="container-page">
          <SectionHeader
            id="paket-heading"
            eyebrow="Paket tryout"
            title="Pilih paket, mulai latihan hari ini."
            desc="Mulai dari 1x tryout sampai paket lengkap dengan pembahasan + leaderboard."
          />
          {packages.length === 0 ? (
            <div
              aria-busy="true"
              aria-label="Memuat paket"
              className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2"
            >
              {[0, 1].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl bg-gray-200" />
              ))}
            </div>
          ) : (
            <ul className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 md:items-start">
              {packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className={pkg.slug === "lengkap" ? "order-first md:order-none" : undefined}
                >
                  <PackageCard pkg={pkg} basePerCredit={basePerCredit} checkout={checkout} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-8 text-center text-sm text-gray-600">
            Pembayaran via QRIS · Kredit aktif otomatis setelah bayar · Kredit berlaku 12 bulan
          </p>
        </div>
      </section>

      {/* Exam format */}
      <section aria-labelledby="format-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="format-heading"
            eyebrow={
              <>
                <BookOpen aria-hidden="true" className="h-4 w-4" /> Format ujian
              </>
            }
            title="Format ujian SKD & passing grade."
            desc="Kenali komposisi soal dan nilai minimum tiap subtes sebelum mulai berlatih."
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {subtests.map((s) => (
              <li key={s.label} className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="font-display text-3xl font-extrabold text-green-700">{s.label}</p>
                <p className="text-sm font-medium text-gray-700">{s.fullName}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Jumlah soal</dt>
                    <dd className="font-bold text-gray-900">{s.count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Skor maksimal</dt>
                    <dd className="font-bold text-gray-900">{s.max}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <dt className="font-semibold text-gray-900">Passing grade</dt>
                    <dd className="font-extrabold text-green-800">{s.passing}</dd>
                  </div>
                </dl>
                <div aria-hidden="true" className="relative mt-4 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{ width: `${(s.passing / s.max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div
            role="note"
            className="mt-8 flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-sm"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
            <p className="text-gray-900">
              <strong>Penting:</strong> kamu harus lulus <strong>ketiga subtes</strong> untuk
              dinyatakan LULUS. Total skor tinggi tidak cukup jika satu subtes tidak memenuhi
              passing grade.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2
              id="faq-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Pertanyaan sering diajukan.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Segala hal yang perlu kamu ketahui tentang simulasi tryout SKD CPNS.
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

      {/* Final CTA */}
      <section className="container-page py-16 lg:py-24">
        <div className="relative flex flex-col items-center justify-between gap-10 overflow-hidden rounded-3xl bg-green-700 px-6 py-12 text-white shadow-2xl sm:px-12 lg:flex-row lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-green-600/40 blur-2xl"
          />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Siap lulus SKD? Mulai latihan dari sekarang.
            </h2>
            <p className="mt-4 text-base text-green-50 sm:text-lg">
              Setiap tryout membuatmu lebih siap menghadapi ujian asli BKN.
            </p>
            <ul className="mt-8 grid gap-3 text-sm font-semibold text-green-50 sm:grid-cols-2">
              {[
                "110 Soal Standar BKN",
                "Timer 100 Menit Realistis",
                "Pembahasan Lengkap & Akurat",
                "Passing Grade Resmi BKN 2026",
              ].map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-yellow-300" />
                  {p}
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-10 h-14 w-full rounded-xl bg-yellow-300 px-8 text-base font-extrabold text-gray-950 shadow-lg hover:bg-yellow-200 sm:w-auto"
            >
              <Link to={"/tryout" as never}>
                Mulai Tryout SKD Sekarang
                <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <img
            src="/images/cta-asn-female.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="relative w-full max-w-[260px] rounded-2xl border-4 border-white/20 object-cover shadow-2xl lg:max-w-[340px]"
          />
        </div>
      </section>
    </div>
  );
}

function PackageCard({
  pkg,
  basePerCredit,
  checkout,
}: {
  pkg: TryoutPackage;
  basePerCredit: number;
  checkout: ReturnType<typeof useCheckout>;
}) {
  const product = `tryout:${pkg.slug}` as const;
  const featured = pkg.slug === "lengkap";
  const perCredit = pkg.credits > 0 ? pkg.price / pkg.credits : pkg.price;
  const savings = basePerCredit > 0 ? Math.round((1 - perCredit / basePerCredit) * 100) : 0;
  const extras = [
    pkg.has_pembahasan && { icon: FileCheck, label: "Pembahasan" },
    pkg.has_analytics && { icon: BarChart3, label: "Analytics" },
    pkg.has_leaderboard && { icon: Trophy, label: "Leaderboard" },
  ].filter(Boolean) as { icon: typeof Trophy; label: string }[];

  return (
    <article
      aria-labelledby={`pkg-${pkg.slug}`}
      className={`relative flex h-full flex-col rounded-3xl p-7 ${
        featured
          ? "bg-green-800 text-white shadow-2xl shadow-green-900/30"
          : "border border-gray-200 bg-white shadow-sm"
      }`}
    >
      {featured && (
        <p className="absolute -top-3.5 left-7 inline-flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold text-gray-900">
          <Star aria-hidden="true" className="h-3.5 w-3.5" /> Best Value
        </p>
      )}
      <h3 id={`pkg-${pkg.slug}`} className="font-display text-2xl font-extrabold">
        {pkg.name}
      </h3>
      {pkg.description && (
        <p
          className={`mt-2 text-sm leading-relaxed ${featured ? "text-green-50" : "text-gray-600"}`}
        >
          {pkg.description}
        </p>
      )}

      <div className={`mt-6 border-y py-5 ${featured ? "border-white/20" : "border-gray-200"}`}>
        <p className="font-display text-4xl font-extrabold">{rupiah(pkg.price)}</p>
        <p
          className={`mt-1 text-sm font-semibold ${featured ? "text-yellow-200" : "text-green-800"}`}
        >
          {pkg.credits}x tryout · {rupiah(Math.round(perCredit))} / tryout
          {savings > 0 && (
            <span className="ml-2 rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-bold text-gray-900">
              Hemat {savings}%
            </span>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => checkout.checkout(product)}
        disabled={!!checkout.pending}
        className={`mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-bold transition-colors disabled:cursor-wait disabled:opacity-70 ${
          featured
            ? "bg-yellow-300 text-gray-950 hover:bg-yellow-200"
            : "border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white"
        }`}
      >
        Beli {pkg.name}
        {checkout.pending === product ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        )}
      </button>

      <ul className="mt-6 space-y-3 text-sm">
        {(pkg.features || []).map((f, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <Check
              aria-hidden="true"
              className={`mt-0.5 h-5 w-5 shrink-0 ${featured ? "text-yellow-300" : "text-green-700"}`}
            />
            <span className={featured ? "text-white" : "text-gray-800"}>{f}</span>
          </li>
        ))}
      </ul>
      {extras.length > 0 && (
        <ul
          aria-label="Termasuk"
          className={`mt-5 flex flex-wrap gap-2 border-t pt-4 ${featured ? "border-white/20" : "border-gray-200"}`}
        >
          {extras.map((e) => (
            <li
              key={e.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                featured ? "bg-white/15 text-white" : "bg-green-100 text-green-800"
              }`}
            >
              <e.icon aria-hidden="true" className="h-3.5 w-3.5" />
              {e.label}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
