import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface EmptyCommandStateProps {
  icon?: any;
  title: string;
  description: string;
  className?: string;
}

export function EmptyCommandState({ icon: Icon = AlertTriangle, title, description, className }: EmptyCommandStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-secondary/20 p-8 text-center animate-in fade-in duration-500", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground ring-1 ring-border/50 shadow-inner">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-1 text-sm font-bold tracking-wide text-foreground uppercase">{title}</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
