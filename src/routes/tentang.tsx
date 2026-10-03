import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck,
  FileText,
  Globe,
  Heart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { buildSeo } from "@/lib/seo";
import {
  CtaBanner,
  Eyebrow,
  PageHero,
  PrimaryCta,
  SecondaryCta,
  SectionHeader,
} from "@/components/site/marketing";

export const Route = createFileRoute("/tentang")({
  head: () =>
    buildSeo({
      title: "Tentang Kami - CV Pintar",
      description:
        "Misi CV Pintar: bantu pencari kerja Indonesia membuat CV ATS friendly yang jelas, kuat, dan lebih siap mendapat panggilan interview.",
      path: "/tentang",
    }),
  component: TentangPage,
});

const stats = [
  { icon: Users, value: "5.000+", label: "pengguna aktif" },
  { icon: FileCheck, value: "10.000+", label: "CV dibuat" },
  { icon: TrendingUp, value: "92%", label: "skor ATS rata-rata" },
  { icon: Target, value: "4.9/5", label: "rating pengguna" },
] as const;

const values = [
  {
    icon: Heart,
    title: "Akses yang lebih setara",
    description:
      "Fresh graduate, career switcher, dan profesional senior sama-sama berhak punya CV yang terlihat serius tanpa biaya yang terasa berat.",
  },
  {
    icon: Shield,
    title: "Dibangun untuk pasar Indonesia",
    description:
      "Kami memperhatikan cara HR lokal membaca CV, istilah jabatan yang umum dipakai, dan kebiasaan apply di perusahaan Indonesia.",
  },
  {
    icon: Bot,
    title: "AI yang paham konteks",
    description:
      "Bukan sekadar merapikan kalimat. AI membantu membuat pengalamanmu terdengar jelas, relevan, dan tetap manusiawi.",
  },
  {
    icon: Zap,
    title: "Simpel, tapi berguna",
    description:
      "Kami menghindari fitur yang ramai tanpa manfaat. Setiap alat harus membantu kamu menulis, mengukur, memperbaiki, atau mengirim CV.",
  },
  {
    icon: Globe,
    title: "Bahasa Indonesia dan Inggris",
    description:
      "Kamu bisa membangun CV dalam bahasa yang sesuai dengan target perusahaan, tanpa kehilangan nada profesional.",
  },
  {
    icon: BadgeCheck,
    title: "Dari CV sampai interview",
    description:
      "CV Pintar tidak berhenti di dokumen. Kami juga membantu review HR, simulasi wawancara, dan private mentoring.",
  },
] as const;

const storyParagraphs = [
  {
    label: "Masalah",
    title: "Kandidat bagus sering gugur terlalu cepat.",
    text: "Banyak pelamar punya skill dan pengalaman yang layak, tapi CV mereka gagal menunjukkan nilai itu dalam beberapa detik pertama. Format berantakan, keyword kurang pas, atau pencapaian tidak terlihat konkret.",
  },
  {
    label: "Insight",
    title: "Rekruter butuh bukti yang cepat dipahami.",
    text: "CV yang kuat bukan yang paling panjang. CV yang kuat membuat rekruter langsung tahu role targetmu, kekuatan utamamu, dan dampak kerja yang pernah kamu hasilkan.",
  },
  {
    label: "Solusi",
    title: "Kami membuat alur yang lebih tenang.",
    text: "CV Pintar menggabungkan template ATS, AI writing, scoring, review HR, dan latihan interview agar proses apply terasa lebih jelas dari awal sampai siap kirim.",
  },
] as const;

const promises = [
  "Tidak menjual data CV pengguna.",
  "Mengutamakan format yang ramah ATS dan nyaman dibaca manusia.",
  "Membuat copywriting CV yang jelas, bukan berlebihan.",
  "Membangun fitur berdasarkan kebutuhan nyata pencari kerja.",
] as const;

