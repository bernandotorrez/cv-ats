import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function CvCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-12 rounded-full mt-1" />
      </div>
    </div>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-16 mt-2" />
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col bg-muted/30">
      <div className="shrink-0 border-b border-border bg-background px-3 py-3 lg:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-40 rounded-xl sm:w-52" />
          <Skeleton className="hidden h-9 w-44 rounded-xl md:block" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <div className="flex-1" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3">
        <div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-2 hidden h-4 w-80 sm:block" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-12 rounded-xl" />
          <Skeleton className="h-9 w-12 rounded-xl" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[272px] shrink-0 border-r border-border bg-background/70 p-4 lg:block">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        </aside>

        <div className="flex-1 overflow-hidden bg-background/80 p-4 md:w-[460px] md:shrink-0 md:flex-none md:border-r md:border-border">
          <div className="mb-4 flex gap-2 lg:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-xl" />
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-3 w-56" />
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 flex-col md:flex">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 py-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-48 rounded-xl" />
          </div>
          <div className="flex-1 overflow-hidden bg-muted/50 p-4 sm:p-6">
            <Skeleton className="mx-auto aspect-[210/297] h-full max-h-[760px] w-full max-w-[520px] rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 border-t border-border bg-background/95 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1"
          >
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingPageSkeleton() {
  return (
    <>
      {/* ── Hero Skeleton ── */}
      <section className="overflow-x-clip bg-background">
        <div className="container-page grid min-w-0 gap-12 py-14 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-20 lg:py-24">
          <div className="min-w-0">
            <Skeleton className="h-6 w-52 rounded-full" />
            <Skeleton className="mt-5 h-10 w-full max-w-2xl sm:h-14" />
            <Skeleton className="mt-3 h-10 w-4/5 max-w-xl sm:h-14" />
            <Skeleton className="mt-5 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-5/6 max-w-lg" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-12 w-44" />
              <Skeleton className="h-12 w-36" />
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="mx-auto w-full max-w-lg">
            <Skeleton className="h-72 w-full rounded-lg sm:h-80" />
          </div>
        </div>
      </section>

      {/* ── Proof Points Skeleton ── */}
      <section className="border-y border-border bg-card">
        <div className="container-page grid grid-cols-2 gap-px py-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-3 py-5 text-center">
              <Skeleton className="mx-auto h-8 w-20 md:h-9" />
              <Skeleton className="mx-auto mt-1 h-3 w-16 md:h-4" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem Section Skeleton ── */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="mt-3 h-9 w-full md:h-10" />
          </div>
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section Skeleton ── */}
      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-5 w-20 rounded-full" />
            <Skeleton className="mx-auto mt-3 h-9 w-64 md:h-10" />
            <Skeleton className="mx-auto mt-4 h-4 w-80" />
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <Skeleton className="mt-5 h-5 w-44" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CV Review Section Skeleton ── */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="mt-4 h-9 w-full md:h-10" />
            <Skeleton className="mt-3 h-9 w-4/5 md:h-10" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="mt-3 h-4 w-28" />
                  <Skeleton className="mt-1 h-3 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-8 h-12 w-40" />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        </div>
      </section>

      {/* ── Steps Section Skeleton ── */}
      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Skeleton className="mx-auto h-5 w-20 rounded-full" />
          <Skeleton className="mx-auto mt-3 h-9 w-64 md:h-10" />
          <Skeleton className="mx-auto mt-4 h-4 w-72" />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="mt-4 h-5 w-20" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Templates Section Skeleton ── */}
      <section className="bg-card py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="mt-3 h-9 w-full md:h-10" />
            <Skeleton className="mt-3 h-9 w-3/4 md:h-10" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-7 h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="mt-3 h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials Section Skeleton ── */}
      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-5 w-28 rounded-full" />
            <Skeleton className="mx-auto mt-3 h-9 w-72 md:h-10" />
            <Skeleton className="mx-auto mt-4 h-4 w-80" />
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-6 w-6" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-4 rounded-full" />
                    ))}
                  </div>
                </div>
                <Skeleton className="mt-5 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <div className="mt-5 border-t border-border pt-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1 h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section Skeleton ── */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="mt-3 h-9 w-full md:h-10" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section Skeleton ── */}
      <section className="container-page pb-16 md:pb-24">
        <div className="rounded-lg bg-primary px-6 py-12 text-center md:px-10 md:py-16">
          <Skeleton className="mx-auto h-8 w-8 rounded-full bg-primary-foreground/20" />
          <Skeleton className="mx-auto mt-5 h-9 w-full max-w-lg md:h-10 bg-primary-foreground/20" />
          <Skeleton className="mx-auto mt-4 h-4 w-80 bg-primary-foreground/20" />
          <Skeleton className="mx-auto mt-8 h-12 w-40 bg-primary-foreground/20" />
        </div>
      </section>
    </>
  );
}

export function PricingPageSkeleton() {
  return (
    <div className="container-page py-16 space-y-8">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <Skeleton className="h-6 w-20 mx-auto rounded-full" />
        <Skeleton className="h-10 w-96 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-4">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-48" />
            <div className="flex items-baseline gap-1">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScorePageSkeleton() {
  return (
    <div className="container-page space-y-6 py-6 sm:py-8 lg:py-10">
      <Skeleton className="h-9 w-40 rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-7 lg:p-8">
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="mt-5 h-10 w-full max-w-3xl sm:h-12" />
          <Skeleton className="mt-3 h-10 w-4/5 max-w-2xl sm:h-12" />
          <Skeleton className="mt-5 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-xl" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-border p-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="mt-3 h-3 w-24" />
                <Skeleton className="mt-2 h-5 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="mt-5 h-8 w-full max-w-sm" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="mt-3 h-8 w-64" />
                <Skeleton className="mt-2 h-4 w-80 max-w-full" />
              </div>
              <Skeleton className="h-11 w-full rounded-lg sm:w-32" />
            </div>
            <Skeleton className="mt-5 h-11 w-full rounded-lg" />
            <Skeleton className="mt-4 h-40 w-full rounded-lg" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border p-5 text-center">
                <Skeleton className="mx-auto h-4 w-24" />
                <Skeleton className="mx-auto mt-3 h-16 w-24" />
                <Skeleton className="mx-auto mt-4 h-7 w-28 rounded-full" />
              </div>
              <div>
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="mt-3 h-8 w-72 max-w-full" />
                <Skeleton className="mt-2 h-4 w-full" />
                <div className="mt-6 grid gap-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <Skeleton key={item} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="mt-3 h-7 w-56" />
          <Skeleton className="mt-4 aspect-[210/297] w-full rounded-xl" />
          <Skeleton className="mt-4 h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
