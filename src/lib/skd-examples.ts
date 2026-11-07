/**
 * Contoh soal + pembahasan untuk setiap modul /belajar-skd, dikunci per slug modul.
 *
 * - Soal pilihan ganda biasa: `answer` = kunci jawaban.
 * - Soal TKP: setiap opsi punya `score` 1–5 (tanpa `answer`).
 * - Soal figural: `figural` → dibuat dari generator SVG (seed tetap, kunci dihitung otomatis).
 *
 * Teks mendukung **tebal** dan [tautan](/path-internal).
 */
import type { FiguralDifficulty, FiguralType } from "./tryout-figural";

export type SkdExampleOption = { key: string; text: string; score?: number };

export type SkdTextExample = {
  /** Premis / bacaan sebelum pertanyaan (opsional). */
  stem?: string[];
  question: string;
  options: SkdExampleOption[];
  answer?: string;
  explanation: string[];
  trick?: string;
};

export type SkdFiguralExample = {
  figural: { type: FiguralType; difficulty: FiguralDifficulty; seed: number };
  /** Penjelasan tambahan setelah penjelasan otomatis dari generator. */
  explanation?: string[];
  trick?: string;
};

export type SkdExample = SkdTextExample | SkdFiguralExample;

const opts = (...texts: string[]): SkdExampleOption[] =>
  texts.map((text, i) => ({ key: "ABCDE"[i], text }));

const scored = (...items: [string, number][]): SkdExampleOption[] =>
  items.map(([text, score], i) => ({ key: "ABCDE"[i], text, score }));

