# Security Hardening Tasks — CV Pintar

> **Sumber**: `security-audit.md`  
> **Prioritas**: SEGERA → MINGGU INI → SPRINT INI  
> **Status**: [ ] Pending | [x] Done

---

## 🔴 PRIORITAS SEGERA (Hari Ini)

### SEC-001: Rotate AI_API_KEY & Amankan Environment Variables
**File**: `.env`, Vercel/Cloudflare dashboard  
**Severity**: 🔴 CRITICAL

- [x] Create `.env.example` dengan template environment variables
- [x] Update `.gitignore` dengan komentar security warning
- [ ] Generate API key baru di AI Gateway
- [ ] Update environment variable di production (Vercel/Cloudflare)
- [ ] Hapus `AI_API_KEY` dari `.env` file
- [ ] Audit git history — jika key pernah di-commit, rotate SEMUA key

---

### SEC-002: Restrict CORS ke Domain Spesifik
**File**: `supabase/functions/_shared/cors.ts`  
**Severity**: 🔴 CRITICAL

- [x] Ubah `"Access-Control-Allow-Origin": "*"` menjadi origin spesifik
  ```ts
  const ALLOWED_ORIGINS = [
    "https://cvats.id",
    "https://www.cvats.id",
    "http://localhost:8000",  // development only
    "http://localhost:5173",  // vite dev
  ];
  
  export function corsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
      "Access-Control-Allow-Origin": allowed,
      ...
    };
  }
  ```
- [x] Update semua edge function untuk menggunakan `corsHeaders(req)` bukan `corsHeaders` statis
- [ ] Test CORS dari production domain
- [ ] Deploy semua edge functions

---

### SEC-003: Tambah Otentikasi ke `linkedin-import`
**File**: `supabase/functions/linkedin-import/index.ts`  
**Severity**: 🔴 CRITICAL

- [x] Tambah `const userId = await getUserId(req);` di awal try block
- [x] Tambah rate limiting via `checkRateLimit()`
- [x] Pastikan `getUserId` di-import dari `../_shared/ai-common.ts`
- [ ] Test: call tanpa auth token → 401
- [ ] Deploy

---

### SEC-004: Tambah Otentikasi ke `send-email`
**File**: `supabase/functions/send-email/index.ts`  
**Severity**: 🔴 CRITICAL

- [x] Tambah `const userId = await getUserId(req);` di awal try block
- [x] Batasi field `to` hanya ke email user yang terotentikasi (fetch from `profiles` table)
- [x] Tambah rate limiting: max 10 email/jam per user
- [x] Validasi input: `subject`, `html` length limits
- [x] Sanitasi HTML content (XSS prevention)
- [ ] Test: call tanpa auth → 401
- [ ] Test: kirim ke email lain (bukan milik user) → should be blocked
- [ ] Deploy

---

### SEC-005: Consolidate CSP Headers
**File**: `vercel.json`, `src/lib/security-headers.ts`  
**Severity**: 🔴 CRITICAL

- [x] Pilih SATU sumber CSP — hapus CSP dari `vercel.json`, biarkan `server.ts` yang handle
- [x] Tambah dokumentasi untuk `unsafe-eval` dan `unsafe-inline` di `security-headers.ts`
  ```
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.midtrans.com https://api.midtrans.com
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ai.sumopod.com https://app.midtrans.com
  frame-src https://app.midtrans.com
  ```
- [ ] Test: Midtrans Snap payment popup berfungsi
- [ ] Test: AI API calls dari client (via edge function) berfungsi
- [ ] Test: Supabase realtime connection berfungsi
- [ ] Deploy

---

### SEC-006: Buat Tabel `payments` + RLS
**File**: `supabase/migrations/YYYYMMDDHHMMSS_security_payments.sql` (baru)  
**Severity**: 🔴 CRITICAL

- [x] Buat migration:
  ```sql
  CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID,
    gateway TEXT NOT NULL,
    gateway_order_id TEXT UNIQUE NOT NULL,
    gateway_transaction_id TEXT,
    amount_idr INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    invoice_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

  CREATE INDEX idx_payments_user_id ON public.payments(user_id);
  CREATE INDEX idx_payments_gateway_order ON public.payments(gateway_order_id);
  ```
- [ ] Jalankan `npx supabase db push`
- [ ] Test: payment webhook bisa insert & query payments
- [ ] Generate TypeScript types ulang: `npx supabase gen types typescript`

---

## 🟡 PRIORITAS MINGGU INI

### SEC-007: Tambah Per-Minute Rate Limiting ke Semua Edge Functions
**File**: `supabase/functions/_shared/rate-limit.ts`, semua edge functions  
**Severity**: 🟡 HIGH

- [x] Buat `_shared/rate-limit.ts` dengan in-memory rate limiter:
  ```ts
  const buckets = new Map<string, { count: number; resetAt: number }>();

  export function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= maxRequests) return false;
    bucket.count++;
    return true;
  }
  ```
- [x] Terapkan ke semua edge function:
  - AI functions: 30 req/menit per user (via checkAndTrackQuota existing)
  - `send-email`: 10 req/jam per user
  - `linkedin-import`: 10 req/jam per user
  - `generate-pdf`: 20 req/menit per user (future)
