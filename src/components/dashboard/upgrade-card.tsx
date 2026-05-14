import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Crown, FileCheck, FileText, Sparkles } from "lucide-react";

export function UpgradeCard() {
  return (
    <aside className="rounded-2xl border border-amber-400/35 bg-amber-50/70 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Crown className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display font-bold text-foreground">Saatnya naik ritme</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Upgrade untuk lebih banyak CV, review, cover letter, dan simulasi interview.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {[
          { icon: FileText, text: "Lebih banyak versi CV untuk tiap role" },
          { icon: Sparkles, text: "AI saran dan chat lebih lega" },
          { icon: FileCheck, text: "Cover letter yang lebih cepat dibuat" },
          { icon: Brain, text: "Simulasi wawancara AI untuk latihan" },
        ].map((item) => (
          <li key={item.text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
              <item.icon className="h-3.5 w-3.5" />
            </span>
            {item.text}
          </li>
        ))}
      </ul>

      <Button asChild className="mt-5 w-full gap-2">
        <Link to="/harga">
          Lihat Paket
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </aside>
  );
}
