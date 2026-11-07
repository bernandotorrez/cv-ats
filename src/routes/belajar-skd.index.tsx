/**
 * /belajar-skd — Modul Belajar SKD CPNS (publik & gratis).
 *
 * Jalur belajar berurutan dari `skd-modules.ts`, diarahkan ke praktik di tryout
 * dan paket tryout. SEO: meta, BreadcrumbList, ItemList modul, dan FAQPage.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  GraduationCap,
  HeartHandshake,
  Landmark,
  ListChecks,
  Shapes,
  Timer,
} from "lucide-react";

import { buildSeo, SITE_URL } from "@/lib/seo";
import { readingMinutes } from "@/lib/blog-posts";
import { SKD_TOPIC_LABEL, skdModules, type SkdModuleTopic } from "@/lib/skd-modules";
import { skdExamplesBySlug } from "@/lib/skd-examples";
import {
  CtaBanner,
  PageHero,
  PrimaryCta,
  SecondaryCta,
  SectionHeader,
  TrustChecks,
} from "@/components/site/marketing";
import { cn } from "@/lib/utils";

const PAGE_TITLE = "Modul Belajar SKD CPNS Gratis: Materi, Tips & Trik TWK, TIU, TKP";
const PAGE_DESC =
  "8 modul belajar SKD CPNS gratis: strategi passing grade, materi TWK, trik TIU verbal, numerik & figural, cara menjawab TKP bernilai 5, manajemen waktu, dan jadwal belajar 30 hari.";

const totalMinutes = skdModules.reduce((sum, m) => sum + readingMinutes(m), 0);
const totalExamples = Object.values(skdExamplesBySlug).reduce((sum, list) => sum + list.length, 0);

const FAQ = [
  {
    q: "Apakah modul belajar SKD ini gratis?",
    a: "Ya. Semua modul bisa dibaca gratis tanpa perlu mendaftar. Untuk menguji pemahamanmu, kamu bisa mencoba tryout SKD di CV Pintar.",
  },
  {
    q: "Dari modul mana sebaiknya saya mulai?",
    a: "Mulai dari modul Strategi Lolos SKD untuk memahami format dan passing grade, lalu ikuti urutan modul. Jika waktumu sempit, langsung ke modul subtes yang skornya paling rendah.",
  },
  {
    q: "Apa bedanya modul belajar dengan tryout?",
    a: "Modul menjelaskan materi, pola soal, dan trik mengerjakan. Tryout melatihmu menerapkannya di bawah tekanan waktu seperti CAT BKN, lengkap dengan skor per subtes dan pembahasan.",
  },
  {
    q: "Berapa lama waktu yang dibutuhkan untuk menyelesaikan semua modul?",
    a: `Membaca semua modul hanya butuh sekitar ${totalMinutes} menit. Idealnya, baca satu modul lalu langsung latihan soal di subtes yang sama sebelum lanjut ke modul berikutnya.`,
  },
];

const MODULE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "strategi-lolos-skd": Flag,
  "materi-twk": Landmark,
  "tiu-verbal": Brain,
  "tiu-numerik": Calculator,
  "tiu-figural": Shapes,
  "tkp-cara-menjawab": HeartHandshake,
  "manajemen-waktu-hari-h": Timer,
  "jadwal-belajar-30-hari": CalendarDays,
};

const TOPIC_STYLE: Record<SkdModuleTopic, string> = {
  strategi: "bg-green-50 text-green-800 ring-green-200",
  twk: "bg-amber-50 text-amber-800 ring-amber-200",
  tiu: "bg-sky-50 text-sky-800 ring-sky-200",
  tkp: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export const Route = createFileRoute("/belajar-skd/")({
  head: () =>
    buildSeo({
      title: PAGE_TITLE,
      description: PAGE_DESC,
      path: "/belajar-skd",
      keywords:
        "belajar skd cpns, materi skd cpns, tips skd cpns, trik tiu cpns, cara menjawab tkp, materi twk cpns, passing grade skd, kisi-kisi skd cpns",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: "Tryout CPNS",
              item: `${SITE_URL}/tryout-cpns`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Belajar SKD CPNS",
              item: `${SITE_URL}/belajar-skd`,
            },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Modul Belajar SKD CPNS",
          numberOfItems: skdModules.length,
          itemListElement: skdModules.map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/belajar-skd/${m.slug}`,
            name: m.title,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    }),
  component: BelajarSkdPage,
});

const practiceFeatures = [
  {
    icon: Timer,
    title: "Timer & tampilan ala CAT BKN",
    desc: "110 soal, 100 menit, navigasi soal, dan tandai ragu. Terbiasa dengan tekanan waktu sebelum hari-H.",
  },
  {
    icon: BookOpenCheck,
    title: "Pembahasan setiap soal",
    desc: "Bukan cuma kunci jawaban. Pahami kenapa jawabannya benar, termasuk skor tiap opsi TKP.",
  },
  {
    icon: BarChart3,
    title: "Analisis per subtes & kategori",
    desc: "Lihat jarak ke passing grade dan kategori terlemah, lengkap dengan modul yang perlu kamu ulang.",
  },
] as const;

function BelajarSkdPage() {
  const first = skdModules[0];
  return (
    <>
      <PageHero
        eyebrow={
          <>
            <GraduationCap aria-hidden="true" className="h-4 w-4" /> Modul Belajar SKD CPNS
          </>
        }
        title={
          <>
            Belajar SKD CPNS dari nol sampai{" "}
            <span className="text-green-700">lolos passing grade</span>
          </>
        }
        desc="Materi inti, pola soal, dan trik mengerjakan TWK, TIU, dan TKP dalam 8 modul singkat yang berurutan. Baca, pahami, lalu langsung uji di tryout."
      >
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <PrimaryCta to={`/belajar-skd/${first.slug}`}>Mulai Modul 1</PrimaryCta>
          <SecondaryCta to="/tryout">Coba Tryout Gratis</SecondaryCta>
        </div>
        <TrustChecks
          items={[
            `${skdModules.length} modul gratis`,
            `±${totalMinutes} menit baca`,
            `${totalExamples} contoh soal & pembahasan`,
          ]}
        />
      </PageHero>

      <section aria-labelledby="jalur-heading" className="py-16 lg:py-24">
        <div className="container-page">
          <SectionHeader
            id="jalur-heading"
            eyebrow={
              <>
                <ListChecks aria-hidden="true" className="h-4 w-4" /> Jalur belajar
              </>
            }
            title="Ikuti urutannya, satu modul per hari."
            desc="Setiap modul berisi materi, jebakan yang sering muncul, target waktu pengerjaan, dan contoh soal lengkap dengan pembahasan."
          />
          <ol className="grid gap-5 md:grid-cols-2">
            {skdModules.map((m, i) => {
              const Icon = MODULE_ICON[m.slug] ?? GraduationCap;
              return (
                <li key={m.slug}>
                  <Link
                    to="/belajar-skd/$slug"
                    params={{ slug: m.slug }}
                    className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-green-600/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-700 text-white">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="text-gray-500">Modul {i + 1}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 ring-1 ring-inset",
                              TOPIC_STYLE[m.topic],
                            )}
                          >
                            {SKD_TOPIC_LABEL[m.topic]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {readingMinutes(m)} menit
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-gray-900 group-hover:text-green-800">
                          {m.title}
                        </h3>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
                      {m.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
                            aria-hidden="true"
                          />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-green-700">
                      Baca modul
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section aria-labelledby="praktik-heading" className="bg-green-50/60 py-16 lg:py-24">
        <div className="container-page">
          <SectionHeader
            id="praktik-heading"
            eyebrow={
              <>
                <BookOpenCheck aria-hidden="true" className="h-4 w-4" /> Dari teori ke skor
              </>
            }
            title="Membaca saja tidak cukup. Skor naik lewat latihan."
            desc="Peserta yang lolos biasanya sudah belasan kali mengerjakan simulasi. Tryout CV Pintar dirancang untuk melengkapi modul ini."
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {practiceFeatures.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-300 text-gray-950">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryCta to="/tryout">Coba Tryout Gratis</PrimaryCta>
            <SecondaryCta to="/tryout-cpns">Lihat Fitur Tryout</SecondaryCta>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="py-16 lg:py-24">
        <div className="container-page max-w-3xl">
          <h2
            id="faq-heading"
            className="text-center font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
          >
            Pertanyaan seputar modul SKD
          </h2>
          <dl className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {FAQ.map((f) => (
              <div key={f.q} className="p-5">
                <dt className="font-semibold text-gray-900">{f.q}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBanner
        title="Siap mengukur kemampuanmu?"
        desc="Ambil paket tryout SKD dan pantau kenaikan skormu dari set ke set sampai aman di atas passing grade."
        cta="Lihat Paket Tryout"
        to="/tryout/beli"
        points={["Simulasi ala CAT BKN", "Pembahasan lengkap", "Analisis kelemahan"]}
      />
    </>
  );
}
