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
    <div className="pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">
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
    to: "/dashboard" as const,
    label: "ATS Scoring",
    icon: BarChart3,
    isActive: (pathname: string) => pathname.startsWith("/score"),
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-primary-foreground/15 bg-primary px-2 pb-[env(safe-area-inset-bottom)] pt-2 text-primary-foreground shadow-[0_-16px_35px_rgba(15,23,42,0.18)] md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
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
                  "relative -mt-8 flex min-h-[4.75rem] flex-col items-center justify-end gap-1 rounded-2xl bg-primary-foreground px-1 pb-2 pt-2 text-[10px] font-bold leading-tight text-primary shadow-xl ring-4 ring-background transition-transform active:scale-95",
                  active && "bg-white",
                )}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
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
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold leading-tight transition-colors active:scale-95",
                active
                  ? "bg-primary-foreground/15 text-white"
                  : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-white",
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
