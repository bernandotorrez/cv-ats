# 🔧 Security Fix Tasks - CV Sukses Nusantara

## 📋 Task Overview

| Priority    | Tasks   | Estimated Time |
| ----------- | ------- | -------------- |
| 🔴 CRITICAL | 1 task  | 30 minutes     |
| 🔴 HIGH     | 2 tasks | 2-3 hours      |
| 🟡 MEDIUM   | 5 tasks | 4-6 hours      |
| 🟢 LOW      | 5 tasks | 3-4 hours      |

---

## 🔴 CRITICAL PRIORITY

### TASK-001: Remove Publishable Keys from .env

**Priority:** CRITICAL  
**Estimated Time:** 30 minutes

#### Current State

File `.env` mengandung:

```env
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # ❌ WRONG
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."  # ✅ OK - ini untuk client
```

#### Problem

- Publishable key tanpa prefix `VITE_` bisa exposure ke server-side
- Key sudah commit ke repository

#### Steps to Fix

```bash
# 1. Rotate semua Supabase keys sekarang juga!
# Login ke Supabase Dashboard → Project Settings → API

# 2. Update .env file
# Hapus baris ini:
# SUPABASE_PUBLISHABLE_KEY="eyJ..."  ← DELETE THIS

# 3. Pastikan .env.example hanya punya template
# Hanya VITE_ prefixed keys untuk client-side
```

#### New .env file structure

```env
# Client-side (OK to expose)
VITE_SUPABASE_URL="https://nfdrkuvyowaydjkhfvrr.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_PROJECT_ID="nfdrkuvyowaydjkhfvrr"
VITE_HCAPTCHA_SITE_KEY="0ddc116e-..."

# Server-side ONLY (via Supabase Secrets, NOT .env)
# SUPABASE_SERVICE_ROLE_KEY="..."  ← NEVER IN .env!
# AI_API_KEY="..."  ← NEVER IN .env!
# RESEND_API_KEY="..."  ← NEVER IN .env!
# MIDTRANS_SERVER_KEY="..."  ← NEVER IN .env!
```

#### Verification

```bash
# Check .git history untuk key exposure
git log --all --full-history --source --remotes -- .env

# Jika ada, gunakan BFG Repo-Cleaner:
# java -jar bfg.jar --replace-text private.txt --no-blob-protection --repo-width 1000 your-repo.git
```

---

## 🔴 HIGH PRIORITY

### TASK-002: Secure Referral Code Handling

**Priority:** HIGH  
**Estimated Time:** 1.5 hours

#### Current Code (src/routes/register.tsx)

```typescript
// ❌ VULNERABLE - tidak ada validasi
const refCode = new URLSearchParams(window.location.search).get("ref");
if (refCode && data?.user?.id) {
  await (supabase as any).rpc("track_referral_signup", {
    p_code: refCode, // ← bisa inject apapun!
    p_user_id: data.user.id,
  });
}
```

#### Fixed Code

```typescript
import { z } from "zod";

// ✅ Validasi referral code format
const REFERRAL_CODE_REGEX = /^[a-zA-Z0-9_-]{6,20}$/;

const referralSchema = z
  .string()
  .regex(REFERRAL_CODE_REGEX, "Invalid referral code format")
  .max(20);

const handleSubmit = async (e: FormEvent) => {
  // ... existing code ...

  // ✅ Validasi referral code dengan aman
  const refCodeParam = new URLSearchParams(window.location.search).get("ref");
  if (refCodeParam) {
    const validation = referralSchema.safeParse(refCodeParam);
    if (validation.success && data?.user?.id) {
      try {
        // ✅ Rate limited & validated
        await trackReferralWithRateLimit(validation.data, data.user.id);
      } catch (err) {
        // Log tapi jangan fail registration
        console.error("Referral tracking failed:", err);
      }
    }
  }

  // ... rest of code ...
};

// ✅ Rate-limited referral tracking
async function trackReferralWithRateLimit(code: string, userId: string) {
  // Check rate limit first
  const { data: rateLimit } = await supabase
    .from("referral_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 3600000).toISOString());

  if ((rateLimit?.length || 0) >= 5) {
    throw new Error("Rate limit exceeded");
  }

  // Track with validation
  const { error } = await supabase.rpc("track_referral_signup", {
    p_code: code,
    p_user_id: userId,
  });

  if (!error) {
    // Increment rate limit counter
    await supabase.from("referral_rate_limits").insert({
      user_id: userId,
    });
  }
}
```

#### Additional Database Changes (Supabase)

