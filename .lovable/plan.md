
# CV Builder ATS-Friendly Indonesia

Aplikasi web pembuat CV ATS-friendly berbahasa Indonesia dengan AI assistant, scoring, dan subscription. Dibangun di atas TanStack Start + Lovable Cloud (Supabase) + Lovable AI Gateway, deploy ke Vercel.

## 1. Brand & Design System

**Color palette** (oklch tokens di `src/styles.css`):
- Primary `#468432` (hijau) — CTA utama, header
- Secondary `#9AD872` (hijau muda) — accent, highlight sukses
- Third `#FFEF91` (kuning lembut) — badge, info background
- Fourth `#FFA02E` (oranye) — warning, upgrade CTA, premium badge
- Neutral base putih bersih + abu-abu lembut untuk teks & surface

**Prinsip UI/UX**:
- Clean, minimalis ala Linear/Notion. Banyak white space, tipografi besar mudah dibaca.
- Font: Inter (body) + Plus Jakarta Sans (headings) — keduanya optimal untuk Bahasa Indonesia.
- Mobile-first, breakpoint sm/md/lg/xl. Bottom nav di mobile, sidebar di desktop.
- WCAG 2.1 AA: kontras minimum 4.5:1 (cek primary di atas putih), focus ring jelas, semua interaksi keyboard accessible, label `aria-*` pada form, skip-to-content link, prefers-reduced-motion respected.
- Komponen shadcn/ui (sudah tersedia) di-custom dengan token semantic (`bg-primary`, `text-foreground`, dst — tidak pernah hardcode warna).

## 2. Halaman & Routing (TanStack Start file-based)

```
src/routes/
  __root.tsx                      shell + SEO defaults + analytics
  index.tsx                       Landing (hero, fitur, template preview, pricing, FAQ, testimonial)
  fitur.tsx                       Detail fitur untuk SEO
  template.tsx                    Galeri template CV
  harga.tsx                       Pricing tier
  panduan-cv-ats.tsx              Blog/SEO pillar: cara bikin CV ATS
  tips-interview.tsx              Hub tips interview
  tips-interview.$slug.tsx        Artikel tips interview (SEO long-tail)
  blog.tsx + blog.$slug.tsx       Konten SEO tambahan
  tentang.tsx, kontak.tsx, kebijakan-privasi.tsx, syarat-ketentuan.tsx
  login.tsx, register.tsx, lupa-password.tsx, reset-password.tsx, verifikasi-email.tsx
  _authenticated.tsx              Guard (beforeLoad redirect)
  _authenticated/dashboard.tsx    Daftar CV user
  _authenticated/cv.baru.tsx      Pilih template
  _authenticated/cv.$id.edit.tsx  Editor CV (form + preview live)
  _authenticated/cv.$id.score.tsx Hasil scoring AI
  _authenticated/akun.tsx         Profil & subscription
  api/public/...                  Webhook payment (nanti), sitemap.xml, robots.txt
```

## 3. Database Schema (Lovable Cloud / Supabase)

| Tabel | Kolom utama | Catatan |
|---|---|---|
| `profiles` | id (FK auth.users), full_name, phone, created_at | trigger on signup |
| `user_roles` | id, user_id, role enum('user','admin') | role TIDAK di profiles (anti privilege escalation) |
| `subscriptions` | id, user_id, tier enum('free','starter','pro'), status, current_period_end, provider, external_id | |
| `cvs` | id, user_id, title, template_id, data jsonb, target_role, target_industry, language, updated_at | data berisi semua field CV |
| `cv_versions` | id, cv_id, snapshot jsonb, created_at | history/undo |
| `cv_scores` | id, cv_id, overall_score, breakdown jsonb, suggestions jsonb, job_description text, created_at | hasil AI scoring |
| `ai_usage` | id, user_id, feature, tokens_used, created_at | quota tracking per tier |
| `templates` | id, slug, name, description, preview_url, is_premium | seed data |
| `interview_tips` | id, slug, title, category, content, published_at, seo_meta jsonb | konten editorial |

