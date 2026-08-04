/**
 * TryoutPackageCard — Kartu paket pembelian tryout.
 * Dark mode & responsive support.
 */
import { Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  features: string[];
  featured?: boolean;
  hasPembahasan?: boolean;
  hasAnalytics?: boolean;
  hasLeaderboard?: boolean;
  lynkUrl?: string;
  whatsappNumber?: string;
};

export function TryoutPackageCard({
  slug,
  name,
  description,
  price,
  credits,
  features,
  featured = false,
  hasPembahasan = false,
  hasAnalytics = false,
  hasLeaderboard = false,
  lynkUrl,
  whatsappNumber = "6281234567890",
}: Props) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);

  const whatsappMessage = encodeURIComponent(
    `Halo, saya ingin beli paket ${name} (${credits}x tryout) - ${formattedPrice}.`,
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border-2 bg-card shadow-sm transition hover:shadow-md",
        featured ? "border-primary" : "border-border",
      )}
    >
      {featured && (
        <div className="absolute right-3 top-3">
          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
            <Star className="mr-1 h-3 w-3" />
            Best Value
          </Badge>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-bold text-primary sm:text-3xl">
              {formattedPrice}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {credits}x akses tryout
          </p>
        </div>

        <ul className="mt-4 space-y-1.5 sm:mt-5">
          {features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>

        {(hasPembahasan || hasAnalytics || hasLeaderboard) && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
            {hasPembahasan && <Badge variant="secondary">📖 Pembahasan</Badge>}
            {hasAnalytics && <Badge variant="secondary">📊 Analytics</Badge>}
            {hasLeaderboard && <Badge variant="secondary">🏆 Leaderboard</Badge>}
          </div>
        )}
      </div>

      <div className="mt-auto space-y-2 border-t bg-muted/30 p-4">
        {lynkUrl ? (
          <Button asChild className="w-full">
            <a href={lynkUrl} target="_blank" rel="noopener noreferrer">
              Beli via Lynk
            </a>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Beli via WhatsApp
            </a>
          </Button>
        )}
        <p className="text-center text-[10px] text-muted-foreground">
          Transfer manual · aktivasi 1x24 jam setelah bukti transfer
        </p>
      </div>
    </article>
  );
}