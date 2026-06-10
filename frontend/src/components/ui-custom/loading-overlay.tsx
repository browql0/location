import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingOverlay({ label = "Chargement", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm", className)} role="status" aria-live="polite">
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}
