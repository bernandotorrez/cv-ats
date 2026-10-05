import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

/* Shared building blocks for /login and /register (light, WCAG AA). */

export const authInputClass =
  "h-12 rounded-xl border-gray-300 bg-white px-4 text-base text-gray-900 shadow-none placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:ring-2 focus-visible:ring-green-700/20";

export const authLabelClass = "text-sm font-semibold text-gray-900";

export function AuthShell({
  eyebrow,
  title,
  desc,
  children,
  aside,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  desc: ReactNode;
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <section
      aria-labelledby="auth-heading"
      className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-green-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-yellow-100/70 blur-3xl"
      />
      <div className="container-page relative grid items-center gap-12 py-10 sm:py-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:gap-16 lg:py-16">
        <div className="mx-auto w-full max-w-md">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-800 shadow-sm">
            {eyebrow}
          </span>
          <h1
            id="auth-heading"
            className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
          >
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">{desc}</p>
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-green-900/5 sm:p-8">
            {children}
          </div>
        </div>
        <div className="hidden lg:block">{aside}</div>
      </div>
    </section>
  );
}

/** Green brand panel shown next to the form on desktop. */
export function AuthAside({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-green-700 p-10 text-white shadow-2xl">
      <div
        aria-hidden="true"
        className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-green-600/40 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl"
      />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">{eyebrow}</p>
        <p className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight">
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}

export function GoogleButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white text-base font-semibold text-gray-900 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
      ) : (
        <FcGoogle aria-hidden="true" className="h-5 w-5" />
      )}
      {label}
    </button>
  );
}

export function AuthDivider({ label = "atau pakai email" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div aria-hidden="true" className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-200" />
      </div>
      <p className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
        <span className="bg-white px-3 text-gray-600">{label}</span>
      </p>
    </div>
  );
}

export function AuthSubmit({
  loading,
  disabled,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 text-base font-bold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}

/** Placeholder while hydrating, sized like the real page to avoid layout jump. */
export function AuthLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-b from-green-50 via-white to-white">
      <div role="status" aria-label="Memuat" className="flex gap-1.5">
        <div className="h-3 w-3 animate-pulse rounded-full bg-green-300" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-green-300 [animation-delay:150ms]" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-green-300 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
