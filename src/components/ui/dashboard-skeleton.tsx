import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      {/* ── Welcome Header Skeleton ── */}
      <section className="rounded-[1.25rem] border bg-card px-5 py-6 shadow-sm sm:px-6 md:px-8 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4">
              <Skeleton className="h-6 w-64 rounded-full" />
            </div>
            <Skeleton className="h-9 w-full max-w-3xl mb-2 sm:h-10" />
            <Skeleton className="h-9 w-3/4 max-w-2xl mb-3 sm:h-10" />
            <Skeleton className="h-4 w-full max-w-2xl mb-1" />
            <Skeleton className="h-4 w-4/5 max-w-xl mb-6" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-40" />
              <Skeleton className="h-11 w-36" />
            </div>
          </div>
          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-36 mb-1" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="rounded-xl px-2 py-5" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tier Banner Skeleton ── */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <Skeleton className="h-5 w-20 rounded-full mb-1" />
              <Skeleton className="h-5 w-16 rounded-full mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 w-20 rounded-xl" />
              <Skeleton className="h-14 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </section>

      {/* ── Usage Stats Skeleton ── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-28 rounded-full" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-4 w-80 max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <article key={i} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-8 mb-1 ml-auto" />
                  <Skeleton className="h-3 w-10 ml-auto" />
                </div>
              </div>
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
            </article>
          ))}
        </div>
      </section>

      {/* ── Power Features Skeleton ── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-40 rounded-full" />
            <Skeleton className="h-7 w-56" />
          </div>
          <Skeleton className="h-4 w-80 max-w-md" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <article key={i} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-5 h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6 mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-5 w-24 mt-auto" />
            </article>
          ))}
        </div>
      </section>

      {/* ── Quick Actions Skeleton ── */}
      <section className="space-y-4">
        <div>
          <Skeleton className="mb-2 h-6 w-24 rounded-full" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className="flex min-h-28 flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm"
            >
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main Content Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent CVs Skeleton */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Skeleton className="mb-2 h-6 w-24 rounded-full" />
                <Skeleton className="h-7 w-28" />
              </div>
              <Skeleton className="h-8 w-28" />
            </div>
            <div className="grid gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-36 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Activity Feed Skeleton */}
          <aside className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-36" />
            </div>
            <ul className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-muted/35 p-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* Upgrade Card Skeleton */}
          <aside className="rounded-2xl border border-amber-400/35 bg-amber-50/70 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Skeleton className="h-6 w-6 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
            </ul>
            <Skeleton className="mt-5 h-10 w-full" />
          </aside>

          {/* Tips Card Skeleton */}
          <aside className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-24" />
            </div>
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl p-2">
                  <Skeleton className="h-6 w-6 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
