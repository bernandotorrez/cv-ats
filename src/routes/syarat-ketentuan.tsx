import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  Mail,
  RefreshCw,
  Scale,
  Shield,
  Sparkles,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { buildSeo } from "@/lib/seo";
import { Eyebrow, PageHero } from "@/components/site/marketing";

export const Route = createFileRoute("/syarat-ketentuan")({
  head: () =>
    buildSeo({
      title: "Syarat & Ketentuan - CV Pintar",
      description:
        "Ketentuan penggunaan layanan CV Pintar dalam bahasa yang jelas, ringkas, dan mudah dipahami.",
      path: "/syarat-ketentuan",
    }),
  component: SyaratKetentuanPage,
});

const LAST_UPDATED = "1 Mei 2026";

const summary = [
  "Gunakan CV Pintar untuk membuat dokumen karier yang jujur dan relevan.",
  "Jaga akun dan kode loginmu. Jangan bagikan akses ke orang lain.",
  "AI membantu memperbaiki kualitas, tapi keputusan akhir tetap ada padamu.",
];

const sections = [
  { id: "penggunaan", number: "01", icon: FileCheck, title: "Penggunaan layanan" },
  { id: "akun", number: "02", icon: User, title: "Akun dan keamanan" },
  { id: "pembayaran", number: "03", icon: CreditCard, title: "Pembayaran dan refund" },
  { id: "tanggung-jawab", number: "04", icon: Scale, title: "Batas tanggung jawab" },
] as const;

type SectionId = (typeof sections)[number]["id"];

const usageGroups = [
  {
    icon: FileCheck,
    label: "Yang boleh",
    tone: "positive",
    items: [
      "Membuat CV, surat lamaran, dan materi karier untuk dirimu sendiri.",
      "Memakai AI untuk memperbaiki struktur, bahasa, dan kejelasan cerita.",
      "Mengunduh CV ATS-friendly untuk kebutuhan lamaran kerja.",
    ],
  },
  {
    icon: Ban,
    label: "Yang tidak boleh",
    tone: "negative",
    items: [
      "Membuat informasi palsu, menyesatkan, atau melanggar hukum.",
      "Menyalahgunakan AI untuk plagiarisme, penipuan, atau spam.",
      "Mengganggu keamanan, sistem, atau pengalaman pengguna lain.",
    ],
  },
] as const;

const accountRules = [
  "Kamu bertanggung jawab atas aktivitas yang terjadi di akunmu.",
  "Kode OTP dan akses login tidak boleh dibagikan ke siapa pun.",
  "Laporkan aktivitas mencurigakan ke cs@cvpintar.web.id.",
  "Kami dapat menangguhkan akun yang terbukti melanggar ketentuan.",
];

const paymentRules = [
  {
    icon: Clock,
    label: "Refund 7 hari",
    desc: "Kamu bisa mengajukan refund penuh dalam 7 hari pertama setelah pembayaran, selama tidak ada penyalahgunaan layanan.",
  },
  {
    icon: RefreshCw,
    label: "Berhenti kapan saja",
    desc: "Langganan dapat dihentikan kapan saja lewat WhatsApp. Akses aktif tetap berjalan sampai periode berakhir.",
  },
  {
    icon: CreditCard,
    label: "Pembayaran paket",
    desc: "Paket Starter dan Pro dibayar via QRIS melalui payment gateway. Akses paket aktif otomatis setelah pembayaran terkonfirmasi.",
  },
];

const liabilityCards = [
  {
    icon: AlertTriangle,
    title: "Yang tidak bisa kami jamin",
    tone: "warning",
    items: [
      "Diterima kerja di posisi atau perusahaan tertentu.",
      "Setiap saran AI selalu sempurna tanpa perlu ditinjau ulang.",
      "Layanan bebas gangguan setiap saat.",
    ],
  },
  {
    icon: Shield,
    title: "Yang kami upayakan",
    tone: "positive",
    items: [
      "Produk yang berguna, aman, dan terus diperbaiki.",
      "Data pengguna diproses dengan standar keamanan yang wajar.",
      "Support yang responsif dan manusiawi.",
    ],
  },
] as const;

