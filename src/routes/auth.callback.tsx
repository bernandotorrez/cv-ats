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
        // Exchange the auth code for a session (PKCE flow)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (error) {
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
