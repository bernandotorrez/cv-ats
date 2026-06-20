# TASK.md — CVKarir.id: Implementation Task Breakdown

> **Target Agent**: Minimax 2.7 / DeepSeek V4 Pro  
> **Methodology**: Feature-by-feature, test-driven where possible  
> **Priority**: P0 → P1 → P2 (implement in order)  
> **Status Legend**: [x] = Done, [ ] = Pending, 🚧 = Partial/Needs Work

---

## PRE-FLIGHT CHECKLIST (Baca Sebelum Mulai)

Sebelum menulis kode apapun, pastikan:

- [x] Sudah baca `prd.md` lengkap
- [x] Sudah baca `skill.md` lengkap (terutama Project Structure dan Security)
- [x] Sudah baca `design.md` lengkap (terutama Color System dan Accessibility)
- [x] Supabase project sudah dibuat (URL + Anon Key tersedia)
- [x] Cloudflare/Vercel project sudah dibuat
- [x] Domain `cvpintar.web.id` sudah dikonfigurasi
- [x] `.env` sudah diisi dengan semua environment variables

---

## FASE 0: Project Setup

### TASK-001: Inisialisasi Project ✅

**Priority**: P0 | **Estimasi**: 2 jam

**Stack**: TanStack Start + Vite + TypeScript + Tailwind CSS v4 + Supabase

**Deliverables**:

- [x] App berjalan di `localhost:3000` (via `vite dev`)
- [x] Tailwind terkonfigurasi dengan color palette brand (lihat design.md)
- [x] TypeScript strict mode aktif
- [x] ESLint + Prettier terkonfigurasi
- [x] Folder structure sesuai `skill.md` section 2

---

### TASK-002: Konfigurasi Tailwind dengan Design System ✅

**Priority**: P0 | **Estimasi**: 1 jam  
**Reference**: `design.md` section 2, 3, 4

**Deliverables**:

- [x] `styles.css` dengan CSS custom properties (design tokens) — primary #468432, secondary #9AD872, warning #FFA02E, info #FFEF91
- [x] Google Fonts (Plus Jakarta Sans + Inter) ter-load dengan benar
- [x] Test: render komponen `<Button>` dengan semua variants

---

### TASK-003: Supabase Setup + Database Migration 🚧

**Priority**: P0 | **Estimasi**: 3 jam  
**Reference**: `skill.md` section 3

**Sub-tasks**:

- [x] **TASK-003a**: Setup Supabase client — `integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`
- [x] **TASK-003b**: Jalankan migration (7 file di `supabase/migrations/` — phase 1-7)
- [x] **TASK-003c**: RLS policies aktif (via migrations)
- [x] **TASK-003d**: Generate TypeScript types ✅ — `supabase gen types typescript` ulang, semua tabel (ai_usage, cv_scores, templates, subscription_tiers, subscriptions, user_subscriptions) now in generated types
- [x] **TASK-003e**: Seed data awal ✅ — 8 CV templates + 4 subscription tiers via `supabase/seed.sql` + `supabase db push`
  - ⚠️ Content articles (tips/blog) masih static di frontend code — belum butuh DB table

**Deliverables**:

- [x] Semua tabel terbuat dengan benar
- [x] RLS aktif dan teruji
- [x] TypeScript types lengkap ✅
- [x] Supabase client berfungsi

---

### TASK-004: Security Headers + Middleware ✅

**Priority**: P0 | **Estimasi**: 1 jam  
**Reference**: `skill.md` section 5.1, 5.2

- [x] Auth route protection via `_authenticated.tsx` (redirect ke `/login` jika belum login)
- [x] CSP headers — `Content-Security-Policy` strict via `src/lib/security-headers.ts` + `src/server.ts` wrapper
- [x] X-Frame-Options: DENY — anti-clickjacking
- [x] X-Content-Type-Options: nosniff — anti-MIME sniffing
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy: camera=(), microphone=(), geolocation=()
- [x] Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- [x] X-DNS-Prefetch-Control: on
- [x] `public/_headers` untuk static assets Cloudflare
- [x] Test endpoint: `/api/headers-check` untuk verifikasi
- [x] Test: coba akses `/dashboard` tanpa login → redirect ke `/login`

