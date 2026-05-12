# 🔒 Security Audit Report - CV Sukses Nusantara
**Project:** cv-sukses-nusantara  
**Date:** 2026-05-12  
**Auditor:** Security Expert (20+ years experience)  
**Classification:** INTERNAL - CONFIDENTIAL

---

## 📋 Executive Summary

Project ini adalah aplikasi CV builder berbasis TypeScript/React menggunakan TanStack Start, Supabase, dan Cloudflare Workers. Secara keseluruhan, **security posture cukup baik** dengan beberapa area yang memerlukan perbaikan segera dan beberapa best practice yang sudah diimplementasi dengan baik.

### Overall Risk Rating: **MEDIUM** 🟡

---

## ✅ Strengths (Yang Sudah Baik)

1. **Security Headers Implementation** ✅
   - CSP directives yang comprehensive
   - X-Frame-Options, X-Content-Type-Options, HSTS configured
   - Referrer-Policy dan Permissions-Policy configured

2. **Authentication** ✅
   - hCaptcha integration untuk register/login
   - Rate limiting pada login attempts (5 attempts per 15 menit)
   - Account lockout mechanism (30 menit)
   - Session-based storage untuk attempt tracking

3. **Payment Security** ✅
   - Midtrans signature verification
   - Idempotent payment processing
   - Order ID format validation (UUID regex)
   - Service role key protection di webhook

4. **Row Level Security (RLS)** ✅
   - RLS enabled pada tabel critical (payments, user_subscriptions)
   - Documented security gaps untuk subscription management
   - Admin-only access untuk payment webhooks

5. **Input Validation** ✅
   - Zod schema validation pada forms
   - Password strength requirements (min 8 chars, uppercase, lowercase, number)
   - Email format validation

6. **Rate Limiting** ✅
   - AI endpoints: 30 req/min
   - PDF generation: 20 req/min
   - LinkedIn import: 10 req/hour
   - Email sending: 10 req/hour

---

## 🔴 Critical Issues (Perbaikan Segera)

### 1. **Supabase Publishable Key Exposed in .env** 
**Severity:** CRITICAL 🔴  
**File:** `.env`

```env
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Impact:**
- Publishable key bisa digunakan untuk akses data public
- Jika digabungkan dengan RLS bypass, bisa akses data pengguna

**Recommendation:**
```bash
# Hapus publishable key dari .env file
# Publishable key HARUS dimulai dengan VITE_ prefix untuk client-side
# Pastikan .env tidak di-commit ke git
```

**Fix Task:** `TASK-001`

---

### 2. **Account Takeover via Referral Code Parameter**
**Severity:** HIGH 🔴  
**File:** `src/routes/register.tsx` (line ~105-110)

```typescript
// Track referral from URL param
const refCode = new URLSearchParams(window.location.search).get("ref");
if (refCode && data?.user?.id) {
  try {
    await (supabase as any).rpc("track_referral_signup", {
      p_code: refCode,
      p_user_id: data.user.id,
    });
  } catch {}
}
```

**Impact:**
- Referral code tidak divalidasi proper
- Bisa digunakan untuk CSRF attack
- Tidak ada token validation

**Recommendation:**
- Validate referral code format (alphanumeric, length check)
- Add rate limiting untuk referral tracking
- Consider using signed tokens for referral

**Fix Task:** `TASK-002`

---

### 3. **Payment Webhook - User ID Extraction Vulnerability**
**Severity:** HIGH 🔴  
**File:** `supabase/functions/payment-webhook/index.ts`

```typescript
// Fallback: try to extract from order_id metadata in payment record
const metadataUserId = (payload as any).metadata?.user_id;
if (metadataUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metadataUserId)) {
  userId = metadataUserId;
```

**Impact:**
- Attacker bisa inject arbitrary user_id via metadata
- Privilege escalation dari payment webhook

**Recommendation:**
- REMOVE metadata fallback untuk user_id extraction
- User ID HARUS berasal dari database lookup berdasarkan order_id
- Add database transaction untuk atomic operations

**Fix Task:** `TASK-003`

---

### 4. **CSP Bypasses - unsafe-inline & unsafe-eval**
**Severity:** MEDIUM 🟡  
**File:** `src/lib/security-headers.ts`

```typescript
const CSP_DIRECTIVES = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' ...",
  // ... other directives
];
```

**Impact:**
- XSS attacks lebih mudah dilakukan jika ada input sanitization bypass
- Dynamic code execution dimungkinkan

**Recommendation:**
1. **unsafe-inline untuk styles:** Gunakan nonce atau hash untuk inline styles
2. **unsafe-eval:** Identifikasi kode yang butuh eval, refactor jika memungkinkan
3. Audit library dependencies untuk eval usage
4. Consider using CSS-in-JS atau Tailwind CSS dengan proper configuration

**Fix Task:** `TASK-004`

---

### 5. **Admin Role Caching - Privilege Escalation Risk**
**Severity:** MEDIUM 🟡  
**File:** `src/lib/admin.ts`

```typescript
let cachedAdminStatus: { userId: string; isAdmin: boolean } | null = null;

