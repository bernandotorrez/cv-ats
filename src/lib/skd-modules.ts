/**
 * Modul Belajar SKD CPNS — SATU sumber untuk halaman /belajar-skd, detail modul,
 * sitemap, dan tautan rekomendasi di halaman hasil tryout.
 *
 * Bentuknya sama dengan artikel blog (lihat `blog-posts.ts`) sehingga memakai
 * komponen ArticleView yang sama. Urutan array = urutan jalur belajar.
 *
 * Inline di dalam teks: **tebal** dan [teks tautan](/path-internal).
 */
import type { BlogPost } from "./blog-posts";

export type SkdModuleTopic = "strategi" | "twk" | "tiu" | "tkp";

export type SkdModule = BlogPost & {
  topic: SkdModuleTopic;
  /** Tingkat pembaca: Pemula, Menengah, atau Semua Level. */
  level: string;
  /** Poin singkat "yang kamu pelajari" untuk kartu di halaman daftar modul. */
  highlights: string[];
};

export const SKD_TOPIC_LABEL: Record<SkdModuleTopic, string> = {
  strategi: "Strategi",
  twk: "TWK",
  tiu: "TIU",
  tkp: "TKP",
};

const CTA_TRYOUT = {
  title: "Sudah paham teorinya? Uji di simulasi CAT.",
  text: "Materi baru benar-benar menempel setelah dipakai di bawah tekanan waktu. Kerjakan tryout SKD dengan timer, skor per subtes, dan pembahasan setiap soal.",
  label: "Coba Tryout Gratis",
  to: "/tryout",
};

const CTA_PAKET = {
  title: "Latihan rutin adalah kunci lolos passing grade.",
  text: "Satu kali tryout belum cukup untuk melihat pola kelemahanmu. Ambil paket tryout CV Pintar dan pantau kenaikan skor dari set ke set.",
  label: "Lihat Paket Tryout",
  to: "/tryout/beli",
};

