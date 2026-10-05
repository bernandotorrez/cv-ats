import { useState, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  FileText,
  Gauge,
  Highlighter,
  Key,
  LockKeyhole,
  MessageCircle,
  Pencil,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserRoundCheck,
  XCircle,
  Zap,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { buildSeo } from "@/lib/seo";
import { TemplateGallery } from "@/components/site/TemplateGallery";
import { AtsVsCreative } from "@/components/home/AtsVsCreative";
import { ThreeSteps } from "@/components/home/ThreeSteps";
import { SeoContent } from "@/components/home/SeoContent";
import { CheckItem, Eyebrow, SectionHeader } from "@/components/site/marketing";

export const Route = createFileRoute("/")({
  head: () =>
    buildSeo({
      title: "CV Pintar - Buat CV ATS Friendly dengan AI Gratis",
      description:
        "Buat CV ATS friendly Bahasa Indonesia yang rapi, kuat, dan siap kirim. Template profesional, saran AI, scoring otomatis, dan export PDF.",
      path: "/",
      keywords:
        "buat cv ats, cv pintar, template cv ats, cv generator ai, contoh cv ats, cv lolos screening, ai cv builder indonesia",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "CV Pintar",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "50000" },
        },
      ],
    }),
  component: LandingPage,
});

const proofPoints = [
  { value: "5.000+", label: "User aktif", icon: UserRoundCheck },
  { value: "10.000+", label: "CV dibuat", icon: FileText },
  { value: "92%", label: "Lolos ATS", icon: Gauge },
  { value: "4.9/5", label: "Rating pengguna", icon: Star },
] as const;

const painPoints = [
  {
    title: "Terlalu ramai",
    desc: "Tata letak berantakan membuat informasi penting tidak terlihat.",
    fix: "Template rapi dengan hierarki yang jelas.",
    icon: AlertCircle,
  },
  {
    title: "Tidak relevan",
    desc: "Pengalaman dan skill tidak sesuai dengan posisi yang dilamar.",
    fix: "AI menyesuaikan isi CV dengan lowongan.",
    icon: Briefcase,
  },
  {
    title: "Tidak ATS friendly",
    desc: "Banyak CV ditolak sistem ATS sebelum sampai ke tangan rekruter.",
    fix: "Format teruji agar terbaca parser ATS.",
    icon: Cpu,
  },
] as const;

const coreTools = [
  {
    icon: Search,
    title: "Analisa Score CV",
    desc: "Saran perbaikan dari AI untuk mengoptimalkan CV agar ATS-friendly.",
  },
  {
    icon: FileText,
    title: "AI Cover Letter Builder",
    desc: "Surat lamaran yang disesuaikan khusus untuk posisi yang dituju.",
  },
  {
    icon: MessageCircle,
    title: "Simulasi Interview",
    desc: "Latih wawancara dengan AI dan dapatkan feedback langsung.",
  },
  {
    icon: Briefcase,
    title: "CV Review by AI",
    desc: "Tahu bagian mana yang perlu diperbaiki dan mana yang sudah oke.",
  },
] as const;

const features = [
  {
    icon: FileText,
    title: "Template ATS Friendly",
    desc: "Desain profesional yang mudah dibaca sistem ATS.",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    desc: "Bantu tulis ringkasan, pengalaman, dan skill lebih kuat.",
  },
  {
    icon: Gauge,
    title: "Analisis CV Instan",
    desc: "Skor dan saran otomatis untuk meningkatkan peluang.",
  },
  {
    icon: Briefcase,
    title: "Tracker Lamaran",
    desc: "Pantau setiap lamaran dan statusnya di satu tempat.",
  },
  {
    icon: Key,
    title: "Keyword Optimizer",
    desc: "Rekomendasi keyword agar CV relevan dengan posisi.",
  },
  {
    icon: Download,
    title: "Export PDF & Link",
    desc: "Unduh PDF berkualitas atau bagikan link profesional.",
  },
  {
    icon: BookOpen,
    title: "Tips & Contoh CV",
    desc: "Panduan & contoh CV sesuai industri dan level karier.",
  },
  {
    icon: LockKeyhole,
    title: "Privasi Terjamin",
    desc: "Data kamu aman dan tidak dibagikan ke pihak lain.",
  },
  {
    icon: RefreshCw,
    title: "Update Berkala",
    desc: "Template selalu diperbarui mengikuti tren rekrutmen.",
  },
] as const;