export const skdExamplesBySlug: Record<string, SkdExample[]> = {
  // ─── Strategi lolos SKD ──────────────────────────────────────────────────
  "strategi-lolos-skd": [
    {
      question:
        "Andi memperoleh skor TWK 70, TIU 75, dan TKP 190 (total 335). Dengan passing grade TWK 65, TIU 80, dan TKP 166, bagaimana hasil Andi?",
      options: opts(
        "Lulus, karena total skornya di atas 311",
        "Lulus, karena skor TKP-nya sangat tinggi",
        "Tidak lulus, karena skor TIU di bawah passing grade",
        "Tidak lulus, karena total skornya di bawah 350",
        "Lulus, karena dua dari tiga subtes memenuhi passing grade",
      ),
      answer: "C",
      explanation: [
        "Cek satu per satu: TWK 70 ≥ 65 (lulus), **TIU 75 < 80 (tidak lulus)**, TKP 190 ≥ 166 (lulus).",
        "Peserta wajib memenuhi passing grade di **ketiga** subtes. Total skor setinggi apa pun tidak bisa menutupi satu subtes yang gagal.",
      ],
      trick: "Jangan lihat total skor dulu. Bandingkan tiap subtes dengan passing grade-nya.",
    },
    {
      question:
        "Passing grade TWK adalah 65 dan setiap jawaban benar bernilai 5. Berapa jumlah jawaban benar minimal agar lulus TWK?",
      options: opts("11 soal", "12 soal", "13 soal", "14 soal", "15 soal"),
      answer: "C",
      explanation: [
        "65 ÷ 5 = **13**. Dengan 13 jawaban benar, skor TWK tepat 65.",
        "Dengan cara yang sama, passing grade TIU 80 berarti minimal 80 ÷ 5 = 16 jawaban benar dari 35 soal.",
      ],
      trick: "Bagi passing grade dengan 5 untuk tahu target jawaban benar minimal di TWK dan TIU.",
    },
    {
      question:
        "Rina menjawab 35 soal TIU dengan rincian 20 benar, 10 salah, dan 5 kosong. Berapa skor TIU Rina?",
      options: opts("90", "100", "95", "85", "110"),
      answer: "B",
      explanation: [
        "Hanya jawaban benar yang mendapat nilai: 20 × 5 = **100**.",
        "Jawaban salah dan kosong sama-sama bernilai 0, **tidak ada pengurangan nilai**. Skor 100 juga sudah melewati passing grade TIU 80.",
        "Andai 5 soal kosong tadi diisi tebakan, Rina punya peluang menambah skor tanpa risiko kehilangan poin.",
      ],
      trick: "Tidak ada nilai minus, jadi soal kosong adalah poin yang terbuang. Isi semuanya.",
    },
  ],

  // ─── TWK ─────────────────────────────────────────────────────────────────
  "materi-twk": [
    {
      question: "Hari Lahir Pancasila diperingati setiap tanggal …",
      options: opts("18 Agustus", "1 Oktober", "1 Juni", "22 Juni", "29 Mei"),
      answer: "C",
      explanation: [
        "**1 Juni** merujuk pada pidato Soekarno di sidang BPUPKI tanggal 1 Juni 1945 yang pertama kali memperkenalkan istilah Pancasila.",
        "Pengecohnya sama-sama tanggal penting: 29 Mei (awal sidang BPUPKI), 22 Juni (Piagam Jakarta), 18 Agustus (pengesahan UUD 1945 oleh PPKI), dan 1 Oktober (Hari Kesaktian Pancasila).",
      ],
      trick:
        "Soal tanggal sering memakai pengecoh dari rangkaian peristiwa yang sama. Hafalkan sebagai garis waktu, bukan tanggal terpisah.",
    },
    {
      question:
        "Ketentuan bahwa setiap warga negara berhak dan wajib ikut serta dalam upaya pembelaan negara tercantum dalam UUD 1945 …",
      options: opts(
        "Pasal 27 ayat (3)",
        "Pasal 30 ayat (1)",
        "Pasal 28E",
        "Pasal 31 ayat (1)",
        "Pasal 1 ayat (3)",
      ),
      answer: "A",
      explanation: [
        "**Pasal 27 ayat (3)** mengatur hak dan kewajiban warga negara dalam **upaya pembelaan negara**.",
        "Pengecoh terkuat adalah Pasal 30 ayat (1), yang mengatur hak dan kewajiban ikut serta dalam usaha **pertahanan dan keamanan** negara. Pasal 31 ayat (1) tentang pendidikan, Pasal 28E tentang kebebasan beragama dan berserikat, dan Pasal 1 ayat (3) tentang negara hukum.",
      ],
      trick:
        "Bedakan kata kuncinya: pembelaan negara → Pasal 27 (3); pertahanan dan keamanan → Pasal 30.",
    },
    {
      question:
        "Kamu bertugas di bagian pengadaan barang. Menjelang hari raya, salah satu vendor yang sedang mengikuti tender mengirimkan parsel mahal ke rumahmu. Sikap yang paling tepat adalah …",
      options: opts(
        "Menerimanya, karena parsel hari raya adalah hal yang wajar",
        "Menerimanya, lalu membagikan isinya kepada rekan kerja",
        "Menolak atau mengembalikan parsel, lalu melaporkannya sesuai ketentuan gratifikasi",
        "Menerimanya, tetapi memastikan vendor tersebut tidak dimenangkan",
        "Membiarkan parsel itu tanpa membukanya sampai tender selesai",
      ),
      answer: "C",
      explanation: [
        "Soal ini menguji **integritas**. Pemberian dari pihak yang berkepentingan dengan jabatanmu termasuk gratifikasi dan bisa memengaruhi keputusan.",
        "Sikap yang benar adalah **menolak atau mengembalikan dan melaporkannya** melalui jalur resmi, misalnya unit pengendalian gratifikasi di instansi atau KPK.",
        "Opsi B dan D tetap berarti menerima gratifikasi, sedangkan opsi E hanya menunda masalah.",
      ],
      trick:
        "Pada soal integritas, pilih jawaban yang menolak konflik kepentingan sejak awal dan melapor lewat jalur resmi.",
    },
  ],

  // ─── TIU verbal ──────────────────────────────────────────────────────────
  "tiu-verbal": [
    {
      question: "PENA : MENULIS = … : …",
      options: opts(
        "Gunting : Kertas",
        "Petani : Sawah",
        "Kuas : Melukis",
        "Buku : Perpustakaan",
        "Guru : Murid",
      ),
      answer: "C",
      explanation: [
        "Buat kalimat penghubung: **pena adalah alat untuk menulis**.",
        "Uji ke opsi: kuas adalah alat untuk melukis (cocok). Gunting : kertas adalah alat dan objeknya, petani : sawah adalah pelaku dan tempat, buku : perpustakaan adalah benda dan tempat, guru : murid adalah hubungan antarpelaku.",
      ],
      trick: "Ubah pasangan kata menjadi satu kalimat, lalu tempelkan kalimat itu ke setiap opsi.",
    },
    {
      stem: [
        "Semua pegawai yang disiplin mendapat bonus.",
        "Sebagian pegawai bagian keuangan disiplin.",
      ],
      question: "Kesimpulan yang paling tepat adalah …",
      options: opts(
        "Semua pegawai bagian keuangan mendapat bonus",
        "Sebagian pegawai bagian keuangan mendapat bonus",
        "Semua pegawai yang mendapat bonus bekerja di bagian keuangan",
        "Sebagian pegawai bagian keuangan tidak disiplin",
        "Tidak dapat ditarik kesimpulan",
      ),
      answer: "B",
      explanation: [
        "Polanya: **Semua A adalah B. Sebagian C adalah A.** Kesimpulannya: **sebagian C adalah B**.",
        "A = pegawai disiplin, B = mendapat bonus, C = pegawai keuangan. Jadi sebagian pegawai keuangan mendapat bonus.",
        "Opsi D terdengar logis, tetapi premis tidak menyebut apa pun tentang pegawai keuangan yang tidak disiplin, sehingga tidak bisa dipastikan.",
      ],
      trick:
        "Kata sebagian di premis membuat kesimpulan juga memakai kata sebagian. Jangan menambah informasi di luar premis.",
    },
    {
      stem: [
        "Andi, Budi, Citra, Dimas, dan Eka duduk berjajar di lima kursi dari kiri ke kanan.",
        "Budi duduk paling kanan. Eka duduk tepat di tengah. Citra duduk tepat di sebelah kiri Budi. Andi tidak duduk paling kiri.",
      ],
      question: "Siapa yang duduk paling kiri?",
      options: opts("Andi", "Citra", "Dimas", "Eka", "Budi"),
      answer: "C",
      explanation: [
        "Isi syarat yang pasti dulu: Budi di kursi 5, Eka di kursi 3.",
        "Citra tepat di kiri Budi, berarti Citra di kursi 4. Kursi 1 dan 2 tersisa untuk Andi dan Dimas.",
        "Andi tidak paling kiri, jadi Andi di kursi 2 dan **Dimas di kursi 1**. Susunannya: Dimas, Andi, Eka, Citra, Budi.",
      ],
      trick: "Gambar lima kotak di kertas buram, isi syarat pasti lebih dulu, baru syarat relatif.",
    },
  ],

  // ─── TIU numerik ─────────────────────────────────────────────────────────
  "tiu-numerik": [
    {
      question: "3, 4, 8, 17, 33, …",
      options: opts("49", "54", "58", "62", "66"),
      answer: "C",
      explanation: [
        "Tulis selisih antarsuku: +1, +4, +9, +16. Selisihnya adalah bilangan kuadrat (1², 2², 3², 4²).",
        "Selisih berikutnya 5² = 25, sehingga 33 + 25 = **58**.",
      ],
      trick:
        "Jika selisih pertama tidak tetap, periksa apakah selisihnya membentuk pola sendiri, seperti bilangan ganjil atau kuadrat.",
    },
    {
      question:
        "Harga sebuah tas Rp240.000 dan mendapat diskon 37,5%. Berapa harga tas setelah diskon?",
      options: opts("Rp140.000", "Rp150.000", "Rp160.000", "Rp165.000", "Rp90.000"),
      answer: "B",
      explanation: [
        "37,5% = **3/8**. Besar diskon: 3/8 × 240.000 = 90.000.",
        "Harga setelah diskon: 240.000 − 90.000 = **Rp150.000**. Lebih cepat lagi: bayar 5/8 × 240.000 = 150.000.",
        "Opsi E (Rp90.000) adalah jebakan, karena itu besar diskonnya, bukan harga akhirnya.",
      ],
      trick:
        "Ubah persen ke pecahan (12,5% = 1/8, 37,5% = 3/8). Hitungannya jadi pembagian sederhana.",
    },
    {
      question:
        "Andi dapat menyelesaikan sebuah pekerjaan dalam 6 hari, sedangkan Budi dalam 12 hari. Jika dikerjakan bersama-sama, pekerjaan itu selesai dalam …",
      options: opts("3 hari", "4 hari", "5 hari", "6 hari", "9 hari"),
      answer: "B",
      explanation: [
        "Rumus pekerjaan bersama: (a × b) ÷ (a + b) = (6 × 12) ÷ (6 + 12) = 72 ÷ 18 = **4 hari**.",
        "Cara lain: dalam sehari Andi menyelesaikan 1/6 dan Budi 1/12 pekerjaan. Bersama: 1/6 + 1/12 = 3/12 = 1/4, jadi selesai dalam 4 hari.",
        "Opsi E (9 hari) adalah rata-rata biasa, jebakan yang sering dipilih. Bekerja bersama pasti lebih cepat daripada orang tercepat.",
      ],
      trick:
        "Jawaban pekerjaan bersama selalu lebih kecil dari waktu orang tercepat. Opsi yang lebih besar dari 6 hari bisa langsung dicoret.",
    },
  ],

  // ─── TIU figural ─────────────────────────────────────────────────────────
  "tiu-figural": [
    {
      figural: { type: "serial", difficulty: "medium", seed: 101 },
      trick:
        "Lacak satu atribut dulu (misalnya arah panah) dari gambar pertama ke terakhir, coret opsi yang salah, lalu lanjut ke atribut berikutnya.",
    },
    {
      figural: { type: "analogi", difficulty: "medium", seed: 202 },
      trick:
        "Tulis perubahan dari gambar pertama ke kedua dengan kata singkat, misalnya titik geser satu sudut dan arsiran pindah sisi, lalu terapkan ke gambar ketiga.",
    },
    {
      figural: { type: "ketidaksamaan", difficulty: "medium", seed: 303 },
      trick:
        "Cari aturan yang berlaku untuk empat gambar sekaligus. Gambar yang melanggar aturan itu adalah jawabannya.",
    },
  ],

  // ─── TKP ─────────────────────────────────────────────────────────────────
  "tkp-cara-menjawab": [
    {
      question:
        "Lima menit sebelum loket pelayanan ditutup, seorang warga lanjut usia datang untuk mengurus dokumen yang mendesak, padahal nomor antrean sudah habis. Sikap Anda …",
      options: scored(
        ["Meminta warga tersebut datang kembali besok pagi", 2],
        ["Melayani warga tersebut sampai selesai dan memastikan berkasnya lengkap", 5],
        ["Mengarahkan warga tersebut ke rekan yang masih bertugas di loket lain", 3],
        ["Menerima berkasnya dan berjanji memprosesnya besok pagi", 4],
        ["Menolak dengan tegas karena aturan jam layanan harus ditegakkan", 1],
      ),
      explanation: [
        "Aspek yang diuji: **pelayanan publik**. Jawaban terbaik langsung menyelesaikan kebutuhan masyarakat yang mendesak.",
        "Urutan skornya: melayani sampai selesai (5) → menerima berkas untuk diproses besok (4) → mengalihkan ke rekan (3) → meminta datang lagi (2) → menolak dengan tegas (1).",
      ],
      trick:
        "Pada soal pelayanan, opsi yang menyelesaikan masalah warga saat itu juga hampir selalu bernilai tertinggi.",
    },
    {
      question:
        "Anda ditugaskan dalam proyek lintas divisi, tetapi belum mengenal anggota tim dari divisi lain. Sikap Anda …",
      options: scored(
        ["Menunggu anggota tim lain memulai perkenalan", 1],
        ["Berkenalan seperlunya hanya ketika rapat", 2],
        ["Bertanya kepada atasan tentang latar belakang anggota tim", 3],
        ["Menyapa dan berkenalan dengan anggota tim saat ada kesempatan", 4],
        ["Berinisiatif mengajak tim berkenalan dan menyepakati cara koordinasi bersama", 5],
      ),
      explanation: [
        "Aspek yang diuji: **jejaring kerja**. Skor tertinggi diberikan pada sikap yang proaktif membangun relasi sekaligus memperlancar kerja sama tim.",
        "Opsi E bernilai 5 karena bukan hanya berkenalan, tetapi juga membangun koordinasi. Menunggu orang lain memulai (A) adalah sikap paling pasif.",
      ],
      trick:
        "Bedakan tingkat inisiatif: menunggu < seperlunya < bertanya ke atasan < menyapa < memimpin inisiatif bersama.",
    },
    {
      question:
        "Atasan memberikan tugas mendesak, padahal pekerjaan Anda sendiri belum selesai dan tenggatnya sama-sama hari ini. Sikap Anda …",
      options: scored(
        ["Menolak tugas tersebut karena pekerjaan sendiri belum selesai", 1],
        ["Mengerjakan tugas atasan dan menunda pekerjaan sendiri tanpa memberi tahu siapa pun", 2],
        [
          "Menyusun prioritas, mengerjakan keduanya, dan mengomunikasikan perkiraan waktu selesai kepada atasan",
          5,
        ],
        ["Meminta rekan kerja mengerjakan salah satu tugas", 3],
        ["Lembur untuk menyelesaikan keduanya tanpa mengubah rencana kerja", 4],
      ),
      explanation: [
        "Aspek yang diuji: **profesionalisme**. Sikap ideal bertanggung jawab atas semua tugas sambil menjaga komunikasi.",
        "Opsi C bernilai 5 karena ada pengaturan prioritas dan komunikasi. Lembur (E) menunjukkan tanggung jawab tetapi tanpa komunikasi, sedangkan menolak tugas (A) bernilai paling rendah.",
      ],
      trick:
        "Jika dua opsi sama-sama bertanggung jawab, pilih yang juga melibatkan komunikasi dan perencanaan.",
    },
  ],

  // ─── Manajemen waktu & hari-H ────────────────────────────────────────────
  "manajemen-waktu-hari-h": [
    {
      question:
        "Waktu ujian tersisa 2 menit dan masih ada 6 soal TIU yang belum terjawab. Tindakan terbaik adalah …",
      options: opts(
        "Mengerjakan satu soal dengan teliti sampai yakin benar",
        "Membiarkannya kosong agar tidak menjawab salah",
        "Mengisi semua soal yang kosong dengan tebakan terbaik",
        "Memeriksa ulang jawaban TKP",
        "Mengakhiri ujian lebih awal",
      ),
      answer: "C",
      explanation: [
        "Jawaban salah dan kosong sama-sama bernilai 0, jadi menebak **tidak punya risiko**. Dengan lima opsi, setiap tebakan punya peluang sekitar 20% untuk benar.",
        "Mengerjakan satu soal dengan teliti (A) berisiko membuat lima soal lain tetap kosong.",
      ],
      trick: "Sisakan dua menit terakhir khusus untuk memastikan tidak ada satu pun soal kosong.",
    },
    {
      question:
        "Anda sudah menghabiskan dua menit untuk satu soal analitis dan belum menemukan jawabannya. Apa yang sebaiknya dilakukan?",
      options: opts(
        "Terus mengerjakan sampai ketemu karena sudah setengah jalan",
        "Mengisi jawaban sementara, menandai ragu, lalu lanjut ke soal berikutnya",
        "Mengosongkan soal dan menandai ragu",
        "Kembali ke soal pertama untuk memeriksa semua jawaban",
        "Mengulang membaca soal dari awal sekali lagi",
      ),
      answer: "B",
      explanation: [
        "Rata-rata waktu per soal SKD hanya sekitar 54 detik. Bertahan di satu soal sulit mengorbankan beberapa soal mudah.",
        "Isi dulu jawaban sementara agar soal tidak bernilai 0 jika waktu habis, tandai ragu, lalu kembali di **putaran kedua**.",
        "Opsi C tampak mirip, tetapi soal yang ditandai dalam keadaan kosong tetap bernilai 0 jika kamu tidak sempat kembali.",
      ],
      trick: "Aturan praktis: lebih dari 90 detik di satu soal → isi, tandai ragu, pindah.",
    },
    {
      question:
        "Anda menargetkan menyelesaikan 45 soal TKP dalam 25 menit. Berapa rata-rata waktu per soal yang harus dijaga?",
      options: opts("25 detik", "30 detik", "Sekitar 33 detik", "40 detik", "45 detik"),
      answer: "C",
      explanation: [
        "25 menit = 1.500 detik. 1.500 ÷ 45 ≈ **33 detik** per soal.",
        "Dengan ritme ini, TKP selesai cepat dan sisa waktu bisa dipakai untuk TIU yang lebih berat.",
      ],
      trick:
        "Ubah target menit ke detik, lalu bagi dengan jumlah soal. Hafalkan angka ritmemu sebelum ujian.",
    },
  ],

  // ─── Jadwal belajar 30 hari ──────────────────────────────────────────────
  "jadwal-belajar-30-hari": [
    {
      question:
        "Hasil tryout pertamamu: TWK 60, TIU 95, TKP 170. Subtes mana yang menjadi prioritas belajar minggu depan?",
      options: opts(
        "TIU, karena skornya paling tinggi dan bisa dimaksimalkan",
        "TKP, karena subtes ini paling cepat naik",
        "TWK, karena satu-satunya subtes yang belum memenuhi passing grade",
        "Ketiganya dengan porsi yang sama rata",
        "Tidak perlu belajar, cukup perbanyak tryout",
      ),
      answer: "C",
      explanation: [
        "Bandingkan dengan passing grade: TWK 60 < 65 (belum lulus), TIU 95 ≥ 80, TKP 170 ≥ 166.",
        "Satu subtes gagal berarti tidak lulus SKD, jadi **TWK menjadi prioritas utama**. Meski TKP sudah lulus, posisinya tipis (hanya 4 poin di atas batas), jadi tetap perlu dijaga.",
      ],
      trick:
        "Prioritas belajar = subtes yang paling jauh dari passing grade, bukan subtes favoritmu.",
    },
    {
      question:
        "Setelah membaca pembahasan, kamu sadar banyak soal salah padahal sebenarnya kamu tahu jawabannya, karena terburu-buru. Cara memperbaikinya adalah …",
      options: opts(
        "Menambah jam belajar materi baru",
        "Melatih strategi waktu dan membaca soal sampai tuntas sebelum menjawab",
        "Mengurangi frekuensi tryout",
        "Menghafal kunci jawaban tryout sebelumnya",
        "Hanya berlatih soal tanpa timer",
      ),
      answer: "B",
      explanation: [
        "Kesalahan karena terburu-buru bukan masalah materi, melainkan **strategi dan ketelitian**.",
        "Latih teknik dua putaran dan kebiasaan membaca pertanyaan sampai tuntas, termasuk kata seperti KECUALI atau TIDAK.",
      ],
      trick:
        "Saat evaluasi, beri tanda berbeda untuk salah karena tidak tahu dan salah karena terburu-buru. Obatnya berbeda.",
    },
    {
      question:
        "Total skor empat tryout terakhirmu berturut-turut: 290, 315, 305, 330. Kesimpulan yang paling tepat adalah …",
      options: opts(
        "Kemampuanmu menurun karena skor tryout ketiga turun",
        "Trennya naik meski sempat turun, jadi lanjutkan pola belajar sambil menambal kelemahan",
        "Skormu stagnan dan tidak berkembang",
        "Kamu harus mengganti seluruh metode belajar",
        "Tidak bisa disimpulkan apa pun dari data ini",
      ),
      answer: "B",
      explanation: [
        "Dari 290 ke 330 ada kenaikan **40 poin** dalam empat tryout. Penurunan sesaat di tryout ketiga wajar, karena tingkat kesulitan tiap set berbeda.",
        "Yang perlu dipantau adalah tren, bukan satu angka.",
      ],
      trick:
        "Bandingkan skor terbaru dengan rata-rata dua sampai tiga tryout sebelumnya, bukan hanya dengan tryout terakhir.",
    },
  ],
};
