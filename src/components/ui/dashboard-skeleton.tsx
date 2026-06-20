import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="container-page space-y-6 py-5 md:space-y-7 md:py-8">
      {/* ── Career Progress Hero Skeleton ── */}
      <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary/30 via-primary/15 to-emerald-300/30" />
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {/* Row 1: Avatar + name + progress */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div>
                <Skeleton className="h-5 w-40 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-2 w-32 sm:w-40 rounded-full" />
            </div>
          </div>

          {/* Row 2: Step pills */}
          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-lg" />
            ))}
          </div>

          {/* Row 3: Next step CTA */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg shrink-0 ml-3" />
          </div>
        </div>
      </section>

      {/* ── Recent CVs Skeleton ── */}
      <section className="rounded-2xl border bg-card border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-36 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats Strip Skeleton ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border bg-card px-4 py-3 shadow-sm flex items-center gap-3"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-16 mb-1.5" />
              <Skeleton className="h-4 w-12 mb-1" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tier Accordion Skeleton ── */}
      <div className="rounded-xl border bg-card shadow-sm px-4 py-3">
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-4 w-4 shrink-0" />
        </div>
      </div>

      {/* ── Main 2-Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* Power Features Skeleton */}
          <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <Skeleton className="h-5 w-32 mb-1.5" />
              <Skeleton className="h-3 w-52" />
            </div>
            <div className="p-4 grid gap-2.5 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <article
                  key={i}
                  className="flex items-start gap-3.5 rounded-xl border bg-background p-4"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">
          {/* AI Recommendations Skeleton */}
          <aside className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-4">
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-36 mb-1.5" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
              {/* dot indicators */}
              <div className="mt-3 flex justify-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className={`h-1.5 rounded-full ${i === 1 ? "w-4" : "w-1.5"}`} />
                ))}
              </div>
            </div>
          </aside>

          {/* Activity Feed Skeleton */}
          <aside className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
            <ul className="p-3 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-muted/35 px-3 py-2.5">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-full mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
