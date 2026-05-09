# PRD — CVKarir.id: Pembuat CV ATS-Friendly untuk Indonesia

> **Version**: 1.0.0  
> **Status**: Draft  
> **Last Updated**: 2026  
> **Owner**: Product Team  

---

## 1. Executive Summary

CVKarir.id adalah platform SaaS berbasis web yang membantu pencari kerja Indonesia membuat Curriculum Vitae (CV) yang ramah sistem ATS (Applicant Tracking System), dilengkapi panduan berbasis AI, scoring otomatis, dan tips karier. Target utama adalah fresh graduate, profesional muda, hingga pekerja berpengalaman yang ingin meningkatkan peluang lolos seleksi awal rekrutmen di perusahaan Indonesia maupun multinasional.

---

## 2. Problem Statement

### 2.1 Masalah Utama
- **85%+ perusahaan besar di Indonesia** menggunakan ATS untuk menyaring CV sebelum sampai ke rekruter manusia.
- Mayoritas pencari kerja Indonesia **tidak tahu cara menulis CV yang ATS-friendly** (format, keyword, struktur).
- **Tidak ada platform lokal** yang menggabungkan: pembuatan CV, AI guidance, ATS scoring, dan edukasi karier dalam satu produk terjangkau.
- Platform internasional (Zety, Resume.io) tidak memahami **konteks pasar kerja Indonesia** (format tanggal, nama perusahaan lokal, skill yang relevan secara lokal).

### 2.2 Peluang Pasar
- Indonesia memiliki **~3,5 juta wisudawan baru** per tahun.
- Tingkat pengangguran terdidik masih tinggi — bukan karena kurang skill, tapi **kurang tahu cara mempresentasikan diri**.
- Pasar SaaS Indonesia tumbuh 25%+ YoY.

---

## 3. Goals & Success Metrics

### 3.1 Business Goals
| Goal | Metric | Target (6 bulan) |
|------|--------|-----------------|
| Akuisisi pengguna | MAU | 10.000 |
| Monetisasi | MRR | Rp 50.000.000 |
| Retensi | Monthly Retention Rate | >40% |
| Konversi free → paid | Conversion Rate | >8% |

### 3.2 Product Goals
| Goal | Metric | Target |
|------|--------|--------|
| CV dibuat per hari | Count | >500 |
| Waktu buat CV | Median time | <20 menit |
| ATS Score rata-rata | Score | >75/100 |
| NPS | Score | >50 |

---

## 4. User Personas

### Persona 1 — Reza (Fresh Graduate)
- **Usia**: 22 tahun, baru lulus S1 Teknik Informatika
- **Pain point**: Tidak tahu format CV yang benar, belum pernah kerja, bingung menulis "pengalaman"
- **Goals**: Lolos ATS, dapat panggilan interview di perusahaan tech
- **Willingness to pay**: Rp 10.000 – Rp 19.000/bulan

### Persona 2 — Siti (Profesional 5 tahun)
- **Usia**: 28 tahun, Marketing Manager, ingin pindah kerja
- **Pain point**: CV lama tidak ter-update, tidak tahu keyword industri terbaru
- **Goals**: CV yang menceritakan pencapaian, bukan hanya job description
- **Willingness to pay**: Rp 19.000 – Rp 49.000/bulan

---

## 5. Features & Requirements

### 5.1 Authentication & User Management

#### F-01: Register dengan Email
**Priority**: P0 (Must Have)

**User Story**: Sebagai pengguna baru, saya ingin mendaftar menggunakan email agar dapat menggunakan platform.

**Acceptance Criteria**:
- Form registrasi: nama lengkap, email, password (min 8 karakter, 1 huruf besar, 1 angka, 1 simbol)
- Password strength indicator real-time
- Terms of Service & Privacy Policy checkbox (wajib dicentang)
- Submit → kirim email verifikasi ke inbox
- Rate limit: max 5 registrasi per IP per jam
- Validasi email format (RFC 5322)
- Deteksi disposable email (blokir domain seperti mailinator.com)
- Response time < 2 detik