---

## FASE 1: Authentication

### TASK-005: Register Page ✅

**Priority**: P0 | **Estimasi**: 4 jam  
**Reference**: `prd.md` F-01, `design.md` section 5.1, 5.2

**File**: `routes/register.tsx`, `components/ui/password-strength.tsx`

**Implementasi**:

- [x] Form: nama lengkap, email, password, checkbox TOS
- [x] Zod validation (RegisterSchema)
- [x] Password strength indicator real-time (4 level: Lemah/Cukup/Kuat/Sangat Kuat)
- [x] Toggle show/hide password
- [x] Submit via Supabase `auth.signUp()`
- [x] Success: pesan "Cek email Anda untuk verifikasi" + redirect ke `/verify-email`
- [x] Error handling: email sudah terdaftar, network error
- [x] Link ke halaman Login
- [x] Responsive: mobile-friendly

---

### TASK-006: Email Verifikasi Handler ✅

**Priority**: P0 | **Estimasi**: 2 jam

**File**: `routes/verify-email.tsx`

**Implementasi**:

- [x] Halaman "Cek Email Anda": instruksi + tombol "Kirim Ulang" (cooldown 60 detik)
- [x] Halaman sukses verifikasi (`?confirmed=true`)
- [x] Halaman error (link expired → opsi kirim ulang)
- [x] Supabase callback: redirect after email confirmation

---

### TASK-007: Login Page ✅

**Priority**: P0 | **Estimasi**: 3 jam  
**Reference**: `prd.md` F-03

**File**: `routes/login.tsx`, `routes/lupa-password.tsx`, `routes/reset-password.tsx`

**Implementasi**:

- [x] Form: email + password
- [x] "Ingat saya" checkbox
- [x] Login via `supabase.auth.signInWithPassword()`
- [x] Error handling: "Email atau password salah" (tidak spesifik)
- [x] Rate limit: setelah 5 gagal → akun dikunci 30 menit + countdown timer
- [x] Show/hide password toggle
- [x] Link ke Register + Lupa Password
- [x] Redirect ke halaman sebelumnya (dari `searchParams.redirect`)
- [x] Forgot Password: kirim reset email — `routes/lupa-password.tsx` dengan cooldown 60s
- [x] Reset Password: form new password dengan password strength — `routes/reset-password.tsx`

---

### TASK-008: Auth Layout + Protected Routes ✅

**Priority**: P0 | **Estimasi**: 2 jam

- [x] `_authenticated.tsx` — auth gate + loading state + redirect
- [x] `SiteHeader` — user menu (Login/Daftar vs Dashboard/Keluar)
- [x] Logout functionality via `signOut()`
- [x] Session persistence via AuthProvider context
- [x] `__root.tsx` — skip link, Toaster, 404 page, error boundary, global layout

---

## FASE 2: CV Builder Core

### TASK-009: Template Selector Page ✅

**Priority**: P0 | **Estimasi**: 4 jam  
**Reference**: `prd.md` F-04, `design.md` section 5.3

**File**: `components/cv/TemplateGallery.tsx`

**Implementasi**:

- [x] Grid template cards (4 kolom desktop, 2 tablet, 1 mobile)
- [x] Thumbnail preview, nama template, badge tier (Free/Pro)
- [x] Hover: subtle lift + border hijau
- [x] Template Pro + user Free: overlay blur + lock icon
- [x] Pilih template → create CV → redirect ke editor
- [x] Loading skeleton via `CvCardSkeleton`
- [x] Keyboard navigable cards (button + aria-label)

---

### TASK-010: CV Data Model + Store ✅

