/**
 * Data artikel Tips Interview — SATU sumber untuk halaman artikel, daftar tips, dan sitemap.
 * Bentuknya sama dengan artikel blog (lihat `blog-posts.ts`) sehingga memakai komponen yang sama.
 *
 * Inline di dalam teks: **tebal** dan [teks tautan](/path-internal).
 */
import type { BlogPost } from "./blog-posts";

export type TipIconName =
  | "GraduationCap"
  | "MessageSquare"
  | "Laptop"
  | "CircleDollarSign"
  | "Sparkles"
  | "Target";

export type TipPost = BlogPost & {
  icon: TipIconName;
  /** Tingkat pembaca: Pemula, Menengah, atau Semua Level. */
  level: string;
};

const CTA_PRACTICE = {
  title: "Jawaban siap, CV-nya sudah siap juga?",
  text: "Interview hanya terjadi kalau CV-mu lolos tahap awal. Buat CV ATS friendly di CV Pintar, lalu latih jawabanmu dengan Simulasi Wawancara AI.",
  label: "Mulai Gratis",
  to: "/register",
};

export const tipPosts: TipPost[] = [
  {
    slug: "persiapan-interview-pertama",
    title: "Persiapan Interview Pertama untuk Fresh Graduate",
    category: "Fresh Graduate",
    excerpt:
      "Riset perusahaan, latihan jawaban STAR, dan tips berpakaian untuk interview pertamamu.",
    icon: "GraduationCap",
    level: "Pemula",
    date: "2026-05-01",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: "Interview pertama hampir selalu terasa menegangkan, karena kamu belum punya bayangan seperti apa prosesnya. Kabar baiknya, rekruter tidak berharap fresh graduate punya pengalaman kerja bertahun-tahun. Yang mereka nilai adalah **kesiapan, cara berpikir, dan sikap belajar**, dan semuanya bisa dipersiapkan.",
      },
      {
        t: "p",
        text: "Panduan ini merangkum langkah persiapan dari satu minggu sebelum interview sampai hari-H, lengkap dengan daftar barang yang perlu dibawa.",
      },
      { t: "h2", text: "Riset perusahaan: jangan datang tanpa bekal" },
      {
        t: "p",
        text: 'Pertanyaan "Apa yang kamu ketahui tentang perusahaan kami?" muncul di hampir setiap interview. Kandidat yang menjawab dengan spesifik langsung terlihat berbeda dari yang hanya membaca nama perusahaan di lowongan. Sisihkan minimal 30 menit untuk riset.',
      },
      {
        t: "ul",
        items: [
          "**Produk dan pelanggan.** Apa yang dijual perusahaan, ke siapa, dan apa yang membuatnya berbeda dari pesaing.",
          "**Budaya dan nilai.** Baca halaman Tentang Kami, akun LinkedIn, dan unggahan terbaru perusahaan.",
          "**Berita terkini.** Peluncuran produk, ekspansi, atau pendanaan baru bisa menjadi bahan obrolan yang membuatmu terlihat serius.",
          "**Pewawancara.** Kalau namanya diberi tahu, lihat profil LinkedIn-nya untuk memahami latar belakangnya.",
        ],
      },
      {
        t: "p",
        text: "Baca lagi deskripsi lowongan dan tandai tiga kebutuhan utama. Siapkan satu contoh nyata dari kuliah, organisasi, magang, atau proyek pribadi untuk masing-masing kebutuhan itu.",
      },
      { t: "h2", text: "Siapkan cerita dengan metode STAR" },
      {
        t: "p",
        text: "Fresh graduate sering bingung menjawab pertanyaan pengalaman karena merasa belum punya apa-apa. Padahal tugas kelompok, kepanitiaan, magang, dan kegiatan sukarela adalah bahan yang bagus, selama diceritakan dengan struktur yang jelas. Metode STAR (Situation, Task, Action, Result) membantumu menyusunnya. Pelajari selengkapnya di [panduan metode STAR](/tips-interview/behavioral-star-method).",
      },
      {
        t: "callout",
        title: "Target persiapan",
        text: "Siapkan 3–5 cerita singkat: satu tentang kerja sama tim, satu tentang menyelesaikan masalah, satu tentang belajar hal baru, dan satu tentang menghadapi kegagalan. Cerita yang sama bisa dipakai untuk beberapa pertanyaan.",
      },
      { t: "h2", text: "Latih jawaban untuk pertanyaan umum" },
      {
        t: "p",
        text: "Hampir semua interview HR dibuka dengan perkenalan diri dan alasan melamar. Latih jawabannya dengan suara keras, bukan hanya dibaca dalam hati, karena lancar menulis belum tentu lancar berbicara. Daftar pertanyaan dan contoh jawabannya ada di [10 pertanyaan HR yang paling sering ditanyakan](/tips-interview/pertanyaan-hr-umum).",
      },
      {
        t: "p",
        text: 'Rekam dirimu lewat ponsel, lalu perhatikan tiga hal: apakah jawaban terlalu panjang, apakah kamu terlalu banyak mengucap "eh" atau "mm", dan apakah kamu menatap kamera atau layar dengan tenang. Simulasi Wawancara AI di CV Pintar juga bisa dipakai sebagai lawan latihan kapan saja.',
      },
      { t: "h2", text: "Berpakaian dan sikap di hari-H" },
      {
        t: "ul",
        items: [
          "**Berpakaian satu tingkat lebih rapi** dari budaya kantornya. Kalau kantor berpakaian business casual, pilih semi-formal.",
          "**Datang 10–15 menit lebih awal.** Untuk interview daring, masuk ke ruang rapat 5 menit sebelum jadwal dan cek kamera serta mikrofon.",
          "**Sapa dengan senyum**, jabat tangan dengan mantap, dan jaga kontak mata secara wajar.",
          "**Matikan suara ponsel** sepenuhnya, bukan hanya getar.",
          "**Hindari parfum menyengat** dan aksesori yang berisik.",
        ],
      },
      { t: "h2", text: "Checklist sebelum berangkat" },
      {
        t: "ul",
        items: [
          "CV yang dicetak, 2–3 lembar cadangan.",
          "Portofolio atau contoh karya yang relevan (desain, kode, tulisan).",
          "Ijazah dan transkrip nilai, jika diminta.",
          "Sertifikat pelatihan atau workshop yang mendukung lamaran.",
          "KTP atau kartu identitas lain.",
          "Catatan berisi pertanyaan yang ingin kamu ajukan ke pewawancara.",
        ],
      },
      { t: "h2", text: "Setelah interview selesai" },
      {
        t: "p",
        text: "Kirim email ucapan terima kasih singkat dalam 24 jam. Cukup tiga kalimat: terima kasih atas waktunya, satu hal yang menarik dari pembicaraan tadi, dan penegasan bahwa kamu tertarik dengan posisinya. Langkah kecil ini jarang dilakukan kandidat lain, sehingga mudah diingat.",
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Persiapan yang baik mengubah rasa gugup menjadi percaya diri. Riset perusahaan, siapkan cerita dengan struktur STAR, latih jawaban dengan suara, dan datang dengan perlengkapan lengkap. Kamu tidak harus sempurna, cukup terlihat siap, jujur, dan mau belajar.",
      },
    ],
    faq: [
      {
        q: "Berapa lama sebaiknya persiapan sebelum interview pertama?",
        a: "Idealnya 3–7 hari. Hari pertama untuk riset perusahaan dan lowongan, lalu beberapa hari untuk menyusun cerita STAR dan latihan menjawab dengan suara. Sehari sebelumnya cukup untuk mengulang dan menyiapkan perlengkapan.",
      },
      {
        q: "Bagaimana kalau aku belum punya pengalaman kerja sama sekali?",
        a: "Gunakan pengalaman lain: organisasi kampus, kepanitiaan, tugas kelompok, proyek pribadi, magang, atau kegiatan sukarela. Rekruter untuk posisi fresh graduate paling memperhatikan sikap belajar dan kemampuan bekerja sama.",
      },
      {
        q: "Apakah wajib mengenakan pakaian formal?",
        a: "Tidak selalu. Cari tahu budaya perusahaan lewat media sosial dan situs resminya, lalu berpakaianlah satu tingkat lebih rapi. Kalau ragu, pilih kemeja atau blus rapi dengan celana atau rok yang sopan.",
      },
      {
        q: "Apa yang dilakukan kalau lupa jawaban di tengah interview?",
        a: "Tarik napas, minta waktu sejenak untuk berpikir, atau minta pertanyaannya diulang. Pewawancara menilai ketenanganmu, bukan hanya kelancaran jawabanmu.",
      },
    ],
    cta: CTA_PRACTICE,
    related: ["pertanyaan-hr-umum", "behavioral-star-method", "pertanyaan-balik-ke-hr"],
  },
  {
    slug: "pertanyaan-hr-umum",
    title: "10 Pertanyaan HR Paling Sering Ditanyakan & Cara Jawabnya",
    category: "HR Interview",
    excerpt:
      "Dari 'Ceritakan tentang diri Anda' sampai 'Apa kelemahan Anda', lengkap dengan contoh jawaban yang meyakinkan.",
    icon: "MessageSquare",
    level: "Semua Level",
    date: "2026-05-02",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: "Interview HR punya pola yang cukup konsisten. Walaupun perusahaannya berbeda, pertanyaan yang diajukan hampir selalu berputar di sekitar siapa kamu, kenapa melamar, dan bagaimana caramu bekerja. Artinya, kamu bisa mempersiapkannya jauh-jauh hari.",
      },
      {
        t: "p",
        text: "Berikut sepuluh pertanyaan yang paling sering muncul, apa yang sebenarnya ingin diketahui HR, dan cara menjawabnya. Contoh jawaban hanya kerangka, jadi ganti isinya dengan pengalamanmu sendiri.",
      },
      { t: "h2", text: '1. "Ceritakan tentang diri Anda"' },
      {
        t: "p",
        text: "Ini bukan ajakan membacakan riwayat hidup. HR ingin tahu apakah kamu bisa merangkum diri secara singkat dan relevan. Gunakan rumus **posisi sekarang + pengalaman paling relevan + alasan tertarik pada posisi ini**, dengan durasi 60–90 detik.",
      },
      {
        t: "callout",
        title: "Contoh kerangka",
        text: '"Saya backend developer dengan tiga tahun pengalaman di Go dan Python. Terakhir saya membangun layanan pesanan e-commerce yang melayani lebih dari 100 ribu pengguna. Saya tertarik pada posisi ini karena fokusnya pada skalabilitas, bidang yang ingin saya dalami."',
      },
      { t: "h2", text: '2. "Apa kelebihan dan kelemahan Anda?"' },
      {
        t: "p",
        text: 'Untuk kelebihan, sebut dua atau tiga yang relevan dengan posisi, masing-masing dengan contoh nyata. "Saya pekerja keras" tanpa bukti tidak menambah nilai apa pun.',
      },
      {
        t: "p",
        text: 'Untuk kelemahan, pilih yang nyata tetapi tidak krusial untuk pekerjaan itu, lalu jelaskan langkah perbaikannya. Misalnya: "Saya masih kurang familiar dengan tool X, dan sekarang sedang mengikuti kursus untuk mengejarnya." Hindari jawaban klise seperti "Saya terlalu perfeksionis" tanpa penjelasan.',
      },
      { t: "h2", text: '3. "Kenapa ingin bergabung dengan kami?"' },
      {
        t: "p",
        text: 'Jangan menjawab "karena gajinya besar" atau "karena saya butuh pekerjaan", walaupun itu jujur. Pakai tiga komponen: **industri yang kamu minati**, **hal spesifik tentang perusahaan**, dan **kontribusi yang bisa kamu berikan**. Jawaban yang spesifik hanya mungkin kalau kamu sudah riset.',
      },
      { t: "h2", text: '4. "Di mana Anda melihat diri Anda lima tahun lagi?"' },
      {
        t: "p",
        text: "HR menguji apakah kamu punya arah dan apakah arah itu sejalan dengan posisi yang dilamar. Tunjukkan rencana belajar yang masuk akal, misalnya mendalami satu bidang dalam dua tahun, lalu siap memimpin tim kecil atau menjadi spesialis. Untuk posisi pemula, tekankan pertumbuhan. Untuk posisi senior, tekankan dampak.",
      },
      { t: "h2", text: '5. "Ceritakan pengalaman sulit dan cara mengatasinya"' },
      {
        t: "p",
        text: "Gunakan [metode STAR](/tips-interview/behavioral-star-method). Pilih cerita yang berakhir baik, fokus pada hal yang bisa kamu kendalikan, dan jangan menyalahkan orang lain. Ini menunjukkan rasa tanggung jawab dan kedewasaan.",
      },
      { t: "h2", text: '6. "Bagaimana Anda menghadapi tekanan atau tenggat ketat?"' },
      {
        t: "p",
        text: "HR mencari kandidat yang tetap tenang dan bisa menentukan prioritas, bukan yang mengaku tidak pernah stres. Ceritakan satu situasi nyata: apa tekanannya, bagaimana kamu memprioritaskan dan berkomunikasi dengan pihak terkait, dan hasilnya. Sebut juga kebiasaan sehatmu, seperti membuat daftar prioritas dan memberi kabar lebih awal kalau ada risiko terlambat.",
      },
      { t: "h2", text: '7. "Kenapa Anda keluar dari pekerjaan sebelumnya?"' },
      {
        t: "p",
        text: "Jangan menjelekkan atasan atau perusahaan lama. Sampaikan alasan yang berorientasi ke depan: ingin tantangan baru, ingin mendalami bidang tertentu, atau perusahaan sebelumnya sudah tidak punya jalur pengembangan yang sesuai. Nada yang positif menunjukkan kamu profesional.",
      },
      { t: "h2", text: '8. "Bagaimana Anda bekerja dalam tim?"' },
      {
        t: "p",
        text: 'Jawab dengan contoh, bukan klaim. Ceritakan peranmu dalam sebuah tim, bagaimana kamu menangani perbedaan pendapat, dan apa yang tim capai bersama. Gunakan kata "saya" untuk bagianmu dan "kami" untuk hasil tim, supaya kontribusimu jelas.',
      },
      { t: "h2", text: '9. "Berapa ekspektasi gaji Anda?"' },
      {
        t: "p",
        text: "Jangan menyebut angka sebelum riset. Pelajari kisaran pasar untuk posisi dan kotamu, lalu sebut rentang, bukan angka tunggal. Strategi lengkapnya ada di [cara negosiasi gaji](/tips-interview/negosiasi-gaji).",
      },
      { t: "h2", text: '10. "Ada pertanyaan untuk kami?"' },
      {
        t: "p",
        text: 'Jawaban "tidak ada" terkesan kurang tertarik. Siapkan tiga sampai lima pertanyaan tentang onboarding, tantangan tim, dan ukuran keberhasilan posisi ini. Contoh yang bagus ada di [5 pertanyaan cerdas untuk HR](/tips-interview/pertanyaan-balik-ke-hr).',
      },
      { t: "h2", text: "Kesalahan yang paling sering terjadi" },
      {
        t: "ul",
        items: [
          "**Menghafal jawaban kata demi kata**, sehingga terdengar seperti membaca naskah. Hafalkan kerangkanya saja.",
          "**Menjawab terlalu panjang.** Sebagian besar jawaban cukup 1–2 menit.",
          "**Tidak punya contoh konkret.** Klaim tanpa bukti mudah dilupakan.",
          "**Menjelekkan perusahaan lama.** Satu kalimat negatif bisa mengubah kesan keseluruhan.",
        ],
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Sepuluh pertanyaan ini mencakup sebagian besar interview HR. Siapkan kerangka jawaban untuk masing-masing, isi dengan pengalamanmu sendiri, lalu latih dengan suara sampai terdengar natural. Semakin sering berlatih, semakin kecil kemungkinanmu terkejut di hari interview.",
      },
    ],
    faq: [
      {
        q: "Apakah boleh membawa catatan saat interview?",
        a: "Untuk interview tatap muka, catatan kecil berisi pertanyaan yang ingin kamu ajukan boleh dibawa. Jangan membaca jawaban dari catatan. Untuk interview daring, hindari terlihat membaca dari layar karena mata akan tampak bergerak.",
      },
      {
        q: "Bagaimana menjawab pertanyaan kelemahan dengan jujur tapi aman?",
        a: "Pilih kelemahan nyata yang tidak menjadi syarat utama posisi, lalu tunjukkan langkah perbaikan yang sedang kamu lakukan. Yang dinilai adalah kesadaran diri dan kemauan berkembang.",
      },
      {
        q: "Berapa lama durasi jawaban yang ideal?",
        a: "Sekitar 1–2 menit untuk sebagian besar pertanyaan, dan hingga 3 menit untuk pertanyaan berbasis cerita. Jawaban yang terlalu singkat kurang meyakinkan, yang terlalu panjang membuat pewawancara kehilangan fokus.",
      },
      {
        q: "Bagaimana kalau aku gugup dan jawabanku berantakan?",
        a: "Wajar. Jeda sebentar, tarik napas, lalu jawab dengan kerangka sederhana. Latihan dengan suara dan rekaman sebelum interview jauh lebih efektif daripada hanya membaca contoh jawaban.",
      },
    ],
    cta: CTA_PRACTICE,
    related: ["persiapan-interview-pertama", "behavioral-star-method", "pertanyaan-balik-ke-hr"],
  },
  {
    slug: "interview-technical-tech",
    title: "Tips Interview Technical untuk Posisi Software Engineer",
    category: "Technical",
    excerpt: "Live coding, system design, dan behavioral di perusahaan tech Indonesia dan global.",
    icon: "Laptop",
    level: "Menengah",
    date: "2026-05-03",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: "Interview technical untuk software engineer biasanya terdiri dari beberapa tahap: tes online, sesi live coding, diskusi system design (untuk level menengah ke atas), dan interview behavioral. Tiap tahap menguji hal yang berbeda, sehingga persiapannya pun berbeda.",
      },
      {
        t: "p",
        text: "Panduan ini menjelaskan apa yang dinilai pada tiap tahap dan cara berlatih yang efisien, tanpa harus menghabiskan ratusan soal.",
      },
      { t: "h2", text: "Live coding: proses berpikir sama pentingnya dengan hasil" },
      {
        t: "p",
        text: "Di sesi live coding, pewawancara menilai cara kamu menyelesaikan masalah, bukan hanya apakah kodenya benar. Kandidat yang diam sepuluh menit lalu menyerahkan solusi sempurna justru kehilangan kesempatan menunjukkan cara berpikirnya. Biasakan **berpikir dengan suara keras**.",
      },
      {
        t: "ol",
        items: [
          "**Pahami soal.** Ulangi dengan kata-katamu sendiri dan tanyakan batasan: ukuran input, tipe data, kasus ekstrem.",
          "**Diskusikan pendekatan.** Sebutkan satu atau dua opsi beserta kompleksitasnya, lalu pilih satu dengan alasan.",
          "**Implementasikan** dengan nama variabel yang jelas dan kode yang rapi.",
          "**Uji sendiri.** Jalankan contoh sederhana, lalu kasus ekstrem seperti input kosong atau satu elemen.",
          "**Jelaskan kompleksitas** waktu dan memori, dan sebutkan cara optimasi kalau ada waktu.",
        ],
      },
      {
        t: "callout",
        title: "Kalau buntu",
        text: "Jangan diam. Sampaikan apa yang sudah kamu coba, ajukan pertanyaan klarifikasi, atau mulai dari solusi paling sederhana (brute force) lalu perbaiki. Pewawancara justru menilai cara kamu keluar dari kebuntuan.",
      },
      { t: "h2", text: "Topik yang paling sering keluar" },
      {
        t: "ul",
        items: [
          "**Array dan string:** two pointers, sliding window, penggunaan hashmap.",
          "**Struktur data:** stack, queue, tree, graph beserta penelusuran BFS dan DFS.",
          "**Algoritma:** sorting, searching, rekursi, dan memoization dasar.",
          "**Database:** jenis JOIN, indexing, optimasi query, dan properti ACID.",
          "**Dasar bahasa pemrograman** yang kamu klaim di CV, termasuk cara kerja memori dan konkurensi.",
        ],
      },
      {
        t: "p",
        text: "Kuasai pola dasarnya lebih dulu daripada mengejar jumlah soal. Menyelesaikan 50 soal dengan benar-benar paham lebih berguna daripada 300 soal yang dikerjakan sambil melihat jawaban.",
      },
      { t: "h2", text: "System design: mulai dari pertanyaan, bukan dari solusi" },
      {
        t: "p",
        text: "Sesi system design memiliki jawaban terbuka. Tidak ada satu desain yang benar, yang dinilai adalah kemampuanmu menyusun pertimbangan. Gunakan alur tiga langkah berikut.",
      },
      {
        t: "ol",
        items: [
          "**Klarifikasi kebutuhan.** Tanyakan fitur yang wajib ada, jumlah pengguna, pola baca dan tulis, serta target latensi.",
          "**Rancang gambaran besar.** Gambarkan komponen utama: klien, API, layanan, database, cache, dan antrean.",
          "**Dalami dan bahas trade-off.** Pilih satu atau dua bagian yang paling kritis, lalu bahas bottleneck, strategi scaling, dan alternatif solusi.",
        ],
      },
      {
        t: "p",
        text: "Untuk berlatih, ambil produk yang kamu kenal (misalnya pemendek URL, layanan chat, atau feed media sosial), lalu rancang di kertas selama 30–40 menit. Buku dan studi kasus arsitektur dari perusahaan besar membantu memperluas referensi.",
      },
      { t: "h2", text: "Interview behavioral untuk engineer" },
      {
        t: "p",
        text: "Jangan abaikan bagian ini. Banyak kandidat kuat secara teknis gagal karena sulit menceritakan pengalaman kerja sama, menangani konflik, atau belajar dari insiden produksi. Siapkan tiga sampai lima cerita dengan [metode STAR](/tips-interview/behavioral-star-method): proyek tersulit, bug terbesar yang pernah kamu perbaiki, dan perbedaan pendapat dengan rekan setim.",
      },
      { t: "h2", text: "Riset tech stack perusahaan" },
      {
        t: "p",
        text: "Perusahaan besar dengan sistem terdistribusi cenderung menanyakan microservices, arsitektur berbasis event, dan tantangan skala. Startup biasanya lebih praktis dan bisa memberi tugas yang berkaitan langsung dengan produk mereka. Baca blog engineering perusahaan target, lalu sesuaikan latihanmu.",
      },
      { t: "h2", text: "Sebelum dan sesudah interview" },
      {
        t: "ul",
        items: [
          "Latih coding di editor sederhana atau papan tulis, bukan hanya di IDE yang punya autocomplete.",
          "Uji koneksi, kamera, dan editor kolaboratif sebelum sesi daring.",
          "Siapkan CV yang menonjolkan proyek dan dampak. Cek lewat [template CV ATS friendly](/template) agar mudah terbaca sistem rekrutmen.",
          "Kirim email terima kasih dalam 24 jam setelah sesi.",
        ],
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Interview technical bisa dipelajari. Latih dasar-dasar struktur data, biasakan berpikir dengan suara keras, kuasai kerangka system design, dan siapkan cerita behavioral. Konsistensi latihan 30–60 menit per hari lebih efektif daripada maraton semalam sebelum interview.",
      },
    ],
    faq: [
      {
        q: "Berapa banyak soal LeetCode yang perlu dikerjakan?",
        a: "Tidak ada angka pasti. Banyak kandidat merasa cukup setelah menguasai pola dasar lewat 50–100 soal yang dikerjakan dengan paham. Kualitas pemahaman jauh lebih penting daripada jumlah.",
      },
      {
        q: "Apakah semua posisi software engineer wajib melewati sesi system design?",
        a: "Biasanya sesi ini untuk level menengah ke atas. Untuk posisi junior, fokus utamanya ada pada dasar pemrograman, struktur data, dan cara berpikir.",
      },
      {
        q: "Bahasa pemrograman apa yang sebaiknya dipakai saat live coding?",
        a: "Pilih bahasa yang paling kamu kuasai, kecuali lowongan mensyaratkan bahasa tertentu. Menulis kode yang rapi dengan bahasa yang kamu kuasai lebih baik daripada berjuang dengan sintaks bahasa baru.",
      },
      {
        q: "Bagaimana kalau tidak bisa menyelesaikan soal sampai tuntas?",
        a: "Tetap sampaikan pendekatanmu, bagian yang sudah berjalan, dan ide kelanjutannya. Pewawancara sering memberi petunjuk, dan kemampuan menerima masukan dinilai positif.",
      },
    ],
    cta: CTA_PRACTICE,
    related: ["behavioral-star-method", "pertanyaan-hr-umum", "negosiasi-gaji"],
  },
  {
    slug: "negosiasi-gaji",
    title: "Cara Negosiasi Gaji Tanpa Bikin Awkward",
    category: "Karier",
    excerpt: "Riset salary range, framing pertanyaan, dan kapan waktu yang tepat membahas gaji.",
    icon: "CircleDollarSign",
    level: "Semua Level",
    date: "2026-05-04",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: "Banyak orang merasa canggung membicarakan gaji, takut dianggap serakah atau khawatir tawarannya ditarik. Kenyataannya, negosiasi adalah hal yang wajar dalam proses rekrutmen, dan perusahaan umumnya sudah menyiapkan ruang untuk itu. Kandidat yang bernegosiasi dengan sopan dan berdasar data justru dianggap profesional.",
      },
      { t: "h2", text: "Riset kisaran gaji lebih dulu" },
      {
        t: "p",
        text: "Jangan masuk negosiasi tanpa angka. Kumpulkan data dari beberapa sumber: situs lowongan dan panduan gaji, platform data gaji, komunitas profesi, dan teman di industri yang sama. Beberapa faktor memengaruhi angkanya:",
      },
      {
        t: "ul",
        items: [
          "**Lokasi.** Jakarta dan kota besar umumnya berbeda dari kota lain.",
          "**Ukuran dan tahap perusahaan.** Startup, korporasi, dan BUMN punya struktur gaji berbeda.",
          "**Industri.** Fintech dan teknologi cenderung berbeda dari ritel atau manufaktur.",
          "**Pengalaman dan kelangkaan skill.** Keahlian yang jarang biasanya dihargai lebih tinggi.",
        ],
      },
      {
        t: "p",
        text: "Dari riset itu, tentukan tiga angka: **batas bawah** (paling rendah yang masih kamu terima), **target** (yang kamu inginkan), dan **angka ideal** (skenario terbaik). Dengan begitu kamu tidak panik saat ditanya.",
      },
      { t: "h2", text: "Kapan membahas gaji" },
      {
        t: "p",
        text: "Idealnya, tunggu sampai perusahaan menunjukkan ketertarikan nyata, yaitu setelah kamu lolos tahap utama, atau saat HR membuka topik kompensasi. Semakin kuat posisimu (mereka sudah memutuskan menginginkanmu), semakin besar daya tawarmu.",
      },
      {
        t: "p",
        text: 'Namun, kalau lowongan atau HR meminta ekspektasi gaji sejak awal, jangan menghindar. Jawab dengan rentang yang sudah kamu riset, bukan dengan "terserah perusahaan", karena jawaban itu membuatmu rentan ditawar rendah.',
      },
      { t: "h2", text: "Cara menyampaikan ekspektasi" },
      {
        t: "callout",
        title: "Contoh kalimat",
        text: '"Berdasarkan pengalaman saya dan data pasar untuk posisi ini, ekspektasi saya ada di kisaran X sampai Y. Saya terbuka untuk membahas total paket, termasuk benefit."',
      },
      {
        t: "p",
        text: 'Sebut rentang dengan batas bawah yang masih nyaman buatmu, karena perusahaan biasanya akan menawar dari angka terendah. Bila ditanya gaji terakhir, kamu tidak wajib menyebutnya. Kamu bisa mengalihkan dengan sopan: "Saya lebih ingin fokus pada nilai yang bisa saya berikan di posisi ini dan kisaran yang sesuai pasar."',
      },
      { t: "h2", text: "Lihat total paket, bukan hanya gaji pokok" },
      {
        t: "p",
        text: "Gaji pokok hanya satu bagian. Pertimbangkan juga:",
      },
      {
        t: "ul",
        items: [
          "bonus tahunan atau bonus tanda tangan (signing bonus);",
          "tunjangan kesehatan, termasuk untuk keluarga;",
          "opsi saham atau program kepemilikan, terutama di startup;",
          "fleksibilitas kerja jarak jauh atau hybrid;",
          "anggaran pelatihan dan pengembangan;",
          "jumlah cuti dan hari libur tambahan.",
        ],
      },
      {
        t: "p",
        text: "Kalau perusahaan tidak bisa menaikkan nominal gaji, kamu masih bisa bernegosiasi untuk fleksibilitas kerja, anggaran pelatihan, tinjauan gaji lebih cepat (misalnya setelah 6 bulan), atau pilihan proyek.",
      },
      { t: "h2", text: "Hal yang sebaiknya dihindari" },
      {
        t: "ul",
        items: [
          "**Mengancam akan mundur** kalau kamu belum siap benar-benar mundur.",
          "**Berbohong soal tawaran lain.** Hal ini bisa dicek dan merusak kepercayaan.",
          "**Terlihat terlalu putus asa**, karena daya tawarmu langsung turun.",
          "**Langsung menerima di tempat.** Kamu berhak meminta waktu untuk mempertimbangkan.",
          "**Bernegosiasi lewat pesan singkat yang ambigu.** Untuk hal penting, minta penawaran tertulis.",
        ],
      },
      {
        t: "p",
        text: 'Kalimat yang aman untuk meminta waktu: "Terima kasih atas tawarannya. Boleh saya pertimbangkan dan memberi kabar paling lambat hari Jumat?"',
      },
      { t: "h2", text: "Kalau tawaran akhir masih di bawah harapan" },
      {
        t: "p",
        text: 'Sampaikan apresiasi lebih dulu, lalu jelaskan dasar permintaanmu dengan tenang: "Saya menghargai tawarannya. Berdasarkan riset dan pengalaman saya, angka X lebih sesuai. Apakah masih ada ruang untuk menyesuaikan?" Setelah itu, dengarkan jawabannya. Putuskan dengan membandingkannya dengan batas bawah yang sudah kamu tentukan, bukan berdasarkan emosi.',
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Negosiasi gaji adalah percakapan profesional, bukan konfrontasi. Lakukan riset, tentukan tiga angka, sampaikan dalam bentuk rentang, pertimbangkan total paket, dan minta waktu sebelum memutuskan. Persiapan juga dimulai dari awal: CV yang kuat meningkatkan daya tawarmu. Cek [panduan CV ATS](/panduan-cv-ats) untuk memastikan pencapaianmu tampil dengan jelas.",
      },
    ],
    faq: [
      {
        q: "Apakah wajib menyebut gaji terakhir?",
        a: "Tidak wajib. Kamu bisa mengalihkan percakapan ke ekspektasi gaji berdasarkan riset pasar dan nilai yang kamu berikan. Bila HR tetap menanyakan, jawab seperlunya dan kembali ke kisaran yang kamu inginkan.",
      },
      {
        q: "Berapa besar kenaikan yang wajar saat negosiasi?",
        a: "Tidak ada angka baku, tergantung industri, level, dan kondisi perusahaan. Gunakan data pasar sebagai dasar, bukan persentase acak, dan pastikan kamu bisa menjelaskan alasannya.",
      },
      {
        q: "Apakah negosiasi bisa membuat tawaran dibatalkan?",
        a: "Sangat jarang selama dilakukan dengan sopan dan berdasar data. Perusahaan sudah memilihmu dan umumnya menyiapkan ruang untuk negosiasi. Risiko lebih besar muncul kalau kamu mengancam atau berbohong.",
      },
      {
        q: "Kapan sebaiknya menyebut angka lebih dulu?",
        a: "Kalau perusahaan menanyakannya dan kamu sudah riset, sebutlah rentang. Kalau belum ditanya, tunggu sampai mereka menunjukkan ketertarikan yang jelas atau membuka topik kompensasi.",
      },
    ],
    cta: CTA_PRACTICE,
    related: ["pertanyaan-hr-umum", "interview-technical-tech", "pertanyaan-balik-ke-hr"],
  },
  {
    slug: "pertanyaan-balik-ke-hr",
    title: "5 Pertanyaan Cerdas yang Bikin HR Terkesan",
    category: "HR Interview",
    excerpt: "Pertanyaan yang menunjukkan kamu serius, matang, dan sudah riset perusahaan.",
    icon: "Sparkles",
    level: "Pemula",
    date: "2026-05-05",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: 'Di akhir hampir setiap interview, pewawancara bertanya, "Ada pertanyaan untuk kami?" Banyak kandidat menjawab "tidak ada" dan tanpa sadar melewatkan kesempatan emas. Interview adalah komunikasi dua arah: kamu juga sedang menilai apakah perusahaan ini cocok untukmu.',
      },
      {
        t: "p",
        text: "Pertanyaan yang baik menunjukkan bahwa kamu sudah riset, berpikir kritis, dan benar-benar tertarik. Berikut lima pertanyaan yang bisa kamu pakai, beserta alasan di baliknya.",
      },
      { t: "h2", text: "Kenapa pertanyaanmu penting" },
      {
        t: "p",
        text: "Bayangkan dua kandidat dengan kualifikasi setara. Yang satu hanya menjawab pertanyaan, yang lain juga mengajukan pertanyaan yang tajam tentang tim dan tantangannya. Pewawancara hampir pasti lebih mengingat yang kedua. Pertanyaanmu juga memberimu informasi nyata untuk memutuskan apakah kamu mau bekerja di sana.",
      },
      { t: "h2", text: "Lima pertanyaan yang bikin terkesan" },
      { t: "h3", text: "1. Soal onboarding" },
      {
        t: "p",
        text: '"Seperti apa proses onboarding untuk anggota baru di posisi ini? Apakah ada program mentoring?" Pertanyaan ini menunjukkan kamu peduli pada keberhasilan jangka panjang dan siap belajar.',
      },
      { t: "h3", text: "2. Soal tantangan tim" },
      {
        t: "p",
        text: '"Apa tantangan terbesar yang sedang dihadapi tim ini?" Kamu menunjukkan bahwa kamu berpikir tentang cara berkontribusi, bukan hanya apa yang akan kamu terima. Jawabannya juga memberi gambaran jujur tentang pekerjaan yang menantimu.',
      },
      { t: "h3", text: "3. Soal budaya kerja" },
      {
        t: "p",
        text: '"Menurut Anda, apa yang membedakan orang yang berkembang pesat di perusahaan ini dari yang kesulitan?" Jawabannya mengungkap ekspektasi dan budaya yang sebenarnya.',
      },
      { t: "h3", text: "4. Soal ukuran keberhasilan" },
      {
        t: "p",
        text: '"Bagaimana keberhasilan di posisi ini diukur pada 30, 60, dan 90 hari pertama?" Kamu terlihat berorientasi pada hasil dan ingin tahu target yang jelas sejak awal.',
      },
      { t: "h3", text: "5. Soal pengembangan karier" },
      {
        t: "p",
        text: '"Peluang pengembangan apa yang tersedia untuk seseorang di posisi ini dalam satu hingga dua tahun ke depan?" Pertanyaan ini menunjukkan motivasi jangka panjang, selama diajukan dengan nada ingin berkontribusi, bukan menuntut promosi cepat.',
      },
      { t: "h2", text: "Pertanyaan yang sebaiknya dihindari" },
      {
        t: "ul",
        items: [
          '**"Perusahaan ini bergerak di bidang apa?"** Menandakan kamu tidak riset sama sekali.',
          '**"Berapa jumlah cuti dan jam kerjanya?"** Terlalu awal. Tanyakan di tahap penawaran atau lewat HR.',
          '**"Kapan saya bisa dipromosikan?"** Terkesan tidak sabar sebelum membuktikan diri.',
          '**"Apakah orang-orang di sini bahagia?"** Terlalu umum. Ganti dengan "Bagaimana budaya kolaborasi di tim ini?"',
          "**Terlalu banyak pertanyaan.** Pilih tiga sampai lima yang paling penting buatmu.",
        ],
      },
      { t: "h2", text: "Cara membawakannya dengan natural" },
      {
        t: "ul",
        items: [
          "Siapkan lebih banyak pertanyaan daripada yang akan kamu ajukan, karena sebagian mungkin sudah terjawab selama interview.",
          "Catat jawaban pewawancara. Ini menunjukkan kamu menyimak, dan membantumu membandingkan beberapa tawaran.",
          "Ajukan pertanyaan lanjutan yang spontan, bukan hanya membaca daftar.",
          "Sesuaikan pertanyaan dengan siapa yang mewawancarai: tanyakan soal budaya ke HR, soal pekerjaan harian ke calon atasan.",
        ],
      },
      {
        t: "callout",
        title: "Tips tambahan",
        text: 'Akhiri dengan menanyakan langkah berikutnya: "Bagaimana proses selanjutnya, dan kapan saya bisa mengharapkan kabar?" Ini menutup interview dengan rapi dan memberimu tenggat yang jelas.',
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Pertanyaan yang baik menunjukkan kualitasmu sebagai kandidat sekaligus membantumu memilih tempat bekerja yang tepat. Siapkan beberapa pertanyaan sebelum hari-H, hindari yang sudah terjawab di situs perusahaan, dan sesuaikan dengan lawan bicaramu. Untuk persiapan pertanyaan yang akan mereka ajukan padamu, baca [10 pertanyaan HR yang sering muncul](/tips-interview/pertanyaan-hr-umum).",
      },
    ],
    faq: [
      {
        q: "Berapa banyak pertanyaan yang sebaiknya diajukan?",
        a: "Cukup tiga sampai lima pertanyaan, tergantung waktu yang tersedia. Siapkan lebih banyak karena beberapa mungkin sudah terjawab saat interview berlangsung.",
      },
      {
        q: "Boleh bertanya soal gaji di akhir interview?",
        a: "Sebaiknya jangan di interview awal, kecuali pewawancara yang membukanya. Tanyakan saat tahap penawaran atau bila HR sendiri yang membahas kompensasi. Panduan negosiasi gaji kami membahas waktu dan caranya.",
      },
      {
        q: "Bagaimana kalau semua pertanyaanku sudah terjawab saat interview?",
        a: "Sampaikan hal itu, lalu ajukan pertanyaan lanjutan dari topik yang tadi dibahas, atau tanyakan langkah berikutnya dalam proses rekrutmen. Itu lebih baik daripada diam atau mengulang pertanyaan.",
      },
      {
        q: "Apakah pertanyaan balik memengaruhi keputusan rekrutmen?",
        a: "Ya, sering kali berpengaruh. Pertanyaan yang baik menunjukkan riset, motivasi, dan cara berpikirmu, sehingga bisa menjadi pembeda antara kandidat dengan kualifikasi serupa.",
      },
    ],
    cta: CTA_PRACTICE,
    related: ["pertanyaan-hr-umum", "persiapan-interview-pertama", "behavioral-star-method"],
  },
  {
    slug: "behavioral-star-method",
    title: "Metode STAR untuk Jawab Pertanyaan Behavioral",
    category: "Behavioral",
    excerpt: "Situation, Task, Action, Result: framework jawaban yang terstruktur dan meyakinkan.",
    icon: "Target",
    level: "Menengah",
    date: "2026-05-06",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: 'Pertanyaan seperti "Ceritakan saat kamu menghadapi konflik di tim" atau "Ceritakan kegagalan terbesarmu" disebut pertanyaan **behavioral**. Pewawancara memakainya karena perilaku di masa lalu adalah indikator terbaik perilaku di masa depan. Jawaban yang bertele-tele atau terlalu umum mudah dilupakan, dan di sinilah metode STAR membantu.',
      },
      { t: "h2", text: "Apa itu metode STAR" },
      {
        t: "p",
        text: "STAR adalah kerangka untuk menceritakan pengalaman secara terstruktur. Singkatan dari **Situation**, **Task**, **Action**, dan **Result**. Dengan kerangka ini, jawabanmu punya konteks yang cukup, jelas peranmu apa, dan ditutup dengan hasil yang bisa dinilai.",
      },
      {
        t: "p",
        text: "Tanpa struktur, jawaban cenderung jatuh ke dua ekstrem: terlalu panjang sampai pewawancara kehilangan inti, atau terlalu singkat sampai tidak ada substansi. STAR menjaga keseimbangan itu.",
      },
      { t: "h2", text: "Uraian tiap komponen" },
      {
        t: "ul",
        items: [
          '**Situation (1–2 kalimat):** gambarkan latar belakangnya. Kapan, di mana, dan dengan siapa. Contoh: "Saat magang di sebuah perusahaan logistik, tim kami menghadapi tenggat proyek yang sangat ketat."',
          '**Task (1–2 kalimat):** jelaskan tanggung jawabmu. Contoh: "Sebagai peserta magang, saya bertugas membantu pengembangan backend sambil mempelajari framework baru."',
          '**Action (3–5 kalimat):** ini bagian utama. Jelaskan apa yang **kamu** lakukan, secara berurutan dan spesifik. Gunakan "saya", bukan "kami".',
          "**Result (1–2 kalimat):** sebutkan hasilnya, sebaiknya dengan angka, dan apa yang kamu pelajari.",
        ],
      },
      {
        t: "callout",
        title: "Contoh utuh",
        text: '"Saat magang, tim kami harus merilis fitur dalam dua minggu (Situation). Saya bertugas membuat endpoint laporan dengan framework yang belum saya kuasai (Task). Saya menyisihkan dua jam tiap pagi untuk membaca dokumentasi, pair programming dengan senior setiap siang, dan menyelesaikan bagian kecil setiap sore (Action). Dalam enam minggu saya menyelesaikan tiga fitur, dan kontribusi saya mencapai sekitar 20% dari target sprint (Result)."',
      },
      { t: "h2", text: "Tips agar jawaban STAR kuat" },
      {
        t: "ul",
        items: [
          "**Pilih cerita dengan akhir yang positif.** Kalau awalnya negatif, tekankan pelajaran dan perbaikan yang kamu buat.",
          '**Gunakan angka.** "Memangkas waktu loading 40%" lebih meyakinkan daripada "membuat aplikasi lebih cepat".',
          '**Spesifik.** "Menerapkan cache dengan Redis" lebih kuat daripada "memperbaiki performa database".',
          "**Fokus pada peranmu**, bukan pencapaian kelompok. Pewawancara ingin tahu apa yang kamu bawa.",
          "**Atur durasi.** Targetkan 2–3 menit. Latih dengan timer.",
        ],
      },
      { t: "h2", text: "Contoh pertanyaan umum dan kerangka jawabannya" },
      { t: "h3", text: '"Ceritakan saat kamu menangani konflik di tim"' },
      {
        t: "p",
        text: "**S:** Dua anggota tim berbeda pendapat soal pendekatan teknis menjelang tenggat. **T:** Saya perlu memastikan proyek tetap berjalan. **A:** Saya mengajak masing-masing berbicara empat mata untuk memahami alasannya, mengusulkan kompromi, lalu menyampaikan estimasi realistis ke PM. **R:** Proyek selesai tepat waktu dan kerja sama tim membaik.",
      },
      { t: "h3", text: '"Ceritakan kegagalan yang pernah kamu alami"' },
      {
        t: "p",
        text: "**S:** Pertama kali memimpin proyek dengan jadwal yang terlalu optimis. **T:** Memastikan proyek tetap berhasil. **A:** Saya mengidentifikasi hambatan lebih awal, jujur soal risiko kepada pemangku kepentingan, menyusun ulang prioritas fitur, dan meminta bantuan saat dibutuhkan. **R:** Fitur inti dirilis tepat waktu, dan saya belajar pentingnya waktu cadangan.",
      },
      { t: "h3", text: '"Ceritakan saat kamu melampaui ekspektasi"' },
      {
        t: "p",
        text: "**S:** Menerima tugas yang ambigu dengan tenggat ketat. **T:** Menghasilkan sesuatu yang lebih dari sekadar cukup. **A:** Saya meriset praktik terbaik di industri, mengusulkan perbaikan yang tidak diminta, dan merapikan hasil akhir. **R:** Klien memuji hasilnya dan dokumen itu dipakai sebagai templat proyek berikutnya.",
      },
      { t: "h2", text: "Kesalahan yang perlu dihindari" },
      {
        t: "ul",
        items: [
          "Terlalu banyak Situation dan hampir tidak ada Action.",
          'Memakai "kami" terus-menerus sehingga kontribusimu tidak terlihat.',
          "Tidak menyebut hasil atau pelajaran sama sekali.",
          "Mengarang cerita. Pewawancara sering menggali dengan pertanyaan lanjutan, dan cerita karangan mudah ketahuan.",
        ],
      },
      { t: "h2", text: "Cara menyiapkan bank cerita" },
      {
        t: "p",
        text: "Daripada menyiapkan jawaban untuk tiap pertanyaan, siapkan 4–5 cerita serbaguna dari pengalamanmu: kerja sama tim, menyelesaikan masalah, menghadapi kegagalan, memimpin inisiatif, dan belajar hal baru. Satu cerita sering bisa dipakai untuk beberapa pertanyaan dengan penekanan berbeda. Catat dulu dalam bentuk poin STAR, lalu latih dengan suara. Persiapan umum untuk interview pertama ada di [panduan fresh graduate](/tips-interview/persiapan-interview-pertama).",
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "STAR membuat jawabanmu terstruktur, spesifik, dan mudah diingat. Siapkan bank cerita, tekankan Action dan Result, dan latih dengan timer. Pencapaian dengan angka juga sebaiknya muncul di CV-mu. Bagian pengalaman di [CV ATS friendly](/panduan-cv-ats) yang ditulis dengan pola yang sama akan memperkuat cerita yang kamu bawakan di interview.",
      },
    ],
    faq: [
      {
        q: "Apakah STAR hanya untuk pertanyaan behavioral?",
        a: 'Terutama untuk itu, tetapi polanya berguna juga untuk menjawab "ceritakan pengalaman" dan untuk menulis poin pencapaian di CV. Strukturnya membantu apa pun yang perlu diceritakan secara ringkas.',
      },
      {
        q: "Bagaimana kalau aku belum punya pengalaman kerja untuk diceritakan?",
        a: "Pakai pengalaman dari kuliah, organisasi, kepanitiaan, proyek pribadi, magang, atau kegiatan sukarela. Yang dinilai adalah cara berpikir dan bertindakmu, bukan besarnya perusahaan tempat kamu mengalaminya.",
      },
      {
        q: "Apakah boleh menceritakan kegagalan?",
        a: "Boleh, dan justru dianjurkan. Pilih kegagalan yang nyata tetapi tidak fatal, lalu tekankan apa yang kamu lakukan dan pelajari sesudahnya. Pewawancara menilai kedewasaan dan kemampuan belajarmu.",
      },
      {
        q: "Bagaimana kalau hasilnya tidak bisa diukur dengan angka?",
        a: "Gunakan hasil kualitatif yang konkret, seperti umpan balik dari atasan, perubahan proses yang dipakai tim, atau masalah yang tidak terulang lagi. Angka membantu, tetapi bukan syarat mutlak.",
      },
    ],
    cta: CTA_PRACTICE,
    related: ["pertanyaan-hr-umum", "persiapan-interview-pertama", "negosiasi-gaji"],
  },
];

export const tipPostsBySlug: Record<string, TipPost> = Object.fromEntries(
  tipPosts.map((p) => [p.slug, p]),
);
