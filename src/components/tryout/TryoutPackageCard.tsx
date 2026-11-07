/**
 * TryoutPackageCard — Kartu paket tryout (gaya sama dengan landing & materi
 * promosi). Harga & checkout ditentukan server; tombol hanya mengirim
 * product key lewat onBuy.
 */
import { ArrowRight, Check, Loader2, MessageCircle, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rupiah } from "@/lib/tryout-display";

type Props = {
  slug: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  features: string[];
  featured?: boolean;
  /** Persen hemat dibanding harga per tryout termahal (0 = tidak tampil). */
  savingsPercent?: number;
  hasPembahasan?: boolean;
  hasAnalytics?: boolean;
  hasLeaderboard?: boolean;
  /** Bila diisi, tombol beli memanggil checkout (pembayaran QRIS). */
  onBuy?: () => void;
  buying?: boolean;
  buyDisabled?: boolean;
  whatsappNumber?: string;
};

export function TryoutPackageCard({
  name,
  description,
  price,
  credits,
  features,
  featured = false,
  savingsPercent = 0,
  onBuy,
  buying = false,
  buyDisabled = false,
  whatsappNumber = "6285190607141",
}: Props) {
  const perTryout = credits > 0 ? Math.round(price / credits) : price;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Halo, saya ingin beli paket ${name} (${credits}x tryout) - ${rupiah(price)}.`,
  )}`;

  return (
    <article
      aria-label={`Paket ${name}`}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md",
        featured
          ? "border-transparent bg-gradient-to-br from-emerald-700 to-emerald-950 text-white shadow-lg shadow-emerald-900/20"
          : "bg-card",
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-extrabold tracking-tight">{name}</h3>
          {featured && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yellow-300 px-2.5 py-1 text-[11px] font-extrabold text-gray-950">
              <Sparkles className="h-3 w-3" aria-hidden /> Paling hemat
            </span>
          )}
        </div>
        {description && (
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed",
              featured ? "text-emerald-50/90" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        )}

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-extrabold tabular-nums tracking-tight">
            {rupiah(price)}
          </span>
        </div>
        <p
          className={cn(
            "mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold",
            featured ? "text-emerald-100" : "text-primary",
          )}
        >
          {credits}x tryout · {rupiah(perTryout)}/tryout
          {savingsPercent > 0 && (
            <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[11px] font-bold text-gray-950">
              Hemat {savingsPercent}%
            </span>
          )}
        </p>

        <ul className="mt-5 space-y-2.5 text-sm">
          {features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <Check
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  featured ? "text-yellow-300" : "text-emerald-600 dark:text-emerald-400",
                )}
                aria-hidden
              />
              <span className={featured ? "text-white" : "text-foreground"}>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={cn(
          "mt-auto space-y-2.5 border-t p-5",
          featured ? "border-white/15 bg-black/10" : "bg-muted/30",
        )}
      >
        {onBuy ? (
          <Button
            type="button"
            onClick={onBuy}
            disabled={buyDisabled || buying}
            className={cn(
              "h-11 w-full gap-2 rounded-xl text-base font-bold",
              featured && "bg-yellow-300 text-gray-950 hover:bg-yellow-200",
            )}
            variant={featured ? "default" : "outline"}
          >
            {buying ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden />
            )}
            {buying ? "Membuka pembayaran…" : `Beli ${name}`}
          </Button>
        ) : (
          <Button asChild className="h-11 w-full gap-2 rounded-xl">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden /> Beli via WhatsApp
            </a>
          </Button>
        )}
        <p
          className={cn(
            "flex items-center justify-center gap-1.5 text-center text-[11px]",
            featured ? "text-emerald-100/80" : "text-muted-foreground",
          )}
        >
          <QrCode className="h-3.5 w-3.5" aria-hidden />
          {onBuy
            ? "Bayar via QRIS · kredit aktif otomatis"
            : "Transfer manual · aktivasi setelah bukti transfer"}
        </p>
      </div>
    </article>
  );
}
