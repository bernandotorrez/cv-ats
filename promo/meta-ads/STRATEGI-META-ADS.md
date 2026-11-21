# Meta Ads: Tryout SKD CPNS (CV Pintar)

Dokumen kerja untuk menyiapkan dan menjalankan iklan Facebook/Instagram. Semua copy di bawah siap ditempel ke Ads Manager. Kreatif 4:5 ada di folder `out/`.

Satu hal dulu: tidak ada iklan yang bisa dijamin "winning" sebelum diuji. Yang bisa disiapkan di muka adalah tawaran yang jelas, beberapa angle yang berbeda, pengukuran yang benar, dan aturan kapan iklan dimatikan atau dinaikkan. Itu isi dokumen ini.

## 1. Temuan di project (baca dulu)

| Temuan | Dampak |
|---|---|
| Meta Pixel belum terpasang. Yang ada hanya Google tag dengan consent iklan ditolak (`src/routes/__root.tsx`). | Meta tidak bisa melihat siapa yang daftar atau membeli, jadi tidak bisa optimasi ke pembelian dan tidak bisa retargeting. Ini harus beres sebelum budget besar keluar. |
| CSP (`src/lib/security-headers.ts`) belum mengizinkan domain Facebook. | Pixel akan diblokir browser sampai `script-src`, `connect-src`, dan `img-src` ditambah. |
| Parameter `utm_*` dan `fbclid` hanya dibuang dari canonical URL. Di `analytics.ts` tidak ada penyimpanan UTM. | Penjualan belum bisa ditelusuri ke iklan tertentu di analytics sendiri. |
| Sejak migrasi `20261110000000_tryout_satuan_full_features.sql`, Tryout Satuan (Rp15.000) sudah termasuk pembahasan detail, latihan ulang, dan leaderboard. | Tawaran masuk jadi jauh lebih kuat: Rp15.000 dapat semua fitur. Paket Lengkap bedanya hanya harga per tryout (Rp10.000) dan pantauan kenaikan skor antar tryout. |
| Scene harga di video 90 detik masih menampilkan Satuan tanpa pembahasan dan leaderboard. Scene figural memakai ilustrasi, bukan tangkapan layar aplikasi. | Perbaiki sebelum video dipakai sebagai iklan (lihat bagian 9). |

## 2. Pengukuran yang harus ada sebelum iklan jalan

Status: kode Pixel, event, CSP, penyimpanan UTM/fbclid, dan Conversions API sudah ditulis (lihat `docs/meta-pixel.md`). Semuanya nonaktif sampai `VITE_META_PIXEL_ID` dan secret edge function diisi, migrasi diterapkan, dan fungsi di-deploy. Iklan baru boleh jalan setelah event terlihat di Test events.

Event yang dipasang (Pixel di browser, plus Conversions API dari server untuk pembelian):

| Event | Kapan ditembak | Catatan |
|---|---|---|
| `PageView` | Semua halaman | Otomatis dari base code |
| `ViewContent` | Buka `/tryout-cpns` dan `/belajar-skd/*` | Untuk audiens retargeting |
| `CompleteRegistration` | Akun baru selesai dibuat | Event optimasi tahap awal |
| `InitiateCheckout` | Klik beli paket | Event optimasi tahap menengah |
| `Purchase` | Pembayaran QRIS berhasil | Kirim `value` (15000 atau 50000), `currency: IDR`, dan `event_id` yang sama di Pixel dan CAPI supaya tidak terhitung dua kali. Tembak dari webhook pembayaran, bukan dari halaman, karena QRIS dibayar di luar situs. |

Checklist teknis:

- Verifikasi domain `cvpintar.web.id` di Business Manager dan atur prioritas event (Aggregated Event Measurement).
- Tambahkan ke CSP: `script-src https://connect.facebook.net`, `connect-src https://www.facebook.com https://*.facebook.net`, `img-src https://www.facebook.com`.
- Simpan `fbclid` dan cookie `_fbc`/`_fbp` saat daftar, supaya CAPI bisa mencocokkan pembelian dengan klik iklan.
- Putuskan kebijakan consent. Saat ini consent iklan di gtag ditolak sejak awal. Pixel perlu keputusan yang sama, dan kebijakan privasi perlu menyebut Meta Pixel.
- Simpan UTM saat kunjungan pertama dan lampirkan ke akun/order, supaya laporan penjualan bisa dipecah per iklan.

Template URL iklan (ganti bagian akhir tiap iklan):

```
https://cvpintar.web.id/tryout-cpns?utm_source=meta&utm_medium=paid_social&utm_campaign=skd_prospecting_nov26&utm_content=ad-a-harga
```

Kode `utm_content` yang dipakai: `ad-a-harga`, `ad-b-timer`, `ad-c-pembahasan`, `ad-d-passinggrade`, `ad-e-modul` (yang ini ke `/belajar-skd`), `ad-f-retarget`.

