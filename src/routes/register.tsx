import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PasswordStrength } from "@/components/ui/password-strength";
import { HCaptchaWidget } from "@/components/ui/hcaptcha";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

// ─── Security: Referral Code Validation ──────────────────────────────────────
// Validates referral code format to prevent injection attacks
// Format: alphanumeric, 6-20 characters, may contain hyphens/underscores
const REFERRAL_CODE_REGEX = /^[a-zA-Z0-9_-]{6,20}$/;

const referralCodeSchema = z
  .string()
  .regex(REFERRAL_CODE_REGEX, "Format kode referral tidak valid")
  .max(20);

/**
 * Safely track referral signup with validation and rate limiting
 * SECURITY: Validates referral code format before sending to server
 */
async function trackReferralSafely(
  code: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  // Step 1: Validate referral code format (client-side validation)
  const validation = referralCodeSchema.safeParse(code);
  if (!validation.success) {
    console.warn("[Referral] Invalid referral code format rejected:", code);
    return { success: false, error: "Invalid code format" };
  }

  const validatedCode = validation.data;

  // Step 2: Validate userId format (defense in depth)
  const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userIdRegex.test(userId)) {
    console.error("[Referral] Invalid userId format:", userId);
    return { success: false, error: "Invalid user ID" };
  }

  // Step 3: Track via RPC with validated inputs
  try {
    const { error } = await supabase.rpc("track_referral_signup", {
      p_code: validatedCode,
      p_user_id: userId,
    });

    if (error) {
      // Log error but don't fail registration
      console.error("[Referral] Tracking failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("[Referral] Successfully tracked for user:", userId.slice(0, 8));
    return { success: true };
  } catch (err) {
    // Network or unexpected errors - log but don't fail registration
    console.error("[Referral] Unexpected error:", err);
    return { success: false, error: "Failed to track referral" };
  }
}

const schema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().email("Email tidak valid").max(255),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128)
    .regex(/[A-Z]/, "Harus ada huruf besar")
    .regex(/[a-z]/, "Harus ada huruf kecil")
    .regex(/[0-9]/, "Harus ada angka"),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "Anda harus menyetujui Syarat & Ketentuan" }),
  }),
});

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    // Check session (works on client-side navigation)
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () =>
    buildSeo({
      title: "Daftar Gratis — CV Pintar",
      description: "Buat akun gratis CV Pintar.",
      path: "/register",
      noindex: true,
    }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Mark as hydrated after first client-side render
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect already-logged-in users on client side (fallback for SSR)
  useEffect(() => {
    if (hydrated && !authLoading && authUser) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [hydrated, authUser, authLoading, navigate]);

  // During SSR or initial client render, show loading state to prevent flash of form
  if (!hydrated || authLoading) {
    return (
      <div className="container-page flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
            <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
            <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render form if user is already logged in (redirect happens via useEffect)
  if (authUser) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password, agreeTerms });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    // Verifikasi hCaptcha
    if (!captchaToken) {
      setCaptchaError("Harap selesaikan verifikasi captcha");
      toast.error("Harap selesaikan verifikasi captcha");
      return;
    }
    setCaptchaError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        captchaToken,
        emailRedirectTo: `${window.location.origin}/verify-email?confirmed=true`,
        data: { full_name: parsed.data.fullName },
      },
    });

    // Reset captcha after attempt (token is one-time use regardless of result)
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);

    setLoading(false);
    if (error) {
      if (error.message?.toLowerCase().includes("already")) {
        toast.error("Email sudah terdaftar. Silakan masuk atau gunakan email lain.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Track referral from URL param with VALIDATION
    const refCode = new URLSearchParams(window.location.search).get("ref");
    if (refCode && data?.user?.id) {
      // Fire and forget - don't block the flow for referral tracking
      trackReferralSafely(refCode, data.user.id).then(({ success, error }) => {
        if (success) {
          console.log("[Referral] Signup tracked successfully");
        }
        // Error is already logged in the function, no need to show toast
      });
    }

    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
    toast.success("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
    navigate({ to: "/verify-email", search: { confirmed: undefined } });
  };

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Daftar Gratis</CardTitle>
          <CardDescription>Mulai bikin CV ATS friendly dalam 1 menit.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading}
            onClick={async () => {
              setGoogleLoading(true);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) {
                setGoogleLoading(false);
                toast.error("Gagal masuk dengan Google");
              }
            }}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FcGoogle className="mr-2 h-5 w-5" />
            )}
            Daftar dengan Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">atau</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nama Lengkap */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap *</Label>
              <Input
                id="fullName"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap kamu"
                aria-describedby="fullName-hint"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter, huruf besar & kecil, angka"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* hCaptcha */}
            <HCaptchaWidget
              onVerify={(token) => {
                setCaptchaToken(token);
                setCaptchaError(null);
              }}
              onExpire={() => {
                setCaptchaToken(null);
                setCaptchaError("Sesi captcha berakhir, harap verifikasi ulang");
              }}
              disabled={loading}
              error={captchaError}
              resetKey={captchaResetKey}
            />

            {/* TOS Checkbox */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(c) => setAgreeTerms(c === true)}
                aria-describedby="agreeTerms-error"
              />
              <Label htmlFor="agreeTerms" className="text-xs leading-relaxed text-muted-foreground">
                Dengan mendaftar, kamu setuju dengan{" "}
                <Link to="/syarat-ketentuan" className="underline hover:text-foreground">
                  Syarat &amp; Ketentuan
                </Link>{" "}
                dan{" "}
                <Link to="/kebijakan-privasi" className="underline hover:text-foreground">
                  Kebijakan Privasi
                </Link>
                . *
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Daftar
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                search={{ redirect: "/dashboard" }}
                className="font-medium text-primary hover:underline"
              >
                Masuk
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
