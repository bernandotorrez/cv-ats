import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Crown, Sparkles, FileText, FileCheck, Zap, Brain, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpgradeCard() {
  return (
    <Card className="relative overflow-hidden border-2 border-warning/30 bg-gradient-to-br from-warning/5 via-card to-secondary/5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-warning/10 blur-xl" />
      <div className="pointer-events-none absolute -bottom-4 left-8 h-16 w-16 rounded-full bg-secondary/20 blur-lg" />

      <CardContent className="relative p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20 text-xl">
            🚀
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground">Buka Semua Fitur</h3>
            <p className="text-xs text-muted-foreground">Upgrade & level-up karirmu</p>
          </div>
        </div>

        <ul className="space-y-2.5">
          {[
            { icon: FileText, text: "CV unlimited — tanpa batas" },
            { icon: Sparkles, text: "50x+ AI saran per bulan" },
            { icon: FileCheck, text: "Cover letter AI otomatis" },
            { icon: Brain, text: "Simulasi wawancara AI" },
            { icon: Crown, text: "Template premium & tanpa watermark" },
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <item.icon className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </li>
          ))}
        </ul>

        <Separator className="my-5" />

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Mulai dari</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-bold text-foreground">Rp 14.900</span>
              <span className="text-xs text-muted-foreground">/bln</span>
            </div>
          </div>
          <Button asChild className="gap-2 shadow-lg shadow-primary/20">
            <Link to="/harga">
              <Zap className="h-4 w-4" /> Upgrade
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
