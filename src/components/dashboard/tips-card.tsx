import { Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb } from "lucide-react";

const tips = [
  { tip: "Mulai bullet pengalaman dengan kata kerja aktif.", link: "/panduan-cv-ats" },
  { tip: "Tambahkan angka agar dampak kerjamu lebih mudah dipercaya.", link: "/panduan-cv-ats" },
  { tip: "Ambil keyword dari job description sebelum apply.", link: "/blog/keyword-cv-ats" },
  { tip: "Export PDF saat struktur dan skor sudah rapi.", link: "/panduan-cv-ats" },
] as const;

export function TipsCard() {
  return (
    <aside className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-600" />
        <h3 className="font-display font-bold text-foreground">Tips cepat</h3>
      </div>
      <ul className="space-y-2">
        {tips.map((item, i) => (
          <li key={item.tip}>
            <Link
              to={item.link}
              className="group flex items-start gap-3 rounded-xl p-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="flex-1 leading-6">{item.tip}</span>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
