import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Download,
  FileEdit,
  FileSearch,
  FileText,
  Gauge,
  Key,
  LockKeyhole,
  MessageCircle,
  Quote,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRoundCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

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
  { value: "5.000+", label: "User Aktif", icon: UserRoundCheck },
  { value: "10.000+", label: "CV Dibuat", icon: FileText },
  { value: "92%", label: "Lolos ATS", icon: Gauge },
  { value: "4.9/5", label: "Rating Pengguna", icon: Star },
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
    desc: "Pantau setiap lamaran dan statusnya dalam satu tempat.",
  },
  {
    icon: Key,
    title: "Keyword Optimizer",
    desc: "Rekomendasi keyword agar CV lebih relevan dengan posisi.",
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
    desc: "Data kamu aman dan tidak akan dibagikan ke pihak lain.",
  },
  {
    icon: RefreshCw,
    title: "Update Berkala",
    desc: "Fitur & template selalu diperbarui mengikuti tren rekrutmen.",
  },
] as const;

const steps = [
  {
    n: "1",
    title: "Pilih Template",
    desc: "Pilih desain profesional yang sesuai dengan posisi kamu.",
    icon: FileText,
  },
  {
    n: "2",
    title: "Isi & Sesuaikan",
    desc: "Tambahkan data dirimu dan sesuaikan dengan lowongan.",
    icon: FileEdit,
  },
  {
    n: "3",
    title: "Analisis & Perbaiki",
    desc: "Dapatkan skor & saran untuk meningkatkan peluang.",
    icon: Search,
  },
  {
    n: "4",
    title: "Kirim & Lacak",
    desc: "Kirim lamaran dan pantau statusnya di satu dashboard.",
    icon: CheckCircle2,
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
    img: "/mentor-female.png",
  },
  {
    name: "Devi L.",
    role: "Marketing Specialist",
    text: "Fitur analisis CV-nya ngebantu banget. Saya jadi tahu bagian mana yang harus diperbaiki.",
    tag: "Match Score naik 40%",
    img: "/mentor-female.png",
  },
  {
    name: "Andi P.",
    role: "Product Manager",
    text: "Praktis, modern, dan ATS-friendly. Rekomendasi buat semua pencari kerja!",
    tag: "Lolos di perusahaan impian",
    img: "/mentor-male.png",
  },
  {
    name: "Budi S.",
    role: "Data Analyst",
    text: "Fitur benchmarking-nya keren banget. Saya jadi tahu posisi saya dibandingkan pelamar lain dan cara naikin skor ATS.",
    tag: "Lolos di Unicorn Tech",
    img: "/mentor-male.png",
  },
  {
    name: "Citra W.",
    role: "UI/UX Designer",
    text: "Tampilan visual template-nya bersih dan rapi. Sangat nyaman dibaca rekruter manusia dan aman untuk parser ATS.",
    tag: "Lolos di Agensi Digital",
    img: "/mentor-female.png",
  },
  {
    name: "Doni K.",
    role: "Finance Officer",
    text: "Setelah menggunakan AI Keyword Optimizer, CV saya langsung dapet tanggapan positif dalam 3 hari saja.",
    tag: "Lolos di BUMN Terkemuka",
    img: "/mentor-male.png",
  },
] as const;

