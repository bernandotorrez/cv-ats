# Security Audit Report — CV Pintar

> **Auditor**: AI Security Expert  
> **Tanggal**: 2026-05-08  
> **Scope**: Edge Functions, Frontend, Database, Infrastructure  
> **Severity**: 🔴 Critical | 🟡 Medium | 🟢 Low

---

## 1. Edge Functions (10 Functions Audited)

### 🔴 1.1 CORS Wildcard di Semua Edge Functions

**File**: `supabase/functions/_shared/cors.ts`

```ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // ← ANY domain
  ...
};
```

**Dampak**: Semua edge function merespon dengan `Access-Control-Allow-Origin: *`. Situs malicious manapun bisa membuat authenticated cross-origin request ke edge function jika user punya Supabase session token yang bocor (lewat XSS). Kombinasi dengan `Access-Control-Allow-Headers: authorization` memungkinkan credential-bearing requests dari origin manapun.

**Rekomendasi**: Restrict ke domain spesifik (`https://cvpintar.web.id` + dev domain).

---

### 🔴 1.2 `linkedin-import` Tidak Ada Otentikasi

**File**: `supabase/functions/linkedin-import/index.ts` (line 10-12)

```ts
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { input, mode } = await req.json();  // ← No getUserId()!
```

**Dampak**: Siapapun bisa memanggil fungsi ini tanpa auth token, mengkonsumsi AI credits, dan mengirim prompt arbitrer lewat AI gateway.

**Rekomendasi**: Tambah `const userId = await getUserId(req)`.

---

### 🔴 1.3 `send-email` Tidak Ada Otentikasi & Rate Limit

**File**: `supabase/functions/send-email/index.ts`

```ts
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { to, subject, html } = await req.json() as EmailPayload;
    // No auth! Siapapun bisa kirim email.
```

**Dampak**: Siapapun bisa mengirim email ke penerima manapun menggunakan akun Resend. Bisa merusak reputasi domain dan menimbulkan biaya email.

**Rekomendasi**: Tambah otentikasi + batasi `to` ke email user yang terotentikasi saja.

---

### 🔴 1.4 `payment-webhook` Referensi Tabel `payments` yang Tidak Ada

**File**: `supabase/functions/payment-webhook/index.ts`

Webhook mereferensi `public.payments` untuk idempotency check, tapi tidak ada migration yang membuat tabel ini. Webhook akan gagal di runtime:

```ts
const { data: existingPayment } = await (admin as any)
  .from("payments")
  .select("id, status")
  .eq("gateway_order_id", orderId)
  .single();
```

**Rekomendasi**: Buat tabel `payments` dengan migration + RLS.

---

### 🟡 1.5 `payment-webhook` Parsing Order ID Rapuh

**File**: `supabase/functions/payment-webhook/index.ts`

```ts
const orderParts = orderId.split("-");
const userId = orderParts.length >= 2 ? orderParts[1] : null;
```

Jika format order ID Midtrans berubah, ini akan meng-ekstrak `userId` yang salah, berpotensi mengaktifkan subscription untuk user yang salah.

**Rekomendasi**: Simpan mapping `order_id → user_id` di database saat payment dibuat, jangan encode di order ID.

---

### 🟡 1.6 AI Gateway Error Details Bocor ke Client

**File**: `supabase/functions/_shared/ai-common.ts` (line 99)

```ts
throw new Error(`AI Gateway error (${res.status}): ${errText.slice(0, 300)}`);
```

Truncate 300 karakter tapi tetap mengembalikan raw error text ke client, yang bisa membocorkan detail infrastruktur dan struktur API internal.

**Rekomendasi**: Log full error server-side, return generic `"AI service temporarily unavailable"` ke client.

---

### 🟡 1.7 Tidak Ada Per-Minute Rate Limiting

Semua edge function hanya punya monthly quota (`checkAndTrackQuota`) — tidak ada proteksi terhadap abuse burst (misal 1000 calls dalam 1 menit).

**Rekomendasi**: Tambah rate limiter (30 req/menit per user) untuk semua edge function, terutama `send-email`.

---

### 🟢 1.8 Positif: Otentikasi di AI Functions

Semua AI function (`ai-suggest`, `ai-score`, `ai-chat`, `ai-cover-letter`, `ai-keywords`, `generate-pdf`) memanggil `getUserId(req)` dengan benar.

### 🟢 1.9 Positif: Payment Webhook Signature Verification

Midtrans signature verification SHA-512 diimplementasikan dengan benar. Idempotency check mencegah double-processing.

---

## 2. Frontend Security

### 🔴 2.1 `AI_API_KEY` Tersimpan di `.env` File

**File**: `.env` (root)

```
AI_API_KEY="sk-7n1yRLsYTpv79wVZpXL_tQ"
```

**Dampak**: API key adalah secret yang tidak boleh di-commit ke source control. Jika file ini masuk git repo, key sudah compromised.

**Rekomendasi**:
- Rotate API key segera
- Pastikan `.env` di `.gitignore`
- Gunakan Vercel/Cloudflare env variables untuk deployment

---

### 🔴 2.2 CSP Headers Bertabrakan (Conflict)

Ada **dua konfigurasi CSP yang bertentangan**:

| Sumber | `security-headers.ts` | `vercel.json` |
|--------|----------------------|---------------|
| Midtrans scripts | ✅ `app.midtrans.com` | ❌ Tidak ada |
| AI Gateway | ✅ `ai.sumopod.com` | ❌ `ai.gateway.lovable.dev` |
| `unsafe-eval` | ✅ | ❌ |
| WebSocket Supabase | ❌ | ✅ `wss://*.supabase.co` |
| `frame-src` | ✅ | ❌ |

