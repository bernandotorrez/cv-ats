/**
 * OptionVisual — isi satu pilihan jawaban: gambar (TIU figural) atau teks.
 * URL gambar sudah disaring safeTryoutImageUrl di normalizeOptions.
 */
import { cn } from "@/lib/utils";
import type { TryoutQuestionOption } from "@/lib/tryout-types";

export function OptionVisual({
  opt,
  size = "md",
  className,
}: {
  opt: TryoutQuestionOption;
  size?: "sm" | "md";
  className?: string;
}) {
  if (opt.image_url) {
    return (
      <img
        src={opt.image_url}
        alt={opt.text || `Gambar pilihan ${opt.key}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
        className={cn(
          "select-none rounded-md bg-white object-contain",
          size === "sm" ? "h-14 w-14" : "aspect-square w-full max-w-[120px]",
          className,
        )}
      />
    );
  }
  return <span className={className}>{opt.text}</span>;
}
