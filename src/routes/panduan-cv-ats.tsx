import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  ImageOff,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Type,
  UserRound,
  Wand2,
  Wrench,
  XCircle,
} from "lucide-react";

import { buildSeo } from "@/lib/seo";
import {
  AnchorCta,
  CtaBanner,
  Eyebrow,
  JumpNav,
  PageHero,
  PrimaryCta,
  SectionHeader,
} from "@/components/site/marketing";

export const Route = createFileRoute("/panduan-cv-ats")({
  head: () =>
    buildSeo({
      title: "Panduan Lengkap Membuat CV ATS Friendly 2026",
      description:
        "Pelajari cara membuat CV ATS friendly Bahasa Indonesia: format, struktur, keyword, kesalahan umum, dan checklist praktis sebelum kirim lamaran.",
      path: "/panduan-cv-ats",
      type: "article",
      keywords: "cara buat cv ats, panduan CV Pintar, format cv ats, contoh cv ats friendly",
      jsonLd: [
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
            { "@type": "ListItem", position: 2, name: "Panduan CV ATS" },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Panduan Lengkap Membuat CV ATS Friendly 2026",
          inLanguage: "id-ID",
          author: { "@type": "Organization", name: "CV Pintar" },
          publisher: {
            "@type": "Organization",
            name: "CV Pintar",
            url: "https://cvpintar.web.id",
          },
          datePublished: "2026-05-05",
          dateModified: "2026-05-05",
        },
      ],
    }),
  component: PanduanPage,
});

const principles = [
  {
    icon: FileText,
    title: "Single column",
    desc: "Satu kolom membuat urutan informasi lebih mudah dibaca ATS dan rekruter.",
  },
  {
    icon: Type,
    title: "Font standar",
    desc: "Gunakan Inter, Arial, Calibri, atau font umum lain yang tetap jelas saat diekspor.",
  },
  {
    icon: ImageOff,
    title: "Minim elemen visual",
    desc: "Hindari grafik, foto, tabel rumit, dan informasi penting di header atau footer.",
  },
  {
    icon: BadgeCheck,
    title: "Heading jelas",
    desc: "Pakai label umum seperti Ringkasan, Pengalaman, Pendidikan, Skill, dan Sertifikasi.",
  },
  {
    icon: Download,
    title: "PDF text-based",
    desc: "Kirim PDF yang teksnya bisa diseleksi, bukan hasil scan atau gambar.",
  },
  {
    icon: Search,
    title: "Keyword natural",
    desc: "Ambil kata kunci dari job description, lalu masukkan ke pengalaman dan skill.",
  },
] as const;

const structure = [
  {
    icon: UserRound,
    num: "01",
    title: "Header dan kontak",
    desc: "Nama, posisi target, kota, email aktif, nomor HP, dan LinkedIn bila relevan.",
  },
  {
    icon: Target,
    num: "02",
    title: "Ringkasan profesional",
    desc: "2 sampai 3 kalimat yang menjelaskan peran, kekuatan utama, dan arah karier.",
  },
  {
    icon: Briefcase,
    num: "03",
    title: "Pengalaman kerja",
    desc: "Mulai dari yang terbaru, gunakan action verb, angka, dan impact yang terukur.",
  },
  {
    icon: GraduationCap,
    num: "04",
    title: "Pendidikan",
    desc: "Tulis institusi, jurusan, tahun, IPK bila kuat, dan pencapaian akademik penting.",
  },
  {
    icon: Wrench,
    num: "05",
    title: "Skill",
    desc: "Pisahkan tools, technical skills, bahasa, dan soft skill yang relevan dengan lowongan.",
  },
  {
    icon: Award,
    num: "06",
    title: "Sertifikasi dan proyek",
    desc: "Tambahkan bukti kredibel seperti sertifikat, portfolio, organisasi, atau proyek.",
  },
] as const;

const mistakes = [
  "Template berbasis tabel rumit",
  "Paragraf panjang tanpa bullet",
  "Keyword lowongan tidak muncul",
  "Informasi pribadi yang tidak relevan",
  "CV terlalu panjang tanpa prioritas",
  "PDF hasil scan atau file yang sulit dibaca",
] as const;

const recruiterNotes = [
  {
    icon: Clock,
    stat: "6 detik",
    title: "Waktu scan awal",
    desc: "Bagian atas CV harus langsung menjawab: kamu siapa, bisa apa, dan cocok untuk role apa.",
  },
  {
    icon: TrendingUp,
    stat: ">75%",
    title: "Target skor ATS",
    desc: "Skor bukan segalanya, tapi membantu melihat apakah format dan keyword sudah cukup kuat.",
  },
  {
    icon: Lightbulb,
    stat: "1 halaman",
    title: "Untuk early career",
    desc: "Kalau pengalaman masih di bawah 5 tahun, satu halaman yang tajam biasanya lebih kuat.",
  },
] as const;

