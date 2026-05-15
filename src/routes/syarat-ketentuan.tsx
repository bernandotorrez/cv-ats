import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Ban,
  Clock,
  CreditCard,
  FileCheck,
  Mail,
  RefreshCw,
  Scale,
  Shield,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

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

const summary = [
  "Gunakan CV Pintar untuk membuat dokumen karier yang jujur dan relevan.",
  "Jaga akun dan kode loginmu. Jangan bagikan akses ke orang lain.",
  "AI membantu memperbaiki kualitas, tapi keputusan akhir tetap ada padamu.",
];

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
];

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
    label: "Transfer manual",
    desc: "Pembayaran saat ini dilakukan lewat transfer rekening. Nomor rekening diberikan lewat WhatsApp sebelum transfer, lalu upgrade diproses setelah bukti transfer diverifikasi.",
  },
];

const liabilityCards = [
  {
    icon: AlertTriangle,
    title: "Yang tidak bisa kami jamin",
    items: [
      "Diterima kerja di posisi atau perusahaan tertentu.",
      "Setiap saran AI selalu sempurna tanpa perlu ditinjau ulang.",
      "Layanan bebas gangguan setiap saat.",
    ],
  },
  {
    icon: Shield,
    title: "Yang kami upayakan",
    items: [
      "Produk yang berguna, aman, dan terus diperbaiki.",
      "Data pengguna diproses dengan standar keamanan yang wajar.",
      "Support yang responsif dan manusiawi.",
    ],
  },
];

function SyaratKetentuanPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary-soft/70 to-transparent" />
        <div className="container-page relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:py-24">
          <div className="max-w-3xl">
            <Badge className="mb-5 gap-2 rounded-full px-3 py-1.5">
              <Scale className="h-3.5 w-3.5" />
              Syarat & Ketentuan
            </Badge>
            <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Aturan main yang jelas, supaya pengalamanmu tetap nyaman.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Dokumen ini menjelaskan cara menggunakan CV Pintar dengan aman, adil, dan bertanggung
              jawab. Kami buat ringkas tanpa mengurangi hal penting.
            </p>
            <p className="mt-5 text-sm font-medium text-muted-foreground">
              Terakhir diperbarui: 1 Mei 2026
            </p>
          </div>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">Versi singkatnya</h2>
              <div className="mt-4 space-y-3">
                {summary.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <article className="container-page py-14 sm:py-16">
        <div className="space-y-6">
          <TermsSection
            icon={FileCheck}
            number="01"
            title="Penggunaan layanan"
            description="CV Pintar membantu kamu membuat dokumen karier yang lebih rapi, relevan, dan mudah dipahami."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {usageGroups.map((group) => (
                <Card key={group.label} className="border-border/80 bg-background">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          group.tone === "positive"
                            ? "flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary"
                            : "flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                        }
                      >
                        <group.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-lg font-semibold">{group.label}</h3>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6">
                          <span
                            className={
                              group.tone === "positive"
                                ? "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
                            }
                          />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TermsSection>

          <TermsSection
            icon={User}
            number="02"
            title="Akun dan keamanan"
            description="Akunmu adalah pintu ke CV, review, dan fitur berbayar. Jaga aksesnya baik-baik."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {accountRules.map((rule) => (
                <div
                  key={rule}
                  className="flex gap-3 rounded-xl border border-border/70 bg-background p-4 text-sm leading-6"
                >
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{rule}</span>
                </div>
              ))}
            </div>
          </TermsSection>

          <TermsSection
            icon={CreditCard}
            number="03"
            title="Pembayaran dan refund"
            description="Saat ini pembayaran upgrade dilakukan manual. Minta nomor rekening lewat WhatsApp, transfer, lalu admin memverifikasi bukti transfer."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {paymentRules.map((item) => (
                <Card key={item.label} className="border-border/80 bg-background">
                  <CardContent className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TermsSection>

          <TermsSection
            icon={Scale}
            number="04"
            title="Batas tanggung jawab"
            description="Kami membangun alat bantu karier. Hasil akhir proses rekrutmen tetap dipengaruhi banyak faktor di luar aplikasi."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {liabilityCards.map((card) => (
                <Card key={card.title} className="border-border/80 bg-background">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-lg font-semibold">{card.title}</h3>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {card.items.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-5 rounded-xl border border-border/70 bg-background p-4 text-sm leading-6 text-muted-foreground">
              Layanan disediakan sebagaimana adanya. Kami terus meningkatkan kualitas, tetapi kamu
              tetap perlu meninjau hasil akhir sebelum dipakai untuk melamar kerja.
            </p>
          </TermsSection>

          <section className="rounded-2xl border border-border bg-card p-5 text-center sm:p-8">
            <Badge variant="secondary" className="rounded-full">
              Ada pertanyaan?
            </Badge>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-2xl font-bold sm:text-3xl">
              Kalau ada yang kurang jelas, kami bantu jelaskan tanpa bahasa rumit.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Ketentuan ini dapat diperbarui dari waktu ke waktu. Jika ada perubahan penting, kami
              akan mengomunikasikannya lewat kanal yang tersedia.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="rounded-lg">
                <a href="mailto:cs@cvpintar.web.id">
                  <Mail className="mr-2 h-4 w-4" />
                  cs@cvpintar.web.id
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-lg">
                <Link to="/kebijakan-privasi">
                  Baca kebijakan privasi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}

function TermsSection({
  icon: Icon,
  number,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <Badge variant="secondary" className="rounded-full">
            {number}
          </Badge>
          <h2 className="mt-3 font-display text-2xl font-bold">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
