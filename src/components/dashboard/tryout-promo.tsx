/**
 * TryoutPromo — kartu ajakan Tryout CPNS di sidebar dashboard utama.
 * Gaya mengikuti fitur tryout (kartu hijau, komposisi TWK/TIU/TKP).
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Clock, Trophy } from "lucide-react";
import { CompositionBar } from "@/components/tryout/DashboardWidgets";

const POINTS = [
  { icon: Clock, text: "110 soal · timer 100 menit" },
  { icon: BarChart3, text: "Skor, peringkat & rekomendasi belajar" },
  { icon: BookOpen, text: "Pembahasan detail tiap soal (Paket Lengkap)" },
];

export function TryoutPromo({ highlight = false }: { highlight?: boolean }) {
  const card = (
    <section
      aria-labelledby="tryout-promo-title"
      className={
        highlight
          ? "overflow-hidden rounded-2xl bg-card"
          : "overflow-hidden rounded-2xl border bg-card shadow-sm"
      }
    >
      <div className="relative bg-gradient-to-br from-emerald-700 to-emerald-900 p-5 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85">
            <Trophy aria-hidden="true" className="h-3.5 w-3.5" /> Tryout CPNS 2026
          </p>
          {highlight && (
            <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gray-950">
              Baru
            </span>
          )}
        </div>
        <h2
          id="tryout-promo-title"
          className="mt-1.5 font-display text-lg font-extrabold leading-snug"
        >
          Latihan SKD seperti CAT BKN
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-white/85">
          Tahu skormu, jarak ke passing grade, dan materi yang perlu dikejar.
        </p>
      </div>

      <div className="space-y-4 p-5">
        <CompositionBar twk={30} tiu={35} tkp={45} />
        <ul className="space-y-2">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-start gap-2 text-sm text-foreground">
              <p.icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {p.text}
            </li>
          ))}
        </ul>
        <Link
          to="/tryout"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          Buka tryout
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );

  return highlight ? <div className="highlight-border">{card}</div> : card;
}