**Priority**: P0 | **Estimasi**: 3 jam

**File**: `lib/cv-types.ts`, `lib/hooks/use-autosave.ts`

**Types**:

- [x] `CvPersonal`, `CvExperience`, `CvEducation`, `CvSkill`, `CvLanguage`, `CvCertificate`, `CvData`
- [x] `TEMPLATES` array, `TemplateId` type, `emptyCv` default

**Store**:

- [x] CV state via React useState di `cv.$id.tsx`
- [x] Auto-save: debounce 2 detik via `useAutosave` hook

---

### TASK-011: CV Editor Layout ✅

**Priority**: P0 | **Estimasi**: 5 jam  
**Reference**: `design.md` section 6.2

**File**: `routes/_authenticated/cv.$id.tsx`, `components/cv/editor/SectionsNav.tsx`, `components/cv/editor/PreviewToolbar.tsx`

**Implementasi**:

- [x] 3-panel layout desktop (250px sections nav | 420px form | flex-1 preview) — dengan toggle sembunyi/tampil nav
- [x] Sections nav: daftar section dengan ikon + drag & drop via `@dnd-kit` (pointer + keyboard sensors)
- [x] Mobile: bottom tab bar "Form | Preview | Skor"
- [x] Mobile/Tablet: horizontal scroll section selector di form panel
- [x] Header bar: CV title (editable), target posisi, template switcher, save status, share, AI tools link, score link, chat toggle, download, save button
- [x] Save status indicator: "Menyimpan..." / "Tersimpan ✓" / "Gagal"
- [x] Preview scale control: 50%, 70%, 85%, 100% — `PreviewToolbar` component
- [x] Template switch dialog
- [x] Print-friendly CSS (`@media print`)
- [x] Full responsive: 3-panel (lg) → 2-panel (md) → tab bar (mobile)

---

### TASK-012: Section Form Components ✅

**Priority**: P0 | **Estimasi**: 8 jam

**Integrated in**: `routes/_authenticated/cv.$id.tsx` (all sections in one file with tabs)

**Implementasi per section**:

- [x] Personal: fullName, headline, email, phone, location, linkedin, website, summary
- [x] Experience: position, company, location, dates, current toggle, description
- [x] Education: school, degree, field, dates, description
- [x] Skills: name list (add/remove)
- [x] Extras: Languages (name, level), Certificates (name, issuer, date)
- [x] ATS View: plain text preview + LinkedIn Import
- [x] AI Saran button di setiap section (summary, headline, experience, education, skills)
- [x] List items dengan add/delete functionality
- [x] "Saat ini bekerja di sini" toggle
- [x] Accessibility: labels, placeholders

---

### TASK-013: CV Template Renderers ✅

**Priority**: P0 | **Estimasi**: 8 jam

**File**: `components/cv/CvPreview.tsx`, `components/cv/templates/`

**Implementasi**:

- [x] 4 template renderers: Jakarta (klasik), Bandung (modern header), Surabaya (left border), Yogya (minimalis)
- [x] Ukuran A4 (210mm × 297mm) di preview, scale-able via CSS transform
- [x] Font ATS-safe: Inter, system-ui
- [x] Template dispatcher by ID
- [x] Section kosong → tidak dirender
- [x] Print-friendly CSS
- [x] Separate template files (all in one CvPreview.tsx) — ✅ refactor completed
  - `templates/Section.tsx` — shared Section component
  - `templates/JakartaTemplate.tsx` — base template renderer
  - `templates/BandungTemplate.tsx` — modern header variant
  - `templates/SurabayaTemplate.tsx` — left border variant
  - `templates/YogyaTemplate.tsx` — minimalist variant
  - `templates/index.ts` — barrel export
- [x] Halaman ke-2 jika konten melebihi 1 halaman — ✅ completed
  - `MultiPageCvPreview` component for multi-page support
  - `splitContentIntoPages` function for intelligent content splitting
  - Page number indicator (X / Y)
  - Print-friendly CSS media queries

