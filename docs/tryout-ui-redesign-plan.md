# Design Plan — Redesign UI/UX Halaman Tryout CPNS (Tahap 2)

Tanggal: 7 November 2026
Lingkup: halaman tryout yang belum ikut desain baru (tahap 1 = halaman ujian & hasil).

| Halaman | Route | Status sebelumnya |
|---|---|---|
| Dashboard tryout | `/tryout` | Desain lama |
| Detail set | `/tryout/$examId` | Hanya teks aturan yang diubah |
| Beli paket | `/tryout/beli` | Desain lama |
| Leaderboard | `/tryout/leaderboard` | Hanya baris "Posisi kamu" |
| Landing publik | `/tryout-cpns` | Desain marketing lama + beberapa klaim tidak akurat |
| Skeleton loading | semua halaman tryout | Kotak abu-abu generik, tidak mirip komponen asli |

---

## 1. Masalah yang ditemukan (audit UX)

1. **Gaya tidak seragam.** Kartu kredit memakai tema hitam–amber (zinc/orange), sementara halaman ujian & hasil memakai tema hijau CV Pintar. Badge, radius, dan tipografi berbeda-beda.
2. **Dashboard tidak menjawab "apa langkah saya berikutnya?"** Tidak ada ringkasan progres (skor terbaik, rata-rata, kelulusan), ujian yang sedang berjalan tidak menonjol, dan tombol "Lihat Detail" di setiap set disertai teks bantuan yang berulang.
3. **Kartu set tidak informatif.** Tidak menampilkan komposisi TWK/TIU/TKP, skor terbaik pada set tsb, atau aksi yang tepat (Mulai / Lanjutkan / Ulangi).
4. **Detail set berisiko:** tombol "Mulai Tryout" langsung memotong 1 kredit dan menjalankan timer tanpa konfirmasi.
5. **Leaderboard** tanpa podium/hierarki visual; posisi user tidak terlihat bila di luar daftar.
6. **Halaman beli** tidak menonjolkan perbandingan nilai (harga per tryout, hemat berapa) dan kartu paket berbeda gaya dengan landing.
7. **Landing publik memuat klaim yang tidak sesuai produk:**
   - "Mulai Tryout **Gratis**" — tryout butuh kredit berbayar.
   - "Kredit berlaku **12 bulan**" — kredit dari pembayaran tidak memiliki masa berlaku (`expired_at` kosong).
   - FAQ autosave menyebut localStorage + submit otomatis saat online — sekarang jawaban tersimpan ke server.
   - Fitur baru (pembahasan detail, analisis, mode latihan, laporan soal) belum disebut.
8. **Skeleton** tidak mencerminkan bentuk konten sehingga terjadi lompatan layout (CLS) ketika data masuk.

## 2. Prinsip desain

- **Satu bahasa visual** dengan halaman ujian & hasil: kartu `rounded-2xl border bg-card shadow-sm`, judul `font-display`, aksen hijau `primary`, warna subtes konsisten (TWK amber, TIU sky, TKP emerald), status lulus emerald / belum lulus amber–merah.
- **Next best action:** setiap halaman punya satu aksi utama yang jelas (lanjutkan ujian → mulai set baru → beli kredit).
- **Informasi progresif:** ringkasan dulu, detail di bawah/sekunder.
- **Mobile-first:** tombol aksi utama mudah dijangkau jempol (sticky bar di detail set), target sentuh ≥ 44 px, tidak ada scroll horizontal.
- **Aksesibel:** kontras AA, ikon dekoratif `aria-hidden`, status tidak hanya disampaikan lewat warna (ada teks), skeleton `aria-busy`.
- **Dark mode** untuk halaman aplikasi (landing tetap terang seperti halaman marketing lain).
- **Jujur:** semua teks fitur/harga sesuai perilaku sistem.

## 3. Komponen bersama (baru / dirombak)

