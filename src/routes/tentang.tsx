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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

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
      "CV Pintar tidak berhenti di dokumen. Kami juga membantu review HR, simulasi wawancara, dan private coaching.",
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
    <>
      <section className="overflow-hidden bg-background">
        <div className="container-page grid gap-10 py-14 md:grid-cols-[1.03fr_0.97fr] md:items-center md:py-20 lg:py-24">
          <div>
            <Badge className="gap-1.5 bg-info text-info-foreground hover:bg-info">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Tentang CV Pintar
            </Badge>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Kami ingin CV bagus tidak cuma dimiliki orang yang sudah tahu caranya.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              CV Pintar dibuat untuk membantu pencari kerja Indonesia menulis CV yang rapi, relevan,
              lolos ATS, dan lebih mudah dipahami rekruter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/register">
                  Buat CV Gratis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/private-coaching">Lihat Private Coaching</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-xl shadow-primary/10">
            <div className="rounded-md bg-background p-5">
              <div className="flex items-center gap-4 border-b border-border pb-5">
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <FileText className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Our belief
                  </p>
                  <h2 className="font-display text-xl font-bold">CV adalah pintu pertama.</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Jelas", "Rekruter cepat paham kamu melamar sebagai apa."],
                  ["Relevan", "Isi CV nyambung dengan role dan industri target."],
                  ["Terukur", "Pencapaian punya bukti, angka, atau konteks."],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-lg border border-border p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Dampak CV Pintar" className="border-y border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-px py-4 sm:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="px-3 py-5 text-center">
              <item.icon className="mx-auto h-5 w-5 text-primary" aria-hidden />
              <div className="mt-3 font-display text-2xl font-bold text-primary md:text-3xl">
                {item.value}
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground md:text-sm">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Badge variant="secondary">Misi Kami</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Membuat proses apply terasa lebih adil, jelas, dan bisa dikerjakan.
            </h2>
          </div>
          <p className="text-base leading-8 text-muted-foreground">
            Kami percaya kesempatan kerja yang lebih baik dimulai dari dokumen pertama yang benar.
            CV bukan tempat untuk menebak-nebak. CV harus membantu kamu menjelaskan pengalaman
            dengan struktur yang rapi, bahasa yang kuat, dan bukti yang mudah dipindai.
          </p>
        </div>
      </section>

      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Cerita Kami"
            title="Dari masalah yang sering terlihat, jadi produk yang bisa dipakai."
            desc="Kami membangun CV Pintar dari pola yang sama: kandidat layak sering kalah bukan karena kurang mampu, tapi karena CV-nya tidak menyampaikan nilai dengan jelas."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {storyParagraphs.map((item, index) => (
              <article key={item.title} className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="outline">{item.label}</Badge>
                  <span className="font-display text-sm font-bold text-primary">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <SectionIntro
          eyebrow="Yang Bikin Kami Beda"
          title="Teknologi yang membantu, bukan membuat proses makin ramai."
          desc="Kami memilih fitur yang benar-benar dekat dengan kebutuhan pelamar: menulis lebih baik, mengukur kesiapan, dan berlatih sebelum kesempatan datang."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => (
            <Card key={value.title} className="rounded-lg border-border bg-card shadow-none">
              <CardContent className="p-6">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                  <value.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-card py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge variant="secondary">Komitmen</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Kami ingin kamu merasa lebih siap, bukan lebih bingung.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Setiap fitur yang kami bangun harus punya satu tujuan: membantu kamu mengambil langkah
              berikutnya dengan lebih percaya diri.
            </p>
          </div>

          <div className="grid gap-3">
            {promises.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-6 rounded-lg border border-border bg-card p-6 shadow-sm md:p-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Badge className="bg-info text-info-foreground hover:bg-info">Next step</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Dari CV rapi ke strategi apply yang lebih kuat.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Setelah CV dibuat, kamu bisa lanjut ke scoring, review HR, simulasi wawancara, atau
              private coaching bersama HR Recruiter.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [BriefcaseBusiness, "Private Coaching", "Bimbingan 1-on-1 dengan HR Recruiter."],
              [FileCheck, "Review CV", "Analisis mendalam dari perspektif HR."],
            ].map(([Icon, title, desc]) => (
              <div key={title as string} className="rounded-lg border border-border p-4">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{title as string}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-16 md:pb-24">
        <div className="rounded-lg bg-primary px-6 py-12 text-center text-primary-foreground md:px-10 md:py-16">
          <FileText className="mx-auto h-8 w-8" aria-hidden />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">
            Siap membuat CV yang lebih mudah dipercaya?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-primary-foreground/90 md:text-base">
            Mulai gratis, rapikan isi dengan AI, lalu cek apakah CV kamu sudah siap dikirim.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-7 text-base">
            <Link to="/register">
              Mulai sekarang
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
