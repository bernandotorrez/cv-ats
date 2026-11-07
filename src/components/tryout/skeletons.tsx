/**
 * Skeleton loading halaman tryout — meniru bentuk komponen aslinya (ukuran,
 * radius, grid) agar tidak ada lompatan layout saat data masuk.
 * Animasi pulse dimatikan bila pengguna memilih reduced motion.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
    />
  );
}

function Busy({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

const card = "rounded-2xl border bg-card shadow-sm";

export function PageHeaderSkeleton({ withActions = true }: { withActions?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2.5">
        <Bone className="h-3 w-28" />
        <Bone className="h-8 w-64 sm:w-80" />
        <Bone className="h-4 w-72 max-w-full sm:w-[28rem]" />
      </div>
      {withActions && (
        <div className="flex gap-2">
          <Bone className="h-10 w-28 rounded-xl" />
          <Bone className="h-10 w-32 rounded-xl" />
        </div>
      )}
    </div>
  );
}

export function ProgressStatsSkeleton() {
  return (
    <Busy label="Memuat ringkasan progres" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn(card, "p-4")}>
          <Bone className="h-3 w-20" />
          <Bone className="mt-3 h-7 w-16" />
          <Bone className="mt-2 h-3 w-24" />
        </div>
      ))}
    </Busy>
  );
}

export function ExamSetCardSkeleton() {
  return (
    <div className={cn(card, "flex flex-col p-5")}>
      <div className="flex items-start justify-between">
        <Bone className="h-11 w-11 rounded-xl" />
        <Bone className="h-5 w-24 rounded-full" />
      </div>
      <Bone className="mt-4 h-5 w-3/4" />
      <Bone className="mt-2 h-3.5 w-full" />
      <Bone className="mt-1.5 h-3.5 w-2/3" />
      <Bone className="mt-4 h-2 w-full rounded-full" />
      <div className="mt-2 flex gap-3">
        <Bone className="h-3 w-14" />
        <Bone className="h-3 w-14" />
        <Bone className="h-3 w-14" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <Bone className="h-4 w-28" />
        <Bone className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function ExamSetGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <Busy label="Memuat set tryout" className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ExamSetCardSkeleton key={i} />
      ))}
    </Busy>
  );
}

export function CreditBalanceSkeleton() {
  return (
    <Busy label="Memuat kredit" className={cn(card, "overflow-hidden")}>
      <div className="p-5">
        <Bone className="h-3 w-24" />
        <div className="mt-3 flex items-end gap-2">
          <Bone className="h-12 w-14" />
          <Bone className="mb-1 h-4 w-16" />
        </div>
        <Bone className="mt-4 h-2 w-full rounded-full" />
        <Bone className="mt-2 h-3 w-32" />
      </div>
      <div className="border-t bg-muted/30 p-4">
        <Bone className="h-10 w-full rounded-xl" />
      </div>
    </Busy>
  );
}

export function AttemptRowSkeleton() {
  return (
    <div className={cn(card, "flex items-center gap-3 p-3 sm:gap-4 sm:p-4")}>
      <Bone className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-4 w-40 max-w-full" />
        <div className="flex gap-2">
          <Bone className="h-5 w-14 rounded-md" />
          <Bone className="h-5 w-14 rounded-md" />
          <Bone className="h-5 w-14 rounded-md" />
        </div>
      </div>
      <div className="space-y-1.5 text-right">
        <Bone className="ml-auto h-6 w-14" />
        <Bone className="ml-auto h-3 w-16" />
      </div>
    </div>
  );
}

export function AttemptListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Busy label="Memuat riwayat tryout" className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <AttemptRowSkeleton key={i} />
      ))}
    </Busy>
  );
}

export function LeaderboardRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn("flex items-center gap-3", compact ? "px-3 py-2.5" : cn(card, "p-3 sm:p-4"))}
    >
      <Bone className="h-7 w-7 shrink-0 rounded-full" />
      <Bone className={cn("shrink-0 rounded-full", compact ? "h-8 w-8" : "h-10 w-10")} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Bone className="h-3.5 w-28" />
        {!compact && <Bone className="h-3 w-40 max-w-full" />}
      </div>
      <Bone className={cn(compact ? "h-5 w-10" : "h-7 w-14")} />
    </div>
  );
}

export function LeaderboardSkeleton({
  rows = 5,
  compact = false,
  podium = false,
}: {
  rows?: number;
  compact?: boolean;
  podium?: boolean;
}) {
  return (
    <Busy label="Memuat leaderboard" className="space-y-3">
      {podium && <PodiumSkeleton />}
      <div className={cn(compact ? cn(card, "divide-y") : "space-y-2")}>
        {Array.from({ length: rows }).map((_, i) => (
          <LeaderboardRowSkeleton key={i} compact={compact} />
        ))}
      </div>
    </Busy>
  );
}

export function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-3 items-end gap-3">
      {[140, 176, 120].map((h, i) => (
        <div key={i} className={cn(card, "flex flex-col items-center p-4")} style={{ height: h }}>
          <Bone className="h-10 w-10 rounded-full" />
          <Bone className="mt-3 h-3.5 w-16" />
          <Bone className="mt-2 h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

export function PackageCardSkeleton() {
  return (
    <div className={cn(card, "flex flex-col overflow-hidden")}>
      <div className="p-6">
        <Bone className="h-6 w-40" />
        <Bone className="mt-2 h-4 w-56 max-w-full" />
        <Bone className="mt-6 h-10 w-36" />
        <Bone className="mt-2 h-4 w-44" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Bone className="h-4 w-4 rounded-full" />
              <Bone className="h-4 w-48 max-w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto border-t bg-muted/30 p-5">
        <Bone className="h-11 w-full rounded-xl" />
        <Bone className="mx-auto mt-2.5 h-3 w-48" />
      </div>
    </div>
  );
}

export function PackageGridSkeleton() {
  return (
    <Busy label="Memuat paket" className="grid gap-5 md:grid-cols-2">
      <PackageCardSkeleton />
      <PackageCardSkeleton />
    </Busy>
  );
}

export function ExamDetailSkeleton() {
  return (
    <Busy label="Memuat detail tryout" className="space-y-6">
      <PageHeaderSkeleton withActions={false} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(card, "p-4")}>
                <Bone className="h-6 w-14" />
                <Bone className="mt-2 h-3 w-32" />
                <Bone className="mt-4 h-3 w-full" />
                <Bone className="mt-2 h-3 w-full" />
                <Bone className="mt-3 h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className={cn(card, "space-y-3 p-5")}>
            <Bone className="h-5 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Bone className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Bone className="h-3.5 w-1/3" />
                  <Bone className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(card, "h-fit space-y-4 p-5")}>
          <Bone className="h-3 w-24" />
          <Bone className="h-10 w-16" />
          <Bone className="h-3 w-40" />
          <Bone className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </Busy>
  );
}

/** Kerangka halaman ujian (top bar, tab subtes, kartu soal, navigasi). */
export function ExamPageSkeleton() {
  return (
    <Busy label="Menyiapkan ujian">
      <div className="border-b">
        <div className="container-page flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Bone className="h-9 w-9 rounded-md" />
            <div className="space-y-1.5">
              <Bone className="h-3 w-32" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
          <Bone className="h-10 w-28 rounded-xl" />
        </div>
        <Bone className="h-1 w-full rounded-none" />
      </div>
      <div className="container-page space-y-4 py-4 md:py-6">
        <div className={cn(card, "grid grid-cols-3 gap-1 p-1")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5 px-3 py-1.5">
              <Bone className="h-3.5 w-10" />
              <Bone className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className={cn(card, "p-5 sm:p-6")}>
            <div className="flex items-center gap-2">
              <Bone className="h-9 w-9 rounded-lg" />
              <Bone className="h-3 w-12" />
              <Bone className="h-5 w-10 rounded-md" />
              <Bone className="h-5 w-24 rounded-md" />
            </div>
            <Bone className="mt-5 h-4 w-full" />
            <Bone className="mt-2 h-4 w-11/12" />
            <Bone className="mt-2 h-4 w-2/3" />
            <div className="mt-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border-2 p-3">
                  <Bone className="h-8 w-8 shrink-0 rounded-lg" />
                  <Bone className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
          <div className={cn(card, "hidden p-4 lg:block")}>
            <Bone className="h-4 w-28" />
            <div className="mt-4 grid grid-cols-8 gap-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <Bone key={i} className="h-8 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Busy>
  );
}

/** Kerangka halaman hasil (banner kesiapan, kartu analisis, pembahasan). */
export function ResultPageSkeleton() {
  return (
    <Busy label="Memuat hasil tryout" className="container-page space-y-5 py-5 md:py-8">
      <div className="flex justify-between">
        <Bone className="h-9 w-40 rounded-md" />
        <div className="flex gap-2">
          <Bone className="h-9 w-28 rounded-md" />
          <Bone className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <Bone className="h-5 w-32 rounded-full" />
        <Bone className="h-8 w-60" />
        <Bone className="h-4 w-72 max-w-full" />
      </div>
      <div className={cn(card, "overflow-hidden")}>
        <div className="flex flex-col gap-5 bg-muted/50 p-5 sm:flex-row sm:items-center sm:p-6">
          <Bone className="mx-auto h-28 w-28 rounded-full sm:mx-0" />
          <div className="flex-1 space-y-2.5">
            <Bone className="h-3 w-28" />
            <Bone className="h-8 w-56" />
            <Bone className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-xl border-2 p-4">
              <Bone className="h-3 w-12" />
              <Bone className="h-7 w-24" />
              <Bone className="h-2 w-full rounded-full" />
              <Bone className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={cn(card, "space-y-3 p-5")}>
            <Bone className="h-5 w-36" />
            <Bone className="h-16 w-full rounded-xl" />
            <Bone className="h-16 w-full rounded-xl" />
            <Bone className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </Busy>
  );
}
