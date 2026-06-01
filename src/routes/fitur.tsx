import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Download,
  FileSearch,
  FileText,
  GitCompare,
  Languages,
  LockKeyhole,
  Mic,
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

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
  { icon: Users, stat: "5.000+", label: "pengguna aktif" },
  { icon: FileText, stat: "10.000+", label: "CV dibuat" },
  { icon: TrendingUp, stat: "92%", label: "skor ATS rata-rata" },
  { icon: Star, stat: "4.9/5", label: "rating pengguna" },
] as const;

const featureGroups = [
  {
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
        badge: "Starter",
        isNew: true,
      },
      {
        icon: UserRoundCheck,
        name: "Review CV by HR Expert AI",
        desc: "Analisis mendalam dari perspektif HR profesional 20+ tahun, lengkap dengan quick wins.",
        badge: "Starter",
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
    title: "Siapkan lamaran berikutnya",
    desc: "Setelah CV siap, lanjutkan ke tracking, interview, dan iterasi yang lebih terarah.",
    items: [
      {
        icon: Briefcase,
        name: "Pelacak Lamaran",
        desc: "Simpan posisi, perusahaan, status, catatan, dan next step dalam satu dashboard.",
        badge: "Baru",
      },
      {
        icon: Mic,
        name: "Simulasi Wawancara AI",
        desc: "Latihan interview dengan pertanyaan, jawaban, dan feedback instan.",
        badge: "Pro",
      },
      {
        icon: GitCompare,
        name: "Bandingkan Versi",
        desc: "Bandingkan dua versi CV untuk melihat mana yang lebih kuat sebelum dikirim.",
      },
      {
        icon: Share2,
        name: "Share Link Publik",
        desc: "Bagikan CV lewat link read-only dan nonaktifkan kapan saja.",
      },
      {
        icon: ShieldCheck,
        name: "Privasi Dijaga",
        desc: "Data CV tetap milik kamu, aksesnya dibatasi, dan tidak dijual ke pihak ketiga.",
      },
    ],
  },
] as const;

const workflow = [
  ["01", "Buat", "Pilih template ATS dan susun struktur CV yang bersih."],
  ["02", "Perkuat", "AI bantu menulis isi yang konkret, ringkas, dan relevan."],
  ["03", "Cek", "Scoring dan review membantu menemukan bagian yang masih lemah."],
  ["04", "Kirim", "Export PDF, lacak lamaran, lalu siapkan interview berikutnya."],
] as const;