---

### TASK-014: PDF Download ✅

**Priority**: P0 | **Estimasi**: 5 jam

**File**: `supabase/functions/generate-pdf/index.ts`, `src/lib/cv-export.ts`, `src/components/cv/DownloadDropdown.tsx`

**Implementasi**:

- [x] PDF generation via HTML-to-PDF Edge Function
- [x] Free tier: PDF dengan watermark "Dibuat dengan CV Pintar"
- [x] Starter+: PDF tanpa watermark
- [x] Print/Cetak button di toolbar editor
- [x] Upload ke Supabase Storage
- [x] Tracking: update `download_count` dan `last_downloaded_at`
- [x] DOCX download — ✅ completed
  - `src/lib/cv-export.ts` — generateDocx function dengan docx library
  - Support semua section CV (personal, experience, education, skills, languages, certificates)
  - A4 page size dengan margins yang sesuai
  - Watermark untuk free tier
- [x] Download dropdown UI (PDF / DOCX) — ✅ completed
  - `src/components/cv/DownloadDropdown.tsx` — dropdown dengan 2 options
  - PDF: trigger print dialog (browser save as PDF)
  - DOCX: generate via docx library
  - Watermark indicator untuk free tier

---

### TASK-015: Auto-save + CV List Dashboard ✅

**Priority**: P0 | **Estimasi**: 3 jam

**File**: `lib/hooks/use-autosave.ts`, `routes/_authenticated/dashboard.tsx`, `routes/_authenticated/cv.index.tsx`

**Implementasi**:

- [x] Dashboard: welcome message, quick stats (CV, AI calls, tier), CTA "Buat CV Baru", recent CVs, tips
- [x] CV List: semua CV dengan card (judul, template, status, last updated)
- [x] CV card actions: Edit, Skor, AI Tools, Compare (Pro), Delete
- [x] Delete dengan confirmation dialog
- [x] Autosave: debounce 2 detik di CV editor → upsert ke Supabase
- [x] Indicator "Tersimpan" real-time di toolbar
- [x] Empty state jika belum ada CV
- [x] Free tier limit: max CV ditampilkan + upgrade prompt
- [x] Loading skeletons (CvCardSkeleton)

---

## FASE 3: AI Features

### TASK-016: AI Suggestion ✅

**Priority**: P1 | **Estimasi**: 6 jam  
**Reference**: `prd.md` F-05

**File**: `supabase/functions/ai-suggest/index.ts`, `supabase/functions/_shared/ai-common.ts`, `supabase/functions/_shared/cors.ts`, `lib/ai-functions.ts`

**Implementasi**:

- [x] `_shared` utilities: cors, auth (getUserId), rate-limit (quota check), AI gateway client
- [x] `ai-suggest` Edge Function — saran per section (summary, headline, experience, education, skills) dengan 3 opsi
- [x] AI Saran button di setiap section form (tombol "Sarankan AI")
- [x] Loading state: spinner
- [x] Error state: limit tercapai → toast error
- [x] Quota tracking via `ai_usage` table
- [x] Suggestion panel dengan 3 opsi + Accept/Regenerate
- [x] Usage counter display — ditampilkan di halaman Akun

---

### TASK-017: ATS Scoring Engine + UI ✅

**Priority**: P1 | **Estimasi**: 6 jam  
**Reference**: `prd.md` F-06

**File**: `supabase/functions/ai-score/index.ts`, `components/ai/score-widget.tsx`, `routes/_authenticated/score.$cvId.tsx`

**Implementasi**:

