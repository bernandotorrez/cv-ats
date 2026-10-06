import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Bug,
  CalendarDays,
  CheckCircle2,
  Chrome,
  CreditCard,
  Crosshair,
  FileSearch,
  FileText,
  GitBranch,
  Highlighter,
  Languages,
  LayoutDashboard,
  Mail,
  Maximize2,
  Mic,
  QrCode,
  RefreshCw,
  Rocket,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Wrench,
  Zap,
} from "lucide-react";

import { APP_VERSION } from "@/lib/app-version";
import { buildSeo } from "@/lib/seo";
import {
  CheckItem,
  CtaBanner,
  Eyebrow,
  PageHero,
  PrimaryCta,
  SecondaryCta,
  SectionHeader,
} from "@/components/site/marketing";

export const Route = createFileRoute("/changelog")({
  head: () =>
    buildSeo({
      title: "Changelog - Update CV Pintar",
      description:
        "Catatan perubahan CV Pintar: fitur baru, perbaikan bug, peningkatan performa, dan update pengalaman pengguna.",
      path: "/changelog",
      keywords: "changelog cv pintar, update aplikasi cv pintar, fitur baru cv pintar",
    }),
  component: ChangelogPage,
});

type Highlight = {
  icon: typeof FileText;
  type: string;
  text: string;
  /** Label singkat untuk kartu "Rilis terbaru" di hero. */
  short?: string;
};

type Release = {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: Highlight[];
};

