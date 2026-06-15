import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Simple back button that always goes to Dashboard.
 */
export function BackButton({ className }: BackButtonProps) {
  return (
    <Button asChild variant="ghost" size="sm" className={cn("-ml-2 mb-3 gap-2", className)}>
      <Link to="/dashboard">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Link>
    </Button>
  );
}
