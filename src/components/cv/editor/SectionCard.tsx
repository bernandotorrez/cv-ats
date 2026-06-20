import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, Plus, X } from "lucide-react";
import { type Key, type ReactNode } from "react";

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  accentColor?: string;
}

export function SectionCard({
  title,
  icon,
  className,
  headerExtra,
  children,
  accentColor = "from-primary/10 to-secondary/10",
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:border-primary/25",
        className,
      )}
    >
      <CardHeader className={cn("border-b border-border/70 bg-gradient-to-r pb-4", accentColor)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/85 text-primary shadow-sm">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-foreground">{title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Buat jelas, ringkas, dan mudah dipindai rekruter.
              </p>
            </div>
          </div>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

export function ListSectionCard<T>({
  title,
  icon,
  items,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
  renderItem,
  compact,
  extraAction,
  accentColor,
}: {
  title: string;
  icon?: ReactNode;
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMoveUp?: (i: number) => void;
  onMoveDown?: (i: number) => void;
  renderItem: (item: T, i: number) => React.ReactNode;
  compact?: boolean;
  extraAction?: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <SectionCard
      title={title}
      icon={icon}
      accentColor={accentColor}
      headerExtra={
        <div className="flex items-center gap-2">
          {extraAction}
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </button>
        </div>
      }
    >
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-sm">
            {icon || <FileText className="h-6 w-6 text-muted-foreground" />}
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Belum ada data. Tambahkan poin yang paling relevan dengan posisi incaranmu.
          </p>
        </div>
      )}
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={(item as { id?: Key }).id ?? i}
            className={cn(
              "group relative rounded-2xl border border-border/80 p-4 transition-all hover:border-primary/30 hover:shadow-sm",
              compact ? "bg-background" : "bg-muted/25",
            )}
          >
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {onMoveUp && (
                <button
                  type="button"
                  onClick={() => onMoveUp(i)}
                  disabled={i === 0}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border transition-transform hover:scale-105 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95",
                    i === 0 &&
                      "cursor-not-allowed opacity-30 hover:bg-background hover:text-muted-foreground",
                  )}
                  aria-label="Pindah ke atas"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  onClick={() => onMoveDown(i)}
                  disabled={i === items.length - 1}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border transition-transform hover:scale-105 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95",
                    i === items.length - 1 &&
                      "cursor-not-allowed opacity-30 hover:bg-background hover:text-muted-foreground",
                  )}
                  aria-label="Pindah ke bawah"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border transition-transform hover:scale-105 hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 active:scale-95"
                aria-label="Hapus"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