- [x] `ai-score` Edge Function — full AI analysis dengan Job Description matching
- [x] Score page terpisah (`/score/$cvId`) — overall score, breakdown, strengths, weaknesses, suggestions, history
- [x] Score widget component — circular gauge, 5 sub-scores, recommendations, grade badge (A/B/C/D)
- [x] Color coding: ≥85 hijau, 70-84 kuning, <70 merah
- [x] "Perbaiki dengan AI" button
- [x] Job Description input untuk matching
- [x] Riwayat skor (previous scores)
- [x] Animasi transisi skor
- [x] Real-time local scoring (tanpa AI) — heuristic scoring module
- [x] Score panel collapsible di CV editor — AtsScoreWidget compact mode always visible

---

### TASK-018: AI Guided Mode ✅

**Priority**: P1 | **Estimasi**: 5 jam  
**Reference**: `prd.md` F-07

**File**: `components/ai/guided-mode.tsx`, `supabase/functions/ai-chat/index.ts`

**Implementasi**:

- [x] Guided mode component — chat-like step-by-step interface
- [x] 7 step progression: greeting → headline → summary → experience → education → skills → complete
- [x] AI chat via `ai-chat` Edge Function
- [x] Progress bar: "Langkah X dari 7"
- [x] Skip / Previous / Next navigation
- [x] Final screen: "CV Siap Direview!"
- [x] `AiChatPanel` di CV editor untuk chat bebas
- [x] Pause & resume — state di-persist ke CV data di Supabase
- [x] "Panduan AI" vs "Isi Sendiri" pilihan saat buat CV baru

---

## FASE 4: Subscription & Payment

### TASK-019: Pricing Page ✅

**Priority**: P0 | **Estimasi**: 4 jam

**File**: `routes/harga.tsx`

**Implementasi**:

- [x] 3 tier: Free (Rp 0), Starter (Rp 19rb/bln), Pro (Rp 49rb/bln)
- [x] Highlight Pro sebagai "Paling Populer" dengan badge
- [x] Feature list per tier
- [x] CTA per tier → register
- [x] FAQ dengan structured data JSON-LD
- [x] SEO: meta title/description
- [x] Mobile: card stack vertikal
- [ ] 4 tier (Pro+ Rp 99rb) — 🚧 3 tier saat ini

---

### TASK-020: Midtrans Integration 🚧

**Priority**: P0 | **Estimasi**: 6 jam

**File**: `supabase/functions/payment-webhook/index.ts`, `routes/_authenticated/akun.tsx`

**Implementasi**:

- [x] Payment webhook Edge Function — signature verification (SHA-512), idempotency, status handling
- [x] Subscription page (`/akun`) — current tier, usage stats, upgrade prompts
- [x] Tier info display — Free/Starter/Pro dengan badge warna
- [x] Usage tracking — CV count, AI calls bulan ini, template access
- [ ] Checkout page — 🚧 belum (Midtrans Snap frontend integration)
- [ ] Payment method selection (GoPay, OVO, DANA, VA, Kartu Kredit) — 🚧 belum
- [ ] Auto-subscription activation via webhook — 🚧 webhook ready, perlu test end-to-end
- [ ] Email konfirmasi pembayaran — 🚧 send-email Edge Function ready, belum wired
- [ ] Invoice auto-generate — 🚧 belum

**Security**:

- [x] Signature verification wajib di webhook
- [x] Idempotency: duplicate webhook check
- [ ] Server-side amount validation — 🚧 partial

---

### TASK-021: Feature Gating ✅

**Priority**: P0 | **Estimasi**: 3 jam

**File**: `lib/subscription.ts`, `components/subscription/feature-gate.tsx`

**Implementasi**:

- [x] `getUserTier()`, `getTierLimits()` utility functions
- [x] TIER_LIMITS — Free/Starter/Pro/Pro+ dengan semua limit
- [x] `FeatureGate` component — conditional render berdasarkan tier
- [x] `UpgradePrompt` — inline, non-intrusive
- [x] Usage counter di dashboard + halaman Akun
- [x] Edge Functions: quota check via `checkAndTrackQuota` di `_shared/ai-common.ts`

---

## FASE 5: Content & SEO