export const skdModules: SkdModule[] = [
  // ─── 1. Strategi umum ────────────────────────────────────────────────────
  {
    slug: "strategi-lolos-skd",
    topic: "strategi",
    title: "Strategi Lolos SKD CPNS: Format, Passing Grade, dan Cara Menyusun Target Skor",
    category: "Strategi",
    level: "Pemula",
    excerpt:
      "Mulai dari sini. Pahami format 110 soal dalam 100 menit, cara penilaian tiap subtes, dan cara menentukan target skor yang realistis.",
    highlights: [
      "Komposisi soal & sistem nilai TWK, TIU, TKP",
      "Kenapa lulus ketiga subtes lebih penting dari total skor",
      "Cara menyusun target skor latihanmu",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "Seleksi Kompetensi Dasar (SKD) adalah gerbang pertama seleksi CPNS. Di tahap ini, ratusan ribu pelamar diuji dengan soal yang sama melalui sistem **CAT (Computer Assisted Test) BKN**. Kabar baiknya, SKD bukan ujian hafalan murni: polanya bisa dipelajari, dan skor bisa dinaikkan dengan latihan yang terarah.",
      },
      {
        t: "p",
        text: "Modul ini memberimu peta besarnya dulu: apa yang diujikan, bagaimana dinilai, dan bagaimana menyusun target. Modul-modul berikutnya membahas tiap subtes secara mendalam.",
      },
      { t: "h2", text: "Format SKD: 110 soal dalam 100 menit" },
      {
        t: "ul",
        items: [
          "**TWK (Tes Wawasan Kebangsaan): 30 soal.** Benar bernilai 5, salah atau kosong bernilai 0. Skor maksimal 150.",
          "**TIU (Tes Intelegensi Umum): 35 soal.** Benar bernilai 5, salah atau kosong bernilai 0. Skor maksimal 175.",
          "**TKP (Tes Karakteristik Pribadi): 45 soal.** Setiap opsi bernilai 1 sampai 5, tidak ada jawaban yang salah mutlak. Skor maksimal 225.",
        ],
      },
      {
        t: "p",
        text: "Total skor maksimal adalah **550**. Waktu 100 menit untuk 110 soal berarti rata-rata kamu hanya punya sekitar **54 detik per soal**. Inilah alasan utama banyak peserta gagal: bukan karena tidak bisa, tapi karena kehabisan waktu.",
      },
      { t: "h2", text: "Passing grade: harus lulus ketiganya" },
      {
        t: "p",
        text: "Nilai ambang batas yang umum dipakai pada seleksi CPNS terbaru adalah **TWK 65, TIU 80, dan TKP 166**. Aturan terpentingnya: kamu harus memenuhi passing grade **di ketiga subtes sekaligus**. Total skor 450 tetap dinyatakan tidak lulus jika TWK-mu hanya 60.",
      },
      {
        t: "callout",
        title: "Selalu cek pengumuman resmi",
        text: "Nilai ambang batas ditetapkan lewat Keputusan Menteri PANRB untuk setiap periode seleksi dan bisa berbeda untuk formasi khusus. Jadikan angka di atas sebagai patokan latihan, lalu cocokkan dengan pengumuman resmi saat pendaftaran dibuka.",
      },
      { t: "h2", text: "Lulus passing grade belum tentu lolos formasi" },
      {
        t: "p",
        text: "Peserta yang memenuhi passing grade kemudian **diperingkat berdasarkan total skor** di formasi yang sama. Hanya peringkat teratas (umumnya maksimal tiga kali jumlah kebutuhan formasi) yang lanjut ke Seleksi Kompetensi Bidang. Untuk formasi favorit, skor yang hanya pas di ambang batas biasanya belum cukup.",
      },
      { t: "h2", text: "Cara menyusun target skor latihanmu" },
      {
        t: "ol",
        items: [
          "**Ukur posisi awal.** Kerjakan satu [tryout SKD](/tryout) tanpa persiapan khusus. Skor ini adalah garis awalmu, bukan vonis.",
          "**Amankan subtes terlemah dulu.** Fokuskan 60% waktu belajar pada subtes yang belum lulus passing grade. Satu subtes gagal membuat skor subtes lain tidak berarti.",
          "**Pasang target aman, bukan target pas.** Sebagai patokan latihan, kejar sekitar TWK 85+, TIU 100+, dan TKP 180+. Skor saat ujian asli biasanya turun sedikit karena tekanan.",
          "**Naikkan target bertahap.** Setelah ketiganya aman, kejar total skor. Kenaikan 20 sampai 30 poin per minggu sudah termasuk progres yang sangat baik.",
        ],
      },
      { t: "h2", text: "Subtes mana yang paling cepat dinaikkan?" },
      {
        t: "ul",
        items: [
          "**TKP** paling cepat naik karena polanya konsisten. Begitu kamu paham karakter jawaban bernilai 5, skor bisa melonjak dalam beberapa hari. Pelajari di [modul TKP](/belajar-skd/tkp-cara-menjawab).",
          "**TWK** naik stabil dengan membaca ulang materi pilar negara dan sejarah secara rutin. Lihat [modul TWK](/belajar-skd/materi-twk).",
          "**TIU** butuh waktu paling lama karena melatih keterampilan, bukan hafalan. Mulai lebih awal dengan [TIU verbal](/belajar-skd/tiu-verbal), [numerik](/belajar-skd/tiu-numerik), dan [figural](/belajar-skd/tiu-figural).",
        ],
      },
      {
        t: "callout",
        title: "Tidak ada nilai minus, jadi jangan ada soal kosong",
        text: "Jawaban salah dan kosong sama-sama bernilai 0 di TWK dan TIU, sedangkan di TKP opsi terburuk pun tetap bernilai 1. Artinya, tebakan selalu lebih baik daripada mengosongkan soal. Sisakan satu sampai dua menit di akhir untuk mengisi semua soal yang belum terjawab.",
      },
    ],
    faq: [
      {
        q: "Berapa passing grade SKD CPNS?",
        a: "Patokan yang umum dipakai pada seleksi terbaru adalah TWK 65, TIU 80, dan TKP 166. Nilai resmi ditetapkan untuk setiap periode seleksi, jadi selalu cocokkan dengan pengumuman Kementerian PANRB.",
      },
      {
        q: "Apakah jawaban salah di SKD mengurangi nilai?",
        a: "Tidak. Di TWK dan TIU, jawaban salah dan kosong sama-sama bernilai 0. Di TKP, setiap opsi bernilai 1 sampai 5. Karena itu, isi semua soal.",
      },
      {
        q: "Subtes mana yang sebaiknya dipelajari lebih dulu?",
        a: "Mulailah dari subtes yang skornya paling jauh dari passing grade. Jika belum pernah tryout, kerjakan satu tryout dulu untuk mengukur posisi awalmu.",
      },
    ],
    cta: CTA_TRYOUT,
    related: ["manajemen-waktu-hari-h", "jadwal-belajar-30-hari"],
  },

  // ─── 2. TWK ──────────────────────────────────────────────────────────────
  {
    slug: "materi-twk",
    topic: "twk",
    title: "TWK CPNS: Materi Inti Wawasan Kebangsaan dan Cara Menjawabnya",
    category: "TWK",
    level: "Semua Level",
    excerpt:
      "Lima kelompok materi TWK, fakta sejarah dan pasal yang paling sering keluar, serta trik membaca soal TWK yang berbentuk studi kasus.",
    highlights: [
      "5 kelompok materi TWK yang diujikan",
      "Fakta sejarah & pasal UUD 1945 yang wajib hafal",
      "Trik menjawab soal TWK berbentuk kasus",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "TWK sering dianggap subtes hafalan, padahal soal TWK modern banyak berbentuk **studi kasus**: kamu diberi situasi, lalu diminta memilih sikap atau tindakan yang paling mencerminkan nilai kebangsaan. Hafalan tetap penting, tetapi pemahaman nilai di baliknya jauh lebih menentukan.",
      },
      { t: "h2", text: "Lima kelompok materi TWK" },
      {
        t: "ul",
        items: [
          "**Nasionalisme:** rasa cinta tanah air, mendahulukan kepentingan bangsa, dan bangga menggunakan produk serta budaya Indonesia.",
          "**Integritas:** jujur, konsisten, menolak gratifikasi dan korupsi, serta berani melaporkan pelanggaran lewat jalur resmi.",
          "**Bela negara:** kesadaran berbangsa, rela berkorban, dan kesiapan menjaga keutuhan negara sesuai profesi masing-masing.",
          "**Pilar negara:** Pancasila, UUD 1945, NKRI, dan Bhinneka Tunggal Ika.",
          "**Bahasa negara:** kedudukan dan fungsi bahasa Indonesia, termasuk kaidah kebahasaan dasar.",
        ],
      },
      { t: "h2", text: "Fakta sejarah yang wajib kamu kuasai" },
      {
        t: "ul",
        items: [
          "**Sumpah Pemuda:** 28 Oktober 1928, tonggak persatuan bangsa, tanah air, dan bahasa.",
          "**Sidang BPUPKI pertama:** 29 Mei sampai 1 Juni 1945, membahas dasar negara. Pidato Soekarno pada 1 Juni 1945 diperingati sebagai Hari Lahir Pancasila.",
          "**Piagam Jakarta:** 22 Juni 1945, disusun Panitia Sembilan. Tujuh kata pada sila pertama kemudian diubah demi persatuan.",
          "**Pengesahan UUD 1945:** 18 Agustus 1945 oleh PPKI, sehari setelah Proklamasi.",
          "**Amandemen UUD 1945:** dilakukan empat kali, yaitu pada 1999, 2000, 2001, dan 2002.",
          "**Bhinneka Tunggal Ika:** berasal dari Kitab Sutasoma karya Mpu Tantular.",
        ],
      },
      { t: "h2", text: "Pasal UUD 1945 yang sering muncul" },
      {
        t: "ul",
        items: [
          "**Pasal 1 ayat (2):** kedaulatan berada di tangan rakyat dan dilaksanakan menurut UUD.",
          "**Pasal 1 ayat (3):** Negara Indonesia adalah negara hukum.",
          "**Pasal 27 ayat (3):** setiap warga negara berhak dan wajib ikut serta dalam upaya pembelaan negara.",
          "**Pasal 30:** pertahanan dan keamanan negara.",
          "**Pasal 36:** bahasa negara adalah bahasa Indonesia. **Pasal 36A:** lambang negara Garuda Pancasila.",
          "**Pasal 37 ayat (5):** bentuk Negara Kesatuan Republik Indonesia tidak dapat dilakukan perubahan.",
        ],
      },
      {
        t: "callout",
        title: "Trik menghafal pasal",
        text: "Jangan menghafal semua pasal sekaligus. Buat kartu kecil berisi nomor pasal di depan dan isinya di belakang, lalu ulangi 10 menit setiap hari. Pengulangan singkat yang rutin jauh lebih menempel daripada belajar tiga jam semalam sebelum ujian.",
      },
      { t: "h2", text: "Cara menjawab soal TWK berbentuk kasus" },
      {
        t: "ol",
        items: [
          "**Baca pertanyaannya dulu, baru ceritanya.** Dengan tahu apa yang ditanyakan, kamu bisa membaca cerita dengan fokus dan lebih cepat.",
          "**Tentukan nilai yang diuji.** Apakah soal ini tentang integritas, nasionalisme, atau bela negara? Nilai itu menjadi kompas untuk memilih jawaban.",
          "**Pilih yang sesuai aturan dan kepentingan bersama.** Jawaban benar biasanya menaati hukum, mengutamakan kepentingan bangsa, dan menyelesaikan masalah lewat jalur resmi.",
          "**Waspadai opsi yang terdengar heroik tapi melanggar aturan.** Main hakim sendiri, menyebarkan informasi yang belum terverifikasi, atau melawan dengan kekerasan hampir selalu salah.",
          "**Hati-hati dengan kata mutlak.** Opsi yang memakai kata selalu, pasti, atau satu-satunya perlu dicek ulang karena sering kali terlalu ekstrem.",
        ],
      },
      { t: "h2", text: "Target waktu untuk TWK" },
      {
        t: "p",
        text: "Usahakan menyelesaikan 30 soal TWK dalam **sekitar 20 sampai 25 menit**. Soal fakta (tanggal, pasal, tokoh) bisa dijawab dalam hitungan detik: kalau kamu tidak tahu, tandai ragu, pilih jawaban terbaik, lalu lanjut. Simpan waktu untuk soal kasus yang perlu dibaca lebih teliti.",
      },
    ],
    faq: [
      {
        q: "Apa saja materi TWK CPNS?",
        a: "TWK menguji nasionalisme, integritas, bela negara, pilar negara (Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika), dan bahasa negara.",
      },
      {
        q: "Bagaimana cara cepat menaikkan nilai TWK?",
        a: "Ulangi fakta sejarah dan pasal penting setiap hari dalam sesi singkat, lalu latih soal kasus dengan menentukan nilai yang diuji sebelum memilih jawaban.",
      },
      {
        q: "Berapa passing grade TWK?",
        a: "Patokan yang umum dipakai adalah 65 dari skor maksimal 150, atau setara 13 jawaban benar dari 30 soal. Cocokkan dengan pengumuman resmi periode seleksimu.",
      },
    ],
    cta: CTA_TRYOUT,
    related: ["strategi-lolos-skd", "tkp-cara-menjawab"],
  },

  // ─── 3. TIU verbal ───────────────────────────────────────────────────────
  {
    slug: "tiu-verbal",
    topic: "tiu",
    title: "TIU Verbal: Trik Analogi, Silogisme, dan Penalaran Analitis",
    category: "TIU",
    level: "Menengah",
    excerpt:
      "Rumus kalimat penghubung untuk analogi, pola silogisme yang pasti benar, kesalahan logika yang sering menjebak, dan cara membuat tabel soal analitis.",
    highlights: [
      "Rumus kalimat penghubung untuk soal analogi",
      "Pola silogisme yang valid & yang menjebak",
      "Teknik tabel untuk soal analitis",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "Soal verbal di TIU menguji cara berpikir runtut menggunakan kata. Tiga tipe yang paling sering muncul adalah **analogi, silogisme, dan analitis**. Ketiganya punya pola yang bisa dilatih, sehingga skor verbal biasanya bisa naik lebih cepat dibanding numerik.",
      },
      { t: "h2", text: "Analogi: buat kalimat penghubung" },
      {
        t: "p",
        text: "Analogi meminta kamu menemukan pasangan kata dengan hubungan yang sama. Triknya: **buat satu kalimat yang menghubungkan pasangan pertama**, lalu uji kalimat itu ke setiap opsi.",
      },
      {
        t: "ul",
        items: [
          "**Contoh:** Petani : Cangkul. Kalimatnya: petani bekerja menggunakan cangkul. Uji ke opsi: penulis bekerja menggunakan pena (cocok), dokter bekerja menggunakan rumah sakit (kurang tepat, rumah sakit adalah tempat).",
          "**Jika lebih dari satu opsi cocok,** pertajam kalimatnya. Misalnya alat utama, bukan sekadar alat. Opsi yang tetap cocok dengan kalimat paling spesifik adalah jawabannya.",
          "**Hubungan yang sering keluar:** pelaku dan alat, bahan dan hasil, bagian dan keseluruhan, sebab dan akibat, tingkatan (gerimis, hujan, badai), serta fungsi.",
          "**Perhatikan urutan.** Jika soal berbentuk A : B, opsi juga harus berurutan sama. Opsi yang terbalik adalah jebakan klasik.",
        ],
      },
      { t: "h2", text: "Silogisme: pola yang pasti benar" },
      {
        t: "p",
        text: "Silogisme menguji penarikan kesimpulan dari premis. Aturan emasnya: **kesimpulan hanya boleh berasal dari premis**, bukan dari pengetahuan umummu, meskipun premisnya terdengar aneh.",
      },
      {
        t: "ul",
        items: [
          "**Semua A adalah B. Semua B adalah C.** Kesimpulan: semua A adalah C.",
          "**Semua A adalah B. Sebagian C adalah A.** Kesimpulan: sebagian C adalah B.",
          "**Semua A adalah B. X bukan B.** Kesimpulan: X bukan A.",
          "**Jika p maka q. p terjadi.** Kesimpulan: q terjadi (modus ponens).",
          "**Jika p maka q. q tidak terjadi.** Kesimpulan: p tidak terjadi (modus tollens).",
          "**Jika p maka q. Jika q maka r.** Kesimpulan: jika p maka r.",
        ],
      },
      {
        t: "callout",
        title: "Jebakan yang paling sering muncul",
        text: '"Semua A adalah B. X adalah B." Banyak peserta menyimpulkan X adalah A, padahal itu **tidak bisa disimpulkan**. Contoh: semua kucing berkaki empat, meja berkaki empat, bukan berarti meja adalah kucing. Hal yang sama berlaku untuk "Jika p maka q, q terjadi": p belum tentu terjadi.',
      },
      { t: "h3", text: "Negasi yang wajib hafal" },
      {
        t: "ul",
        items: [
          "Negasi dari **semua A adalah B** adalah **ada (sebagian) A yang bukan B**.",
          "Negasi dari **ada A yang B** adalah **semua A bukan B**.",
          "Negasi dari **jika p maka q** adalah **p dan tidak q**.",
          "Negasi dari **p dan q** adalah **tidak p atau tidak q**. Negasi dari **p atau q** adalah **tidak p dan tidak q**.",
        ],
      },
      { t: "h2", text: "Analitis: pindahkan ke tabel" },
      {
        t: "p",
        text: "Soal analitis berisi banyak syarat, misalnya urutan duduk, jadwal, atau peringkat. Kesalahan terbesar adalah mencoba menyelesaikannya di kepala. Gunakan kertas buram yang disediakan.",
      },
      {
        t: "ol",
        items: [
          "**Gambar kerangkanya dulu:** kursi berjajar, kolom hari, atau urutan peringkat.",
          '**Masukkan syarat yang pasti lebih dulu,** misalnya "B duduk di kursi paling kanan".',
          '**Lanjutkan dengan syarat relatif,** misalnya "A di sebelah kiri C", dan tulis kemungkinan yang tersisa.',
          "**Uji opsi jawaban ke tabel.** Sering kali kamu tidak perlu menyelesaikan seluruh susunan: cukup coret opsi yang melanggar syarat.",
        ],
      },
      {
        t: "p",
        text: "Soal analitis termasuk yang paling memakan waktu. Jika setelah satu menit belum menemukan titik terang, tandai ragu, isi jawaban sementara, dan kembali di akhir. Strategi waktu lengkapnya ada di [modul manajemen waktu](/belajar-skd/manajemen-waktu-hari-h).",
      },
    ],
    faq: [
      {
        q: "Apa saja jenis soal TIU verbal?",
        a: "Yang paling sering muncul adalah analogi, silogisme (penarikan kesimpulan), dan penalaran analitis seperti urutan duduk atau jadwal.",
      },
      {
        q: "Bagaimana cara cepat mengerjakan soal analogi?",
        a: "Buat satu kalimat yang menghubungkan pasangan kata pertama, lalu uji kalimat itu ke setiap opsi. Jika lebih dari satu cocok, buat kalimatnya lebih spesifik.",
      },
      {
        q: "Bolehkah memakai pengetahuan umum saat menjawab silogisme?",
        a: "Tidak. Kesimpulan hanya boleh ditarik dari premis yang diberikan, meskipun premis itu terdengar tidak masuk akal.",
      },
    ],
    cta: CTA_TRYOUT,
    related: ["tiu-numerik", "tiu-figural"],
  },

  // ─── 4. TIU numerik ──────────────────────────────────────────────────────
  {
    slug: "tiu-numerik",
    topic: "tiu",
    title: "TIU Numerik: Trik Deret Angka, Hitung Cepat, dan Soal Cerita",
    category: "TIU",
    level: "Menengah",
    excerpt:
      "Pola deret yang paling sering keluar, tabel pecahan-persen yang wajib hafal, rumus cepat soal cerita, dan teknik eliminasi opsi tanpa menghitung penuh.",
    highlights: [
      "6 pola deret angka yang paling sering keluar",
      "Tabel pecahan ↔ persen & trik hitung cepat",
      "Rumus kilat soal cerita kecepatan & pekerjaan",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "Numerik adalah bagian TIU yang paling ditakuti, terutama karena kalkulator tidak diizinkan. Kuncinya bukan menjadi jago matematika, melainkan **mengenali pola dengan cepat** dan **tidak menghitung lebih dari yang diperlukan**.",
      },
      { t: "h2", text: "Deret angka: enam pola yang paling sering keluar" },
      {
        t: "ol",
        items: [
          "**Selisih tetap:** 3, 7, 11, 15, ... (selalu +4).",
          "**Selisih bertingkat:** 2, 5, 10, 17, 26, ... Selisihnya 3, 5, 7, 9 sehingga berikutnya +11 = 37.",
          "**Kali atau bagi:** 3, 6, 12, 24, ... (selalu ×2).",
          "**Campuran kali-tambah:** 2, 5, 11, 23, ... Polanya ×2 lalu +1, sehingga berikutnya 47.",
          "**Deret loncat:** 1, 10, 3, 20, 5, 30, ... Pisahkan suku ganjil (1, 3, 5) dan suku genap (10, 20, 30).",
          "**Fibonacci:** 1, 1, 2, 3, 5, 8, ... Setiap suku adalah jumlah dua suku sebelumnya.",
        ],
      },
      {
        t: "callout",
        title: "Urutan cek pola dalam 15 detik",
        text: "Pertama, lihat apakah angkanya naik pelan (kemungkinan penjumlahan) atau melonjak (kemungkinan perkalian). Kedua, tulis selisih antarsuku. Ketiga, jika selisihnya acak, coba pisahkan suku ganjil dan genap. Sebagian besar soal deret selesai di salah satu dari tiga langkah ini.",
      },
      { t: "h2", text: "Tabel pecahan dan persen yang wajib hafal" },
      {
        t: "ul",
        items: [
          "1/2 = 50%, 1/4 = 25%, 3/4 = 75%",
          "1/5 = 20%, 1/8 = 12,5%, 3/8 = 37,5%, 5/8 = 62,5%",
          "1/3 ≈ 33,3%, 2/3 ≈ 66,7%, 1/6 ≈ 16,7%",
          "1/9 ≈ 11,1%, 1/12 ≈ 8,3%",
        ],
      },
      {
        t: "p",
        text: 'Dengan tabel ini, 37,5% × 240 tidak perlu dihitung bersusun: cukup 3/8 × 240 = 90. Soal persen di TIU hampir selalu memakai angka yang "ramah" seperti ini.',
      },
      { t: "h2", text: "Trik hitung cepat" },
      {
        t: "ul",
        items: [
          "**Kuadrat angka berakhiran 5:** 35² = (3 × 4) lalu tambahkan 25 di belakang, hasilnya 1.225. Begitu juga 65² = (6 × 7) dan 25, yaitu 4.225.",
          "**Kali 11 untuk dua digit:** 53 × 11, tulis 5 dan 3, sisipkan jumlahnya (8) di tengah, hasilnya 583.",
          "**Kali 5:** kalikan 10 lalu bagi 2. Contoh 48 × 5 = 480 : 2 = 240.",
          "**Diskon bertingkat:** diskon 20% lalu 10% bukan 30%, melainkan 100% − (80% × 90%) = 28%.",
          "**Cek digit satuan:** jika opsi jawaban berbeda di digit terakhir, cukup hitung digit satuannya untuk memilih jawaban.",
        ],
      },
      { t: "h2", text: "Rumus kilat soal cerita" },
      {
        t: "ul",
        items: [
          "**Kecepatan:** jarak = kecepatan × waktu. Untuk dua kendaraan berpapasan, jumlahkan kecepatannya. Untuk menyusul, kurangkan.",
          "**Kecepatan rata-rata pergi-pulang** dengan jarak sama: 2 × v₁ × v₂ ÷ (v₁ + v₂). Bukan rata-rata biasa.",
          "**Pekerjaan bersama:** jika A selesai dalam a hari dan B dalam b hari, bersama-sama selesai dalam (a × b) ÷ (a + b) hari.",
          "**Untung dan rugi:** harga jual = harga beli × (100 + persen untung) ÷ 100. Untuk rugi, ganti tanda tambah menjadi kurang.",
          "**Perbandingan:** jika A : B = 2 : 3 dan totalnya 50, satu bagian bernilai 50 ÷ 5 = 10, sehingga A = 20 dan B = 30.",
        ],
      },
      { t: "h2", text: "Eliminasi: jangan selalu menghitung sampai tuntas" },
      {
        t: "p",
        text: "Sebelum menghitung, lihat dulu opsi jawabannya. Jika opsinya berjauhan, **estimasi** sudah cukup: 198 × 51 kira-kira 200 × 50 = 10.000, jadi pilih opsi yang paling dekat. Jika satu soal sudah memakan lebih dari 90 detik, isi jawaban terbaikmu, tandai ragu, dan pindah.",
      },
    ],
    faq: [
      {
        q: "Apakah boleh memakai kalkulator saat SKD?",
        a: "Tidak. Kamu hanya diberi kertas buram dan alat tulis, sehingga latihan hitung manual dan estimasi sangat penting.",
      },
      {
        q: "Bagaimana cara cepat mengerjakan soal deret angka?",
        a: "Lihat apakah angkanya naik pelan atau melonjak, tulis selisih antarsuku, lalu coba pisahkan suku ganjil dan genap jika selisihnya tidak berpola.",
      },
      {
        q: "Berapa lama waktu ideal per soal TIU numerik?",
        a: "Targetkan sekitar satu menit. Jika sudah lebih dari 90 detik, isi jawaban terbaik, tandai ragu, dan kembali jika masih ada waktu.",
      },
    ],
    cta: CTA_TRYOUT,
    related: ["tiu-verbal", "tiu-figural"],
  },

  // ─── 5. TIU figural ──────────────────────────────────────────────────────
  {
    slug: "tiu-figural",
    topic: "tiu",
    title: "TIU Figural: Cara Membaca Pola Gambar dalam Hitungan Detik",
    category: "TIU",
    level: "Menengah",
    excerpt:
      "Lima atribut yang selalu berubah di soal gambar, teknik mengamati satu atribut per langkah, serta trik soal serial, analogi gambar, dan ketidaksamaan.",
    highlights: [
      "5 atribut yang berubah di soal gambar",
      "Teknik satu atribut per langkah",
      "Trik serial, analogi gambar & ketidaksamaan",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "Soal figural terlihat rumit karena banyak hal berubah sekaligus. Rahasianya: **jangan melihat gambar secara keseluruhan**. Pecah perubahan menjadi atribut-atribut kecil, lalu periksa satu per satu.",
      },
      { t: "h2", text: "Lima atribut yang hampir selalu berubah" },
      {
        t: "ol",
        items: [
          "**Posisi:** objek bergeser searah atau berlawanan arah jarum jam, atau berpindah sudut.",
          "**Rotasi:** objek berputar 45°, 90°, atau 180° di setiap langkah.",
          "**Jumlah:** banyak titik, garis, atau sisi bertambah atau berkurang dengan pola tetap.",
          "**Arsiran atau warna:** bagian yang diarsir berpindah, bergantian, atau bertambah.",
          "**Bentuk:** jenis bangun berubah dengan urutan tertentu, misalnya segitiga, persegi, segi lima.",
        ],
      },
      {
        t: "callout",
        title: "Teknik satu atribut per langkah",
        text: "Pilih satu atribut, misalnya posisi titik hitam, lalu ikuti dari gambar pertama sampai terakhir. Tentukan polanya, lalu coret opsi yang tidak sesuai. Ulangi untuk atribut berikutnya. Biasanya dua atribut sudah cukup untuk menyisakan satu jawaban.",
      },
      { t: "h2", text: "Soal serial (lanjutan pola)" },
      {
        t: "ul",
        items: [
          "Bandingkan **gambar 1 dengan 2**, lalu **2 dengan 3**. Perubahan yang sama adalah polanya.",
          "Jika perubahan tidak konsisten, coba bandingkan **gambar 1 dengan 3** dan **2 dengan 4**. Bisa jadi ada dua pola yang berselang-seling.",
          "Untuk rotasi, fokus pada satu ujung atau penanda (misalnya ujung panah), bukan seluruh bangun.",
        ],
      },
      { t: "h2", text: "Analogi gambar" },
      {
        t: "p",
        text: 'Sama seperti analogi kata: temukan **apa yang terjadi dari gambar A ke B**, lalu terapkan perubahan yang sama pada gambar C. Tuliskan perubahannya dengan kata-kata singkat, misalnya "diputar 90° searah jarum jam dan arsiran dibalik". Dengan begitu kamu tidak lupa salah satu perubahan saat memeriksa opsi.',
      },
      { t: "h2", text: "Ketidaksamaan (mencari yang berbeda)" },
      {
        t: "ul",
        items: [
          "Cari sifat yang **dimiliki empat gambar** sekaligus, misalnya jumlah sisi genap, simetris, atau jumlah titik sama dengan jumlah garis.",
          "Gambar yang tidak memenuhi sifat itulah jawabannya.",
          "Waspadai gambar yang merupakan **cerminan**, bukan rotasi. Bangun yang dicerminkan tidak bisa diperoleh hanya dengan memutar.",
        ],
      },
      { t: "h2", text: "Kapan harus melewati soal figural" },
      {
        t: "p",
        text: "Soal figural bisa menjebakmu bermenit-menit. Batasi dirimu sekitar 60 detik. Jika belum ketemu, gunakan eliminasi sejauh yang bisa, pilih salah satu opsi yang tersisa, tandai ragu, lalu lanjut. Latihan rutin membuat mata lebih cepat menangkap pola, jadi kerjakan beberapa soal figural setiap hari.",
      },
    ],
    faq: [
      {
        q: "Apa yang harus diperhatikan pada soal figural?",
        a: "Periksa lima atribut secara terpisah: posisi, rotasi, jumlah, arsiran atau warna, dan bentuk. Satu atribut per langkah jauh lebih cepat daripada melihat gambar secara keseluruhan.",
      },
      {
        q: "Bagaimana membedakan rotasi dan pencerminan?",
        a: "Fokus pada satu penanda, misalnya ujung panah atau titik. Jika posisi relatif penanda terbalik kiri-kanan dan tidak bisa diperoleh dengan memutar, itu pencerminan.",
      },
      {
        q: "Apakah soal figural bisa dilatih?",
        a: "Bisa. Pola yang dipakai terbatas, sehingga latihan rutin beberapa soal per hari membuat kamu semakin cepat mengenalinya.",
      },
    ],
    cta: CTA_TRYOUT,
    related: ["tiu-numerik", "tiu-verbal"],
  },

  // ─── 6. TKP ──────────────────────────────────────────────────────────────
  {
    slug: "tkp-cara-menjawab",
    topic: "tkp",
    title: "TKP CPNS: Cara Memilih Jawaban Bernilai 5 di Setiap Aspek",
    category: "TKP",
    level: "Semua Level",
    excerpt:
      "Karakter jawaban bernilai 5, cara mengurutkan opsi dari terbaik ke terburuk, dan panduan sikap ideal untuk enam aspek TKP.",
    highlights: [
      "Ciri jawaban bernilai 5 vs bernilai 1",
      "Teknik mengurutkan 5 opsi dengan cepat",
      "Sikap ideal untuk 6 aspek TKP",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "Passing grade TKP adalah 166 dari 225, atau rata-rata hampir **3,7 per soal**. Artinya, kamu tidak cukup hanya menghindari jawaban terburuk: sebagian besar jawabanmu harus bernilai 4 atau 5. Kabar baiknya, TKP punya pola paling konsisten dibanding subtes lain.",
      },
      { t: "h2", text: "Ciri jawaban bernilai 5" },
      {
        t: "ul",
        items: [
          "**Proaktif:** langsung bertindak menyelesaikan masalah, bukan menunggu perintah.",
          "**Solutif:** fokus pada penyelesaian, bukan mencari siapa yang salah.",
          "**Mengutamakan kepentingan organisasi dan publik** di atas kepentingan pribadi.",
          "**Sesuai aturan dan prosedur,** tetapi tetap luwes demi pelayanan yang baik.",
          "**Kolaboratif:** melibatkan pihak lain dengan cara yang sopan dan saling menghargai.",
          "**Mau belajar dan berkembang,** terutama saat menghadapi hal baru atau kesulitan.",
        ],
      },
      { t: "h2", text: "Ciri jawaban bernilai rendah" },
      {
        t: "ul",
        items: [
          "Menghindar, menunda, atau menyerahkan masalah ke orang lain.",
          "Menyalahkan atasan, rekan, atau keadaan.",
          "Emosional, defensif, atau membalas perlakuan buruk.",
          "Melanggar aturan demi kepentingan pribadi atau kelompok.",
          "Pasif: hanya mengeluh atau menunggu tanpa berbuat apa-apa.",
        ],
      },
      { t: "h2", text: "Teknik mengurutkan opsi" },
      {
        t: "ol",
        items: [
          "**Coret opsi terburuk dulu.** Biasanya ada satu atau dua opsi yang jelas pasif atau melanggar aturan.",
          "**Bandingkan sisanya dengan pertanyaan:** mana yang paling cepat menyelesaikan masalah utamanya?",
          "**Jika dua opsi sama-sama baik,** pilih yang dikerjakan oleh diri sendiri lebih dulu sebelum melibatkan atasan, kecuali masalahnya memang di luar wewenangmu.",
          "**Perhatikan sudut pandang soal.** Soal tentang pelayanan publik mengutamakan masyarakat, sedangkan soal profesionalisme mengutamakan tanggung jawab atas tugas.",
        ],
      },
      { t: "h2", text: "Sikap ideal untuk enam aspek TKP" },
      {
        t: "ul",
        items: [
          "**Pelayanan publik:** ramah, cepat, sesuai SOP, dan tetap mengutamakan kebutuhan masyarakat. Bila aturan menghalangi, jelaskan dengan sopan dan tawarkan solusi alternatif.",
          "**Jejaring kerja:** aktif membangun relasi lintas unit, berbagi informasi, dan berkolaborasi demi tujuan bersama.",
          "**Sosial budaya:** terbuka terhadap perbedaan, mudah beradaptasi, dan menghargai keberagaman suku, agama, dan latar belakang.",
          "**Teknologi informasi dan komunikasi:** antusias mempelajari teknologi baru dan memanfaatkannya untuk efisiensi kerja, sambil menjaga keamanan data.",
          "**Profesionalisme:** bertanggung jawab penuh, menyelesaikan tugas tepat waktu, mengakui kesalahan, dan terus meningkatkan kompetensi.",
          "**Anti radikalisme:** menjaga persatuan, menolak kekerasan dan paham yang memecah belah, serta melapor melalui jalur resmi.",
        ],
      },
      {
        t: "callout",
        title: "Jawab sebagai ASN ideal, bukan sebagai dirimu hari ini",
        text: "TKP tidak menilai kejujuran tentang kebiasaanmu sekarang. Soal ini mengukur apakah kamu memahami sikap yang diharapkan dari seorang ASN. Pilih jawaban yang menggambarkan pegawai teladan, meskipun dalam kehidupan nyata kamu mungkin akan bertindak berbeda.",
      },
      { t: "h2", text: "Target waktu untuk TKP" },
      {
        t: "p",
        text: "Soal TKP tidak butuh hitungan, sehingga bisa dikerjakan dengan cepat: targetkan **sekitar 30 sampai 40 detik per soal**. Itulah alasan banyak peserta memilih mengerjakan TKP lebih dulu untuk mengamankan poin, lalu menyisakan waktu lebih banyak untuk TIU. Ingat, setiap opsi TKP minimal bernilai 1, jadi jangan pernah ada soal TKP yang kosong.",
      },
    ],
    faq: [
      {
        q: "Bagaimana sistem penilaian TKP?",
        a: "Setiap opsi jawaban TKP bernilai 1 sampai 5. Tidak ada jawaban salah mutlak, tetapi untuk lulus passing grade 166 kamu perlu rata-rata hampir 3,7 per soal.",
      },
      {
        q: "Apa ciri jawaban TKP bernilai 5?",
        a: "Proaktif, solutif, mengutamakan kepentingan organisasi dan publik, sesuai aturan, kolaboratif, dan menunjukkan kemauan belajar.",
      },
      {
        q: "Apa saja aspek yang diujikan dalam TKP?",
        a: "Pelayanan publik, jejaring kerja, sosial budaya, teknologi informasi dan komunikasi, profesionalisme, dan anti radikalisme.",
      },
    ],
    cta: CTA_TRYOUT,
    related: ["materi-twk", "manajemen-waktu-hari-h"],
  },

  // ─── 7. Manajemen waktu & hari-H ─────────────────────────────────────────
  {
    slug: "manajemen-waktu-hari-h",
    topic: "strategi",
    title: "Manajemen Waktu 100 Menit dan Persiapan Hari-H SKD",
    category: "Strategi",
    level: "Semua Level",
    excerpt:
      "Pembagian waktu per subtes, urutan pengerjaan yang paling aman, cara memakai fitur tandai ragu, dan checklist persiapan dari H-7 sampai hari ujian.",
    highlights: [
      "Pembagian 100 menit per subtes",
      "Urutan pengerjaan & teknik dua putaran",
      "Checklist H-7 sampai hari ujian",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "Banyak peserta yang sebenarnya mampu lulus justru gagal karena **kehabisan waktu**. Di sistem CAT, kamu bebas berpindah antarsoal dan antarsubtes, sehingga strategi waktu sepenuhnya ada di tanganmu.",
      },
      { t: "h2", text: "Pembagian 100 menit yang realistis" },
      {
        t: "ul",
        items: [
          "**TKP (45 soal): sekitar 25 menit.** Soal sikap tanpa hitungan, bisa dikerjakan cepat.",
          "**TWK (30 soal): sekitar 22 menit.** Soal fakta dijawab cepat, soal kasus dibaca teliti.",
          "**TIU (35 soal): sekitar 43 menit.** Bagian yang paling butuh waktu, terutama numerik dan analitis.",
          "**Cadangan: sekitar 10 menit** untuk memeriksa soal yang ditandai ragu dan mengisi soal kosong.",
        ],
      },
      { t: "h2", text: "Urutan pengerjaan yang paling aman" },
      {
        t: "p",
        text: "Tidak ada urutan wajib, tetapi strategi yang banyak dipakai adalah **TKP, lalu TWK, lalu TIU**. Alasannya, TKP dan TWK bisa dikerjakan cepat dan langsung mengamankan poin, sementara TIU yang paling menyita waktu dikerjakan di akhir dengan sisa waktu yang sudah jelas. Apa pun urutanmu, uji dulu di [tryout](/tryout) agar kamu tahu mana yang paling nyaman.",
      },
      { t: "h2", text: "Teknik dua putaran" },
      {
        t: "ol",
        items: [
          "**Putaran pertama:** kerjakan semua soal yang bisa dijawab dalam waktu kurang dari satu menit. Untuk soal sulit, isi jawaban sementara dan tandai ragu.",
          "**Putaran kedua:** kembali ke soal bertanda ragu, mulai dari yang paling mungkin diselesaikan.",
          "**Dua menit terakhir:** pastikan tidak ada satu pun soal kosong. Ingat, tidak ada nilai minus.",
        ],
      },
      {
        t: "callout",
        title: "Selalu isi jawaban sebelum menandai ragu",
        text: "Jangan menandai soal ragu dalam keadaan kosong. Jika waktu habis sebelum kamu kembali, soal itu bernilai 0. Isi dulu dengan tebakan terbaik, lalu tandai ragu. Fitur tandai ragu dan navigasi soal juga tersedia di tryout CV Pintar, jadi kamu bisa membiasakan diri sejak latihan.",
      },
      { t: "h2", text: "Checklist H-7 sampai hari ujian" },
      {
        t: "ul",
        items: [
          "**H-7:** kerjakan satu tryout penuh 100 menit di jam yang sama dengan jadwal ujianmu agar tubuh terbiasa.",
          "**H-3:** berhenti mempelajari materi baru. Ulangi catatan kesalahan dari tryout sebelumnya.",
          "**H-1:** cek lokasi ujian, dokumen yang diwajibkan sesuai pengumuman instansi, dan tidur cukup. Hindari begadang belajar.",
          "**Hari-H:** sarapan secukupnya, datang lebih awal, dan ikuti arahan panitia. Gunakan kertas buram untuk soal hitungan dan analitis.",
          "**Selama ujian:** jika menemukan soal sulit di awal, jangan panik. Lewati dulu, lalu fokus mengumpulkan poin dari soal yang bisa.",
        ],
      },
    ],
    faq: [
      {
        q: "Urutan mengerjakan SKD yang paling baik?",
        a: "Tidak ada urutan wajib. Strategi populer adalah TKP, lalu TWK, lalu TIU, karena TKP dan TWK lebih cepat dikerjakan. Uji urutan pilihanmu lewat tryout.",
      },
      {
        q: "Berapa lama waktu per soal SKD?",
        a: "Rata-ratanya sekitar 54 detik per soal. Praktiknya, TKP bisa 30 sampai 40 detik, sedangkan TIU sekitar satu menit atau lebih.",
      },
      {
        q: "Bolehkah berpindah-pindah soal saat ujian CAT?",
        a: "Boleh. Kamu bisa berpindah antarsoal dan antarsubtes serta menandai soal ragu selama waktu masih berjalan.",
      },
    ],
    cta: CTA_TRYOUT,
    related: ["strategi-lolos-skd", "jadwal-belajar-30-hari"],
  },

  // ─── 8. Jadwal belajar ───────────────────────────────────────────────────
  {
    slug: "jadwal-belajar-30-hari",
    topic: "strategi",
    title: "Jadwal Belajar SKD 30 Hari: Dari Nol Sampai Siap Ujian",
    category: "Strategi",
    level: "Pemula",
    excerpt:
      "Rencana belajar empat minggu yang menyeimbangkan materi, latihan soal, dan tryout, lengkap dengan cara mengevaluasi hasil tryout.",
    highlights: [
      "Rencana belajar 4 minggu yang terukur",
      "Porsi materi, latihan, dan tryout",
      "Cara mengevaluasi hasil tryout",
    ],
    date: "2026-11-07",
    updated: "2026-11-07",
    body: [
      {
        t: "p",
        text: "Belajar SKD paling efektif dilakukan **sedikit setiap hari**, bukan maraton di akhir pekan. Jadwal ini dirancang untuk satu sampai dua jam per hari, cocok untuk kamu yang belajar sambil bekerja atau kuliah.",
      },
      { t: "h2", text: "Minggu 1: ukur posisi dan bangun fondasi" },
      {
        t: "ul",
        items: [
          "**Hari 1:** kerjakan satu [tryout SKD](/tryout) untuk mengukur posisi awal. Catat skor tiap subtes.",
          "**Hari 2 sampai 4:** pelajari [modul TKP](/belajar-skd/tkp-cara-menjawab) dan latihan 20 soal TKP per hari. TKP adalah subtes yang paling cepat naik.",
          "**Hari 5 sampai 7:** pelajari [materi TWK](/belajar-skd/materi-twk). Buat kartu hafalan untuk tanggal sejarah dan pasal penting.",
        ],
      },
      { t: "h2", text: "Minggu 2: kuasai pola TIU" },
      {
        t: "ul",
        items: [
          "**Hari 8 sampai 9:** [TIU verbal](/belajar-skd/tiu-verbal), fokus pada silogisme dan analogi.",
          "**Hari 10 sampai 12:** [TIU numerik](/belajar-skd/tiu-numerik). Hafalkan tabel pecahan-persen dan latih deret angka setiap hari.",
          "**Hari 13:** [TIU figural](/belajar-skd/tiu-figural).",
          "**Hari 14:** tryout kedua. Bandingkan dengan skor hari pertama.",
        ],
      },
      { t: "h2", text: "Minggu 3: tambal kelemahan" },
      {
        t: "ul",
        items: [
          "Lihat kategori soal dengan persentase benar terendah dari dua tryout terakhir.",
          "Habiskan 70% waktu belajar minggu ini untuk dua sampai tiga kategori terlemah tersebut.",
          "Tetap ulangi kartu hafalan TWK 10 menit per hari agar tidak lupa.",
          "Tutup minggu dengan tryout ketiga.",
        ],
      },
      { t: "h2", text: "Minggu 4: simulasi penuh dan pemantapan" },
      {
        t: "ul",
        items: [
          "Kerjakan tryout penuh **dua hari sekali** dengan kondisi mirip ujian asli: 100 menit tanpa jeda, tanpa kalkulator, dan tanpa ponsel.",
          "Di hari tanpa tryout, pelajari pembahasan setiap soal yang salah, bukan hanya kunci jawabannya.",
          "Latih [strategi waktu dan urutan pengerjaan](/belajar-skd/manajemen-waktu-hari-h) sampai terasa otomatis.",
          "Tiga hari sebelum ujian, berhenti belajar materi baru dan fokus pada istirahat.",
        ],
      },
      { t: "h2", text: "Cara mengevaluasi hasil tryout" },
      {
        t: "ol",
        items: [
          "**Cek passing grade per subtes,** bukan hanya total skor. Subtes yang belum lulus menjadi prioritas utama.",
          "**Pisahkan kesalahan karena tidak tahu dan karena terburu-buru.** Kesalahan karena terburu-buru diperbaiki dengan strategi waktu, bukan dengan menambah materi.",
          "**Baca pembahasan soal yang dijawab benar tapi ragu.** Bisa jadi kamu benar karena kebetulan.",
          "**Pantau tren,** bukan satu angka. Skor yang naik turun itu wajar selama trennya naik.",
        ],
      },
      {
        t: "callout",
        title: "Konsistensi mengalahkan intensitas",
        text: "Satu jam setiap hari selama 30 hari menghasilkan 30 jam belajar yang jauh lebih menempel dibanding 10 jam belajar kebut dalam dua hari. Sisihkan waktu yang sama setiap hari dan jadikan kebiasaan.",
      },
    ],
    faq: [
      {
        q: "Berapa lama waktu ideal persiapan SKD CPNS?",
        a: "Sekitar satu bulan dengan belajar satu sampai dua jam per hari sudah cukup untuk banyak peserta, asalkan rutin dan diselingi tryout berkala.",
      },
      {
        q: "Berapa kali sebaiknya ikut tryout sebelum ujian?",
        a: "Idealnya minimal satu tryout per minggu di awal, lalu dua hari sekali di minggu terakhir, agar kamu terbiasa dengan tekanan waktu dan bisa memantau tren skor.",
      },
      {
        q: "Apa yang harus dilakukan setelah tryout?",
        a: "Cek passing grade per subtes, pelajari pembahasan soal yang salah dan yang dijawab ragu, lalu fokuskan belajar pada kategori dengan persentase benar terendah.",
      },
    ],
    cta: CTA_PAKET,
    related: ["strategi-lolos-skd", "manajemen-waktu-hari-h"],
  },
];

export const skdModulesBySlug: Record<string, SkdModule> = Object.fromEntries(
  skdModules.map((m) => [m.slug, m]),
);
