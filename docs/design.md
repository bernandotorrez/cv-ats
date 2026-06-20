# DESIGN.md — CVKarir.id: Design System & SEO Strategy

> **Version**: 1.0.0  
> **Prinsip**: Clean · Accessible · Indonesian-First · WCAG 2.1 AA

---

## 1. Design Philosophy

### 1.1 Core Principles

1. **Clarity First** — Pengguna harus tahu apa yang harus dilakukan dalam 3 detik pertama
2. **Progressive Disclosure** — Tampilkan informasi penting dulu, detail saat dibutuhkan
3. **Locally Resonant** — Terasa familiar untuk pengguna Indonesia, tidak terasa "bule"
4. **Trust-Building** — Desain yang serius dan profesional = meningkatkan kepercayaan
5. **Mobile-First** — >70% pengguna Indonesia akses via mobile

### 1.2 Aesthetic Direction

**"Organic Professionalism"** — Perpaduan antara kehangatan hijau alam Indonesia dengan ketepatan desain professional modern. Terinspirasi dari kepercayaan diri, pertumbuhan, dan kesempatan karier.

Bukan corporate yang kaku, bukan startup yang terlalu kasual. **Seimbang, hangat, dipercaya.**

---

## 2. Color System

### 2.1 Brand Colors

```css
:root {
  /* Primary Palette */
  --color-primary: #468432; /* Hijau utama — kepercayaan, pertumbuhan */
  --color-primary-light: #5ca340; /* Hover state primary */
  --color-primary-dark: #335f24; /* Active state, text on light bg */
  --color-primary-50: #f0f7ec; /* Background tint sangat tipis */
  --color-primary-100: #d4eaca; /* Background tint light */
  --color-primary-200: #a9d595; /* Border, subtle accents */

  /* Secondary Palette */
  --color-secondary: #9ad872; /* Hijau muda — energi, segar */
  --color-secondary-light: #b2e48f;
  --color-secondary-dark: #77c14e;

  /* Accent Palette */
  --color-accent-yellow: #ffef91; /* Kuning — highlight, perhatian positif */
  --color-accent-yellow-dark: #f5dc3a; /* Badge, tooltip */
  --color-accent-orange: #ffa02e; /* Orange — CTA sekunder, warning */
  --color-accent-orange-dark: #e8891a; /* Hover orange */

  /* Neutral Palette */
  --color-neutral-50: #f9fafb;
  --color-neutral-100: #f3f4f6;
  --color-neutral-200: #e5e7eb;
  --color-neutral-300: #d1d5db;
  --color-neutral-400: #9ca3af;
  --color-neutral-500: #6b7280;
  --color-neutral-600: #4b5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1f2937;
  --color-neutral-900: #111827;

  /* Semantic Colors */
  --color-success: #468432; /* Sama dengan primary */
  --color-warning: #ffa02e; /* Orange */
  --color-error: #dc2626; /* Red */
  --color-error-light: #fef2f2;
  --color-info: #2563eb; /* Blue */
  --color-info-light: #eff6ff;

  /* Surface Colors */
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff; /* box-shadow untuk elevasi */
  --color-border: #e5e7eb;
  --color-border-focus: #468432;

  /* Text Colors */
  --color-text-primary: #111827; /* Contrast 15.3:1 on white ✓ WCAG AAA */
  --color-text-secondary: #374151; /* Contrast 10.7:1 on white ✓ WCAG AAA */
  --color-text-muted: #6b7280; /* Contrast 4.6:1 on white ✓ WCAG AA */
  --color-text-disabled: #9ca3af; /* Only for non-interactive elements */
  --color-text-inverse: #ffffff;
  --color-text-on-primary: #ffffff; /* White on #468432: 4.56:1 ✓ WCAG AA */
}
```

### 2.2 Color Usage Rules