```sql
-- Add rate limiting table
CREATE TABLE referral_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_referral_rate_limits_user_created
ON referral_rate_limits(user_id, created_at DESC);

-- Secure the RPC function
CREATE OR REPLACE FUNCTION track_referral_signup(
  p_code TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- Run as table owner
AS $$
BEGIN
  -- Validate code format
  IF NOT (p_code ~ '^[a-zA-Z0-9_-]{6,20}$') THEN
    RAISE EXCEPTION 'Invalid referral code format';
  END IF;

  -- Validate user_id format
  IF NOT (p_user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
    RAISE EXCEPTION 'Invalid user ID';
  END IF;

  -- Check if code exists and is valid
  IF NOT EXISTS (
    SELECT 1 FROM referral_codes
    WHERE code = p_code
    AND used = false
    AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'Invalid or expired referral code';
  END IF;

  -- Perform the tracking
  INSERT INTO referral_signups (referrer_id, referred_id, code)
  VALUES (
    (SELECT user_id FROM referral_codes WHERE code = p_code),
    p_user_id,
    p_code
  )
  ON CONFLICT DO NOTHING;

  -- Mark code as used
  UPDATE referral_codes SET used = true WHERE code = p_code;
END;
$$;
```

---

### TASK-003: Fix Payment Webhook User ID Extraction

**Priority:** HIGH  
**Estimated Time:** 1-2 hours

#### Current Vulnerable Code

```typescript
// ❌ VULNERABLE - metadata bisa inject arbitrary user_id
const orderIdMatch = orderId.match(/^cvkarir-([0-9a-f]{8}-...)$/i);
if (orderIdMatch && orderIdMatch[1]) {
  userId = orderIdMatch[1];
} else {
  // ❌ REMOVE THIS FALLBACK
  const metadataUserId = (payload as any).metadata?.user_id;
  if (metadataUserId && /^[0-9a-f]{8}-...$/i.test(metadataUserId)) {
    userId = metadataUserId; // ← ATTACKER CAN CONTROL THIS!
  }
}
```

#### Fixed Code

```typescript
Deno.serve(async (req: Request) => {
  // ... existing validation code ...

  const orderId = payload.order_id;

  // ✅ SECURE: User ID HARUS dari database, bukan payload
  // First, verify the order exists and get associated user_id
  const { data: paymentRecord, error: paymentError } = await admin
    .from("payments")
    .select("id, user_id, status, gateway_order_id")
    .eq("gateway_order_id", orderId)
    .single();

  if (paymentError || !paymentRecord) {
    // Order doesn't exist - might be a new order
    // Validate order_id format strictly
    const uuidMatch = orderId.match(
      /^cvkarir-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d+)$/i,
    );

    if (!uuidMatch) {
      console.error("Invalid order_id format:", orderId);
      return new Response(JSON.stringify({ error: "Invalid order_id format" }), {
        status: 400,
        headers: corsHeaders(req),
      });
    }

    // Extract user_id from validated UUID portion only
    const userIdFromOrder = uuidMatch[1]; // UUID part only

    // ✅ Validate UUID is properly formatted
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdFromOrder)) {
      return new Response(JSON.stringify({ error: "Invalid user ID in order" }), {
        status: 400,
        headers: corsHeaders(req),
      });
    }

    userId = userIdFromOrder;

    // Verify user exists
    const { data: user } = await admin.from("profiles").select("id").eq("id", userId).single();

    if (!user) {
      console.error("User not found for order:", orderId);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: corsHeaders(req),
      });
    }
  } else {
    // Existing payment record - use stored user_id
    userId = paymentRecord.user_id;

    // ✅ Double-check order_id ownership
    if (paymentRecord.gateway_order_id !== orderId) {
      console.error("Order ID mismatch!");
      return new Response(JSON.stringify({ error: "Order ID mismatch" }), {
        status: 400,
        headers: corsHeaders(req),
      });
    }
  }

  // ... rest of processing with verified userId ...
});
```

#### Database: Create payments lookup table

```sql
-- Add gateway_order_id index if not exists
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id
ON public.payments(gateway_order_id);

-- Add unique constraint
ALTER TABLE public.payments
ADD CONSTRAINT unique_gateway_order_id
UNIQUE (gateway_order_id);
```

---

## 🟡 MEDIUM PRIORITY

### TASK-004: Improve CSP Configuration

**Priority:** MEDIUM  
**Estimated Time:** 2-3 hours

#### Current CSP (src/lib/security-headers.ts)

```typescript
const CSP_DIRECTIVES = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' ...",
  "style-src 'self' 'unsafe-inline' ...",
];
```

