/**
 * Data artikel blog — SATU sumber untuk halaman artikel, daftar blog, dan sitemap.
 * Tambah artikel baru cukup dengan menambah objek ke `blogPosts`.
 *
 * Inline di dalam teks: **tebal** dan [teks tautan](/path-internal).
 */

export type BlogBlock =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "callout"; title: string; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  /** Tanggal terbit (YYYY-MM-DD). */
  date: string;
  /** Tanggal pembaruan terakhir (YYYY-MM-DD). */
  updated: string;
  body: BlogBlock[];
  faq: { q: string; a: string }[];
  cta: { title: string; text: string; label: string; to: string };
  /** Slug artikel terkait (ditampilkan di akhir artikel). */
  related: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "apa-itu-cv-ats",
    title: "Apa Itu CV ATS Friendly dan Kenapa Penting?",
    category: "CV & Karier",
    excerpt:
      "Pelajari apa itu Applicant Tracking System, bagaimana cara kerjanya, dan kenapa CV kamu harus lolos screening ATS.",
    date: "2026-04-15",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: "Kamu sudah mengirim belasan lamaran, CV-mu terlihat rapi, pengalamanmu relevan, tapi panggilan interview tak kunjung datang. Salah satu penyebab yang sering tidak disadari adalah **ATS**: sistem yang membaca CV-mu lebih dulu sebelum rekruter sempat melihatnya.",
      },
      {
        t: "p",
        text: "Artikel ini menjelaskan apa itu ATS, bagaimana cara kerjanya, apa yang membuat CV gagal terbaca, dan langkah praktis agar CV-mu ramah ATS tanpa kehilangan tampilan profesional.",
      },
      { t: "h2", text: "Apa itu ATS (Applicant Tracking System)?" },
      {
        t: "p",
        text: "ATS adalah perangkat lunak yang dipakai perusahaan untuk mengelola proses rekrutmen. Semua lamaran yang masuk ditampung di satu tempat, dibaca secara otomatis, lalu diurutkan atau disaring berdasarkan kecocokan dengan lowongan. Bagi perusahaan yang menerima ratusan sampai ribuan lamaran per posisi, sistem seperti ini menghemat waktu secara drastis.",
      },
      {
        t: "p",
        text: "Perlu dipahami: ATS umumnya bukan robot yang menolak CV secara sewenang-wenang. Banyak ATS hanya mengekstrak isi CV, menyimpannya sebagai data, dan membantu rekruter mencari kandidat lewat kata kunci. Tetapi kalau isi CV gagal terbaca, datamu di sistem menjadi kosong atau berantakan, dan kamu tidak akan muncul saat rekruter mencari.",
      },
      { t: "h2", text: "Bagaimana ATS membaca CV-mu" },
      {
        t: "ol",
        items: [
          "**Mengekstrak teks.** Sistem mengubah file PDF atau DOCX menjadi teks mentah.",
          "**Mengenali bagian CV.** Sistem mencari judul seperti Pengalaman Kerja, Pendidikan, dan Keahlian untuk memilah data.",
          "**Mencocokkan kata kunci.** Isi CV dibandingkan dengan deskripsi lowongan: jabatan, skill, tools, dan kualifikasi.",
          "**Menyimpan dan mengurutkan.** Profilmu disimpan, kadang diberi skor, lalu ditampilkan ke rekruter.",
        ],
      },
      {
        t: "p",
        text: "Masalah muncul di langkah pertama dan kedua. Kalau teks tidak terekstrak dengan benar, langkah-langkah berikutnya ikut salah.",
      },
      { t: "h2", text: "Penyebab CV gagal terbaca ATS" },
      {
        t: "ul",
        items: [
          "**Tabel dan kolom ganda.** Teks bisa terbaca acak atau tercampur antar kolom.",
          "**Teks di dalam gambar atau ikon.** Nama, kontak, atau skill yang berupa gambar tidak bisa dibaca.",
          "**Header dan footer.** Sebagian sistem mengabaikan isi header, sehingga kontak di sana hilang.",
          '**Judul bagian yang kreatif.** Judul seperti "Perjalanan Saya" membingungkan sistem. Gunakan "Pengalaman Kerja".',
          "**Font dekoratif atau grafik skill (bar, bintang).** Tidak terbaca sebagai teks dan tidak menyampaikan informasi apa pun ke sistem.",
          "**File yang dipindai.** PDF hasil scan adalah gambar, bukan teks. Gunakan file yang diekspor langsung dari aplikasi.",
        ],
      },
      { t: "h2", text: "Ciri-ciri CV yang ramah ATS" },
      {
        t: "ul",
        items: [
          "Satu kolom dengan urutan baca yang jelas dari atas ke bawah.",
          "Judul bagian standar: Ringkasan, Pengalaman Kerja, Pendidikan, Keahlian.",
          "Teks asli (bukan gambar), dengan font bersih seperti Inter, Arial, atau Calibri.",
          'Tanggal dan jabatan ditulis konsisten, misalnya "Jan 2023 – Sekarang".',
          "Kata kunci dari lowongan muncul secara wajar di ringkasan, pengalaman, dan skill.",
          "Informasi kontak di badan dokumen, bukan di header.",
        ],
      },
      {
        t: "callout",
        title: "Ramah ATS bukan berarti membosankan",
        text: "CV satu kolom tetap bisa terlihat profesional lewat tipografi, jarak, dan hierarki yang rapi. Lihat berbagai pilihan di [template CV ATS friendly](/template) yang sudah dirancang agar terbaca sistem sekaligus nyaman dibaca manusia.",
      },
      { t: "h2", text: "Cara mengecek CV-mu sebelum dikirim" },
      {
        t: "ol",
        items: [
          "**Salin-tempel ke editor teks.** Buka CV-mu, salin semua isinya, tempel ke Notepad. Kalau urutannya kacau atau ada bagian hilang, ATS kemungkinan mengalami hal yang sama.",
          "**Cek skor ATS.** Gunakan alat penilai otomatis untuk melihat format, keyword, dan kelengkapan. Di CV Pintar, fitur skor ATS ada di dalam editor.",
          "**Bandingkan dengan lowongan.** Pastikan skill dan tools yang diminta lowongan memang tertulis di CV, dengan istilah yang sama.",
          "**Simpan sebagai PDF teks.** Ekspor langsung dari aplikasi, jangan dipindai atau dicetak ulang.",
        ],
      },
      { t: "h2", text: "Kesalahan umum yang sering terjadi" },
      {
        t: "p",
        text: "**Mengejar kata kunci secara berlebihan.** Menyisipkan daftar kata kunci tanpa konteks justru terlihat tidak tulus bagi rekruter manusia. Tulis kata kunci di dalam kalimat yang menjelaskan apa yang sudah kamu kerjakan. Panduannya ada di artikel [cara riset keyword untuk CV ATS](/blog/keyword-cv-ats).",
      },
      {
        t: "p",
        text: "**Memakai satu CV untuk semua lowongan.** Tiap lowongan memakai istilah berbeda. Sesuaikan ringkasan dan skill dengan posisi yang dilamar.",
      },
      {
        t: "p",
        text: "**Melupakan manusia.** Setelah lolos sistem, CV-mu dibaca orang. Pastikan ringkasannya jelas dan pencapaiannya punya angka. Lihat juga [cara menulis ringkasan CV](/blog/cara-menulis-ringkasan-cv).",
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "ATS adalah bagian dari proses rekrutmen modern, dan memahami cara kerjanya membuat usahamu melamar jauh lebih efisien. Mulailah dari hal-hal sederhana: format satu kolom, judul standar, teks asli, dan kata kunci yang relevan. Untuk panduan menyeluruh langkah demi langkah, baca [panduan lengkap CV ATS](/panduan-cv-ats).",
      },
    ],
    faq: [
      {
        q: "Apakah semua perusahaan memakai ATS?",
        a: "Tidak semua. Perusahaan besar dan yang menerima banyak lamaran lebih sering memakainya, sementara usaha kecil biasanya membaca CV langsung. Karena kamu tidak selalu tahu mana yang memakai ATS, aman jika CV-mu ramah ATS sekaligus enak dibaca manusia.",
      },
      {
        q: "Apakah CV dengan desain kreatif pasti ditolak ATS?",
        a: "Tidak pasti, tetapi berisiko. Tabel, kolom ganda, dan teks dalam gambar sering terbaca salah. Untuk lamaran lewat portal online, pilih format satu kolom. Desain kreatif lebih cocok untuk dikirim langsung atau sebagai portofolio.",
      },
      {
        q: "Lebih baik kirim CV dalam format PDF atau DOCX?",
        a: "Ikuti petunjuk di lowongan. Jika tidak ada petunjuk, PDF teks (diekspor langsung dari aplikasi, bukan hasil scan) umumnya aman dan menjaga tata letak. Gunakan DOCX bila portal secara khusus memintanya.",
      },
    ],
    cta: {
      title: "Cek apakah CV-mu ramah ATS",
      text: "Buat CV dari template yang sudah ramah ATS, lalu lihat skor dan saran perbaikannya.",
      label: "Buat CV Gratis",
      to: "/register",
    },
    related: ["keyword-cv-ats", "cara-menulis-ringkasan-cv"],
  },
  {
    slug: "keyword-cv-ats",
    title: "Cara Riset Keyword untuk CV ATS Friendly",
    category: "CV & Karier",
    excerpt:
      "Panduan lengkap riset keyword dari job description agar CV kamu muncul di pencarian rekruter.",
    date: "2026-04-20",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: "CV yang bagus belum tentu ditemukan. Rekruter dan sistem ATS sering mencari kandidat dengan **kata kunci**: nama jabatan, skill, tools, atau sertifikasi. Kalau istilah yang mereka cari tidak ada di CV-mu, kamu bisa terlewat walaupun sebenarnya cocok.",
      },
      {
        t: "p",
        text: "Kabar baiknya, kata kunci yang tepat sudah tersedia gratis: tertulis di lowongan itu sendiri. Artikel ini menunjukkan cara mengumpulkannya, mengelompokkannya, dan menuliskannya di CV tanpa terkesan dipaksakan. Kalau kamu belum familiar dengan ATS, mulai dari [penjelasan apa itu CV ATS friendly](/blog/apa-itu-cv-ats).",
      },
      { t: "h2", text: "Kenapa kata kunci menentukan" },
      {
        t: "ul",
        items: [
          '**Pencarian rekruter.** Rekruter mengetik istilah seperti "digital marketing" atau "SQL" di database kandidat. Hanya CV yang memuat istilah itu yang muncul.',
          "**Pencocokan otomatis.** Sebagian sistem membandingkan isi CV dengan deskripsi lowongan dan menampilkan kecocokannya.",
          "**Bukti relevansi.** Bagi rekruter manusia, istilah yang sama dengan lowongan menandakan kamu paham kebutuhan posisinya.",
        ],
      },
      { t: "h2", text: "Langkah 1: Kumpulkan 3–5 lowongan yang kamu incar" },
      {
        t: "p",
        text: "Pilih lowongan untuk posisi yang sama atau mirip, dari perusahaan berbeda. Satu lowongan bisa saja memakai istilah yang tidak lazim, sedangkan pola yang berulang di beberapa lowongan menunjukkan kata kunci yang benar-benar penting di industrimu. Kamu bisa mulai dari halaman [lowongan kerja](/lowongan) untuk melihat contoh deskripsi posisi.",
      },
      { t: "h2", text: "Langkah 2: Tandai kata yang berulang" },
      {
        t: "p",
        text: 'Baca deskripsi dan kualifikasi, lalu tandai istilah yang muncul di lebih dari satu lowongan. Perhatikan terutama bagian "Kualifikasi" dan "Tanggung jawab", karena di situlah sebagian besar kata kunci berada.',
      },
      { t: "h2", text: "Langkah 3: Kelompokkan jadi tiga kategori" },
      { t: "h3", text: "Hard skills" },
      {
        t: "p",
        text: "Kemampuan teknis yang bisa diukur: tools (Excel, Figma, Google Analytics), bahasa pemrograman, metode (Agile, SEO), dan sertifikasi. Ini biasanya kata kunci dengan bobot terbesar.",
      },
      { t: "h3", text: "Soft skills" },
      {
        t: "p",
        text: 'Komunikasi, kepemimpinan, kerja sama tim. Tulis sebagai bukti, bukan klaim: "memimpin tim 5 orang" lebih meyakinkan daripada "pemimpin yang baik".',
      },
      { t: "h3", text: "Kualifikasi" },
      {
        t: "p",
        text: "Syarat formal: pengalaman minimal sekian tahun, jenjang pendidikan, lisensi, dan lokasi. Pastikan data ini tertulis jelas bila kamu memenuhinya.",
      },
      { t: "h2", text: "Langkah 4: Perhatikan variasi penulisan" },
      {
        t: "p",
        text: 'Sistem tidak selalu mengenali sinonim. "Project management" dan "manajemen proyek" bisa dianggap berbeda. Jika lowongan memakai kedua bentuk, atau kamu ragu, tulis keduanya sekali dalam konteks yang wajar. Gunakan juga singkatan beserta bentuk lengkapnya pada kemunculan pertama, misalnya "Search Engine Optimization (SEO)".',
      },
      { t: "h2", text: "Langkah 5: Tempatkan kata kunci di tempat yang tepat" },
      {
        t: "ul",
        items: [
          "**Ringkasan profil:** 3–4 kata kunci utama yang paling relevan dengan posisi.",
          '**Pengalaman kerja:** kata kunci di dalam kalimat pencapaian, misalnya "Mengelola kampanye Google Ads dengan anggaran Rp 200 juta/bulan".',
          "**Keahlian:** daftar hard skills dan tools, ditulis persis seperti di lowongan.",
          '**Judul jabatan:** bila jabatanmu di perusahaan lama sangat unik, tambahkan padanan umumnya, misalnya "Growth Ninja (Digital Marketing Specialist)".',
        ],
      },
      {
        t: "callout",
        title: "Hindari keyword stuffing",
        text: "Mengulang kata kunci tanpa konteks, atau menyembunyikannya dengan teks berwarna putih, mudah terdeteksi dan merusak kesan di mata rekruter. Satu kata kunci yang ditulis dalam kalimat bermakna lebih berharga daripada sepuluh kali pengulangan.",
      },
      { t: "h2", text: "Contoh sebelum dan sesudah" },
      {
        t: "p",
        text: '**Sebelum:** "Bertanggung jawab atas media sosial perusahaan dan membuat konten menarik."',
      },
      {
        t: "p",
        text: '**Sesudah:** "Mengelola strategi social media marketing (Instagram, TikTok) dan content calendar bulanan; meningkatkan engagement rate dari 2,1% menjadi 4,8% dalam 6 bulan menggunakan analisis Meta Insights."',
      },
      {
        t: "p",
        text: "Versi kedua memuat kata kunci yang dicari (social media marketing, content calendar, engagement rate, Meta Insights) sekaligus pencapaian yang terukur.",
      },
      { t: "h2", text: "Mempercepat prosesnya" },
      {
        t: "p",
        text: "Mengumpulkan kata kunci secara manual memakan waktu bila kamu melamar ke banyak posisi. Fitur **Keyword Extractor** di CV Pintar membaca deskripsi lowongan dan mengelompokkan hard skills, soft skills, kualifikasi, dan action verbs, sehingga kamu tinggal memeriksa mana yang belum ada di CV. Lihat daftar fiturnya di halaman [fitur CV Pintar](/fitur).",
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Riset kata kunci pada dasarnya membaca lowongan dengan teliti: kumpulkan, tandai yang berulang, kelompokkan, lalu tulis secara natural di CV. Lakukan untuk setiap posisi yang kamu lamar, dan jangan lupa merapikan bagian pembukanya dengan [ringkasan CV yang kuat](/blog/cara-menulis-ringkasan-cv).",
      },
    ],
    faq: [
      {
        q: "Berapa banyak kata kunci yang ideal di CV?",
        a: "Tidak ada angka pasti. Fokus pada kata kunci yang benar-benar diminta lowongan dan kamu kuasai, biasanya 10–20 istilah yang tersebar di ringkasan, pengalaman, dan skill. Kualitas dan konteks lebih penting daripada jumlah.",
      },
      {
        q: "Bolehkah menulis keyword yang belum aku kuasai?",
        a: "Jangan. Selain berisiko ketahuan saat interview, itu merugikan kredibilitasmu. Tulis hanya yang benar-benar kamu bisa, dan pelajari sisanya jika posisinya memang kamu inginkan.",
      },
      {
        q: "Perlu memakai bahasa Inggris atau Indonesia untuk keyword?",
        a: 'Ikuti bahasa yang dipakai lowongan. Banyak istilah teknis memang lazim dalam bahasa Inggris (misalnya "project management"), sementara lowongan lain memakai bahasa Indonesia. Bila ragu, tulis keduanya sekali.',
      },
    ],
    cta: {
      title: "Ekstrak keyword dari lowongan incaranmu",
      text: "Tempel deskripsi lowongan, dapatkan daftar keyword yang perlu ada di CV-mu.",
      label: "Coba Keyword Extractor",
      to: "/register",
    },
    related: ["apa-itu-cv-ats", "cara-menulis-ringkasan-cv"],
  },
  {
    slug: "template-cv-gratis-vs-premium",
    title: "Template CV Gratis vs Premium: Mana yang Kamu Butuhkan?",
    category: "CV & Karier",
    excerpt:
      "Perbandingan jujur template CV gratis dan premium, plus tips memilih yang tepat untuk jenjang kariermu.",
    date: "2026-04-25",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: "Pertanyaan yang sering muncul saat membuat CV: perlu bayar atau cukup yang gratis? Jawabannya tergantung tahap kariermu dan seberapa serius kamu sedang melamar. Artikel ini membandingkan keduanya secara jujur, supaya kamu tidak membayar untuk sesuatu yang belum kamu butuhkan, dan tidak menghemat di tempat yang justru berdampak.",
      },
      { t: "h2", text: "Hal yang sama-sama penting, gratis maupun berbayar" },
      {
        t: "p",
        text: "Sebelum membahas perbedaan, ada hal yang seharusnya tidak berbeda: **kualitas dasar template**. Template yang baik, gratis atau premium, harus ramah ATS: satu kolom yang terbaca rapi, judul bagian standar, teks asli (bukan gambar), dan tipografi yang jelas. Di CV Pintar, semua template memenuhi hal ini. Perbedaannya ada di variasi desain, jumlah CV, dan fitur AI.",
      },
      { t: "h2", text: "Template gratis: kelebihan dan batasannya" },
      { t: "h3", text: "Cocok untuk" },
      {
        t: "ul",
        items: [
          "Fresh graduate yang baru membuat CV pertama.",
          "Kamu yang baru mulai melamar dan hanya butuh satu CV yang rapi.",
          "Orang yang ingin mencoba dulu sebelum memutuskan.",
        ],
      },
      { t: "h3", text: "Batasan yang perlu diketahui" },
      {
        t: "ul",
        items: [
          "Pilihan desain lebih sedikit (di CV Pintar, paket Free mencakup 2 template).",
          "Jumlah CV yang bisa disimpan terbatas (1 CV di paket Free).",
          "Kuota fitur AI lebih kecil, dan sebagian fitur lanjutan tidak tersedia.",
        ],
      },
      { t: "h2", text: "Template premium: apa yang kamu dapat" },
      {
        t: "ul",
        items: [
          "**Pilihan desain lebih luas**, termasuk gaya yang lebih kreatif untuk industri tertentu.",
          "**Lebih banyak CV tersimpan**, sehingga kamu bisa membuat versi berbeda untuk tiap jenis posisi.",
          "**Kuota AI lebih besar**: saran isi, skor ATS, review CV, dan cover letter.",
          "**Fitur lanjutan** seperti pencocokan CV dengan lowongan dan penyesuaian CV otomatis (tergantung paket).",
        ],
      },
      { t: "h2", text: "Kapan sebaiknya upgrade?" },
      {
        t: "ol",
        items: [
          "**Kamu melamar ke banyak perusahaan sekaligus.** Banyak versi CV (satu per jenis posisi) sangat membantu, dan itu butuh slot CV lebih banyak.",
          "**Kamu berganti industri atau posisi.** CV perlu disusun ulang dengan kata kunci baru, dan bantuan AI mempercepatnya.",
          "**Kamu menargetkan posisi senior atau manajerial.** Persaingan lebih ketat, jadi detail kecil seperti skor ATS dan review CV lebih berarti.",
          "**Kamu butuh banyak pilihan desain** untuk industri yang menilai estetika, seperti kreatif atau desain.",
        ],
      },
      {
        t: "callout",
        title: "Kalau ragu, mulai dari gratis",
        text: "Mulai dengan paket Free, selesaikan CV-mu, lalu lihat apakah kamu benar-benar butuh lebih. Tidak ada kewajiban upgrade, dan CV yang sudah dibuat tetap tersimpan.",
      },
      { t: "h2", text: "Perbandingan paket CV Pintar" },
      {
        t: "ul",
        items: [
          "**Free (Rp 0 selamanya):** 1 CV, 2 template, fitur AI dasar. Cocok untuk memulai.",
          "**Starter (Rp 15.000/bulan):** 3 CV, semua template, kuota AI lebih besar, dan fitur seperti cover letter dan pencocokan lowongan.",
          "**Pro (Rp 35.000/bulan):** 10 CV dan fitur terlengkap, termasuk penyesuaian CV otomatis, simulasi wawancara, dan analitik.",
        ],
      },
      {
        t: "p",
        text: "Detail lengkap tiap paket ada di halaman [harga CV Pintar](/harga), dan semua desain bisa kamu lihat lebih dulu di [koleksi template](/template).",
      },
      { t: "h2", text: "Tips memilih template yang tepat" },
      {
        t: "ul",
        items: [
          "**Sesuaikan dengan industri.** Perbankan, hukum, dan pemerintahan cocok dengan desain konservatif. Kreatif dan startup lebih fleksibel.",
          "**Utamakan keterbacaan.** Ukuran font, jarak, dan hierarki yang jelas lebih penting daripada hiasan.",
          "**Pertimbangkan panjang CV.** Template dengan kolom samping memuat banyak info di satu halaman, tetapi bisa kurang aman untuk ATS.",
          "**Coba dengan datamu sendiri.** Pratinjau dengan isi nyata menunjukkan bagaimana desain bekerja untuk pengalamanmu.",
        ],
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Template gratis sudah cukup untuk banyak orang, terutama yang baru mulai. Premium berguna ketika kamu butuh banyak versi CV, kuota AI lebih besar, dan fitur lanjutan untuk persaingan yang lebih ketat. Pilih sesuai kebutuhanmu saat ini, dan naikkan paket kalau memang diperlukan. Sebelum memilih, baca juga [apa itu CV ATS friendly](/blog/apa-itu-cv-ats) agar kamu tahu apa yang harus dipenuhi sebuah template.",
      },
    ],
    faq: [
      {
        q: "Apakah template gratis di CV Pintar ramah ATS?",
        a: "Ya. Semua template, gratis maupun berbayar, dirancang ramah ATS. Perbedaannya ada pada variasi desain, jumlah CV, dan fitur AI.",
      },
      {
        q: "Apakah saya harus berlangganan terus-menerus?",
        a: "Tidak. Kamu bisa berhenti kapan saja, dan CV yang sudah dibuat tidak hilang. Banyak pengguna hanya upgrade selama masa aktif melamar, lalu kembali ke paket gratis.",
      },
      {
        q: "Mana yang lebih penting: desain atau isi CV?",
        a: "Isi. Desain yang bagus hanya membantu membuat isi mudah dibaca. Pencapaian yang jelas, kata kunci yang relevan, dan ringkasan yang tajam menentukan apakah kamu dipanggil.",
      },
    ],
    cta: {
      title: "Lihat semua template dan pilih yang paling cocok",
      text: "Pratinjau desain, bandingkan gaya, dan mulai dari paket gratis.",
      label: "Lihat Template CV",
      to: "/template",
    },
    related: ["apa-itu-cv-ats", "cara-menulis-ringkasan-cv"],
  },
  {
    slug: "cara-menulis-ringkasan-cv",
    title: "Cara Menulis Ringkasan CV yang Bikin Rekruter Berhenti Scroll",
    category: "CV & Karier",
    excerpt:
      "Ringkasan profil adalah bagian paling krusial di CV. Pelajari formula menulis ringkasan yang memikat.",
    date: "2026-05-01",
    updated: "2026-10-05",
    body: [
      {
        t: "p",
        text: 'Rekruter yang memegang puluhan CV tidak membaca semuanya dari awal sampai akhir. Mereka melihat bagian atas lebih dulu, dan di sanalah **ringkasan profil** berperan. Sering disebut-sebut bahwa keputusan awal diambil dalam hitungan detik. Terlepas dari angka pastinya, intinya jelas: bagian atas CV harus langsung menjawab "kenapa orang ini layak dipertimbangkan?".',
      },
      { t: "h2", text: "Apa itu ringkasan CV?" },
      {
        t: "p",
        text: "Ringkasan CV (profil profesional) adalah 2–4 kalimat di bagian atas yang merangkum siapa kamu, apa keahlian utamamu, dan nilai apa yang kamu bawa. Bagian ini bukan tempat menceritakan seluruh riwayat, melainkan cuplikan terbaik yang relevan dengan posisi yang dilamar.",
      },
      { t: "h2", text: "Formula menulis ringkasan yang efektif" },
      {
        t: "ol",
        items: [
          "**Peran dan pengalaman.** Siapa kamu secara profesional dan sudah berapa lama.",
          "**Keahlian utama.** 2–3 skill atau bidang yang paling relevan dengan lowongan.",
          "**Pencapaian dengan angka.** Satu hasil nyata yang bisa diukur.",
          "**Nilai yang kamu tawarkan.** Apa yang bisa kamu bawa ke perusahaan target.",
        ],
      },
      { t: "h2", text: "Contoh ringkasan yang baik" },
      { t: "h3", text: "Untuk profesional berpengalaman" },
      {
        t: "p",
        text: '"Frontend Developer dengan 5+ tahun pengalaman membangun aplikasi web skala enterprise. Spesialis React, TypeScript, dan performa web; berhasil meningkatkan skor Core Web Vitals aplikasi sebesar 40%. Berpengalaman memimpin tim engineering 5 orang dan berkolaborasi dengan tim product dan design."',
      },
      { t: "h3", text: "Untuk fresh graduate" },
      {
        t: "p",
        text: '"Lulusan S1 Manajemen (IPK 3,7) dengan pengalaman magang 6 bulan di bidang digital marketing. Terampil mengelola konten Instagram dan analisis dasar dengan Google Analytics; berkontribusi menaikkan jangkauan akun magang sebesar 60% dalam 3 bulan. Bersemangat belajar dan siap berkontribusi sebagai Marketing Associate."',
      },
      { t: "h3", text: "Untuk pindah karier" },
      {
        t: "p",
        text: '"Profesional pendidikan dengan 4 tahun pengalaman menyusun materi dan mengelola kelas hingga 40 peserta, kini beralih ke bidang UX research. Bersertifikat Google UX Design, telah menyelesaikan 3 proyek studi kasus dengan riset pengguna dan prototipe. Membawa keterampilan komunikasi dan fasilitasi yang kuat ke tim produk."',
      },
      { t: "h2", text: "Kesalahan yang sering terjadi" },
      {
        t: "ul",
        items: [
          '**Klise tanpa bukti.** "Pekerja keras", "cepat beradaptasi", dan "komunikatif" bisa dikatakan siapa saja. Tunjukkan lewat hasil.',
          "**Terlalu panjang.** Lebih dari 4 kalimat membuat intinya tenggelam.",
          "**Tidak relevan.** Ringkasan yang sama untuk semua lowongan tidak menyentuh kebutuhan posisinya.",
          '**Memakai kata ganti orang pertama berlebihan.** Langsung ke isi: "Mengelola…", "Membangun…".',
          "**Tanpa angka.** Persentase, jumlah, atau skala memberi bobot pada klaimmu.",
        ],
      },
      { t: "h2", text: "Sesuaikan dengan tiap lowongan" },
      {
        t: "p",
        text: "Baca lowongan, ambil 2–3 kata kunci utama, dan pastikan muncul di ringkasan dengan wajar. Cara menemukannya ada di [panduan riset keyword CV](/blog/keyword-cv-ats). Cukup ubah satu atau dua kalimat untuk tiap lamaran, tidak perlu menulis ulang dari nol.",
      },
      {
        t: "callout",
        title: "Tes cepat",
        text: "Baca ringkasanmu lalu tanyakan: jika rekruter hanya membaca bagian ini, apakah dia tahu apa keahlian utamamu dan satu hal yang sudah kamu capai? Kalau belum, tambahkan.",
      },
      { t: "h2", text: "Ringkasan dan ATS" },
      {
        t: "p",
        text: "Karena ringkasan berada di bagian paling atas, di sinilah kata kunci utama sebaiknya muncul. Tulis sebagai paragraf biasa, bukan tabel atau kotak dekoratif, agar mudah terbaca sistem. Pelajari dasar-dasarnya di [apa itu CV ATS friendly](/blog/apa-itu-cv-ats).",
      },
      { t: "h2", text: "Dibantu AI, dikerjakan olehmu" },
      {
        t: "p",
        text: "Kalau kesulitan memulai, fitur AI Saran di editor CV Pintar bisa memberi beberapa opsi ringkasan berdasarkan pengalaman dan posisi yang kamu tuju. Perlakukan hasilnya sebagai draf: ganti dengan angka dan detail yang benar-benar kamu alami. Kamu bisa mencobanya langsung dari [template CV](/template) pilihanmu.",
      },
      { t: "h2", text: "Kesimpulan" },
      {
        t: "p",
        text: "Ringkasan yang baik singkat, spesifik, dan relevan: peran, keahlian utama, satu pencapaian terukur, dan nilai yang kamu tawarkan. Luangkan beberapa menit menyesuaikannya untuk tiap lamaran, karena bagian kecil ini sering menentukan apakah sisa CV-mu dibaca.",
      },
    ],
    faq: [
      {
        q: "Perlu ringkasan CV kalau pengalamanku masih sedikit?",
        a: "Perlu, dan justru berguna. Ringkasan memungkinkan kamu menonjolkan pendidikan, magang, proyek, atau skill yang relevan sebelum rekruter membaca bagian lain yang masih singkat.",
      },
      {
        q: "Berapa panjang ringkasan CV yang ideal?",
        a: "Sekitar 2–4 kalimat, atau 50–80 kata. Cukup untuk menyampaikan peran, keahlian, pencapaian, dan nilai tanpa membuat bagian atas CV terasa berat.",
      },
      {
        q: "Apa bedanya ringkasan CV dengan objektif karier?",
        a: "Objektif karier fokus pada apa yang kamu cari, sedangkan ringkasan fokus pada apa yang kamu tawarkan. Ringkasan umumnya lebih disukai karena langsung menunjukkan nilai bagi perusahaan.",
      },
    ],
    cta: {
      title: "Buat ringkasan CV dengan bantuan AI",
      text: "Dapatkan beberapa opsi ringkasan yang disesuaikan dengan posisi targetmu, lalu sempurnakan dengan detailmu sendiri.",
      label: "Mulai Buat CV",
      to: "/register",
    },
    related: ["apa-itu-cv-ats", "keyword-cv-ats"],
  },
];

export const blogPostsBySlug: Record<string, BlogPost> = Object.fromEntries(
  blogPosts.map((p) => [p.slug, p]),
);

/** Perkiraan menit baca (± 200 kata/menit). */
export function readingMinutes(post: BlogPost): number {
  const words = post.body
    .map((b) => {
      if (b.t === "ul" || b.t === "ol") return b.items.join(" ");
      if (b.t === "callout") return `${b.title} ${b.text}`;
      return b.text;
    })
    .concat(post.faq.map((f) => `${f.q} ${f.a}`))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Slug unik untuk anchor daftar isi. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}
