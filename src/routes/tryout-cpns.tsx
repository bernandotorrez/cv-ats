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
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TryoutPackageCard } from "@/components/tryout/TryoutPackageCard";
import { supabase } from "@/integrations/supabase/client";
import type { TryoutPackage } from "@/lib/tryout-types";

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

  const lynkBaseUrl = "https://lynk.id/ben-yt-ai/";

  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero */}
      <section className="container-page py-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-4 gap-1.5 bg-primary/10 text-primary">
              <Trophy className="h-3 w-3" /> Simulasi SKD Terlengkap
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Tryout SKD <span className="text-primary">Realistis</span> untuk Lulus SKD.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              110 soal sesuai kisi-kisi BKN (TWK + TIU + TKP), timer 100 menit, passing grade
              sesuai standar, dan pembahasan lengkap di paket premium.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" /> 110 soal
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
                <Clock className="h-3.5 w-3.5" /> 100 menit
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <Target className="h-3.5 w-3.5" /> Passing grade sesuai BKN
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to={"/tryout" as never}>
                  Mulai Tryout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="#paket">Lihat Paket Harga</a>
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>Dipercaya ribuan pejuang SKD di Indonesia</span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-emerald-200/40 to-amber-200/40 blur-2xl" />
            <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold">Tryout SKD Set 1</h3>
                  <p className="text-xs text-muted-foreground">110 soal · 100 menit</p>
                </div>
                <Badge className="bg-emerald-500">Mulai</Badge>
              </div>

              <div className="mt-4 space-y-3">
                <ScorePreview label="TWK" score={75} max={150} passing={65} />
                <ScorePreview label="TIU" score={120} max={175} passing={80} />
                <ScorePreview label="TKP" score={210} max={225} passing={166} />
              </div>

              <div className="mt-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-center text-white">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
                  Total Skor (Contoh)
                </div>
                <div className="mt-1 font-display text-3xl font-bold">
                  405 <span className="text-base font-medium opacity-80">/ 550</span>
                </div>
                <div className="mt-1 text-xs opacity-90">73.6% · Lulus semua subtes ✓</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-12">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Kenapa Tryout di CV Pintar?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Dirancang untuk persiapan SKD yang realistis, terukur, dan terarah.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="container-page py-12">
        <div className="rounded-3xl border bg-card p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Format Ujian SKD
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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

          <div className="mt-8 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-5 text-sm">
            <div className="font-bold text-amber-900 dark:text-amber-400">⚠️ Penting</div>
            <p className="mt-1 text-amber-800">
              Kamu harus lulus <strong>ketiga subtes</strong> untuk dinyatakan LULUS. Total skor
              tinggi tidak cukup jika satu subtes tidak memenuhi passing grade.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="paket" className="container-page py-12">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Pilih Paket Tryout</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Mulai dari 1x tryout sampai paket lengkap dengan pembahasan + leaderboard.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
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
              lynkUrl={`${lynkBaseUrl}tryout-${pkg.slug}`}
            />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl text-center">
            Pertanyaan Umum
          </h2>

          <div className="mt-8 space-y-3">
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
            ].map((item, idx) => {
              const open = faqOpen === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : idx)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-foreground">{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="border-t px-5 py-4 text-sm text-muted-foreground">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page pb-12">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-emerald-700 p-8 text-center text-white sm:p-12">
          <Award className="mx-auto mb-4 h-12 w-12" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Siap Lulus SKD?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-base opacity-90">
            Mulai latihan dari sekarang. Setiap tryout membuatmu lebih siap.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-6 gap-2 bg-white text-primary hover:bg-white/90"
          >
            <Link to={"/tryout" as never}>
              Mulai Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
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