**RLS**: semua tabel enable RLS. Policy `auth.uid() = user_id` untuk read/write data sendiri. Function `public.has_role(uid, role)` SECURITY DEFINER untuk admin checks. Templates & interview_tips public read.

## 4. Fitur Inti

**1. Auth (email + password)** via Supabase Auth, verifikasi email wajib, redirect `emailRedirectTo`, halaman `/reset-password` dedicated. Google sign-in opsional di akhir.

**2. Editor CV**: form multi-section (data diri, ringkasan, pengalaman, pendidikan, skill, sertifikasi, proyek, bahasa) + live preview di kanan (desktop) / tab toggle (mobile). Auto-save tiap perubahan (debounced) ke `cvs.data`.

**3. Template ATS-friendly** (4–6 template awal): single-column, no tables/images di body, font standar, heading jelas — semua di-render React → diekspor ke PDF via `@react-pdf/renderer` (server function untuk konsistensi).

**4. AI Saran Pengisian** (Lovable AI, default `google/gemini-3-flash-preview`): tombol "Sarankan" di tiap section. Server function `suggest-section` menerima context & target role, mengembalikan saran dalam Bahasa Indonesia yang siap di-insert.

**5. AI CV Scoring**: input job description (opsional), AI analisa kecocokan keyword, struktur, ATS-readability, action verbs. Output: skor 0–100 + breakdown (Relevance, Skills Match, Experience, Format, Keywords) + saran perbaikan actionable. Disimpan di `cv_scores`.

**6. Panduan AI (chat)**: panel chat streaming SSE, context-aware (tahu CV mana yang sedang diedit), bantu draft kalimat & jawab pertanyaan.

**7. Subscription Tier** (UI + DB siap, payment di-mock dulu):
- **Free** Rp 0 — 1 CV, 2 template basic, 5x AI saran/bulan, scoring 1x/bulan, watermark kecil di PDF
- **Starter** Rp 19.000/bln — 3 CV, semua template, 50x AI saran, scoring 10x, tanpa watermark
- **Pro** Rp 49.000/bln — unlimited CV, prioritas AI, scoring unlimited, export DOCX (future), interview prep premium

Quota di-enforce di server function via cek `ai_usage` + `subscriptions.tier`.

**8. Tips & Trik Interview**: hub artikel (SEO), kategori (HR, technical, behavioral, fresh graduate, career switcher). Konten dikelola di tabel `interview_tips`.

**9. Fitur unggulan tambahan**:
- **AI Cover Letter generator** dari CV + job description
- **Keyword extractor** dari URL/teks lowongan → highlight skill yang harus ada
- **CV Comparison** (Pro): bandingkan 2 versi side-by-side
- **Public share link** read-only (`/cv/share/:token`) dengan toggle on/off
- **Import dari LinkedIn** (paste profile text → AI parse ke struktur)
- **ATS Preview Mode**: render CV sebagai plain text seperti dilihat ATS

## 5. SEO & SERP

- `head()` per route dengan title <60 char + meta description <160 char unik. Format: `Judul Halaman | CV Pintar`.
- Keywords target: "buat cv ats", "contoh CV Pintar", "template cv ats gratis", "cv generator ai indonesia", "tips interview kerja", dll.
- Single H1 per page, semantic `<header><main><article><section>`, alt text deskriptif.
namis (gabung route statis + slug dari `interview_tips` & `blog`), `/robots.txt` allow - JSON-LD: `Organization`, `WebSite` di root; `Article` di blog/tips; `FAQPage` di landing & harga; `Product` + `Offer` di harga; `BreadcrumbList`.
- `<link rel="canonical">` per route.
- `og:image` 1200x630 unik untuk landing & artikel utama (di-generate sebagai asset).
- Server route `/sitemap.xml` di+ sitemap link.
- Open Graph & Twitter card lengkap, lang="id".
- Performance: lazy-load images, preconnect ke Supabase, route preload TanStack — penting untuk Core Web Vitals (signal SEO).

## 6. Keamanan

