-- ─────────────────────────────────────────────────────────────────────────────
-- Tryout Satuan mendapat fitur yang sama dengan Paket Lengkap
--
-- Hak akses dicek dari flag paket pada kredit yang dipakai (pembahasan detail &
-- latihan ulang: has_pembahasan; leaderboard: has_leaderboard). Dengan flag ini,
-- pembeli Tryout Satuan — termasuk kredit Satuan yang sudah dibeli sebelumnya —
-- langsung mendapat pembahasan detail, latihan ulang, dan leaderboard nasional.
-- Bedanya kini hanya jumlah kredit/harga per tryout. Aman dijalankan ulang.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.tryout_packages
SET has_pembahasan = true,
    has_analytics = true,
    has_leaderboard = true,
    description = '1x tryout SKD 110 soal dengan pembahasan detail setiap soal, latihan ulang, dan akses leaderboard nasional.',
    features = '[
      "1x tryout SKD 110 soal (TWK + TIU + TKP)",
      "Timer 100 menit seperti CAT BKN",
      "Skor, tingkat kesiapan & rekomendasi belajar",
      "Pembahasan detail setiap soal",
      "Latihan ulang soal yang salah",
      "Akses leaderboard nasional"
    ]'::jsonb
WHERE slug = 'satuan';

UPDATE public.tryout_packages
SET description = '5x tryout SKD dengan semua fitur: pembahasan detail, latihan ulang, dan leaderboard nasional. Hanya Rp10.000 per tryout.',
    features = '[
      "5x tryout SKD 110 soal (TWK + TIU + TKP)",
      "Hemat Rp5.000 per tryout dibanding Satuan",
      "Pembahasan detail setiap soal",
      "Latihan ulang soal yang salah",
      "Akses leaderboard nasional",
      "Pantau kenaikan skor antar-tryout"
    ]'::jsonb
WHERE slug = 'lengkap';