function SyaratKetentuanPage() {
  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <Scale aria-hidden="true" className="h-4 w-4" />
            Syarat & Ketentuan
          </>
        }
        title={
          <>
            Aturan main yang jelas,{" "}
            <span className="text-green-700">supaya pengalamanmu tetap nyaman.</span>
          </>
        }
        desc="Dokumen ini menjelaskan cara menggunakan CV Pintar dengan aman, adil, dan bertanggung jawab. Kami buat ringkas tanpa mengurangi hal penting."
        aside={<SummaryCard />}
      >
        <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <CalendarDays aria-hidden="true" className="h-4 w-4 text-green-700" />
          Terakhir diperbarui: {LAST_UPDATED}
        </p>
        <JumpLinks className="mt-8 w-full border-t border-gray-200 pt-6 lg:hidden" />
      </PageHero>

      <section aria-label="Isi syarat dan ketentuan" className="bg-gray-50 py-16 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-16">
          {/* Daftar isi (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <JumpLinks vertical />
            </div>
          </aside>

          <div className="min-w-0 space-y-16 lg:space-y-20">
            <TermsSection
              id="penggunaan"
              description="CV Pintar membantu kamu membuat dokumen karier yang lebih rapi, relevan, dan mudah dipahami."
            >
              <div className="grid gap-5 md:grid-cols-2">
                {usageGroups.map((group) => {
                  const positive = group.tone === "positive";
                  const BulletIcon = positive ? CheckCircle2 : XCircle;
                  return (
                    <div
                      key={group.label}
                      className={`rounded-2xl border bg-white p-6 ${positive ? "border-green-200" : "border-red-200"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${positive ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"}`}
                        >
                          <group.icon aria-hidden="true" className="h-6 w-6" />
                        </span>
                        <h3 className="font-display text-lg font-bold text-gray-900">
                          {group.label}
                        </h3>
                      </div>
                      <ul className="mt-5 space-y-3">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <BulletIcon
                              aria-hidden="true"
                              className={`mt-0.5 h-5 w-5 shrink-0 ${positive ? "text-green-700" : "text-red-700"}`}
                            />
                            <span className="text-sm leading-relaxed text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </TermsSection>

            <TermsSection
              id="akun"
              description="Akunmu adalah pintu ke CV, review, dan fitur berbayar. Jaga aksesnya baik-baik."
            >
              <ol className="grid gap-4 sm:grid-cols-2">
                {accountRules.map((rule, i) => (
                  <li
                    key={rule}
                    className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 font-display text-sm font-extrabold text-white"
                    >
                      {i + 1}
                    </span>
                    <span className="pt-1.5 text-sm leading-relaxed text-gray-700">{rule}</span>
                  </li>
                ))}
              </ol>
            </TermsSection>

            <TermsSection
              id="pembayaran"
              description="Paket Starter dan Pro dibayar via QRIS melalui payment gateway. Akses paket aktif otomatis setelah pembayaran terkonfirmasi."
            >
              <ul className="grid gap-5 md:grid-cols-3">
                {paymentRules.map((item) => (
                  <li
                    key={item.label}
                    className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                      <item.icon aria-hidden="true" className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold text-gray-900">
                      {item.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-gray-700">
                Detail harga tiap paket ada di{" "}
                <Link
                  to="/harga"
                  className="font-bold text-green-800 underline underline-offset-4 hover:text-green-900"
                >
                  halaman Harga
                </Link>
                .
              </p>
            </TermsSection>

            <TermsSection
              id="tanggung-jawab"
              description="Kami membangun alat bantu karier. Hasil akhir proses rekrutmen tetap dipengaruhi banyak faktor di luar aplikasi."
            >
              <div className="grid gap-5 md:grid-cols-2">
                {liabilityCards.map((card) => {
                  const positive = card.tone === "positive";
                  return (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-gray-200 bg-white p-6"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${positive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}
                        >
                          <card.icon aria-hidden="true" className="h-6 w-6" />
                        </span>
                        <h3 className="font-display text-lg font-bold text-gray-900">
                          {card.title}
                        </h3>
                      </div>
                      <ul className="mt-5 space-y-3">
                        {card.items.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span
                              aria-hidden="true"
                              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${positive ? "bg-green-700" : "bg-amber-600"}`}
                            />
                            <span className="text-sm leading-relaxed text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 rounded-2xl border-l-4 border-green-700 bg-white p-5 text-sm leading-relaxed text-gray-700">
                Layanan disediakan sebagaimana adanya. Kami terus meningkatkan kualitas, tetapi kamu
                tetap perlu meninjau hasil akhir sebelum dipakai untuk melamar kerja.
              </p>
            </TermsSection>
          </div>
        </div>
      </section>

      <ContactBanner />
    </div>
  );
}

function SummaryCard() {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
            <Sparkles aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">TL;DR</p>
            <h2 className="font-display text-xl font-extrabold text-gray-900">Versi singkatnya</h2>
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {summary.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <span className="text-sm leading-relaxed text-gray-800">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function JumpLinks({ vertical = false, className }: { vertical?: boolean; className?: string }) {
  return (
    <nav aria-label="Daftar isi" className={className}>
      <p className="text-sm font-semibold text-gray-900">Daftar isi:</p>
      <ul className={vertical ? "mt-3 space-y-1" : "mt-3 flex flex-wrap gap-2"}>
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={
                vertical
                  ? "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-white hover:text-green-800"
                  : "inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
              }
            >
              <span className="font-display font-extrabold text-green-700">{s.number}</span>
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TermsSection({
  id,
  description,
  children,
}: {
  id: SectionId;
  description: string;
  children: ReactNode;
}) {
  const meta = sections.find((s) => s.id === id)!;
  const Icon: LucideIcon = meta.icon;
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
      <div className="mb-8 flex items-end gap-5">
        <span
          aria-hidden="true"
          className="font-display text-6xl font-extrabold leading-none text-green-200 sm:text-7xl"
        >
          {meta.number}
        </span>
        <div>
          <h2
            id={`${id}-heading`}
            className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl"
          >
            <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-green-700" />
            {meta.title}
          </h2>
          <p className="mt-1 max-w-2xl text-base leading-relaxed text-gray-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ContactBanner() {
  return (
    <section aria-labelledby="contact-heading" className="container-page py-16 lg:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-green-700 px-6 py-12 text-white shadow-2xl sm:px-12 lg:py-16">
        <div
          aria-hidden="true"
          className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-green-600/40 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Eyebrow tone="dark">Ada pertanyaan?</Eyebrow>
          <h2
            id="contact-heading"
            className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
          >
            Kalau ada yang kurang jelas, kami bantu jelaskan tanpa bahasa rumit.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-green-50">
            Ketentuan ini dapat diperbarui dari waktu ke waktu. Jika ada perubahan penting, kami
            akan mengomunikasikannya lewat kanal yang tersedia.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="mailto:cs@cvpintar.web.id"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-yellow-300 px-8 text-base font-extrabold text-gray-950 shadow-lg transition-colors hover:bg-yellow-200"
            >
              <Mail aria-hidden="true" className="mr-2 h-5 w-5" />
              cs@cvpintar.web.id
            </a>
            <Link
              to="/kebijakan-privasi"
              className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-white/70 px-8 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Baca kebijakan privasi
              <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