const faqs = [
  {
    q: "Apakah CV Pintar gratis?",
    a: "Ya! Kamu bisa membuat dan mengunduh CV berkualitas tinggi secara gratis tanpa biaya tersembunyi.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Privasi dan keamanan data kamu adalah prioritas kami. Data CV kamu disimpan dengan enkripsi aman dan tidak akan dibagikan ke pihak ketiga.",
  },
  {
    q: "Apakah CV ini bisa lolos ATS?",
    a: "Semua template kami didesain khusus agar mudah dipindai oleh sistem ATS (Applicant Tracking System) modern, meningkatkan peluang lolos administrasi.",
  },
  {
    q: "Berapa lama proses membuat CV?",
    a: "Hanya butuh beberapa menit! Dengan bantuan AI dan antarmuka yang intuitif, kamu bisa menyelesaikan CV profesional dengan cepat.",
  },
] as const;

const testimonials = [
  {
    name: "Rina A.",
    role: "Software Engineer",
    text: "Dengan template & tips di sini, CV saya jauh lebih rapi dan lolos ke tahap interview.",
    tag: "Lolos di Syahafaza",
    img: "/mentor-female.webp",
  },
  {
    name: "Devi L.",
    role: "Marketing Specialist",
    text: "Fitur analisis CV-nya ngebantu banget. Saya jadi tahu bagian mana yang harus diperbaiki.",
    tag: "Match Score naik 40%",
    img: "/mentor-female.webp",
  },
  {
    name: "Andi P.",
    role: "Product Manager",
    text: "Praktis, modern, dan ATS-friendly. Rekomendasi buat semua pencari kerja!",
    tag: "Lolos di perusahaan impian",
    img: "/mentor-male.webp",
  },
  {
    name: "Budi S.",
    role: "Data Analyst",
    text: "Fitur benchmarking-nya keren banget. Saya jadi tahu posisi saya dibandingkan pelamar lain dan cara naikin skor ATS.",
    tag: "Lolos di Unicorn Tech",
    img: "/mentor-male.webp",
  },
  {
    name: "Citra W.",
    role: "UI/UX Designer",
    text: "Tampilan visual template-nya bersih dan rapi. Sangat nyaman dibaca rekruter manusia dan aman untuk parser ATS.",
    tag: "Lolos di Agensi Digital",
    img: "/mentor-female.webp",
  },
  {
    name: "Doni K.",
    role: "Finance Officer",
    text: "Setelah menggunakan AI Keyword Optimizer, CV saya langsung dapet tanggapan positif dalam 3 hari saja.",
    tag: "Lolos di BUMN Terkemuka",
    img: "/mentor-male.webp",
  },
] as const;

const guides = [
  {
    title: "Panduan Lengkap Buat CV ATS-Friendly",
    desc: "Langkah demi langkah membuat CV yang lolos ATS.",
    img: "/ats-cv-preview.webp",
    to: "/blog/apa-itu-cv-ats",
  },
  {
    title: "Contoh CV Fresh Graduate",
    desc: "Inspirasi CV untuk kamu yang baru lulus.",
    img: "/fresh-graduate-cv-preview.webp",
    to: "/panduan-cv-ats",
  },
  {
    title: "Tips Interview yang Meningkatkan Peluang Diterima",
    desc: "Persiapan interview biar makin percaya diri.",
    img: "/interview-tips.webp",
    to: "/tips-interview/persiapan-interview-pertama",
  },
] as const;

