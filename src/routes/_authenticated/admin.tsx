import { createFileRoute, Outlet, Link, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Shield,
  LayoutDashboard,
  BarChart3,
  Users,
  Palette,
  ArrowLeft,
  Loader2,
  BriefcaseBusiness,
  Trophy,
  Menu,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin" as const, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/analytics" as const, icon: BarChart3, label: "Analitik Pengunjung" },
  { to: "/admin/users" as const, icon: Users, label: "Users" },
  { to: "/admin/templates" as const, icon: Palette, label: "Templates" },
  { to: "/admin/jobs" as const, icon: BriefcaseBusiness, label: "Lowongan" },
  { to: "/admin/tryout" as const, icon: Trophy, label: "Tryout" },
];

function AdminLayout() {
  const { user } = useAuth();
  const [admin, setAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentSection = NAV_ITEMS.find((item) => item.to === pathname)?.label ?? "Admin Panel";

  useEffect(() => {
    if (user?.id)
      isAdmin(user.id).then((ok) => {
        setAdmin(ok);
        setChecking(false);
      });
    else setChecking(false);
  }, [user]);

  if (checking) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="container-page py-20 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Akses Ditolak</h1>
        <p className="mt-2 text-muted-foreground">Hanya admin yang bisa mengakses panel ini.</p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <h1 className="flex min-w-0 items-center gap-2 font-display text-lg font-bold sm:text-2xl">
            <Shield className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate">Admin Panel</span>
            <span className="hidden text-muted-foreground sm:inline">/</span>
            <span className="hidden truncate text-muted-foreground sm:inline">
              {currentSection}
            </span>
          </h1>
        </div>

        {/* Mobile nav trigger */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 md:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-4 w-4" />
          Menu
        </Button>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:gap-6">
        {/* Desktop sidebar */}
        <nav className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-24 space-y-1 rounded-xl border border-sidebar-border bg-sidebar p-2 text-sidebar-foreground">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.to
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile nav drawer */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
            <SheetHeader className="border-b border-sidebar-border p-4 text-left">
              <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
                <Shield className="h-4 w-4 text-primary" /> Admin Panel
              </SheetTitle>
              <SheetDescription className="sr-only">Navigasi panel admin</SheetDescription>
            </SheetHeader>
            <nav className="space-y-1 p-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as never}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === item.to
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