| Context            | Color                   | Rule                                 |
| ------------------ | ----------------------- | ------------------------------------ |
| Primary CTA button | `--color-primary`       | Selalu pakai teks putih              |
| Secondary CTA      | `--color-accent-orange` | Untuk "Upgrade", "Coba Pro"          |
| Success state      | `--color-primary`       | CV score tinggi, success toast       |
| Warning            | `--color-accent-orange` | Skor rendah, hampir habis limit      |
| Error              | `--color-error`         | Form error, destructive actions      |
| Highlight/Badge    | `--color-accent-yellow` | "Populer", "Rekomendasi", label baru |
| Background page    | `--color-bg-secondary`  | Authenticated pages                  |
| Background cards   | `--color-surface`       | Dengan subtle shadow                 |

### 2.3 Contrast Ratios (WCAG 2.1 AA Compliance)

```
#468432 on #FFFFFF = 4.56:1  ✅ AA (large text + UI)
#335F24 on #FFFFFF = 7.23:1  ✅ AAA
#111827 on #FFFFFF = 15.3:1  ✅ AAA
#374151 on #FFFFFF = 10.7:1  ✅ AAA
#6B7280 on #FFFFFF = 4.61:1  ✅ AA
#FFFFFF on #468432 = 4.56:1  ✅ AA
#FFFFFF on #FFA02E = 2.85:1  ⚠️  AA-large only (jangan pakai untuk small text)
#111827 on #FFEF91 = 12.4:1  ✅ AAA (badge text)

RULE: Jangan pernah pakai teks putih di atas #9AD872 atau #FFEF91 (kontras tidak cukup)
```

---

## 3. Typography

### 3.1 Font Families

```css
:root {
  /* Display / Headings — Karakter kuat, mudah dibaca */
  --font-display: "Plus Jakarta Sans", "DM Sans", sans-serif;

  /* Body — Legibility di semua ukuran */
  --font-body: "Inter", "Plus Jakarta Sans", sans-serif;

  /* Monospace — untuk code, CV preview detail */
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}

/* Google Fonts import */
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap");
```

**Mengapa Plus Jakarta Sans?**

- Dirancang untuk readability di layar digital modern
- Character yang unik tapi tidak mengganggu profesionalisme
- Dukungan karakter Latin yang sempurna (termasuk é, ñ, dll)
- Bukan Inter/Roboto yang terlalu generic

### 3.2 Type Scale

```css
:root {
  /* Type Scale (Major Third — 1.25 ratio) */
  --text-xs: 0.75rem; /* 12px — captions, helper text */
  --text-sm: 0.875rem; /* 14px — secondary info, labels */
  --text-base: 1rem; /* 16px — body text (minimum untuk WCAG) */
  --text-lg: 1.125rem; /* 18px — emphasized body */
  --text-xl: 1.25rem; /* 20px — subtitle, card title */
  --text-2xl: 1.5rem; /* 24px — section heading */
  --text-3xl: 1.875rem; /* 30px — page heading */
  --text-4xl: 2.25rem; /* 36px — hero heading desktop */
  --text-5xl: 3rem; /* 48px — hero display */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
}
```

### 3.3 Typography Rules

- **Body text minimum**: 16px (WCAG 1.4.4)
- **Line height body**: 1.5 minimum
- **Paragraph max-width**: 65-75 karakter (45ch-65ch) untuk readability
- **Heading hierarchy**: WAJIB berurutan (h1→h2→h3), tidak boleh skip
- **Teks CV dalam PDF**: hanya Georgia, Times New Roman, Arial, Calibri (ATS safe)

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (4px base)

```css
:root {
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
}
```

### 4.2 Grid System

```css
/* Container widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* CV Editor Layout */
/* Left panel (form): 420px fixed | Right panel (preview): flex-1 */
/* Mobile: stacked, preview toggle via tab/button */
```

### 4.3 Border Radius

```css
--radius-sm: 0.25rem; /* 4px — small elements */
--radius-md: 0.5rem; /* 8px — inputs, small cards */
--radius-lg: 0.75rem; /* 12px — cards, modals */
--radius-xl: 1rem; /* 16px — larger cards */
--radius-2xl: 1.5rem; /* 24px — hero elements */
--radius-full: 9999px; /* Pills, badges, avatars */
```