const changelog: Release[] = [
  {
    version: APP_VERSION,
    date: "6 Oktober 2026",
    title: "Terjemah CV, Wawancara Suara & Latihan Negosiasi Gaji",
    summary:
      "Satu klik untuk menerjemahkan CV ke Bahasa Inggris atau Indonesia, jawab simulasi wawancara dengan suara lalu lihat analisis cara bicaramu, dan berlatih menawar gaji melawan HR virtual yang punya batas budget rahasia. Tampilan halaman Review CV, footer, dan halaman error juga disegarkan.",
    highlights: [
      {
        icon: Languages,
        type: "Fitur baru",
        short: "Terjemah CV ID ⇄ EN satu klik",
        text: "Ganti bahasa CV di editor, lalu pilih untuk menerjemahkan isinya sekalian: ringkasan, jabatan, deskripsi pekerjaan, dan bagian lainnya. Nama perusahaan, tanggal, kontak, link, serta nama tools tidak diubah. Isi CV lama dicadangkan dan terjemahan bisa dibatalkan. Tersedia di paket Starter (3x per bulan) dan Pro (15x per bulan).",
      },
      {
        icon: Mic,
        type: "Fitur baru",
        short: "Jawab wawancara dengan suara",
        text: "Simulasi wawancara punya panel rekam suara dengan timer dan transkrip langsung. Setelah sesi selesai, kartu Cara bicara menampilkan tempo bicara, kata pengisi, dan durasi jawabanmu, lengkap dengan tips perbaikan. Perlu browser Chrome atau Edge.",
      },
      {
        icon: Banknote,
        type: "Fitur baru",
        short: "Latihan negosiasi gaji",
        text: "Hadapi HR virtual yang membuka dengan tawaran di bawah harapanmu dan punya batas budget rahasia. Tawar lewat ketikan atau suara; di akhir kamu melihat berapa banyak yang berhasil didapat, batas budget HR yang sebenarnya, taktik yang berhasil, dan kalimat yang bisa lebih kuat. Fitur Pro.",
      },
      {
        icon: FileSearch,
        type: "Peningkatan",
        short: "Review CV lebih mudah",
        text: "Halaman Review CV kini bisa langsung memilih dari CV yang sudah kamu buat, lengkap dengan skor review terakhir tiap CV. Hasil review menampilkan ringkasan skor, verdict HR, langkah berikutnya, dan daftar saran yang bisa diterapkan satu per satu.",
      },
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Halaman CV Saya, footer, dan halaman error (404 dan 500) dirancang ulang dengan tampilan yang sama dengan dashboard. Halaman yang tidak ditemukan kini menawarkan jalan pintas ke halaman yang kamu cari.",
      },
      {
        icon: FileText,
        type: "Perbaikan",
        short: "PDF lebih rapi & bisa disalin",
        text: "Teks di PDF kini bisa diblok, disalin, dan dibaca sistem ATS. Kata yang saling menimpa sudah hilang, dan pada CV dua halaman atau lebih, baris teks tidak lagi terpotong di pergantian halaman, termasuk di template dua kolom.",
      },
      {
        icon: RefreshCw,
        type: "Perbaikan",
        text: "Me-refresh halaman yang butuh login tidak lagi melempar kamu ke halaman login, dan tombol Keluar di menu HP tidak lagi tertutup navigasi bawah.",
      },
    ],
  },
  {
    version: "v1.10.0-live",
    date: "6 Oktober 2026",
    title: "Editor CV Baru & Skor ATS yang Lebih Akurat",
    summary:
      "Halaman pembuatan CV kini tampil layar penuh dengan satu toolbar yang ringkas, preview yang otomatis pas di layar mana pun, dan skor ATS yang menilai isi CV-mu dengan lebih jujur, lengkap dengan saran perbaikan yang spesifik.",
    highlights: [
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        short: "Editor layar penuh yang lebih lega",
        text: "Editor CV kini layar penuh dengan satu toolbar ringkas: judul, status simpan, template, bahasa, dan aksi penting ada di satu baris. Ruang untuk menulis jauh lebih lega, terutama di HP.",
      },
      {
        icon: Maximize2,
        type: "Fitur baru",
        short: "Preview otomatis pas di layar",
        text: 'Mode zoom "Pas" menyesuaikan preview A4 dengan lebar layar, jadi CV langsung terlihat utuh tanpa perlu digeser ke samping, bahkan di HP.',
      },
      {
        icon: BarChart3,
        type: "Peningkatan",
        short: "Skor ATS lebih akurat & jujur",
        text: "Skor ATS cepat kini dinilai dari isi CV: kata kerja aksi di setiap bullet, pencapaian yang terukur dengan angka, dan skill yang benar-benar terbukti di pengalaman. Skor bisa berbeda dari sebelumnya, dan itu normal karena penilaiannya kini lebih ketat.",
      },
      {
        icon: Target,
        type: "Peningkatan",
        text: 'Saran perbaikan jadi konkret, misalnya "23 dari 32 bullet belum ada angka" atau "pangkas skill ke ±20 yang paling relevan", sehingga kamu tahu persis bagian mana yang perlu diperbaiki.',
      },
      {
        icon: Crosshair,
        type: "Peningkatan",
        text: "Kolom Target Posisi pindah ke atas panel isi CV dan kini tersedia juga di HP, karena dipakai untuk menghitung relevansi dan keyword.",
      },
      {
        icon: Smartphone,
        type: "Peningkatan",
        text: "Di HP dan tablet, editor memakai tab Isi CV, Preview, dan Skor, dengan skor ATS yang selalu terlihat di tab bawah.",
      },
      {
        icon: Wrench,
        type: "Perbaikan",
        text: 'Skor ATS tidak lagi menutupi preview CV, daftar bagian CV lebih ringkas, tombol sembunyikan panel kini benar-benar memberi fokus ke preview, dan label "1 items" kini "1 item".',
      },
    ],
  },
  {
    version: "v1.9.0-live",
    date: "6 Oktober 2026",
    title: "Payment Gateway: Upgrade Paket Kini Instan",
    summary:
      "Upgrade ke Starter atau Pro, beli add-on, dan paket Tryout CPNS sekarang bisa langsung dari CV Pintar. Cukup scan QRIS dari m-banking atau e-wallet, dan paketmu aktif otomatis begitu pembayaran terkonfirmasi. Tanpa kirim bukti transfer, tanpa menunggu verifikasi manual.",
    highlights: [
      {
        icon: CreditCard,
        type: "Fitur baru",
        short: "Checkout langsung di CV Pintar",
        text: "Checkout langsung di CV Pintar untuk paket Starter, Pro, add-on Upload CV & Foto Pro, serta paket Tryout CPNS. Tidak perlu lagi pindah ke halaman toko pihak ketiga.",
      },
      {
        icon: QrCode,
        type: "Fitur baru",
        short: "Bayar QRIS dari m-banking & e-wallet",
        text: "Bayar pakai QRIS dari aplikasi m-banking atau e-wallet apa pun. Satu kode, semua aplikasi pembayaran favoritmu.",
      },
      {
        icon: Zap,
        type: "Peningkatan",
        short: "Paket aktif otomatis, tanpa tunggu admin",
        text: "Aktivasi otomatis: paket atau kuota langsung masuk ke akunmu begitu pembayaran terkonfirmasi, tanpa menunggu admin.",
      },
      {
        icon: Mail,
        type: "Peningkatan",
        text: "Detail pembayaran dan bukti transaksi dikirim otomatis ke email, jadi riwayat pembelian selalu tersimpan rapi.",
      },
      {
        icon: RefreshCw,
        type: "Peningkatan",
        text: "Tab tertutup sebelum sempat bayar? Tenang, link pembayaran yang sama tetap berlaku hingga 24 jam, jadi kamu bisa lanjut tanpa membuat pesanan baru.",
      },
      {
        icon: ShieldCheck,
        type: "Keamanan",
        text: "Harga dihitung di server dan setiap notifikasi pembayaran diverifikasi tanda tangan digitalnya, sehingga transaksi aman dari manipulasi.",
      },
      {
        icon: BadgeCheck,
        type: "Subscription",
        text: "Add-on Upload CV Rp 10.000 untuk 2 bulan dan Foto Pro Rp 5.000/kuota (min. 2 kuota). Kuota Foto Pro yang dibeli tidak ikut hangus saat reset bulanan.",
      },
    ],
  },
  {
    version: "v1.8.0-live",
    date: "30 Juli 2026",
    title: "AI Smart Highlight & Apply Suggestion",
    summary:
      "Fitur baru yang memungkinkan AI menandai bagian CV yang perlu diperbaiki dengan highlight berwarna, dan pengguna bisa menerapkan saran AI dengan satu klik langsung ke CV.",
    highlights: [
      {
        icon: Highlighter,
        type: "Fitur baru",
        text: "AI Smart Highlight yang secara otomatis menandai teks di CV yang perlu diubah dengan warna sesuai prioritas (merah: tinggi, kuning: sedang, hijau: rendah).",
      },
      {
        icon: Zap,
        type: "Fitur baru",
        text: "Suggestion Editor yang memungkinkan pengguna melihat, mengedit, dan menerapkan saran AI langsung ke CV dengan satu klik.",
      },
      {
        icon: Sparkles,
        type: "Fitur baru",
        text: "Tombol 'Terapkan Semua Saran' untuk menerapkan semua rekomendasi AI sekaligus tanpa perlu satu per satu.",
      },
      {
        icon: FileText,
        type: "Peningkatan",
        text: "Integrasi highlight pada halaman CV Review HR dan ATS Scoring untuk pengalaman review yang lebih visual dan interaktif.",
      },
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Preview CV dengan overlay highlight yang menunjukkan lokasi saran perbaikan secara visual pada dokumen.",
      },
    ],
  },
  {
    version: "v1.7.0-live",
    date: "9 Juli 2026",
    title: "Penambahan Fitur Enhance Foto CV Profesional",
    summary:
      "Kini Anda dapat mengonversi foto profil biasa menjadi pas foto formal profesional dengan jas rapi dan background studio menggunakan teknologi AI.",
    highlights: [
      {
        icon: Sparkles,
        type: "Fitur baru",
        text: "Fitur AI Pro Photo yang dapat memproses foto kasual menjadi pas foto formal secara otomatis.",
      },
      {
        icon: BadgeCheck,
        type: "Subscription",
        text: "Sistem pembelian kuota Add-on Foto Pro seharga Rp 5.000 / kuota dengan sisa kuota yang langsung terlihat di editor.",
      },
      {
        icon: ShieldCheck,
        type: "Keamanan",
        text: "Penyimpanan otomatis hasil foto AI ke Supabase Storage (private bucket) demi menjamin keamanan dan keawetan berkas.",
      },
    ],
  },
  {
    version: "v1.6.0-live",
    date: "20 Juni 2026",
    title: "Fitur Upload Foto Profil (Opsional)",
    summary:
      "Kini Anda dapat mengunggah foto profil ke CV secara opsional dengan sistem penyimpanan aman (private bucket) berbasis Supabase Storage.",
    highlights: [
      {
        icon: Sparkles,
        type: "Fitur baru",
        text: "Menambahkan input upload foto profil di bagian Data Pribadi dengan validasi ukuran maks 2MB (JPG, PNG, WebP).",
      },
      {
        icon: ShieldCheck,
        type: "Keamanan",
        text: "Penyimpanan foto profil yang aman untuk menjaga privasi data pengguna.",
      },
      {
        icon: FileText,
        type: "Peningkatan",
        text: "Mengintegrasikan tampilan foto profil secara opsional dengan posisi layout yang ATS-friendly pada seluruh template CV.",
      },
    ],
  },
  {
    version: "v1.5.0-live",
    date: "15 Juni 2026",
    title: "Sign in & Sign Up dengan Google",
    summary:
      "Fitur Baru! Sign in dan Sign Up dengan Google, sekarang daftar dan login jadi lebih mudah!",
    highlights: [
      {
        icon: Chrome,
        type: "Fitur baru",
        text: "Menambahkan fitur Sign in dan Sign Up dengan Google agar pengguna bisa daftar dan login hanya dalam satu klik tanpa perlu isi form.",
      },
      {
        icon: Sparkles,
        type: "Peningkatan",
        text: "Menyederhanakan alur autentikasi sehingga pengalaman pertama memakai CV Pintar terasa lebih cepat dan nyaman.",
      },
    ],
  },
  {
    version: "v1.4.1-live",
    date: "1 Juni 2026",
    title: "Auto Tailor CV, quota Pro, dan AI Job Match Score",
    summary:
      "Update ini menghadirkan Auto Tailor CV end-to-end, quota khusus untuk paket Pro, serta alur job match dan portfolio yang lebih siap dipakai.",
    highlights: [
      {
        icon: RefreshCw,
        type: "Fitur baru",
        text: "Menambahkan Auto Tailor CV untuk Lowongan agar pengguna bisa menyesuaikan ringkasan, skill, dan bullet pengalaman berdasarkan job description tanpa mengarang data.",
      },
      {
        icon: FileSearch,
        type: "Fitur baru",
        text: "Menambahkan AI Job Match Score untuk membandingkan CV dengan lowongan kerja.",
      },
      {
        icon: BadgeCheck,
        type: "Subscription",
        text: "Menambahkan quota khusus Auto Tailor CV sebesar 30x/bulan untuk pengguna Pro.",
      },
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Menampilkan penggunaan Auto Tailor CV di dashboard agar sisa quota lebih mudah dipantau.",
      },
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Menambahkan akses Job Match di dashboard agar alur cek kecocokan CV lebih cepat.",
      },
      {
        icon: Share2,
        type: "Fitur baru",
        text: "Menambahkan Portfolio Page terpisah di /portfolio yang berisi hero profil, skill, pengalaman, pendidikan, kontak, dan preview CV.",
      },
      {
        icon: FileText,
        type: "Peningkatan",
        text: "Mempertahankan Shared CV di /share sebagai halaman khusus preview CV yang ringan, printable, dan mudah dibagikan.",
      },
      {
        icon: BadgeCheck,
        type: "Subscription",
        text: "Menambahkan kuota bulanan untuk AI Job Match Score pada tier Starter dan Pro.",
      },
      {
        icon: Wrench,
        type: "Perbaikan",
        text: "Merapikan tampilan card fitur dan menambahkan label New untuk fitur yang baru dirilis.",
      },
    ],
  },
  {
    version: "v1.3.x-live",
    date: "Mei 2026",
    title: "Lowongan pekerjaan dan penyimpanan lowongan",
    summary:
      "Rangkaian update untuk membantu pengguna menemukan, membaca, menyimpan, dan mengelola lowongan dari CV Pintar.",
    highlights: [
      {
        icon: Sparkles,
        type: "Fitur baru",
        text: "Menambahkan halaman Lowongan Pekerjaan dengan pencarian dan daftar lowongan yang lebih informatif.",
      },
      {
        icon: FileText,
        type: "Fitur baru",
        text: "Menambahkan halaman detail lowongan dengan ringkasan posisi, kualifikasi, deskripsi, dan sumber lowongan.",
      },
      {
        icon: BadgeCheck,
        type: "Fitur baru",
        text: "Menambahkan fitur simpan lowongan untuk pengguna yang sudah login.",
      },
      {
        icon: ShieldCheck,
        type: "Admin",
        text: "Menambahkan CRUD lowongan di Admin agar data lowongan bisa dikelola manual.",
      },
    ],
  },
  {
    version: "v1.2.x-live",
    date: "Mei 2026",
    title: "Peningkatan AI tools dan pengalaman mobile",
    summary:
      "Update fokus pada fitur AI lanjutan, tampilan mobile, serta stabilitas halaman authenticated.",
    highlights: [
      {
        icon: LayoutDashboard,
        type: "Peningkatan",
        text: "Menambahkan bottom navigation mobile untuk akses cepat ke Dashboard, ATS Scoring, Kelola CV, CV Review, dan Cover Letter.",
      },
      {
        icon: Sparkles,
        type: "Peningkatan",
        text: "Merapikan beberapa halaman publik agar lebih playful, informatif, dan konsisten secara visual.",
      },
      {
        icon: Bug,
        type: "Perbaikan",
        text: "Memperbaiki beberapa error navigasi, loader, dan integrasi Supabase pada halaman tertentu.",
      },
      {
        icon: Wrench,
        type: "Performa",
        text: "Mengubah beberapa tabel admin menjadi server-side pagination agar data besar tetap ringan dibuka.",
      },
    ],
  },
  {
    version: "v1.1.x-live",
    date: "April 2026",
    title: "Fondasi fitur premium dan halaman pendukung",
    summary:
      "Update awal untuk memperjelas paket, menambah halaman informatif, dan menyiapkan pengalaman pengguna yang lebih lengkap.",
    highlights: [
      {
        icon: FileText,
        type: "Fitur",
        text: "Menambahkan dan merapikan fitur CV ATS Scoring, CV Review, Cover Letter Generator, dan tools pendukung CV.",
      },
      {
        icon: BadgeCheck,
        type: "Pricing",
        text: "Merapikan tier Free, Starter, dan Pro agar benefit setiap paket lebih mudah dipahami.",
      },
      {
        icon: ShieldCheck,
        type: "Keamanan",
        text: "Menambahkan halaman legal, privacy, dan pengaturan dasar untuk informasi pengguna.",
      },
      {
        icon: GitBranch,
        type: "Maintenance",
        text: "Menambahkan versioning aplikasi di footer agar perubahan produk lebih mudah dilacak.",
      },
    ],
  },
];