| Komponen | Isi |
|---|---|
| `TryoutPageHeader` | Eyebrow + judul + deskripsi + slot aksi; dipakai semua halaman aplikasi tryout. |
| `SectionTitle` | Ikon + judul section + link aksi opsional. |
| `ProgressStats` | 4 tile: tryout selesai, skor terbaik, rata-rata skor, kelulusan PG (x dari y). |
| `ResumeBanner` | Banner menonjol bila ada ujian berjalan + sisa waktu + tombol Lanjutkan. |
| `ExamSetCard` | Nama, deskripsi, bar komposisi TWK/TIU/TKP, durasi, skor terbaik & jumlah percobaan di set ini, status, satu tombol aksi kontekstual. |
| `CreditBalance` | Tema hijau; sisa kredit besar, bar pemakaian, CTA beli/mulai. |
| `AttemptHistoryList` | Baris ringkas: status, nama set, tanggal, durasi, skor + 3 chip subtes (warna lulus/tidak). |
| `LeaderboardTable` | Mode `compact` (sidebar) & `full`; full = podium top-3 + daftar; avatar hanya dari host tepercaya. |
| `TryoutPackageCard` | Gaya sama dengan landing/video: nama, harga, harga per tryout, badge hemat, fitur, CTA, catatan QRIS. |
| `StartExamDialog` | Konfirmasi sebelum memotong kredit: rincian set, sisa kredit sesudahnya, catatan timer. |
| `skeletons.tsx` | Skeleton yang meniru bentuk tiap komponen di atas + skeleton halaman ujian & hasil. |

## 4. Rancangan per halaman

### `/tryout` — Dashboard
1. Header: sapaan + subjudul, aksi sekunder "Info tryout", aksi utama "Beli kredit".
2. `ResumeBanner` (hanya bila ada ujian berjalan).
3. `ProgressStats` (atau empty state "Mulai tryout pertamamu" bila belum ada riwayat).
4. Grid `ExamSetCard`.
5. Riwayat (`AttemptHistoryList`, 5 terakhir) + tautan.
6. Sidebar: `CreditBalance`, leaderboard compact top-5.

### `/tryout/$examId` — Detail set
1. Header set + chip (jumlah soal, durasi, passing grade).
2. Komposisi subtes (3 kartu berwarna, passing grade & skor maks).
3. Riwayat di set ini: skor terbaik & percobaan terakhir (bila ada).
4. Aturan & tips dengan ikon.
5. Panel aksi (sticky di mobile): status kredit + tombol Mulai/Lanjutkan → `StartExamDialog` untuk attempt baru.

### `/tryout/beli`
1. Header + trust chips (QRIS, aktif otomatis, tidak kedaluwarsa).
2. Kartu paket (`TryoutPackageCard`), paket Lengkap ditandai "Paling hemat".
3. Tabel perbandingan fitur Satuan vs Lengkap.
4. Cara pembelian 3 langkah + FAQ pembayaran singkat + bantuan WhatsApp.

### `/tryout/leaderboard`
1. Header + filter set (tabs).
2. Kartu "Posisi kamu" (peringkat, skor terbaik, total peserta).
3. Podium top-3 + daftar peringkat 4–50.
4. State terkunci → CTA Paket Lengkap.

### `/tryout-cpns` — Landing publik
1. Hero: perbaiki CTA ("Mulai Tryout" bukan "Gratis"), pesan nilai utama.
2. **Baru:** "Lihat tampilannya" — screenshot UI asli (ujian, hasil, pembahasan).
3. Fitur diperbarui (pembahasan detail, analisis & rekomendasi, mode latihan, leaderboard, autosave).
4. Paket & harga, format ujian, FAQ (fakta diperbaiki), CTA akhir.
5. JSON-LD FAQ disamakan dengan FAQ yang tampil.

## 5. Skeleton loading

Skeleton meniru struktur akhir (ukuran, radius, grid) sehingga tidak ada lompatan layout:
`ExamSetCardSkeleton`, `CreditBalanceSkeleton`, `ProgressStatsSkeleton`, `AttemptRowSkeleton`, `LeaderboardRowSkeleton`, `PodiumSkeleton`, `PackageCardSkeleton`, `ExamDetailSkeleton`, `ExamPageSkeleton` (pengganti spinner halaman ujian), `ResultPageSkeleton`.
Semua memakai `aria-busy="true"` pada wadah dan menghormati `prefers-reduced-motion` (animasi pulse dimatikan).

## 6. Security checklist (halaman ini)

- [ ] Query hanya kolom yang dibutuhkan (dashboard sebelumnya `select("*")` termasuk `answers` & `stats`).
- [ ] Data user hanya lewat RLS milik sendiri; leaderboard lewat RPC tanpa UUID.
- [ ] Avatar leaderboard: hanya URL https dari host tepercaya (Supabase Storage, Google) — cegah tracking pixel/IP leak dari URL arbitrer.
- [ ] Konfirmasi sebelum memotong kredit.
- [ ] Parameter route `examId` divalidasi format UUID sebelum query.
- [ ] Tidak ada `dangerouslySetInnerHTML` di halaman ini; deskripsi & fitur paket dirender sebagai teks.
- [ ] Harga & checkout tetap ditentukan server (`payment-create`), client hanya mengirim product key.
- [ ] Klaim marketing akurat (konsumen tidak tersesat).