**Security Requirements**:
- Password di-hash dengan bcrypt (cost factor ≥ 12) — ditangani Supabase Auth
- Email unik per akun (constraint di database)
- CSRF protection via Supabase session tokens
- Input sanitization untuk semua field

---

#### F-02: Verifikasi Email
**Priority**: P0 (Must Have)

**User Story**: Sebagai pengguna baru, saya menerima email verifikasi dan harus mengkonfirmasi sebelum bisa login.

**Acceptance Criteria**:
- Email verifikasi dikirim dalam < 30 detik
- Link verifikasi valid selama 24 jam
- Halaman konfirmasi sukses/gagal yang informatif
- Tombol "Kirim Ulang Email Verifikasi" dengan cooldown 60 detik
- Pengguna yang belum verifikasi: bisa lihat preview tapi tidak bisa simpan CV
- Email template branded (logo, warna brand, Bahasa Indonesia)

---

#### F-03: Login
**Priority**: P0 (Must Have)

**User Story**: Sebagai pengguna terdaftar, saya ingin login dengan aman.

**Acceptance Criteria**:
- Login via email + password
- "Ingat Saya" (remember me) 30 hari
- Lupa Password: kirim reset link via email (valid 1 jam)
- Login dengan Google OAuth (opsional, Phase 2)
- Blokir akun setelah 5 kali gagal login dalam 15 menit (lockout 30 menit)
- Notifikasi login dari perangkat baru (email)
- Session timeout: 7 hari inaktif

**Security Requirements**:
- Tidak boleh ada informasi spesifik di pesan error ("Email tidak ditemukan" → ganti dengan "Email atau password salah")
- Secure, HttpOnly, SameSite=Strict cookies
- JWT dengan expiry pendek + refresh token rotation

---

### 5.2 CV Builder

#### F-04: Template CV ATS-Friendly
**Priority**: P0 (Must Have)

**Template yang tersedia**:

| ID | Nama | Style | Terbaik Untuk | Tier |
|----|------|-------|--------------|------|
| T01 | Profesional Bersih | Single column, clean | Corporate, Finance, Legal | Free |
| T02 | Modern Dua Kolom | Two column, sidebar kiri | Tech, Marketing | Free |
| T03 | Minimalis Elegan | Single column, elegant typography | Konsultan, Akademik | Free (1 download) |
| T04 | Kreatif Terstruktur | Subtle accent colors | Design, Creative Agency | Pro |
| T05 | Eksekutif Premium | Executive format | Senior Manager, C-Level | Pro |
| T06 | Tech Specialist | Skills-first layout | Software Engineer, Data Scientist | Pro |
| T07 | Fresh Graduate | Education-first | Lulusan baru | Free |
| T08 | Bilingual ID/EN | Dual language | Perusahaan multinasional | Pro |

**ATS Compliance Rules untuk semua template**:
- Font: hanya Georgia, Times New Roman, Arial, Calibri, atau Garamond
- Ukuran font: minimal 10pt, maksimal 12pt untuk body
- Tidak ada tabel tersembunyi, text box, atau header/footer kompleks
- Urutan section standar: Contact → Summary → Experience → Education → Skills → Certifications
- File output: PDF (PDF/A-1b compliant) + DOCX
- Tidak ada gambar/foto di area parsing (foto opsional di header tapi di luar area ATS)
- Margin: minimal 0.5 inch di semua sisi
- Hyperlink diformat sebagai teks biasa (contoh: linkedin.com/in/nama)

**Section CV yang dapat dikonfigurasi**:
```
Wajib:
- Informasi Kontak (nama, email, telepon, kota, LinkedIn)
- Ringkasan Profesional / Objective

Opsional (drag & drop urutan):
- Pengalaman Kerja
- Pendidikan
- Keterampilan (Hard Skills & Soft Skills)
- Sertifikasi & Lisensi
- Proyek
- Organisasi / Kepanitiaan
- Penghargaan
- Publikasi
- Bahasa
- Referensi (opsional, "tersedia atas permintaan")
- Volunteering
- Portofolio (link)
```

