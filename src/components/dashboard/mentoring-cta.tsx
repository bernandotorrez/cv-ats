import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function MentoringCta() {
  return (
    <aside className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-[#12664f] via-[#1c8066] to-[#7ebf43] text-white p-4 sm:p-6 min-h-[200px] sm:min-h-[220px] flex flex-col justify-between min-w-0">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#94d152]/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-[#12664f]/30 blur-xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative flex flex-col xs:flex-row xs:items-center justify-between gap-4 z-10">
        {/* Left Side Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-bold leading-tight tracking-tight mb-2">
            Butuh bimbingan lebih?
          </h3>
          <p className="text-[13px] leading-relaxed text-white/90">
            Private mentoring dengan HR berpengalaman untuk persiapan karier yang lebih matang.
          </p>
        </div>

        {/* Right Side Avatar Stack */}
        <div className="relative w-24 h-24 xs:w-28 xs:h-28 shrink-0 select-none self-end xs:self-auto">
          {/* Back Right Avatar (Male) */}
          <div className="absolute top-1 xs:top-2 right-1 w-12 h-12 xs:w-14 xs:h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-md">
            <img
              src="/mentor-male.png"
              alt="Male Mentor HR"
              className="w-full h-full object-cover scale-105"
            />
          </div>

          {/* Front Left Avatar (Female) */}
          <div className="absolute top-5 xs:top-6 left-1 w-12 h-12 xs:w-14 xs:h-14 rounded-full border-2 border-white/40 overflow-hidden shadow-lg z-10">
            <img
              src="/mentor-female.png"
              alt="Female Mentor HR"
              className="w-full h-full object-cover scale-105"
            />
          </div>
        </div>
      </div>

      {/* Button Row */}
      <div className="relative z-10 mt-6">
        <Link
          to="/private-coaching"
          className="w-full xs:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 px-5 py-3 text-sm font-bold text-[#12654d] transition-all shadow-md active:scale-[0.99]"
        >
          Lihat Private Mentoring
          <ArrowRight className="h-4 w-4 text-[#12654d]" strokeWidth={2.5} />
        </Link>
      </div>
    </aside>
  );
}
