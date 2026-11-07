/**
 * Primitif tata letak halaman aplikasi tryout: header halaman & judul section.
 * Satu bahasa visual dengan halaman ujian & hasil.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TryoutPageHeader({
  eyebrow,
  icon,
  title,
  description,
  actions,
  className,
  as: Heading = "h1",
}: {
  eyebrow?: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Pakai "h2" bila layout induk sudah punya h1 (mis. panel admin). */
  as?: "h1" | "h2";
}) {
  return (
    <header
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {icon}
            {eyebrow}
          </p>
        )}
        <Heading className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {title}
        </Heading>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  icon,
  title,
  action,
  id,
}: {
  icon?: ReactNode;
  title: ReactNode;
  action?: { to: string; label: string };
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2
        id={id}
        className="flex items-center gap-2 font-display text-lg font-bold text-foreground"
      >
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h2>
      {action && (
        <Link
          to={action.to as never}
          className="inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {action.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Kotak kosong yang ramah (empty state) dengan ikon, teks, dan aksi. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 font-display text-base font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