**Dampak**: Midtrans payment, AI calls, dan Supabase realtime akan gagal tergantung header mana yang dipakai.

**Rekomendasi**: Consolidate ke satu CSP — hapus dari `vercel.json` dan biarkan `server.ts` yang handle.

---

### 🟡 2.3 `'unsafe-eval'` dan `'unsafe-inline'` di CSP

Kedua CSP mengizinkan `'unsafe-eval'` dan `'unsafe-inline'` yang melemahkan proteksi XSS.

**Rekomendasi**: Investigasi apakah benar diperlukan. Jika tidak bisa dihindari, tambah komentar dokumentasi.

---

### 🟡 2.4 `supabaseAdmin` Tidak Ada Runtime Browser Guard

**File**: `src/integrations/supabase/client.server.ts`

Tidak ada runtime check untuk mencegah import di browser:

**Rekomendasi**: Tambah:
```ts
if (typeof window !== 'undefined') throw new Error('supabaseAdmin cannot be used in browser');
```

---

### 🟢 2.5 Positif: Security Headers Lengkap

- `X-Frame-Options: DENY` ✅
- `X-Content-Type-Options: nosniff` ✅
- `Referrer-Policy: strict-origin-when-cross-origin` ✅
- `Strict-Transport-Security: max-age=63072000; preload` ✅
- `Permissions-Policy: restrictive` ✅

### 🟢 2.6 Positif: Auth Implementation

- Supabase `onAuthStateChange` ✅
- `_authenticated.tsx` route guard ✅
- Server-side auth middleware ✅
- No service role key di client ✅

### 🟢 2.7 Positif: Login Rate Limiting

5 gagal dalam 15 menit → lockout 30 menit + generic error message ✅

### 🟢 2.8 Positif: Share Token PII Masking

Email, phone, LinkedIn dimasking saat CV di-share ✅

---

## 3. Database Security (RLS Policies)

### 🔴 3.1 Tabel `payments` Tidak Ada

`payment-webhook` edge function mereferensi `public.payments` tapi tidak ada migration.

**Rekomendasi**: Buat tabel dengan RLS policies.

---

### 🟡 3.2 Tidak Ada RLS INSERT/UPDATE di `user_subscriptions`

Hanya `SELECT` policy, tidak ada `INSERT`/`UPDATE`/`DELETE`. Ini disengaja (subscription hanya dikelola service role/edge function), tapi perlu dokumentasi eksplisit.

---

### 🟡 3.3 `update_updated_at_column()` Unnecessarily SECURITY DEFINER

Fungsi ini hanya set `NEW.updated_at = now()` — tidak perlu `SECURITY DEFINER`.

---

### 🟡 3.4 Tidak Ada Field-Level Encryption untuk PII

Data CV (email, phone, nama, alamat) disimpan sebagai plain JSONB. Jika database breach, semua PII terekspos.

**Rekomendasi**: Pertimbangkan `pgsodium` atau Supabase Vault untuk enkripsi field sensitif.

---

### 🟢 3.5 Positif: RLS Coverage Komprehensif

Semua 11 tabel punya RLS enabled. Policies scoped dengan benar.

### 🟢 3.6 Positif: Security Definer Functions Locked Down

`has_role()` dan `handle_new_user()` di-revoke dari anon/authenticated/public.

### 🟢 3.7 Positif: Share Token Cryptographically Strong

`gen_random_bytes(24)` — 192 bit entropy, URL-safe base64.

---

## 4. Summary — Semua Temuan

| # | Severity | Isu | File |
|---|----------|-----|------|
| 1 | 🔴 CRITICAL | CORS `*` wildcard di semua edge functions | `_shared/cors.ts` |
| 2 | 🔴 CRITICAL | `linkedin-import` tanpa otentikasi | `linkedin-import/index.ts` |
| 3 | 🔴 CRITICAL | `send-email` tanpa otentikasi | `send-email/index.ts` |
| 4 | 🔴 CRITICAL | `AI_API_KEY` di `.env` file | `.env` |
| 5 | 🔴 CRITICAL | CSP headers bertabrakan | `vercel.json` vs `security-headers.ts` |
| 6 | 🔴 CRITICAL | Tabel `payments` tidak ada | migration missing |
| 7 | 🟡 HIGH | Tidak ada per-minute rate limiting | semua edge functions |
| 8 | 🟡 HIGH | CSP pakai `unsafe-eval` + `unsafe-inline` | `vercel.json`, `security-headers.ts` |
| 9 | 🟡 MEDIUM | AI Gateway error bocor ke client | `_shared/ai-common.ts:99` |
| 10 | 🟡 MEDIUM | `supabaseAdmin` tanpa browser guard | `client.server.ts` |
| 11 | 🟡 MEDIUM | `user_subscriptions` tanpa RLS INSERT/UPDATE | migration phase7 |
| 12 | 🟡 LOW | `update_updated_at_column` pakai SECURITY DEFINER | migration #1 |

---

## 5. Prioritas Mitigasi

**SEGERA (hari ini)**:
1. Rotate `AI_API_KEY` & hapus dari `.env`
2. Fix CORS ke domain spesifik
3. Tambah otentikasi ke `linkedin-import` dan `send-email`

**MINGGU INI**:
4. Consolidate CSP headers
5. Buat tabel `payments` dengan RLS
6. Tambah per-minute rate limiting

**SPRINT INI**:
7. Sembunyikan AI Gateway error details
8. Tambah browser guard ke `supabaseAdmin`
9. Dokumentasikan RLS gap pada `user_subscriptions`
10. Hapus `SECURITY DEFINER` dari trigger function
