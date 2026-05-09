import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface Props {
  password: string;
  className?: string;
}

interface CheckItem {
  key: string;
  label: string;
  met: boolean;
}

function getChecks(password: string): CheckItem[] {
  return [
    { key: "length", label: "Minimal 8 karakter", met: password.length >= 8 },
    { key: "uppercase", label: "Huruf besar (A-Z)", met: /[A-Z]/.test(password) },
    { key: "lowercase", label: "Huruf kecil (a-z)", met: /[a-z]/.test(password) },
    { key: "number", label: "Angka (0-9)", met: /[0-9]/.test(password) },
    { key: "symbol", label: "Karakter spesial (!@#$%)", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrength(password: string): { level: number; label: string; color: string } {
  const checks = getChecks(password);
  const met = checks.filter((c) => c.met).length;

  if (password.length === 0) return { level: 0, label: "", color: "bg-border" };
  if (met <= 2) return { level: 1, label: "Lemah", color: "bg-destructive" };
  if (met <= 3) return { level: 2, label: "Cukup", color: "bg-warning" };
  if (met <= 4) return { level: 3, label: "Kuat", color: "bg-primary/70" };
  return { level: 4, label: "Sangat Kuat", color: "bg-primary" };
}

export function PasswordStrength({ password, className }: Props) {
  const strength = getStrength(password);
  const checks = getChecks(password);

  if (password.length === 0) return null;

  return (
    <div className={cn("space-y-2 animate-in fade-in-50 duration-200", className)}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", strength.color)}
            style={{ width: `${(strength.level / 4) * 100}%` }}
          />
        </div>
        <span
          className={cn(
            "text-xs font-medium shrink-0",
            strength.level <= 1 && "text-destructive",
            strength.level === 2 && "text-warning-foreground",
            strength.level >= 3 && "text-primary",
          )}
        >
          {strength.label}
        </span>
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {checks.map((check) => (
          <li key={check.key} className="flex items-center gap-1.5 text-xs">
            {check.met ? (
              <Check className="h-3 w-3 text-primary shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={check.met ? "text-primary" : "text-muted-foreground"}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
