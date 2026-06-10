import * as React from "react";
import { cn } from "@/lib/utils";

type AppSectionProps = React.HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AppSection({ title, description, actions, children, className, ...props }: AppSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)} {...props}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="muted-text mt-1">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
