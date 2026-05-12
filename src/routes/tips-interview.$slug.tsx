import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import {
  ArrowLeft,
  Clock,
  Award,
  Star,
  CheckCircle2,
  Lightbulb,
  Target,
  Zap,
  BookOpen,
  ChevronRight,
  Heart,
  Share2,
  Bookmark,
  GraduationCap,
  MessageSquare,
  Laptop,
  CircleDollarSign,
  Sparkles,
  FileText,
  Shirt,
  ClipboardList,
  Search,
  MessageCircle,
  Briefcase,
  AlertTriangle,
  Wrench,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TipIconName =
  | "GraduationCap"
  | "MessageSquare"
  | "Laptop"
  | "CircleDollarSign"
  | "Sparkles"
  | "Target";

type SectionIconName =
  | "Target"
  | "FileText"
  | "Shirt"
  | "ClipboardList"
  | "Hash"
  | "Search"
  | "MessageCircle"
  | "Briefcase"
  | "AlertTriangle"
  | "BookOpen"
  | "Wrench"
  | "Lightbulb"
  | "Sparkles";

const tipIconMap: Record<TipIconName, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  MessageSquare,
  Laptop,
  CircleDollarSign,
  Sparkles,
  Target,
};

const sectionIconMap: Record<SectionIconName, React.ComponentType<{ className?: string }>> = {
  Target,
  FileText,
  Shirt,
  ClipboardList,
  Hash,
  Search,
  MessageCircle,
  Briefcase,
  AlertTriangle,
  BookOpen,
  Wrench,
  Lightbulb,
  Sparkles,
};

type TipContent = {
  title: string;
  category: string;
  excerpt: string;
  icon: TipIconName;
  readTime: string;
  level: string;
  date: string;
  color: string;
  borderColor: string;
  keyPoints: string[];
  body: TipSection[];
  relatedTips: string[];
};

type TipSection = {
  title: string;
  content: string[];
  icon?: SectionIconName;
  highlight?: boolean;
};

