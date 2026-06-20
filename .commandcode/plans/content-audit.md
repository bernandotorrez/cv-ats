# Content Audit & Fix Plan — CV Pintar

## Temuan Redundansi

### 1. Section "Mengapa Pilih Kami" Muncul di 3 Halaman (KRITIS)

Section yang identik secara konsep dengan judul berbeda:

| Halaman              | Judul Section                    | Jumlah Card |
| -------------------- | -------------------------------- | ----------- |
| `/` (index.tsx)      | "Bukan Sekadar CV Builder Biasa" | 8 card      |
| `/fitur` (fitur.tsx) | "Lebih dari Sekadar Fitur"       | 6 card      |
| `/harga` (harga.tsx) | "Lebih dari Sekadar CV Builder"  | 6 card      |

Value proposition yang diulang: Made for Indonesia (3x), Hemat Waktu (3x), AI Indonesia (3x),
Aman & Privasi (3x), HR Expert Review (3x), Lolos ATS (2x), Hasil Terukur (2x).

**Keputusan:** Simpan hanya di `/` (landing page). Hapus dari `/fitur` dan `/harga`.

### 2. Section "HR Review Feature Highlight" Muncul 2x

Muncul di `index.tsx` (baris 261-321) dan `harga.tsx` (baris 281-337) dengan konten
yang hampir sama (Sari Dewi Lakshmana card, list benefit).

**Keputusan:** Tetap di `/` sebagai highlight. Di `/harga`, cukup mention di comparison table.

### 3. Pricing Cards Muncul 2x

`index.tsx` dan `harga.tsx` sama-sama punya pricing cards 3 tier.

**Keputusan:** Tetap ada di `/harga` sebagai halaman utama pricing. Di `/`, ganti dengan
CTA "Lihat Harga" yang mengarah ke `/harga`.

### 4. Social Proof / Stats Tidak Konsisten

- `/` : "10.000+ CV dibuat", "92% lolos", "4.8/5", "< 10 mnt"
- `/fitur`: "10.000+ CV dibuat", "92% lolos", "3x interview", "< 10 menit"
- `/harga`: "50.000+ pengguna", "120.000+ CV dibuat", "3x", "4.9/5"

Angka 10.000 vs 120.000 bertentangan. Rating 4.8 vs 4.9 juga berbeda.

**Keputusan:** Gunakan angka tertinggi & seragam: 50.000+ pengguna, 120.000+ CV, 92% lolos, 4.9/5.

## Temuan Text Corruption & Typo

| File      | Baris | Masalah                        | Teks Saat Ini                                    | Perbaikan                                                                                   |
| --------- | ----- | ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| index.tsx | 204   | Korea tercampur                | `paham시장 Indonesia`                            | `paham pasar Indonesia`                                                                     |
| harga.tsx | 63    | Rusia tercampur                | `serius карьера naik`                            | `serius naikkan level karir`                                                                |
| harga.tsx | 365   | Typo                           | `tanparibet`                                     | `tanpa ribet`                                                                               |
| index.tsx | 403   | "anda" lowercase + pesan lemah | `Investasi yang tidak akan membuat anda rugi...` | `Hasil wawancara lebih penting dari biaya CV. Mulai gratis, upgrade hanya kalau kamu siap.` |
| harga.tsx | 111   | Emoji di Badge                 | `"👑 "+t.badge`                                  | `t.badge` saja (pakai ikon dari Lucide)                                                     |

## File yang Perlu Diubah

### 1. `src/routes/index.tsx`

**Hapus:** Section Pricing Cards (baris 370-419) — ganti dengan link ke /harga

**Perbaiki teks:**

- Baris 204: `paham시장` → `paham pasar`
- Baris 403: Ganti copywriting pricing section yang tersisa

**Seragamkan stats Trust section (baris 251-255):**

```
["50.000+", "Pengguna"],
["120.000+", "CV dibuat"],
["92%", "Lolos screening ATS"],
["4.9/5", "Rating pengguna"],
```

### 2. `src/routes/fitur.tsx`

**Hapus:** Section "Mengapa Pilih Kami" (baris 66-143) — termasuk stats row.

**Ganti dengan:** CTA section yang fokus pada hasil:

```tsx
<section className="bg-primary/5 py-16 md:py-20">
  <div className="container-page text-center max-w-2xl mx-auto">
    <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
      Hasil Nyata, Bukan Janji
    </h2>
    <p className="mt-4 text-muted-foreground text-lg">
      92% pengguna lolos screening ATS. Rata-rata 3x lebih banyak panggilan interview. Setiap fitur
      kami bangun untuk satu hal: mengantarmu ke meja interview.
    </p>
    <Button asChild size="lg" className="mt-8">
      <Link to="/register">Mulai Gratis — Buktikan Sendiri</Link>
    </Button>
  </div>
</section>
```

### 3. `src/routes/harga.tsx`

**Hapus:** Section "Mengapa Pilih Kami" (baris 210-279) — termasuk stats row di dalamnya.

**Hapus:** Section "HR Review Feature Highlight" (baris 281-337) — sudah ada di landing page.

**Perbaiki teks:**

- Baris 63: `карьера` → `naikkan level karir`
- Baris 365: `tanparibet` → `tanpa ribet`
- Baris 111: `{"👑 "+t.badge}` → `{t.badge}`

**Seragamkan Social Proof stats (baris 99-105):**

```
{ icon: Users, stat: "50.000+", label: "Pengguna Aktif" },
{ icon: FileText, stat: "120.000+", label: "CV Dibuat" },
{ icon: TrendingUp, stat: "92%", label: "Lolos Screening ATS" },
{ icon: Star, stat: "4.9/5", label: "Rating Pengguna" },
```

## Struktur Konten Final per Halaman

### `/` — Landing Page

1. Hero (cta: daftar gratis)
2. Problem-Solution (85% CV ditolak ATS)
3. **Mengapa Pilih Kami** ← hanya di sini
4. Trust Stats
5. Features highlight
6. HR Review Feature Highlight
7. How It Works (4 steps)
8. Templates preview
9. CTA ke /harga (bukan pricing cards)
10. Testimonials
11. FAQ
12. Final CTA

### `/fitur` — Features Page

1. PageHero
2. 3 Feature Groups (Pembuatan CV, AI Assistant, Produktivitas)
3. **CTA: "Hasil Nyata, Bukan Janji"** ← baru, pengganti Mengapa Pilih Kami

### `/harga` — Pricing Page

1. PageHero
2. Social Proof Stats (angka seragam)
3. Pricing Cards
4. Comparison Table
5. Money-Back Guarantee
6. Payment Methods
7. Final CTA
8. FAQ

## Verifikasi

- Buka ketiga halaman di browser, pastikan tidak ada teks Korea/Rusia
- Periksa `/fitur` — tidak ada lagi section "Mengapa Pilih Kami" yang redundant
- Periksa `/harga` — tidak ada lagi "Mengapa Pilih Kami" dan "HR Review" yang redundant
- Periksa `/` — stats sudah seragam (50.000+, 120.000+, 92%, 4.9)
- Periksa semua angka statistik konsisten antar halaman
