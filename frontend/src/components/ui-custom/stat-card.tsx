import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
  icon?: LucideIcon;
  className?: string;
};

export function StatCard({ title, value, description, trend, icon: Icon, className }: StatCardProps) {
  const TrendIcon = trend?.direction === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <div className={cn("rounded-lg border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="card-title text-muted-foreground">{title}</p>
        {Icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-normal">{value}</p>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              trend.direction === "up"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {trend.value}
          </span>
        ) : null}
      </div>
      {description ? <p className="muted-text mt-3">{description}</p> : null}
    </div>
  );
}