const tipsContent: Record<string, TipContent> = {
  "persiapan-interview-pertama": {
    title: "Persiapan Interview Pertama untuk Fresh Graduate",
    category: "Fresh Graduate",
    excerpt:
      "Riset perusahaan, latihan jawaban STAR, dan tips berpakaian untuk interview pertamamu.",
    icon: "GraduationCap",
    readTime: "5 menit",
    level: "Pemula",
    date: "2026-05-01",
    color: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-200",
    keyPoints: [
      "Riset perusahaan target minimal 30 menit",
      "Latihan metode STAR untuk behavioral questions",
      "Siapkan 3-5 achievement untuk diceritakan",
      "Pakaian rapi formal atau business casual",
      "Bawa dokumen lengkap + portofolio",
    ],
    body: [
      {
        title: "Riset Perusahaan: Jangan Asal Datang",
        icon: "Target",
        content: [
          "Mau masuk perusahaan teknologi? Riset dulu produk mereka, target market, dan teknologi yang dipakai. Mau ke startup? Pahami visi misi dan budaya perusahaan. Minimal 30 menit riset bisa bikin kamu beda dari kandidat lain.",
          "Cek juga Glassdoor, Jobstreet, atau LinkedIn untuk tahu review karyawan. Ini bisa jadi insight tambahan tentang budaya kerja dan pertanyaan yang sering ditanyakan.",
          "Kalau bisa, cari tahu nama interviewer kamu. Di LinkedIn, cari tahu background dan posisi mereka. Ini membantu kamu customize jawaban dan membangun rapport.",
        ],
        highlight: true,
      },
      {
        title: "Latihan Metode STAR",
        icon: "FileText",
        content: [
          "STAR = Situation, Task, Action, Result. Ini framework untuk jawab pertanyaan behavioral. Contoh: 'Ceritakan saat kamu menghadapi konflik di tim'.",
          "Situation: Konteks situasinya. Task: Apa tugamu. Action: Apa yang kamu lakukan. Result: Hasilnya apa (最好 ada angka).",
          "Untuk fresh graduate, siapkan 3-5 cerita dari pengalaman organisasi, project kuliah, magang, atau volunteer. Cerita yang spesifik lebih convincing daripada yang generik.",
        ],
      },
      {
        title: "Tips Berpakaian & Attitude",
        icon: "Shirt",
        content: [
          "Aturan umum: satu level lebih rapi dari expectation. Kalau kantor business casual, pakai semi-formal. Kalau sudah formal, pakainya jangan terlalu santai.",
          "Hindari: parfum terlalu strong, makeup berlebihan, parfum/lotion wangi menyengat, HP yang bunyi saat interview, dan posture yang tidak percaya diri.",
          "Datang 10-15 menit lebih awal. Salam dengan senyum, jabat tangan firm, dan maintain eye contact. Ini basic tapi banyak fresh graduate yang miss.",
        ],
      },
      {
        title: "Checklist Sebelum Interview",
        icon: "ClipboardList",
        content: [
          "CV beberapa kopi (kalau interviewer mau lihat hardcopy)",
          "Portofolio atau karya yang relevan (design, coding, writing samples)",
          "Ijazah & transkrip nilai (kalau diminta)",
          "Sertifikat pelatihan atau workshop",
          "ID / KTP",
          "Notes kecil untuk pertanyaan yang mau kamu ajukan",
          "HP silent / airplane mode",
        ],
      },
    ],
    relatedTips: [
      "pertanyaan-hr-umum",
      "behavioral-star-method",
      "pertanyaan-balik-ke-hr",
    ],
  },
  "pertanyaan-hr-umum": {
    title: "10 Pertanyaan HR Paling Sering Ditanyakan & Cara Jawabnya",
    category: "HR Interview",
    excerpt:
      "Dari 'Ceritakan tentang diri Anda' sampai 'Apa kelemahan Anda' — lengkap dengan contoh jawaban yang meyakinkan.",
    icon: "MessageSquare",
    readTime: "8 menit",
    level: "Semua Level",
    date: "2026-05-02",
    color: "from-purple-500/10 to-pink-500/10",
    borderColor: "border-purple-200",
    keyPoints: [
      "Siapkan 3 versi自我介绍: 30 detik, 1 menit, 2 menit",
      "Untuk weakness, pilih yang realistis tapi tidak krusial",
      "Ceritakan achievement dengan metrik (angka)",
      "TAY = Tambahkan, Ubah, Yakin framework",
      "Jangan pernah bahas hal negatif tentang perusahaan lama",
    ],
    body: [
      {
        title: "'Ceritakan Tentang Diri Anda'",
        icon: "Hash",
        content: [
          "Ini bukan invitation untuk recite biography. Jawab dengan formula: [Posisi sekarang] + [pengalaman relevan] + [kenapa tertarik posisi ini].",
          "Contoh: 'Saya Backend Developer dengan 3 tahun pengalaman di Go dan Python. Baru saja menyelesaikan project e-commerce yang melayani 100k+ users. Saya tertarik posisi ini karena fokus pada scalability — bidang yang saya sangat passionate pelajari.'",
          "Praktikan sampai natural. Biasanya ini pertanyaan pembuka, jadi kamu butuh membangun confidence di sini.",
        ],
        highlight: true,
      },
      {
        title: "'Apa Kelebihan & Kelemahan Anda?'",
        icon: "Hash",
        content: [
          "Strength: Pilih yang relevan dengan posisi. Sebut 2-3, dengan contoh konkret untuk masing-masing. Jangan cuma bilang 'saya pekerja keras' tanpa bukti.",
          "Weakness: Pilih weakness yang realistis tapi tidak fatal untuk posisi. Contoh: 'Saya kadang terlalu perfectionist sehingga micromanage tim' (untuk manager). Atau 'Saya belum terlalu familiar dengan [tool X] tapi sedang aktif belajarnya.'",
          "Kunci: acknowledge weakness kamu dan tunjukkan kamu sudah take steps untuk improve.",
        ],
      },
      {
        title: "'Kenapa Ingin Bergabung dengan Kami?'",
        icon: "Hash",
        content: [
          "NEVER jawab: 'Karena gajinya besar' atau 'Saya butuh kerja'. Ini instant deal-breaker.",
          "Gunakan 3 komponen: [Industri] + [Perusahaan spesifik] + [Kontribusi]. Contoh: 'Saya tertarik di edutech karena percaya pendidikan adalah fondasi bangsa. [Company] punya pendekatan belajar yang inovatif dengan AI-powered learning path — sesuai dengan background saya di educational technology. Saya ingin berkontribusi membangun fitur yang membantu students lebih engaging.'",
        ],
      },
      {
        title: "'Kemana Arah Karier Anda 5 Tahun ke Depan?'",
        icon: "Hash",
        content: [
          "Tunjukkan kamu punya roadmap, bukan main-main. tapi juga jangan terlalu ambitious sampai mengancam posisi interviewer.",
          "Contoh: 'Dalam 2 tahun ke depan, saya ingin deepen expertise di [specific area]. Dalam 5 tahun, saya hope bisa lead a team atau become a specialist yang bisa mentor junior developers.'",
          "Sesuaikan dengan level posisi. Untuk entry-level, fokus pada growth. Untuk senior, fokus pada impact.",
        ],
      },
      {
        title: "'Ceritakan Pengalaman Sulit & Bagaimana Mengatasinya'",
        icon: "Hash",
        content: [
          "Gunakan STAR method. Pilih cerita yang resolution-nya positif dan menunjukkan kamu learn from experience.",
          "Jangan cerita tentang orang lain yang salah. Fokus pada situation dan apa yang YOU bisa kontrol. Ini menunjukkan ownership dan maturity.",
          "Contoh plot: ada conflict dengan team member → kamu inisiasi one-on-one → kalian reach compromise → result: project selesai on-time dan team synergy improved.",
        ],
      },
      {
        title: "'Bagaimana Anda Handle Pressure / Deadline Ketat?'",
        icon: "Hash",
        content: [
          "Semua orang pasti pernah pressure. Yang HR cari: apakah kamu panik atau stay calm dan bisa prioritize.",
          "Jawab dengan: [Situation] + [Approach] + [Result]. Contoh: 'Saat ada production issue jam 11 malam, saya stay calm, triage issues, communicate dengan stakeholder tentang ETA, dan fix dalam 2 jam dengan zero data loss.'",
          "Tunjukkan kamu punya coping mechanism yang healthy: prioritize, communicate early, delegate kalau bisa.",
        ],
      },
      {
        title: "'Ada Pertanyaan untuk Kami?'",
        icon: "Hash",
        content: [
          "WAJIB punya 3-5 pertanyaan. Tidak bertanya = appear uninterested.",
          "Good questions: 'Bagaimana onboarding processnya?', 'Apa biggest challenge tim ini sekarang?', 'Bagaimana success diukur untuk posisi ini?'",
          "Avoid: 'Berapa gaji dan cuti?' (tanyakan saat HR rounds), 'Apa produk perusahaan?' (riset dulu), 'Kapan promosi?' (too early).",
        ],
      },
    ],
    relatedTips: [
      "persiapan-interview-pertama",
      "behavioral-star-method",
      "pertanyaan-balik-ke-hr",
    ],
  },
  "interview-technical-tech": {
    title: "Tips Interview Technical untuk Posisi Software Engineer",
    category: "Technical",
    excerpt:
      "Live coding, system design, dan behavioral di perusahaan tech Indonesia & global.",
    icon: "Laptop",
    readTime: "10 menit",
    level: "Menengah",
    date: "2026-05-03",
    color: "from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-200",
    keyPoints: [
      "LeetCode/Educative untuk latihan soal dasar",
      "Pelajari Clean Code & SOLID principles",
      "Think out loud selama coding interview",
      "System design: start dari scope clarification",
      "Behavioral: gunakan STAR method",
    ],
    body: [
      {
        title: "Live Coding: Think Out Loud",
        icon: "Target",
        content: [
          "Di teknikal interview, proses berpikirmu sama penting dengan jawaban. Kalau kamu diam 10 menit dan langsung kasih solusi sempurna, interviewer miss insight tentang approach kamu.",
          "Start dengan: Clarify problem, Edge cases, Approach options, Pilih approach + alasan. Baru implementasi. Setelah selesai, test dengan beberapa cases.",
          "Kalau stuck, jangan diam. Tanya clarifying questions. Ini justru bagus karena menunjukkan kamu think systematically.",
        ],
        highlight: true,
      },
      {
        title: "Topik yang Sering Keluar",
        icon: "BookOpen",
        content: [
          "Array/String manipulation (90% interview): two pointers, sliding window, hashmap usage",
          "Data structures: Tree traversal, Graph (BFS/DFS), Stack/Queue",
          "Algorithms: Sorting, Searching, Recursion + Memoization",
          "Database: JOIN types, Indexing, Query optimization, ACID properties",
          "System Design: Scalability, Caching, Database sharding, Microservices basics",
        ],
      },
      {
        title: "System Design Interview",
        icon: "Wrench",
        content: [
          "Step 1: Scope Clarification — tanya requirements, user scale, functional requirements. Jangan langsung jumping ke solusi.",
          "Step 2: High-level Design — propose architecture utama dengan komponen-komponen besar.",
          "Step 3: Deep Dive — discuss trade-offs, bottleneck, scaling strategies, dan alternative solutions.",
          "Resources: Alex Xu's 'System Design Interview' books, Exponent, dan review case studies dari perusahaan besar.",
        ],
      },
      {
        title: "Tips Tambahan",
        icon: "Lightbulb",
        content: [
          "Kalau perusahaan pakai specific tech stack, riset dan prepare. Contoh: Tokopedia/Lazada/Gojek biasanya bahas tentang microservices, event-driven architecture, dan scale challenges.",
          "Untuk startup: biasanya lebih practical. Mungkin minta kamu code sesuatu yang langsung relate ke produk mereka.",
          "Selalu ask clarifying questions sebelum mulai. 5 menit clarification bisa save kamu dari arah yang salah.",
          "Setelah interview, kirim thank-you email dalam 24 jam. Rare tapi appreciated.",
        ],
      },
    ],
    relatedTips: [
      "pertanyaan-hr-umum",
      "behavioral-star-method",
      "negosiasi-gaji",
    ],
  },
  "negosiasi-gaji": {
    title: "Cara Negosiasi Gaji Tanpa Bikin Awkward",
    category: "Karier",
    excerpt:
      "Riset salary range, framing pertanyaan, dan kapan waktu yang tepat membahas gaji.",
    icon: "CircleDollarSign",
    readTime: "6 menit",
    level: "Semua Level",
    date: "2026-05-04",
    color: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-200",
    keyPoints: [
      "Riset salary range via Glassdoor, Jobstreet, LinkedIn Salary",
      "Jangan pernah give number pertama",
      "Gunakan range, bukan angka pasti",
      "Consider total package, bukan cuma base salary",
      "Negosiasi itu normal, bukan greedy",
    ],
    body: [
      {
        title: "Riset Salary Range Dulu",
        icon: "Search",
        content: [
          "Check: Glassdoor, Jobstreet Salary Guide, LinkedIn Salary, Levels.fyi (untuk tech), dan tanya teman di industri yang sama.",
          "Consider faktor: lokasi (Jakarta vs other cities beda), company size (startup vs korporat), industry (fintech biasanya lebih tinggi dari retail), experience level, dan skill scarcity.",
          "Dari riset ini, tentukan 3 angka: floor (minimum acceptable), target (yang kamu mau), dan stretch (ideal scenario).",
        ],
        highlight: true,
      },
      {
        title: "Kapan dan Bagaimana Membahas Gaji",
        icon: "MessageCircle",
        content: [
          "Wait for them to bring it up. Biasanya HR akan discuss compensation setelah kamu pass technical rounds. Kalau mereka tanya ekspektasi gaji, jangan langsung give specific number.",
          "Framing yang bagus: 'Berdasarkan pengalaman dan market rate, saya expect di range X-Y. Tapi saya open untuk discuss total package including benefits.'",
          "Kalau asked point-blank: 'Bisa расскажи dulu full benefits package-nya?' — ini memberi kamu waktu dan info tambahan sebelum commit ke angka.",
        ],
      },
      {
        title: "Beyond Base Salary",
        icon: "Briefcase",
        content: [
          "Jangan cuma fokus di base salary. Consider: signing bonus, annual bonus (% atau fixed), equity/stock options, health insurance coverage, remote work policy, learning & development budget, dan company perks.",
          "Contoh: Base 15jt vs Base 13jt + signing bonus 24jt + equity 0.5% jelas beda jauh. 第二 lebih menarik jangka panjang.",
          "Kalau perusahaan tidak bisa give more cash, negotiate on other aspects: extra vacation days, work-from-home flexibility, training budget, atau project choice.",
        ],
      },
      {
        title: "Yang Harus Dihindari",
        icon: "AlertTriangle",
        content: [
          "Jangan threat untuk walk away kalau tidak ready — ini burn bridge.",
          "Jangan lie tentang offers dari perusahaan lain — bisa checked dan damage trust.",
          "Jangan terlalu eager sampai appear desperate — negotiation power kamu langsung drop.",
          "Jangan accept offer di spot. Minimize: 'Boleh saya think about it and get back to you by [date]?' — ini normal dan professional.",
          "Kalau final offer masih below expectation: 'Saya appreciate the offer. Based on my research and experience, I believe X is fair. Is there flexibility to reconsider?' — ask politely, be ready to walk away if needed.",
        ],
      },
    ],
    relatedTips: [
      "pertanyaan-hr-umum",
      "interview-technical-tech",
      "pertanyaan-balik-ke-hr",
    ],
  },
  "pertanyaan-balik-ke-hr": {
    title: "5 Pertanyaan Cerdas yang Bikin HR Terkesan",
    category: "HR Interview",
    excerpt:
      "Pertanyaan yang menunjukkan kamu serius dan sudah riset perusahaan.",
    icon: "Sparkles",
    readTime: "4 menit",
    level: "Pemula",
    date: "2026-05-05",
    color: "from-rose-500/10 to-red-500/10",
    borderColor: "border-rose-200",
    keyPoints: [
      "Tanya tentang onboarding dan training process",
      "Tanya biggest challenge tim saat ini",
      "Tanya success metrics untuk posisi ini",
      "Tanya tentang company culture",
      "Tanya tentang growth opportunities",
    ],
    body: [
      {
        title: "Kenapa Pertanyaanmu Penting?",
        icon: "Target",
        content: [
          "Interview itu two-way street. Kamu juga evaluating perusahaan. Pertanyaan yang bagus menunjukkan kamu: sudah riset, think critically, genuinely interested, dan professional.",
          "HR/manager juga appreciate candidate yang engaged. Ini differentiator yang often underestimated.",
          "Contoh: Dua kandidat dengan qualifications sama — satu cuma jawab pertanyaan, satu lain ask insightful questions. Siapa yang akan remembered?",
        ],
        highlight: true,
      },
      {
        title: "5 Pertanyaan yang Bikin Terkesan",
        icon: "Sparkles",
        content: [
          "1. 'Bagaimana onboarding process untuk new hire di posisi ini? Apakah ada mentorship program?' — shows you care about success dan eager to learn.",
          "2. 'Apa biggest challenge yang tim/departemen ini hadapi saat ini?' — shows you think about how you can contribute, bukan just receive.",
          "3. 'Dari perspektif Anda, apa yang membedakan kandidat yang thrive di perusahaan ini dari yang tidak?' — gives insight tentang culture dan expectations.",
          "4. 'Bagaimana success diukur untuk role ini di 30/60/90 hari pertama?' — shows you think about performance dan clear deliverables.",
          "5. 'Apa opportunity growth yang tersedia untuk seseorang di role ini dalam 1-2 tahun ke depan?' — shows you think long-term dan motivated.",
        ],
      },
      {
        title: "Yang Harus Dihindari",
        icon: "AlertTriangle",
        content: [
          "'Apa produk/perusahaan ini?' — Means you didn't research. Instant red flag.",
          "'Berapa cuti dan jam kerja?' — Too early. Wait till later rounds atau ask HR directly.",
          "'Kapan saya bisa promoted?' — Appear impatient.",
          "'Apakah orang-orang di sini happy?' — Negative framing.换成: 'Bagaimana culture collaboration di tim?'",
          "Asking too many questions (lebih dari 5-7). Pick yang most important for you.",
        ],
      },
    ],
    relatedTips: [
      "pertanyaan-hr-umum",
      "persiapan-interview-pertama",
      "behavioral-star-method",
    ],
  },
  "behavioral-star-method": {
    title: "Metode STAR untuk Jawab Pertanyaan Behavioral",
    category: "Behavioral",
    excerpt:
      "Situation, Task, Action, Result — framework jawaban yang terstruktur dan meyakinkan.",
    icon: "Target",
    readTime: "7 menit",
    level: "Menengah",
    date: "2026-05-06",
    color: "from-indigo-500/10 to-violet-500/10",
    borderColor: "border-indigo-200",
    keyPoints: [
      "S = Situation — Konteks dimana event terjadi",
      "T = Task — Tugas atau tanggung jawabmu",
      "A = Action — Langkah spesifik yang kamu ambil",
      "R = Result — Hasil konkret dengan angka",
      "Pilih cerita dengan ending positif",
    ],
    body: [
      {
        title: "Apa Itu Metode STAR?",
        icon: "BookOpen",
        content: [
          "STAR adalah framework untuk menjawab pertanyaan behavioral interview dengan struktur yang clear dan compelling.",
          "Mengapa efektif? Karena membantu kamu organize thoughts, memberikan konteks yang cukup, dan highlight contributions kamu dengan cara yang mudah dipahami interviewer.",
          "Tanpa STAR, jawaban sering jadi: terlalu panjang dan lost point, atau terlalu pendek dan lack substance. STAR gives you balance.",
        ],
        highlight: true,
      },
      {
        title: "Breaking Down Each Component",
        icon: "Wrench",
        content: [
          "SITUATION (1-2 sentences): Set the scene. Kapan, dimana, dengan siapa. Contoh: 'Saat saya magang di PT X, tim kami menghadapi deadline project yang sangat ketat.'",
          "TASK (1-2 sentences): Apa tanggung jawab kamu di situasi ini. Contoh: 'Sebagai intern, saya bertanggung jawab membantu backend development sambil belajar framework baru.'",
          "ACTION (3-5 sentences): Ini adalah BINTANG jawaban kamu. Detail apa yang YOU specifically lakukan. Gunakan 'I', bukan 'we'. Contoh: 'Saya allocate 2 jam setiap pagi untuk self-learn dokumentasi. Setiap siang, saya pair programming dengan senior developer. Setiap sore, saya implement feature kecil-kecilan untuk build confidence.'",
          "RESULT (1-2 sentences with metrics): Apa outcome-nya. Gunakan angka kalau bisa. Contoh: 'Dalam 6 minggu, saya berhasil complete 3 features dan receive positive feedback dari tech lead, contribution saya 20% dari sprint deliverables.'",
        ],
      },
      {
        title: "Tips for Strong STAR Answers",
        icon: "Lightbulb",
        content: [
          "Pilih cerita dengan RESOLUSI POSITIF. Even kalau situation negatif, highlight apa yang kamu learn atau improve.",
          "Metrics are your friend. 'Decreased loading time by 40%' > 'Made the app faster'.",
          "Specificity builds credibility. 'Implemented caching with Redis' > 'Improved database performance'.",
          "Focus pada YOUR contributions, bukan group achievements. Yang interviewer cari adalah apa yang YOU specifically bring to the table.",
          "Praktikan dengan timer. Ideal answer: 2-3 minutes. Too short = lack substance, too long = lose attention.",
        ],
      },
      {
        title: "Common Behavioral Questions & STAR Examples",
        icon: "FileText",
        content: [
          "Q: 'Ceritakan saat kamu menangani conflict di tim' → S: Project deadline conflict dengan coworker. T: Perlu collaborate untuk meet deadline. A: I scheduled 1-on-1 untuk understand perspective masing-masing, propose compromise, communicate with PM about realistic timeline. R: Project delivered on-time, relationship with coworker improved, PM appreciate proactive communication.",
          "Q: 'Ceritakan saat kamu gagal' → S: First time lead a project, timeline unrealistic. T: Ensure project success despite challenges. A: Identified bottleneck early, communicate transparently with stakeholders about risks, re-prioritized features, asked for help when needed. R: Delivered core features on time, learned importance of buffer time and stakeholder management.",
          "Q: 'Ceritakan saat kamu melebihi expectations' → S: Receieved ambiguous task with tight deadline. T: Deliver beyond expectations. A: Proactively researched industry best practices, proposed improvements yang not requested, worked extra hours to polish. R: Deliverable praised by client, became template for future projects.",
        ],
      },
    ],
    relatedTips: [
      "pertanyaan-hr-umum",
      "persiapan-interview-pertama",
      "negosiasi-gaji",
    ],
  },
};

