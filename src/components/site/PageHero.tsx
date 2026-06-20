import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-grad-hero">
      <div className="container-page py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>
          {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
          {children && <div className="mt-6 flex justify-center">{children}</div>}
        </div>
      </div>
    </section>
  );
}
