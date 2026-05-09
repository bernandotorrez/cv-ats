import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Lock,
  Eye,
  Database,
  FileText,
  Mail,
  Trash2,
  Download,
  Server,
  UserCheck,
} from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Data yang Kami Kumpulkan",
    content: (
      <>
        <p>
          Kami hanya mengumpulkan data yang benar-benar diperlukan untuk
          menjalankan layanan. Tidak lebih, tidak kurang.
        </p>
        <ul className="mt-3 space-y-2">
          {[
            { label: "Email", desc: "Untuk login dan komunikasi penting seputar akunmu." },
            { label: "Nama", desc: "Supaya kami bisa menyapa dengan personal." },
            { label: "Konten CV", desc: "Pengalaman, pendidikan, dan skill yang kamu tulis sendiri di platform." },
          ].map((item) => (
            <li key={item.label} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                ✓
              </span>
              <span>
                <strong>{item.label}</strong> — {item.desc}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Kami <strong>tidak pernah</strong> meminta KTP, SIM, nomor telepon,
          atau data sensitif lain yang tidak relevan dengan pembuatan CV.
        </p>
      </>
    ),
  },
  {
    icon: Eye,
    title: "Cara Kami Menggunakan Data",
    content: (
      <>
        <p>
          Data kamu digunakan <strong>satu tujuan saja</strong>: menjalankan
          dan meningkatkan layanan CV ATS Indonesia.
        </p>
        <ul className="mt-3 space-y-2">
          {[
            "Menyimpan dan menampilkan CV yang kamu buat di dashboard.",
            "Menjalankan fitur AI untuk saran perbaikan dan review CV.",
            "Mengelola akun dan preferensi kamu.",
            "Menganalisis tren penggunaan secara anonim untuk pengembangan produk.",
          ].map((item) => (
            <li key={item} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                →
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-semibold">
            🚫 Kami <span className="text-destructive">tidak menjual</span>,
            menyewakan, atau membagikan data kamu ke pihak ketiga.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: Lock,
    title: "Keamanan Data",
    content: (
      <>
        <p>
          Keamanan data bukan fitur tambahan — ini fondasi dari setiap fitur
          yang kami bangun.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: Shield,
              label: "Enkripsi Penuh",
              desc: "Data dienkripsi saat transit (TLS) dan saat disimpan (encryption at rest).",
            },
            {
              icon: Server,
              label: "Row Level Security",
              desc: "Akses database dibatasi per pengguna — hanya kamu yang bisa membaca datamu sendiri.",
            },
            {
              icon: Lock,
              label: "Autentikasi Aman",
              desc: "Login melalui OTP email tanpa password yang rentan bocor.",
            },
            {
              icon: UserCheck,
              label: "Akses Terbatas",
              desc: "Hanya engineer yang perlu akses untuk debugging yang bisa menyentuh sistem produksi.",
            },
          ].map((item) => (
            <Card key={item.label} className="border bg-card">
              <CardContent className="flex gap-3 p-4">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold">{item.label}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: FileText,
    title: "Hak Kamu atas Data",
    content: (
      <>
        <p>
          Data CV adalah milikmu. Kami hanya penjaganya. Kamu punya kendali
          penuh kapan saja.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Eye, label: "Akses", desc: "Lihat semua data kamu di halaman akun kapan saja." },
            { icon: Download, label: "Ekspor", desc: "Unduh seluruh data kamu dalam format yang mudah dibaca." },
            { icon: Trash2, label: "Hapus", desc: "Hapus permanen akun dan seluruh data dengan satu klik." },
          ].map((item) => (
            <Card key={item.label} className="border bg-card text-center transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-semibold">{item.label}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Atau kirim email ke{" "}
          <a
            href="mailto:halo@cvats.id"
            className="font-medium text-primary underline underline-offset-2"
          >
            halo@cvats.id
          </a>{" "}
          — kami proses maksimal 2×24 jam kerja.
        </p>
      </>
    ),
  },
];

export const Route = createFileRoute("/kebijakan-privasi")({
  head: () =>
    buildSeo({
      title: "Kebijakan Privasi — CV ATS Indonesia",
      description:
        "Bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pengguna CV ATS Indonesia.",
      path: "/kebijakan-privasi",
    }),
  component: KebijakanPrivasiPage,
});

function KebijakanPrivasiPage() {
  return (
    <>
      <PageHero
        eyebrow="Privasi"
        title="Datamu aman. Ceritamu milikmu."
        description="Kami transparan soal data yang kami kumpulkan, kenapa kami butuh, dan bagaimana kami menjaganya. Tanpa jargon hukum yang bikin pusing."
      />

      <article className="container-page max-w-3xl py-12 md:py-16">
        <p className="text-sm text-muted-foreground">
          Terakhir diperbarui: 1 Mei 2026
        </p>

        <div className="mt-10 space-y-12">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold">
                  {section.title}
                </h2>
              </div>
              <div className="ml-12 text-foreground">{section.content}</div>
            </section>
          ))}
        </div>

        {/* ── Komitmen ── */}
        <div className="mt-16 rounded-xl border bg-muted/30 p-6 text-center sm:p-8">
          <Badge variant="secondary" className="mb-3">
            Komitmen Kami
          </Badge>
          <p className="text-lg leading-relaxed">
            Privasi kamu bukan formalitas hukum buat kami — ini adalah janji.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Kalau ada yang kurang jelas, atau kamu punya pertanyaan —
            langsung aja kirim email. Kami beneran baca dan balas.
          </p>
          <a
            href="mailto:halo@cvats.id"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
          >
            <Mail className="h-4 w-4" />
            halo@cvats.id
          </a>
        </div>
      </article>
    </>
  );
}
