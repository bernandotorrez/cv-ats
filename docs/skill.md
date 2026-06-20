# SKILL.md — CVKarir.id: Technical Implementation Guide

> **Target AI Agent**: Minimax 2.7 / DeepSeek V4 Pro  
> **Deployment**: Vercel (Frontend) + Supabase (Backend)  
> **Tech Stack**: Next.js 14+ App Router · TypeScript · Tailwind CSS · Supabase

---

## CRITICAL READING INSTRUCTIONS FOR AI AGENT

Baca seluruh dokumen ini sebelum menulis satu baris kode pun. Dokumen ini adalah **source of truth** untuk implementasi. Jika ada ambiguitas, tanyakan sebelum mengasumsikan.

---

## 1. Tech Stack & Dependencies

### 1.1 Frontend

```json
{
  "framework": "Next.js 14+ (App Router)",
  "language": "TypeScript 5.x (strict mode)",
  "styling": "Tailwind CSS 3.x",
  "ui_components": "shadcn/ui (Radix UI primitives)",
  "state_management": "Zustand (client state) + React Query/TanStack Query (server state)",
  "forms": "React Hook Form + Zod (validation)",
  "pdf_generation": "react-pdf (@react-pdf/renderer) untuk PDF output",
  "rich_text": "Tiptap (CV section editing)",
  "drag_drop": "@dnd-kit/core (section reordering)",
  "animation": "Framer Motion",
  "icons": "Lucide React",
  "date": "date-fns (date formatting, locale Indonesia)",
  "http_client": "Built-in fetch (Next.js) + SWR/TanStack Query",
  "testing": "Vitest + Testing Library + Playwright (E2E)"
}
```

### 1.2 Backend (Supabase)

```json
{
  "database": "PostgreSQL 15+ via Supabase",
  "auth": "Supabase Auth (GoTrue)",
  "storage": "Supabase Storage (PDF/assets)",
  "realtime": "Supabase Realtime (optional - live score update)",
  "edge_functions": "Supabase Edge Functions (Deno runtime)",
  "migrations": "Supabase CLI migration system",
  "type_generation": "supabase gen types typescript"
}
```

### 1.3 AI Integration

```json
{
  "provider": "Anthropic Claude API (claude-sonnet-4-5-20241022 atau terbaru)",
  "sdk": "@anthropic-ai/sdk",
  "usage": "Via Supabase Edge Function (TIDAK di client side — API key aman)"
}
```

### 1.4 Payment

```json
{
  "gateway": "Midtrans (primary) atau Xendit (fallback)",
  "sdk": "midtrans-client (Node.js)",
  "webhook": "Supabase Edge Function untuk payment webhook"
}
```

### 1.5 Deployment & Infra

```json
{
  "frontend": "Vercel (Pro plan recommended untuk Edge Functions)",
  "backend": "Supabase Cloud (Pro plan)",
  "cdn": "Vercel Edge Network (otomatis)",
  "monitoring": "Vercel Analytics + Sentry (error tracking)",
  "email": "Resend.com atau SendGrid (transactional email)"
}
```

---

## 2. Project Structure

