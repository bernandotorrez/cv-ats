/**
 * /tryout-cpns — Landing page publik untuk Tryout SKD.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock,
  Award,
  BarChart3,
  FileCheck,
  Trophy,
  Star,
  Check,
  ChevronDown,
  BookOpen,
  Target,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TryoutPackageCard } from "@/components/tryout/TryoutPackageCard";
import { supabase } from "@/integrations/supabase/client";
import { getTryoutLynkUrl, type TryoutPackage } from "@/lib/tryout-types";

export const Route = createFileRoute("/tryout-cpns")({
  head: () =>
    buildSeo({
      title: "Tryout CPNS SKD Online 2026 Gratis - 110 Soal TWK TIU TKP + Pembahasan | CV Pintar",
      description:
        "Tryout CPNS SKD 2026 online: 110 soal sesuai kisi-kisi BKN (TWK 30, TIU 35, TKP 45), timer 100 menit, passing grade resmi, skor instan, pembahasan lengkap. Mulai dari Rp 15.000.",
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

function TryoutCpnsLandingPage() {
  const [packages, setPackages] = useState<TryoutPackage[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

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

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-28 bg-gradient-to-b from-green-50/40 via-white to-white overflow-hidden">
        <div className="container-page">
          <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider mb-3 sm:mb-4 max-w-full">
                <Trophy className="h-3.5 w-3.5 shrink-0" /> Simulasi SKD Terlengkap 2026
              </span>
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
                Tryout SKD Realistis{" "}
                <span className="text-green-700 block sm:inline">
                  untuk Lulus CPNS.
                </span>
              </h1>

              <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-gray-600 leading-relaxed">
                110 soal sesuai kisi-kisi BKN (30 TWK + 35 TIU + 45 TKP), timer 100 menit, passing grade sesuai standar, dan pembahasan lengkap di paket premium.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 sm:px-8 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md shadow-md text-sm sm:text-base"
                >
                  <Link to={"/tryout" as never}>
                    Mulai Tryout Gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-6 sm:px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-md text-sm sm:text-base"
                >
                  <a href="#paket">Lihat Paket Harga</a>
                </Button>
              </div>

              {/* Bullet checks */}
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-x-6 sm:gap-x-8 gap-y-2.5 text-xs sm:text-sm text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  110 Soal Standar BKN
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  Timer 100 Menit
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Target className="h-3.5 w-3.5" />
                  </span>
                  Passing Grade Akurat
                </div>
              </div>
            </div>

            {/* Right Hero Image & Badges */}
            <div className="relative flex flex-col items-center justify-center lg:items-end w-full py-4 sm:py-6 px-2 sm:px-6 md:px-8 overflow-visible">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] lg:max-w-[425px] mx-auto lg:mr-2 my-2 sm:my-4">
                <img
                  src="/images/hero-cpns.webp"
                  alt="Dua peserta CPNS SKD yang optimis dan lulus"
                  className="w-full h-auto object-contain drop-shadow-xl"
                />

                {/* Floating Card Left: Skor Terakhir & Ranking (Tablet MD & Desktop) */}
                <div className="hidden md:block absolute -top-3 left-0 md:-left-4 lg:-left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-gray-100/90 animate-float w-[155px] md:w-[175px] z-20">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      SKOR TERAKHIR
                    </span>
                    <span className="bg-green-100 text-green-700 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                      BAIK
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-green-700">73</span>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">/ 100</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-1 mb-1.5">
                    <div className="h-full bg-green-600 rounded-full w-[73%]" />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    RANKING NASIONAL
                  </span>
                  <div className="flex items-end gap-1 h-4 sm:h-5 pt-0.5">
                    <div className="flex-1 bg-green-100 rounded-t h-[40%]" />
                    <div className="flex-1 bg-green-100 rounded-t h-[60%]" />
                    <div className="flex-1 bg-green-100 rounded-t h-[35%]" />
                    <div className="flex-1 bg-green-100 rounded-t h-[50%]" />
                    <div className="flex-1 bg-green-600 rounded-t h-[100%]" />
                    <div className="flex-1 bg-green-100 rounded-t h-[45%]" />
                    <div className="flex-1 bg-green-100 rounded-t h-[30%]" />
                  </div>
                </div>

                {/* Floating Card Right: Simulasi CAT (Tablet MD & Desktop) */}
                <div className="hidden md:block absolute -top-3 right-0 md:-right-3 lg:-right-4 bg-green-700 text-white rounded-2xl p-2.5 sm:p-3.5 shadow-xl animate-float-delayed w-[155px] md:w-[175px] z-20">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold border-b border-green-600/80 pb-1.5 mb-1.5">
                    <div className="flex h-4 sm:h-5 w-4 sm:w-5 items-center justify-center rounded-lg bg-green-600 text-white shrink-0">
                      <FileCheck className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    </div>
                    <span className="truncate">Simulasi CAT</span>
                  </div>
                  <div className="space-y-1.5 text-[9px] sm:text-[10px]">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <CheckCircle2 className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-white shrink-0" /> TWK
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-white">Selesai</span>
                      </div>
                      <div className="h-1 w-full bg-green-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-full rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <CheckCircle2 className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-white shrink-0" /> TIU
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-white">Selesai</span>
                      </div>
                      <div className="h-1 w-full bg-green-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-full rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-white inline-block shrink-0" /> TKP
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-white">82%</span>
                      </div>
                      <div className="h-1 w-full bg-green-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[82%] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card Bottom-Left (Tablet MD & Desktop) */}
                <div className="hidden md:flex absolute -bottom-3 left-0 md:-left-3 lg:-left-5 bg-white/95 backdrop-blur-sm rounded-xl p-2 sm:p-2.5 shadow-xl border border-gray-100/90 animate-float items-center gap-2 max-w-[155px] md:max-w-[170px] z-20">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-extrabold">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-gray-900 leading-tight truncate">Peluang SKD</span>
                    <span className="text-[8px] sm:text-[9px] text-emerald-600 font-semibold truncate">+40% Evaluasi</span>
                  </div>
                </div>

                {/* Floating Card Bottom-Right (Tablet MD & Desktop) */}
                <div className="hidden md:flex absolute -bottom-3 right-0 md:-right-3 lg:-right-4 bg-white/95 backdrop-blur-sm rounded-xl p-2 sm:p-2.5 shadow-xl border border-gray-100/90 animate-float-delayed items-center gap-2 max-w-[155px] md:max-w-[170px] z-20">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-gray-900 leading-tight truncate">Modul Belajar</span>
                    <span className="text-[8px] sm:text-[9px] text-gray-400 font-medium truncate">TIU · TWK · TKP</span>
                  </div>
                </div>
              </div>

              {/* Mobile Feature Badges (< md screens) */}
              <div className="mt-4 grid grid-cols-2 gap-2 w-full md:hidden">
                <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 font-extrabold text-xs">
                    <Trophy className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-gray-900 truncate">Skor 73/100</div>
                    <div className="text-[9px] text-green-700 font-semibold truncate">Top 10%</div>
                  </div>
                </div>

                <div className="bg-green-700 text-white rounded-xl p-2.5 shadow-sm flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
                    <FileCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate">Simulasi CAT</div>
                    <div className="text-[9px] text-green-100 font-medium truncate">110 Soal</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-gray-900 truncate">Evaluasi</div>
                    <div className="text-[9px] text-emerald-600 font-semibold truncate">+40% Lolos</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-gray-900 truncate">Modul</div>
                    <div className="text-[9px] text-gray-500 truncate">TIU·TWK·TKP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-8 sm:py-12">
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-4xl font-bold">
            Kenapa Tryout di CV Pintar?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base text-muted-foreground">
            Dirancang untuk persiapan SKD yang realistis, terukur, dan terarah.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={Clock}
            color="amber"
            title="Timer Realistis"
            desc="100 menit sesuai standar BKN. Auto-submit saat waktu habis."
          />
          <FeatureCard
            icon={BarChart3}
            color="sky"
            title="Skor Real-time"
            desc="Skor TWK, TIU, TKP keluar seketika. Status lulus per subtes."
          />
          <FeatureCard
            icon={Trophy}
            color="emerald"
            title="Leaderboard"
            desc="Bersaing sehat dengan pejuang SKD se-Indonesia. Top 10 tampil di papan peringkat."
          />
          <FeatureCard
            icon={FileCheck}
            color="rose"
            title="Pembahasan"
            desc="Setiap soal ada pembahasan detail. Tersedia di paket Lengkap."
          />
        </div>
      </section>

      {/* Format Ujian */}
      <section className="container-page py-8 sm:py-12">
        <div className="rounded-2xl sm:rounded-3xl border bg-card p-4 sm:p-10">
          <div className="mb-6 sm:mb-8 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-display text-xl sm:text-3xl font-bold">
              Format Ujian SKD
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <SubtestInfo
              label="TWK"
              fullName="Tes Wawasan Kebangsaan"
              count={30}
              passing={65}
              max={150}
              color="amber"
            />
            <SubtestInfo
              label="TIU"
              fullName="Tes Intelegensi Umum"
              count={35}
              passing={80}
              max={175}
              color="sky"
            />
            <SubtestInfo
              label="TKP"
              fullName="Tes Karakteristik Pribadi"
              count={45}
              passing={166}
              max={225}
              color="emerald"
            />
          </div>

          <div className="mt-6 sm:mt-8 rounded-xl sm:rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4 sm:p-5 text-xs sm:text-sm">
            <div className="font-bold text-amber-900 dark:text-amber-400">⚠️ Penting</div>
            <p className="mt-1 text-amber-800">
              Kamu harus lulus <strong>ketiga subtes</strong> untuk dinyatakan LULUS. Total skor
              tinggi tidak cukup jika satu subtes tidak memenuhi passing grade.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="paket" className="container-page py-8 sm:py-12">
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-4xl font-bold">Pilih Paket Tryout</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base text-muted-foreground">
            Mulai dari 1x tryout sampai paket lengkap dengan pembahasan + leaderboard.
          </p>
        </div>

        <div className="mx-auto mt-8 sm:mt-10 grid grid-cols-1 max-w-4xl gap-6 md:grid-cols-2">
          {packages.map((pkg) => (
            <TryoutPackageCard
              key={pkg.id}
              slug={pkg.slug}
              name={pkg.name}
              description={pkg.description || ""}
              price={pkg.price}
              credits={pkg.credits}
              features={pkg.features || []}
              featured={pkg.slug === "lengkap"}
              hasPembahasan={pkg.has_pembahasan}
              hasAnalytics={pkg.has_analytics}
              hasLeaderboard={pkg.has_leaderboard}
              lynkUrl={getTryoutLynkUrl(pkg.slug)}
            />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Pertanyaan Sering Diajukan
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">
              Segala hal yang perlu kamu ketahui tentang simulasi tryout SKD CPNS.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
            {[
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
            ].map((faq, index) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${index}`}
                className="border border-gray-100 rounded-xl px-4 sm:px-5 py-1.5 sm:py-2 bg-white shadow-sm"
              >
                <AccordionTrigger className="text-left font-bold text-gray-800 text-xs sm:text-sm hover:no-underline hover:text-green-700">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-sm leading-relaxed text-gray-500 pt-2 border-t border-gray-50 mt-2">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Banner Section */}
      <section className="container-page pb-16 sm:pb-24">
        <div className="rounded-2xl sm:rounded-3xl bg-green-700 px-5 sm:px-8 py-8 sm:py-12 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Decorative background element */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-green-600/30 blur-2xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex-1 max-w-2xl text-left">
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Siap Lulus SKD? Mulai latihan dari sekarang.
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-green-100">
              Setiap tryout membuatmu lebih siap menghadapi ujian asli BKN.
            </p>

            {/* Checklist */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-green-50">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">✓</span>
                110 Soal Standar BKN
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">✓</span>
                Timer 100 Menit Realistis
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">✓</span>
                Pembahasan Lengkap & Akurat
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">✓</span>
                Passing Grade Resmi BKN 2026
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto mt-6 sm:mt-10 h-12 px-6 sm:px-8 bg-yellow-300 hover:bg-yellow-400 text-gray-950 font-extrabold rounded-lg shadow-lg text-sm sm:text-base"
            >
              <Link to={"/tryout" as never}>
                Mulai Tryout SKD Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right Image */}
          <div className="relative z-10 w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[360px] flex justify-center lg:justify-end">
            <div className="relative w-full">
              <img
                src="/images/cta-asn-female.webp"
                alt="Perempuan ASN tersenyum sukses di depan laptop"
                className="w-full h-auto rounded-2xl object-cover shadow-2xl border-4 border-white/20"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  color,
  title,
  desc,
}: {
  icon: typeof Clock;
  color: "amber" | "sky" | "emerald" | "rose";
  title: string;
  desc: string;
}) {
  const colorClass = {
    amber: "from-amber-500 to-orange-500",
    sky: "from-sky-500 to-blue-500",
    emerald: "from-emerald-500 to-green-500",
    rose: "from-rose-500 to-pink-500",
  }[color];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div
        className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function ScorePreview({
  label,
  score,
  max,
  passing,
}: {
  label: string;
  score: number;
  max: number;
  passing: number;
}) {
  const passed = score >= passing;
  const pct = (score / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium">
        <span className="text-foreground">{label}</span>
        <span className={passed ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>
          {score} / {max} {passed ? "✓" : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${passed ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SubtestInfo({
  label,
  fullName,
  count,
  passing,
  max,
  color,
}: {
  label: string;
  fullName: string;
  count: number;
  passing: number;
  max: number;
  color: "amber" | "sky" | "emerald";
}) {
  const colorClass = {
    amber: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400",
    sky: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40 text-sky-900 dark:text-sky-400",
    emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400",
  }[color];

  return (
    <div className={`rounded-2xl border-2 p-5 ${colorClass}`}>
      <div className="font-display text-2xl font-bold">{label}</div>
      <div className="text-xs">{fullName}</div>
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Jumlah soal</span>
          <span className="font-bold">{count}</span>
        </div>
        <div className="flex justify-between">
          <span>Skor maksimal</span>
          <span className="font-bold">{max}</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span>Passing grade</span>
          <span className="font-bold">{passing}</span>
        </div>
      </div>
    </div>
  );
}