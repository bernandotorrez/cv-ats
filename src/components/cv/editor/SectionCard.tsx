import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { type ReactNode } from "react";

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  accentColor?: string;
}

export function SectionCard({ title, icon, className, headerExtra, children, accentColor = "from-primary/10 to-secondary/10" }: SectionCardProps) {
  return (
    <Card className={cn("overflow-hidden border-2 hover:border-primary/20 transition-all duration-300", className)}>
      <CardHeader className={cn("bg-gradient-to-r pb-4", accentColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {icon && <span className="flex h-5 w-5 items-center justify-center text-primary">{icon}</span>}
            <h3 className="font-display font-bold text-base">{title}</h3>
          </div>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

export function ListSectionCard<T>({
  title, icon, items, onAdd, onRemove, renderItem, compact, extraAction, accentColor,
}: {
  title: string; icon?: ReactNode; items: T[]; onAdd: () => void; onRemove: (i: number) => void;
  renderItem: (item: T, i: number) => React.ReactNode; compact?: boolean;
  extraAction?: React.ReactNode; accentColor?: string;
}) {
  return (
    <SectionCard title={title} icon={icon} accentColor={accentColor}
      headerExtra={
        <div className="flex items-center gap-2">
          {extraAction}
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah
          </button>
        </div>
      }
    >
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            {icon || <FileText className="h-6 w-6 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">Belum ada data. Klik "Tambah" untuk mulai.</p>
        </div>
      )}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={(item as any).id ?? i}
            className={cn(
              "group relative rounded-2xl border p-4 transition-all hover:border-primary/30 hover:shadow-sm",
              compact ? "bg-card" : "bg-muted/30",
            )}
          >
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={() => onRemove(i)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:scale-110 active:scale-95 transition-transform"
                aria-label="Hapus"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
