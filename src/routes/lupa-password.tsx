import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect, useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { HCaptchaWidget } from "@/components/ui/hcaptcha";
import { Loader2 } from "lucide-react";

const schema = z.object({ email: z.string().email("Email tidak valid").max(255) });

export const Route = createFileRoute("/lupa-password")({
  head: () =>
    buildSeo({
      title: "Lupa Password — CV Pintar",
      description: "Atur ulang password akun.",
      path: "/lupa-password",
      noindex: true,
    }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Cooldown countdown
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (!captchaToken) {
      setCaptchaError("Harap selesaikan verifikasi captcha");
      toast.error("Harap selesaikan verifikasi captcha");
      return;
    }
    setCaptchaError(null);

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken,
      },
    );
    setLoading(false);

    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);

    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setCooldown(60);
    toast.success("Link reset password sudah dikirim ke email kamu.");
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setLoading(true);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setLoading(false);
      return;
    }

    if (!captchaToken) {
      setCaptchaError("Harap selesaikan verifikasi captcha");
      toast.error("Harap selesaikan verifikasi captcha");
      return;
    }
    setCaptchaError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken,
      },
    );
    setLoading(false);

    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);

    if (error) {
      toast.error(error.message);
      return;
    }
    setCooldown(60);
    toast.success("Link reset password telah dikirim ulang!");
  };

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            Lupa Password
          </CardTitle>
          <CardDescription>
            Masukkan email akun untuk menerima link reset password. Link
            berlaku selama 1 jam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-sm">
              <p className="text-foreground">
                Cek inbox email{" "}
                <span className="font-medium">{email}</span> untuk link reset
                password. Tidak menerima email? Cek folder spam atau coba klik
                kirim ulang.
              </p>
              <HCaptchaWidget
                onVerify={(token) => {
                  setCaptchaToken(token);
                  setCaptchaError(null);
                }}
                onExpire={() => {
                  setCaptchaToken(null);
                  setCaptchaError("Sesi captcha berakhir, harap verifikasi ulang");
                }}
                disabled={loading || cooldown > 0}
                error={captchaError}
                resetKey={captchaResetKey}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleResend}
                  disabled={loading || cooldown > 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {cooldown > 0
                    ? `Kirim ulang (${cooldown}s)`
                    : "Kirim Ulang"}
                </Button>
                <Button asChild variant="ghost" className="flex-1">
                  <Link to="/login" search={{ redirect: "/dashboard" }}>Kembali ke Masuk</Link>
                </Button>
              </div>
            </div>
          ) : (
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
              <HCaptchaWidget
                onVerify={(token) => {
                  setCaptchaToken(token);
                  setCaptchaError(null);
                }}
                onExpire={() => {
                  setCaptchaToken(null);
                  setCaptchaError("Sesi captcha berakhir, harap verifikasi ulang");
                }}
                disabled={loading || cooldown > 0}
                error={captchaError}
                resetKey={captchaResetKey}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loading || cooldown > 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim Link Reset
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  to="/login"
                  search={{ redirect: "/dashboard" }}
                  className="font-medium text-primary hover:underline"
                >
                  Kembali ke Masuk
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
