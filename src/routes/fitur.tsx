import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Download,
  FileSearch,
  FileText,
  GitCompare,
  Languages,
  Mic,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  Wand2,
} from "lucide-react";

import { buildSeo } from "@/lib/seo";
import {
  CheckItem,
  CtaBanner,
  Eyebrow,
  PageHero,
  PrimaryCta,
  SecondaryCta,
  SectionHeader,
  TrustChecks,
} from "@/components/site/marketing";

export const Route = createFileRoute("/fitur")({
  head: () =>
    buildSeo({
      title: "Fitur CV Pintar - AI CV Builder untuk Lolos ATS",
      description:
        "Semua fitur CV Pintar untuk membuat CV ATS friendly: template profesional, AI Indonesia dan Inggris, scoring CV, review HR Expert, interview AI, dan export PDF.",
      path: "/fitur",
      keywords:
        "fitur cv builder, ai cv indonesia, scoring cv ats, review cv hr expert, simulasi wawancara ai, cover letter ai",
    }),
  component: FiturPage,
});

const proof = [
  { icon: Users, stat: "5.000+", label: "Pengguna aktif" },
  { icon: FileText, stat: "10.000+", label: "CV dibuat" },
  { icon: TrendingUp, stat: "92%", label: "Skor ATS rata-rata" },
  { icon: Star, stat: "4.9/5", label: "Rating pengguna" },
] as const;

type Plan = "Starter" | "Pro";

type FeatureItem = {
  icon: typeof FileText;
  name: string;
  desc: string;
  plan?: Plan;
  isNew?: boolean;
};

const featureGroups: {
  id: string;
  step: string;
  title: string;
  desc: string;
  items: FeatureItem[];
}[] = [
  {
    id: "buat",
    step: "01",
    title: "Buat CV yang rapi",
    desc: "Mulai dari struktur yang benar agar CV mudah dibaca sistem dan manusia.",
    items: [
      {
        icon: FileText,
        name: "Template ATS Friendly",
        desc: "Layout single-column, heading jelas, dan format yang aman untuk portal lowongan.",
      },
      {
        icon: Wand2,
        name: "Editor Live Preview",
        desc: "Tulis di satu sisi, lihat hasil CV langsung tanpa menebak tampilannya.",
      },
      {
        icon: Download,
        name: "Export PDF Berkualitas",
        desc: "PDF rapi, ringan, dan terbaca sempurna oleh ATS maupun rekruter manusia.",
      },
    ],
  },
  {
    id: "ai",
    step: "02",
    title: "Perkuat isi dengan AI",
    desc: "Ubah pengalaman biasa menjadi pesan karier yang lebih jelas dan meyakinkan.",
    items: [
      {
        icon: Bot,
        name: "AI Bahasa Indonesia + Inggris",
        desc: "Bantu menulis ringkasan, pengalaman, skill, dan pencapaian dalam dua bahasa.",
      },
      {
        icon: Target,
        name: "CV Scoring",
        desc: "Cek format, keyword, skill, dan relevansi CV terhadap job description target.",
      },
      {
        icon: FileSearch,
        name: "AI Job Match Score",
        desc: "Cocokkan CV dengan lowongan dari database, URL, atau job description untuk melihat match score dan keyword gap.",
        plan: "Starter",
        isNew: true,
      },
      {
        icon: RefreshCw,
        name: "Auto Tailor CV untuk Lowongan",
        desc: "Tempel job description, lalu AI menyesuaikan ringkasan, urutan skill, dan bullet pengalaman agar lebih relevan tanpa mengarang data.",
        plan: "Pro",
        isNew: true,
      },
      {
        icon: UserRoundCheck,
        name: "Review CV by HR Expert AI",
        desc: "Analisis mendalam dari perspektif HR profesional 20+ tahun, lengkap dengan quick wins.",
        plan: "Starter",
      },
      {
        icon: FileSearch,
        name: "Keyword Extractor",
        desc: "Paste lowongan kerja, lalu temukan keyword penting yang perlu masuk CV.",
      },
      {
        icon: Sparkles,
        name: "Cover Letter Generator",
        desc: "Buat surat lamaran yang personal dari data CV dan posisi yang dituju.",
      },
      {
        icon: Languages,
        name: "Preview ATS",
        desc: "Lihat versi plain text agar kamu tahu bagaimana mesin membaca CV-mu.",
      },
    ],
  },
  {
    id: "lamaran",
    step: "03",
    title: "Siapkan lamaran berikutnya",
    desc: "Setelah CV siap, lanjutkan ke tracking, interview, dan iterasi yang lebih terarah.",
    items: [
      {
        icon: Briefcase,
        name: "Pelacak Lamaran",
        desc: "Simpan posisi, perusahaan, status, catatan, dan next step dalam satu dashboard.",
        isNew: true,
      },
      {
        icon: Mic,
        name: "Simulasi Wawancara AI",
        desc: "Latihan interview dengan pertanyaan, jawaban, dan feedback instan.",
        plan: "Pro",
      },
      {
        icon: GitCompare,
        name: "Bandingkan Versi",
        desc: "Bandingkan dua versi CV untuk melihat mana yang lebih kuat sebelum dikirim.",
      },
      {
        icon: Share2,
        name: "Portfolio / Share Page",
        desc: "Bagikan portfolio publik berisi profil, skill, pengalaman, kontak, dan preview CV yang bisa dicetak.",
        isNew: true,
      },
      {
        icon: ShieldCheck,
        name: "Privasi Dijaga",
        desc: "Data CV tetap milik kamu, aksesnya dibatasi, dan tidak dijual ke pihak ketiga.",
      },
    ],
  },
];