```
cvkarir/
├── apps/
│   └── web/                          # Next.js app
│       ├── app/                      # App Router
│       │   ├── (auth)/               # Route group: auth pages
│       │   │   ├── login/
│       │   │   │   └── page.tsx
│       │   │   ├── register/
│       │   │   │   └── page.tsx
│       │   │   ├── verify-email/
│       │   │   │   └── page.tsx
│       │   │   └── forgot-password/
│       │   │       └── page.tsx
│       │   ├── (dashboard)/          # Route group: authenticated pages
│       │   │   ├── dashboard/
│       │   │   │   └── page.tsx
│       │   │   ├── cv/
│       │   │   │   ├── new/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── [id]/
│       │   │   │   │   ├── page.tsx  # CV Editor
│       │   │   │   │   └── preview/
│       │   │   │   │       └── page.tsx
│       │   │   │   └── page.tsx      # CV List
│       │   │   ├── templates/
│       │   │   │   └── page.tsx
│       │   │   ├── subscription/
│       │   │   │   └── page.tsx
│       │   │   └── settings/
│       │   │       └── page.tsx
│       │   ├── (marketing)/          # Route group: public pages
│       │   │   ├── page.tsx          # Landing page
│       │   │   ├── pricing/
│       │   │   │   └── page.tsx
│       │   │   ├── templates/
│       │   │   │   └── page.tsx      # Public template showcase
│       │   │   ├── tips/
│       │   │   │   ├── page.tsx      # Tips listing
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx  # Tip article
│       │   │   ├── blog/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx
│       │   │   └── tentang/
│       │   │       └── page.tsx
│       │   ├── api/                  # Next.js API Routes
│       │   │   ├── webhooks/
│       │   │   │   └── midtrans/
│       │   │   │       └── route.ts
│       │   │   └── og/               # Dynamic OG images
│       │   │       └── route.tsx
│       │   ├── layout.tsx            # Root layout
│       │   ├── not-found.tsx
│       │   └── sitemap.ts            # Dynamic sitemap
│       ├── components/
│       │   ├── ui/                   # shadcn/ui components
│       │   ├── cv/
│       │   │   ├── editor/           # CV Editor components
│       │   │   ├── templates/        # CV template renderers
│       │   │   ├── sections/         # Individual section forms
│       │   │   └── preview/          # Live preview
│       │   ├── ai/
│       │   │   ├── suggestion-panel.tsx
│       │   │   ├── score-panel.tsx
│       │   │   └── guided-mode.tsx
│       │   ├── payment/
│       │   └── layout/
│       │       ├── header.tsx
│       │       ├── footer.tsx
│       │       └── sidebar.tsx
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── client.ts         # Browser Supabase client
│       │   │   ├── server.ts         # Server Supabase client
│       │   │   └── middleware.ts     # Auth middleware
│       │   ├── validations/          # Zod schemas
│       │   ├── utils/
│       │   ├── constants/
│       │   └── hooks/
│       ├── stores/                   # Zustand stores
│       │   ├── cv-store.ts
│       │   └── user-store.ts
│       ├── types/
│       │   ├── database.ts           # Generated Supabase types
│       │   └── cv.ts
│       ├── public/
│       │   ├── fonts/
│       │   └── images/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── middleware.ts
│
└── supabase/
    ├── migrations/                   # SQL migration files
    │   ├── 20240101000000_init.sql
    │   ├── 20240101000001_rls.sql
    │   ├── 20240101000002_functions.sql
    │   └── ...
    ├── functions/                    # Edge Functions
    │   ├── ai-suggest/
    │   │   └── index.ts
    │   ├── ai-score/
    │   │   └── index.ts
    │   ├── ai-guided/
    │   │   └── index.ts
    │   ├── payment-webhook/
    │   │   └── index.ts
    │   ├── generate-pdf/
    │   │   └── index.ts
    │   └── _shared/                  # Shared Edge Function utilities
    │       ├── cors.ts
    │       ├── auth.ts
    │       ├── rate-limit.ts
    │       ├── anthropic.ts
    │       └── validation.ts
    ├── seed.sql
    └── config.toml
```

---

## 3. Database Schema

### 3.1 Migration Files

**`migrations/20240101000000_init.sql`**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'pro_plus');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
CREATE TYPE cv_status AS ENUM ('draft', 'complete', 'archived');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'expired', 'refunded');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_status subscription_status,
  subscription_expires_at TIMESTAMPTZ,
  ai_suggestions_used INTEGER NOT NULL DEFAULT 0,
  ai_suggestions_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  ats_scores_used INTEGER NOT NULL DEFAULT 0,
  ats_scores_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  guided_sessions_used INTEGER NOT NULL DEFAULT 0,
  guided_sessions_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by UUID REFERENCES profiles(id),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEMPLATES
