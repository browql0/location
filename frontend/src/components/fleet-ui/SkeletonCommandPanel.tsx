import { cn } from "@/lib/utils";

export function SkeletonCommandPanel({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-5 animate-pulse", className)}>
      <div className="mb-4 h-5 w-1/3 rounded-md bg-muted/50" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded-md bg-muted/30" />
        <div className="h-4 w-5/6 rounded-md bg-muted/30" />
        <div className="h-4 w-4/6 rounded-md bg-muted/30" />
      </div>
    </div>
  );
}