function LandingPage() {
  const isMobile = useIsMobile();
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = isMobile ? 6 : 2;

  useEffect(() => {
    setActiveSlide(0);
  }, [isMobile]);
  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-16 lg:pb-32 bg-gradient-to-b from-green-50/30 to-white">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left max-w-2xl">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                CV yang membuat rekruter paham{" "}
                <span className="text-green-700 block mt-2 sm:inline sm:mt-0">
                  kenapa kamu layak dipanggil.
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed">
                Buat CV profesional, rasakan performanya, dan tingkatkan peluang lolos seleksi
                dengan panduan yang terbukti berhasil.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md shadow-md text-base"
                >
                  <Link to="/register">
                    Buat CV Gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-md text-base"
                >
                  <Link to="/template">Lihat Template</Link>
                </Button>
              </div>

              {/* Bullet checks */}
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  100% Gratis
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  Data Aman
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  ATS Friendly
                </div>
              </div>
            </div>

            {/* Right Hero Image & Badges */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px]">
                <img
                  src="/hero-professionals.png"
                  alt="Tiga orang profesional muda yang sukses dan tersenyum"
                  className="w-full h-auto rounded-3xl object-cover shadow-2xl border-4 border-white"
                  fetchPriority="high"
                />

                {/* Badge 1: Peluang Dipanggil */}
                <div className="absolute -top-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 flex items-center gap-4 animate-float max-w-[220px]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Peluang Dipanggil
                    </span>
                    <span className="text-2xl font-extrabold text-green-600">92%</span>
                  </div>
                  {/* SVG Trendline */}
                  <div className="w-16 h-8 text-green-500">
                    <svg viewBox="0 0 100 40" fill="none" className="w-full h-full">
                      <path
                        d="M5 35 Q 25 15, 45 25 T 90 5"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Badge 2: ATS Score & Users */}
                <div className="absolute -bottom-6 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-float-delayed flex flex-col gap-2 max-w-[240px]">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        ATS Score
                      </span>
                      <span className="text-xl font-extrabold text-green-700">95/100</span>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      <Star className="h-3 w-3 fill-yellow-600" />
                      4.9/5
                    </div>
                  </div>
                  {/* Avatars bubbles */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <img
                        src="/mentor-female.png"
                        className="w-6 h-6 rounded-full border border-white"
                        alt="user"
                      />
                      <img
                        src="/mentor-male.png"
                        className="w-6 h-6 rounded-full border border-white"
                        alt="user"
                      />
                      <img
                        src="/mentor-female.png"
                        className="w-6 h-6 rounded-full border border-white"
                        alt="user"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">
                      10k+ pengguna sudah mencoba
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Stats Bar */}
      <section className="relative z-10 px-4 -mt-12">
        <div className="container-page">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {proofPoints.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 px-4 py-2 border-r border-gray-100 last:border-0 md:justify-center"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <item.icon className="h-6 w-6 text-green-700 fill-none" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">
                    {item.value}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kenapa Penting Section */}
      <section className="py-20 bg-white">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end border-b border-gray-100 pb-12 mb-12">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
                Kenapa Penting?
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                CV yang bagus belum tentu terbaca.
              </h2>
            </div>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
              Rekruter hanya butuh 6-10 detik untuk menilai sebuah CV. Pastikan CV kamu mudah
              dibaca, relevan, dan menonjol dari ribuan pelamar lainnya.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Terlalu Ramai",
                desc: "Tata letak berantakan membuat informasi penting tidak terlihat.",
                icon: AlertCircle,
              },
              {
                title: "Tidak Relevan",
                desc: "Pengalaman dan skill tidak sesuai dengan posisi yang dilamar.",
                icon: Briefcase,
              },
              {
                title: "Tidak ATS Friendly",
                desc: "Banyak CV ditolak sistem ATS sebelum sampai ke tangan rekruter.",
                icon: Cpu,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur Unggulan Section */}
      <section id="fitur" className="py-20 bg-green-50/20 border-y border-green-100/40">
        <div className="container-page">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
              Fitur Unggulan
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Semua alat penting, tanpa ribet.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600">
              Lengkap, mudah digunakan, dan siap bantu kamu menang di setiap tahap.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-none transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-lg font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Berbasis Data Section */}
      <section className="py-20 bg-white">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Column */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
                Berbasis Data
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Jangan kirim CV yang sama ke semua lowongan.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                Gunakan data & analisis untuk menyesuaikan CV dengan setiap posisi. Hasilnya?
                Peluang dipanggil naik hingga 3x lipat!
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Analisis kesesuaian CV dengan lowongan",
                  "Rekomendasi perbaikan berkala AI",
                  "Benchmark dibanding pelamar lain",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                size="lg"
                className="mt-8 h-12 px-8 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md shadow-md text-base"
              >
                <Link to="/register">
                  Coba Gratis Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right Column: CV Analysis Mockup Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 font-extrabold">
                    R
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-gray-900">
                      Analisis CV Kamu
                    </h3>
                    <p className="text-xs text-gray-400">cv-ats-final.pdf</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                  Sangat Baik
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-green-700 p-6 text-white flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-green-100 uppercase tracking-wider block mb-2">
                      Match Score
                    </span>
                    <span className="text-5xl font-extrabold block">78%</span>
                  </div>
                  <p className="text-xs text-green-50 mt-4 leading-relaxed">
                    CV kamu sudah kuat! Tingkatkan beberapa bagian untuk hasil maksimal.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Kekuatan Utama</h4>
                      <p className="text-[11px] text-gray-500">Pengalaman relevan, skill sesuai.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Perlu Ditingkatkan</h4>
                      <p className="text-[11px] text-gray-500">Ringkasan profesional, keyword.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Disarankan</h4>
                      <p className="text-[11px] text-gray-500">Tambahkan sertifikasi & proyek.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Yellow Box */}
              <div className="mt-6 rounded-xl bg-yellow-50 border border-yellow-100 p-4 flex gap-3">
                <Star className="h-5 w-5 text-yellow-600 shrink-0 fill-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-900 leading-relaxed">
                  <strong>Tips:</strong> Sesuaikan ringkasan & keyword dengan deskripsi pekerjaan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-green-50/20">
        <div className="container-page">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
              Dipercaya Ribuan Talenta
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Dipakai untuk melamar dengan lebih percaya diri.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600">
              Bergabunglah dengan ribuan pengguna yang berhasil lolos seleksi impian.
            </p>
          </div>

          <div className="overflow-hidden w-full mt-10">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {isMobile ? (
                // On mobile: 1 card per slide (full width)
                testimonials.map((item) => (
                  <div key={item.name} className="w-full shrink-0 px-4">
                    <Card className="rounded-2xl border border-gray-100 bg-white p-6 shadow-none flex flex-col justify-between min-h-[260px]">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.img}
                              className="w-10 h-10 rounded-full object-cover"
                              alt={item.name}
                            />
                            <div>
                              <h3 className="font-display text-sm font-bold text-gray-900">
                                {item.name}
                              </h3>
                              <p className="text-xs text-gray-400">{item.role}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 text-yellow-500">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={index} className="h-3 w-3 fill-yellow-500 stroke-none" />
                            ))}
                          </div>
                        </div>
                        <Quote className="h-8 w-8 text-green-100 block mb-3" />
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                          "{item.text}"
                        </p>
                      </CardContent>
                      <div className="mt-6 border-t border-gray-50 pt-4 flex">
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-100/50">
                          {item.tag}
                        </span>
                      </div>
                    </Card>
                  </div>
                ))
              ) : (
                // On desktop: 2 groups of 3 cards each (full width grids)
                <>
                  <div className="w-full shrink-0 grid gap-6 md:grid-cols-3 px-1">
                    {testimonials.slice(0, 3).map((item) => (
                      <Card
                        key={item.name}
                        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-none flex flex-col justify-between min-h-[260px]"
                      >
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.img}
                                className="w-10 h-10 rounded-full object-cover"
                                alt={item.name}
                              />
                              <div>
                                <h3 className="font-display text-sm font-bold text-gray-900">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-gray-400">{item.role}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5 text-yellow-500">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star key={index} className="h-3 w-3 fill-yellow-500 stroke-none" />
                              ))}
                            </div>
                          </div>
                          <Quote className="h-8 w-8 text-green-100 block mb-3" />
                          <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            "{item.text}"
                          </p>
                        </CardContent>
                        <div className="mt-6 border-t border-gray-50 pt-4 flex">
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-100/50">
                            {item.tag}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="w-full shrink-0 grid gap-6 md:grid-cols-3 px-1">
                    {testimonials.slice(3, 6).map((item) => (
                      <Card
                        key={item.name}
                        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-none flex flex-col justify-between min-h-[260px]"
                      >
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.img}
                                className="w-10 h-10 rounded-full object-cover"
                                alt={item.name}
                              />
                              <div>
                                <h3 className="font-display text-sm font-bold text-gray-900">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-gray-400">{item.role}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5 text-yellow-500">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star key={index} className="h-3 w-3 fill-yellow-500 stroke-none" />
                              ))}
                            </div>
                          </div>
                          <Quote className="h-8 w-8 text-green-100 block mb-3" />
                          <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            "{item.text}"
                          </p>
                        </CardContent>
                        <div className="mt-6 border-t border-gray-50 pt-4 flex">
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-100/50">
                            {item.tag}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Indicators Dots */}
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  activeSlide === index
                    ? "w-6 h-2 bg-green-700"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section className="py-20 bg-white">
        <div className="container-page">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
              Cara Kerja
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              4 Langkah mudah bikin CV siap dilirik rekruter.
            </h2>
          </div>

          <div className="relative">
            {/* SVG Connecting lines for large screens */}
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 -z-10">
              <svg
                className="w-full h-8 text-green-200"
                viewBox="0 0 800 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 6"
              >
                <path d="M 0 10 Q 200 20, 400 10 T 800 10" />
              </svg>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={step.n} className="flex flex-col items-center text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50 text-green-700 shadow-md">
                    <step.icon className="h-8 w-8" />
                    <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-white text-xs font-extrabold">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-[220px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Private Mentoring Section */}
      <section className="py-20 bg-green-950 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-green-900/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-green-800/20 blur-3xl pointer-events-none" />

        <div className="container-page relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-900 text-green-300 uppercase tracking-wider">
                MINTA BANTUAN MENTOR
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Bimbingan Private 1-on-1 dengan Mentor Expert.
              </h2>
              <p className="mt-6 text-base sm:text-lg text-green-100/80 leading-relaxed">
                Bingung cara menulis CV atau mempersiapkan interview? Dapatkan review langsung dan
                simulasi wawancara dari praktisi industri berpengalaman.
              </p>

              {/* Benefits Checklist */}
              <div className="mt-8 space-y-4 w-full">
                {[
                  "Review CV mendalam baris-demi-baris oleh praktisi.",
                  "Mock interview (simulasi wawancara) & feedback instan.",
                  "Konsultasi strategi karir & tips negosiasi gaji.",
                  "Pilihan jadwal fleksibel sesuai dengan kebutuhanmu.",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900 text-green-300 text-sm shrink-0 font-bold">
                      ✓
                    </span>
                    <span className="text-sm sm:text-base text-green-50 font-medium">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                size="lg"
                className="mt-10 h-12 px-8 bg-yellow-300 hover:bg-yellow-400 text-gray-950 font-extrabold rounded-lg shadow-lg text-base"
              >
                <Link to="/private-coaching">
                  Daftar Private Mentoring Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right Visual Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative max-w-[380px] w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-green-800/40">
                <img
                  src="/private-mentoring.png"
                  alt="Private Mentoring Session"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Panduan & Contoh Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-start">
            {/* Left Info Column */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
                Panduan & Contoh
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Rapi untuk sistem, Tetap enak dilihat manusia.
              </h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Akses panduan, tips karir, dan contoh nyata untuk setiap tahap perjalanan kariermu.
              </p>

              <Button
                asChild
                size="lg"
                className="mt-8 h-12 px-8 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md shadow-md text-base"
              >
                <Link to="/panduan-cv-ats">
                  Lihat Semua Artikel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right Guide Cards Column */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Panduan Lengkap Buat CV ATS-Friendly",
                  desc: "Langkah demi langkah membuat CV yang lolos ATS.",
                  img: "/ats-cv-preview.png",
                },
                {
                  title: "Contoh CV Fresh Graduate",
                  desc: "Inspirasi CV untuk kamu yang baru lulus.",
                  img: "/fresh-graduate-cv-preview.png",
                },
                {
                  title: "Tips Interview yang Meningkatkan Peluang Diterima",
                  desc: "Persiapan interview biar makin percaya diri.",
                  img: "/interview-tips.png",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-none transition-all duration-300 hover:shadow-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 flex flex-col justify-between h-[200px]">
                    <div>
                      <h3 className="font-display text-sm font-bold text-gray-900 leading-snug group-hover:text-green-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.desc}</p>
                    </div>
                    <Link
                      to="/panduan-cv-ats"
                      className="text-xs font-bold text-green-700 hover:text-green-800 flex items-center gap-1 self-start mt-4"
                    >
                      Baca Selengkapnya
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                  src="/avatar-pointing.png"
                  alt="3D Mascot pointing up"
                  className="w-full h-auto object-contain"
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
                Mudah & cepat
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
                src="/avatar-laptop.png"
                alt="3D Avatar with laptop celebrating success"
                className="w-full h-auto drop-shadow-2xl"
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
