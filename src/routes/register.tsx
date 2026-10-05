import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PasswordStrength } from "@/components/ui/password-strength";
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
import { CheckCircle2, Eye, EyeOff, FileText, Sparkles, Star, Target, Users } from "lucide-react";

// ─── Security: Referral Code Validation ──────────────────────────────────────
// Validates referral code format to prevent injection attacks
// Format: alphanumeric, 6-20 characters, may contain hyphens/underscores
const REFERRAL_CODE_REGEX = /^[a-zA-Z0-9_-]{6,20}$/;

const referralCodeSchema = z
  .string()
  .regex(REFERRAL_CODE_REGEX, "Format kode referral tidak valid")
  .max(20);

/**
 * Ambil kode referral dari query string (?ref=...) jika formatnya valid.
 * SECURITY: atribusi referral dilakukan di server (trigger signup membaca
 * raw_user_meta_data.referral_code), bukan lewat RPC dari client — sehingga
 * tetap berjalan saat konfirmasi email aktif dan tidak bisa dipakai untuk
 * mengatribusikan user lain.
 */
function getValidReferralCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const refCode = new URLSearchParams(window.location.search).get("ref");
  if (!refCode) return undefined;
  const validation = referralCodeSchema.safeParse(refCode);
  if (!validation.success) {
    console.warn("[Referral] Invalid referral code format rejected");
    return undefined;
  }
  return validation.data;
}

const schema = z.object({
  fullName: z.string().trim().min(1, "Nama wajib diisi").min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(8, "Password minimal 8 karakter")
    .max(128)
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "Kamu perlu menyetujui Syarat & Ketentuan untuk mendaftar" }),
  }),
});

type RegisterField = keyof typeof schema.shape;

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
  const [errors, setErrors] = useState<Partial<Record<RegisterField, string>>>({});
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
    return <AuthLoading />;
  }

  // Don't render form if user is already logged in (redirect happens via useEffect)
  if (authUser) return null;

  // Setelah field pernah gagal validasi, cek ulang saat diubah agar error hilang begitu benar
  const revalidate = (field: RegisterField, value: unknown) => {
    if (!errors[field]) return;
    const result = schema.shape[field].safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0].message,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password, agreeTerms });
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

    const referralCode = getValidReferralCode();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        captchaToken,
        emailRedirectTo: `${window.location.origin}/verify-email?confirmed=true`,
        data: {
          full_name: parsed.data.fullName,
          ...(referralCode ? { referral_code: referralCode } : {}),
        },
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

    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
    toast.success("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
    navigate({ to: "/verify-email", search: { confirmed: undefined } });
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
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Gratis selamanya · tanpa kartu kredit
        </>
      }
      title={
        <>
          Buat akun, <span className="text-green-700">CV ATS‑mu siap dalam menit.</span>
        </>
      }
      desc="Daftar gratis untuk mulai menyusun CV, cek skor ATS, dan dapat saran AI yang langsung bisa dipakai."
      aside={<RegisterAside />}
    >
      {/* Google Sign-Up */}
      <GoogleButton
        label="Daftar dengan Google"
        loading={googleLoading}
        disabled={googleLoading}
        onClick={handleGoogle}
      />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Nama Lengkap */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className={authLabelClass}>
            Nama lengkap
          </Label>
          <Input
            id="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              revalidate("fullName", e.target.value);
            }}
            placeholder="Nama lengkap kamu"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={`${authInputClass} ${errors.fullName ? authInputErrorClass : ""}`}
          />
          <FieldError id="fullName-error" message={errors.fullName} />
        </div>

        {/* Email */}
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
            onChange={(e) => {
              setEmail(e.target.value);
              revalidate("email", e.target.value);
            }}
            placeholder="nama@domain.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${authInputClass} ${errors.email ? authInputErrorClass : ""}`}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className={authLabelClass}>
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                revalidate("password", e.target.value);
              }}
              placeholder="Min. 8 karakter"
              aria-invalid={!!errors.password}
              aria-describedby={
                [errors.password && "password-error", !password && "password-hint"]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
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
          {!password && (
            <p id="password-hint" className="text-xs text-gray-600">
              Minimal 8 karakter, dengan huruf besar, huruf kecil, dan angka.
            </p>
          )}
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
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agreeTerms"
              checked={agreeTerms}
              onCheckedChange={(c) => {
                setAgreeTerms(c === true);
                revalidate("agreeTerms", c === true);
              }}
              aria-invalid={!!errors.agreeTerms}
              aria-describedby={errors.agreeTerms ? "agreeTerms-error" : undefined}
              className={`mt-0.5 h-5 w-5 rounded-md data-[state=checked]:border-green-700 data-[state=checked]:bg-green-700 ${errors.agreeTerms ? "border-red-600" : "border-gray-400"}`}
            />
            <Label
              htmlFor="agreeTerms"
              className="text-sm font-normal leading-relaxed text-gray-700"
            >
              Saya setuju dengan{" "}
              <Link
                to="/syarat-ketentuan"
                className="font-semibold text-green-800 underline underline-offset-4"
              >
                Syarat &amp; Ketentuan
              </Link>{" "}
              dan{" "}
              <Link
                to="/kebijakan-privasi"
                className="font-semibold text-green-800 underline underline-offset-4"
              >
                Kebijakan Privasi
              </Link>
              .
            </Label>
          </div>
          <FieldError id="agreeTerms-error" message={errors.agreeTerms} />
        </div>

        <AuthSubmit loading={loading} disabled={loading}>
          Buat Akun Gratis
        </AuthSubmit>
      </form>

      <p className="mt-6 border-t border-gray-100 pt-6 text-center text-sm text-gray-700">
        Sudah punya akun?{" "}
        <Link
          to="/login"
          search={{ redirect: "/dashboard" }}
          className="font-bold text-green-800 underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}

const registerStats = [
  { icon: Users, stat: "5.000+", label: "Pengguna aktif" },
  { icon: FileText, stat: "10.000+", label: "CV dibuat" },
  { icon: Target, stat: "92%", label: "Skor ATS rata-rata" },
  { icon: Star, stat: "4.9/5", label: "Rating pengguna" },
] as const;

function RegisterAside() {
  return (
    <AuthAside eyebrow="Kenapa CV Pintar?" title="Semua yang kamu butuhkan sebelum klik kirim.">
      <ul className="mt-8 space-y-4">
        {[
          ["Template ATS-friendly", "Struktur rapi yang terbaca mesin dan rekruter."],
          ["AI Bahasa Indonesia + Inggris", "Bantu tulis ringkasan, pengalaman, dan skill."],
          ["Skor & saran perbaikan", "Tahu bagian mana yang perlu diperkuat."],
        ].map(([title, desc]) => (
          <li key={title} className="flex items-start gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-sm text-green-50">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="mt-10 grid grid-cols-2 gap-3">
        {registerStats.map((item) => (
          <div key={item.label} className="flex flex-col-reverse rounded-2xl bg-white/10 p-4">
            <dt className="mt-1 text-sm text-green-50">{item.label}</dt>
            <dd className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <item.icon aria-hidden="true" className="h-5 w-5 text-yellow-300" />
              {item.stat}
            </dd>
          </div>
        ))}
      </dl>
    </AuthAside>
  );
}
