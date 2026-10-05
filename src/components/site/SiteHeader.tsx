import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Newspaper,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; badge?: string };
type LearnItem = { to: string; label: string; desc: string; icon: LucideIcon };

const nav: NavItem[] = [
  { to: "/fitur", label: "Fitur" },
  { to: "/template", label: "Template" },
  { to: "/lowongan", label: "Lowongan" },
  { to: "/tryout-cpns", label: "Tryout CPNS", badge: "2026" },
  { to: "/harga", label: "Harga" },
];

const learn: LearnItem[] = [
  {
    to: "/panduan-cv-ats",
    label: "Panduan CV ATS",
    desc: "Cara bikin CV yang lolos sistem ATS",
    icon: BookOpen,
  },
  {
    to: "/tips-interview",
    label: "Tips Interview",
    desc: "Persiapan & contoh jawaban wawancara",
    icon: MessagesSquare,
  },
  {
    to: "/blog",
    label: "Blog Karier",
    desc: "Artikel seputar CV dan pencarian kerja",
    icon: Newspaper,
  },
  {
    to: "/private-coaching",
    label: "Private Mentoring",
    desc: "Sesi 1:1 bersama HR recruiter",
    icon: UserRoundCheck,
  },
];

const isActivePath = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`);

const desktopLinkClass =
  "inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold transition-colors xl:px-3.5";
const desktopIdle = "text-gray-700 hover:bg-gray-100 hover:text-gray-900";
const desktopActive = "bg-green-50 text-green-800";

function TryoutBadge({ badge }: { badge: string }) {
  return (
    <span className="rounded-full bg-yellow-300 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-gray-900">
      {badge}
    </span>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [admin, setAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const routerState = useRouterState();
  const isNavigating = routerState.isLoading;
  const pathname = routerState.location.pathname;
  const learnActive = learn.some((item) => isActivePath(pathname, item.to));

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

  // Bayangan header saat halaman di-scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tutup menu mobile saat pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Menu mobile: kunci scroll body + tutup dengan Escape
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition-[border-color,box-shadow] supports-[backdrop-filter]:bg-white/80 print:hidden",
        scrolled || open ? "border-gray-200 shadow-sm" : "border-transparent",
      )}
    >
      {/* Navigation loading bar */}
      {isNavigating && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden">
          <div className="h-full w-full animate-indeterminate-loading bg-green-700" />
        </div>
      )}
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="CV Pintar — Beranda">
          <img
            src="/apple-touch-icon.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-contain"
          />
          <span className="flex items-center gap-1 font-display text-lg font-extrabold text-gray-900">
            <span className="text-green-700">CV</span>
            <span>PINTAR</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(desktopLinkClass, desktopIdle)}
              activeProps={{ className: cn(desktopLinkClass, desktopActive) }}
            >
              {item.badge && <Trophy aria-hidden="true" className="h-4 w-4 text-amber-500" />}
              {item.label}
              {item.badge && <TryoutBadge badge={item.badge} />}
            </Link>
          ))}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={cn(
                desktopLinkClass,
                learnActive ? desktopActive : desktopIdle,
                "outline-none focus-visible:ring-2 focus-visible:ring-green-700 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900",
              )}
            >
              Belajar
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-80 rounded-2xl border-gray-200 bg-white p-2 shadow-xl"
            >
              {learn.map((item) => (
                <DropdownMenuItem
                  key={item.to}
                  asChild
                  className="cursor-pointer rounded-xl p-3 focus:bg-green-50"
                >
                  <Link to={item.to} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                      <item.icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-900">{item.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-gray-600">
                        {item.desc}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {user ? (
            <>
              {admin && (
                <Link
                  to="/admin"
                  aria-label="Admin"
                  title="Admin"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut()}
                aria-label="Keluar"
                title="Keluar"
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                <span className="hidden xl:inline">Keluar</span>
              </button>
              <Link
                to="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-700 px-5 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800"
              >
                <LayoutDashboard aria-hidden="true" className="h-4 w-4" /> Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                search={{ redirect: "/dashboard" }}
                className="inline-flex h-10 items-center rounded-full px-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-green-700 px-5 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800"
              >
                Daftar Gratis
                <ArrowRight aria-hidden="true" className="hidden h-4 w-4 xl:block" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-900 transition-colors hover:bg-gray-100 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-gray-200 bg-white lg:hidden"
        >
          <nav aria-label="Navigasi mobile" className="container-page flex flex-col py-5">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-600">Menu</p>
            <ul className="mt-2 grid gap-1">
              {nav.map((item) => {
                const active = isActivePath(pathname, item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-2 rounded-xl px-3 text-base font-semibold transition-colors",
                        active ? "bg-green-50 text-green-800" : "text-gray-900 hover:bg-gray-50",
                      )}
                    >
                      {item.badge && (
                        <Trophy aria-hidden="true" className="h-4 w-4 text-amber-500" />
                      )}
                      {item.label}
                      {item.badge && <TryoutBadge badge={item.badge} />}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 px-3 text-xs font-bold uppercase tracking-wider text-gray-600">
              Belajar
            </p>
            <ul className="mt-2 grid gap-1">
              {learn.map((item) => {
                const active = isActivePath(pathname, item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition-colors",
                        active ? "bg-green-50" : "hover:bg-gray-50",
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                        <item.icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-base font-semibold",
                            active ? "text-green-800" : "text-gray-900",
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="block text-xs text-gray-600">{item.desc}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 grid gap-2 border-t border-gray-200 pt-6">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-700 text-base font-bold text-white hover:bg-green-800"
                  >
                    <LayoutDashboard aria-hidden="true" className="h-5 w-5" /> Dashboard
                  </Link>
                  {admin && (
                    <Link
                      to="/admin"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 text-base font-semibold text-gray-800 hover:border-green-700 hover:bg-green-50"
                    >
                      <ShieldCheck aria-hidden="true" className="h-5 w-5" /> Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut aria-hidden="true" className="h-5 w-5" /> Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-700 text-base font-bold text-white hover:bg-green-800"
                  >
                    Daftar Gratis
                    <ArrowRight aria-hidden="true" className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    search={{ redirect: "/dashboard" }}
                    className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-gray-300 text-base font-semibold text-gray-800 hover:border-green-700 hover:bg-green-50"
                  >
                    Masuk
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
