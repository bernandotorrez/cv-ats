/**
 * Send Email Edge Function
 * Sends transactional emails via Resend.
 * Used for: welcome, payment confirmation, subscription reminders.
 * POST /send-email
 * 
 * SECURITY:
 * - Requires authentication (getUserId)
 * - Rate limited: 10 emails per hour per user
 * - Only sends to authenticated user's email (from profiles table)
 * - Input sanitization and length limits
 */
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = "CV Pintar <noreply@cvats.id>";

interface EmailPayload {
  to?: string;
  subject: string;
  html: string;
  type?: "welcome" | "payment" | "subscription" | "general";
}

// Constants for input validation
const MAX_SUBJECT_LENGTH = 200;
const MAX_HTML_LENGTH = 50000; // 50KB
const ALLOWED_HTML_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody'];

// Sanitize HTML to prevent XSS
function sanitizeHtml(html: string): string {
  // Remove script tags
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers (onclick, onerror, etc.)
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  // Remove javascript: URLs
  clean = clean.replace(/javascript:/gi, '');
  // Remove data: URLs (except for images)
  clean = clean.replace(/data:(?!image\/)/gi, '');
  return clean;
}

// Get authenticated user's email from profiles table
async function getUserEmail(userId: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Failed to get user email:", error);
    return null;
  }

  return data.email;
}

// Verify auth token
async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No valid auth token");
  }
  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("Unauthorized: Invalid auth token");
  }
  return user.id;
}

// Pre-defined email templates for security
const EMAIL_TEMPLATES: Record<string, { subject: string; html: string }> = {
  welcome: {
    subject: "Selamat Datang di CV Pintar!",
    html: "<h1>Selamat Datang!</h1><p>Terima kasih telah bergabung dengan CV Pintar. Mulai buat CV profesionalmu sekarang!</p>",
  },
  payment: {
    subject: "Konfirmasi Pembayaran - CV Pintar",
    html: "<h1>Pembayaran Berhasil</h1><p>Pembayaranmu telah kami terima. Subscriptionmu telah diaktifkan.</p>",
  },
  subscription: {
    subject: "Pengingat Subscription - CV Pintar",
    html: "<h1>Subscription Berakhir</h1><p>Subscriptionmu akan berakhir segera. Perpanjang sekarang untuk terus menikmati fitur premium.</p>",
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    // SECURITY: Require authentication
    const userId = await getUserId(req);

    // SECURITY: Rate limiting - 10 emails per hour per user
    const rateLimitKey = `send-email:${userId}`;
    if (!checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000)) {
      return new Response(
        JSON.stringify({ error: "Terlalu banyak request email. Silakan coba lagi dalam 1 jam." }),
        { status: 429, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // SECURITY: Get user's email from database
    const userEmail = await getUserEmail(userId);
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "Tidak dapat menemukan email user" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const body = await req.json() as EmailPayload;

    // SECURITY: Validate required fields
    if (!body.subject && !body.type) {
      return new Response(
        JSON.stringify({ error: "subject atau type diperlukan" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // SECURITY: Length limits
    if (body.subject && body.subject.length > MAX_SUBJECT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Subject terlalu panjang (maksimal ${MAX_SUBJECT_LENGTH} karakter)` }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (body.html && body.html.length > MAX_HTML_LENGTH) {
      return new Response(
        JSON.stringify({ error: `HTML terlalu panjang (maksimal ${MAX_HTML_LENGTH} karakter)` }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // SECURITY: Sanitize HTML
    let sanitizedHtml = "";
    let finalSubject = "";

    // If type is specified, use pre-defined template
    if (body.type && EMAIL_TEMPLATES[body.type]) {
      const template = EMAIL_TEMPLATES[body.type];
      finalSubject = body.subject || template.subject;
      sanitizedHtml = template.html;
    } else {
      // Custom email with user-provided content
      sanitizedHtml = sanitizeHtml(body.html || "");
      finalSubject = body.subject || "Email dari CV Pintar";
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      // In dev, just log the email
      console.log("Would send email:", { 
        from: FROM_EMAIL, 
        to: userEmail, 
        subject: finalSubject,
        userId 
      });
      return new Response(
        JSON.stringify({ status: "ok", dev: true, message: "Email logged (dev mode)" }),
        { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Send via Resend API
    // SECURITY: Only send to authenticated user's email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [userEmail], // SECURITY: Always send to user's own email
        subject: finalSubject,
        html: sanitizedHtml,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      throw new Error(`Failed to send email: ${res.status}`);
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ status: "ok", id: (data as any).id }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    const status = message.startsWith("Unauthorized") ? 401 : message.includes("Terlalu banyak") ? 429 : 500;
    console.error("Email error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