function FiturPage() {
  return (
    <>
      <section className="overflow-x-clip bg-background">
        <div className="container-page grid min-w-0 gap-12 py-14 md:grid-cols-[1fr_0.95fr] md:items-center md:py-20 lg:py-24">
          <div className="min-w-0">
            <Badge className="gap-1.5 bg-info text-info-foreground hover:bg-info">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Fitur lengkap untuk CV yang siap bersaing
            </Badge>
            <h1 className="mt-5 max-w-3xl break-words font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Semua yang kamu butuhkan sebelum klik kirim.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              CV Pintar menggabungkan template ATS, AI bilingual, scoring, review HR, dan tools
              lamaran kerja dalam satu alur yang sederhana. Tidak ramai. Tidak membingungkan.
              Langsung membantu.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full px-6 text-base sm:w-auto">
                <Link to="/register">
                  Mulai gratis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full px-6 text-base sm:w-auto"
              >
                <Link to="/template">Lihat template</Link>
              </Button>
            </div>
          </div>

          <FeaturePreview />
        </div>
      </section>

      <section aria-label="Bukti performa" className="border-y border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-px py-4 sm:grid-cols-4">
          {proof.map((item) => (
            <div key={item.label} className="px-3 py-5 text-center">
              <item.icon className="mx-auto h-5 w-5 text-primary" aria-hidden />
              <div className="mt-3 font-display text-2xl font-bold text-primary md:text-3xl">
                {item.stat}
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground md:text-sm">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <SectionIntro
          eyebrow="Alur kerja"
          title="Dari CV kosong ke lamaran yang lebih siap."
          desc="Setiap fitur ditempatkan di alur yang natural, supaya kamu tahu harus melakukan apa berikutnya."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {workflow.map(([step, title, desc]) => (
            <div key={step} className="rounded-lg border border-border bg-card p-6">
              <p className="font-display text-sm font-bold text-primary">{step}</p>
              <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Fitur"
            title="Powerful, tapi tetap ringan dipakai."
            desc="Fokus pada fitur yang benar-benar membantu pencari kerja: struktur, relevansi, bukti, dan kesiapan interview."
          />

          <div className="mt-12 space-y-14">
            {featureGroups.map((group) => (
              <section key={group.title}>
                <div className="grid gap-3 lg:grid-cols-[0.35fr_0.65fr] lg:items-end">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                      {group.title}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                      {group.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <Card key={item.name} className="rounded-lg border-border bg-card shadow-none">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <item.icon className="h-5 w-5" aria-hidden />
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            {"isNew" in item && item.isNew && (
                              <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                                New
                              </Badge>
                            )}
                            {item.badge && (
                              <Badge className="bg-info text-info-foreground hover:bg-info">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h3 className="mt-5 font-display text-lg font-semibold">{item.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 rounded-lg border border-border bg-card p-6 md:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge variant="secondary">AI + HR</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Bukan cuma bikin CV. Kamu tahu kenapa CV itu lebih kuat.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Saran AI membantu menulis lebih cepat. Scoring dan review HR membantu mengambil
              keputusan: bagian mana yang perlu dipotong, diperjelas, atau diberi angka.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Saran bilingual Indonesia dan Inggris",
                "Keyword berdasarkan job description",
                "Feedback HR dengan prioritas perbaikan",
                "Preview ATS sebelum export PDF",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-background p-5">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  CV readiness
                </p>
                <h3 className="mt-1 font-display text-xl font-bold">Review summary</h3>
              </div>
              <div className="rounded-md bg-primary px-3 py-2 text-center text-primary-foreground">
                <p className="text-xs font-medium">Score</p>
                <p className="font-display text-xl font-bold">91</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Kuat", "Ringkasan profil sudah fokus pada impact."],
                ["Perlu naik", "Tambahkan metrik di pengalaman utama."],
                ["Quick win", "Masukkan keyword role target di 2 bullet."],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-16 md:pb-24">
        <div className="rounded-lg bg-primary px-6 py-12 text-center text-primary-foreground md:px-10 md:py-16">
          <LockKeyhole className="mx-auto h-8 w-8" aria-hidden />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">
            Mulai dari satu CV. Lanjutkan sampai interview.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-primary-foreground/90 md:text-base">
            Coba gratis tanpa kartu kredit. Buat CV pertama, cek skornya, lalu kirim dengan lebih
            percaya diri.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-7 text-base">
            <Link to="/register">
              Mulai gratis sekarang
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function SectionIntro({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge variant="secondary">{eyebrow}</Badge>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-muted-foreground">{desc}</p>
    </div>
  );
}

function FeaturePreview() {
  return (
    <div className="mx-auto w-full max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card p-4 shadow-xl shadow-primary/10 sm:max-w-lg">
      <div className="rounded-md border border-border bg-background p-5">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Smart toolkit
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">CV Pintar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Build, score, review, interview</p>
          </div>
          <Badge className="bg-info text-info-foreground hover:bg-info">ATS-ready</Badge>
        </div>

        <div className="mt-5 grid gap-3">
          {[
            [FileText, "Template", "Struktur rapi"],
            [Bot, "AI writing", "ID + EN"],
            [Target, "Scoring", "Keyword cocok"],
            [Mic, "Interview", "Feedback instan"],
          ].map(([Icon, title, desc]) => (
            <div
              key={title as string}
              className="flex items-center gap-3 rounded-lg bg-muted/70 p-3"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title as string}</p>
                <p className="text-xs text-muted-foreground">{desc as string}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-primary p-4 text-primary-foreground">
          <p className="text-sm font-semibold">Next best action</p>
          <p className="mt-1 text-sm leading-6 text-primary-foreground/90">
            Tambahkan angka hasil kerja di pengalaman utama sebelum export PDF.
          </p>
        </div>
      </div>
    </div>
  );
}
