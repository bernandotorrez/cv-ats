import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Crown, Infinity as InfinityIcon, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuotaItem {
  icon: LucideIcon;
  label: string;
  used: number;
  max: number | null;
  visible: boolean;
}

interface PlanCardProps {
  tier: "free" | "starter" | "pro";
  tierName: string;
  /** Tanggal akhir paket berbayar (sudah diformat), null untuk Free. */
  activeUntil: string | null;
  quotas: QuotaItem[];
}

const INITIAL_ROWS = 4;

function QuotaRow({ q }: { q: QuotaItem }) {
  const notIncluded = q.max !== null && q.max <= 0;
  const ratio = q.max === null || q.max <= 0 ? 0 : Math.min(q.used / q.max, 1);
  const exhausted = q.max !== null && q.max > 0 && q.used >= q.max;
  const warning = !exhausted && ratio >= 0.8;

  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span
          className={cn("flex min-w-0 items-center gap-2", notIncluded && "text-muted-foreground")}
        >
          <q.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{q.label}</span>
        </span>
        <span
          className={cn(
            "shrink-0 tabular-nums text-xs font-semibold",
            exhausted ? "text-red-600" : warning ? "text-amber-600" : "text-foreground",
          )}
        >
          {q.max === null ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <InfinityIcon aria-hidden="true" className="h-3.5 w-3.5" /> Tanpa batas
            </span>
          ) : notIncluded ? (
            <span className="font-medium text-muted-foreground">Tidak termasuk</span>
          ) : (
            `${q.used} / ${q.max}`
          )}
        </span>
      </div>
      {q.max !== null && !notIncluded && (
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`Pemakaian ${q.label}`}
          aria-valuenow={q.used}
          aria-valuemin={0}
          aria-valuemax={q.max}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              exhausted ? "bg-red-500" : warning ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${Math.max(ratio * 100, q.used > 0 ? 4 : 0)}%` }}
          />
        </div>
      )}
    </li>
  );
}

export function PlanCard({ tier, tierName, activeUntil, quotas }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = quotas.filter((q) => q.visible);
  const rows = expanded ? visible : visible.slice(0, INITIAL_ROWS);
  const hidden = visible.length - INITIAL_ROWS;
  const canUpgrade = tier !== "pro";

  return (
    <section
      aria-labelledby="plan-title"
      className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Paket kamu
          </p>
          <h2
            id="plan-title"
            className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold"
          >
            {tierName}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              Aktif
            </span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeUntil ? `Berlaku hingga ${activeUntil}` : "Gratis selamanya"}
          </p>
        </div>
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
            tier === "pro" ? "bg-yellow-300 text-gray-950" : "bg-primary/10 text-primary",
          )}
        >
          <Crown aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-bold">Kuota bulan ini</h3>
          <span className="text-[11px] text-muted-foreground">Reset tiap awal bulan</span>
        </div>
        <ul className="mt-1 divide-y divide-border/70">
          {rows.map((q) => (
            <QuotaRow key={q.label} q={q} />
          ))}
        </ul>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {expanded ? "Tampilkan lebih sedikit" : `Lihat ${hidden} kuota lainnya`}
            <ChevronDown
              aria-hidden="true"
              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
            />
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-2">
        <Link
          to="/harga"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors",
            canUpgrade
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border-2 border-border hover:border-primary hover:text-primary",
          )}
        >
          {canUpgrade ? (tier === "free" ? "Upgrade paket" : "Upgrade ke Pro") : "Kelola paket"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          to="/pembayaran"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Receipt aria-hidden="true" className="h-3.5 w-3.5" />
          Riwayat pembayaran & invoice
        </Link>
      </div>
    </section>
  );
}
