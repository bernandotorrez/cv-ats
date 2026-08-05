import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, FileText, X, LayoutDashboard, ShieldCheck, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/fitur", label: "Fitur" },
  { to: "/template", label: "Template" },
  { to: "/lowongan", label: "Lowongan" },
  { to: "/tryout-cpns", label: "Tryout CPNS", badge: "2026" },
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
          <img
            src="/apple-touch-icon.png"
            alt="CV Pintar Logo"
            className="h-8 w-8 object-contain rounded-full"
          />
          <span className="flex items-center gap-1 font-display text-lg font-extrabold text-gray-900">
            <span className="text-green-700">CV</span>
            <span>PINTAR</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs lg:text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                "badge" in item && item.badge && "relative",
              )}
              activeProps={{
                className: "rounded-md px-2 py-1.5 text-xs lg:text-sm font-medium text-foreground bg-muted",
              }}
            >
              <span className="flex items-center gap-1">
                {"badge" in item && item.badge && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                {item.label}
                {"badge" in item && item.badge && (
                  <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 lg:flex">
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
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-gray-950 font-medium"
              >
                <Link to="/login" search={{ redirect: "/dashboard" }}>
                  Masuk
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-md"
              >
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <nav aria-label="Navigasi mobile" className="container-page flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-1.5">
                  {"badge" in item && item.badge && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                  {item.label}
                  {"badge" in item && item.badge && (
                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
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
