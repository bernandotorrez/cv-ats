import { Link } from "@tanstack/react-router";
import { ArrowRight, Trophy } from "lucide-react";

export function TryoutPromo() {
  return (
    <section
      aria-labelledby="tryout-promo-title"
      className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-yellow-300 text-gray-950">
          <Trophy aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
            Tryout CPNS 2026
          </p>
          <h2 id="tryout-promo-title" className="mt-0.5 font-bold leading-snug text-gray-900">
            Simulasi SKD 110 soal, standar BKN
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            TWK, TIU, dan TKP dengan timer 100 menit dan skor langsung keluar.
          </p>
        </div>
      </div>
      <Link
        to="/tryout"
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-bold text-white transition-colors hover:bg-gray-800"
      >
        Mulai tryout
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
