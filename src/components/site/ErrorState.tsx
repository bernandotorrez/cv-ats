import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  FileText,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

/* Branded error / empty-route page (404, app error, missing CV link, …). Light, WCAG AA. */

export type ErrorAction = {
  label: string;
  /** Internal route. */
  to?: string;
  onClick?: () => void;
  icon?: LucideIcon;
};

const SUGGESTIONS: { to: string; label: string; desc: string; icon: LucideIcon }[] = [
  { to: "/register", label: "Buat CV Gratis", desc: "Mulai dari template ATS", icon: FileText },
  { to: "/template", label: "Template CV", desc: "Pilih desain yang rapi", icon: LayoutTemplate },
  { to: "/lowongan", label: "Lowongan Kerja", desc: "Cari posisi incaranmu", icon: Briefcase },
  { to: "/panduan-cv-ats", label: "Panduan CV ATS", desc: "Tips lolos screening", icon: BookOpen },
];

const primaryClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 text-base font-bold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2";
const secondaryClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2";

function ActionButton({
  action,
  variant,
}: {
  action: ErrorAction;
  variant: "primary" | "secondary";
}) {
  const className = variant === "primary" ? primaryClass : secondaryClass;
  const Icon = action.icon;
  const content = (
    <>
      {Icon && <Icon aria-hidden="true" className="h-5 w-5" />}
      {action.label}
      {variant === "primary" && !Icon && <ArrowRight aria-hidden="true" className="h-5 w-5" />}
    </>
  );
  if (action.to) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={action.to as any} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  );
}

export function ErrorState({
  code,
  icon: Icon,
  eyebrow,
  title,
  description,
  primary,
  secondary,
  showSuggestions = false,
  standalone = false,
  children,
}: {
  /** Big decorative status code, e.g. "404". */
  code?: string;
  icon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  primary?: ErrorAction;
  secondary?: ErrorAction;
  /** Show links to popular pages (useful on 404). */
  showSuggestions?: boolean;
  /** Rendered without the site header (e.g. root error boundary): show the logo + full height. */
  standalone?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="error-heading"
      className={`relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white ${standalone ? "min-h-screen" : ""}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-green-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-yellow-100/70 blur-3xl"
      />

      {standalone && (
        <div className="container-page relative flex h-16 items-center">
          <a href="/" className="flex items-center gap-2" aria-label="CV Pintar — Beranda">
            <img
              src="/apple-touch-icon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full"
            />
            <span className="font-display text-lg font-extrabold text-gray-900">
              <span className="text-green-700">CV</span> PINTAR
            </span>
          </a>
        </div>
      )}

      <div
        className={`container-page relative flex flex-col items-center justify-center py-16 text-center lg:py-24 ${standalone ? "min-h-[calc(100vh-4rem)]" : "min-h-[70vh]"}`}
      >
        <div className="relative flex items-center justify-center">
          {code && (
            <span
              aria-hidden="true"
              className="select-none font-display text-[7rem] font-extrabold leading-none tracking-tight text-green-100 sm:text-[10rem]"
            >
              {code}
            </span>
          )}
          <span
            className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-green-700 shadow-xl shadow-green-900/10 ring-1 ring-green-100 ${code ? "absolute" : ""}`}
          >
            <Icon aria-hidden="true" className="h-10 w-10" />
          </span>
        </div>

        <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-800 shadow-sm">
          {eyebrow}
        </span>
        <h1
          id="error-heading"
          className="mt-5 max-w-2xl text-balance font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl"
        >
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
          {description}
        </p>

        {(primary || secondary) && (
          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            {primary && <ActionButton action={primary} variant="primary" />}
            {secondary && <ActionButton action={secondary} variant="secondary" />}
          </div>
        )}

        {children}

        {showSuggestions && (
          <nav aria-label="Halaman populer" className="mt-14 w-full max-w-4xl">
            <p className="text-sm font-semibold text-gray-900">Atau mungkin kamu mencari:</p>
            <ul className="mt-4 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
              {SUGGESTIONS.map((s) => (
                <li key={s.to}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    to={s.to as any}
                    className="flex h-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-green-600 hover:shadow-lg"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                      <s.icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-900">{s.label}</span>
                      <span className="block text-xs text-gray-600">{s.desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}