const workflow = [
  ["1", "Buat", "Pilih template ATS dan susun struktur CV yang bersih."],
  ["2", "Perkuat", "AI bantu menulis isi yang konkret, ringkas, dan relevan."],
  ["3", "Cek", "Scoring dan review membantu menemukan bagian yang masih lemah."],
  ["4", "Kirim", "Export PDF, lacak lamaran, lalu siapkan interview berikutnya."],
] as const;

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className={
        plan === "Pro"
          ? "rounded-full bg-gray-900 px-2.5 py-1 text-xs font-bold text-white"
          : "rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800"
      }
    >
      <span className="sr-only">Tersedia di paket </span>
      {plan}
    </span>
  );
}

function FiturPage() {
  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {featureGroups.reduce((n, g) => n + g.items.length, 0)}+ fitur dalam satu alur
          </>
        }
        title={
          <>
            Semua yang kamu butuhkan <span className="text-green-700">sebelum klik kirim.</span>
          </>
        }
        desc={
          <>
            Template ATS, AI bilingual, scoring, review HR, dan tools lamaran kerja dalam satu alur
            yang sederhana.{" "}
            <strong className="font-semibold text-gray-900">Tidak ramai. Langsung membantu.</strong>
          </>
        }
        aside={<FeaturePreview />}
      >
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <PrimaryCta to="/register">Mulai Gratis Sekarang</PrimaryCta>
          <SecondaryCta to="/template">Lihat Template</SecondaryCta>
        </div>
        <TrustChecks />

        <nav
          aria-label="Lompat ke kategori fitur"
          className="mt-8 w-full border-t border-gray-200 pt-6"
        >
          <p className="text-sm font-semibold text-gray-900">Lompat ke:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {featureGroups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
                >
                  <span className="text-green-700">{g.step}</span>
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      {/* Proof bar */}
      <section aria-label="Bukti performa" className="container-page -mt-6 lg:-mt-10">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-lg md:grid-cols-4">
          {proof.map((item) => (
            <div key={item.label} className="flex items-center gap-4 bg-white p-5 sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                <item.icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-sm font-medium text-gray-600">{item.label}</dt>
                <dd className="font-display text-2xl font-extrabold leading-none text-gray-900">
                  {item.stat}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Workflow */}
      <section aria-labelledby="flow-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="flow-heading"
            eyebrow="Alur kerja"
            title="Dari CV kosong ke lamaran yang lebih siap."
            desc="Setiap fitur ditempatkan di alur yang natural, supaya kamu tahu harus melakukan apa berikutnya."
          />
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute left-[12%] right-[12%] top-7 hidden border-t-2 border-dashed border-green-300 md:block"
            />
            <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
              {workflow.map(([n, title, desc]) => (
                <li key={n} className="flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 font-display text-2xl font-extrabold text-white ring-8 ring-white">
                    <span className="sr-only">Langkah </span>
                    {n}
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-gray-600">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Feature groups */}
      <section aria-labelledby="features-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="features-heading"
            eyebrow="Fitur"
            title="Powerful, tapi tetap ringan dipakai."
            desc="Fokus pada fitur yang benar-benar membantu pencari kerja: struktur, relevansi, bukti, dan kesiapan interview."
          />

          <div className="mx-auto -mt-4 mb-14 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2">
              <PlanBadge plan="Starter" /> / <PlanBadge plan="Pro" /> = tersedia di paket berbayar
            </span>
            <Link
              to="/harga"
              className="inline-flex min-h-11 items-center gap-1 font-bold text-green-800 underline-offset-4 hover:underline"
            >
              Bandingkan paket
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-20">
            {featureGroups.map((group) => (
              <section
                key={group.id}
                id={group.id}
                aria-labelledby={`${group.id}-heading`}
                className="scroll-mt-28"
              >
                <div className="mb-8 flex items-end gap-5">
                  <span
                    aria-hidden="true"
                    className="font-display text-6xl font-extrabold leading-none text-green-200 sm:text-7xl"
                  >
                    {group.step}
                  </span>
                  <div>
                    <h3
                      id={`${group.id}-heading`}
                      className="font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl"
                    >
                      {group.title}
                    </h3>
                    <p className="mt-1 max-w-xl text-base leading-relaxed text-gray-600">
                      {group.desc}
                    </p>
                  </div>
                </div>

                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-green-600 hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                          <item.icon aria-hidden="true" className="h-6 w-6" />
                        </span>
                        <div className="flex flex-wrap justify-end gap-2">
                          {item.isNew && (
                            <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-bold text-gray-900">
                              Baru
                            </span>
                          )}
                          {item.plan && <PlanBadge plan={item.plan} />}
                        </div>
                      </div>
                      <h4 className="mt-5 font-display text-lg font-bold text-gray-900">
                        {item.name}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* AI + HR */}
      <section aria-labelledby="aihr-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>AI + HR</Eyebrow>
              <h2
                id="aihr-heading"
                className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
              >
                Bukan cuma bikin CV.{" "}
                <span className="text-green-700">Kamu tahu kenapa CV itu lebih kuat.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
                Saran AI membantu menulis lebih cepat. Scoring dan review HR membantu mengambil
                keputusan: bagian mana yang perlu dipotong, diperjelas, atau diberi angka.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  "Saran bilingual Indonesia dan Inggris",
                  "Keyword dan tailoring berdasarkan job description",
                  "Feedback HR dengan prioritas perbaikan",
                  "Preview ATS sebelum export PDF",
                ].map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </ul>
              <div className="mt-10">
                <PrimaryCta to="/register">Cek Skor CV Gratis</PrimaryCta>
              </div>
            </div>

            <ReviewMockup />
          </div>
        </div>
      </section>

      <CtaBanner
        title="Mulai dari satu CV. Lanjutkan sampai interview."
        desc="Buat CV pertama, cek skornya, lalu kirim dengan lebih percaya diri."
        cta="Mulai Gratis Sekarang"
      />
    </div>
  );
}

function FeaturePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div
        role="img"
        aria-label="Ringkasan toolkit CV Pintar: template dengan struktur rapi, AI writing Indonesia dan Inggris, scoring keyword, dan simulasi interview dengan feedback instan."
        className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Smart toolkit
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-gray-900">CV Pintar</p>
            <p className="mt-1 text-sm text-gray-600">Build, score, review, interview</p>
          </div>
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
            ATS-ready
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {(
            [
              [FileText, "Template", "Struktur rapi"],
              [Bot, "AI writing", "ID + EN"],
              [Target, "Scoring", "Keyword cocok"],
              [Mic, "Interview", "Feedback instan"],
            ] as const
          ).map(([Icon, title, desc]) => (
            <div key={title} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-600">{desc}</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-green-600" />
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-green-800 p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-yellow-300" /> Next best action
          </p>
          <p className="mt-1 text-sm leading-relaxed text-green-50">
            Tambahkan angka hasil kerja di pengalaman utama sebelum export PDF.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewMockup() {
  return (
    <div
      role="img"
      aria-label="Contoh ringkasan review CV dengan skor 91: ringkasan profil sudah kuat, pengalaman utama perlu ditambah metrik, dan quick win menambahkan keyword role target di dua bullet."
      className="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-green-900/10"
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-600">CV readiness</p>
          <p className="mt-1 font-display text-xl font-extrabold text-gray-900">Review summary</p>
        </div>
        <div className="rounded-2xl bg-green-800 px-4 py-2 text-center text-white">
          <p className="text-xs font-semibold text-green-100">Score</p>
          <p className="font-display text-2xl font-extrabold">91</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {[
          ["Kuat", "Ringkasan profil sudah fokus pada impact.", "bg-green-100 text-green-800"],
          ["Perlu naik", "Tambahkan metrik di pengalaman utama.", "bg-amber-100 text-amber-900"],
          ["Quick win", "Masukkan keyword role target di 2 bullet.", "bg-yellow-200 text-gray-900"],
        ].map(([title, desc, tone]) => (
          <div key={title} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
              {title}
            </span>
            <p className="text-sm leading-relaxed text-gray-700">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
