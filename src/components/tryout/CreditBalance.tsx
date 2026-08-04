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
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white sm:p-5">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Kredit Tryout
          </span>
        </div>
        <div className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          {remainingCredits}
          <span className="ml-1 text-sm font-medium opacity-80 sm:text-base">/ {totalCredits}</span>
        </div>
        <p className="mt-1 text-xs opacity-90">
          {usedCredits > 0
            ? `${usedCredits} sudah dipakai`
            : "Belum pernah dipakai"}
        </p>
      </div>

      <div className="p-4">
        {hasCredits ? (
          <p className="text-xs text-muted-foreground">
            Setiap tryout yang dimulai akan menggunakan 1 kredit.
          </p>
        ) : (
          <>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Kredit kamu habis. Beli paket untuk lanjut tryout.
            </p>
            <Button asChild size="sm" className="mt-3 w-full gap-1.5">
              <Link to={"/tryout/beli" as never}>
                <Plus className="h-4 w-4" />
                Beli Kredit
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}