#### Improved CSP with Nonce

```typescript
import { randomBytes } from "crypto";

// Generate nonce for each request
function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

export function createCSPWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://app.midtrans.com https://api.midtrans.com https://js.hcaptcha.com https://*.hcaptcha.com https://va.vercel-scripts.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://*.hcaptcha.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.hcaptcha.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ai.sumopod.com https://app.midtrans.com https://*.hcaptcha.com",
    "frame-src https://app.midtrans.com https://*.hcaptcha.com https://newassets.hcaptcha.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const nonce = generateNonce();

  // Apply CSP with nonce
  if (!headers.has("Content-Security-Policy")) {
    headers.set("Content-Security-Policy", createCSPWithNonce(nonce));
  }

  // Store nonce for use in rendered HTML
  // This is typically done by passing nonce to the rendering context
  headers.set("X-Nonce", nonce);

  // ... rest of headers ...

  return new Response(response.body, { headers });
}
```

#### Update React to use nonce

```typescript
// src/router.tsx or root component
function App() {
  // Get nonce from headers (Cloudflare Workers / Vercel Edge)
  const nonce = headers?.get("X-Nonce") || "";

  return (
    <script nonce={nonce}>
      {`window.__CSP_NONCE__ = "${nonce}";`}
    </script>
  );
}
```

---

### TASK-005: Add TTL to Admin Cache

**Priority:** MEDIUM  
**Estimated Time:** 1 hour

#### Current Code (src/lib/admin.ts)

```typescript
// ❌ VULNERABLE - cached forever
let cachedAdminStatus: { userId: string; isAdmin: boolean } | null = null;

export async function isAdmin(userId: string): Promise<boolean> {
  if (cachedAdminStatus?.userId === userId) {
    return cachedAdminStatus.isAdmin;
  }
  // ... fetch ...
}
```

#### Fixed Code

```typescript
interface CachedAdminStatus {
  userId: string;
  isAdmin: boolean;
  cachedAt: number;
}

const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedAdminStatus: CachedAdminStatus | null = null;

export async function isAdmin(userId: string): Promise<boolean> {
  const now = Date.now();

  // Check cache with TTL
  if (
    cachedAdminStatus?.userId === userId &&
    now - cachedAdminStatus.cachedAt < ADMIN_CACHE_TTL_MS
  ) {
    return cachedAdminStatus.isAdmin;
  }

  // Fetch fresh from database
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  const result = !!data;

  // Update cache
  cachedAdminStatus = {
    userId,
    isAdmin: result,
    cachedAt: now,
  };

  return result;
}

// ✅ Invalidate cache on role changes
export function clearAdminCache(): void {
  cachedAdminStatus = null;
}

// ✅ Invalidate specific user
export function invalidateAdminCache(userId: string): void {
  if (cachedAdminStatus?.userId === userId) {
    cachedAdminStatus = null;
  }
}

// ✅ Call this after role changes in admin panel
// In users.tsx:
const handleSaveEdit = async () => {
  // ... existing role update code ...

  // Invalidate cache
  invalidateAdminCache(editUser.id);

  // ... rest of code ...
};
```

---

### TASK-006: Add Pagination to Admin Users

**Priority:** MEDIUM  
**Estimated Time:** 1-2 hours

#### Fixed Admin Users Component

```typescript
// src/routes/_authenticated/admin/users.tsx

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 50,  // ✅ Reasonable default
    total: 0,
  });

  // ... existing state ...

  const loadUsers = async () => {
    setLoading(true);

    const offset = (pagination.page - 1) * pagination.pageSize;

    // ✅ Paginated query with count
    const { data: profiles, count } = await supabase
      .from("profiles")
      .select("id, full_name, created_at", { count: "exact" })
      .range(offset, offset + pagination.pageSize - 1)
      .order("created_at", { ascending: false });

    // ✅ Update total count
    setPagination(prev => ({ ...prev, total: count || 0 }));

    // ... rest of aggregation logic ...
  };

  // ✅ Pagination handlers
  const goToPage = (page: number) => {
    const maxPage = Math.ceil(pagination.total / pagination.pageSize);
    if (page >= 1 && page <= maxPage) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="space-y-6">
      {/* ... existing UI ... */}

      {/* ✅ Pagination Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} dari {pagination.total}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>

          <span className="text-sm">
            Halaman {pagination.page} dari {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### TASK-007: Implement Rate Limit Headers

**Priority:** LOW  
**Estimated Time:** 1 hour

```typescript
// supabase/functions/_shared/rate-limit.ts

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  headers: Record<string, string>;
}

