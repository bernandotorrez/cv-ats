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
      className="h-7 gap-1 text-xs text-secondary-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3 text-violet-500" />
      )}
      {loading ? "Memuat..." : label}
    </Button>
  );
}