---

#### F-05: AI Saran Pengisian
**Priority**: P1 (Should Have)**

**User Story**: Sebagai pengguna, saya ingin mendapat saran AI saat mengisi setiap section agar CV saya lebih kuat.

**Acceptance Criteria**:
- Tombol "💡 Saran AI" di setiap field
- AI menyarankan:
  - Kalimat pembuka yang kuat untuk ringkasan profesional
  - Bullet points pencapaian dengan format STAR/CAR (Context-Action-Result)
  - Quantifikasi pencapaian ("meningkatkan" → "meningkatkan 35%")
  - Kata kerja aksi yang powerful (led, developed, implemented, dll)
  - Keyword industri relevan berdasarkan posisi yang diinput
- Bahasa: output default Bahasa Indonesia, toggle ke English
- Saran muncul dalam < 3 detik
- Pengguna bisa "Accept", "Regenerate", atau "Skip"
- Free tier: 10 saran AI/bulan | Pro: unlimited

**AI Prompt Engineering (internal)**:
```
System: Kamu adalah career coach profesional Indonesia dengan 10 tahun pengalaman.
Bantu pengguna menulis CV yang kuat, jujur, dan ATS-friendly.
Gunakan format STAR untuk pengalaman kerja.
Selalu quantify pencapaian jika memungkinkan.
Bahasa: [LANGUAGE]
Context: Posisi: [POSITION], Industri: [INDUSTRY], Level: [LEVEL]
```

---

#### F-06: ATS CV Scoring
**Priority**: P1 (Should Have)

**User Story**: Sebagai pengguna, saya ingin tahu seberapa baik CV saya untuk lolos ATS.

**Acceptance Criteria**:
- Scoring otomatis real-time saat CV diisi
- Overall Score (0-100) dengan grade: A (85+), B (70-84), C (55-69), D (<55)
- Sub-scores dengan breakdown:

| Kategori | Bobot | Yang Dinilai |
|----------|-------|--------------|
| Keyword Match | 30% | Relevansi dengan posisi target |
| Format & Structure | 25% | ATS parseability, section lengkap |
| Content Quality | 25% | Quantified achievements, action verbs |
| Contact Info | 10% | Kelengkapan info kontak |
| Length Optimization | 10% | Panjang CV ideal (1-2 halaman) |

- Rekomendasi spesifik per sub-score ("Tambahkan angka pada pencapaian di bagian Pengalaman")
- Comparison: "CV Anda lebih baik dari X% pengguna dengan posisi serupa"
- Free tier: 3 scoring/bulan | Pro: unlimited + job description matching

**Job Description Matching (Pro)**:
- Upload/paste job description
- AI extract keyword dari JD
- Match dengan CV pengguna
- Gap analysis: keyword yang hilang
- Saran penambahan keyword

---

#### F-07: AI Panduan Pengisian
**Priority**: P1 (Should Have)

**User Story**: Sebagai pengguna yang bingung memulai, saya ingin dipandu AI step-by-step.

**Acceptance Criteria**:
- Mode "Guided" vs "Self-fill"
- Guided mode: AI bertanya pertanyaan satu per satu (conversational form)
- Contoh pertanyaan:
  - "Posisi apa yang sedang kamu lamar?"
  - "Ceritakan pencapaian terbesar di pekerjaan terakhirmu"
  - "Skill teknis apa yang paling ingin kamu tonjolkan?"
- AI mengisi draft CV dari jawaban pengguna
- Pengguna bisa edit hasil draft
- Progress bar: "Selesai X dari 8 langkah"
- Bisa pause dan lanjut kapan saja (auto-save)
- Free tier: 1 guided session/bulan | Pro: unlimited

---

### 5.3 Subscription & Monetisasi