## 3. Hitungan: berapa biaya per pembelian yang masih masuk akal

Rumusnya sederhana: biaya per pembelian = biaya per klik / persentase klik yang berujung beli.

Tabel di bawah memakai angka **asumsi** untuk ilustrasi, bukan patokan. Ganti dengan angka akun sendiri setelah 3 sampai 4 hari data.

| Biaya per klik | Konversi 1% | Konversi 2% | Konversi 4% |
|---|---|---|---|
| Rp700 | Rp70.000 | Rp35.000 | Rp17.500 |
| Rp1.000 | Rp100.000 | Rp50.000 | Rp25.000 |
| Rp1.500 | Rp150.000 | Rp75.000 | Rp37.500 |

Cara membacanya:

- Harga Paket Lengkap Rp50.000. Dikurangi biaya payment gateway dan biaya lain (isi sendiri), itulah batas atas biaya per pembelian. Di titik itu iklan impas, belum untung.
- Tryout Satuan Rp15.000 hampir mustahil balik modal dari traffic dingin. Jadikan Satuan pintu masuk, bukan target ROAS.
- Karena pembeli harus daftar akun dulu, hitung juga: biaya per pendaftaran = target biaya per pembelian x persentase pendaftar yang akhirnya beli. Contoh: target Rp25.000 dan 10% pendaftar membeli, maka biaya per pendaftaran harus di bawah Rp2.500. Angka 10% hanya contoh, ukur dari data sendiri.
- Realistisnya, minggu pertama adalah fase belajar. Targetnya menemukan angle dengan biaya per pendaftaran terendah dan mengisi kolam retargeting, bukan langsung untung.

## 4. Struktur kampanye

Satu kampanye utama dan satu retargeting. Jangan pecah jadi banyak ad set, karena budget kecil akan terpecah dan tidak ada yang keluar dari fase belajar.

| Kampanye | Tujuan | Event optimasi | Budget awal (contoh) | Isi |
|---|---|---|---|---|
| 1. Prospecting | Sales | `CompleteRegistration` dulu. Pindah ke `Purchase` setelah ada sekitar 50 pembelian per minggu. | Rp100.000/hari | 1 ad set, Advantage+ audience, iklan A sampai E |
| 2. Retargeting | Sales | `Purchase` (atau `InitiateCheckout` kalau volume kecil) | Rp25.000/hari, naikkan kalau audiens cukup besar | 1 ad set, iklan F |

Sebelum Pixel live, alternatif sementara: kampanye Traffic dengan optimasi Landing Page Views, hasilnya dibaca dari analytics sendiri lewat UTM. Ini cukup untuk membandingkan angle, tapi tidak untuk membangun audiens retargeting.

Audiens kampanye 1:

- Lokasi Indonesia, bahasa Indonesia, usia saran 20 sampai 35.
- Aktifkan Advantage+ audience dan isi saran minat: CPNS, SKD, tryout CPNS, BKN, pengumuman CPNS, bimbel CPNS, lowongan kerja, fresh graduate. Saran ini hanya petunjuk awal, Meta boleh melebar.
- Kecualikan pembeli (setelah Pixel live).

Audiens kampanye 2 (kolam retargeting, jendela 14 sampai 30 hari):

- Pengunjung `/tryout-cpns` yang belum membeli.
- Pendaftar yang belum membeli.
- Penonton video minimal 50% dan yang berinteraksi dengan akun IG.

Setelah ada minimal 100 pembeli, buat Lookalike 1% dari daftar pembeli untuk ad set baru.

Placement: biarkan Advantage+ placements. Kreatif statis ini 4:5 (feed). Kalau laporan menunjukkan Stories/Reels menyedot banyak spend, buat versi 9:16 dari kreatif yang menang.

## 5. Angle dan copy

Copy di bawah memakai batas tampilan Meta: teks sebelum "Lihat selengkapnya" sekitar 125 karakter, jadi hook ada di kalimat pertama. Semua klaim diambil dari fitur yang benar-benar ada di aplikasi. Setiap iklan memuat penafian bahwa ini bukan situs resmi BKN/SSCASN.

### Iklan A: harga per tryout (`ad-a-4x5.png`)

Primary text:

```
Rp10.000 per tryout SKD. Itu harga Paket Lengkap CV Pintar: 5x tryout, Rp50.000.

Tiap tryout berisi 110 soal TWK, TIU, TKP mengikuti kisi-kisi BKN, timer 100 menit, dan pembahasan detail tiap soal. Bayar pakai QRIS, kredit langsung aktif.

Bukan situs resmi BKN/SSCASN.
```

Headline: `5x tryout SKD, Rp50.000`
Description: `Pembahasan detail + leaderboard nasional`
CTA: Pelajari Selengkapnya

