import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

export type PreviewScale = 50 | 70 | 85 | 100;

interface Props {
  scale: PreviewScale;
  onChange: (scale: PreviewScale) => void;
  className?: string;
}

const SCALES: { value: PreviewScale; label: string }[] = [
  { value: 50, label: "50%" },
  { value: 70, label: "70%" },
  { value: 85, label: "85%" },
  { value: 100, label: "100%" },
];

export function PreviewToolbar({ scale, onChange, className }: Props) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="Skala preview">
      <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex rounded-xl border border-border bg-background p-1 shadow-sm">
        {SCALES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            className={cn(
              "min-h-8 rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
              scale === s.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={`Preview skala ${s.label}`}
            aria-pressed={scale === s.value}
          >
            {s.label}
          </button>
        ))}
      </div>
      <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}
