/**
 * /tryout-cpns — Landing page publik untuk Tryout SKD.
 *
 * Semua klaim di halaman ini harus sesuai perilaku sistem (lihat
 * docs/tryout-ui-redesign-plan.md §1 butir 7). FAQ yang tampil dan JSON-LD
 * FAQPage dibangun dari satu sumber (`faqs`) agar selalu identik.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  FileCheck,
  Flag,
  Loader2,
  Monitor,
  QrCode,
  Smartphone,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { SKD_TOPIC_LABEL, skdModules } from "@/lib/skd-modules";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const SITE = "https://cvpintar.web.id";

/** Sumber tunggal FAQ: dipakai accordion dan JSON-LD FAQPage. */
const faqs = [
  {
    q: "Apakah tryout ini gratis?",
    a: "Tidak. Setiap tryout memakai 1 kredit. Kredit didapat dengan membeli Tryout Satuan (1x tryout, Rp15.000) atau Paket Lengkap (5x tryout, Rp50.000). Pembayaran via QRIS dan kredit aktif otomatis setelah pembayaran berhasil.",
  },
  {
    q: "Apakah soalnya mirip ujian asli?",
    a: "Soal disusun mengikuti kisi-kisi SKD BKN dengan komposisi 30 soal TWK, 35 soal TIU, dan 45 soal TKP, dikerjakan dalam 100 menit dengan sistem penilaian yang sama: TWK dan TIU bernilai 5 untuk jawaban benar dan 0 untuk jawaban salah atau kosong, sedangkan setiap opsi TKP bernilai 1 sampai 5.",
  },
  {
    q: "Berapa passing grade SKD?",
    a: "TWK minimal 65, TIU minimal 80, dan TKP minimal 166. Ketiga subtes harus memenuhi passing grade agar dinyatakan lulus. Di halaman hasil, kamu bisa melihat selisih skormu terhadap passing grade setiap subtes.",
  },
  {
    q: "Apa bedanya Tryout Satuan dan Paket Lengkap?",
    a: "Keduanya berisi tryout 110 soal dengan hasil skor, tingkat kesiapan, peringkat, dan rekomendasi belajar per kategori. Paket Lengkap berisi 5 kredit dan menambahkan pembahasan detail setiap soal, mode latihan ulang soal yang salah, serta akses leaderboard nasional.",
  },
  {
    q: "Apakah kredit tryout punya masa berlaku?",
    a: "Kredit dari pembayaran tidak memiliki masa kedaluwarsa, jadi bisa kamu pakai kapan saja sesuai jadwal belajarmu. Satu kredit terpakai setiap kali kamu memulai tryout baru.",
  },
  {
    q: "Bagaimana jika koneksi terputus di tengah ujian?",
    a: "Setiap perubahan jawaban langsung disimpan ke server dan juga di perangkatmu. Jika koneksi terputus atau browser tertutup, buka lagi tryout-nya untuk melanjutkan dari jawaban terakhir. Timer tetap berjalan di server, dan saat waktu habis, jawaban yang sudah tersimpan akan dinilai.",
  },
  {
    q: "Bisa dikerjakan di HP?",
    a: "Bisa. Tampilan ujian dirancang untuk layar HP maupun laptop. Gunakan browser Chrome atau Safari versi terbaru agar lancar.",
  },
  {
    q: "Bisa mengulang set soal yang sama?",
    a: "Bisa, selama kamu masih punya kredit. Setiap percobaan baru memakai 1 kredit. Pengguna Paket Lengkap juga bisa latihan ulang soal yang salah dari halaman hasil tanpa memakai kredit dan tanpa mengubah skor.",
  },
] as const;

