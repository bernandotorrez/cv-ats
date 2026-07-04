import type { CvData } from "@/lib/cv-types";

// Preview data dengan nama orang Indonesia untuk semua template

export const previewData = {
  bali: {
    personal: {
      fullName: "Dewi Kartika Sari",
      headline: "Digital Marketing Specialist",
      email: "dewi.sari@email.com",
      phone: "0812-3456-7890",
      location: "Denpasar, Bali",
      linkedin: "linkedin.com/in/dewikartika",
      summary:
        "Profesional digital marketing dengan pengalaman 4+ tahun dalam pengelolaan kampanye media sosial, SEO, dan content marketing. Telah berhasil meningkatkan brand awareness berbagai perusahaan di Bali dan nasional.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Digital Marketing Specialist",
        company: "PT Bali Tourism Board",
        location: "Denpasar",
        startDate: "Mar 2022",
        current: true,
        endDate: "",
        description:
          "Mengelola kampanye digital untuk destinasi wisata Bali dengan budget Rp 500 juta/bulan. Meningkatkan engagement 45% dan konversi pemesanan tour 30%.",
      },
      {
        id: "2",
        position: "Social Media Specialist",
        company: "Bali Coffee Co.",
        location: "Kuta",
        startDate: "Jun 2020",
        current: false,
        endDate: "Feb 2022",
        description:
          "Membangun presence brand di Instagram, TikTok, dan Facebook dengan follower grow 200%. Membuat 100+ konten video per bulan.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Universitas Udayana",
        degree: "S1",
        field: "Ilmu Komunikasi",
        startDate: "2015",
        endDate: "2019",
        description: "Lulus dengan predikat Cum Laude, IPK 3.8",
      },
    ],
    skills: [
      { id: "1", name: "Social Media Marketing" },
      { id: "2", name: "Google Ads & Meta Ads" },
      { id: "3", name: "SEO & Content Marketing" },
      { id: "4", name: "Google Analytics" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Advanced" },
    ],
    certificates: [{ id: "1", name: "Google Digital Garage", issuer: "Google", date: "2023" }],
  } as CvData,
  jakarta: {
    personal: {
      fullName: "Ahmad Rizki Pratama",
      headline: "Full Stack Software Engineer",
      email: "ahmad.rizki@techmail.id",
      phone: "0878-1234-5678",
      location: "Jakarta Selatan",
      linkedin: "linkedin.com/in/ahmadrizki",
      website: "ahmadrizki.dev",
      summary:
        "Software engineer dengan 5+ tahun pengalaman dalam pengembangan aplikasi web dan mobile. Spesialisasi dalam ekosistem JavaScript/TypeScript dan cloud infrastructure.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Senior Software Engineer",
        company: "TokoTalk Indonesia",
        location: "Jakarta",
        startDate: "Jan 2023",
        current: true,
        endDate: "",
        description:
          "Tech lead untuk tim e-commerce dengan 5 engineer. Migrasi monolithic ke microservices menggunakan Kubernetes dan AWS.",
      },
      {
        id: "2",
        position: "Software Engineer",
        company: "Gojek Indonesia",
        location: "Jakarta",
        startDate: "Mar 2020",
        current: false,
        endDate: "Des 2022",
        description:
          "Mengembangkan fitur driver app dan customer app dengan React Native. Implementasi real-time notification system.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Institut Teknologi Bandung",
        degree: "S1",
        field: "Teknik Informatika",
        startDate: "2014",
        endDate: "2018",
        description: "Fokus pada sistem terdistribusi dan cloud computing",
      },
    ],
    skills: [
      { id: "1", name: "React & Next.js" },
      { id: "2", name: "Node.js & Express" },
      { id: "3", name: "TypeScript" },
      { id: "4", name: "AWS & Docker" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Professional" },
    ],
    certificates: [
      { id: "1", name: "AWS Certified Solutions Architect", issuer: "Amazon", date: "2023" },
    ],
  } as CvData,
  makassar: {
    personal: {
      fullName: "Nurul Hidayati",
      headline: "HR Manager & Talent Acquisition",
      email: "nurul.hidayati@corp-mail.com",
      phone: "0813-9876-5432",
      location: "Makassar, Sulawesi Selatan",
      linkedin: "linkedin.com/in/nurulhidayati",
      summary:
        "HR professional dengan pengalaman 7+ tahun di perusahaan multinasional dan startup. Spesialisasi dalam talent acquisition dan organizational development.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "HR Manager",
        company: "Bank Sulawesi Selatan",
        location: "Makassar",
        startDate: "Jan 2022",
        current: true,
        endDate: "",
        description:
          "Memimpin tim HR dengan 8 staff. Menyusun talent succession plan dan leadership development program.",
      },
      {
        id: "2",
        position: "Talent Acquisition Lead",
        company: "Grab Indonesia",
        location: "Makassar",
        startDate: "Mar 2019",
        current: false,
        endDate: "Des 2021",
        description:
          "Memimpin recruitment untuk area Sulawesi & Kalimantan dengan target 150 posisi/tahun.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Universitas Hasanuddin",
        degree: "S1",
        field: "Psikologi Industri & Organisasi",
        startDate: "2012",
        endDate: "2016",
        description: "Aktif di organisasi kemahasiswaan",
      },
    ],
    skills: [
      { id: "1", name: "Talent Acquisition" },
      { id: "2", name: "HRIS & ATS Platforms" },
      { id: "3", name: "Performance Management" },
      { id: "4", name: "Employee Relations" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Business" },
    ],
    certificates: [{ id: "1", name: "SPMB (HR Strategist)", issuer: "PPRI", date: "2022" }],
  } as CvData,
  bandung: {
    personal: {
      fullName: "Rizky Ramadhan",
      headline: "UI/UX Designer",
      email: "rizky.ramadhan@designhub.co",
      phone: "0821-8765-4321",
      location: "Bandung, Jawa Barat",
      linkedin: "linkedin.com/in/rizkyramadhan",
      website: "rizkyramadhan.design",
      summary:
        "Desainer UI/UX dengan passion dalam menciptakan pengalaman digital yang intuitif. 4+ tahun pengalaman dalam desain aplikasi mobile dan design system.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Senior UI/UX Designer",
        company: "DANA Indonesia",
        location: "Bandung",
        startDate: "Jul 2022",
        current: true,
        endDate: "",
        description:
          "Lead designer untuk fitur e-wallet utama dengan 15 juta+ users. Membuat design system yang digunakan 8 tim product.",
      },
      {
        id: "2",
        position: "UI/UX Designer",
        company: "Traveloka",
        location: "Jakarta",
        startDate: "Jan 2020",
        current: false,
        endDate: "Jun 2022",
        description:
          "Designer untuk tim flights & hotels booking flow. Mengurangi checkout abandonment 35%.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Politeknik Negeri Bandung",
        degree: "D4",
        field: "Teknik Informatika - Desain Grafis",
        startDate: "2014",
        endDate: "2018",
        description: "Fokus pada interactive media dan user experience design",
      },
    ],
    skills: [
      { id: "1", name: "Figma & Sketch" },
      { id: "2", name: "Prototyping" },
      { id: "3", name: "User Research" },
      { id: "4", name: "Design System" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Advanced" },
    ],
    certificates: [
      { id: "1", name: "Google UX Design Certificate", issuer: "Google/Coursera", date: "2023" },
    ],
  } as CvData,
  medan: {
    personal: {
      fullName: "Putri Ayu Wulandari",
      headline: "Finance Manager",
      email: "putri.wulandari@finance.co.id",
      phone: "0812-5678-9012",
      location: "Medan, Sumatera Utara",
      linkedin: "linkedin.com/in/putriayuwulandari",
      summary:
        "Professional finance dengan pengalaman 8+ tahun di industri manufaktur dan perbankan. Spesialisasi dalam financial analysis, budgeting, dan tax planning.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Finance Manager",
        company: "PTPN IV Palm Oil",
        location: "Medan",
        startDate: "Jan 2021",
        current: true,
        endDate: "",
        description:
          "Memimpin tim finance dengan 12 staff. Menyusun annual budget dan financial forecast. Tax planning yang menghemat Rp 2M/tahun.",
      },
      {
        id: "2",
        position: "Senior Accountant",
        company: "Bank Mandiri",
        location: "Medan",
        startDate: "Mar 2017",
        current: false,
        endDate: "Des 2020",
        description:
          "Financial reporting dan analysis untuk branch dengan asset Rp 500M. Audit coordination dengan KAP Big Four.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Universitas Indonesia",
        degree: "S1",
        field: "Akuntansi",
        startDate: "2010",
        endDate: "2014",
        description: "Lulus dengan predikat Cum Laude",
      },
      {
        id: "2",
        school: "CPA Indonesia",
        degree: "CPA",
        field: "Professional Certification",
        startDate: "2018",
        endDate: "2018",
        description: "Certified Public Accountant",
      },
    ],
    skills: [
      { id: "1", name: "Financial Analysis" },
      { id: "2", name: "SAP & Oracle" },
      { id: "3", name: "Tax Planning" },
      { id: "4", name: "Budgeting" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Advanced" },
    ],
    certificates: [{ id: "1", name: "CPA Indonesia", issuer: "IAPI", date: "2018" }],
  } as CvData,
  semarang: {
    personal: {
      fullName: "Bayu Setiawan",
      headline: "Project Manager",
      email: "bayu.setiawan@pm.co.id",
      phone: "0813-2468-1357",
      location: "Semarang, Jawa Tengah",
      linkedin: "linkedin.com/in/bayusetiawan",
      summary:
        "Project manager bersertifikasi PMP dengan pengalaman 6+ tahun mengelola proyek IT dan konstruksi. Track record menyelesaikan proyek tepat waktu dan within budget.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Project Manager",
        company: "PT Pertamina Patra Niaga",
        location: "Semarang",
        startDate: "Jun 2022",
        current: true,
        endDate: "",
        description:
          "Mengelola 5 proyek IT concurrently dengan total nilai Rp 15M. Implementasi Agile methodology yang meningkatkan delivery speed 40%.",
      },
      {
        id: "2",
        position: "Assistant PM",
        company: "PT Wijaya Karya",
        location: "Jakarta",
        startDate: "Jan 2019",
        current: false,
        endDate: "Mei 2022",
        description:
          "Assisted dalam pengelolaan proyek infrastruktur Rp 50M+. Koordinasi dengan 20+ vendor dan subcontractor.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Universitas Diponegoro",
        degree: "S1",
        field: "Teknik Sipil",
        startDate: "2013",
        endDate: "2017",
        description: "Fokus pada construction management",
      },
    ],
    skills: [
      { id: "1", name: "Project Management" },
      { id: "2", name: "Agile & Scrum" },
      { id: "3", name: "MS Project" },
      { id: "4", name: "Risk Management" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Business" },
    ],
    certificates: [
      { id: "1", name: "PMP Certification", issuer: "PMI", date: "2023" },
      { id: "2", name: "Scrum Master", issuer: "Scrum.org", date: "2022" },
    ],
  } as CvData,
  surabaya: {
    personal: {
      fullName: "Maya Putri Anggraini",
      headline: "Supply Chain Manager",
      email: "maya.anggraini@supply.id",
      phone: "0821-3456-7890",
      location: "Surabaya, Jawa Timur",
      linkedin: "linkedin.com/in/mayaanggraini",
      summary:
        "Supply chain profesional dengan pengalaman 7+ tahun di industri FMCG dan manufaktur. Spesialisasi dalam procurement optimization dan logistics management.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Supply Chain Manager",
        company: "PT Gudang Garam",
        location: "Surabaya",
        startDate: "Mar 2021",
        current: true,
        endDate: "",
        description:
          "Memimpin tim SCM dengan 25 staff. Implementasi Vendor Management System yang menghemat biaya procurement 15%. Optimasi rute distribusi.",
      },
      {
        id: "2",
        position: "Procurement Supervisor",
        company: "PT Semen Indonesia",
        location: "Gresik",
        startDate: "Agt 2017",
        current: false,
        endDate: "Feb 2021",
        description:
          "Mengelola pengadaan material konstruksi Rp 20M/tahun. Negosiasi kontrak dengan 50+ supplier. Vendor performance evaluation system.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "ITS Surabaya",
        degree: "S1",
        field: "Teknik Industri",
        startDate: "2012",
        endDate: "2016",
        description: "Fokus pada operations research dan logistics",
      },
      {
        id: "2",
        school: "CIPS",
        degree: "CIPS Certification",
        field: "Purchasing",
        startDate: "2019",
        endDate: "2019",
      },
    ],
    skills: [
      { id: "1", name: "Procurement" },
      { id: "2", name: "SAP MM" },
      { id: "3", name: "Logistics Management" },
      { id: "4", name: "Supplier Negotiation" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Advanced" },
      { id: "3", name: "Jawa", level: "Native" },
    ],
    certificates: [{ id: "1", name: "CIPS Level 5", issuer: "CIPS", date: "2019" }],
  } as CvData,
  yogya: {
    personal: {
      fullName: "Dimas Prasetyo",
      headline: "Content Creator & Strategist",
      email: "dimas.prasetyo@creative.id",
      phone: "0878-9012-3456",
      location: "Yogyakarta",
      linkedin: "linkedin.com/in/dimasprasetyo",
      website: "dimasprasetyo.my.id",
      summary:
        "Content creator dengan 4+ tahun pengalaman menciptakan konten digital yang engaging. Spesialisasi dalam storytelling dan brand content strategy untuk millennial dan Gen Z.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Content Strategist",
        company: "IDN Media",
        location: "Jakarta",
        startDate: "Jan 2023",
        current: true,
        endDate: "",
        description:
          "Merancang content strategy untuk 3 brand. Viral campaign dengan 5M+ reach organik. Partnership dengan 20+ KOL.",
      },
      {
        id: "2",
        position: "Senior Content Creator",
        company: "Brilliant Publishing",
        location: "Yogyakarta",
        startDate: "Mar 2020",
        current: false,
        endDate: "Des 2022",
        description:
          "Memproduksi konten video dan written content untuk social media. YouTube channel growth dari 10K ke 500K subscribers.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "UGM Yogyakarta",
        degree: "S1",
        field: "Komunikasi",
        startDate: "2015",
        endDate: "2019",
        description: "Fokus pada digital communication dan media studies",
      },
    ],
    skills: [
      { id: "1", name: "Content Strategy" },
      { id: "2", name: "Video Production" },
      { id: "3", name: "Social Media" },
      { id: "4", name: "Copywriting" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Advanced" },
      { id: "3", name: "Jawa", level: "Native" },
    ],
    certificates: [{ id: "1", name: "Google Digital Marketing", issuer: "Google", date: "2023" }],
  } as CvData,
  malang: {
    personal: {
      fullName: "Bagus Aditya",
      headline: "UI/UX & Creative Designer",
      email: "bagus.aditya@creative.id",
      phone: "0812-9876-5432",
      location: "Malang, Jawa Timur",
      linkedin: "linkedin.com/in/bagusaditya",
      website: "bagusaditya.design",
      summary:
        "UI/UX & Creative Designer dengan 5+ tahun pengalaman menciptakan produk digital dan branding yang intuitif serta estetis. Berpengalaman memimpin tim kreatif dalam merancang interface web/app yang user-centric dan meningkatkan konversi user sebesar 40%.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Senior UI/UX Designer",
        company: "PT Creative Studio Malang",
        location: "Malang",
        startDate: "Jan 2022",
        current: true,
        endDate: "",
        description:
          "Memimpin tim desainer dalam merancang ulang mobile app untuk 5 klien enterprise. Meningkatkan skor kepuasan pengguna sebesar 35% dan mempercepat proses design-to-development handoff.",
      },
      {
        id: "2",
        position: "Product Designer",
        company: "GoTo Financial",
        location: "Jakarta",
        startDate: "Jul 2019",
        current: false,
        endDate: "Des 2021",
        description:
          "Merancang wireframe, user flow, dan high-fidelity mockups untuk fitur pembayaran digital. Berkolaborasi dengan product manager dan engineer untuk merilis 3 fitur utama.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Universitas Brawijaya",
        degree: "S1",
        field: "Desain Komunikasi Visual",
        startDate: "2015",
        endDate: "2019",
        description: "Fokus pada interaksi digital dan visual branding. Lulus dengan IPK 3.75.",
      },
    ],
    skills: [
      { id: "1", name: "UI/UX Design" },
      { id: "2", name: "Wireframing & Prototyping" },
      { id: "3", name: "Figma & Adobe CC" },
      { id: "4", name: "Interaction Design" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Professional" },
    ],
    certificates: [
      {
        id: "1",
        name: "Certified Interaction Designer",
        issuer: "Interaction Design Foundation",
        date: "2022",
      },
    ],
  } as CvData,
  ubud: {
    personal: {
      fullName: "Rian Cahyadi",
      headline: "Senior Creative Director & Brand Strategist",
      email: "rian.cahyadi@studio.com",
      phone: "0813-8765-4321",
      location: "Ubud, Bali",
      linkedin: "linkedin.com/in/riancahyadi",
      website: "riancahyadi.co",
      summary:
        "Senior Creative Director dengan 7+ tahun pengalaman memimpin kampanye visual dan strategi brand untuk berbagai klien internasional. Spesialis dalam digital art direction, corporate branding, dan interaksi visual modern. Sukses meluncurkan 15+ kampanye kreatif berskala nasional.",
      summaryAlign: "left" as const,
    },
    experiences: [
      {
        id: "1",
        position: "Senior Creative Director",
        company: "PT Bali Creative Agency",
        location: "Ubud, Bali",
        startDate: "Jan 2021",
        current: true,
        endDate: "",
        description:
          "Memimpin divisi kreatif dan merancang strategi visual untuk kampanye brand global. Meningkatkan kepuasan klien sebesar 45% dan berhasil memenangkan 3 penghargaan desain bergengsi di tingkat regional.",
      },
      {
        id: "2",
        position: "Lead Visual Designer",
        company: "Arah Studio",
        location: "Jakarta",
        startDate: "Agt 2018",
        current: false,
        endDate: "Des 2020",
        description:
          "Bertanggung jawab atas arsitektur identitas visual brand dan aset digital klien. Berkolaborasi dengan product team untuk mendesain aset kampanye marketing terintegrasi.",
      },
    ],
    educations: [
      {
        id: "1",
        school: "Institut Teknologi Bandung",
        degree: "S1",
        field: "Desain Komunikasi Visual",
        startDate: "2014",
        endDate: "2018",
        description: "Lulus dengan predikat Cum Laude. Aktif dalam organisasi kemahasiswaan bidang seni rupa.",
      },
    ],
    skills: [
      { id: "1", name: "Creative Direction" },
      { id: "2", name: "Brand Strategy" },
      { id: "3", name: "Visual Art & Layout" },
      { id: "4", name: "Design Systems" },
    ],
    languages: [
      { id: "1", name: "Bahasa Indonesia", level: "Native" },
      { id: "2", name: "English", level: "Fluent" },
    ],
    certificates: [
      {
        id: "1",
        name: "Advanced Art Direction",
        issuer: "Creative Academy",
        date: "2021",
      },
    ],
  } as CvData,
};

// Template mapping untuk halaman /template
export const templateMap = {
  bali: { name: "Bali", premium: false },
  jakarta: { name: "Jakarta", premium: false },
  makassar: { name: "Makassar", premium: true },
  bandung: { name: "Bandung", premium: false },
  medan: { name: "Medan", premium: false },
  semarang: { name: "Semarang", premium: false },
  surabaya: { name: "Surabaya", premium: true },
  yogya: { name: "Yogyakarta", premium: false },
  malang: { name: "Malang", premium: true },
  ubud: { name: "Ubud", premium: true },
} as const;

export type TemplateSlug = keyof typeof previewData;
