import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect, useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { safeRedirectTarget } from "@/lib/auth-redirect";
import { HCaptchaWidget } from "@/components/ui/hcaptcha";
import {
  AuthAside,
  AuthDivider,
  AuthLoading,
  AuthShell,
  AuthSubmit,
  FieldError,
  GoogleButton,
  authInputClass,
  authInputErrorClass,
  authLabelClass,
} from "@/components/auth/AuthShell";
import { fieldErrors } from "@/components/auth/field-errors";
import { CheckCircle2, Eye, EyeOff, FileText, LogIn, ShieldAlert, Sparkles } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
  password: z.string().min(1, "Password wajib diisi").max(128),
});

type LoginField = keyof typeof schema.shape;

const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 menit
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 menit

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ search }) => {
    // Check session (works on client-side navigation). Sudah login → ke halaman tujuan.
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ href: safeRedirectTarget(search.redirect) });
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
  const [errors, setErrors] = useState<Partial<Record<LoginField, string>>>({});
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

  // Redirect already-logged-in users on client side (fallback for SSR).
  // Sekali saja: navigate() yang diulang di tiap render membatalkan navigasi sebelumnya.
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (!hydrated || authLoading || !authUser || redirectedRef.current) return;
    redirectedRef.current = true;
    navigate({ href: safeRedirectTarget(redirect), replace: true });
  }, [hydrated, authUser, authLoading, navigate, redirect]);

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
    return <AuthLoading />;
  }

  // Don't render form if user is already logged in (redirect happens via useEffect)
  if (authUser) return null;

  const formatCountdown = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Setelah field pernah gagal validasi, cek ulang saat diketik agar error hilang begitu benar
  const updateField = (field: LoginField, value: string, set: (v: string) => void) => {
    set(value);
    if (!errors[field]) return;
    const result = schema.shape[field].safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0].message,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Banner lockout sudah tampil & tombol nonaktif
    if (lockout.locked) return;

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const next = fieldErrors(parsed.error.issues);
      setErrors(next);
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setErrors({});

    // Verifikasi hCaptcha (pesan inline di widget)
    if (!captchaToken) {
      setCaptchaError("Harap selesaikan verifikasi captcha");
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
    // Hanya path internal (cegah open redirect); href agar query string ikut terbawa
    navigate({ href: safeRedirectTarget(redirect) });
  };

  const handleGoogle = async () => {
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
  };

  return (
    <AuthShell
      eyebrow={
        <>
          <LogIn aria-hidden="true" className="h-4 w-4" />
          Masuk ke CV Pintar
        </>
      }
      title={
        <>
          Selamat datang kembali! <span className="text-green-700">Lanjutkan CV‑mu.</span>
        </>
      }
      desc="Masuk untuk melanjutkan CV, cek skor ATS, dan lamaran yang sedang kamu siapkan."
      aside={<LoginAside />}
    >
      {/* Lockout Warning */}
      {lockout.locked && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Akun dikunci sementara</p>
            <p className="mt-0.5">
              Silakan coba lagi dalam {formatCountdown(lockout.remainingMs)}.
            </p>
          </div>
        </div>
      )}

      {/* Google Sign-In */}
      <GoogleButton
        label="Masuk dengan Google"
        loading={googleLoading}
        disabled={googleLoading || lockout.locked}
        onClick={handleGoogle}
      />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className={authLabelClass}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => updateField("email", e.target.value, setEmail)}
            placeholder="nama@domain.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${authInputClass} ${errors.email ? authInputErrorClass : ""}`}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={authLabelClass}>
              Password
            </Label>
            <Link
              to="/lupa-password"
              className="text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
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
              onChange={(e) => updateField("password", e.target.value, setPassword)}
              placeholder="Password kamu"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`${authInputClass} pr-12 ${errors.password ? authInputErrorClass : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <FieldError id="password-error" message={errors.password} />
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
        <div className="flex items-center gap-3">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(c) => setRememberMe(c === true)}
            className="h-5 w-5 rounded-md border-gray-400 data-[state=checked]:border-green-700 data-[state=checked]:bg-green-700"
          />
          <Label htmlFor="rememberMe" className="cursor-pointer text-sm text-gray-700">
            Ingat saya (30 hari)
          </Label>
        </div>

        <AuthSubmit loading={loading} disabled={loading || lockout.locked}>
          Masuk
        </AuthSubmit>
      </form>

      <p className="mt-6 border-t border-gray-100 pt-6 text-center text-sm text-gray-700">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="font-bold text-green-800 underline-offset-4 hover:underline"
        >
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  );
}

function LoginAside() {
  return (
    <AuthAside
      eyebrow="Dashboard CV Pintar"
      title="Semua CV, skor, dan lamaranmu menunggu di satu tempat."
    >
      <div
        role="img"
        aria-label="Contoh ringkasan dashboard: CV Product Designer dengan skor ATS 91 dan dua saran perbaikan."
        className="mt-8 rounded-2xl bg-white p-5 text-gray-900 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-800">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">CV Product Designer</p>
              <p className="text-xs text-gray-600">Diedit 2 jam lalu</p>
            </div>
          </div>
          <div className="rounded-xl bg-green-800 px-3 py-1.5 text-center text-white">
            <p className="text-[10px] font-semibold text-green-100">ATS</p>
            <p className="font-display text-lg font-extrabold leading-none">91</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2.5 text-sm">
          {["Ringkasan profil sudah kuat", "Keyword sesuai job description"].map((t) => (
            <li key={t} className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" />
              {t}
            </li>
          ))}
          <li className="flex items-center gap-2 rounded-lg bg-yellow-100 px-2.5 py-2 font-medium text-gray-900">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
            Tambahkan angka di 2 bullet pengalaman
          </li>
        </ul>
      </div>
      <ul className="mt-8 space-y-3 text-green-50">
        {[
          "Lanjutkan CV tepat di bagian terakhir kamu edit",
          "Pantau sisa kuota AI dan masa aktif paket",
          "Data tersimpan aman dan privat",
        ].map((t) => (
          <li key={t} className="flex items-start gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            {t}
          </li>
        ))}
      </ul>
    </AuthAside>
  );
}