function TentangPage() {
  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Tentang CV Pintar
          </>
        }
        title={
          <>
            Kami ingin CV bagus{" "}
            <span className="text-green-700">
              tidak cuma dimiliki orang yang sudah tahu caranya.
            </span>
          </>
        }
        desc="CV Pintar dibuat untuk membantu pencari kerja Indonesia menulis CV yang rapi, relevan, lolos ATS, dan lebih mudah dipahami rekruter."
        aside={<BeliefCard />}
      >
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <PrimaryCta to="/register">Buat CV Gratis</PrimaryCta>
          <SecondaryCta to="/fitur">Lihat Fitur</SecondaryCta>
        </div>
      </PageHero>

      {/* Stats */}
      <section aria-label="Dampak CV Pintar" className="container-page -mt-6 lg:-mt-10">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-lg md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="flex items-center gap-4 bg-white p-5 sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                <item.icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-sm font-medium capitalize text-gray-600">{item.label}</dt>
                <dd className="font-display text-2xl font-extrabold leading-none text-gray-900">
                  {item.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Mission */}
      <section aria-labelledby="misi-heading" className="py-20 lg:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow>Misi kami</Eyebrow>
            <h2
              id="misi-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
            >
              Membuat proses apply terasa{" "}
              <span className="text-green-700">lebih adil, jelas, dan bisa dikerjakan.</span>
            </h2>
          </div>
          <blockquote className="border-l-4 border-green-700 pl-6 text-lg leading-relaxed text-gray-700 sm:text-xl">
            Kami percaya kesempatan kerja yang lebih baik dimulai dari dokumen pertama yang benar.
            CV bukan tempat untuk menebak-nebak. CV harus membantu kamu menjelaskan pengalaman
            dengan struktur yang rapi, bahasa yang kuat, dan bukti yang mudah dipindai.
          </blockquote>
        </div>
      </section>

      {/* Story */}
      <section aria-labelledby="cerita-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="cerita-heading"
            eyebrow="Cerita kami"
            title="Dari masalah yang sering terlihat, jadi produk yang bisa dipakai."
            desc="Kandidat layak sering kalah bukan karena kurang mampu, tapi karena CV-nya tidak menyampaikan nilai dengan jelas."
          />
          <ol className="grid gap-5 md:grid-cols-3">
            {storyParagraphs.map((item, index) => (
              <li
                key={item.title}
                className="relative rounded-2xl border border-gray-200 bg-white p-7"
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      index === 2 ? "bg-green-700 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-extrabold text-green-200"
                  >
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="beda-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="beda-heading"
            eyebrow="Yang bikin kami beda"
            title="Teknologi yang membantu, bukan membuat proses makin ramai."
            desc="Kami memilih fitur yang dekat dengan kebutuhan pelamar: menulis lebih baik, mengukur kesiapan, dan berlatih sebelum kesempatan datang."
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <li
                key={value.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <value.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{value.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Promises */}
      <section
        aria-labelledby="komitmen-heading"
        className="bg-green-950 py-20 text-white lg:py-28"
      >
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow tone="dark">Komitmen</Eyebrow>
            <h2
              id="komitmen-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
            >
              Kami ingin kamu merasa lebih siap, bukan lebih bingung.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-green-100 sm:text-lg">
              Setiap fitur yang kami bangun harus punya satu tujuan: membantu kamu mengambil langkah
              berikutnya dengan lebih percaya diri.
            </p>
          </div>
          <ul className="grid gap-3">
            {promises.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-5"
              >
                <Shield aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
                <span className="text-base text-white">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Next step */}
      <section aria-labelledby="next-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="next-heading"
            eyebrow="Langkah berikutnya"
            title="Dari CV rapi ke strategi apply yang lebih kuat."
            desc="Setelah CV dibuat, lanjut ke scoring, review HR, dan simulasi wawancara."
          />
          <ul className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
            <li>
              <Link
                to="/fitur"
                className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-green-600 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white">
                  <FileCheck aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900 group-hover:text-green-800">
                  Review CV & Scoring
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                  Analisis mendalam dari perspektif HR, lengkap dengan skor ATS dan prioritas
                  perbaikan.
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-green-800">
                  Lihat fitur
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/private-coaching"
                className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-green-600 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white">
                    <BriefcaseBusiness aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-bold text-gray-900">
                    Segera hadir
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900 group-hover:text-green-800">
                  Private Mentoring
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                  Bimbingan 1-on-1 dengan HR Recruiter. Daftar tunggu sudah dibuka.
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-green-800">
                  Masuk daftar tunggu
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <CtaBanner
        title="Siap membuat CV yang lebih mudah dipercaya?"
        desc="Mulai gratis, rapikan isi dengan AI, lalu cek apakah CV kamu sudah siap dikirim."
        cta="Mulai Sekarang"
      />
    </div>
  );
}

function BeliefCard() {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-white">
            <FileText aria-hidden="true" className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Keyakinan kami
            </p>
            <p className="font-display text-xl font-extrabold text-gray-900">
              CV adalah pintu pertama.
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-3">
          {[
            ["Jelas", "Rekruter cepat paham kamu melamar sebagai apa."],
            ["Relevan", "Isi CV nyambung dengan role dan industri target."],
            ["Terukur", "Pencapaian punya bukti, angka, atau konteks."],
          ].map(([title, desc]) => (
            <li key={title} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <div>
                <p className="font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