const checklist = [
  "Format PDF text-based",
  "Layout single column",
  "Font standar dan mudah dibaca",
  "Tanpa grafik, tabel rumit, atau foto wajib",
  "Keyword dari job description sudah masuk",
  "Maksimal 1 sampai 2 halaman",
  "Bullet pengalaman memakai action verb",
  "Ada angka, scope, atau impact",
  "Email dan nomor HP aktif",
  "LinkedIn atau portfolio relevan",
] as const;

const toc = [
  { id: "dasar", label: "Apa itu ATS" },
  { id: "prinsip", label: "6 prinsip inti" },
  { id: "struktur", label: "Struktur CV" },
  { id: "kesalahan", label: "Kesalahan umum" },
  { id: "rekruter", label: "Catatan rekruter" },
  { id: "checklist", label: "Checklist" },
];

function PanduanPage() {
  return (
    <article className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Panduan CV ATS 2026 · 8 menit baca
          </>
        }
        title={
          <>
            CV yang lolos ATS dimulai dari{" "}
            <span className="text-green-700">struktur yang mudah dipercaya.</span>
          </>
        }
        desc="ATS bukan musuh. Ia hanya membaca apa yang kamu susun. Panduan ini membantu CV kamu terbaca mesin, tetap nyaman untuk HR, dan lebih kuat dibanding kandidat lain."
        aside={<AtsPreview />}
      >
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <PrimaryCta to="/register">Buat CV ATS Gratis</PrimaryCta>
          <AnchorCta href="#checklist">Langsung ke Checklist</AnchorCta>
        </div>
        <JumpNav items={toc} />
      </PageHero>

      {/* Basics */}
      <section id="dasar" aria-labelledby="dasar-heading" className="scroll-mt-20 py-20 lg:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Eyebrow>Dasar dulu</Eyebrow>
            <h2
              id="dasar-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Apa itu ATS, dan kenapa CV bagus bisa tetap tersaring?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Applicant Tracking System adalah software yang membantu perusahaan menyimpan, membaca,
              dan menyaring lamaran. Masalahnya, CV yang terlalu visual sering gagal dibaca dengan
              benar.
            </p>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: Bot,
                title: "Mesin membaca struktur",
                desc: "ATS mencari heading, tanggal, jabatan, skill, dan keyword yang relevan.",
              },
              {
                icon: ShieldCheck,
                title: "HR membaca kejelasan",
                desc: "Setelah lolos mesin, rekruter tetap mencari impact dan bukti kerja nyata.",
              },
            ].map((item, i) => (
              <li
                key={item.title}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-green-800">
                  Tahap {i + 1}
                </p>
                <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <item.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Principles */}
      <section
        id="prinsip"
        aria-labelledby="prinsip-heading"
        className="scroll-mt-20 bg-gray-50 py-20 lg:py-28"
      >
        <div className="container-page">
          <SectionHeader
            id="prinsip-heading"
            eyebrow="Prinsip inti"
            title="Enam aturan sederhana yang membuat CV lebih mudah dibaca."
            desc="Kuncinya bukan desain yang ramai. Kuncinya adalah struktur yang jelas, teks yang bisa dipindai, dan keyword yang relevan."
          />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((item, i) => (
              <li key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                    <item.icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-extrabold text-green-200"
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </li>
            ))}
          </ol>

          {/* Inline pitch */}
          <aside
            aria-label="Template CV Pintar"
            className="mt-10 flex flex-col items-start justify-between gap-6 rounded-2xl bg-green-800 p-7 text-white sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-yellow-300">
                <BadgeCheck aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-xl font-bold">Tidak mau ribet cek satu per satu?</p>
                <p className="mt-1 text-sm text-green-50">
                  Template ATS CV Pintar sudah memenuhi keenam prinsip ini sejak awal.
                </p>
              </div>
            </div>
            <Link
              to="/template"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-yellow-300 px-6 font-bold text-gray-950 transition-colors hover:bg-yellow-200"
            >
              Lihat Template ATS
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      {/* Structure */}
      <section
        id="struktur"
        aria-labelledby="struktur-heading"
        className="scroll-mt-20 py-20 lg:py-28"
      >
        <div className="container-page">
          <SectionHeader
            id="struktur-heading"
            eyebrow="Struktur CV"
            title="Urutan informasi yang paling mudah dipahami ATS dan HR."
            desc="Susun dari identitas profesional, nilai utama, bukti pengalaman, lalu kredibilitas pendukung."
          />
          <ol className="relative mx-auto max-w-3xl space-y-4 before:absolute before:bottom-6 before:left-6 before:top-6 before:w-0.5 before:bg-green-200 sm:before:left-7">
            {structure.map((item) => (
              <li key={item.title} className="relative flex gap-5">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700 font-display text-base font-extrabold text-white ring-4 ring-white sm:h-14 sm:w-14 sm:text-lg">
                  <span className="sr-only">Bagian </span>
                  {item.num}
                </span>
                <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-lg">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold text-gray-900">
                    <item.icon aria-hidden="true" className="h-5 w-5 text-green-700" />
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Mistakes */}
      <section
        id="kesalahan"
        aria-labelledby="kesalahan-heading"
        className="scroll-mt-20 bg-red-50/60 py-20 lg:py-28"
      >
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-800">
              <AlertTriangle aria-hidden="true" className="h-4 w-4" /> Hindari ini
            </span>
            <h2
              id="kesalahan-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Kesalahan kecil yang sering membuat CV terlihat lemah.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Banyak kandidat gagal bukan karena tidak kompeten, tapi karena CV mereka susah
              diproses. Bagian ini cepat, tapi penting.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {mistakes.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4"
              >
                <XCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <span className="font-semibold text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recruiter notes */}
      <section
        id="rekruter"
        aria-labelledby="rekruter-heading"
        className="scroll-mt-20 py-20 lg:py-28"
      >
        <div className="container-page">
          <SectionHeader
            id="rekruter-heading"
            eyebrow="Catatan rekruter"
            title="CV yang kuat membantu rekruter memutuskan lebih cepat."
            desc="Tulis untuk mesin, tapi tetap yakinkan manusia. Dua-duanya butuh kejelasan."
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {recruiterNotes.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-7 text-center"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <item.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <p className="mt-5 font-display text-5xl font-extrabold text-green-700">
                  {item.stat}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interactive checklist */}
      <section
        id="checklist"
        aria-labelledby="checklist-heading"
        className="scroll-mt-20 bg-gray-50 py-20 lg:py-28"
      >
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <Eyebrow>Checklist</Eyebrow>
            <h2
              id="checklist-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Sebelum kirim lamaran, cek sepuluh hal ini.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Centang yang sudah kamu penuhi. Checklist ini mencegah CV kalah karena hal teknis yang
              sebenarnya bisa dihindari.
            </p>
          </div>
          <InteractiveChecklist />
        </div>
      </section>

      <CtaBanner
        title="Cara tercepat memahami ATS: perbaiki CV-mu sendiri."
        desc="Mulai dari template yang aman, tulis isi CV, lalu gunakan AI untuk scoring, keyword, dan perbaikan kalimat."
        cta="Buat CV Sekarang"
      />
    </article>
  );
}

function InteractiveChecklist() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const count = done.size;
  const total = checklist.length;
  const pct = Math.round((count / total) * 100);

  const toggle = (item: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-green-900/5 sm:p-8">
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-lg font-bold text-gray-900">Kesiapan CV-mu</p>
        <p className="font-display text-3xl font-extrabold text-green-700" aria-hidden="true">
          {count}/{total}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Kesiapan CV"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={count}
        aria-valuetext={`${count} dari ${total} poin terpenuhi`}
        className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-green-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <fieldset className="mt-6">
        <legend className="sr-only">Checklist CV ATS</legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => {
            const checked = done.has(item);
            const id = `cl-${item.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <li key={item}>
                <label
                  htmlFor={id}
                  className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    checked
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-green-600"
                  }`}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item)}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-green-700"
                  />
                  <span
                    className={`text-sm font-medium leading-6 ${checked ? "text-gray-900" : "text-gray-700"}`}
                  >
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div aria-live="polite" className="mt-6">
        {count === total ? (
          <div className="flex flex-col gap-4 rounded-2xl bg-green-800 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-yellow-300" />
              Mantap! CV-mu siap. Buktikan dengan skor ATS.
            </p>
            <Link
              to="/register"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-yellow-300 px-5 font-bold text-gray-950 hover:bg-yellow-200"
            >
              Cek Skor Gratis
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            {count === 0
              ? "Mulai centang poin yang sudah kamu penuhi."
              : `${total - count} poin lagi. `}
            {count > 0 && (
              <Link
                to="/register"
                className="font-bold text-green-800 underline underline-offset-4"
              >
                Biar AI yang bantu cek
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function AtsPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div
        role="img"
        aria-label="Contoh hasil scan ATS: CV terbaca 92 persen. Struktur heading jelas, keyword cocok dengan role, bullet punya angka. Perlu diperbaiki: tambahkan angka di pengalaman utama dan samakan istilah skill dengan job description."
        className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              ATS scan preview
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-gray-900">CV terbaca</p>
          </div>
          <span className="rounded-2xl bg-green-800 px-4 py-2 font-display text-2xl font-extrabold text-white">
            92%
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {(
            [
              [FileCheck, "Struktur", "Heading dan urutan jelas"],
              [Search, "Keyword", "Skill cocok dengan role"],
              [Wand2, "Impact", "Bullet punya angka dan hasil"],
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
              <CheckCircle2 className="h-5 w-5 text-green-700" />
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Yang perlu diperbaiki
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-800">
            Tambahkan angka pada pengalaman utama dan samakan istilah skill dengan job description
            target.
          </p>
        </div>
      </div>
    </div>
  );
}
