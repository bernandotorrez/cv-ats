import { createFileRoute, Outlet, Link, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  LayoutDashboard,
  Users,
  Palette,
  ArrowLeft,
  Loader2,
  BriefcaseBusiness,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin" as const, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users" as const, icon: Users, label: "Users" },
  { to: "/admin/templates" as const, icon: Palette, label: "Templates" },
  { to: "/admin/jobs" as const, icon: BriefcaseBusiness, label: "Lowongan" },
];

function AdminLayout() {
  const { user } = useAuth();
  const [admin, setAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Shield className="h-5 w-5 text-primary" /> Admin Panel
        </h1>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:gap-6">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 hidden md:block">
          <div className="space-y-1 sticky top-24">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2",
                  pathname === item.to && "bg-muted font-medium",
                )}
              >
                <Link to={item.to}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.to}
              asChild
              variant={pathname === item.to ? "default" : "outline"}
              size="sm"
            >
              <Link to={item.to} className="gap-1">
                <item.icon className="h-3.5 w-3.5" /> {item.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