### 4.4 Shadows

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
--shadow-card: 0 2px 8px rgba(70, 132, 50, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
--shadow-focus: 0 0 0 3px rgba(70, 132, 50, 0.2); /* Focus ring */
```

---

## 5. Component Design Specifications

### 5.1 Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
  padding: 10px 20px; /* min 44x44px touch target */
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  transition: all 150ms ease;
  min-height: 44px; /* WCAG 2.5.5 */
}
.btn-primary:hover {
  background: var(--color-primary-light);
}
.btn-primary:active {
  background: var(--color-primary-dark);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* CTA Button (Upgrade) */
.btn-cta {
  background: var(--color-accent-orange);
  color: var(--color-neutral-900); /* Dark text for contrast */
  font-weight: var(--font-bold);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-primary);
}
```

**Button Size Matrix**:
| Size | Padding | Min Height | Font Size |
|------|---------|-----------|-----------|
| xs | 6px 12px | 32px | 12px |
| sm | 8px 16px | 36px | 14px |
| md | 10px 20px | **44px** | 14px |
| lg | 12px 24px | 48px | 16px |
| xl | 14px 32px | 56px | 18px |

### 5.2 Form Inputs

```css
.input {
  height: 44px; /* WCAG touch target */
  padding: 0 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base); /* 16px — prevent iOS zoom */
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition:
    border-color 150ms,
    box-shadow 150ms;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
  outline: none;
}
.input:invalid,
.input[aria-invalid="true"] {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}
```

**Input Rules**:

- Font size MINIMUM 16px (mencegah auto-zoom di iOS)
- Semua input WAJIB punya `<label>` yang terhubung via `htmlFor`/`id`
- Error message: merah + ikon + teks deskriptif (bukan hanya "Input salah")
- Placeholder BUKAN pengganti label
- Required field: tanda asterisk (\*) dengan tooltip penjelasan

### 5.3 Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

/* Interactive card (template selector) */
.card-interactive:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(70, 132, 50, 0.15);
  transform: translateY(-2px);
  transition: all 200ms ease;
}
.card-interactive:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 5.4 ATS Score Widget

```
┌─────────────────────────────────────┐
│  Skor ATS CV Anda                   │
│                                     │
│       ╭────────────╮                │
│      /   82 / 100   \               │
│     │    Grade: B+   │              │
│      \              /               │
│       ╰────────────╯                │
│  ████████████████████░░░░  82%      │
│                                     │
│  ✅ Format & Struktur      90/100   │
│  ✅ Kualitas Konten        85/100   │
│  ⚠️  Keyword Match         70/100   │
│  ✅ Info Kontak            100/100  │
│  ⚠️  Panjang Optimal       75/100   │
│                                     │
│  💡 Rekomendasi:                    │
│  Tambahkan 5 keyword dari JD target │
│                                     │
│  [Lihat Detail]  [Perbaiki dengan AI]│
└─────────────────────────────────────┘
```

### 5.5 Subscription Badge

```
Free:    [ Free ]          — neutral grey, outlined
Starter: [ Starter ⭐ ]    — primary green
Pro:     [ Pro 🚀 ]        — orange/amber gradient
Pro+:    [ Pro+ 💎 ]       — purple/premium gradient
```

---

## 6. Page Layouts

### 6.1 Landing Page Structure

```
SECTION 1: Hero
├── Headline: "Buat CV ATS Friendly, Lolos Seleksi Lebih Mudah"
├── Subheadline: benefit + social proof ringkas
├── CTA Primary: "Buat CV Gratis" → /register
├── CTA Secondary: "Lihat Template" → scroll ke section template
└── Hero visual: Mockup CV + ATS score animasi

SECTION 2: Social Proof Bar
└── "Dipercaya 10.000+ pencari kerja Indonesia" + logo perusahaan

SECTION 3: Problem-Solution
├── "85% CV ditolak ATS sebelum dibaca manusia"
└── "CVKarir membantu Anda lolos ATS"

SECTION 4: Features (3-kolom grid)
├── Template ATS-ready
├── AI Panduan Pengisian
├── Scoring Otomatis
├── Job Match Analysis
├── Tips Interview
└── Download PDF/DOCX

SECTION 5: Template Showcase
└── Preview 4 template (card, hover → lihat full)

SECTION 6: How It Works (3 step)
├── Step 1: Pilih Template
├── Step 2: Isi dengan Panduan AI
└── Step 3: Download & Apply

SECTION 7: Testimonials
└── 3-4 testimonial dengan foto, nama, posisi, perusahaan

SECTION 8: Pricing
└── 4 tier (Free, Starter, Pro, Pro+) — highlight Pro

SECTION 9: FAQ
└── 6-8 pertanyaan umum (structured data JSON-LD)

SECTION 10: CTA Final
└── "Mulai Gratis Sekarang" + "Tidak perlu kartu kredit"

FOOTER
├── Links: Tentang, Blog, Tips, Privasi, Syarat
├── Social media
└── Copyright
```

