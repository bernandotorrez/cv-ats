# FITUR BARU — CV ATS Indonesia (cvats.id)

> **Product Manager Perspective**  
> **Tanggal**: 8 Mei 2026  
> **Tujuan**: Identifikasi & implementasi fitur baru untuk meningkatkan akuisisi, retensi, dan monetisasi pengguna.

---

## 1. Analisis Pasar & Gap

### Kondisi Saat Ini
CV ATS Indonesia sudah memiliki fondasi kuat: CV builder, AI scoring, templates, subscription tiers. Namun ada beberapa gap besar yang membatasi pertumbuhan:

| Gap | Dampak | Opportunity |
|-----|--------|-------------|
| User bikin CV lalu... apa? | Drop-off setelah download | **Job Board + Matching** |
| Tidak ada alasan kembali | Retensi rendah | **Application Tracker** |
| Tidak tahu nilai CV mereka | Conversion rendah ke paid | **CV Analytics** |
| Growth hanya dari SEO/ads | CAC tinggi | **Referral Program** |
| Pro+ janji fitur yang belum ada | Churn Pro+ user | **Interview Simulator** |
| Share hanya via link | Kurang viral di Indonesia | **WhatsApp Share** |

### Persona & Pain Points
- **Fresh Graduate**: "Udah punya CV bagus, tapi lowongan di mana? Dan gimana cara tracking lamaran?"
- **Profesional**: "Gue apply 20+ perusahaan, susah tracking status lamaran satu-satu."
- **Power User**: "Gue bayar Pro+ tapi fitur Interview Simulator belum ada."

---

## 2. Fitur yang Diusulkan

### F-11: WhatsApp Share (Quick Win)
**Priority**: P0 | **Effort**: Low | **Target**: Viral growth

CV bisa langsung dibagikan via WhatsApp dengan teks terformat + pratinjau link.
Karena WhatsApp adalah platform komunikasi #1 di Indonesia, fitur ini akan mendorong pertumbuhan organik.

**Acceptance Criteria**:
- Tombol "Bagikan via WhatsApp" di halaman CV & share
- Teks template menarik: "✨ Lihat CV ATS-friendly aku! Dibuat dalam 10 menit pakai cvats.id"
- Link preview dengan OG image CV
- Tracking: jumlah share via WhatsApp

---

### F-12: CV Analytics (Pro+ Feature)
**Priority**: P0 | **Effort**: Medium | **Target**: Monetisasi

Dashboard analitik CV: berapa kali CV dilihat, didownload, dibagikan. Memberikan nilai tambah untuk user Pro+.

**Acceptance Criteria**:
- Halaman `/analitik` (authenticated, Pro+ only)
- Metrics: Total views, unique viewers, downloads, shares
- Timeline: views/downloads per hari (chart)
- Per-CV breakdown
- Share link analytics (geographic, device)

---

### F-13: Referral Program
**Priority**: P0 | **Effort**: Medium | **Target**: Viral growth + akuisisi murah

Program referral dengan kode unik. User dapat 1 bulan Starter gratis per referral yang berhasil upgrade.

**Acceptance Criteria**:
- Setiap user punya kode referral unik
- Halaman `/referral` menampilkan kode, statistik, dan reward
- Promo banner di dashboard: "Ajak teman, dapat gratis!"
- Tracking: referral signup → upgrade → reward
- Admin panel: lihat top referrers

---

### F-14: Application Tracker / Pelacak Lamaran
**Priority**: P0 | **Effort**: Medium-High | **Target**: Retensi

User bisa mencatat dan melacak status lamaran kerja mereka. Ini adalah retention loop — user kembali untuk update status.

**Acceptance Criteria**:
- Halaman `/lamaran` (authenticated)
- CRUD: Tambah lamaran (posisi, perusahaan, tanggal apply, status)
- Status: Applied, Viewed, Interview, Technical Test, Offering, Accepted, Rejected
- Kanban view + list view
- Link ke CV yang digunakan
- Statistik: total lamaran, response rate, interview rate
- Reminder follow-up (opsional)

---

### F-15: Job Board / Lowongan Pekerjaan
**Priority**: P1 | **Effort**: Medium | **Target**: Traffic + engagement

Halaman lowongan kerja yang relevan dengan user. Bisa berupa curated listings manual atau integrasi API.

**Acceptance Criteria**:
- Halaman `/lowongan` (public)
- List lowongan dengan filter: posisi, lokasi, industri, level
- Setiap lowongan: judul, perusahaan, lokasi, deskripsi singkat
- CTA: "Buat CV ATS untuk lamar lowongan ini" → direct ke CV builder
- Halaman detail lowongan: `/lowongan/$slug`
- SEO optimized (job posting schema)
- Admin: CMS untuk manage lowongan

---

### F-16: Interview Simulator / Simulasi Wawancara
**Priority**: P1 | **Effort**: High | **Target**: Monetisasi Pro+

Fitur yang sudah dijanjikan di tier Pro+. AI-powered mock interview dengan feedback real-time.

