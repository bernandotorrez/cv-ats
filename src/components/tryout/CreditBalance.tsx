/**
 * CreditBalance — Widget sisa kredit tryout.
 * Dark mode & responsive support.
 */
import { Link } from "@tanstack/react-router";
import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  variant?: "card" | "inline";
};

export function CreditBalance({
  totalCredits,
  usedCredits,
  remainingCredits,
  variant = "card",
}: Props) {
  const hasCredits = remainingCredits > 0;

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="font-bold">{remainingCredits}</span>
        <span className="text-muted-foreground">kredit tersisa</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-zinc-950 shadow-xl shadow-amber-500/5">
      {/* Glow Effect */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-600/20 blur-3xl"></div>
      
      <div className="relative z-10 p-5 sm:p-7">
        <div className="flex items-center gap-2 text-amber-400">
          <Coins className="h-5 w-5" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
            Kredit Tryout
          </span>
        </div>
        
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-6xl font-black tracking-tight text-white drop-shadow-md">
            {remainingCredits}
          </span>
          <span className="text-sm font-medium text-zinc-400">/ {totalCredits}</span>
        </div>
        
        <p className="mt-2 text-xs text-zinc-400">
          {usedCredits > 0
            ? `${usedCredits} kredit telah digunakan`
            : "Belum pernah dipakai"}
        </p>
      </div>

      <div className="relative z-10 border-t border-white/10 bg-white/5 p-5">
        {hasCredits ? (
          <p className="text-xs text-zinc-300">
            Setiap 1 tryout menggunakan 1 kredit. Ayo capai skor terbaikmu!
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-amber-400">
              Kredit habis. Top-up untuk lanjut simulasi.
            </p>
            <Button asChild size="sm" className="w-full gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md hover:from-amber-500 hover:to-orange-500 transition-all hover:scale-[1.02]">
              <Link to={"/tryout/beli" as never}>
                <Plus className="h-4 w-4" /> Beli Kredit
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}