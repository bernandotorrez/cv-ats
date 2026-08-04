# Status Fitur Paket Lengkap Tryout SKD

Dokumen ini merangkum status implementasi 4 fitur utama **Paket Lengkap** Tryout SKD CPNS di codebase CV Pintar.

---

## Ringkasan Status

| # | Fitur | Status | Keterangan |
|---|-------|--------|------------|
| 1 | Pembahasan lengkap setiap soal | ✅ Sudah ada | Gated oleh `has_pembahasan` (paket Lengkap) |
| 2 | Analisis kelemahan perkategori | ✅ Sudah ada | Breakdown per kategori per subtes |
| 3 | Akses leaderboard nasional | ✅ Sudah ada | Halaman `/tryout/leaderboard` + sidebar dashboard |
| 4 | Statistik per attempt | ✅ Sudah ada | Skor per subtes, durasi, status, riwayat |

**Kesimpulan: Semua 4 fitur sudah diimplementasikan.** Tidak diperlukan development baru.

---

## Detail Implementasi

### 1. ✅ Pembahasan Lengkap Setiap Soal

**Komponen:**
- `src/components/tryout/QuestionCard.tsx` → `QuestionResultCard` (line 153-287)

**Halaman:**
- `src/routes/_authenticated/tryout.$examId.hasil.$attemptId.tsx` (line 208-265)

**Cara kerja:**
- Setelah submit tryout, edge function `tryout-submit` mengembalikan `has_pembahasan: boolean`.
- Jika user memiliki **paket Lengkap**, `has_pembahasan = true` dan pembahasan ditampilkan.
- Pembahasan ditampilkan per subtes (TWK/TIU/TKP) dalam accordion yang bisa di-expand.
- Setiap soal menampilkan:
  - Teks soal + gambar (jika ada).
  - Pilihan jawaban user (ditandai hijau jika benar, merah jika salah).
  - Kunci jawaban benar.
  - Skor per opsi (khusus TKP).
  - Teks pembahasan dari field `question.explanation`.

**Type terkait:**
- `TryoutQuestionFull` di `src/lib/tryout-types.ts` (line 42-47) — berisi `correct_answer`, `scores`, `explanation`, `explanation_image_url`.

---

### 2. ✅ Analisis Kelemahan Per Kategori

**Komponen:**
- `src/components/tryout/ScoreBreakdown.tsx` (111 baris)

**Halaman:**
- `src/routes/_authenticated/tryout.$examId.hasil.$attemptId.tsx` (line 200-206)

**Cara kerja:**
- Setiap soal memiliki field `category` (misal: "Pancasila", "Analogi Verbal", "Pelayanan Publik").
- Setelah submit, `computeTryoutStats()` di `src/lib/tryout-scoring.ts` (line 101-149) menghitung breakdown per kategori:
  - **TWK/TIU:** `{ correct, total }` per kategori.
  - **TKP:** `{ score, total }` per kategori.
- Komponen `ScoreBreakdown` menampilkan:
  - Jumlah benar vs total per kategori.
  - Progress bar berwarna (hijau >70%, kuning >40%, merah <40%).
  - Membantu user identifikasi kelemahan di kategori tertentu.

**Type terkait:**
- `TryoutAttemptStats` di `src/lib/tryout-types.ts` (line 134-153) — berisi `by_category` untuk setiap subtes.

---

### 3. ✅ Akses Leaderboard Nasional

**Komponen:**
- `src/components/tryout/LeaderboardTable.tsx` (164 baris)

**Halaman:**
- `src/routes/_authenticated/tryout.leaderboard.tsx` — Halaman leaderboard dedicated (top 50).
- `src/routes/_authenticated/tryout.tsx` — Sidebar dashboard (top 5 + link "Lihat semua").

**Cara kerja:**
- Data dari view `tryout_leaderboard` di Supabase.
- Leaderboard menampilkan:
  - Ranking (ikon Trophy/Medal/Award untuk top 3).
  - Nama + avatar user.
  - Skor total + breakdown TWK/TIU/TKP.
  - Status LULUS (badge).
  - Durasi pengerjaan + tanggal.
  - Highlight jika user saat ini ada di leaderboard (badge "Kamu").