### 6.2 CV Editor Layout

```
┌──────────────────────────────────────────────────────┐
│ HEADER: Logo | CV Title (editable inline) | [Save ✓] │
│         [Template] [Preview] [Download ▼] [Score: 82]│
├─────────────────────────────┬────────────────────────┤
│ LEFT PANEL (420px)          │ RIGHT PANEL (flex-1)   │
│                             │                        │
│ [Sections Nav]              │  LIVE PREVIEW          │
│  ● Kontak                   │  (actual CV render)    │
│  ● Ringkasan                │                        │
│  ● Pengalaman               │  Scale: [75% ▼]        │
│  ● Pendidikan               │                        │
│  ● Keterampilan             │  [Page 1 of 2]         │
│  + Tambah Section           │                        │
│                             │                        │
│ [ACTIVE SECTION FORM]       │                        │
│  ┌───────────────────────┐  │                        │
│  │ Jabatan *             │  │                        │
│  │ [________________]    │  │                        │
│  │ 💡 Saran AI           │  │                        │
│  └───────────────────────┘  │                        │
│                             │                        │
│ ATS SCORE PANEL (collapsed) │                        │
│ [▶ Lihat Skor ATS: 82/100]  │                        │
└─────────────────────────────┴────────────────────────┘

MOBILE: Tab bar "Form | Preview | Skor" di bawah
```

---

## 7. Motion & Animation

### 7.1 Animation Principles

- **Purposeful**: Animasi harus membantu, bukan menghambat
- **Fast**: Max 300ms untuk microinteractions, 500ms untuk page transitions
- **Subtle**: Subtlety > showiness untuk aplikasi profesional
- **Reducible**: Hormati `prefers-reduced-motion`

### 7.2 Timing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1); /* Untuk elemen masuk */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Untuk pop-in effects */
```

### 7.3 Transition Durations

```css
--duration-75: 75ms; /* Hover state changes */
--duration-150: 150ms; /* Button clicks, input focus */
--duration-200: 200ms; /* Card hover, tooltip */
--duration-300: 300ms; /* Modal open, drawer slide */
--duration-500: 500ms; /* Page transitions */
```

### 7.4 Key Animations

```css
/* ATS Score progress bar — draw animation */
@keyframes score-fill {
  from {
    width: 0%;
  }
  to {
    width: var(--score-percent);
  }
}