export function checkRateLimitWithHeaders(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  let allowed: boolean;
  let count: number;

  if (!bucket || now > bucket.resetAt) {
    allowed = true;
    count = 1;
    buckets.set(key, { count, resetAt: now + windowMs });
  } else if (bucket.count >= maxRequests) {
    allowed = false;
    count = bucket.count;
  } else {
    allowed = true;
    count = ++bucket.count;
  }

  const remaining = Math.max(0, maxRequests - count);
  const resetAt = bucket?.resetAt || now + windowMs;

  return {
    allowed,
    remaining,
    limit: maxRequests,
    resetAt,
    headers: {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
      "Retry-After": allowed ? "" : String(Math.ceil((resetAt - now) / 1000)),
    },
  };
}
```

---

### TASK-008: Restrict CORS Origins

**Priority:** LOW  
**Estimated Time:** 1 hour

```typescript
// supabase/functions/_shared/cors.ts

const ALLOWED_ORIGINS = [
  "https://cvpintar.web.id",
  "https://www.cvpintar.web.id",
  // Add other production domains
];

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");

  // Validate origin
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin", // Important for caching
  };
}
```

---

### TASK-009: Sanitize CV Data

**Priority:** MEDIUM  
**Estimated Time:** 1-2 hours

```bash
# Install DOMPurify
npm install isomorphic-dompurify
```

```typescript
// src/lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user-generated content to prevent XSS
 */
export function sanitizeCVContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize but allow some formatting (for rich text CVs)
 */
export function sanitizeCVRichText(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

// Use in CV rendering:
import { sanitizeCVContent } from "@/lib/sanitize";

// In template components:
<span dangerouslySetInnerHTML={{
  __html: sanitizeCVRichText(cvData.summary)
}} />
```

---

### TASK-010: Secure RPC Functions

**Priority:** MEDIUM  
**Estimated Time:** 2-3 hours

Review and secure all RPC functions in Supabase:

```sql
-- Example: Secure has_role function
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  -- Validate inputs
  IF _user_id IS NULL OR _role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT (_user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
    RETURN FALSE;
  END IF;

  IF NOT (_role ~ '^[a-z_]+$') THEN
    RETURN FALSE;
  END IF;

  -- Check role
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role = _role
  ) INTO has_role;

  RETURN COALESCE(has_role, FALSE);
END;
$$;
```

---

## 🟢 LOW PRIORITY

### TASK-011: Error Handling Audit

**Priority:** LOW  
**Estimated Time:** 2 hours

- Review all error handlers
- Ensure no stack traces exposed
- Implement centralized error logging
- Consider Sentry integration

### TASK-012: Add Security.txt

**Priority:** LOW  
**Estimated Time:** 30 minutes

Create `public/.well-known/security.txt`:

```
Contact: https://cvpintar.web.id/kontak
Expires: 2027-01-01T00:00:00.000Z
Encryption: https://cvpintar.web.id/pgp-key.txt
Preferred-Languages: en, id
Policy: https://cvpintar.web.id/security-policy
```

### TASK-013: Implement SRI

**Priority:** LOW  
**Estimated Time:** 1 hour

```html
<!-- Example for hCaptcha -->
<script
  src="https://js.hcaptcha.com/1/api.js"
  async
  defer
  integrity="sha256-/example-hash-here"
  crossorigin="anonymous"
></script>
```

---

## 📋 Testing Checklist

After implementing fixes, verify:

- [ ] TASK-001: Keys rotated, .env clean
- [ ] TASK-002: Referral code injection blocked
- [ ] TASK-003: Payment webhook only accepts verified user_id
- [ ] TASK-004: CSP nonce working, no XSS bypass
- [ ] TASK-005: Admin cache expires correctly
- [ ] TASK-006: Pagination working on admin users
- [ ] TASK-007: Rate limit headers present
- [ ] TASK-008: CORS restricted to allowed origins
- [ ] TASK-009: XSS sanitization working
- [ ] TASK-010: RPC functions validated
- [ ] TASK-011: Error messages generic
- [ ] TASK-012: Security.txt accessible
- [ ] TASK-013: SRI hashes applied

---

## 🚨 Emergency Response

If a breach occurs:

1. **Immediately rotate ALL secrets:**
   - Supabase keys
   - AI API keys
   - Payment gateway keys
   - Email API keys

2. **Check for exposure:**
   - Git history
   - Server logs
   - Database access logs

3. **Notify affected users** per GDPR/PDP GDPR compliance

4. **Document the incident** in security-incidents.md

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-12  
**Next Review:** After all tasks completed
