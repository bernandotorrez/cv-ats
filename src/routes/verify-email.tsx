import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Mail, Loader2, CheckCircle2, ArrowRight, XCircle } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  head: () =>
    buildSeo({
      title: "Verifikasi Email — CV Pintar",
      description: "Verifikasi email akun CV Pintar.",
      path: "/verify-email",
      noindex: true,
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    // Router mem-parse "?confirmed=true" menjadi boolean true (bukan string). Dulu dicek
    // typeof === "string" sehingga selalu undefined dan router me-redirect (307) ke
    // /verify-email tanpa query → user selalu mendarat di "Cek Email Kamu".
    confirmed: s.confirmed === true || s.confirmed === "true" ? (true as const) : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { confirmed } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  // Hasil dari link email: Supabase menaruhnya di hash URL (#access_token=… atau #error=…).
  const [linkState, setLinkState] = useState<"pending" | "token" | "error" | "none">("pending");

  useEffect(() => {
    const hash = window.location.hash;
    if (/[#&]error(_code)?=/.test(hash)) setLinkState("error");
    else if (/[#&]access_token=/.test(hash)) setLinkState("token");
    else setLinkState("none");
  }, []);

  // Token di URL tapi sesi tak kunjung terbentuk (token rusak/kedaluwarsa): jangan berputar selamanya.
  const [tokenTimedOut, setTokenTimedOut] = useState(false);
  useEffect(() => {
    if (linkState !== "token" || user) return;
    const t = setTimeout(() => setTokenTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [linkState, user]);

  // Email sudah terverifikasi & sesi aktif (klik link di email, atau verifikasi
  // di tab lain yang menyinkronkan sesi) → langsung ke dashboard.
  const verified = !!user?.email_confirmed_at;
  const redirected = useRef(false);
  useEffect(() => {
    if (authLoading || !verified || redirected.current) return;
    redirected.current = true;
    if (confirmed === true) toast.success("Email terverifikasi! Selamat datang.");
    void navigate({ to: "/dashboard", replace: true });
  }, [authLoading, verified, confirmed, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Tidak dapat mengirim ulang. Silakan daftar ulang.");
        return;
      }
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email?confirmed=true`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Email verifikasi telah dikirim ulang!");
      setCooldown(60);
    } catch {
      toast.error("Gagal mengirim ulang email.");
    } finally {
      setLoading(false);
    }
  };

  // Link verifikasi kedaluwarsa / sudah dipakai
  if (linkState === "error") {
    return (
      <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-7 w-7" />
            </div>
            <CardTitle className="mt-4 font-display text-2xl">Link Tidak Berlaku</CardTitle>
            <CardDescription>
              Link verifikasi sudah kedaluwarsa atau pernah dipakai. Jika emailmu sudah
              terverifikasi, kamu bisa langsung masuk. Jika belum, daftar ulang atau hubungi kami.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link to="/login" search={{ redirect: "/dashboard" }}>
                Masuk <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Butuh bantuan?{" "}
              <Link to="/kontak" className="text-primary underline">
                Hubungi kami
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sedang memproses sesi dari link, atau sudah terverifikasi dan sedang diarahkan
  const processing =
    authLoading ||
    linkState === "pending" ||
    verified ||
    (linkState === "token" && !user && !tokenTimedOut);
  if (confirmed === true && processing) {
    return (
      <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-medium">Memverifikasi emailmu…</p>
          <p className="text-sm text-muted-foreground">
            Sebentar lagi kamu diarahkan ke dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Link dibuka di browser/perangkat lain (tidak ada sesi): email sudah aktif, tinggal masuk
  if (confirmed === true) {
    return (
      <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="mt-4 font-display text-2xl">Email Terverifikasi!</CardTitle>
            <CardDescription>
              Akun kamu sudah aktif. Silakan masuk untuk mulai bikin CV ATS friendly pertamamu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link to="/login" search={{ redirect: "/dashboard" }}>
                Masuk ke Dashboard <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Butuh bantuan?{" "}
              <Link to="/kontak" className="text-primary underline">
                Hubungi kami
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: instructions to check email
  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4 font-display text-2xl">Cek Email Kamu</CardTitle>
          <CardDescription>
            Kami sudah mengirim link verifikasi ke email yang kamu daftarkan. Klik link tersebut
            untuk mengaktifkan akun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-left text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Tidak menerima email?</p>
            <ul className="mt-2 space-y-1">
              <li>• Cek folder spam atau promosi</li>
              <li>• Pastikan alamat email yang didaftarkan benar</li>
              <li>• Tunggu beberapa menit, email bisa memakan waktu hingga 2 menit</li>
              <li>• Link verifikasi berlaku selama 24 jam</li>
            </ul>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={loading || cooldown > 0}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : "Kirim Ulang Email Verifikasi"}
          </Button>

          <p className="text-sm text-muted-foreground">
            <Link
              to="/login"
              search={{ redirect: "/dashboard" }}
              className="font-medium text-primary hover:underline"
            >
              Kembali ke Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
