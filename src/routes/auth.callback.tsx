import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Cek dulu apakah sesi sudah terbentuk (bisa jadi sudah diproses otomatis oleh Supabase detectSessionInUrl)
        const { data: initialSession } = await supabase.auth.getSession();
        if (initialSession.session) {
          toast.success("Berhasil masuk");
          navigate({ to: "/dashboard", replace: true });
          return;
        }

        // 2. Jika belum ada sesi, lakukan pertukaran kode PKCE dari URL
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (error) {
          // 3. Jika error (misal: "both auth code and code verifier should be non-empty"), 
          // cek sekali lagi apakah sesi sebenarnya sudah berhasil terbentuk di background
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession.session) {
            toast.success("Berhasil masuk");
            navigate({ to: "/dashboard", replace: true });
            return;
          }

          console.error("[OAuth] Callback error:", error.message);
          toast.error("Gagal masuk dengan Google. Silakan coba lagi.");
          (navigate as any)({ to: "/login", replace: true });
          return;
        }

        toast.success("Berhasil masuk");
        navigate({ to: "/dashboard", replace: true });
      } catch (err) {
        console.error("[OAuth] Unexpected callback error:", err);
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
        (navigate as any)({ to: "/login", replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground">Memproses masuk...</p>
      </div>
    </div>
  );
}