#### F-08: Subscription Tiers
**Priority**: P0 (Must Have)

**Pricing Model** (disesuaikan pasar Indonesia):

| Fitur | Free | Starter (Rp 19.000/bln) | Pro (Rp 49.000/bln) | Pro+ (Rp 99.000/bln) |
|-------|------|------------------------|--------------------|--------------------|
| Template | 3 template | Semua template | Semua template | Semua template |
| CV yang bisa dibuat | 1 | 3 | Unlimited | Unlimited |
| Download PDF | 1x/bulan | 5x/bulan | Unlimited | Unlimited |
| Download DOCX | ❌ | ✅ | ✅ | ✅ |
| AI Saran | 10/bulan | 50/bulan | Unlimited | Unlimited |
| ATS Scoring | 3/bulan | 10/bulan | Unlimited | Unlimited |
| JD Matching | ❌ | ❌ | ✅ | ✅ |
| AI Guided Mode | 1/bulan | 3/bulan | Unlimited | Unlimited |
| Tips Interview AI | ❌ | Dasar | Lengkap | Lengkap |
| Cover Letter AI | ❌ | ❌ | ✅ | ✅ |
| LinkedIn Optimizer | ❌ | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ |
| Watermark | ✅ | ❌ | ❌ | ❌ |

**Payment Methods** (Indonesia-first):
- GoPay, OVO, DANA, ShopeePay
- Transfer Bank (BCA, Mandiri, BNI, BRI) via Virtual Account
- Kartu Kredit/Debit (Visa, Mastercard)
- Minimarket (Indomaret, Alfamart) — via payment gateway
- Payment Gateway: Midtrans atau Xendit

**Billing**:
- Pembayaran bulanan (tidak ada kontrak tahunan di awal — KISS principle)
- Reminder 3 hari sebelum renewal via email + in-app
- Downgrade: berlaku di akhir periode billing
- Refund policy: tidak ada refund untuk langganan yang sudah aktif (dicantumkan jelas)
- Invoice otomatis via email (PDF)

---

### 5.4 Konten & Edukasi

#### F-09: Tips & Trik Interview
**Priority**: P2 (Nice to Have — Phase 1.5)**

**Konten yang tersedia**:
- **Library Pertanyaan Interview**: 200+ pertanyaan umum (BEI, situational, technical)
- **Simulator Interview AI**: Latihan jawab pertanyaan, AI beri feedback
- **Tips per Industri**: Tech, Finance, FMCG, Startup, BUMN, dll
- **Panduan Salary Negotiation**: Script negosiasi gaji dalam konteks Indonesia
- **Dress Code Guide**: Per industri dan culture perusahaan
- **Bahasa Tubuh**: Tips non-verbal yang penting

**Format konten**: Artikel pendek (< 5 menit baca), video embed (YouTube), infografis

**AI Interview Simulator** (Pro):
- Pilih posisi & level
- AI bertanya pertanyaan interview
- Pengguna jawab via text
- AI evaluasi: struktur jawaban, relevansi, kekuatan, saran perbaikan
- Rekam jawaban ideal (STAR format)

---

#### F-10: Fitur Unggulan Tambahan

**F-10a: Cover Letter Generator (Pro)**
- Input: CV + Job Description
- AI generate cover letter yang personal dan relevan
- Template cover letter formal Indonesia
- Output: PDF + DOCX

**F-10b: LinkedIn Profile Optimizer (Pro+)**
- Analisis profil LinkedIn pengguna (via URL)
- Saran perbaikan: headline, summary, experience
- Keyword optimization untuk LinkedIn search
- ATS score untuk profil LinkedIn

**F-10c: CV Comparison Tool (Pro)**
- Bandingkan 2 versi CV
- Highlight perbedaan dan mana yang lebih kuat
- Useful untuk A/B testing CV sebelum apply

