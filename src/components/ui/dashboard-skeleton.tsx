import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="container-page space-y-6 py-5 md:space-y-7 md:py-8">
      {/* ── Hero Banner Skeleton ── */}
      <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            {/* Left */}
            <div>
              <Skeleton className="h-7 w-64 rounded-full mb-4" />
              <Skeleton className="h-8 w-72 mb-2" />
              <Skeleton className="h-8 w-48 mb-3" />
              <Skeleton className="h-4 w-80 mb-5" />
              <div className="flex gap-3">
                <Skeleton className="h-9 w-40 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            </div>
            {/* Center */}
            <div className="rounded-2xl border bg-background p-6 min-w-[280px]">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="flex items-start gap-5">
                <Skeleton className="h-[140px] w-[140px] rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24 mb-2" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-4 w-28" />
                  ))}
                </div>
              </div>
            </div>
            {/* Right */}
            <div className="hidden lg:block">
              <div className="rounded-2xl bg-amber-50 border p-5">
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5 mt-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Step Pills Skeleton ── */}
      <section>
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-[140px] shrink-0 rounded-xl" />
          ))}
        </div>
      </section>

      {/* ── Main 2-Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* CV Kamu */}
          <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <div className="divide-y divide-border/50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-36 mb-1.5" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-12 shrink-0 rounded" />
                </div>
              ))}
            </div>
          </section>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3 w-16 mb-1.5" />
                    <Skeleton className="h-5 w-12 mb-1" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tier Banner */}
          <div className="rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center gap-3.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
            </div>
          </div>

          {/* Tools AI */}
          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <article key={i} className="flex items-start gap-4 rounded-2xl border bg-card p-5">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-4/5 mb-3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* AI Recommendations */}
          <aside className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="px-5 pb-4">
              <div className="rounded-xl bg-emerald-100/50 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-4/5 mb-4" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
            <div className="px-5 pb-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className={`h-1.5 rounded-full ${i === 1 ? "w-5" : "w-1.5"}`} />
                ))}
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </aside>

          {/* Activity Feed */}
          <aside className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <ul className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-3 py-2.5">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-full mb-0.5" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* Mentoring CTA */}
          <div className="rounded-2xl bg-emerald-100/50 p-6">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-4/5 mb-4" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