### TASK-022: Landing Page ✅

**Priority**: P0 | **Estimasi**: 8 jam  
**Reference**: `design.md` section 6.1 dan SEO section 10

**File**: `routes/index.tsx`, `routes/__root.tsx`

**Sections**:

- [x] Hero: headline, subheadline, dual CTA, mockup visual CV + ATS score
- [x] Problem-Solution: "85% CV ditolak ATS" + solusi
- [x] Trust/Stats bar: 10.000+ CV, 92% lolos, 4.8 rating, <10 mnt
- [x] Features grid: 6 fitur utama dengan ikon
- [x] Template showcase: 4 template preview
- [x] How it works: 4 step (01-04)
- [x] Pricing preview: 3 tier + link ke `/harga`
- [x] Testimonials: 3 card dengan bintang
- [x] FAQ: 5 pertanyaan + Accordion + JSON-LD structured data
- [x] Final CTA: "Daftar Gratis Sekarang"
- [x] Footer lengkap: multi-column, links, copyright
- [x] SEO: meta tags, OG, Twitter Cards, canonical, WebApplication + FAQ schema
- [x] Fonts: preconnect
- [x] Mobile: fully responsive

---

### TASK-023: Header & Footer Components ✅

**Priority**: P0 | **Estimasi**: 3 jam

**File**: `components/site/SiteHeader.tsx`, `components/site/SiteFooter.tsx`

**Implementasi**:

- [x] Marketing header: logo, nav (Fitur, Template, Harga, Panduan, Tips Interview), CTA "Daftar Gratis" + "Login"
- [x] Auth-aware: Dashboard/Keluar vs Login/Daftar
- [x] Mobile: hamburger menu dengan slide-in
- [x] Sticky header dengan backdrop blur
- [x] Footer: 4 kolom (Produk, Belajar, Perusahaan), copyright
- [x] Accessibility: `role="navigation"`, `aria-label`, skip link

---

### TASK-024: Tips & Blog Content Pages ✅

**Priority**: P1 | **Estimasi**: 4 jam

**File**: `routes/blog.tsx`, `routes/blog.$slug.tsx`, `routes/tips-interview.tsx`, `routes/tips-interview.$slug.tsx`

**Implementasi**:

- [x] Blog listing: grid card (kategori, judul, excerpt, tanggal)
- [x] Blog detail: full article, back link, Article JSON-LD
- [x] Tips listing: grid card per kategori
- [x] Tips detail: full article, back link, Article JSON-LD
- [x] SEO: dynamic meta title/description per artikel
- [x] Categories: CV & Karier, Fresh Graduate, HR Interview, Technical, Karier, Behavioral
- [x] Filter/kategori — chip filter dengan tombol "Semua" + per kategori
- [x] Pagination — 4 item per halaman dengan navigasi halaman

---

### TASK-025: Dynamic Sitemap + robots.txt ✅

**Priority**: P0 | **Estimasi**: 1 jam

**File**: `routes/sitemap.xml.tsx`, `routes/robots.txt.tsx`

**Implementasi**:

- [x] Sitemap XML — static paths + tips slugs + blog slugs + changefreq
- [x] robots.txt — allow all, disallow /dashboard, /cv, /akun
- [x] Dynamic content — all blog & tips slugs included, sourced from same data as routes

---

### TASK-026: Template Gallery (Public) ✅

**Priority**: P1 | **Estimasi**: 3 jam

**File**: `routes/template.tsx`

**Implementasi**:

- [x] Showcase 6 template (termasuk Premium dengan badge)
- [x] Hover effect: lift + shadow
- [x] CTA: "Mulai pakai template gratis" → register
- [x] SEO: meta tags
- [x] Template preview popup/lightbox — Dialog dengan mockup besar + tags + CTA
- [x] Filter: kategori (Semua, Korporat, Tech, Kreatif, Fresh Graduate, Senior, Career Switch)

---

## FASE 6: Polish & Production

