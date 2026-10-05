import { cn } from "@/lib/utils";

export type PreviewScale = 50 | 70 | 85 | 100;
/** "fit" = scale the A4 page to the available preview width. */
export type PreviewZoom = "fit" | PreviewScale;

interface Props {
  scale: PreviewZoom;
  onChange: (scale: PreviewZoom) => void;
  className?: string;
}

const OPTIONS: { value: PreviewZoom; label: string; aria: string }[] = [
  { value: "fit", label: "Pas", aria: "Sesuaikan dengan lebar layar" },
  { value: 50, label: "50%", aria: "Preview skala 50%" },
  { value: 70, label: "70%", aria: "Preview skala 70%" },
  { value: 85, label: "85%", aria: "Preview skala 85%" },
  { value: 100, label: "100%", aria: "Preview skala 100%" },
];

export function PreviewToolbar({ scale, onChange, className }: Props) {
  return (
    <div
      role="group"
      aria-label="Skala preview"
      className={cn("flex rounded-xl border border-gray-200 bg-gray-50 p-0.5", className)}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-[10px] px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 sm:px-2.5",
            scale === o.value
              ? "bg-white text-green-800 shadow-sm ring-1 ring-gray-200"
              : "text-gray-600 hover:text-gray-900",
          )}
          aria-label={o.aria}
          aria-pressed={scale === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