export async function isAdmin(userId: string): Promise<boolean> {
  if (cachedAdminStatus?.userId === userId) {
    return cachedAdminStatus.isAdmin;
  }
  // ... fetch from database
  cachedAdminStatus = { userId, isAdmin: result };
  return result;
}
```

**Impact:**
- Admin status di-cache indefinitely
- Role revocation tidak langsung efektif
- Jika admin role dicabut, user masih punya akses sampai cache expire

**Recommendation:**
- Add TTL untuk admin cache (max 5 minutes)
- Clear cache on role change
- Add cache invalidation mechanism

**Fix Task:** `TASK-005`

---

## 🟡 Medium Issues (Perbaikan Prioritas)

### 6. **No Rate Limit on User Data Fetching**
**Severity:** MEDIUM 🟡  
**File:** `src/routes/_authenticated/admin/users.tsx`

```typescript
const { data: profiles } = await supabase.from("profiles").select("id, full_name, created_at");
// ... fetch all users without pagination
```

**Impact:**
- Information disclosure
- Performance degradation dengan banyak user
- No DoS protection

**Recommendation:**
- Add pagination (limit/offset)
- Add server-side rate limiting
- Implement cursor-based pagination untuk scalability

**Fix Task:** `TASK-006`

---

### 7. **Missing Rate Limit Response Headers**
**Severity:** LOW 🟡  
**File:** `supabase/functions/_shared/rate-limit.ts`

**Impact:**
- Client tidak tahu kapan rate limit reset
- Tidak ada visibility untuk rate limit status

**Recommendation:**
```typescript
export function checkRateLimitWithHeaders(key: string, maxRequests: number, windowMs: number) {
  // ... existing logic
  return {
    allowed: boolean,
    headers: {
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': resetAt,
    }
  };
}
```

**Fix Task:** `TASK-007`

---

### 8. **CORS Wildcard on API Routes**
**Severity:** LOW 🟡  
**File:** `src/routes/api/ai-cv-review.tsx`

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // ...
};
```

**Impact:**
- API bisa diakses dari domain manapun
- Tidak sesuai best practice untuk authenticated endpoints

**Recommendation:**
- Use specific origin whitelist untuk production
- Consider Vary: Origin header

**Fix Task:** `TASK-008`

---

### 9. **Missing Input Sanitization for CV Data**
**Severity:** MEDIUM 🟡  
**Files:** 
- `src/lib/cv-text-extractor.ts`
- `src/routes/_authenticated/cv.$id.tsx`

**Impact:**
- Stored XSS melalui CV content
- Malicious content dalam CV bisa affect pengguna lain

**Recommendation:**
- Sanitize all CV content before rendering
- Use DOMPurify atau similar library
- Implement CSP to mitigate impact

**Fix Task:** `TASK-009`

---

### 10. **No SQL Injection Protection for RPC Calls**
**Severity:** MEDIUM 🟡  
**File:** `src/lib/admin.ts`

```typescript
const { data } = await supabase.rpc("has_role", {
  _user_id: userId,
  _role: "admin",
});
```

**Impact:**
- RPC calls tidak memiliki parameterized query protection
- Potentially vulnerable jika underlying SQL tidak secure

**Recommendation:**
- Review all RPC functions untuk SQL injection
- Use parameterized queries in PostgreSQL functions
- Add logging untuk RPC calls

**Fix Task:** `TASK-010`

---

## 🔵 Low Priority / Informational

### 11. **Error Messages Information Disclosure**
**Files:** Multiple

Generic error messages sudah digunakan dengan baik (login page), tapi perlu audit menyeluruh untuk memastikan tidak ada stack traces atau database errors yang ter expose.

**Recommendation:**
- Ensure all error handlers catch and log details server-side
- Return generic messages to client
- Implement proper error tracking (Sentry, etc.)

**Fix Task:** `TASK-011`

---

### 12. **Missing Security.txt**
**Severity:** LOW  
**Impact:** No designated way for security researchers to report vulnerabilities

**Recommendation:**
- Create `/.well-known/security.txt`
- Include contact information and PGP key

**Fix Task:** `TASK-012`

---

### 13. **No Subresource Integrity (SRI)**
**Severity:** LOW  
**Files:** External scripts (hCaptcha, Midtrans)

**Recommendation:**
- Add SRI hashes untuk all external scripts
- Ensure CDN resources tidak dimodifikasi

**Fix Task:** `TASK-013`

---

## 📊 Vulnerability Summary Table

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| CRIT-001 | Supabase Key Exposure | 🔴 CRITICAL | OPEN |
| HIGH-001 | Referral Code Injection | 🔴 HIGH | OPEN |
| HIGH-002 | Payment Webhook User ID Bypass | 🔴 HIGH | OPEN |
| MED-001 | CSP Unsafe Directives | 🟡 MEDIUM | OPEN |
| MED-002 | Admin Cache Indefinite TTL | 🟡 MEDIUM | OPEN |
| MED-003 | No Pagination on Admin Users | 🟡 MEDIUM | OPEN |
| MED-004 | CV Data XSS Risk | 🟡 MEDIUM | OPEN |
| MED-005 | RPC SQL Injection Risk | 🟡 MEDIUM | OPEN |
| LOW-001 | Rate Limit Headers Missing | 🟢 LOW | OPEN |
| LOW-002 | CORS Wildcard | 🟢 LOW | OPEN |
| LOW-003 | Error Message Disclosure | 🟢 LOW | OPEN |
| INFO-001 | Security.txt Missing | ℹ️ INFO | OPEN |
| INFO-002 | SRI Not Implemented | ℹ️ INFO | OPEN |

