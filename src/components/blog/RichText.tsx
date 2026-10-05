import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Render teks artikel dengan markup ringan:
 *   **tebal**  dan  [teks tautan](/path-internal)
 * Tautan internal memakai <Link> (navigasi client-side); URL lain dirender
 * sebagai <a> biasa dengan rel aman.
 */
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const className =
        "font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary";
      if (href.startsWith("/")) {
        return (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Link key={i} to={href as any} className={className}>
            {label}
          </Link>
        );
      }
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
  return <>{nodes}</>;
}