export const Route = createFileRoute("/tryout-cpns")({
  head: () =>
    buildSeo({
      title: "Tryout CPNS SKD 2026: 110 Soal TWK TIU TKP | CV Pintar",
      description:
        "Tryout CPNS SKD 2026 online: 110 soal TWK, TIU, TKP mengikuti kisi-kisi BKN, timer 100 menit, passing grade 65/80/166, analisis hasil, dan pembahasan detail. Mulai Rp15.000.",
      path: "/tryout-cpns",
      keywords:
        "tryout cpns 2026, tryout SKD online, simulasi SKD CPNS, latihan soal SKD, soal TWK TIU TKP, passing grade SKD, pembahasan SKD CPNS, simulasi ujian CPNS online, simulasi CAT SKD, tryout cpns terbaru, kisi-kisi SKD BKN 2026",
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
              item: SITE,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Tryout CPNS SKD 2026",
              item: `${SITE}/tryout-cpns`,
            },
          ],
        },
        // Course schema
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Tryout Simulasi SKD CPNS 2026 Online",
          description:
            "Simulasi ujian Seleksi Kompetensi Dasar (SKD) CPNS dengan 110 soal (30 TWK, 35 TIU, 45 TKP), timer 100 menit, passing grade 65/80/166, hasil dan rekomendasi belajar. Pembahasan detail, mode latihan ulang, dan leaderboard nasional tersedia di Paket Lengkap.",
          provider: {
            "@type": "Organization",
            name: "CV Pintar",
            url: SITE,
          },
          educationalLevel: "Professional",
          teaches: "Seleksi Kompetensi Dasar CPNS",
          timeRequired: "PT100M",
          inLanguage: "id-ID",
          isAccessibleForFree: false,
          offers: [
            {
              "@type": "Offer",
              name: "Tryout Satuan (1x tryout)",
              price: "15000",
              priceCurrency: "IDR",
              category: "Paid",
              availability: "https://schema.org/InStock",
              url: `${SITE}/tryout-cpns#paket`,
            },
            {
              "@type": "Offer",
              name: "Paket Lengkap (5x tryout)",
              price: "50000",
              priceCurrency: "IDR",
              category: "Paid",
              availability: "https://schema.org/InStock",
              url: `${SITE}/tryout-cpns#paket`,
            },
          ],
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: "PT100M",
          },
        },
        // FAQPage schema — identik dengan FAQ yang tampil.
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        // WebPage schema
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Tryout CPNS SKD Online 2026",
          description:
            "Tryout SKD CPNS 2026 di CV Pintar: 110 soal, timer 100 menit, hasil dan rekomendasi belajar, serta pembahasan detail di Paket Lengkap.",
          url: `${SITE}/tryout-cpns`,
          inLanguage: "id-ID",
          isPartOf: {
            "@type": "WebSite",
            name: "CV Pintar",
            url: SITE,
          },
          about: {
            "@type": "Thing",
            name: "Tryout SKD CPNS",
          },
          datePublished: "2026-08-04",
          dateModified: "2026-11-07",
        },
      ],
    }),
  component: TryoutCpnsLandingPage,
});

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  points: string[];
  premium?: boolean;
};

const features: Feature[] = [
  {
    icon: Clock,
    title: "Simulasi CAT",
    desc: "Rasakan suasana ujian berbasis komputer sebelum hari H.",
    points: [
      "Timer 100 menit dihitung server",
      "Tandai ragu & navigasi nomor soal",
      "Jawaban tersimpan otomatis",
    ],
  },
  {
    icon: BarChart3,
    title: "Hasil & analisis",
    desc: "Skor keluar begitu ujian selesai, lengkap dengan arah belajar.",
    points: [
      "Tingkat kesiapan & jarak ke passing grade",
      "Peringkat & persentil di antara peserta",
      "Rekomendasi belajar per kategori",
    ],
  },
  {
    icon: FileCheck,
    title: "Pembahasan detail",
    desc: "Bukan sekadar kunci jawaban. Pahami cara berpikirnya.",
    points: [
      "Konsep yang diuji & langkah penyelesaian",
      "Analisis tiap pilihan jawaban",
      "Tips & dasar hukum",
    ],
    premium: true,
  },
  {
    icon: Dumbbell,
    title: "Mode latihan ulang",
    desc: "Kerjakan ulang soal yang salah sampai benar-benar paham.",
    points: ["Tanpa memakai kredit", "Tanpa timer & tidak mengubah skor", "Jawaban langsung dicek"],
    premium: true,
  },
  {
    icon: Trophy,
    title: "Leaderboard nasional",
    desc: "Ukur posisimu di antara pejuang SKD se-Indonesia.",
    points: ["Peringkat nasional berdasarkan skor", "Bandingkan skormu dengan peserta lain"],
    premium: true,
  },
  {
    icon: Flag,
    title: "Laporkan soal",
    desc: "Temukan soal atau kunci yang keliru? Laporkan langsung dari halaman pembahasan.",
    points: ["Laporan ditinjau tim kami", "Soal diperbaiki bila terbukti keliru"],
    premium: true,
  },
];