-- ============================================================
CREATE TABLE cv_templates (
  id TEXT PRIMARY KEY, -- T01, T02, etc.
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  style_config JSONB NOT NULL DEFAULT '{}',
  is_ats_friendly BOOLEAN NOT NULL DEFAULT true,
  required_tier subscription_tier NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CVs
-- ============================================================
CREATE TABLE cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES cv_templates(id),
  title TEXT NOT NULL DEFAULT 'CV Saya',
  target_position TEXT,
  target_industry TEXT,
  status cv_status NOT NULL DEFAULT 'draft',
  language TEXT NOT NULL DEFAULT 'id', -- 'id' or 'en'

  -- CV Content (JSONB for flexibility)
  contact_info JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  experience JSONB NOT NULL DEFAULT '[]',
  education JSONB NOT NULL DEFAULT '[]',
  skills JSONB NOT NULL DEFAULT '{}',
  certifications JSONB NOT NULL DEFAULT '[]',
  projects JSONB NOT NULL DEFAULT '[]',
  organizations JSONB NOT NULL DEFAULT '[]',
  awards JSONB NOT NULL DEFAULT '[]',
  languages JSONB NOT NULL DEFAULT '[]',
  custom_sections JSONB NOT NULL DEFAULT '[]',
  section_order TEXT[] NOT NULL DEFAULT ARRAY['experience', 'education', 'skills'],

  -- ATS Scoring
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  ats_score_breakdown JSONB,
  ats_scored_at TIMESTAMPTZ,

  -- PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,

  -- Metadata
  last_downloaded_at TIMESTAMPTZ,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CV AI HISTORY (audit trail AI interactions)
-- ============================================================
CREATE TABLE cv_ai_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'suggest', 'score', 'guided', 'cover_letter'
  input_data JSONB,
  output_data JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  status subscription_status NOT NULL,
  payment_gateway TEXT NOT NULL, -- 'midtrans', 'xendit'
  gateway_subscription_id TEXT,
  gateway_customer_id TEXT,
  amount_idr INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  gateway TEXT NOT NULL,
  gateway_order_id TEXT UNIQUE NOT NULL,
  gateway_transaction_id TEXT,
  amount_idr INTEGER NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  invoice_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTENT (Tips & Trik, Blog)
-- ============================================================
CREATE TABLE content_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'tips', 'blog', 'guide'
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Tim CVKarir',
  is_published BOOLEAN NOT NULL DEFAULT false,
  required_tier subscription_tier NOT NULL DEFAULT 'free',
  read_time_minutes INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RATE LIMIT LOG (for application-level rate limiting)
-- ============================================================
CREATE TABLE rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP or user_id
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_limit_log ON rate_limit_log (identifier, action, created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, email_verified)
  VALUES (NEW.id, NEW.email, NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON cvs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_cvs_user_id ON cvs (user_id);
CREATE INDEX idx_cvs_status ON cvs (status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_gateway_order ON payments (gateway_order_id);
CREATE INDEX idx_content_slug ON content_articles (slug);
CREATE INDEX idx_content_category ON content_articles (category) WHERE is_published = true;
```

**`migrations/20240101000001_rls.sql`**

```sql
-- ============================================================
-- ROW LEVEL SECURITY (RLS) — CRITICAL for multi-tenant security
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DENY: users cannot change their own subscription_tier directly
-- (must go through payment webhook Edge Function with service_role)

-- CVs
CREATE POLICY "Users can CRUD own CVs"
  ON cvs FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI History
CREATE POLICY "Users can read own AI history"
  ON cv_ai_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI history"
  ON cv_ai_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Payments
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);

-- Templates (public read)
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are publicly readable"
  ON cv_templates FOR SELECT USING (true);

-- Content (public read if published)
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published content is publicly readable"
  ON content_articles FOR SELECT USING (is_published = true);
```

---

## 4. Supabase Edge Functions

### 4.1 Shared Utilities (`supabase/functions/_shared/`)

**`cors.ts`**

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "https://cvkarir.id",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
```

**`auth.ts`**

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return { user, profile, supabase };
}
```

**`rate-limit.ts`**

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMinutes: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await serviceClient
    .from("rate_limit_log")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("created_at", windowStart);

  const current = count ?? 0;
  const remaining = Math.max(0, maxRequests - current);

  if (current >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Log this request
  await serviceClient.from("rate_limit_log").insert({
    identifier,
    action,
  });

  return { allowed: true, remaining: remaining - 1 };
}
```

**`anthropic.ts`**

```typescript
import Anthropic from "https://esm.sh/@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
});

export async function callClaude(params: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: params.maxTokens ?? 1000,
    system: params.system,
    messages: [{ role: "user", content: params.userMessage }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}
```

### 4.2 AI Suggest Edge Function (`supabase/functions/ai-suggest/index.ts`)

````typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { callClaude } from "../_shared/anthropic.ts";

const MONTHLY_LIMITS: Record<string, number> = {
  free: 10,
  starter: 50,
  pro: 9999,
  pro_plus: 9999,
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user, profile } = await getAuthenticatedUser(req);

    // Check subscription limit
    const limit = MONTHLY_LIMITS[profile.subscription_tier];
    if (profile.ai_suggestions_used >= limit) {
      return new Response(
        JSON.stringify({ error: "AI suggestion limit reached. Please upgrade." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Rate limit: max 20 requests per hour per user
    const { allowed } = await checkRateLimit(user.id, "ai_suggest", 20, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { section, context, existingContent, language = "id" } = body;

    // Validate input
    if (!section || !context) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize input (strip HTML tags)
    const sanitizedContext = String(context)
      .replace(/<[^>]*>/g, "")
      .slice(0, 2000);
    const sanitizedContent = existingContent
      ? String(existingContent)
          .replace(/<[^>]*>/g, "")
          .slice(0, 1000)
      : "";

    const systemPrompt =
      language === "id"
        ? `Kamu adalah career coach profesional Indonesia berpengalaman 10 tahun. 
         Bantu pengguna menulis CV yang kuat, ATS-friendly, dan jujur.
         Gunakan format STAR untuk pengalaman kerja. Quantify pencapaian jika memungkinkan.
         Jawab dalam Bahasa Indonesia yang profesional namun natural.
         Berikan saran konkret dan langsung bisa dipakai.
         JANGAN pernah membuat informasi palsu atau melebih-lebihkan.`
        : `You are a professional career coach with 10 years of experience in Indonesia.
         Help users write strong, ATS-friendly, honest CVs.
         Use STAR format for work experience. Quantify achievements when possible.
         Respond in professional English. Give concrete, actionable suggestions.
         NEVER fabricate information or exaggerate.`;

    const userMessage = `Section: ${section}
Context (posisi target, industri): ${sanitizedContext}
Konten yang sudah ada: ${sanitizedContent || "Belum ada konten"}

Berikan 3 opsi saran pengisian untuk section ${section} ini.
Format respons: JSON array dengan 3 objek, masing-masing punya field "suggestion" dan "explanation".`;

    const response = await callClaude({
      system: systemPrompt,
      userMessage,
      maxTokens: 800,
    });

    // Parse response
    let suggestions;
    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = [{ suggestion: response, explanation: "Saran dari AI" }];
    }

    // Update usage counter
    const serviceSupabase = createServiceClient();
    await serviceSupabase
      .from("profiles")
      .update({ ai_suggestions_used: profile.ai_suggestions_used + 1 })
      .eq("id", user.id);

    // Log AI usage
    await serviceSupabase.from("cv_ai_history").insert({
      user_id: user.id,
      action_type: "suggest",
      input_data: { section, context: sanitizedContext },
      output_data: suggestions,
    });

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
````

---

## 5. Security Implementation

### 5.1 Next.js Security Headers (`next.config.ts`)

```typescript
import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.midtrans.com https://api.midtrans.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com;
  connect-src 'self' https://*.supabase.co https://api.anthropic.com https://app.midtrans.com;
  frame-src https://app.midtrans.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

### 5.2 Middleware Auth (`middleware.ts`)

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/cv", "/settings", "/subscription"];
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
```

### 5.3 Input Validation (Zod Schemas — `lib/validations/cv.ts`)

```typescript
import { z } from "zod";

// Sanitize HTML helper
const sanitizedString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform((val) => val.replace(/<[^>]*>/g, "").trim());

export const ContactInfoSchema = z.object({
  full_name: sanitizedString(100).min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid").max(254),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{8,12}$/, "Format nomor Indonesia tidak valid"),
  city: sanitizedString(100),
  province: sanitizedString(100).optional(),
  linkedin: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
});

export const ExperienceItemSchema = z.object({
  id: z.string().uuid().optional(),
  company: sanitizedString(200).min(1),
  position: sanitizedString(200).min(1),
  location: sanitizedString(200).optional(),
  start_date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  end_date: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .or(z.literal("present")),
  is_current: z.boolean().default(false),
  description: sanitizedString(2000),
  achievements: z.array(sanitizedString(500)).max(10),
});

export const RegisterSchema = z.object({
  full_name: sanitizedString(100).min(2),
  email: z.string().email().max(254).toLowerCase(),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Harus ada huruf kapital")
    .regex(/[0-9]/, "Harus ada angka")
    .regex(/[^A-Za-z0-9]/, "Harus ada karakter spesial"),
  agree_terms: z.literal(true, {
    errorMap: () => ({ message: "Anda harus menyetujui syarat dan ketentuan" }),
  }),
});
```

---

## 6. SEO Implementation

### 6.1 Metadata Generation (`app/layout.tsx` dan per-page)

```typescript
// app/layout.tsx
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#468432",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cvkarir.id"),
  title: {
    template: "%s | CVKarir.id — Buat CV ATS Friendly",
    default: "CVKarir.id — Buat CV ATS Friendly Gratis untuk Indonesia",
  },
  description:
    "Platform terbaik untuk membuat CV ATS friendly di Indonesia. Template profesional, panduan AI, scoring ATS otomatis. Gratis mulai dari Rp 0.",
  keywords: [
    "buat CV ATS",
    "template CV Indonesia",
    "CV ATS friendly",
    "CV builder Indonesia",
    "cara buat CV lolos ATS",
  ],
  authors: [{ name: "CVKarir.id", url: "https://cvkarir.id" }],
  creator: "CVKarir.id",
  publisher: "CVKarir.id",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://cvkarir.id",
    siteName: "CVKarir.id",
    title: "CVKarir.id — Buat CV ATS Friendly untuk Indonesia",
    description:
      "Buat CV ATS friendly dengan panduan AI. Template profesional, scoring otomatis, tips karier. Mulai gratis!",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "CVKarir.id" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CVKarir.id — CV ATS Friendly Indonesia",
    description:
      "Buat CV ATS friendly dengan AI. Template, scoring, tips karier untuk pencari kerja Indonesia.",
    images: ["/og/default.png"],
  },
  alternates: {
    canonical: "https://cvkarir.id",
    languages: { "id-ID": "https://cvkarir.id", "en-US": "https://cvkarir.id/en" },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "GOOGLE_SEARCH_CONSOLE_ID",
  },
};
```

### 6.2 Structured Data JSON-LD

```typescript
// components/seo/structured-data.tsx
export function WebApplicationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'CVKarir.id',
          url: 'https://cvkarir.id',
          description: 'Platform buat CV ATS friendly untuk Indonesia',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'IDR',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '1250',
          },
        }),
      }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        }),
      }}
    />
  )
}
```

### 6.3 Dynamic Sitemap (`app/sitemap.ts`)

```typescript
import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const { data: articles } = await supabase
    .from("content_articles")
    .select("slug, updated_at, category")
    .eq("is_published", true);

  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://cvkarir.id", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: "https://cvkarir.id/templates",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://cvkarir.id/pricing",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://cvkarir.id/tips",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://cvkarir.id/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const dynamicPages: MetadataRoute.Sitemap = (articles ?? []).map((article) => ({
    url: `https://cvkarir.id/${article.category}/${article.slug}`,
    lastModified: new Date(article.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...dynamicPages];
}
```

---

## 7. Environment Variables

```bash
# .env.local (NEVER commit to git)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx... # SERVER ONLY

# App
NEXT_PUBLIC_APP_URL=https://cvkarir.id
NEXT_PUBLIC_APP_NAME=CVKarir.id

# Payment (server only)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false

# Email
RESEND_API_KEY=re_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Supabase Edge Functions (set via Supabase Dashboard secrets)
# ANTHROPIC_API_KEY=sk-ant-xxx
# SUPABASE_SERVICE_ROLE_KEY=eyJxx...
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (Vitest)

```typescript
// Semua Zod schemas harus punya unit test
// Semua utility functions harus punya unit test
// Coverage target: >80%

// Contoh:
describe("RegisterSchema", () => {
  it("should reject weak password", () => {
    const result = RegisterSchema.safeParse({
      full_name: "Test User",
      email: "test@example.com",
      password: "weakpass",
      agree_terms: true,
    });
    expect(result.success).toBe(false);
  });
});
```

### 8.2 E2E Tests (Playwright)

```typescript
// Critical paths yang wajib ada E2E test:
// 1. Register → Verify Email → Login
// 2. Create CV → Fill → ATS Score → Download
// 3. Upgrade → Payment → Feature Unlock
// 4. Mobile responsive (viewport 375px)
```

---

## 9. Coding Standards

### 9.1 Rules untuk AI Agent

1. **TypeScript strict mode** — tidak boleh ada `any` tanpa alasan yang jelas
2. **Server vs Client** — default Server Component; gunakan `'use client'` hanya jika perlu
3. **API calls** — SEMUA ke Supabase Edge Functions, TIDAK langsung ke Anthropic dari client
4. **Error handling** — semua async function harus ada try-catch
5. **Validation** — semua user input harus divalidasi dengan Zod, DI FRONTEND dan DI BACKEND
6. **No secrets in client code** — `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` hanya di server/Edge Functions
7. **SQL** — selalu gunakan Supabase SDK (parameterized queries), TIDAK raw SQL dari client
8. **File naming** — kebab-case untuk files, PascalCase untuk components, camelCase untuk functions
9. **Comments** — komentar dalam Bahasa Indonesia untuk logika bisnis, English untuk technical

### 9.2 Import Order

```typescript
// 1. React & Next.js
import { useState } from "react";
import { useRouter } from "next/navigation";
// 2. Third-party libraries
import { zodResolver } from "@hookform/resolvers/zod";
// 3. Internal shared (@/lib, @/components/ui)
import { Button } from "@/components/ui/button";
// 4. Feature-specific
import { CVEditor } from "@/components/cv/editor";
// 5. Types
import type { CV } from "@/types/cv";
```
