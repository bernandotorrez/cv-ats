import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function MentoringCta() {
  return (
    <section
      aria-labelledby="mentoring-title"
      className="relative overflow-hidden rounded-3xl bg-green-700 p-5 text-white sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-yellow-300/20 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="mentoring-title" className="font-display text-lg font-extrabold leading-tight">
            Butuh bimbingan lebih?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-green-50/90">
            Private mentoring bersama HR berpengalaman untuk persiapan karier yang lebih matang.
          </p>
        </div>
        <div className="flex shrink-0 -space-x-3" aria-hidden="true">
          <img
            src="/mentor-female.webp"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-full border-2 border-green-700 object-cover"
          />
          <img
            src="/mentor-male.webp"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-full border-2 border-green-700 object-cover"
          />
        </div>
      </div>
      <Link
        to="/private-coaching"
        className="relative mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-green-800 transition-colors hover:bg-green-50"
      >
        Lihat private mentoring
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
