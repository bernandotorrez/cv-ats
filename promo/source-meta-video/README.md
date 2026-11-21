# Video iklan Meta: Tryout SKD CPNS (9:16, ±25 detik)

Tiga varian dengan badan video yang sama, beda hook 3 detik pertama:

| Varian | File | Hook |
|---|---|---|
| `timer` | `../cvpintar-meta-ad-hook-timer-9x16.mp4` | Hitung mundur 100:00, "Sudah pernah coba?" |
| `harga` | `../cvpintar-meta-ad-hook-harga-9x16.mp4` | "Rp10.000 per tryout SKD. Ini isinya." |
| `pg` | `../cvpintar-meta-ad-hook-pg-9x16.mp4` | Passing grade 65 / 80 / 166 |

Susunan: hook, demo layar (simulasi, hasil, pembahasan), tawaran harga, ajakan. Subtitle dan teks besar dipasang di layar karena banyak orang menonton tanpa suara. Narasi: `id-ID-GadisNeural` (edge-tts), rate +8%. Area aman Reels/TikTok dijaga: teks penting di antara y=270 dan y=1500, penafian "Bukan situs resmi BKN/SSCASN" tampil di bawahnya.

## Membuat ulang

```bash
# 1. narasi: edit vo/hook-<varian>.txt dan vo/common.txt (satu kalimat per scene), lalu buat vo/*.wav
#    dengan edge-tts --voice id-ID-GadisNeural --rate=+8% (lihat langkah di bawah), potong hening di awal/akhir.
# 2. timeline mengikuti durasi narasi
for v in timer harga pg; do python3 timeline.py $v; done
# 3. musik + mix (musik mengecil saat narasi) + loudness -14 LUFS
for v in timer harga pg; do
  python3 music.py music-$v.wav timeline-$v.json
  python3 mix.py music-$v.wav mix-raw-$v.wav timeline-$v.json
  ffmpeg -y -i mix-raw-$v.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 mix-$v.wav
done
# 4. render (butuh: npm i playwright-core + Google Chrome)
for v in timer harga pg; do node render.mjs "index.html?hook=$v" video ../cvpintar-meta-ad-hook-$v-9x16.mp4 30 mix-$v.wav; done
```

Pratinjau animasi: buka `index.html?hook=timer` di Chrome. Untuk menambah varian hook, tambahkan entri di objek `HOOKS` dan `SCENES.s1` pada `index.html`, satu baris naskah di `vo/hook-<varian>.txt`, lalu jalankan langkah 1 sampai 4.

## Catatan

- Tangkapan layar hasil dan leaderboard berisi data contoh dan diberi label "Contoh tampilan hasil".
- Kartu harga mengikuti migrasi `20261110000000_tryout_satuan_full_features.sql`: Tryout Satuan sudah termasuk pembahasan detail dan leaderboard.
- Tidak ada soal figural di video ini karena belum ada tangkapan layar asli dari aplikasi.