function ScorePreviewBar({
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
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="text-slate-300">{label}</span>
        <span className={passed ? "text-emerald-300" : "text-rose-300"}>
          {score} <span className="text-slate-400">/ {max}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${passed ? "bg-emerald-400" : "bg-rose-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- AI showcase (accessible tabs) ---------- */

const aiTabs = [
  { id: "rewrite", label: "Saran kalimat", icon: Sparkles },
  { id: "highlight", label: "Highlight & terapkan", icon: Highlighter },
  { id: "score", label: "Skor & kecocokan", icon: Gauge },
] as const;

type AiTabId = (typeof aiTabs)[number]["id"];

function RewriteMockup() {
  return (
    <div
      role="img"
      aria-label="Contoh: kalimat 'Bertanggung jawab atas berbagai tugas di departemen marketing' diubah AI menjadi 'Meningkatkan engagement kampanye digital sebesar 45% melalui strategi content marketing yang terukur'."
      className="mx-auto w-full max-w-md"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Sebelum</span>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 line-through decoration-red-400/70">
          "Bertanggung jawab atas berbagai tugas di departemen marketing"
        </p>
      </div>
      <div className="relative z-10 -my-3 flex justify-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-green-700 text-white shadow-md">
          <ArrowDown className="h-5 w-5" />
        </span>
      </div>
      <div className="rounded-2xl border-2 border-green-600 bg-white p-5 shadow-xl shadow-green-900/10">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-green-700 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Sesudah AI
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">
            <Sparkles className="h-3.5 w-3.5" /> Disarankan
          </span>
        </div>
        <p className="mt-3 text-base font-medium leading-relaxed text-gray-800">
          "Meningkatkan <mark className="rounded bg-green-100 px-1 text-green-900">engagement</mark>{" "}
          kampanye digital sebesar{" "}
          <mark className="rounded bg-green-100 px-1 text-green-900">45%</mark> melalui{" "}
          <mark className="rounded bg-green-100 px-1 text-green-900">
            strategi content marketing
          </mark>{" "}
          yang terukur"
        </p>
      </div>
    </div>
  );
}

function HighlightMockup() {
  return (
    <div
      role="img"
      aria-label="Contoh pratinjau CV: AI menandai ringkasan profil sebagai prioritas tinggi untuk diperbaiki dan pengalaman kerja sebagai prioritas sedang, lalu menyediakan tombol Terapkan Semua Saran."
      className="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-5 shadow-xl shadow-green-900/10 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-700 text-white">
            <Highlighter className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display font-bold text-gray-900">Pratinjau CV</p>
            <p className="text-xs text-gray-600">Highlight aktif</p>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
          5 saran
        </span>
      </div>

      <div className="mt-5 space-y-4 rounded-2xl bg-gray-50 p-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Ringkasan profil
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" /> Prioritas tinggi
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">
            <span className="rounded border-b-2 border-red-500 bg-red-50 px-1">
              Bertanggung jawab atas berbagai tugas marketing
            </span>{" "}
            dan membantu tim dalam berbagai proyek.
          </p>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Pengalaman kerja
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Prioritas sedang
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">
            Marketing Staff • PT Maju Bersama
            <br />
            <span className="rounded border-b-2 border-amber-500 bg-amber-50 px-1">
              Menjalankan tugas marketing sehari-hari
            </span>
          </p>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
            Keahlian
          </span>
          <div className="flex flex-wrap gap-2">
            {["Digital Marketing", "SEO", "Content Writing", "Analytics"].map((s) => (
              <span
                key={s}
                className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-900"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <span className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 text-sm font-semibold text-white">
          <Zap className="h-4 w-4" /> Terapkan Semua Saran
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-green-800">
          <Pencil className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function ScoreMockup() {
  return (
    <div
      role="img"
      aria-label="Contoh hasil analisis CV: match score 78 persen dengan status Sangat Baik. Kekuatan utama pengalaman relevan, perlu ditingkatkan ringkasan dan keyword, disarankan menambah sertifikasi dan proyek."
      className="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-5 shadow-xl shadow-green-900/10 sm:p-6"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 font-extrabold text-green-800">
            R
          </span>
          <div>
            <p className="font-display text-sm font-bold text-gray-900">Analisis CV Kamu</p>
            <p className="text-xs text-gray-600">cv-ats-final.pdf</p>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
          Sangat Baik
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl bg-green-800 p-5 text-white">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-green-100">
              Match score
            </span>
            <span className="mt-1 block font-display text-5xl font-extrabold">78%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-green-950/50">
            <div className="h-full w-[78%] rounded-full bg-yellow-300" />
          </div>
        </div>
        <ul className="space-y-3">
          {[
            {
              icon: CheckCircle2,
              color: "text-green-700",
              t: "Kekuatan utama",
              d: "Pengalaman relevan, skill sesuai.",
            },
            {
              icon: AlertCircle,
              color: "text-amber-600",
              t: "Perlu ditingkatkan",
              d: "Ringkasan profesional, keyword.",
            },
            {
              icon: XCircle,
              color: "text-red-600",
              t: "Disarankan",
              d: "Tambahkan sertifikasi & proyek.",
            },
          ].map((r) => (
            <li key={r.t} className="flex items-start gap-2.5">
              <r.icon className={`mt-0.5 h-5 w-5 shrink-0 ${r.color}`} />
              <div>
                <p className="text-sm font-bold text-gray-900">{r.t}</p>
                <p className="text-xs text-gray-600">{r.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const aiPanels: Record<
  AiTabId,
  {
    title: string;
    desc: string;
    points: { icon: typeof Target; t: string; d: string }[];
    cta: string;
    mockup: () => ReactNode;
  }
> = {
  rewrite: {
    title: "Bingung mau nulis apa di CV?",
    desc: "AI Career Assistant merekomendasikan frasa profesional yang relevan dengan posisi yang kamu lamar.",
    points: [
      {
        icon: Target,
        t: "Disesuaikan dengan posisi",
        d: "Frasa relevan dengan job title & industri tujuanmu.",
      },
      {
        icon: Zap,
        t: "ATS-friendly",
        d: "Kalimat ringkas yang mudah dipahami sistem ATS & rekruter.",
      },
      {
        icon: TrendingUp,
        t: "Lebih berdampak",
        d: "Fokus pada hasil & kontribusi dengan kata kerja aktif.",
      },
    ],
    cta: "Coba Saran AI Gratis",
    mockup: RewriteMockup,
  },
  highlight: {
    title: "AI tandai, kamu tinggal terapkan.",
    desc: "Seperti punya mentor HR yang menandai bagian CV yang perlu diubah. Satu klik, langsung berubah.",
    points: [
      {
        icon: Highlighter,
        t: "Highlight otomatis",
        d: "Bagian CV yang lemah ditandai sesuai prioritas.",
      },
      {
        icon: Sparkles,
        t: "Satu klik langsung berubah",
        d: "Tanpa copy-paste — klik Terapkan, CV langsung diperbarui.",
      },
      {
        icon: Pencil,
        t: "Edit sebelum terapkan",
        d: "Ubah saran AI sesuai kebutuhan. Kamu tetap pegang kendali.",
      },
    ],
    cta: "Coba AI Highlight",
    mockup: HighlightMockup,
  },
  score: {
    title: "Tahu seberapa cocok CV-mu dengan lowongan.",
    desc: "Dapatkan skor instan dan rekomendasi perbaikan sebelum kamu menekan tombol kirim.",
    points: [
      {
        icon: Search,
        t: "Analisis kecocokan",
        d: "Bandingkan CV dengan deskripsi lowongan yang kamu incar.",
      },
      {
        icon: Sparkles,
        t: "Rekomendasi perbaikan AI",
        d: "Saran konkret: keyword, ringkasan, dan pencapaian.",
      },
      {
        icon: TrendingUp,
        t: "Benchmark pelamar lain",
        d: "Lihat posisimu dibanding kandidat lain.",
      },
    ],
    cta: "Cek Skor CV Sekarang",
    mockup: ScoreMockup,
  },
};

function AiShowcase() {
  const [active, setActive] = useState<AiTabId>("rewrite");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = aiTabs.findIndex((t) => t.id === active);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % aiTabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + aiTabs.length) % aiTabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = aiTabs.length - 1;
    else return;
    e.preventDefault();
    setActive(aiTabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const panel = aiPanels[active];
  const Mockup = panel.mockup;

  return (
    <section
      aria-labelledby="ai-heading"
      className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white py-20 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-green-200/40 blur-3xl"
      />
      <div className="container-page relative">
        <SectionHeader
          id="ai-heading"
          eyebrow={
            <>
              <Sparkles aria-hidden="true" className="h-4 w-4" /> Didukung AI
            </>
          }
          title={
            <>
              Asisten karier yang bikin CV-mu{" "}
              <span className="text-green-700">langsung naik kelas.</span>
            </>
          }
          desc="Pilih fitur di bawah untuk melihat cara kerjanya."
        />

        <div
          role="tablist"
          aria-label="Fitur AI CV Pintar"
          onKeyDown={onKeyDown}
          className="mx-auto mb-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm sm:flex-row"
        >
          {aiTabs.map((tab, i) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`ai-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`ai-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.id)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  selected
                    ? "bg-green-700 text-white shadow"
                    : "text-gray-700 hover:bg-green-50 hover:text-green-800"
                }`}
              >
                <tab.icon aria-hidden="true" className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          id={`ai-panel-${active}`}
          role="tabpanel"
          aria-labelledby={`ai-tab-${active}`}
          tabIndex={0}
          className="mx-auto grid max-w-6xl items-center gap-12 rounded-3xl lg:grid-cols-2"
        >
          <div className="order-2 lg:order-1">
            <Mockup />
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="font-display text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
              {panel.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">{panel.desc}</p>
            <ul className="mt-8 space-y-5">
              {panel.points.map((p) => (
                <li key={p.t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                    <p.icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{p.t}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{p.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-green-700 px-7 text-base font-bold text-white shadow-lg shadow-green-700/20 hover:bg-green-800"
              >
                <Link to="/register">
                  {panel.cta}
                  <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <LockKeyhole aria-hidden="true" className="h-4 w-4" /> Gratis & privasi terjamin
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials (accessible carousel) ---------- */

function TestimonialCard({ item }: { item: (typeof testimonials)[number] }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <div className="flex gap-0.5" role="img" aria-label="Rating 5 dari 5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} aria-hidden="true" className="h-4 w-4 fill-amber-400 stroke-none" />
        ))}
      </div>
      <Quote aria-hidden="true" className="mt-5 h-8 w-8 text-green-200" />
      <blockquote className="mt-2 flex-1 text-base font-medium leading-relaxed text-gray-800">
        "{item.text}"
      </blockquote>
      <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <div className="flex items-center gap-3">
          <img
            src={item.img}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div>
            <p className="font-display font-bold text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-600">{item.role}</p>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-right text-xs font-semibold text-green-800">
          {item.tag}
        </span>
      </figcaption>
    </figure>
  );
}

function Testimonials() {
  const isMobile = useIsMobile();
  const perPage = isMobile ? 1 : 3;
  const slides = Array.from({ length: Math.ceil(testimonials.length / perPage) }, (_, i) =>
    testimonials.slice(i * perPage, i * perPage + perPage),
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [isMobile]);

  const go = (i: number) => setActive((i + slides.length) % slides.length);

  return (
    <section aria-labelledby="testi-heading" className="bg-white py-20 lg:py-28">
      <div className="container-page">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:mb-16 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Dipercaya ribuan talenta</Eyebrow>
            <h2
              id="testi-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
            >
              Melamar dengan lebih percaya diri.
            </h2>
            <p className="mt-4 flex items-center gap-2 text-base text-gray-600 sm:text-lg">
              <span className="flex" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 stroke-none" />
                ))}
              </span>
              <span>
                <strong className="text-gray-900">4.9/5</strong> dari ribuan pengguna
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Testimoni sebelumnya"
              aria-controls="testi-track"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 transition-colors hover:border-green-700 hover:text-green-800"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Testimoni berikutnya"
              aria-controls="testi-track"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white transition-colors hover:bg-green-800"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          aria-roledescription="carousel"
          aria-label="Testimoni pengguna"
          className="overflow-hidden"
        >
          <div
            id="testi-track"
            aria-live="polite"
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {slides.map((group, i) => (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} dari ${slides.length}`}
                aria-hidden={i !== active}
                inert={i !== active}
                className="grid w-full shrink-0 gap-6 px-0.5 md:grid-cols-3"
              >
                {group.map((item) => (
                  <TestimonialCard key={item.name} item={item} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Tampilkan testimoni ${i + 1}`}
              aria-current={i === active}
              className="group flex h-6 min-w-6 items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-all ${
                  i === active ? "w-6 bg-green-700" : "w-2 bg-gray-400 group-hover:bg-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

function LandingPage() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative bg-gradient-to-b from-green-50 via-white to-white pb-16 pt-10 lg:pb-24 lg:pt-16"
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
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex max-w-2xl flex-col items-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white py-1 pl-1 pr-4 text-sm font-semibold text-gray-800 shadow-sm">
                <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-gray-900">
                  Gratis
                </span>
                <Sparkles aria-hidden="true" className="h-4 w-4 text-green-700" />
                <span>
                  <strong className="text-green-800">92%</strong> pengguna lolos screening ATS
                </span>
              </span>

              <h1
                id="hero-heading"
                className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
              >
                CV yang membuat rekruter paham{" "}
                <span className="relative whitespace-normal text-green-700">
                  kenapa kamu layak dipanggil.
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                Buat CV profesional dengan bantuan AI, cek skor ATS secara instan, dan tingkatkan
                peluang lolos seleksi —{" "}
                <strong className="font-semibold text-gray-900">
                  gratis, dalam hitungan menit.
                </strong>
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-xl bg-green-700 px-8 text-base font-bold text-white shadow-lg shadow-green-700/25 transition-transform hover:-translate-y-0.5 hover:bg-green-800"
                >
                  <Link to="/register">
                    Buat CV Gratis Sekarang
                    <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-xl border-2 border-gray-300 bg-white px-8 text-base font-semibold text-gray-800 hover:border-green-700 hover:bg-green-50 hover:text-green-800"
                >
                  <Link to="/template">Lihat Template</Link>
                </Button>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-gray-700">
                {["100% gratis", "Tanpa kartu kredit", "Data aman & privat"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-green-700" />
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center gap-3 border-t border-gray-200 pt-6">
                <div className="flex -space-x-2" aria-hidden="true">
                  {[
                    "/mentor-female.webp",
                    "/mentor-male.webp",
                    "/mentor-female.webp",
                    "/mentor-male.webp",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                      decoding="async"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="flex items-center gap-1 font-bold text-gray-900">
                    <Star aria-hidden="true" className="h-4 w-4 fill-amber-400 stroke-none" /> 4.9/5
                  </span>
                  dari 10.000+ CV yang sudah dibuat
                </p>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative mx-auto w-full max-w-[520px] px-4 sm:px-8 lg:px-0">
              <div className="relative isolate">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rotate-3 rounded-[2rem] bg-green-700"
                />
                <img
                  src="/hero-professionals.webp"
                  srcSet="/hero-professionals-640.webp 640w, /hero-professionals.webp 1024w"
                  sizes="(min-width: 1024px) 520px, 90vw"
                  width={1024}
                  height={1024}
                  alt="Tiga profesional muda tersenyum setelah lolos seleksi kerja"
                  className="h-auto w-full rounded-[2rem] border-4 border-white object-cover shadow-2xl"
                  fetchPriority="high"
                />

                <div
                  aria-hidden="true"
                  className="absolute -left-4 top-6 w-48 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl animate-float sm:-left-10"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Skor ATS
                  </p>
                  <p className="mt-1 font-display text-3xl font-extrabold text-gray-900">
                    95<span className="text-base font-semibold text-gray-600">/100</span>
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[95%] rounded-full bg-green-600" />
                  </div>
                </div>

                <div
                  aria-hidden="true"
                  className="absolute -bottom-6 -right-2 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl animate-float-delayed sm:-right-8"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-800">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Peluang dipanggil
                    </p>
                    <p className="font-display text-2xl font-extrabold text-green-800">92%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proof bar */}
          <dl className="relative mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-lg md:grid-cols-4 lg:mt-20">
            {proofPoints.map((item) => (
              <div key={item.label} className="flex items-center gap-4 bg-white p-5 sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <item.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div className="flex flex-col-reverse">
                  <dt className="mt-1 text-sm font-medium text-gray-600">{item.label}</dt>
                  <dd className="font-display text-2xl font-extrabold leading-none text-gray-900">
                    {item.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Problem → solution */}
      <section aria-labelledby="why-heading" className="bg-white py-20 lg:py-28">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow>Kenapa penting?</Eyebrow>
              <h2
                id="why-heading"
                className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
              >
                CV yang bagus belum tentu terbaca.
              </h2>
              <div className="mt-8 flex items-end gap-4">
                <span className="font-display text-7xl font-extrabold leading-none text-green-700 sm:text-8xl">
                  6–10
                </span>
                <span className="pb-2 text-lg font-bold text-gray-900">
                  detik
                  <span className="block text-base font-medium text-gray-600">
                    waktu rekruter menilai CV
                  </span>
                </span>
              </div>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
                Pastikan CV kamu mudah dibaca, relevan, dan menonjol dari ribuan pelamar lainnya. CV
                Pintar membereskan tiga masalah paling umum ini untukmu.
              </p>
            </div>

            <ul className="space-y-4">
              {painPoints.map((item) => (
                <li
                  key={item.title}
                  className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg sm:grid-cols-[auto_1fr]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
                    <item.icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
                      />
                      <span>
                        <span className="sr-only">Solusi: </span>
                        {item.fix}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <ThreeSteps />

      {/* Templates */}
      <TemplateGallery />

      {/* AI showcase (merged: rewrite, highlight, score) */}
      <AiShowcase />

      {/* Features */}
      <section id="fitur" aria-labelledby="fitur-heading" className="bg-white py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="fitur-heading"
            eyebrow="Fitur unggulan"
            title="Semua alat penting, tanpa ribet."
            desc="Lengkap, mudah digunakan, dan siap bantu kamu menang di setiap tahap."
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {coreTools.map((tool) => (
              <Link
                key={tool.title}
                to="/register"
                className="group flex flex-col rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-6 transition-all hover:-translate-y-1 hover:border-green-600 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white">
                  <tool.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{tool.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{tool.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-green-800">
                  Coba sekarang
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>

          <ul className="mt-12 grid gap-x-8 gap-y-7 border-t border-gray-200 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <f.icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 text-center">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-2 border-green-700 px-7 text-base font-bold text-green-800 hover:bg-green-50 hover:text-green-900"
            >
              <Link to="/fitur">
                Lihat Semua Fitur
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ATS vs Creative */}
      <AtsVsCreative />

      {/* Testimonials */}
      <Testimonials />

      {/* Beyond CV: Tryout CPNS + Mentoring */}
      <section aria-labelledby="more-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="more-heading"
            eyebrow="Lebih dari sekadar CV"
            title="Siapkan semua tahap seleksimu di satu tempat."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tryout CPNS */}
            <article className="relative flex flex-col overflow-hidden rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"
              />
              <div className="relative flex flex-1 flex-col">
                <Eyebrow tone="dark">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Baru 2026
                </Eyebrow>
                <h3 className="mt-5 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  Tryout CPNS SKD <span className="block text-emerald-300">110 Soal Realistis</span>
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  Simulasi SKD sesuai kisi-kisi resmi BKN.{" "}
                  <strong className="text-white">30 TWK, 35 TIU, 45 TKP</strong> — dengan timer,
                  skor real-time, dan passing grade akurat.
                </p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {[
                    { icon: Clock, t: "100 menit" },
                    { icon: FileText, t: "110 soal" },
                    { icon: Zap, t: "Skor instan" },
                  ].map((c) => (
                    <li
                      key={c.t}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100"
                    >
                      <c.icon aria-hidden="true" className="h-4 w-4 text-emerald-300" /> {c.t}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <Trophy aria-hidden="true" className="h-4 w-4 text-emerald-300" /> Contoh
                      hasil
                    </p>
                    <p className="text-sm font-bold">
                      405 <span className="font-medium text-slate-400">/ 550</span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <ScorePreviewBar label="TWK" score={75} max={150} passing={65} />
                    <ScorePreviewBar label="TIU" score={120} max={175} passing={80} />
                    <ScorePreviewBar label="TKP" score={210} max={225} passing={166} />
                  </div>
                  <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Lulus passing grade
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-xl bg-emerald-400 px-7 text-base font-bold text-slate-950 hover:bg-emerald-300"
                  >
                    <Link to="/tryout-cpns">
                      Mulai Tryout
                      <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl border-slate-600 bg-transparent px-7 text-base text-slate-100 hover:bg-slate-800 hover:text-white"
                  >
                    <Link to="/tryout-cpns">Info Lengkap & Harga</Link>
                  </Button>
                </div>
              </div>
            </article>

            {/* Private Mentoring */}
            <article className="relative flex flex-col overflow-hidden rounded-3xl bg-green-950 text-white">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src="/private-mentoring.webp"
                  alt=""
                  width={1000}
                  height={1000}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-950/30 to-transparent"
                />
                <span className="absolute left-6 top-6 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900">
                  Segera hadir
                </span>
              </div>
              <div className="flex flex-1 flex-col p-7 pt-2 sm:p-10 sm:pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-green-300">
                  Minta bantuan mentor
                </span>
                <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  Bimbingan Private 1-on-1 dengan Mentor Expert.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-green-100">
                  Bingung cara menulis CV atau mempersiapkan interview? Dapatkan review langsung dan
                  simulasi wawancara dari praktisi industri berpengalaman.
                </p>
                <ul className="mt-6 space-y-3 text-sm sm:text-base">
                  {[
                    "Review CV mendalam baris-demi-baris oleh praktisi.",
                    "Mock interview (simulasi wawancara) & feedback instan.",
                    "Konsultasi strategi karir & tips negosiasi gaji.",
                    "Pilihan jadwal fleksibel sesuai dengan kebutuhanmu.",
                  ].map((b) => (
                    <CheckItem key={b} tone="dark">
                      {b}
                    </CheckItem>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Button
                    size="lg"
                    disabled
                    className="h-12 cursor-not-allowed rounded-xl bg-yellow-300 px-8 text-base font-extrabold text-gray-900 opacity-70 shadow-lg blur-[0.5px]"
                  >
                    Segera Hadir
                  </Button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Guides */}
      <section aria-labelledby="guide-heading" className="bg-white py-20 lg:py-28">
        <div className="container-page">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Panduan & contoh</Eyebrow>
              <h2
                id="guide-heading"
                className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
              >
                Rapi untuk sistem, tetap enak dilihat manusia.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
                Akses panduan, tips karier, dan contoh nyata untuk setiap tahap perjalanan kariermu.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 shrink-0 rounded-xl border-2 border-green-700 px-6 text-base font-bold text-green-800 hover:bg-green-50 hover:text-green-900"
            >
              <Link to="/panduan-cv-ats">
                Lihat Semua Artikel
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((item) => (
              <Link
                key={item.title}
                to={item.to as any}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={item.img}
                    alt=""
                    width={800}
                    height={800}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-lg font-bold leading-snug text-gray-900 group-hover:text-green-800">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-green-800">
                    Baca selengkapnya
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <SeoContent />

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Title and Mascot side-by-side */}
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-start text-left max-w-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50/80 text-green-700 uppercase tracking-wider">
                  PERTANYAAN UMUM
                </span>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Pertanyaan cepat sebelum mulai.
                </h2>
              </div>
              <div className="relative max-w-[280px] lg:translate-y-4 shrink-0">
                <img
                  src="/avatar-pointing.webp"
                  width={600}
                  height={600}
                  alt="3D Mascot pointing up"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* Right Column: Accordion & Button */}
            <div className="lg:col-span-5 flex flex-col">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.q}
                    value={`faq-${index}`}
                    className="border border-gray-100 rounded-xl px-5 py-2 bg-white shadow-sm"
                  >
                    <AccordionTrigger className="text-left font-bold text-gray-800 text-sm hover:no-underline hover:text-green-700">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs md:text-sm leading-relaxed text-gray-500 pt-2 border-t border-gray-50 mt-2">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <Button
                asChild
                size="lg"
                className="mt-8 h-11 px-6 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md shadow-md text-sm w-fit flex items-center gap-2"
              >
                <Link to="/panduan-cv-ats">
                  Lihat Semua FAQ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="container-page pb-24">
        <div className="rounded-3xl bg-green-700 px-8 py-12 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Decorative background element */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-green-600/30 blur-2xl" />

          {/* Left Content */}
          <div className="relative z-10 flex-1 max-w-2xl text-left">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Siap tingkatkan peluangmu? Buat CV terbaikmu sekarang.
            </h2>

            {/* Checklist */}
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm font-semibold text-green-50">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">✓</span>
                Gratis selamanya
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">✓</span>
                Mudah & cepat
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">✓</span>
                ATS Friendly
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">✓</span>
                Dipercaya 10.000+ pengguna
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="mt-10 h-12 px-8 bg-yellow-300 hover:bg-yellow-400 text-gray-950 font-extrabold rounded-lg shadow-lg text-base"
            >
              <Link to="/register">
                Buat CV Gratis Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right Image & Floating Isometric 3D badges */}
          <div className="relative z-10 w-full max-w-[280px] lg:max-w-[340px] flex justify-center lg:justify-end">
            <div className="relative w-full">
              <img
                src="/avatar-laptop.webp"
                width={700}
                height={700}
                alt="3D Avatar with laptop celebrating success"
                className="w-full h-auto drop-shadow-2xl"
                loading="lazy"
                decoding="async"
              />

              {/* Left Floating Badge: Checkmark */}
              <div className="absolute -left-4 top-[35%] bg-white text-green-600 rounded-full p-2 shadow-lg border border-green-50 animate-float flex items-center justify-center">
                <div className="bg-green-100/80 rounded-full p-1">
                  <CheckCircle2 className="h-5 w-5 fill-green-600 text-white animate-pulse" />
                </div>
              </div>

              {/* Right Floating Badge 1: Message / Lines */}
              <div className="absolute -right-4 top-[20%] bg-white rounded-xl p-2.5 shadow-lg border border-gray-100 flex flex-col gap-1 w-12 animate-float-delayed items-start">
                <div className="h-1.5 w-7 rounded bg-green-500" />
                <div className="h-1.5 w-5 rounded bg-gray-200" />
                <div className="h-1.5 w-6 rounded bg-gray-200" />
              </div>

              {/* Right Floating Badge 2: Graph / Chart */}
              <div className="absolute -right-6 bottom-[25%] bg-white rounded-xl p-3 shadow-lg border border-gray-100 flex flex-col gap-2 w-14 animate-float items-center">
                <div className="flex items-end gap-1 h-7">
                  <div className="w-1.5 h-3 bg-gray-200 rounded-sm" />
                  <div className="w-1.5 h-6 bg-green-500 rounded-sm" />
                  <div className="w-1.5 h-4 bg-green-600 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
