import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  Download,
  Eye,
  FileText,
  Lock,
  Mail,
  Server,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/kebijakan-privasi")({
  head: () =>
    buildSeo({
      title: "Kebijakan Privasi - CV Pintar",
      description:
        "Bagaimana CV Pintar mengumpulkan, menggunakan, melindungi, dan menghormati data pengguna.",
      path: "/kebijakan-privasi",
    }),
  component: KebijakanPrivasiPage,
});

const privacyPrinciples = [
  "Kami hanya mengumpulkan data yang diperlukan untuk menjalankan layanan.",
  "Data CV tetap milik kamu. Kami tidak menjual atau menyewakannya.",
  "Kamu bisa meminta akses, ekspor, koreksi, atau penghapusan data.",
];

const dataTypes = [
  {
    label: "Email dan nama",
    desc: "Dipakai untuk login, komunikasi akun, dan pengalaman produk yang lebih personal.",
  },
  {
    label: "Konten CV",
    desc: "Pengalaman kerja, pendidikan, skill, dan informasi yang kamu tulis sendiri di platform.",
  },
  {
    label: "Aktivitas layanan",
    desc: "Data teknis seperti fitur yang dipakai untuk membantu kami memperbaiki produk secara anonim.",
  },
];

const usageItems = [
  "Menyimpan dan menampilkan CV di dashboard kamu.",
  "Menjalankan fitur AI untuk saran penulisan, review CV, dan simulasi wawancara.",
  "Mengelola akun, langganan, dukungan pelanggan, dan keamanan layanan.",
  "Menganalisis pola penggunaan secara agregat untuk meningkatkan kualitas produk.",
];

const securityItems = [
  {
    icon: Shield,
    label: "Enkripsi",
    desc: "Data dilindungi saat transit dan saat disimpan dengan praktik keamanan modern.",
  },
  {
    icon: Server,
    label: "Akses terbatas",
    desc: "Akses internal dibatasi hanya untuk kebutuhan operasional yang sah.",
  },
  {
    icon: Lock,
    label: "Login aman",
    desc: "Autentikasi dirancang untuk mengurangi risiko akses tidak sah.",
  },
  {
    icon: UserCheck,
    label: "Kontrol pengguna",
    desc: "Kamu tetap punya kendali atas data dan akunmu.",
  },
];

const rights = [
  {
    icon: Eye,
    label: "Akses",
    desc: "Minta salinan data yang terkait dengan akunmu.",
  },
  {
    icon: Download,
    label: "Ekspor",
    desc: "Unduh data penting dalam format yang mudah dibaca.",
  },
  {
    icon: Trash2,
    label: "Hapus",
    desc: "Ajukan penghapusan akun dan data yang tidak lagi dibutuhkan.",
  },
];

function KebijakanPrivasiPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary-soft/70 to-transparent" />
        <div className="container-page relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:py-24">
          <div className="max-w-3xl">
            <Badge className="mb-5 gap-2 rounded-full px-3 py-1.5">
              <Shield className="h-3.5 w-3.5" />
              Kebijakan Privasi
            </Badge>
            <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Datamu aman. Cerita kariermu tetap milikmu.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Kami menulis kebijakan ini dengan bahasa yang jelas: data apa yang kami pakai, kenapa
              dibutuhkan, dan bagaimana kami menjaganya.
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
              <h2 className="mt-5 font-display text-xl font-semibold">Prinsip singkat kami</h2>
              <div className="mt-4 space-y-3">
                {privacyPrinciples.map((item) => (
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
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-border/80 bg-card">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground">Isi kebijakan</p>
                <nav className="mt-4 grid gap-2 text-sm">
                  {[
                    "Data yang dikumpulkan",
                    "Cara penggunaan",
                    "Keamanan data",
                    "Hak pengguna",
                    "Kontak privasi",
                  ].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                      className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item}
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-6">
            <PolicySection
              id="data-yang-dikumpulkan"
              icon={Database}
              eyebrow="01"
              title="Data yang kami kumpulkan"
              description="Kami tidak meminta data sensitif yang tidak relevan dengan pembuatan CV dan layanan karier."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {dataTypes.map((item) => (
                  <Card key={item.label} className="border-border/80 bg-background">
                    <CardContent className="p-4">
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </PolicySection>

            <PolicySection
              id="cara-penggunaan"
              icon={Eye}
              eyebrow="02"
              title="Cara kami menggunakan data"
              description="Tujuan utamanya sederhana: membuat layanan bekerja, lebih aman, dan lebih bermanfaat untukmu."
            >
              <div className="space-y-3">
                {usageItems.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-xl border border-border/70 bg-background p-4 text-sm leading-6"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-primary/20 bg-primary-soft/50 p-4 text-sm font-semibold text-foreground">
                Kami tidak menjual, menyewakan, atau memperdagangkan data CV kamu kepada pihak
                ketiga.
              </div>
            </PolicySection>

            <PolicySection
              id="keamanan-data"
              icon={Lock}
              eyebrow="03"
              title="Keamanan data"
              description="Keamanan bukan tempelan. Ini bagian dari cara kami membangun produk."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {securityItems.map((item) => (
                  <Card key={item.label} className="border-border/80 bg-background">
                    <CardContent className="flex gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </PolicySection>

            <PolicySection
              id="hak-pengguna"
              icon={FileText}
              eyebrow="04"
              title="Hak kamu atas data"
              description="Kamu bisa meminta akses, ekspor, koreksi, atau penghapusan data lewat email support."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {rights.map((right) => (
                  <Card key={right.label} className="border-border/80 bg-background">
                    <CardContent className="p-4">
                      <right.icon className="h-5 w-5 text-primary" />
                      <p className="mt-4 font-semibold text-foreground">{right.label}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{right.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </PolicySection>

            <section
              id="kontak-privasi"
              className="rounded-2xl border border-border bg-card p-5 text-center sm:p-8"
            >
              <Badge variant="secondary" className="rounded-full">
                Kontak privasi
              </Badge>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-2xl font-bold sm:text-3xl">
                Ada pertanyaan soal data? Kami bantu jawab dengan jelas.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Kirim email ke tim kami. Untuk permintaan akses atau penghapusan data, kami akan
                memproses maksimal 2x24 jam kerja setelah verifikasi akun.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild className="rounded-lg">
                  <a href="mailto:mail.bernand@gmail.com">
                    <Mail className="mr-2 h-4 w-4" />
                    mail.bernand@gmail.com
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-lg">
                  <Link to="/kontak">
                    Halaman kontak
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}

function PolicySection({
  id,
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <Badge variant="secondary" className="rounded-full">
            {eyebrow}
          </Badge>
          <h2 className="mt-3 font-display text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