- Filter per exam set (tabs) di halaman leaderboard.
- Hero banner gradient (amber → orange → red) dengan ajakan bersaing.

**Type terkait:**
- `TryoutLeaderboardEntry` di `src/lib/tryout-types.ts` (line 181-195).
- `LeaderboardEntry` di `LeaderboardTable.tsx` (line 11-25).

---

### 4. ✅ Statistik Per Attempt

**Komponen:**
- `src/components/tryout/ScoreCard.tsx` (168 baris) — kartu skor utama + passing grade.
- `src/components/tryout/AttemptHistoryList.tsx` (126 baris) — daftar riwayat attempt.

**Halaman:**
- `src/routes/_authenticated/tryout.$examId.hasil.$attemptId.tsx` — detail hasil per attempt.
- `src/routes/_authenticated/tryout.tsx` — riwayat 10 attempt terakhir di dashboard.

**Cara kerja:**
- **ScoreCard** menampilkan:
  - Status kelulusan (LULUS/BELUM LULUS) dengan gradient hero.
  - Skor per subtes (TWK/TIU/TKP) vs passing grade.
  - Total skor vs 550 dengan progress bar.
  - Persentase dari skor maksimal.

- **AttemptHistoryList** menampilkan:
  - Nama exam set.
  - Status (Selesai/Sedang berlangsung/Waktu habis).
  - Durasi pengerjaan.
  - Tanggal.
  - Skor total + status lulus.
  - Link ke halaman hasil atau lanjutkan (jika in_progress).

**Type terkait:**
- `TryoutAttempt` di `src/lib/tryout-types.ts` (line 108-129).
- `TryoutScore` di `src/lib/tryout-scoring.ts` (line 15-24).

---

## Arsitektur File Tryout

```
src/
├── components/tryout/
│   ├── index.ts                  # Re-export semua komponen
│   ├── QuestionCard.tsx          # Kartu soal (ujian + hasil/pembahasan)
│   ├── QuestionNavigation.tsx    # Navigasi nomor soal
│   ├── ExamTimer.tsx             # Timer countdown
│   ├── ExamConfirmDialog.tsx     # Dialog konfirmasi submit
│   ├── ScoreCard.tsx             # Kartu skor utama + kelulusan
│   ├── ScoreBreakdown.tsx        # Analisis per kategori
│   ├── AttemptHistoryList.tsx    # Daftar riwayat attempt
│   ├── LeaderboardTable.tsx      # Tabel leaderboard
│   ├── CreditBalance.tsx         # Saldo kredit
│   ├── TryoutPackageCard.tsx     # Kartu paket (beli)
│   └── SubtestTabs.tsx           # Tab subtes
│
├── lib/
│   ├── tryout-types.ts           # Type definitions
│   └── tryout-scoring.ts         # Logika skor + utilities
│
├── routes/_authenticated/
│   ├── tryout.tsx                # Dashboard tryout (exam sets + riwayat + leaderboard sidebar)
│   ├── tryout.beli.tsx           # Beli kredit tryout
│   ├── tryout.leaderboard.tsx    # Leaderboard nasional (full page)
│   ├── tryout.$examId.tsx        # Detail exam set
│   ├── tryout.$examId.ujian.tsx  # Halaman ujian (fullscreen)
│   └── tryout.$examId.hasil.$attemptId.tsx  # Hasil + pembahasan
│
└── routes/
    └── tryout-cpns.tsx           # Landing page publik (SEO, pricing, FAQ)
```

---

## Catatan

- Semua fitur sudah **production-ready** dan menggunakan dark mode + responsive design.
- Pembahasan di-gate oleh backend (`has_pembahasan`) berdasarkan tipe paket kredit user.
- Leaderboard menggunakan Supabase view `tryout_leaderboard` untuk performa query.
- Statistik per kategori dihitung di `computeTryoutStats()` dan disimpan di field `stats` pada `tryout_attempts`.