export const Route = createFileRoute("/tips-interview/$slug")({
  pendingComponent: TipDetailSkeleton,
  loader: ({ params }) => {
    const tip = tipsContent[params.slug];
    if (!tip) throw notFound();
    return { tip, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Tips tidak ditemukan" }] };
    const { tip, slug } = loaderData;
    return buildSeo({
      title: `${tip.title} — Tips Interview CV Pintar`,
      description: tip.excerpt,
      path: `/tips-interview/${slug}`,
      type: "article",
      keywords: `tips interview ${tip.category.toLowerCase()}, ${tip.title.toLowerCase()}`,
      articlePublishedTime: tip.date,
      articleModifiedTime: tip.date,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Beranda", item: "https://cvpintar.web.id" },
            { "@type": "ListItem", position: 2, name: "Tips Interview", item: "https://cvpintar.web.id/tips-interview" },
            { "@type": "ListItem", position: 3, name: tip.title },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: tip.title,
          description: tip.excerpt,
          articleSection: tip.category,
          datePublished: tip.date,
          dateModified: tip.date,
          inLanguage: "id-ID",
          author: { "@type": "Organization", name: "CV Pintar" },
          publisher: { "@type": "Organization", name: "CV Pintar", url: "https://cvpintar.web.id" },
        },
      ],
    });
  },
  component: TipDetailPage,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-3xl font-bold">
        Tips tidak ditemukan
      </h1>
      <p className="text-muted-foreground mt-2">
        Artikel yang kamu cari tidak tersedia.
      </p>
      <Button asChild className="mt-6">
        <Link to="/tips-interview">Kembali ke Tips Interview</Link>
      </Button>
    </div>
  ),
});

