import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { CvData } from "@/lib/cv-types";

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  extra?: ReactNode;
  icon?: ReactNode;
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  disabled,
  extra,
  icon,
}: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {icon && (
            <span className="flex h-4 w-4 items-center justify-center text-primary">{icon}</span>
          )}
          {label}
        </Label>
        {extra}
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 rounded-xl border-border bg-background text-sm shadow-sm transition-all placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
      />
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  extra?: ReactNode;
  icon?: ReactNode;
  hint?: string;
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  className,
  extra,
  icon,
  hint,
}: TextareaFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {icon && (
            <span className="flex h-4 w-4 items-center justify-center text-primary">{icon}</span>
          )}
          {label}
        </Label>
        {extra}
      </div>
      <Textarea
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[96px] resize-y rounded-xl border-border bg-background text-sm shadow-sm transition-all placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
      />
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

type TextAlign = "left" | "center" | "right" | "justify";

export function TextAlignPicker({
  value,
  onChange,
}: {
  value?: TextAlign;
  onChange: (v: TextAlign) => void;
}) {
  const options: { value: TextAlign; label: string }[] = [
    { value: "left", label: "Kiri" },
    { value: "center", label: "Tengah" },
    { value: "right", label: "Kanan" },
    { value: "justify", label: "Rata" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Rata teks</span>
      <div className="flex rounded-xl border border-border bg-muted/40 p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-8 rounded-lg px-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
              value === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={opt.label}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function mutate<K extends keyof CvData>(
  setData: React.Dispatch<React.SetStateAction<CvData>>,
  key: K,
  index: number,
  field: string,
  value: unknown,
) {
  setData((d) => {
    const current = d[key];
    if (!Array.isArray(current)) return d;

    const arr = [...current] as Array<Record<string, unknown>>;
    arr[index] = { ...arr[index], [field]: value };
    return { ...d, [key]: arr } as CvData;
  });
}