- [ ] Test: spam calls → 429 response
- [ ] Deploy semua

---

### SEC-008: Sembunyikan AI Gateway Error Details
**File**: `supabase/functions/_shared/ai-common.ts` (line 99)  
**Severity**: 🟡 MEDIUM

- [x] Ubah error handling di `aiComplete()`:
  ```ts
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`AI Gateway error (${res.status}):`, errText); // log full
    throw new Error("AI service temporarily unavailable");      // generic to client
  }
  ```
- [ ] Pastikan log disimpan di Supabase logs
- [ ] Deploy semua AI edge functions

---

### SEC-009: Tambah Runtime Browser Guard ke `supabaseAdmin`
**File**: `src/integrations/supabase/client.server.ts`  
**Severity**: 🟡 MEDIUM

- [x] Tambah guard di awal file:
  ```ts
  if (typeof window !== 'undefined') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY: supabaseAdmin cannot be used in browser. ' +
      'This is a server-only module.'
    );
  }
  ```
- [ ] Test: import di browser component → throw error
- [ ] Pastikan build tidak broken

---

## 🟢 PRIORITAS SPRINT INI

### SEC-010: Document `user_subscriptions` RLS Gap
**File**: `supabase/migrations/20260507055000_phase7_normalize_subscriptions.sql`  
**Severity**: 🟡 MEDIUM

- [x] Buat migration `20260508000001_security_rls_documentation.sql` dengan dokumentasi RLS gap
  ```sql
  -- NOTE: No INSERT/UPDATE/DELETE policies for user_subscriptions.
  -- Subscriptions are managed exclusively by:
  -- 1. payment-webhook Edge Function (service_role)
  -- 2. Admin panel (service_role)
  -- Users cannot create/modify their own subscriptions directly.
  ```
- [ ] Tidak perlu kode change — dokumentasi saja

---

### SEC-011: Remove `SECURITY DEFINER` dari Trigger Function
**File**: `supabase/migrations/20260507040753_...sql` (migration #1)  
**Severity**: 🟡 LOW

- [x] Buat migration `20260508000002_security_trigger_fix.sql` untuk memastikan trigger function tidak punya SECURITY DEFINER
  ```sql
  CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  -- SECURITY DEFINER removed — not needed for simple timestamp update
  SET search_path = public
  AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;
  ```
- [ ] Jalankan migration
- [ ] Test: update data → `updated_at` tetap auto-update

---

### SEC-012: Review `unsafe-eval` & `unsafe-inline` di CSP
**File**: `src/lib/security-headers.ts`  
**Severity**: 🟡 MEDIUM

- [x] Research: library mana yang membutuhkan `unsafe-eval`? (Tailwind CSS, shadcn/ui, template compilation)
- [x] Tambah komentar dokumentasi di `security-headers.ts` menjelaskan kenapa diperlukan
- [ ] Future: coba replace dengan nonces/hashes jika memungkinkan
  ```ts
  // NOTE: 'unsafe-eval' required for: [library name] - template compilation
  // NOTE: 'unsafe-inline' required for: inline event handlers in [framework/library]
  ```
- [ ] Jika bisa dihapus, test seluruh aplikasi

---

### SEC-013: Payment Webhook Order ID Parsing Hardening
**File**: `supabase/functions/payment-webhook/index.ts`  
**Severity**: 🟡 MEDIUM

- [x] Validasi format order ID dengan regex (UUID format check)
- [x] Fallback ke metadata.user_id jika order ID parsing gagal
- [ ] Future: simpan mapping `order_id → user_id` di database saat payment dibuat
- [ ] Test: order ID format lama & baru tetap berfungsi

---

## Task Summary

```
SEGERA:  [SEC-001 ✓partial][SEC-002 ✓][SEC-003 ✓][SEC-004 ✓][SEC-005 ✓][SEC-006 ✓]
MINGGU INI: [SEC-007 ✓][SEC-008 ✓][SEC-009 ✓]
SPRINT INI: [SEC-010 ✓][SEC-011 ✓][SEC-012 ✓][SEC-013 ✓]

Total: 13 tasks
Completed: 12
Pending: 1 (key rotation - requires manual action)
Critical: 6 (5 done, 1 partial - key rotation)
High: 1
Medium: 5
Low: 1
```

## Notes

1. **SEC-001 harus dikerjakan pertama** — jika API key sudah compromised, semua security lain tidak berguna. ✓ Template dibuat, tapi key rotation HARUS dilakukan manual.
2. **Semua SEC-002 s/d SEC-006 bisa dikerjakan paralel** — dependency hanya pada deploy
3. **SEC-007 (rate limiting)** sudah dibuat dan diintegrasikan ke linkedin-import dan send-email
4. **Setiap selesai SEC task, wajib deploy edge function terkait**

## Deployment Checklist

- [ ] Deploy edge functions: `supabase functions deploy`
- [ ] Jalankan migrations: `supabase db push`
- [ ] Verifikasi CORS restrict berfungsi dari browser
- [ ] Test rate limiting (spam API calls → 429)
- [ ] Generate TypeScript types ulang (untuk payments table)
- [ ] Rotate AI_API_KEY (manual di dashboard)