const steps = [
  {
    icon: QrCode,
    title: "Pilih paket & bayar QRIS",
    desc: "Pilih Tryout Satuan atau Paket Lengkap, lalu bayar lewat QRIS. Kredit aktif otomatis setelah pembayaran berhasil.",
  },
  {
    icon: Clock,
    title: "Kerjakan tryout 100 menit",
    desc: "110 soal TWK, TIU, dan TKP dengan timer server. Jawaban tersimpan setiap kali kamu memilih.",
  },
  {
    icon: BookOpen,
    title: "Pelajari hasil & pembahasan",
    desc: "Lihat skor, jarak ke passing grade, dan rekomendasi belajar. Paket Lengkap membuka pembahasan detail.",
  },
] as const;

const subtests = [
  {
    label: "TWK",
    fullName: "Tes Wawasan Kebangsaan",
    count: 30,
    passing: 65,
    max: 150,
    scoring: "Benar 5 · salah/kosong 0",
  },
  {
    label: "TIU",
    fullName: "Tes Intelegensi Umum",
    count: 35,
    passing: 80,
    max: 175,
    scoring: "Benar 5 · salah/kosong 0",
  },
  {
    label: "TKP",
    fullName: "Tes Karakteristik Pribadi",
    count: 45,
    passing: 166,
    max: 225,
    scoring: "Setiap opsi bernilai 1–5",
  },
] as const;

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