Varian untuk menguji pintu masuk Rp15.000: headline `Coba 1x tryout SKD, Rp15.000`, dan ganti kalimat pertama primary text menjadi `Rp15.000 sudah dapat 1x tryout SKD lengkap, termasuk pembahasan detail dan leaderboard nasional.`

### Iklan B: timer 100 menit (`ad-b-4x5.png`)

Primary text:

```
Kenalan sama timer 100 menit jangan pas hari-H.

Di tryout CV Pintar kamu mengerjakan 110 soal TWK, TIU, TKP dengan timer yang jalan sesuai jam server. Jawaban tersimpan otomatis, jadi koneksi putus tidak membuat ujianmu hilang. Bisa di laptop maupun HP.

Bukan situs resmi BKN/SSCASN.
```

Headline: `Simulasi SKD, timer 100 menit`
Description: `110 soal sesuai kisi-kisi BKN`
CTA: Pelajari Selengkapnya

### Iklan C: pembahasan (`ad-c-4x5.png`)

Primary text:

```
Salah itu wajar. Nggak tahu kenapa salahnya, itu yang bikin skor jalan di tempat.

Setiap soal di tryout CV Pintar dibahas: konsep yang diuji, langkah penyelesaian, dan alasan tiap pilihan jawaban. Soal yang salah bisa diulang lewat mode latihan.

Bukan situs resmi BKN/SSCASN.
```

Headline: `Tahu salahmu di mana`
Description: `Pembahasan detail tiap soal`
CTA: Pelajari Selengkapnya

### Iklan D: passing grade (`ad-d-4x5.png`)

Primary text:

```
Passing grade SKD: TWK 65, TIU 80, TKP 166. Ketiganya harus terpenuhi, bukan hanya total skor.

Setelah tryout di CV Pintar kamu langsung melihat selisih skor tiap subtes terhadap passing grade, plus rekomendasi belajar per kategori. Waktu belajar dipakai untuk yang masih kurang.

Angka passing grade bisa berbeda per formasi, cek pengumuman resmi. Bukan situs resmi BKN/SSCASN.
```

Headline: `Cek jarak ke passing grade`
Description: `Hasil + rekomendasi belajar`
CTA: Pelajari Selengkapnya

### Iklan E: modul belajar gratis (`ad-e-4x5.png`, URL ke `/belajar-skd`)

Ini iklan pintu masuk gratis. Tujuannya mengisi kolam retargeting dengan biaya rendah, lalu pembacanya dikejar iklan F.

Primary text:

```
8 modul belajar SKD, gratis dan bisa dibaca tanpa login.

Isinya strategi lolos passing grade, materi TWK, trik TIU verbal, numerik, dan figural, cara memilih jawaban TKP bernilai 5, manajemen waktu 100 menit, sampai jadwal belajar 30 hari. Tiap modul ada contoh soal, pembahasan, dan trik cepat.
```

Headline: `8 modul belajar SKD, gratis`
Description: `Contoh soal + pembahasan`
CTA: Pelajari Selengkapnya

### Iklan F: retargeting (belum ada kreatif, pakai A atau C dengan copy ini)

Primary text:

```
Tryout SKD pertamamu tinggal dimulai.

Tryout Satuan Rp15.000 sudah termasuk pembahasan detail dan leaderboard nasional. Atau ambil Paket Lengkap, 5x tryout Rp50.000 (Rp10.000 per tryout). Bayar pakai QRIS.

Bukan situs resmi BKN/SSCASN.
```

Headline: `Mulai tryout SKD, Rp15.000`
CTA: Daftar

### Iklan G: figural bergambar (butuh tangkapan layar asli)

Fitur ini baru dan jarang ada di tryout lain, tapi kreatifnya harus memakai tangkapan layar soal figural dari aplikasi, bukan ilustrasi.

```
Soal figural bikin bingung? Sekarang latihannya bergambar.

TIU figural di tryout CV Pintar tampil bergambar: deret gambar, analogi gambar, dan mencari gambar yang berbeda. Kunci jawaban dihitung dari aturan gambar yang sama, jadi tidak ada kunci yang keliru.

Bukan situs resmi BKN/SSCASN.
```

## 6. Hook 3 detik pertama untuk video

Video untuk traffic dingin sebaiknya 20 sampai 25 detik, bukan 90. Susunan: hook (0 sampai 3 detik), demo layar (3 sampai 15), tawaran (15 sampai 21), ajakan (21 sampai 25). Pasang teks di layar, karena sebagian besar orang menonton tanpa suara.

1. "Timer 100 menit. 110 soal. Kamu sudah pernah coba?"
2. "Rp10.000 per tryout SKD. Ini isinya."
3. "Skor tryout harus tembus 65, 80, dan 166 di tiap subtes."
4. "Jangan kenalan sama timer SKD pas hari-H."
5. "Soal figural SKD, sekarang bisa dilatih bergambar."

