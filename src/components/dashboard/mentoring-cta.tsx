import { Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap } from "lucide-react";

export function MentoringCta() {
  return (
    <aside className="rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-800 p-6 text-white">
        <h3 className="font-display text-lg font-bold leading-tight">
          Butuh bimbingan lebih?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Private mentoring dari HR berpengalaman untuk persiapan karier yang lebih matang.
        </p>
        <Link
          to="/private-coaching"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Lihat Private Mentoring
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