function TryoutCpnsLandingPage() {
  const [packages, setPackages] = useState<TryoutPackage[]>([]);
  const [loadError, setLoadError] = useState(false);
  const checkout = useCheckout();

  useEffect(() => {
    void supabase
      .from("tryout_packages")
      .select(
        "id, slug, name, description, price, credits, features, has_pembahasan, has_analytics, has_leaderboard, is_active, sort_order",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setPackages(data as unknown as TryoutPackage[]);
        else setLoadError(true);
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-yellow-100/70 blur-3xl"
        />
        <div className="container-page relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex max-w-2xl flex-col items-start">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-800 shadow-sm">
                <Trophy aria-hidden="true" className="h-4 w-4" />
                Tryout SKD CPNS 2026
              </span>
              <h1
                id="tryout-heading"
                className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
              >
                Latihan SKD seperti ujian asli,{" "}
                <span className="text-green-700">tahu persis yang harus dikejar.</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                110 soal mengikuti kisi-kisi BKN (30 TWK + 35 TIU + 45 TKP), timer 100 menit, dan
                hasil instan dengan jarak ke passing grade serta rekomendasi belajar. Pembahasan
                detail tiap soal tersedia di Paket Lengkap.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <PrimaryCta to="/tryout">Mulai Tryout</PrimaryCta>
                <AnchorCta href="#paket">Lihat Paket Harga</AnchorCta>
              </div>
              <TrustChecks
                items={["Bayar via QRIS", "Kredit aktif otomatis", "Jawaban tersimpan otomatis"]}
              />
            </div>

            <div className="relative mx-auto w-full max-w-md px-4 sm:px-8 lg:px-0">
              <img
                src="/images/hero-cpns.webp"
                alt="Dua peserta CPNS tersenyum optimis setelah berlatih SKD"
                width={1024}
                height={1024}
                className="h-auto w-full object-contain drop-shadow-xl"
                fetchPriority="high"
              />
              <div
                aria-hidden="true"
                className="absolute -left-2 top-4 w-44 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl animate-float sm:-left-6"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Contoh hasil
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold text-gray-900">
                  412<span className="text-base font-semibold text-gray-600">/550</span>
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
                  <FileCheck className="h-4 w-4 text-yellow-300" /> Jarak ke PG
                </p>
                <ul className="mt-3 space-y-1.5 text-xs font-semibold">
                  {[
                    ["TWK", "+35"],
                    ["TIU", "+50"],
                    ["TKP", "+16"],
                  ].map(([l, v]) => (
                    <li key={l} className="flex justify-between">
                      <span>{l}</span>
                      <span className="text-yellow-200">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <ProductShowcase />

      {/* Features */}
      <section aria-labelledby="fitur-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="fitur-heading"
            eyebrow="Fitur"
            title="Bukan cuma skor. Kamu tahu apa yang harus dipelajari."
            desc="Semua paket sudah termasuk simulasi CAT serta hasil & analisis. Fitur bertanda Paket Lengkap terbuka setelah membeli Paket Lengkap."
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li
                key={f.title}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
                    <f.icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  {f.premium ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-900">
                      <Star aria-hidden="true" className="h-3.5 w-3.5" /> Paket Lengkap
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                      Semua paket
                    </span>
                  )}
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
                <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-gray-700">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="cara-heading" className="bg-green-50/60 py-20 lg:py-24">
        <div className="container-page">
          <SectionHeader
            id="cara-heading"
            eyebrow="Cara kerja"
            title="Tiga langkah dari daftar sampai evaluasi."
          />
          <ol className="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="relative rounded-2xl border border-green-100 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 font-display text-lg font-extrabold text-white"
                  >
                    {i + 1}
                  </span>
                  <s.icon aria-hidden="true" className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900">
                  <span className="sr-only">Langkah {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="paket" aria-labelledby="paket-heading" className="scroll-mt-20 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="paket-heading"
            eyebrow="Paket tryout"
            title="Pilih paket, mulai latihan hari ini."
            desc="Mulai dari 1x tryout sampai Paket Lengkap dengan pembahasan detail, mode latihan ulang, dan leaderboard."
          />
          {packages.length > 0 ? (
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
          ) : loadError ? (
            <div
              role="alert"
              className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm"
            >
              <p className="text-base text-gray-700">
                Paket belum bisa dimuat. Muat ulang halaman, atau lihat paket setelah masuk ke akun.
              </p>
              <PrimaryCta to="/tryout/beli">Lihat Paket</PrimaryCta>
            </div>
          ) : (
            <PackageCardsSkeleton />
          )}
          <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-700">
            {[
              "Pembayaran via QRIS",
              "Kredit aktif otomatis setelah bayar",
              "Kredit tidak memiliki masa kedaluwarsa",
            ].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-green-700" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Exam format */}
      <section aria-labelledby="format-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="format-heading"
            eyebrow={
              <>
                <BookOpen aria-hidden="true" className="h-4 w-4" /> Format ujian
              </>
            }
            title="Format ujian SKD & passing grade."
            desc="110 soal dalam 100 menit. Kenali komposisi soal, cara penilaian, dan nilai minimum tiap subtes sebelum mulai berlatih."
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {subtests.map((s) => (
              <li
                key={s.label}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="font-display text-3xl font-extrabold text-green-700">{s.label}</p>
                <p className="text-sm font-medium text-gray-700">{s.fullName}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-600">Jumlah soal</dt>
                    <dd className="font-bold text-gray-900">{s.count}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-600">Penilaian</dt>
                    <dd className="text-right font-bold text-gray-900">{s.scoring}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-600">Skor maksimal</dt>
                    <dd className="font-bold text-gray-900">{s.max}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-gray-200 pt-2">
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

      {/* Modul belajar gratis */}
      <section aria-labelledby="belajar-heading" className="pt-20 lg:pt-28">
        <div className="container-page">
          <SectionHeader
            id="belajar-heading"
            eyebrow={
              <>
                <GraduationCap aria-hidden="true" className="h-4 w-4" /> Modul belajar gratis
              </>
            }
            title="Belajar dulu, lalu buktikan di tryout."
            desc="Materi inti dan trik mengerjakan TWK, TIU, dan TKP dalam modul singkat yang bisa dibaca gratis."
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {skdModules.slice(0, 8).map((m, i) => (
              <li key={m.slug}>
                <Link
                  to="/belajar-skd/$slug"
                  params={{ slug: m.slug }}
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-600/50 hover:shadow-md"
                >
                  <span className="text-xs font-semibold text-green-700">
                    Modul {i + 1} · {SKD_TOPIC_LABEL[m.topic]}
                  </span>
                  <span className="mt-1.5 font-display font-bold leading-snug text-gray-900 group-hover:text-green-800">
                    {m.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Link
              to="/belajar-skd"
              className="inline-flex items-center gap-1.5 font-bold text-green-700 hover:text-green-800"
            >
              Lihat semua modul belajar SKD <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
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
              Pertanyaan sering diajukan.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Segala hal yang perlu kamu ketahui tentang tryout SKD CPNS di CV Pintar.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${index}`}
                className="rounded-xl border border-gray-200 bg-white px-5 shadow-sm"
              >
                <AccordionTrigger className="min-h-11 rounded-lg text-left text-base font-bold text-gray-900 hover:text-green-800 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">
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
      <section aria-labelledby="cta-heading" className="container-page pb-16 lg:pb-24">
        <div className="relative flex flex-col items-center justify-between gap-10 overflow-hidden rounded-3xl bg-green-700 px-6 py-12 text-white shadow-2xl sm:px-12 lg:flex-row lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-green-600/40 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <h2
              id="cta-heading"
              className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            >
              Siap menghadapi SKD? Mulai latihan dari sekarang.
            </h2>
            <p className="mt-4 text-base text-green-50 sm:text-lg">
              Setiap tryout menunjukkan subtes mana yang sudah aman dan mana yang perlu dikejar.
            </p>
            <ul className="mt-8 grid gap-3 text-sm font-semibold text-green-50 sm:grid-cols-2">
              {[
                "110 soal · 100 menit",
                "Passing grade 65 / 80 / 166",
                "Hasil & rekomendasi belajar",
                "Pembahasan detail (Paket Lengkap)",
              ].map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-yellow-300" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 w-full rounded-xl bg-yellow-300 px-8 text-base font-extrabold text-gray-950 shadow-lg hover:bg-yellow-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-700 sm:w-auto"
              >
                <Link to={"/tryout" as never}>
                  Mulai Tryout SKD
                  <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <a
                href="#paket"
                className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-white/70 px-8 text-base font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-700"
              >
                Lihat Paket Harga
              </a>
            </div>
          </div>
          <img
            src="/images/cta-asn-female.webp"
            alt=""
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="relative h-auto w-full max-w-[260px] rounded-2xl border-4 border-white/20 object-cover shadow-2xl lg:max-w-[340px]"
          />
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────── Product showcase ─────────────────────────── */

const showcaseTabs = [
  {
    value: "ujian",
    label: "Ujian",
    icon: Monitor,
    title: "Layar ujian seperti CAT",
    desc: "Fokus ke soal, bukan ke tampilan. Semua yang kamu butuhkan saat ujian ada di satu layar.",
    points: [
      "Sisa waktu selalu terlihat, dihitung dari server",
      "Status “Tersimpan” setiap kali jawaban berubah",
      "Tandai ragu dan lompat ke nomor mana saja",
      "Nyaman di laptop maupun HP",
    ],
  },
  {
    value: "hasil",
    label: "Hasil & Analisis",
    icon: BarChart3,
    title: "Hasil yang menunjukkan langkah berikutnya",
    desc: "Begitu ujian selesai, kamu langsung tahu posisimu dan apa yang perlu diperbaiki.",
    points: [
      "Tingkat kesiapan dari total skor",
      "Skor tiap subtes & jarak ke passing grade",
      "Peringkat, persentil, dan perbandingan rata-rata peserta",
      "Rekomendasi belajar per kategori soal",
    ],
  },
  {
    value: "pembahasan",
    label: "Pembahasan",
    icon: BookOpen,
    title: "Pembahasan detail tiap soal",
    desc: "Tersedia di Paket Lengkap. Jawabanmu dibandingkan dengan kunci, lalu dibedah langkah demi langkah.",
    points: [
      "Konsep yang diuji",
      "Langkah penyelesaian",
      "Analisis kenapa tiap opsi benar atau salah",
      "Tips & dasar hukum yang relevan",
    ],
  },
] as const;

function ProductShowcase() {
  return (
    <section aria-labelledby="tampilan-heading" className="bg-gray-50 py-20 lg:py-28">
      <div className="container-page">
        <SectionHeader
          id="tampilan-heading"
          eyebrow="Lihat tampilannya"
          title="Ini yang kamu dapat saat tryout."
          desc="Tangkapan layar asli dari halaman ujian, hasil, dan pembahasan."
        />
        <Tabs defaultValue="ujian" className="w-full">
          <TabsList
            aria-label="Pilih tampilan"
            className="mx-auto grid h-auto w-full max-w-xl grid-cols-3 gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm"
          >
            {showcaseTabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="min-h-11 gap-1.5 whitespace-normal rounded-xl px-2 py-2 text-center text-xs font-bold leading-tight text-gray-700 hover:text-green-800 focus-visible:ring-green-700 data-[state=active]:bg-green-700 data-[state=active]:text-white data-[state=active]:shadow-md sm:text-sm"
              >
                <t.icon aria-hidden="true" className="hidden h-4 w-4 shrink-0 sm:block" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {showcaseTabs.map((t) => (
            <TabsContent
              key={t.value}
              value={t.value}
              className="mt-10 rounded-2xl focus-visible:ring-green-700"
            >
              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                  {t.value === "ujian" && <ExamVisual />}
                  {t.value === "hasil" && (
                    <BrowserFrame>
                      <img
                        src="/images/tryout/ui-hasil.webp"
                        alt="Tampilan halaman hasil tryout: total skor 412 dari 550 dengan tingkat kesiapan Kompetitif, skor TWK 100, TIU 130, dan TKP 182 yang semuanya lulus beserta selisih di atas passing grade, kartu posisi peringkat dan persentil, serta daftar rekomendasi belajar per kategori."
                        width={1280}
                        height={895}
                        loading="lazy"
                        decoding="async"
                        className="block h-auto w-full"
                      />
                    </BrowserFrame>
                  )}
                  {t.value === "pembahasan" && <ExplanationVisual />}
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-green-800">
                    <t.icon aria-hidden="true" className="h-4 w-4" /> {t.label}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
                    {t.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-gray-600">{t.desc}</p>
                  <ul className="mt-6 space-y-3 text-sm sm:text-base">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-gray-700">
                        <CheckCircle2
                          aria-hidden="true"
                          className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10">
      <div
        aria-hidden="true"
        className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2.5"
      >
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs text-gray-600">
          cvpintar.web.id/tryout
        </span>
      </div>
      {children}
    </figure>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-[2rem] border-[6px] border-gray-900 bg-gray-900 shadow-2xl shadow-gray-900/25">
      <div className="overflow-hidden rounded-[1.5rem] bg-white">{children}</div>
    </figure>
  );
}

function ExamVisual() {
  return (
    <div className="relative sm:pb-8">
      {/* Laptop view: only from sm up, so phones load just the mobile shot. */}
      <div className="hidden sm:block sm:pr-[16%]">
        <BrowserFrame>
          <img
            src="/images/tryout/ui-ujian.webp"
            alt="Tampilan layar ujian tryout SKD di laptop: soal TIU nomor 38 dengan lima pilihan jawaban, sisa waktu 47:12, status jawaban tersimpan, progres per subtes, dan panel navigasi 110 nomor soal yang membedakan soal dijawab, ragu, dan kosong."
            width={1280}
            height={888}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </BrowserFrame>
      </div>
      <div className="mx-auto w-[min(270px,80%)] sm:absolute sm:bottom-0 sm:right-0 sm:mx-0 sm:w-[26%]">
        <PhoneFrame>
          <img
            src="/images/tryout/ui-ujian-mobile.webp"
            alt="Tampilan layar ujian tryout SKD di HP: soal nomor 38 dari 110, tombol tandai ragu, lima pilihan jawaban, timer, serta tombol sebelumnya dan berikutnya."
            width={520}
            height={1125}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </PhoneFrame>
      </div>
    </div>
  );
}

function ExplanationVisual() {
  return (
    <div className="mx-auto w-full max-w-md">
      <figure className="relative max-h-[540px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 sm:max-h-[620px]">
        <img
          src="/images/tryout/ui-pembahasan.webp"
          alt="Kartu pembahasan soal TWK: jawaban peserta yang salah ditandai merah dan kunci jawaban hijau, diikuti pembahasan singkat, konsep yang diuji, langkah penyelesaian, dan analisis tiap pilihan jawaban."
          width={800}
          height={1229}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent"
        />
      </figure>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-700">
        <Star aria-hidden="true" className="h-4 w-4 text-yellow-600" /> Khusus Paket Lengkap
      </p>
    </div>
  );
}

/* ─────────────────────────────── Pricing ─────────────────────────────── */

function PackageCardsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 md:items-start"
    >
      <span className="sr-only">Memuat paket…</span>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex flex-col rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
        >
          <div className="h-7 w-40 rounded-lg bg-gray-200 motion-safe:animate-pulse" />
          <div className="mt-3 h-4 w-full rounded bg-gray-100 motion-safe:animate-pulse" />
          <div className="mt-2 h-4 w-3/4 rounded bg-gray-100 motion-safe:animate-pulse" />
          <div className="mt-6 border-y border-gray-200 py-5">
            <div className="h-10 w-36 rounded-lg bg-gray-200 motion-safe:animate-pulse" />
            <div className="mt-2 h-4 w-44 rounded bg-gray-100 motion-safe:animate-pulse" />
          </div>
          <div className="mt-6 h-14 w-full rounded-xl bg-gray-200 motion-safe:animate-pulse" />
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-5 w-5 shrink-0 rounded-full bg-gray-200 motion-safe:animate-pulse" />
                <div
                  className="h-4 rounded bg-gray-100 motion-safe:animate-pulse"
                  style={{ width: `${70 - j * 8}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
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
  // Hasil & rekomendasi belajar ada di semua paket; chip hanya untuk fitur tambahan.
  const extras = [
    pkg.has_pembahasan && { icon: FileCheck, label: "Pembahasan detail" },
    pkg.has_pembahasan && { icon: Dumbbell, label: "Latihan ulang" },
    pkg.has_leaderboard && { icon: Trophy, label: "Leaderboard" },
  ].filter(Boolean) as { icon: LucideIcon; label: string }[];

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
          <Star aria-hidden="true" className="h-3.5 w-3.5" /> Paling hemat
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
        aria-busy={checkout.pending === product}
        className={`mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${
          featured
            ? "bg-yellow-300 text-gray-950 hover:bg-yellow-200 focus-visible:ring-yellow-200 focus-visible:ring-offset-green-800"
            : "border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white focus-visible:ring-green-700"
        }`}
      >
        Beli {pkg.name}
        {checkout.pending === product ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        )}
      </button>
      <p
        className={`mt-2 flex items-center justify-center gap-1.5 text-xs ${featured ? "text-green-50" : "text-gray-600"}`}
      >
        <Smartphone aria-hidden="true" className="h-3.5 w-3.5" /> Bayar via QRIS · kredit aktif
        otomatis
      </p>

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