---

## 🛠️ Security Fix Tasks

### TASK-001: Remove Publishable Keys from .env
```
Priority: CRITICAL
Files: .env, .env.example
Action:
1. Remove SUPABASE_PUBLISHABLE_KEY from .env (non-VITE_ prefixed)
2. Only keep VITE_ prefixed keys for client-side
3. Update .gitignore to ensure .env never committed
4. Document that service role keys must never be in .env
```

### TASK-002: Secure Referral Code Handling
```
Priority: HIGH
Files: src/routes/register.tsx
Action:
1. Add referral code validation (format, length, existence)
2. Add CSRF protection for referral tracking
3. Add rate limiting on referral RPC calls
4. Log referral attempts for security monitoring
```

### TASK-003: Fix Payment Webhook User ID Extraction
```
Priority: HIGH
Files: supabase/functions/payment-webhook/index.ts
Action:
1. REMOVE metadata fallback for user_id
2. User ID HARUS dari database lookup:
   - First: Extract order_id from payload
   - Second: Query payments table by order_id
   - Third: Get user_id from payment record
3. Wrap in transaction for atomicity
4. Add audit logging
```

### TASK-004: Improve CSP Configuration
```
Priority: MEDIUM
Files: src/lib/security-headers.ts
Action:
1. Remove 'unsafe-eval' if possible (audit dependencies first)
2. Replace 'unsafe-inline' with nonce-based approach
3. Test all functionality after changes
4. Consider TailwindCSS upgrade for better CSP compliance
```

### TASK-005: Add TTL to Admin Cache
```
Priority: MEDIUM
Files: src/lib/admin.ts
Action:
1. Add 5-minute TTL for cached admin status
2. Add cache invalidation function
3. Call invalidation on role changes
4. Add logging for cache hits/misses
```

### TASK-006: Add Pagination to Admin Users List
```
Priority: MEDIUM
Files: src/routes/_authenticated/admin/users.tsx
Action:
1. Add pagination (limit 50, offset 0)
2. Add page navigation UI
3. Add total count query
4. Add server-side rate limiting
```

### TASK-007: Implement Rate Limit Headers
```
Priority: LOW
Files: supabase/functions/_shared/rate-limit.ts
Action:
1. Add response headers (X-RateLimit-Limit, etc.)
2. Update all edge functions to use new headers
3. Document rate limit configuration
```

### TASK-008: Restrict CORS Origins
```
Priority: LOW
Files: src/routes/api/*.tsx, supabase/functions/_shared/cors.ts
Action:
1. Whitelist specific origins
2. Use environment variable for allowed origins
3. Add Vary: Origin header
```

### TASK-009: Sanitize CV Data
```
Priority: MEDIUM
Files: src/lib/cv-text-extractor.ts, template files
Action:
1. Add DOMPurify for HTML sanitization
2. Sanitize all user-generated CV content
3. Add CSP to mitigate XSS impact
4. Test with common XSS payloads
```

### TASK-010: Secure RPC Functions
```
Priority: MEDIUM
Files: supabase/functions/*/index.ts, supabase migrations
Action:
1. Audit all RPC function SQL
2. Ensure parameterized queries used
3. Add input validation in RPC functions
4. Add audit logging
```

### TASK-011: Error Handling Audit
```
Priority: LOW
Files: Multiple
Action:
1. Audit all error handlers
2. Ensure no stack traces to client
3. Implement centralized error logging
4. Consider Sentry integration
```

### TASK-012: Add Security.txt
```
Priority: LOW
Files: public/.well-known/security.txt
Action:
1. Create security.txt file
2. Include contact info and PGP key
3. Add to robots.txt
```

### TASK-013: Implement Subresource Integrity
```
Priority: LOW
Files: All external script includes
Action:
1. Add SRI hashes for hCaptcha
2. Add SRI hashes for Midtrans
3. Document SRI update process
```

---

## 📅 Recommended Security Review Schedule

| Frequency | Activity |
|-----------|----------|
| Daily | Monitor error logs for suspicious activity |
| Weekly | Review failed login attempts |
| Monthly | Review Supabase usage logs |
| Quarterly | Full security audit |
| On-demand | After major updates or breaches |

---

## 🔗 References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)
- [CSP Level 3 Specification](https://www.w3.org/TR/CSP3/)
- [Payment Card Industry Data Security Standard (PCI DSS)](https://www.pcisecuritystandards.org/)

---

**Report Generated:** 2026-05-12  
**Next Review:** 2026-06-12  
**Document Version:** 1.0
