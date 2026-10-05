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
  /** @deprecated Kept for API compatibility; cards now use one neutral header style. */
  accentColor?: string;
}

export function SectionCard({ title, icon, className, headerExtra, children }: SectionCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-none",
        className,
      )}
    >
      <CardHeader className="border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                {icon}
              </span>
            )}
            <h3 className="truncate font-display text-base font-bold text-gray-900">{title}</h3>
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
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-green-700 px-3 text-sm font-bold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </button>
        </div>
      }
    >
      {items.length === 0 && (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-green-600 hover:bg-green-50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
            {icon || <FileText className="h-6 w-6" />}
          </span>
          <span className="max-w-sm text-sm leading-relaxed text-gray-600">
            Belum ada data. Tambahkan poin yang paling relevan dengan posisi incaranmu.
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-green-800">
            <Plus className="h-4 w-4" /> Tambah data
          </span>
        </button>
      )}
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={(item as { id?: Key }).id ?? i}
            className={cn(
              "group relative rounded-xl border border-gray-200 p-4 transition-colors hover:border-green-300",
              compact ? "bg-white" : "bg-gray-50/70",
            )}
          >
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {onMoveUp && (
                <button
                  type="button"
                  onClick={() => onMoveUp(i)}
                  disabled={i === 0}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border transition-transform hover:scale-105 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 active:scale-95",
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
                    "flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border transition-transform hover:scale-105 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 active:scale-95",
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
