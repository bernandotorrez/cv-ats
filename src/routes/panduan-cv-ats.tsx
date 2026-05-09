import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  FileText,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  Clock,
  Award,
  AlertTriangle,
  Lightbulb,
  Zap,
  BookOpen,
  Download,
  Shield,
  Star,
  ChevronRight,
  Users,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Wrench,
  FileBadge,
  Search,
  FileCheck,
} from "lucide-react";

export const Route = createFileRoute("/panduan-cv-ats")({
  head: () =>
    buildSeo({
      title: "Panduan Lengkap Membuat CV ATS Friendly 2026",
      description:
        "Pelajari cara membuat CV ATS friendly Bahasa Indonesia: format, struktur, keyword, kesalahan umum, dan contoh praktis dari rekruter Indonesia.",
      path: "/panduan-cv-ats",
      type: "article",
      keywords: "cara buat cv ats, panduan cv ats indonesia, format cv ats, contoh cv ats friendly",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Panduan Lengkap Membuat CV ATS Friendly 2026",
        inLanguage: "id-ID",
        author: { "@type": "Organization", name: "CV ATS Indonesia" },
      },
    }),
  component: PanduanPage,
});

function PanduanPage() {
  return (
    <>
      <PageHero
        eyebrow="Panduan"
        title="Cara membuat CV ATS friendly"
        description="Panduan lengkap berdasarkan praktik rekruter Indonesia & sistem ATS yang umum dipakai."
      />
      
      <div className="container-page py-12 space-y-12">
        {/* Section 1: Apa itu ATS */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Apa itu ATS?</h2>
              <p className="text-muted-foreground">Kenalan dulu dengan sistem yang menentukan nasib CV-mu</p>
            </div>
          </div>
          
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 mt-1">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Applicant Tracking System</h3>
                      <p className="text-sm text-muted-foreground">
                        Perangkat lunak yang dipakai perusahaan untuk mengelola & menyaring ribuan lamaran kerja.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 mt-1">
                      <Search className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Cara Kerjanya</h3>
                      <p className="text-sm text-muted-foreground">
                        ATS membaca CV-mu, mengekstrak informasi penting, lalu mencocokkan dengan kebutuhan lowongan.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Fakta Penting</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-red-100 dark:bg-red-900/30">
                        <div className="h-full w-[75%] rounded-full bg-red-500" />
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CV dengan format salah langsung tersaring sebelum HR melihatnya
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Prinsip Dasar */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">6 Prinsip Dasar CV ATS Friendly</h2>
              <p className="text-muted-foreground">Ikuti aturan emas ini agar CV-mu lolos screening</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: FileText, title: "Single Column", desc: "Hindari layout 2 kolom atau tabel rumit" },
              { icon: Type, title: "Font Standar", desc: "Inter, Arial, Calibri, atau Times New Roman" },
              { icon: ImageIcon, title: "Tanpa Grafik", desc: "Jangan pakai foto, ikon, atau header/footer visual" },
              { icon: FileBadge, title: "Section Jelas", desc: "Gunakan heading: Ringkasan, Pengalaman, Pendidikan, Skill" },
              { icon: Download, title: "Format PDF", desc: "Simpan sebagai PDF text-based, bukan hasil scan" },
              { icon: Search, title: "Keyword Matching", desc: "Sertakan keyword dari job description secara natural" },
            ].map((item, i) => (
              <Card key={i} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <item.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 3: Struktur CV */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Struktur CV yang Direkomendasikan</h2>
              <p className="text-muted-foreground">Susun CV-mu dengan urutan yang tepat</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-blue-500 to-green-500 hidden md:block" />
                
                <div className="space-y-6">
                  {[
                    { num: "01", icon: User, title: "Header / Data Diri", items: ["Nama lengkap & foto profesional", "Posisi target yang jelas", "Kota, nomor HP, email aktif", "Link LinkedIn (jika ada)"], color: "bg-primary" },
                    { num: "02", icon: Target, title: "Ringkasan Profesional", items: ["2-3 kalimat saja", "Tonjolkan kekuatan utama", "Sebutkan target karier", "Gunakan keyword posisi"], color: "bg-blue-500" },
                    { num: "03", icon: Briefcase, title: "Pengalaman Kerja", items: ["Urutan dari yang terbaru", "Gunakan action verb kuat", "Cantumkan angka & impact", "Fokus pada achievement"], color: "bg-purple-500" },
                    { num: "04", icon: GraduationCap, title: "Pendidikan", items: ["Institusi & jurusan", "Tahun masuk - lulus", "IPK (jika > 3.0)", "Honors/summa jika ada"], color: "bg-pink-500" },
                    { num: "05", icon: Wrench, title: "Skill", items: ["Technical skills (tools)", "Soft skills (komunikasi)", "Bahasa yang dikuasai", "Sesuaikan dengan lowongan"], color: "bg-orange-500" },
                    { num: "06", icon: Award, title: "Sertifikasi / Organisasi", items: ["Sertifikat profesional", "Proyek yang relevan", "Organisasi & hobi", "Voluntary work"], color: "bg-green-500" },
                  ].map((item, i) => (
                    <div key={i} className="relative flex gap-4 md:gap-6">
                      <div className="hidden md:flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-white font-bold text-sm z-10`}>
                          {item.num}
                        </div>
                      </div>
                      <Card className="flex-1">
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`md:hidden w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white font-bold text-xs`}>
                              {item.num}
                            </div>
                            <div className="p-2 rounded-lg bg-muted">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                          </div>
                          <ul className="grid md:grid-cols-2 gap-2">
                            {item.items.map((subItem, j) => (
                              <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ChevronRight className="w-4 h-4 text-primary" />
                                {subItem}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 4: Kesalahan Umum */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Kesalahan Fatal yang Harus Dihindari</h2>
              <p className="text-muted-foreground">Ini yang paling sering dilakukan kandidat — dan bikin CV langsung tolak</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Template Word Berbasis Tabel", desc: "Tabel, grafik, dan layout kreatif tidak bisa dibaca ATS", icon: AlertTriangle },
              { title: "Paragraf Panjang Tanpa Bullet", desc: "HR hanya scan 6 detik — pakai poin-poin singkat", icon: AlertTriangle },
              { title: "Info Tidak Relevan", desc: "Hapus: golongan darah, tinggi badan, agama, status", icon: AlertTriangle },
              { title: "CV Lebih dari 2 Halaman", desc: "Idealnya 1 halaman untuk <5 tahun pengalaman", icon: AlertTriangle },
              { title: "Tidak Pakai Keyword", desc: "CV tidak cocok dengan kata kunci di job description", icon: AlertTriangle },
              { title: "Format Salah", desc: "Kirim sebagai .docx, .pages, atau hasil scan PDF", icon: AlertTriangle },
            ].map((item, i) => (
              <Card key={i} className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                <CardContent className="p-4 flex gap-4">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 h-fit">
                    <item.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-400">{item.title}</h3>
                    <p className="text-sm text-red-700/70 dark:text-red-400/70">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 5: Tips Bonus */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Lightbulb className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Tips Bonus dari Rekruter Indonesia</h2>
              <p className="text-muted-foreground">Insight langsung dari praktisi HRD</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Clock, title: "Durasi Review", stat: "6 Detik", desc: "Begitu lama HR scan CV-mu. Buat setiap detik worth it." },
              { icon: TrendingUp, title: "Keyword Density", stat: "5-10%", desc: "Keyword harus muncul natural, jangan di-spam." },
              { icon: Users, title: "Ats Score Target", stat: ">75%", desc: "Skor minimal agar lolos tahap pertama screening." },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-amber-500/10 w-fit mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">{item.stat}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 6: CTA */}
        <section className="space-y-6">
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-blue-600 border-0 text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="p-4 rounded-full bg-white/20 w-fit mx-auto mb-6">
                <Sparkles className="w-12 h-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Buatkan CV ATS-mu Sekarang!
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Tak perlu repot-edit manual. AI kami otomatis menyarankan keyword, mengoreksi struktur, dan memberi skor ATS sebelum kamu kirim lamaran.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/cv" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                >
                  <Zap className="w-5 h-5" />
                  Buat CV dengan AI
                </a>
                <a 
                  href="/template" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  Lihat Templates
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 7: Quick Checklist */}
        <section className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-primary" />
                Checklist Sebelum Kirim Lamaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Format PDF text-based",
                  "Single column layout",
                  "Font standar (Arial/Inter)",
                  "Tanpa foto/grafik/tabel",
                  "Keyword dari job description",
                  "Maksimal 1-2 halaman",
                  "Action verb di pengalaman",
                  "Angka & achievement ada",
                  "Email & no HP aktif",
                  "LinkedIn profile ada",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

// Need to add these icon imports
function User(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function Type(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" x2="15" y1="20" y2="20" />
      <line x1="12" x2="12" y1="4" y2="20" />
    </svg>
  );
}

function ImageIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