/* Toast notification entrance */
@keyframes toast-in {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Loading skeleton pulse */
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Feature card hover lift */
.feature-card:hover {
  transform: translateY(-4px);
  transition:
    transform var(--duration-200) var(--ease-out),
    box-shadow var(--duration-200) var(--ease-out);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Keyboard Navigation

- Tab order: logis mengikuti visual flow
- Skip to main content link (tersembunyi, muncul saat focus)
- Modal trap focus saat terbuka
- ESC menutup modal/dropdown
- Arrow keys untuk dropdown/select navigation

```html
<!-- Skip to main content -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
>
  Langsung ke konten utama
</a>
```

### 8.2 Screen Reader Support

```tsx
// ARIA patterns yang wajib diimplementasikan:

// 1. Form errors
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid={errors.email ? 'true' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-error">
    {errors.email.message}
  </p>
)}

// 2. Loading states
<button aria-busy={isLoading} aria-disabled={isLoading}>
  {isLoading ? 'Menyimpan...' : 'Simpan'}
</button>

// 3. ATS Score (meaningful)
<div role="meter" aria-valuenow={82} aria-valuemin={0} aria-valuemax={100}
     aria-label="Skor ATS: 82 dari 100">
  {/* visual progress bar */}
</div>

// 4. Dynamic content updates
<div aria-live="polite" aria-atomic="true">
  {aiSuggestion && <p>Saran AI: {aiSuggestion}</p>}
</div>
```

### 8.3 Focus Management

```css
/* Visible focus indicator — WAJIB */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

/* JANGAN pernah: outline: none; (tanpa alternatif) */
```

### 8.4 Color Accessibility

- Jangan bergantung hanya pada warna untuk menyampaikan informasi
- Error: merah + ikon ⚠️ + teks
- Success: hijau + ikon ✓ + teks
- Status badge: warna + label teks

---

## 9. Responsive Design

### 9.1 Breakpoints (Mobile-First)

```css
/* Tailwind breakpoints */
sm:  640px   /* Landscape phone */
md:  768px   /* Tablet portrait */
lg:  1024px  /* Tablet landscape / small desktop */
xl:  1280px  /* Desktop */
2xl: 1536px  /* Large desktop */
```

### 9.2 CV Editor Responsive Behavior

```
Mobile (<768px):
  - Single column
  - Bottom tab bar: [Form] [Preview] [Skor]
  - Form section full width
  - Preview: simplified render

Tablet (768px - 1024px):
  - 2 kolom: 360px form | flex-1 preview
  - Score panel: slide-up dari bawah

Desktop (>1024px):
  - 3 panel: 280px sections nav | 400px form | flex-1 preview
  - Score panel: sidebar kanan (sticky)
```

### 9.3 Touch Targets

- Minimum 44×44px untuk semua interactive elements (WCAG 2.5.5)
- Spacing antar touch targets: minimum 8px
- Mobile bottom navigation: safe area insets untuk iPhone notch

---

## 10. SEO Strategy

### 10.1 Target Keyword Map

#### Cluster 1: CV Builder (Awareness + Intent)

| Keyword                  | Volume/bln | Difficulty | Page Target            |
| ------------------------ | ---------- | ---------- | ---------------------- |
| buat CV ATS              | 8.100      | Medium     | Homepage               |
| template CV ATS friendly | 5.400      | Medium     | /templates             |
| CV builder Indonesia     | 3.600      | Low        | Homepage               |
| cara buat CV ATS         | 6.200      | Low        | /blog/cara-buat-cv-ats |
| contoh CV ATS friendly   | 4.400      | Low        | /blog/contoh-cv-ats    |

#### Cluster 2: Template CV (Informational)

| Keyword                      | Volume/bln | Page Target               |
| ---------------------------- | ---------- | ------------------------- |
| template CV gratis Indonesia | 9.900      | /templates                |
| template CV fresh graduate   | 8.100      | /templates/fresh-graduate |
| template CV bahasa inggris   | 6.600      | /templates/english        |
| template CV HRD approved     | 3.300      | /templates                |
| download template CV word    | 12.100     | /templates (DOCX focus)   |

#### Cluster 3: Tips Karier (Top of Funnel)

| Keyword                             | Volume/bln | Page Target               |
| ----------------------------------- | ---------- | ------------------------- |
| cara lolos seleksi ATS              | 4.800      | /tips/lolos-ats           |
| tips interview kerja                | 14.800     | /tips/interview           |
| cara negosiasi gaji                 | 8.100      | /tips/negosiasi-gaji      |
| tips diterima kerja fresh graduate  | 6.600      | /tips/fresh-graduate      |
| cara menulis pengalaman kerja di CV | 5.400      | /blog/pengalaman-kerja-cv |

#### Cluster 4: Competitor & Alternative (High Intent)

| Keyword                        | Volume/bln | Page Target             |
| ------------------------------ | ---------- | ----------------------- |
| alternatif resume.io Indonesia | 1.200      | Landing (comparison)    |
| buat CV gratis tanpa daftar    | 3.300      | Landing (guest preview) |
| CV online gratis download PDF  | 6.600      | Homepage                |

### 10.2 On-Page SEO Rules

#### Title Tag Formula

```
[Primary Keyword] — [Brand] | [Benefit]

Contoh:
Homepage: "Buat CV ATS Friendly Gratis | CVKarir.id — Template Profesional Indonesia"
Templates: "Template CV ATS Friendly Indonesia Gratis Download | CVKarir.id"
Tips: "Tips Lolos Seleksi ATS: Panduan Lengkap 2025 | CVKarir.id"
Blog post: "[Judul Artikel] | CVKarir.id"

Panjang: max 60 karakter (dipotong Google setelah 600px)
```

#### Meta Description Formula

```
[Manfaat utama] + [Social Proof / Differentiator] + [CTA]

Contoh Homepage:
"Buat CV yang lolos sistem ATS dengan panduan AI. Template profesional,
scoring otomatis, tips karier. Dipercaya 10.000+ pencari kerja Indonesia. Coba gratis!"

Panjang: 150-160 karakter
Wajib ada: target keyword, CTA, uniqueness
```

#### Heading Structure (H1-H6)

```
HOMEPAGE:
H1: "Buat CV ATS Friendly, Raih Karier Impian" (1x halaman)
H2: "Mengapa 85% CV Ditolak Sebelum Dibaca?" (problem section)
H2: "Solusi Lengkap dalam Satu Platform" (features)
H2: "Template CV Profesional Siap Pakai" (template section)
H2: "Cara Kerja CVKarir.id" (how it works)
H2: "Harga Terjangkau untuk Semua" (pricing)
H2: "Pertanyaan yang Sering Ditanyakan" (FAQ)
```

#### URL Structure

```
/                           → Homepage
/templates                  → Template gallery
/templates/[template-slug]  → Individual template
/tips                       → Tips listing
/tips/[slug]                → Individual tip article
/blog                       → Blog listing
/blog/[slug]                → Individual blog post
/pricing                    → Pricing page
/tentang                    → About page
/login                      → Login
/register                   → Register

RULES:
- Huruf kecil semua
- Pisah kata dengan hyphen (-), TIDAK underscore (_)
- Singkat dan deskriptif
- Sertakan keyword utama
- Tidak lebih dari 3 level dalam
```

### 10.3 Technical SEO Checklist

```
✅ Server-Side Rendering (Next.js App Router) — semua halaman public
✅ Canonical tag pada SEMUA halaman
✅ robots.txt (allow semua kecuali /dashboard, /cv/*, /api/*)
✅ Sitemap XML dinamis (auto-update saat artikel baru)
✅ Core Web Vitals green (LCP < 2.5s, CLS < 0.1, FID < 100ms)
✅ Structured Data JSON-LD (WebApp, FAQ, HowTo, Article)
✅ Open Graph + Twitter Cards
✅ hreflang tags (id, en)
✅ Image: alt text semua gambar, WebP format, lazy loading
✅ 404 page custom dengan link kembali
✅ Breadcrumbs (JSON-LD) untuk halaman dalam
✅ Internal linking strategy (cluster model)
✅ Page speed optimization:
   - Font: preconnect + display=swap
   - Images: next/image dengan blur placeholder
   - Bundle splitting otomatis (Next.js)
   - Edge caching (Vercel)
```

### 10.4 Content SEO Strategy

```
BLOG: 2 artikel/minggu
- Topik: ATS tips, CV guide, interview tips, karier Indonesia
- Format: Pillar content (3000+ kata) + Supporting content (1000 kata)
- Internal link ke: fitur relevan, template, pricing

LANDING PAGES oleh industri:
/cv/engineer         → "CV ATS untuk Software Engineer"
/cv/marketing        → "CV ATS untuk Marketing"
/cv/finance          → "CV ATS untuk Finance & Accounting"
/cv/fresh-graduate   → "CV ATS untuk Fresh Graduate"
(long-tail traffic, high conversion intent)

EVERGREEN CONTENT:
- "Panduan Lengkap CV ATS 2025 Indonesia" (update tiap tahun)
- "50 Contoh Kalimat CV yang Kuat"
- "Daftar ATS yang Dipakai Perusahaan Indonesia"
```

### 10.5 Link Building Strategy

- Guest post di: Glints Blog, Kalibrr Magazine, Kompas Karir, Detik Finance
- PR: startup Indonesia media (Techinasia, DailySocial)
- Forum: Kaskus Loker, Reddit r/indonesia, LinkedIn groups
- Tools: Free ATS checker (bring organic traffic)

---

## 11. Icon System

Menggunakan **Lucide React** sebagai primary icon library:

```
Consistent size: 20px (sm), 24px (md default), 32px (lg)
Stroke width: 1.5px
Color: inherit (ikuti text color)
ARIA: aria-hidden="true" + hidden dari screen reader
      KECUALI jika ikon adalah satu-satunya konteks → tambah aria-label
```

---

## 12. Illustration Style

- **Style**: Simple, flat illustrations dengan accent warna brand
- **Characters**: Karakter yang mencerminkan keberagaman Indonesia (bukan Western-default)
- **Format**: SVG inline (untuk animasi), WebP (untuk static)
- **Tone**: Optimis, profesional, aspiratif — bukan stres/anxious

---

## 13. Loading States & Empty States

### Loading States

```
Page load: Skeleton screen (bukan spinner)
Button: Disable + spinner icon inline + teks "Memproses..."
AI Response: Typing indicator (3 dots animation)
PDF Generate: Progress bar dengan tahapan ("Memformat... Mengompres... Selesai!")
```

### Empty States

```
No CVs yet:
  Ilustrasi: kosong/blank paper dengan pensil
  Heading: "Belum ada CV"
  Text: "Buat CV pertama Anda dan mulai lamar pekerjaan impian!"
  CTA: "Buat CV Sekarang"

No tips found:
  "Konten akan segera hadir. Cek lagi besok!"
```

---

## 14. Error States

### Form Errors

```
❌ Inline, di bawah field yang error
❌ Merah (#DC2626) + ikon ⚠️ + teks deskriptif
❌ Tidak menghilang saat user mulai mengetik (tunggu blur atau re-submit)

Contoh messages (Bahasa Indonesia):
- "Email tidak valid. Contoh: nama@domain.com"
- "Password minimal 8 karakter dengan huruf kapital dan angka"
- "Nomor telepon harus format Indonesia: 08xxxxxxxxxx"
```

### API/Network Errors

```
Toast notification:
  - Error: merah, ikon X, teks singkat + tombol "Coba Lagi"
  - Success: hijau, ikon ✓
  - Warning: oranye, ikon ⚠️
  - Info: biru, ikon ℹ️

Position: pojok kanan bawah
Duration: 5 detik (error), 3 detik (success)
Stack: max 3 toast bersamaan
```

---

## 15. CV Template Design Specifications

### Aturan ATS-Safe Design

```
❌ JANGAN:
- Text box / frame di luar main body
- Tabel untuk layout (ok untuk data tabel)
- Header/footer area dari dokumen (area diluar body)
- Font yang tidak dikenali (stick ke: Georgia, Times New Roman, Arial, Calibri, Garamond)
- Image/icon di dalam area teks parsing
- Color background di section (ATS sering menghapusnya)
- Grafis, chart, infografis
- Kolom teks paralel (beberapa ATS bacanya horizontally)
- Hyperlink dengan anchor text non-URL (beberapa ATS tidak follow)

✅ BOLEH:
- Warna teks untuk heading (misal, hijau brand untuk nama dan heading)
- Bold, Italic, Underline
- Horizontal rule <hr> pembatas section
- Bullet points standar (•, -, –)
- Single column layout (paling aman)
- 2 kolom HANYA jika kolom kiri narrow (< 30%) untuk info kontak
```

### Template T01 — Profesional Bersih

```
Layout: Single column
Font: Calibri 11pt
Warna: Hitam untuk body, #335F24 (primary dark) untuk nama & heading
Section order: Kontak → Summary → Pengalaman → Pendidikan → Skill → Sertifikasi
Margin: 0.75 inch semua sisi
```