Rekam layar HP saat mengerjakan tryout dengan suara narasi biasa. Rekaman yang terasa native biasanya lebih bagus untuk iklan dingin daripada motion graphic yang terlalu rapi. Video 90 detik yang sudah ada lebih cocok untuk retargeting dan konten organik.

## 7. Aturan kebijakan Meta yang perlu dijaga

- Jangan menjanjikan hasil: tidak ada "pasti lolos", "100% lulus", atau angka kelulusan yang tidak punya bukti.
- Jangan menyiratkan atribut pribadi pembaca ("kamu gagal CPNS ya?", "kamu pengangguran?"). Copy di atas membahas topik, bukan menuding orangnya.
- Jangan terlihat berafiliasi dengan pemerintah. Tidak boleh memakai logo BKN/SSCASN atau meniru tampilannya. Penafian "Bukan situs resmi BKN/SSCASN" sudah ada di kreatif dan copy, pertahankan.
- Tangkapan layar hasil (skor 412, peringkat, leaderboard) sebaiknya berisi data contoh dan diberi label "contoh tampilan", seperti di kreatif ini. Jangan menyebut jumlah peserta atau peringkat yang tidak nyata.
- Testimoni hanya boleh yang asli dan izin tertulis dari orangnya. Tidak ada testimoni di kreatif ini karena memang belum ada yang bisa dipakai. Mulai kumpulkan dari pengguna pertama.
- Passing grade bisa berbeda per formasi dan tahun. Selalu sertakan kalimat "cek pengumuman resmi".
- Tryout bukan iklan lowongan kerja, jadi kemungkinan besar tidak masuk kategori iklan khusus Employment. Kalau Meta menandainya, ajukan banding atau pilih kategorinya, dan ingat kategori itu membatasi opsi targeting.
- Pastikan halaman tujuan memuat harga dan fitur yang sama dengan yang dijanjikan iklan, dan cepat dibuka di HP.

## 8. Rencana uji 14 hari dan aturan keputusan

Angka di bawah adalah aturan awal yang masuk akal, bukan benchmark industri. Sesuaikan setelah melihat angka akun sendiri.

| Fase | Hari | Yang dilakukan |
|---|---|---|
| 1. Belajar | 1 sampai 4 | Jalankan A sampai E dalam satu ad set. Jangan ubah apa pun selama 72 jam. |
| 2. Seleksi | 5 sampai 8 | Matikan yang kalah. Buat 2 sampai 3 variasi dari angle pemenang: hook berbeda, gambar berbeda, teks pembuka berbeda. |
| 3. Perluas | 9 sampai 14 | Jalankan retargeting (F) dan video 20 detik dari angle pemenang. Mulai kumpulkan audiens Lookalike. |

Aturan keputusan:

- Beri tiap iklan waktu sampai menghabiskan sekitar 2 sampai 3 kali target biaya per pendaftaran sebelum dinilai. Menilai lebih cepat hanya mengukur noise.
- Matikan iklan yang CTR link-nya jauh di bawah rata-rata iklan lain di ad set yang sama setelah itu, atau yang biaya per pendaftarannya lebih dari dua kali iklan terbaik.
- Naikkan budget pemenang maksimal 20 sampai 30% per 48 jam. Kenaikan tajam mengembalikan iklan ke fase belajar.
- Jangan edit iklan yang sedang jalan. Duplikat lalu ubah.
- Baca juga kualitas: berapa persen pendaftar dari iklan tertentu yang benar-benar membeli. Iklan murah tapi pendaftarnya tidak pernah membeli itu bukan pemenang.

Metrik yang dicek tiap hari: spend, impresi, CTR link, biaya per klik, biaya per pendaftaran, biaya per pembelian, frekuensi (naik tinggi di retargeting artinya audiensnya habis).

## 9. Perbaikan sebelum video 90 detik dipakai sebagai iklan

1. Scene harga: ubah daftar fitur Tryout Satuan agar memuat pembahasan detail, latihan ulang, dan leaderboard nasional, sesuai migrasi terbaru.
2. Scene figural: ganti ilustrasi buatan dengan tangkapan layar soal figural dari aplikasi, atau beri label "ilustrasi".
3. Scene hasil dan leaderboard: beri label "contoh tampilan" kalau datanya bukan data pengguna nyata.

## 10. Urutan kerja yang disarankan

1. Pasang Pixel, CAPI, event, dan CSP (bagian 2). Uji dengan Events Manager.
2. Upload kreatif A sampai E, tempel copy di bagian 5, isi UTM.
3. Jalankan fase 1 dengan budget kecil.
4. Rekam video 20 detik untuk hook pemenang.
5. Aktifkan retargeting setelah kolam audiens cukup besar.
