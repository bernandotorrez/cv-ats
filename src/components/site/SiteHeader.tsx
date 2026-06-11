import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, FileText, X, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/fitur", label: "Fitur" },
  { to: "/template", label: "Template" },
  { to: "/lowongan", label: "Lowongan" },
  { to: "/private-coaching", label: "Private Mentoring" },
  { to: "/harga", label: "Harga" },
  { to: "/panduan-cv-ats", label: "Panduan" },
  { to: "/tips-interview", label: "Tips Interview" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const routerState = useRouterState();
  const isNavigating = routerState.isLoading;

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setAdmin(false);
      return;
    }

    isAdmin(user.id).then((ok) => {
      if (!cancelled) setAdmin(ok);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 print:hidden">
      {/* Navigation loading bar */}
      {isNavigating && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden">
          <div className="h-full w-full animate-indeterminate-loading bg-primary" />
        </div>
      )}
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg font-bold text-foreground"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <span>CV Pintar</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {admin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => signOut()}>
                Keluar
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login" search={{ redirect: "/dashboard" }}>
                  Masuk
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Daftar Gratis</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav aria-label="Navigasi mobile" className="container-page flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  {admin && (
                    <Button asChild variant="outline">
                      <Link to="/admin" onClick={() => setOpen(false)}>
                        <ShieldCheck className="h-4 w-4" /> Admin
                      </Link>
                    </Button>
                  )}
                  <Button asChild>
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                  >
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link
                      to="/login"
                      search={{ redirect: "/dashboard" }}
                      onClick={() => setOpen(false)}
                    >
                      Masuk
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register" onClick={() => setOpen(false)}>
                      Daftar Gratis
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