**F-10d: Job Board Integration (Phase 2)**
- One-click apply dengan CV yang sudah dibuat
- Integrasi dengan: Glints, Kalibrr, JobStreet, LinkedIn
- Tracking aplikasi (applied, viewed, interview, rejected)

**F-10e: CV Analytics (Pro)**
- Lihat berapa kali CV didownload (jika shared via link)
- Heatmap section mana yang paling sering dilihat
- Useful untuk recruiter-shared CV

**F-10f: Referral Program**
- Share link referral unik
- Reward: 1 bulan Starter gratis per referral berhasil
- Tracking di dashboard pengguna

---

## 6. Non-Functional Requirements

### 6.1 Performance
- First Contentful Paint (FCP): < 1.5 detik
- Largest Contentful Paint (LCP): < 2.5 detik (Core Web Vitals target)
- Time to Interactive (TTI): < 3 detik
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms
- API response time (P95): < 500ms
- PDF generation: < 5 detik
- Uptime SLA: 99.5%

### 6.2 Scalability
- Dirancang untuk 10.000 concurrent users
- Database connection pooling via Supabase PgBouncer
- Static assets di CDN (Vercel Edge Network)
- AI API calls: async queue untuk peak load

### 6.3 Accessibility (WCAG 2.1 AA)
- Semua interactive elements: keyboard navigable
- Color contrast ratio: minimal 4.5:1 (text), 3:1 (large text)
- Screen reader compatible (ARIA labels lengkap)
- Focus indicators visible
- Error messages descriptive dan tidak hanya bergantung pada warna
- Alt text untuk semua gambar informasional
- Form labels terhubung ke input

### 6.4 Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile: iOS Safari 14+, Android Chrome 90+
- Responsive: 320px – 2560px

### 6.5 Internationalization
- Bahasa default: Indonesia
- Toggle ke English
- Format tanggal: DD MMMM YYYY (Indonesia), MM/DD/YYYY (US)
- Currency: IDR (Rp) dengan format lokal

---

## 7. Security Requirements

> Detail lengkap ada di security section dalam `skill.md`. Ringkasan:

### 7.1 Authentication Security
- Supabase Auth (battle-tested)
- MFA: TOTP via authenticator app (Pro+)
- Session management: JWT + refresh token rotation
- Account lockout setelah failed attempts

### 7.2 OWASP Top 10 Compliance
| # | Kerentanan | Mitigasi |
|---|-----------|---------|
| A01 | Broken Access Control | RLS di Supabase, middleware auth check |
| A02 | Cryptographic Failures | HTTPS everywhere, bcrypt passwords |
| A03 | Injection | Parameterized queries, Supabase SDK |
| A04 | Insecure Design | Threat modeling, security by design |
| A05 | Security Misconfiguration | Env vars, CSP headers, security audit |
| A06 | Vulnerable Components | Dependabot, regular updates |
| A07 | Auth Failures | Rate limiting, lockout, MFA |
| A08 | Software Integrity Failures | Vercel deployment verification |
| A09 | Logging Failures | Structured logging, audit trail |
| A10 | SSRF | Allowlist untuk external requests |

### 7.3 Frontend Security
- Content Security Policy (CSP) strict
- X-Frame-Options: DENY
- HSTS (Strict-Transport-Security)
- XSS prevention: React escaping + DOMPurify untuk HTML asing

### 7.4 Data Privacy
- GDPR-inspired (meski belum wajib di Indonesia, best practice)
- Data Retention: inaktif 2 tahun → notifikasi → hapus
- Right to deletion: pengguna bisa hapus akun + semua data
- Export data: pengguna bisa download semua data mereka (JSON)

---

## 8. SEO & Discoverability

> Detail lengkap ada di `design.md` bagian SEO.

### 8.1 Target Keywords
**Primary**:
- "buat CV ATS" (Vol: 8.100/bln)
- "template CV ATS friendly Indonesia" (Vol: 5.400/bln)
- "CV builder Indonesia" (Vol: 3.600/bln)

