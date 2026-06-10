import * as React from "react";
import { cn } from "@/lib/utils";

type AppPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
};

export function AppPageHeader({ title, description, actions, eyebrow, className }: AppPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-xs font-medium uppercase tracking-normal text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="muted-text mt-2 max-w-3xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
