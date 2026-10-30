import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/analytics";

const DEVICE_REGISTERED_KEY = "cvp_device_registered";

/**
 * Catat device (cvp_visitor_id) & IP akun ini sekali per sesi browser untuk
 * deteksi multi-akun Free (lihat RPC register_device). Gagal = diam saja.
 */
function registerDeviceOnce(userId: string) {
  try {
    if (sessionStorage.getItem(DEVICE_REGISTERED_KEY) === userId) return;
    sessionStorage.setItem(DEVICE_REGISTERED_KEY, userId);
  } catch {
    // sessionStorage tidak tersedia: tetap catat (idempotent di server)
  }
  // register_device belum ada di generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  void (supabase as any)
    .rpc("register_device", { p_visitor_id: getVisitorId() })
    .then(({ error }: { error: { message: string } | null }) => {
      if (error) console.warn("register_device failed:", error.message);
    });
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    // Then fetch initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) registerDeviceOnce(userId);
  }, [userId]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Fallback: clear session locally if remote call fails
      const key = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );
      if (key) localStorage.removeItem(key);
    }
    setSession(null);
    setLoading(false);
    // Force navigate to home to escape authenticated route skeleton
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
