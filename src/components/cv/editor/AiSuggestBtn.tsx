import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

export function AiSuggestBtn({
  loading,
  onClick,
  label = "Sarankan AI",
  variant = "ghost",
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
  variant?: "ghost" | "outline";
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={loading}
      className="h-8 gap-1 rounded-lg px-2 text-xs font-semibold text-green-800 transition-colors hover:bg-green-50 hover:text-green-900"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
      )}
      {loading ? "Memuat..." : label}
    </Button>
  );
}