/** Warna chip per jenis perubahan (kontras teks ≥ 4.5:1 di atas latar chip). */
const TYPE_STYLES: Record<string, string> = {
  "Fitur baru": "bg-green-100 text-green-800",
  Fitur: "bg-green-100 text-green-800",
  Peningkatan: "bg-sky-100 text-sky-800",
  Perbaikan: "bg-amber-100 text-amber-900",
  Keamanan: "bg-gray-900 text-white",
  Subscription: "bg-yellow-200 text-gray-900",
  Pricing: "bg-yellow-200 text-gray-900",
  Performa: "bg-violet-100 text-violet-800",
};
const DEFAULT_TYPE_STYLE = "bg-gray-100 text-gray-800";

const legend = [
  ["Fitur baru", "Kemampuan baru yang bisa langsung dipakai."],
  ["Peningkatan", "Alur, tampilan, dan pengalaman yang lebih nyaman."],
  ["Perbaikan", "Fix error, validasi, dan perilaku yang tidak sesuai."],
  ["Keamanan", "Perlindungan data dan transaksi pengguna."],
] as const;

function TypeChip({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ${TYPE_STYLES[type] ?? DEFAULT_TYPE_STYLE}`}
    >
      {type}
    </span>
  );
}

function versionAnchor(version: string) {
  return `rilis-${version.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

function ChangelogPage() {
  const latest = changelog[0];
  const totalUpdates = changelog.reduce((n, r) => n + r.highlights.length, 0);
  const newFeatures = changelog.reduce(
    (n, r) => n + r.highlights.filter((h) => h.type === "Fitur baru").length,
    0,
  );

  const stats = [
    { icon: Rocket, stat: APP_VERSION.replace("-live", ""), label: "Versi live terbaru" },
    { icon: GitBranch, stat: String(changelog.length), label: "Rilis tercatat" },
    { icon: Sparkles, stat: `${newFeatures}+`, label: "Fitur baru" },
    { icon: CheckCircle2, stat: `${totalUpdates}+`, label: "Total pembaruan" },
  ];

  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <GitBranch aria-hidden="true" className="h-4 w-4" />
            Changelog · {APP_VERSION}
          </>
        }
        title={
          <>
            Terus berkembang,{" "}
            <span className="text-green-700">supaya kamu makin dekat ke interview.</span>
          </>
        }
        desc={
          <>
            Semua fitur baru, peningkatan, dan perbaikan CV Pintar tercatat di sini.{" "}
            <strong className="font-semibold text-gray-900">
              Terbaru: editor CV yang lebih lega dan skor ATS yang lebih akurat.
            </strong>
          </>
        }
        aside={<LatestReleaseCard release={latest} />}
      >
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <PrimaryCta to="/harga">Lihat Paket & Upgrade</PrimaryCta>
          <SecondaryCta to="/fitur">Lihat Semua Fitur</SecondaryCta>
        </div>

        <nav aria-label="Lompat ke rilis" className="mt-8 w-full border-t border-gray-200 pt-6">
          <p className="text-sm font-semibold text-gray-900">Lompat ke rilis:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {changelog.slice(0, 5).map((r) => (
              <li key={r.version}>
                <a
                  href={`#${versionAnchor(r.version)}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-gray-300 bg-white px-4 font-mono text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
                >
                  {r.version.replace("-live", "")}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#riwayat-heading"
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-green-800 underline-offset-4 hover:underline"
              >
                Semua rilis
              </a>
            </li>
          </ul>
        </nav>
      </PageHero>

      {/* Stats bar */}
      <section
        aria-label="Ringkasan changelog"
        className="container-page relative z-10 -mt-6 lg:-mt-10"
      >
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-lg md:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-start gap-3 bg-white p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                <item.icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <div className="flex min-w-0 flex-col-reverse">
                <dt className="mt-1 text-sm font-medium text-gray-600">{item.label}</dt>
                <dd className="font-display text-2xl font-extrabold leading-none text-gray-900">
                  {item.stat}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Spotlight: rilis terbaru */}
      <section aria-labelledby="spotlight-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Sorotan v1.9.0
              </Eyebrow>
              <h2
                id="spotlight-heading"
                className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
              >
                Scan, bayar, langsung Pro. <span className="text-green-700">Semudah itu.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
                Dulu upgrade paket berarti pindah ke halaman lain, transfer, lalu menunggu
                konfirmasi. Sekarang semuanya selesai di CV Pintar: pilih paket, scan QRIS, dan
                fitur premium langsung terbuka saat itu juga.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  "QRIS dari m-banking atau e-wallet apa pun",
                  "Paket & kuota aktif otomatis",
                  "Bukti transaksi dikirim ke email",
                  "Link bayar berlaku hingga 24 jam",
                ].map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </ul>
              <div className="mt-10">
                <PrimaryCta to="/harga">Upgrade Sekarang</PrimaryCta>
              </div>
            </div>

            <PaymentMockup />
          </div>
        </div>
      </section>

      {/* Riwayat rilis */}
      <section aria-labelledby="riwayat-heading" className="scroll-mt-28 bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="riwayat-heading"
            eyebrow="Release notes"
            title="Riwayat rilis CV Pintar."
            desc="Ringkasan setiap update produk. Perubahan teknis kecil digabung agar tetap mudah dibaca."
          />

          <ul
            aria-label="Keterangan jenis perubahan"
            className="mx-auto -mt-4 mb-14 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {legend.map(([type, desc]) => (
              <li key={type} className="rounded-xl border border-gray-200 bg-white p-4">
                <TypeChip type={type} />
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
              </li>
            ))}
          </ul>

          <ol className="relative mx-auto max-w-5xl">
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-[1.4rem] top-2 border-l-2 border-dashed border-green-300 md:left-[11.4rem]"
            />
            {changelog.map((release, i) => (
              <li
                key={release.version}
                id={versionAnchor(release.version)}
                className="relative scroll-mt-28 pb-12 pl-12 last:pb-0 md:grid md:grid-cols-[10rem_1fr] md:gap-12 md:pl-0"
              >
                {/* Penanda versi + tanggal */}
                <div className="mb-4 md:mb-0 md:pr-5 md:pt-1 md:text-right">
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-gray-50 md:left-[10rem] md:ring-8 ${i === 0 ? "bg-green-700 text-white" : "border-2 border-green-300 bg-white text-green-800"}`}
                  >
                    {i === 0 ? <Rocket className="h-5 w-5" /> : <GitBranch className="h-4 w-4" />}
                  </span>
                  <p className="font-mono text-lg font-extrabold text-gray-900">
                    {release.version}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-600 md:justify-end">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    {release.date}
                  </p>
                </div>

                <article
                  aria-labelledby={`${versionAnchor(release.version)}-title`}
                  className={`rounded-2xl border bg-white p-5 sm:p-8 ${i === 0 ? "border-green-600 shadow-xl shadow-green-900/10" : "border-gray-200"} md:ml-8`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {i === 0 && (
                      <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-bold text-gray-900">
                        Terbaru
                      </span>
                    )}
                    <span className="text-xs font-semibold text-gray-600">
                      {release.highlights.length} pembaruan
                    </span>
                  </div>
                  <h3
                    id={`${versionAnchor(release.version)}-title`}
                    className="mt-3 font-display text-2xl font-extrabold tracking-tight text-gray-900"
                  >
                    {release.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-gray-600">{release.summary}</p>

                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {release.highlights.map((item) => (
                      <li
                        key={item.text}
                        className="flex items-start gap-3 rounded-xl bg-gray-50 p-4"
                      >
                        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800 sm:flex">
                          <item.icon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <TypeChip type={item.type} />
                          <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBanner
        title="Fitur baru terus hadir. Mulai pakai hari ini."
        desc="Buat CV pertamamu gratis, lalu upgrade kapan saja hanya dengan scan QRIS."
        cta="Mulai Gratis Sekarang"
        points={[
          "Gratis selamanya",
          "Upgrade instan via QRIS",
          "ATS Friendly",
          "Data aman & privat",
        ]}
      />
    </div>
  );
}

function LatestReleaseCard({ release }: { release: Release }) {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Rilis terbaru
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-gray-900">
              {release.version}
            </p>
            <p className="mt-1 text-sm text-gray-600">{release.date}</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-600" />
            Live
          </span>
        </div>

        <p className="mt-5 font-display text-lg font-extrabold leading-snug text-gray-900">
          {release.title}
        </p>
        <ul className="mt-4 grid gap-3">
          {release.highlights.slice(0, 3).map((item) => (
            <li key={item.text} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="line-clamp-2 text-sm font-medium text-gray-800">
                {item.short ?? item.text}
              </p>
            </li>
          ))}
        </ul>

        <a
          href={`#${versionAnchor(release.version)}`}
          className="mt-5 flex min-h-11 items-center justify-between rounded-xl bg-green-800 p-4 text-sm font-bold text-white transition-colors hover:bg-green-900"
        >
          Baca catatan lengkap
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  );
}

/** Pola QR dekoratif (bukan kode QR sungguhan). */
const QR_SIZE = 13;
const QR_CELLS = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
  const x = i % QR_SIZE;
  const y = Math.floor(i / QR_SIZE);
  const far = QR_SIZE - 4;
  // Tiga "finder" 4x4 berongga di pojok kiri atas, kanan atas, dan kiri bawah.
  if ((x < 4 || x >= far) && (y < 4 || y >= far) && !(x >= far && y >= far)) {
    const lx = x < 4 ? x : x - far;
    const ly = y < 4 ? y : y - far;
    return lx === 0 || ly === 0 || lx === 3 || ly === 3;
  }
  return (x * 7 + y * 13 + x * y) % 3 === 0;
});

function PaymentMockup() {
  return (
    <div
      role="img"
      aria-label="Ilustrasi pembayaran: paket Pro dibayar lewat QRIS, lalu status berubah menjadi pembayaran berhasil dan paket Pro langsung aktif."
      className="relative mx-auto w-full max-w-md"
    >
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-green-900/10">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Checkout</p>
            <p className="mt-1 font-display text-xl font-extrabold text-gray-900">Paket Pro</p>
            <p className="mt-1 text-sm text-gray-600">Akses 1 bulan</p>
          </div>
          <div className="rounded-2xl bg-green-800 px-4 py-2 text-center text-white">
            <p className="text-xs font-semibold text-green-100">Total</p>
            <p className="font-display text-xl font-extrabold">Rp 35rb</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-5">
          <div
            className="grid shrink-0 gap-px rounded-xl border border-gray-200 bg-white p-3"
            style={{ gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))` }}
          >
            {QR_CELLS.map((on, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-[1px] ${on ? "bg-gray-900" : "bg-white"}`}
              />
            ))}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
              <QrCode aria-hidden="true" className="h-4 w-4 text-green-700" />
              Scan QRIS
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Buka m-banking atau e-wallet, lalu scan kode ini.
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-3">
          {[
            ["Pesanan dibuat", "Link bayar berlaku 24 jam"],
            ["Pembayaran diterima", "Bukti dikirim ke email"],
          ].map(([title, desc]) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-xl border border-gray-200 p-3"
            >
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-600">{desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-xl bg-green-800 p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-yellow-300" /> Paket Pro aktif!
          </p>
          <p className="mt-1 text-sm leading-relaxed text-green-50">
            Semua fitur premium sudah bisa kamu pakai sekarang.
          </p>
        </div>
      </div>
    </div>
  );
}
