import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* Shared building blocks for public marketing pages (light, WCAG AA). */

export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={
        tone === "light"
          ? "inline-flex w-fit items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-800"
          : "inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300"
      }
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  desc,
  id,
  align = "center",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  id?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={
        align === "center" ? "mx-auto mb-12 max-w-3xl text-center lg:mb-16" : "mb-10 max-w-2xl"
      }
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
      {desc && <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">{desc}</p>}
    </div>
  );
}

export function CheckItem({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2
        aria-hidden="true"
        className={`mt-0.5 h-5 w-5 shrink-0 ${tone === "light" ? "text-green-700" : "text-emerald-400"}`}
      />
      <span className={tone === "light" ? "text-gray-700" : "text-slate-200"}>{children}</span>
    </li>
  );
}

export function PageHero({
  id = "page-heading",
  eyebrow,
  title,
  desc,
  children,
  aside,
}: {
  id?: string;
  eyebrow: ReactNode;
  title: ReactNode;
  desc: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white pb-16 pt-10 lg:pb-24 lg:pt-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-green-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-yellow-100/70 blur-3xl"
      />
      <div className="container-page relative">
        <div
          className={
            aside
              ? "grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]"
              : "mx-auto max-w-3xl text-center"
          }
        >
          <div
            className={aside ? "flex max-w-2xl flex-col items-start" : "flex flex-col items-center"}
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-800 shadow-sm">
              {eyebrow}
            </span>
            <h1
              id={id}
              className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              {title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">{desc}</p>
            {children}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}

export function PrimaryCta({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button
      asChild
      size="lg"
      className="h-14 rounded-xl bg-green-700 px-8 text-base font-bold text-white shadow-lg shadow-green-700/25 transition-transform hover:-translate-y-0.5 hover:bg-green-800"
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link to={to as any}>
        {children}
        <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}

export function SecondaryCta({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button
      asChild
      size="lg"
      variant="outline"
      className="h-14 rounded-xl border-2 border-gray-300 bg-white px-8 text-base font-semibold text-gray-800 hover:border-green-700 hover:bg-green-50 hover:text-green-800"
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link to={to as any}>{children}</Link>
    </Button>
  );
}

export function TrustChecks({
  items = ["100% gratis", "Tanpa kartu kredit", "Data aman & privat"],
}: {
  items?: string[];
}) {
  return (
    <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-gray-700">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-green-700" />
          {t}
        </li>
      ))}
    </ul>
  );
}

export function CtaBanner({
  title,
  desc,
  cta,
  to = "/register",
  points = ["Gratis selamanya", "Mudah & cepat", "ATS Friendly", "Dipercaya 10.000+ pengguna"],
  secondary,
}: {
  title: ReactNode;
  desc?: ReactNode;
  cta: string;
  to?: string;
  points?: string[];
  /** Optional external secondary action (opens in a new tab). */
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="container-page py-16 lg:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-green-700 px-6 py-12 text-white shadow-2xl sm:px-12 lg:py-16">
        <div
          aria-hidden="true"
          className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-green-600/40 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          {desc && (
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-green-50 sm:text-lg">
              {desc}
            </p>
          )}
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-green-50">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-yellow-300" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-xl bg-yellow-300 px-8 text-base font-extrabold text-gray-950 shadow-lg hover:bg-yellow-200"
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link to={to as any}>
                {cta}
                <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            {secondary && (
              <a
                href={secondary.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-white/70 px-8 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                {secondary.label}
                <span className="sr-only"> (membuka tab baru)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