**Secondary**:
- "cara membuat CV yang lolos ATS"
- "contoh CV ATS friendly bahasa Indonesia"
- "template CV gratis Indonesia 2025"
- "CV scoring ATS online"

**Long-tail**:
- "cara buat CV untuk fresh graduate di perusahaan multinasional"
- "template CV engineer Indonesia ATS friendly"
- "tips CV lolos HRD perusahaan besar Indonesia"

### 8.2 Technical SEO
- Server-Side Rendering via Next.js App Router
- Sitemap XML otomatis (`/sitemap.xml`)
- robots.txt konfigurasi benar
- Canonical tags pada semua halaman
- Structured Data (JSON-LD): WebApplication, FAQPage, HowTo
- Core Web Vitals green di semua halaman public

---

## 9. User Flows

### 9.1 Onboarding Flow
```
Landing Page
    ↓ CTA "Buat CV Gratis"
Register Form
    ↓
Email Verifikasi
    ↓
Welcome Page → Pilih Template
    ↓
Guided Mode (AI) ATAU Self-fill
    ↓
CV Editor (live preview)
    ↓
ATS Score Panel
    ↓
Download (watermark Free) / Upgrade CTA
```

### 9.2 Upgrade Flow
```
Trigger: Hit feature limit ATAU CTA banner
    ↓
Pricing Page (highlight Pro)
    ↓
Pilih Metode Pembayaran
    ↓
Payment Gateway (Midtrans/Xendit)
    ↓
Konfirmasi Pembayaran
    ↓
Feature unlock + Welcome email Pro
```

---

## 10. Milestones & Phasing

### Phase 1 (MVP — 8 minggu)
- [ ] Auth (Register, Verifikasi, Login)
- [ ] 3 Template CV ATS-Friendly (Free)
- [ ] CV Editor dasar (semua section standard)
- [ ] Download PDF
- [ ] ATS Scoring dasar
- [ ] Subscription (Free + Starter + Pro)
- [ ] Payment integration (Midtrans)
- [ ] Landing page SEO-optimized

### Phase 1.5 (10 minggu setelah MVP)
- [ ] AI Saran pengisian (Anthropic Claude API)
- [ ] AI Guided Mode
- [ ] 5 Template tambahan
- [ ] Tips & Trik Interview (artikel)
- [ ] Job Description Matching
- [ ] Cover Letter Generator

### Phase 2 (3 bulan setelah 1.5)
- [ ] AI Interview Simulator
- [ ] LinkedIn Optimizer
- [ ] Job Board Integration (Glints, Kalibrr)
- [ ] Mobile App (React Native / PWA)
- [ ] Referral Program
- [ ] Team/Enterprise tier

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigasi |
|------|------------|--------|---------|
| AI API cost tinggi | Medium | High | Rate limiting, caching, tiered usage |
| Persaingan dari platform internasional | High | Medium | Lokalisasi kuat, harga terjangkau |
| Payment failure rate tinggi | Medium | High | Multi payment gateway fallback |
| Data breach | Low | Critical | Encryption, RLS, audit regular |
| Low conversion free → paid | Medium | High | Freemium value proposition yang kuat |
| ATS format berubah | Low | Medium | Template update berkala, monitoring |

---

## 12. Appendix

### A. Glossary
- **ATS**: Applicant Tracking System — software HR untuk menyaring CV otomatis
- **RLS**: Row Level Security — fitur Supabase/PostgreSQL untuk isolasi data per user
- **CSP**: Content Security Policy — header keamanan HTTP
- **STAR**: Situation-Task-Action-Result — framework penulisan pencapaian
- **MRR**: Monthly Recurring Revenue
- **Core Web Vitals**: Metrik performa Google (LCP, FID/INP, CLS)

### B. References
- OWASP Top 10 2021: https://owasp.org/Top10/
- WCAG 2.1 Guidelines: https://www.w3.org/TR/WCAG21/
- Next.js App Router: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Google Search Central: https://developers.google.com/search
