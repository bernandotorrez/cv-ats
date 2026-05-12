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

export function Field({ label, value, onChange, type = "text", placeholder, className, disabled, extra, icon }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          {icon && <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">{icon}</span>}
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
        className="h-10 border-2 focus:border-primary/50 transition-all"
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

export function TextareaField({ label, value, onChange, placeholder, rows = 4, maxLength, className, extra, icon, hint }: TextareaFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          {icon && <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">{icon}</span>}
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
        className="border-2 focus:border-primary/50 transition-all resize-y min-h-[80px]"
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

type TextAlign = "left" | "center" | "right" | "justify";

export function TextAlignPicker({ value, onChange }: { value?: TextAlign; onChange: (v: TextAlign) => void }) {
  const options: { value: TextAlign; label: string }[] = [
    { value: "left", label: "Kiri" },
    { value: "center", label: "Tengah" },
    { value: "right", label: "Kanan" },
    { value: "justify", label: "Rata" },
  ];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">Rata teks:</span>
      <div className="flex gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-2 py-1 text-[11px] rounded-lg border-2 transition-all font-medium",
              value === opt.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background border-border hover:border-primary/30 hover:bg-muted text-muted-foreground",
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
    const arr = [...(d[key] as any[])];
    arr[index] = { ...arr[index], [field]: value };
    return { ...d, [key]: arr } as CvData;
  });
}
