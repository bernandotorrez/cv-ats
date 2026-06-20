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
import { HCaptchaWidget } from "@/components/ui/hcaptcha";
import { Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const schema = z.object({
  email: z.string().email("Email tidak valid").max(255),
  password: z.string().min(1, "Password wajib diisi").max(128),
});

const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 menit
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 menit

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    // Check session (works on client-side navigation)
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () =>
    buildSeo({
      title: "Masuk — CV Pintar",
      description: "Masuk ke akun CV Pintar.",
      path: "/login",
      noindex: true,
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/dashboard",
  }),
  component: LoginPage,
});

function getLockoutState(): { locked: boolean; remainingMs: number } {
  try {
    const raw = sessionStorage.getItem("login_lockout");
    if (!raw) return { locked: false, remainingMs: 0 };
    const { until } = JSON.parse(raw);
    const remaining = Number(until) - Date.now();
    return { locked: remaining > 0, remainingMs: Math.max(0, remaining) };
  } catch {
    return { locked: false, remainingMs: 0 };
  }
}

function recordFailedAttempt() {
  try {
    const raw = sessionStorage.getItem("login_attempts");
    const attempts = raw ? JSON.parse(raw) : { count: 0, firstFailedAt: Date.now() };
    attempts.count++;
    if (attempts.firstFailedAt === 0 || Date.now() - attempts.firstFailedAt > ATTEMPT_WINDOW) {
      attempts.firstFailedAt = Date.now();
      attempts.count = 1;
    }
    sessionStorage.setItem("login_attempts", JSON.stringify(attempts));

    if (attempts.count >= MAX_ATTEMPTS) {
      sessionStorage.setItem(
        "login_lockout",
        JSON.stringify({ until: Date.now() + LOCKOUT_DURATION }),
      );
    }
  } catch {
    // No-op for SSR
  }
}

function clearAttempts() {
  sessionStorage.removeItem("login_attempts");
  sessionStorage.removeItem("login_lockout");
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { user: authUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(getLockoutState);
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

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockout.locked) return;
    const interval = setInterval(() => {
      const state = getLockoutState();
      setLockout(state);
      if (!state.locked) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout.locked]);

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

  const formatCountdown = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (lockout.locked) {
      toast.error(
        `Akun dikunci sementara. Coba lagi dalam ${formatCountdown(lockout.remainingMs)}.`,
      );
      return;
    }

    const parsed = schema.safeParse({ email, password });
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

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        captchaToken,
      },
    });

    // Reset captcha after attempt (token is one-time use regardless of result)
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);

    if (error) {
      setLoading(false);
      recordFailedAttempt();
      const updatedLockout = getLockoutState();
      setLockout(updatedLockout);

      // Generic error message — jangan spesifik (security)
      toast.error("Email atau password salah");
      if (updatedLockout.locked) {
        toast.error(
          `Terlalu banyak percobaan. Akun dikunci selama ${LOCKOUT_DURATION / 60000} menit.`,
          { duration: 6000 },
        );
      }
      return;
    }

    clearAttempts();
    toast.success("Berhasil masuk");
    navigate({ to: redirect || "/dashboard" });
  };

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Masuk</CardTitle>
          <CardDescription>Lanjutkan ke akun CV Pintar.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Lockout Warning */}
          {lockout.locked && (
            <div
              className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Akun dikunci sementara</p>
                <p className="text-xs">
                  Silakan coba lagi dalam {formatCountdown(lockout.remainingMs)}.
                </p>
              </div>
            </div>
          )}

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading || lockout.locked}
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
            Masuk dengan Google
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/lupa-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading || lockout.locked}
              error={captchaError}
              resetKey={captchaResetKey}
            />

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c === true)}
              />
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                Ingat saya (30 hari)
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || lockout.locked}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Daftar gratis
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
