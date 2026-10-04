import { Skeleton } from "@/components/ui/skeleton";

/** Kerangka loading yang mengikuti tata letak dashboard (hindari lompatan layout). */
export function DashboardSkeleton() {
  return (
    <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10" aria-busy="true">
      <span className="sr-only">Memuat dashboard…</span>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-xl" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      {/* Langkah berikutnya */}
      <Skeleton className="h-52 w-full rounded-3xl" />

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl sm:h-28" />
        ))}
      </div>

      {/* Konten utama */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
