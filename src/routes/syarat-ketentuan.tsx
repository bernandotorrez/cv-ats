import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileCheck,
  User,
  Shield,
  CreditCard,
  Scale,
  AlertTriangle,
  BookOpen,
  Mail,
  Clock,
  Ban,
  RefreshCw,
} from "lucide-react";

const sections = [
  {
    icon: FileCheck,
    title: "Penggunaan Layanan",
    content: (
      <>
        <p>
          CV ATS Indonesia adalah tools untuk membantu kamu membuat CV
          personal. Simpel, jujur, dan sesuai peruntukannya.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: FileCheck,
              label: "Yang boleh",
              variant: "allow" as const,
              items: [
                "Membuat CV untuk dirimu sendiri.",
                "Pakai AI untuk perbaikan tata bahasa dan struktur.",
                "Download CV dalam format ATS-friendly.",
              ],
            },
            {
              icon: Ban,
              label: "Yang tidak boleh",
              variant: "deny" as const,
              items: [
                "Membuat CV palsu atau konten menyesatkan.",
                "Menyalahgunakan AI untuk plagiarisme atau penipuan.",
                "Mengunggah konten yang melanggar hukum Indonesia.",
              ],
            },
          ].map((group) => (
            <Card
              key={group.label}
              className="border bg-card"
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      group.variant === "allow"
                        ? "bg-primary-soft text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <group.icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold">{group.label}</h4>
                </div>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm">
                      <span
                        className={`mt-0.5 shrink-0 text-[11px] font-bold ${
                          group.variant === "allow"
                            ? "text-primary"
                            : "text-destructive"
                        }`}
                      >
                        {group.variant === "allow" ? "✓" : "✗"}
                      </span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: User,
    title: "Akun & Keamanan",
    content: (
      <>
        <p>Akunmu adalah pintu ke seluruh layanan. Jaga baik-baik.</p>
        <ul className="mt-3 space-y-2">
          {[
            "Kamu bertanggung jawab penuh atas semua aktivitas di akunmu.",
            "OTP login dikirim ke email — jangan dibagikan ke siapa pun.",
            "Kalau ada aktivitas mencurigakan, laporkan segera ke halo@cvats.id.",
            "Kami berhak menangguhkan akun yang melanggar ketentuan ini.",
          ].map((item) => (
            <li key={item} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                →
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    icon: CreditCard,
    title: "Pembayaran & Refund",
    content: (
      <>
        <p>Kami percaya kamu harus bisa coba dulu sebelum komitmen.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              label: "7 Hari Refund",
              desc: "Full refund, no questions asked, dalam 7 hari pertama setelah pembayaran.",
            },
            {
              icon: RefreshCw,
              label: "Cancel Kapan Saja",
              desc: "Berhenti berlangganan kapan saja. Akses tetap aktif sampai periode habis.",
            },
            {
              icon: CreditCard,
              label: "Transaksi Aman",
              desc: "Pembayaran diproses oleh partner terpercaya. Kami tidak menyimpan data kartu.",
            },
          ].map((item) => (
            <Card
              key={item.label}
              className="border bg-card text-center transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-semibold">{item.label}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: Scale,
    title: "Pembatasan Tanggung Jawab",
    content: (
      <>
        <p>
          Kami bikin tools terbaik. Tapi tetap ada hal yang di luar kendali
          kami — dan kami ingin jujur soal itu.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: AlertTriangle,
              label: "Yang tidak kami jamin",
              items: [
                "Kamu diterima di posisi atau perusahaan tertentu.",
                "CV kamu 100% bebas dari kesalahan AI.",
                "Layanan selalu tersedia tanpa gangguan.",
              ],
            },
            {
              icon: Shield,
              label: "Yang kami jamin",
              items: [
                "Tools dibangun dengan standar industri.",
                "Data kamu aman dan terenkripsi.",
                "Support yang beneran responsif.",
              ],
            },
          ].map((group) => (
            <Card key={group.label} className="border bg-card">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <group.icon className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-semibold">{group.label}</h4>
                </div>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0 text-[10px]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Layanan disediakan &ldquo;as-is&rdquo;. Kami terus meningkatkan
          kualitas, tapi kamu paham bahwa hasil akhir lamaran tetap
          tergantung banyak faktor di luar tools ini.
        </p>
      </>
    ),
  },
];

export const Route = createFileRoute("/syarat-ketentuan")({
  head: () =>
    buildSeo({
      title: "Syarat & Ketentuan — CV ATS Indonesia",
      description: "Ketentuan penggunaan layanan CV ATS Indonesia.",
      path: "/syarat-ketentuan",
    }),
  component: SyaratKetentuanPage,
});

function SyaratKetentuanPage() {
  return (
    <>
      <PageHero
        eyebrow="Syarat & Ketentuan"
        title="Aturan mainnya simpel. Biar kita sama-sama nyaman."
        description="Bukan dokumen hukum 20 halaman yang bikin mata berkunang. Kami jelasin dengan bahasa yang kamu ngerti — poin per poin."
      />

      <article className="container-page max-w-3xl py-12 md:py-16">
        <p className="text-sm text-muted-foreground">
          Terakhir diperbarui: 1 Mei 2026
        </p>

        <p className="mt-4 leading-relaxed">
          Dengan menggunakan CV ATS Indonesia, kamu menyetujui ketentuan di
          bawah ini. Kalau ada yang kurang sreg, drop email — kami terbuka
          buat diskusi.
        </p>

        <div className="mt-10 space-y-14">
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

        {/* ── Penutup ── */}
        <div className="mt-16 rounded-xl border bg-muted/30 p-6 text-center sm:p-8">
          <Badge variant="secondary" className="mb-3">
            Ada Pertanyaan?
          </Badge>
          <p className="text-lg leading-relaxed">
            Syarat & ketentuan ini bisa berubah sewaktu-waktu. Tapi kami
            janji: selalu kasih tahu kamu dulu sebelum perubahan berlaku.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Kirim email kapan aja. Kami baca semua. Beneran.
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