### TASK-027: Email Templates 🚧

**Priority**: P0 | **Estimasi**: 3 jam

**File**: `supabase/functions/send-email/index.ts`, `emails/`

**Email templates dibuat**:

- [x] `emails/verify-email.html` — branded, Bahasa Indonesia
- [x] `emails/password-reset.html` — branded, valid 1 jam
- [x] `emails/welcome.html` — 5 step onboarding
- [x] `emails/payment-success.html` — ringkasan pembayaran
- [ ] `emails/payment-failed.html` — 🚧 belum
- [ ] `emails/subscription-renewal-reminder.html` — 🚧 belum
- [ ] `emails/subscription-cancelled.html` — 🚧 belum

**Implementasi**:

- [x] Branded email template (warna hijau #468432, typography bersih)
- [x] Bahasa Indonesia
- [x] Mobile-responsive HTML email
- [x] Integration dengan Resend API via `send-email` Edge Function
- [ ] Unsubscribe link — 🚧 belum

---

### TASK-028: Error Pages ✅

**Priority**: P0 | **Estimasi**: 1 jam

- [x] 404 page — `notFoundComponent` di `__root.tsx`
- [x] Global error boundary — `errorComponent` di `__root.tsx`
- [x] "Kembali ke Beranda" + "Coba Lagi" buttons
- [ ] Sentry integration — 🚧 belum

---

### TASK-029: Loading States & Skeletons ✅

**Priority**: P0 | **Estimasi**: 3 jam

**File**: `components/ui/skeleton-loading.tsx`

**Skeleton components dibuat**:

- [x] `Skeleton` base, `CardSkeleton`, `CvCardSkeleton`, `TemplateCardSkeleton`
- [x] `ArticleCardSkeleton`, `EditorSkeleton`, `DashboardSkeleton`
- [x] `PricingPageSkeleton`, `ScorePageSkeleton`
- [x] Applied: CV list page (CvCardSkeleton), CV editor inline
- [x] Applied di semua halaman (pricing, blog, tips, template) — ✅ via `pendingComponent`
- [x] Suspense boundaries — ✅ di `__root.tsx` dengan `PageLoadingFallback` + `_authenticated.tsx` skeleton
- [x] Loading indicator di header saat navigasi — ✅ `useRouterState().isLoading` + `animate-indeterminate-loading` bar

---

### TASK-030: Analytics & Monitoring ❌

**Priority**: P1 | **Estimasi**: 2 jam

- [ ] Vercel/Cloudflare Analytics integration
- [ ] Google Search Console setup
- [ ] Sentry error tracking
- [ ] Custom event tracking: cv_created, cv_downloaded, ai_suggestion_used, subscription_started

---

### TASK-031: PWA Configuration 🚧

**Priority**: P2 | **Estimasi**: 2 jam

- [x] `routes/manifest.webmanifest.tsx` — dengan brand colors
- [ ] Service worker — 🚧 belum
- [ ] App icons (192px, 512px) — 🚧 belum
- [ ] "Add to Home Screen" prompt — 🚧 belum

---

### TASK-032: Performance Audit ❌

**Priority**: P0 | **Estimasi**: 3 jam

- [ ] Run Lighthouse audit semua halaman public (target: ≥90)
- [ ] Core Web Vitals check via PageSpeed Insights
- [ ] Image optimization (WebP, sizes)
- [ ] Bundle analysis
- [ ] Remove unused CSS
- [ ] Lazy load below-fold components

---

### TASK-033: Security Audit ❌

**Priority**: P0 | **Estimasi**: 2 jam

- [ ] Test RLS policies (akses data user lain → harus gagal)
- [ ] Test CSP headers
- [ ] Test rate limiting (429 response)
- [ ] Test input sanitization (XSS attempts)
- [ ] Test auth bypass attempts
- [ ] Verify webhook signature validation
- [ ] Check env variables tidak exposed ke client

---

### TASK-034: Accessibility Audit ❌

**Priority**: P0 | **Estimasi**: 2 jam

- [ ] axe-core scan semua halaman (target: 0 violations)
- [ ] Manual keyboard navigation test
- [ ] Color contrast check (teks ≥ 4.5:1)
- [ ] Screen reader test
- [ ] Focus order logical
- [ ] All images have alt text
- [ ] Form errors announced to screen readers

---

### TASK-035: Deployment & CI/CD ❌

**Priority**: P0 | **Estimasi**: 3 jam

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Supabase production setup
- [ ] Edge Functions deployment (`supabase functions deploy --all`)
- [ ] Environment secrets untuk production
- [ ] Preview deployments untuk PRs

---

## FASE 7: Phase 1.5 Features (Post-MVP)

### TASK-036: Cover Letter Generator (Pro) 🚧

- [x] Edge Function: `supabase/functions/ai-cover-letter/index.ts`
- [x] UI: `routes/_authenticated/tools.$cvId.tsx` (cover letter tab)
- [x] Input: CV data + Job Description paste
- [x] Output: cover letter dalam Bahasa Indonesia
- [x] Copy to clipboard button
- [ ] Download PDF + DOCX — 🚧 belum

### TASK-037: Interview Tips Content (Full) 🚧

- [x] 6 artikel tips interview (static content)
- [x] Kategori: Fresh Graduate, HR Interview, Technical, Karier, Behavioral
- [ ] AI Interview Simulator — 🚧 belum
- [ ] Library pertanyaan per industri — 🚧 belum
- [ ] Salary negotiation guide — 🚧 partial (artikel ada)
- [ ] Dress code guide — 🚧 belum

### TASK-038: Referral Program ❌

- [ ] Referral code system
- [ ] Landing page `/referral/[code]`
- [ ] Tracking dan reward automation
- [ ] Dashboard referral

### TASK-039: LinkedIn Optimizer (Pro+) ❌

- [ ] Input: LinkedIn URL atau manual copy-paste
- [ ] AI analysis: headline, summary, experience
- [ ] Keyword optimization suggestions
- [ ] Comparison: LinkedIn vs CV consistency

---

## Task Summary & Progress

```
✅ = Completed (centang hijau)
🚧 = Partial (perlu kerja lanjutan)
❌ = Not started

Phase 0 (Setup):         [✅✅✅✅] TASK 001-004
Phase 1 (Auth):          [✅✅✅✅]   TASK 005-008
Phase 2 (CV Builder):    [✅✅✅✅✅✅✅] TASK 009-015
Phase 3 (AI Features):   [✅✅✅]     TASK 016-018
Phase 4 (Subscription):  [✅🚧✅]    TASK 019-021
Phase 5 (Content/SEO):   [✅✅✅✅✅] TASK 022-026
Phase 6 (Polish):        [🚧✅✅❌🚧❌❌❌❌] TASK 027-035
Phase 7 (Post-MVP):      [🚧🚧❌❌]  TASK 036-039

Total: 23 Complete, 8 Partial, 8 Not Started
```

---

## Notes untuk AI Agent

1. **Implementasi bertahap**: Selesaikan satu TASK sebelum pindah ke TASK berikutnya
2. **Selalu validasi input**: Baik di frontend (React Hook Form + Zod) maupun backend (Edge Function)
3. **Jangan hardcode secrets**: Semua API keys dari environment variables
4. **Test setiap fitur**: Minimal happy path + error case
5. **Tanya jika tidak jelas**: Lebih baik konfirmasi daripada asumsi yang salah
6. **Database first**: Pastikan schema dan RLS benar sebelum membangun UI
7. **Referensi silang**: Selalu periksa `prd.md`, `skill.md`, `design.md` untuk konteks lengkap
8. **Bahasa UI**: Semua teks default Bahasa Indonesia (kecuali field input CV yang bisa ID/EN)