**Frontend**:
- Content Security Policy via Vercel `vercel.json` headers: `default-src 'self'`, allow Supabase + AI Gateway domain, `frame-ancestors 'none'`, no inline scripts (TanStack mendukung).
- Headers tambahan: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal, `Strict-Transport-Security`.
- XSS: tidak pernah `dangerouslySetInnerHTML` dengan input user. Semua user input di-escape oleh React. Konten artikel di-render via markdown library yang aman (sanitize).
- Validasi input di client + server pakai Zod (panjang, format, regex).
- Tidak ada secret di frontend; hanya `VITE_SUPABASE_URL` + publishable key.

**Backend**:
- Auth: Supabase Auth, email verifikasi wajib sebelum akses dashboard. HIBP password check diaktifkan.
- RLS strict di semua tabel data user. Service role key HANYA di server function.
- SQL injection: query lewat Supabase client (parameterized) — tidak pernah string concat SQL.
- Validasi Zod di setiap `createServerFn` (max length, enum, regex) untuk cegah DoS & malformed input.
- Webhook (saat payment aktif nanti): verifikasi HMAC signature dengan `timingSafeEqual`.
- `requireSupabaseAuth` middleware untuk semua server function user-scoped.
- Quota AI per user/tier untuk cegah abuse (cek `ai_usage` count sebelum panggil AI).
- Role check via `public.has_role()` SECURITY DEFINER, bukan dari client/JWT claim manipulasi.
- Logging error di server, tidak expose stack trace ke client.

OWASP Top 10 coverage: A01 (RLS + role table), A02 (Supabase TLS, no plaintext secrets), A03 (Zod + parameterized queries + React escape), A04 (rencana arsitektur secure-by-default), A05 (CSP & security headers), A07 (email verify + HIBP), A08 (input validation), A09 (logging), A10 (no client-side fetch ke origin user-controlled).

*Catatan: rate limiting backend belum ada primitif resmi di Lovable Cloud — saya enforce via quota tabel + Cloudflare/Vercel edge nanti bila perlu.*

## 7. Stack & Deployment

- **Framework**: TanStack Start v1 + React 19 + Vite 7 (sudah terpasang)
- **UI**: Tailwind v4 + shadcn/ui + lucide-react + framer-motion (animasi halus)
- **Backend**: Lovable Cloud (Supabase) — DB, Auth, Storage
- **AI**: Lovable AI Gateway (`google/gemini-3-flash-preview` default; `gemini-2.5-pro` untuk scoring berat)
- **PDF**: `@react-pdf/renderer` di server function
- **Form/validation**: react-hook-form + zod
- **State**: TanStack Query (sudah ada)
- **Deploy**: Vercel (build TanStack Start sudah kompatibel). Database tetap di Lovable Cloud / Supabase. ENV: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` di Vercel project settings.

## 8. Roadmap Implementasi

Karena scope sangat besar, saya bangun bertahap dalam pesan-pesan berikutnya. Phase 1 berikut yang akan saya mulai jika kamu setujui plan ini:

**Phase 1 — Fondasi & Landing (saya implement dulu)**
1. Enable Lovable Cloud
2. Setup design system (color tokens, font, base components)
3. Landing page lengkap (hero, fitur, template preview, harga, FAQ, footer) dengan SEO
4. Halaman publik: fitur, template, harga, panduan, tips-interview hub, tentang, kontak, privasi, syarat
5. Routing + SEO meta + sitemap + robots + JSON-LD
6. Security headers via `vercel.json`

**Phase 2 — Auth & Dashboard**
- Register/login/verify/reset, profiles + user_roles + RLS, dashboard kosong, guard `_authenticated`

**Phase 3 — CV Editor & Template**
- 4 template ATS, editor form + live preview, auto-save, export PDF

**Phase 4 — AI Features**
- Saran pengisian, scoring, panduan chat, cover letter, keyword extractor

**Phase 5 — Subscription & Konten**
- Tier UI + quota enforcement (mock payment), seed konten interview tips, blog system

**Phase 6 — Polish**
- A11y audit (axe), Lighthouse 95+, security scan, share link, comparison

