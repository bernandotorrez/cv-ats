import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { BarChart3, ClipboardCheck, FileText, Home, PenLine } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <Outlet />
      <AuthenticatedBottomNav />
    </div>
  );
}

const bottomNavItems = [
  {
    to: "/dashboard" as const,
    label: "Dashboard",
    icon: Home,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    to: "/score" as const,
    label: "ATS Scoring",
    icon: BarChart3,
    isActive: (pathname: string) => pathname === "/score" || pathname.startsWith("/score/"),
  },
  {
    to: "/cv" as const,
    label: "Kelola CV",
    icon: FileText,
    featured: true,
    isActive: (pathname: string) => pathname === "/cv" || pathname.startsWith("/cv/"),
  },
  {
    to: "/cv-review" as const,
    label: "CV Review",
    icon: ClipboardCheck,
    isActive: (pathname: string) => pathname.startsWith("/cv-review"),
  },
  {
    to: "/tools" as const,
    label: "Cover Letter",
    icon: PenLine,
    isActive: (pathname: string) => pathname.startsWith("/tools"),
  },
];

function AuthenticatedBottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav className="fixed bottom-4 left-3 right-[4.75rem] z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5 items-end gap-1 rounded-[1.75rem] border border-white/60 bg-white/70 px-1.5 py-1.5 text-foreground shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-2xl ring-1 ring-black/5 supports-[backdrop-filter]:bg-white/55">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          if (item.featured) {
            return (
              <Link
                key={item.label}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  "relative -mt-7 flex min-h-[4.65rem] flex-col items-center justify-end gap-1 rounded-[1.4rem] bg-white/90 px-1 pb-2 pt-2 text-[9px] font-bold leading-tight text-primary shadow-[0_12px_28px_rgba(15,23,42,0.18)] ring-4 ring-background/95 backdrop-blur-xl transition-transform active:scale-95",
                  active && "bg-white",
                )}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-1 ring-white/30">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="max-w-[4rem] text-center">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1 py-1.5 text-[9px] font-semibold leading-tight transition active:scale-95",
                active
                  ? "bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15"
                  : "text-foreground/65 hover:bg-white/55 hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-[4rem] text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