function TipDetailSkeleton() {
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-3 h-12 w-full" />
      <Skeleton className="mt-4 h-6 w-2/3" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

function SectionIcon({ name }: { name: SectionIconName }) {
  const Icon = sectionIconMap[name];
  return Icon ? <Icon className="w-5 h-5" /> : null;
}

function TipDetailPage() {
  const { tip } = Route.useLoaderData();
  const MainIcon = tipIconMap[tip.icon];

  return (
    <article className="container-page py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          to="/tips-interview"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Semua Tips Interview
        </Link>

        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{tip.category}</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {tip.readTime} baca
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              {tip.level}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br w-16 h-16",
                tip.color,
              )}
            >
              {MainIcon && <MainIcon className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
                {tip.title}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                {tip.excerpt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 border-y">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Tips dari profesional HR Indonesia</span>
            </div>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="gap-1">
              <Bookmark className="w-4 h-4" />
              Save
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Key Points */}
        <Card className={cn("mt-8 border-2", tip.borderColor)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Key Points yang Harus Kamu Ingat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tip.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="mt-10 space-y-8">
          {tip.body.map((section, i) => (
            <section key={i} className="space-y-4">
              {section.highlight && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold text-primary">
                      Wajib Dibaca
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ini adalah poin paling penting dari tips ini.
                    </p>
                  </div>
                </div>
              )}

              <h2 className="flex items-center gap-2 font-display text-xl md:text-2xl font-bold pt-4">
                {section.icon && <SectionIcon name={section.icon} />}
                {section.title}
              </h2>

              <div className="space-y-4 text-foreground leading-relaxed">
                {section.content.map((paragraph, j) => (
                  <p key={j} className="text-base md:text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Related Tips */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Tips Terkait yang Mungkin Kamu Suka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {tip.relatedTips.map((slug) => {
                const relatedTip = tipsContent[slug];
                if (!relatedTip) return null;
                const RelatedIcon = tipIconMap[relatedTip.icon];
                return (
                  <Link
                    key={slug}
                    to="/tips-interview/$slug"
                    params={{ slug }}
                    className="group flex items-center gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <span className="flex items-center justify-center w-8 h-8">
                      {RelatedIcon && <RelatedIcon className="w-5 h-5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                        {relatedTip.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {relatedTip.readTime} • {relatedTip.level}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 md:p-8 text-center">
            <Heart className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">
              Siap Praktikkan Sekarang?
            </h3>
            <p className="text-muted-foreground mb-6">
              Setelah baca tips ini, cobain buat CV ATS-friendly yang bikin
              rekruter tertarik!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/cv" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Buat CV ATS
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/tips-interview" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Tips Lainnya
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t">
          <Button asChild variant="outline">
            <Link to="/tips-interview" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Semua Tips
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
