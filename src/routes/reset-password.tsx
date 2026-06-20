import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Loader2, Eye, EyeOff } from "lucide-react";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(128)
      .regex(/[A-Z]/, "Harus ada huruf besar")
      .regex(/[a-z]/, "Harus ada huruf kecil")
      .regex(/[0-9]/, "Harus ada angka"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm"],
  });

export const Route = createFileRoute("/reset-password")({
  head: () =>
    buildSeo({
      title: "Reset Password — CV Pintar",
      description: "Atur password baru.",
      path: "/reset-password",
      noindex: true,
    }),
  component: ResetPage,
});

function ResetPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password berhasil diubah. Silakan masuk.");
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/login";
  };

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Atur Password Baru</CardTitle>
          <CardDescription>Masukkan password baru untuk akun kamu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Password *</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ulangi password"
                  className="pr-10"
                  aria-invalid={confirm.length > 0 && password !== confirm ? "true" : undefined}
                  aria-describedby={
                    confirm.length > 0 && password !== confirm ? "confirm-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirm.length > 0 && password !== confirm && (
                <p id="confirm-error" className="text-xs text-destructive" role="alert">
                  Password tidak cocok
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Password
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
