/**
 * CreditBalance — Saldo kredit tryout (tema hijau, selaras halaman ujian/hasil).
 */
import { Link } from "@tanstack/react-router";
import { Coins, Plus, ShieldCheck } from "lucide-react";
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
        <Coins className="h-4 w-4 text-primary" aria-hidden />
        <span className="font-bold tabular-nums">{remainingCredits}</span>
        <span className="text-muted-foreground">kredit tersisa</span>
      </div>
    );
  }

  const usedPct = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

  return (
    <section
      aria-label="Kredit tryout"
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <div className="relative bg-gradient-to-br from-primary to-emerald-700 p-5 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        />
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/85">
          <Coins className="h-4 w-4" aria-hidden /> Kredit tryout
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-5xl font-extrabold tabular-nums leading-none">
            {remainingCredits}
          </span>
          <span className="text-sm text-white/80">tersisa</span>
        </div>
        {totalCredits > 0 && (
          <>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={usedPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Kredit terpakai"
            >
              <div className="h-full rounded-full bg-white" style={{ width: `${usedPct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-white/80">
              {usedCredits} dari {totalCredits} kredit sudah dipakai
            </p>
          </>
        )}
      </div>

      <div className="space-y-3 p-4">
        {hasCredits ? (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />1 tryout = 1
            kredit. Melanjutkan ujian yang sedang berjalan tidak memotong kredit lagi.
          </p>
        ) : (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Kredit habis. Beli paket untuk mulai tryout berikutnya.
          </p>
        )}
        <Button
          asChild
          variant={hasCredits ? "outline" : "default"}
          className="h-10 w-full gap-1.5 rounded-xl"
        >
          <Link to={"/tryout/beli" as never}>
            <Plus className="h-4 w-4" aria-hidden /> {hasCredits ? "Tambah kredit" : "Beli kredit"}
          </Link>
        </Button>
      </div>
    </section>
  );
}
