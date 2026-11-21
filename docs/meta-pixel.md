# Meta Pixel & Conversions API

Pelacakan konversi untuk iklan Facebook/Instagram. Semuanya nonaktif sampai ID Pixel diisi.

## Yang dikirim ke Meta

| Event | Dari mana | Kapan |
|---|---|---|
| `PageView` | Browser | Halaman: `/`, `/tryout-cpns`, `/belajar-skd`, `/belajar-skd/*`, `/harga`, `/register`, `/login`, `/tryout/beli` |
| `ViewContent` | Browser | `/tryout-cpns` (kategori `tryout`) dan `/belajar-skd*` (kategori `belajar-skd`) |
| `CompleteRegistration` | Browser | Akun yang dibuat kurang dari 3 hari lalu, sekali per akun per browser |
| `InitiateCheckout` | Browser | Setelah order dibuat di `payment-create`, sebelum redirect ke gateway. `event_id` = `ic-<order_id>` |
| `Purchase` | Browser dan server | Pembayaran lunas. Browser: halaman `/payment/success`. Server: `payment-webhook` / `payment-reconcile`. `event_id` = `order_id` di keduanya, jadi Meta menghitung sekali |

Halaman CV pribadi, link share/portfolio, admin, dan halaman pembayaran sengaja tidak mengirim `PageView`. Pixel dipasang dengan `autoConfig: false`, jadi Meta tidak membaca isi form (email di login/daftar). Pencocokan pembeli dilakukan server-side dengan email yang di-hash SHA-256.

`value` Purchase dan InitiateCheckout adalah harga produk (`amount_idr`), bukan jumlah yang ditagih gateway.

Semua pembelian lunas dikirim sebagai `Purchase` (tryout, paket CV, add-on). Pisahkan per jenis lewat `content_category` (`tryout`, `tier`, `addon_upload_cv`, `addon_pro_photo`) dengan custom conversion di Events Manager bila perlu.

## Mengaktifkan

1. Terapkan migrasi `supabase/migrations/20261121000000_payment_order_tracking.sql`.
2. Di Meta Events Manager buat dataset/Pixel, salin ID-nya. Buat access token Conversions API (Settings → Conversions API → Generate access token).
3. Set `VITE_META_PIXEL_ID` di environment build (Vercel) lalu deploy ulang.
4. Set secret edge function di Supabase: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`. Deploy ulang `payment-create`, `payment-webhook`, `payment-reconcile`.
5. Verifikasi domain `cvpintar.web.id` di Business Manager dan atur prioritas event (Aggregated Event Measurement): `Purchase` > `InitiateCheckout` > `CompleteRegistration` > `ViewContent`.

## Menguji

1. Di Events Manager buka tab Test events, salin kode (`TEST12345`).
2. Untuk event server, set sementara secret `META_TEST_EVENT_CODE`. Hapus setelah selesai supaya event asli tidak masuk ke tab uji.
3. Buka `https://cvpintar.web.id/tryout-cpns?utm_source=meta&utm_content=uji` dan lihat `PageView` serta `ViewContent` muncul.
4. Lakukan satu pembelian (atau gunakan order uji) dan cek `InitiateCheckout` serta `Purchase`. Di Test events, `Purchase` harus tampil satu baris dengan label "Deduplicated" saat browser dan server sama-sama terkirim.
5. Cek Event Match Quality di Events Manager. Email, `fbp`, `fbc`, IP, dan user agent seharusnya terisi untuk pembelian dari klik iklan.

## Atribusi

Saat landing, `fbclid` dan `utm_*` disimpan di `localStorage` (`cvp_attribution`, klik iklan terakhir menang). Saat checkout, `payment-create` menyimpannya bersama `fbp`/`fbc`, IP, dan user agent ke tabel `payment_order_tracking` (hanya bisa dibaca service role). Tabel ini yang dipakai server untuk Conversions API.

Data UTM per order juga bisa dipakai untuk laporan penjualan per iklan:

```sql
SELECT t.utm->>'utm_content' AS iklan, count(*) AS pembelian, sum(o.amount_idr) AS omzet
FROM payment_orders o
JOIN payment_order_tracking t USING (order_id)
WHERE o.status = 'paid'
GROUP BY 1
ORDER BY omzet DESC;
```

## Catatan

- Event server memakai Graph API `v23.0` (ubah lewat `META_GRAPH_VERSION`). Periksa versi yang masih didukung di dokumentasi Meta.
- Order tanpa data atribusi (dibuat sebelum fitur ini, atau pembeli tanpa cookie Meta) dikirim sebagai `system_generated`, bukan `website`, karena event `website` mewajibkan user agent.
- Belum ada banner persetujuan cookie. Consent iklan di Google tag memang ditolak sejak awal (`src/routes/__root.tsx`), sedangkan Meta Pixel aktif begitu ID diisi. Perbarui kebijakan privasi agar menyebut Meta Pixel sebelum mengaktifkannya, dan putuskan apakah perlu persetujuan eksplisit.
