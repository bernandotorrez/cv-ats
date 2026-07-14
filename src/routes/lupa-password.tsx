import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    });
    setLoading(false);

    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link reset password sudah dikirim ke email kamu.");
    if (user) {
      navigate({ to: "/" });
    } else {
      (navigate as any)({ to: "/login" });
    }
  };

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email akun untuk menerima link reset password. Link berlaku selama 1 jam.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              disabled={loading}
              error={captchaError}
              resetKey={captchaResetKey}
            />
            <Button type="submit" className="w-full" disabled={loading}>
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
        </CardContent>
      </Card>
    </div>
  );
}
