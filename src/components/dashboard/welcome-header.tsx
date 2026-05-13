import { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Sun, Sunset, Moon, MoonStar } from "lucide-react";
import type { ReactNode } from "react";

interface WelcomeHeaderProps {
  user: User | null;
  onCreateCv?: () => void;
}

export function WelcomeHeader({ user, onCreateCv }: WelcomeHeaderProps) {
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna";

  const hour = new Date().getHours();
  let greeting = "Halo";
  let Icon: ReactNode;
  if (hour < 11) { greeting = "Selamat pagi"; Icon = <Sun className="h-7 w-7" />; }
  else if (hour < 15) { greeting = "Selamat siang"; Icon = <Sunset className="h-7 w-7" />; }
  else if (hour < 18) { greeting = "Selamat sore"; Icon = <Moon className="h-7 w-7" />; }
  else { greeting = "Selamat malam"; Icon = <MoonStar className="h-7 w-7" />; }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-8 text-primary-foreground md:px-8">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-secondary/30 blur-xl" />
      <div className="pointer-events-none absolute right-20 top-4 h-3 w-3 rounded-full bg-warning animate-pulse" />
      <div className="pointer-events-none absolute right-40 bottom-6 h-2 w-2 rounded-full bg-secondary animate-pulse delay-700" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-primary-foreground">
              {Icon}
            </span>
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              {greeting}, {displayName}!
            </h1>
          </div>
          <p className="mt-2 max-w-md text-sm text-primary-foreground/80">
            Pantau progres CV, gunakan tools AI canggih, dan tingkatkan peluang karirmu hari ini.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {onCreateCv ? (
            <Button
              size="lg"
              onClick={onCreateCv}
              className="gap-2 bg-white text-primary shadow-lg shadow-black/10 hover:bg-white/90 hover:text-primary"
            >
              <Plus className="h-4 w-4" /> Buat CV Baru
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="gap-2 bg-white text-primary shadow-lg shadow-black/10 hover:bg-white/90 hover:text-primary"
            >
              <Link to="/cv">
                <Plus className="h-4 w-4" /> Buat CV Baru
              </Link>
            </Button>
          )}
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="gap-2 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
          >
            <Link to="/cv">
              <Sparkles className="h-4 w-4" /> Kelola CV
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