**Acceptance Criteria**:
- Halaman `/simulasi-wawancara` (authenticated, Pro+ only)
- Pilih: posisi, level, industri
- AI generate 5-10 pertanyaan interview
- User jawab via text input
- AI evaluasi tiap jawaban: kekuatan, kelemahan, saran perbaikan
- Skor akhir + rekomendasi
- Riwayat sesi simulasi

---

## 3. Impact vs Effort Matrix

```
                    HIGH IMPACT
                        |
    WhatsApp Share ●    |    ● Application Tracker
    Referral      ●     |    ● Job Board
                        |
    CV Analytics  ●     |    ● Interview Simulator
                        |
   LOW ─────────────────┼────────────────── HIGH
   EFFORT               |                   EFFORT
                        |
                    LOW IMPACT
```

**Prioritas Implementasi**:
1. WhatsApp Share (quick win, viral)
2. CV Analytics (monetisasi, sudah dijanjikan)
3. Referral Program (growth engine)
4. Application Tracker (retention loop)
5. Job Board (traffic + engagement)
6. Interview Simulator (Pro+ retention)

---

## 4. Database Schema Tambahan

```sql
-- Tabel: job_listings
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT NOT NULL,
  type TEXT NOT NULL, -- full-time, part-time, contract, internship
  level TEXT NOT NULL, -- entry, mid, senior, manager, director
  industry TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT NOT NULL,
  requirements TEXT,
  qualifications TEXT,
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel: job_applications
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  cv_id UUID REFERENCES public.cvs,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'applied', -- applied, viewed, interview, technical_test, offering, accepted, rejected, withdrawn
  notes TEXT,
  source TEXT, -- linkedin, jobstreet, glints, referral, company_website
  contact_name TEXT,
  contact_email TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel: cv_analytics
CREATE TABLE public.cv_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID REFERENCES public.cvs ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL, -- view, download, share_whatsapp, share_link
  viewer_ip TEXT,
  viewer_country TEXT,
  viewer_city TEXT,
  viewer_device TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel: referral_codes
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  rewards_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel: referral_tracking
CREATE TABLE public.referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users NOT NULL,
  referred_user_id UUID REFERENCES auth.users,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'clicked', -- clicked, signed_up, upgraded
  reward_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  upgraded_at TIMESTAMPTZ
);

-- Tabel: interview_sessions
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  position TEXT NOT NULL,
  level TEXT NOT NULL,
  industry TEXT,
  questions JSONB,
  answers JSONB,
  scores JSONB,
  overall_score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own applications" ON public.job_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analytics" ON public.cv_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can insert analytics" ON public.cv_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can manage own referral" ON public.referral_codes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referral tracking" ON public.referral_tracking FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Public can insert referral clicks" ON public.referral_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can manage own interview sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);
```

---

## 5. Route Plan

| Route | Page | Auth | Tier |
|-------|------|------|------|
| `/lowongan` | Job listings (public) | No | All |
| `/lowongan/$slug` | Job detail (public) | No | All |
| `/lamaran` | Application tracker | Yes | All |
| `/analitik` | CV analytics | Yes | Pro+ |
| `/referral` | Referral dashboard | Yes | All |
| `/simulasi-wawancara` | Interview simulator | Yes | Pro+ |
| `/simulasi-wawancara/$id` | Interview session result | Yes | Pro+ |

---

## 6. Component Plan

```
src/components/
├── job/
│   ├── JobCard.tsx          # Card komponen lowongan
│   ├── JobFilters.tsx       # Filter lowongan (posisi, lokasi, level)
│   └── JobDetail.tsx        # Detail lowongan
├── lamaran/
│   ├── ApplicationForm.tsx  # Form tambah/edit lamaran
│   ├── ApplicationCard.tsx  # Card lamaran (kanban)
│   ├── ApplicationKanban.tsx # Kanban board view
│   └── ApplicationStats.tsx # Statistik lamaran
├── analytics/
│   ├── CvAnalyticsCard.tsx  # Card metrik analitik
│   ├── ViewsChart.tsx       # Chart views per hari
│   └── AnalyticsSummary.tsx # Ringkasan analitik
├── referral/
│   ├── ReferralCode.tsx     # Display & copy kode referral
│   ├── ReferralStats.tsx    # Statistik referral
│   └── ReferralShare.tsx    # Share referral link
├── interview/
│   ├── InterviewSetup.tsx   # Setup sesi (posisi, level)
│   ├── InterviewChat.tsx    # Chat simulasi wawancara
│   ├── InterviewScore.tsx   # Hasil & skor
│   └── InterviewHistory.tsx # Riwayat sesi
└── share/
    └── WhatsAppShare.tsx    # Tombol share WhatsApp
```

---

## 7. MVP Scope (yang diimplementasikan sekarang)

✅ WhatsApp Share — Simple button, tracking  
✅ CV Analytics — Metrics dashboard Pro+  
✅ Referral Program — Generate code, stats, tracking  
✅ Application Tracker — CRUD + kanban  
✅ Job Board — Public listings page  
✅ Interview Simulator — AI mock interview (Pro+)
