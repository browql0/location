import { forwardRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const CommandSearch = forwardRef<HTMLInputElement, CommandSearchProps>(
  ({ containerClassName, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div
        className={cn(
          "relative flex items-center w-full max-w-md transition-all duration-200",
          containerClassName
        )}
      >
        <Search
          className={cn(
            "absolute left-3.5 h-4 w-4 transition-colors duration-200",
            focused ? "text-primary" : "text-muted-foreground"
          )}
        />
        <input
          ref={ref}
          className={cn(
            "h-10 w-full rounded-lg border bg-background/50 pl-10 pr-24 text-sm transition-all duration-200",
            "placeholder:text-muted-foreground/50",
            "focus-visible:outline-none",
            focused
              ? "border-primary/60 bg-background/80 shadow-[0_0_0_3px_rgba(251,146,60,0.12)]"
              : "border-border/40 hover:border-border/60",
            className
          )}
          placeholder="Search agencies, clients, vehicles, reservations..."
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        <div className="absolute right-3 flex items-center gap-1">
          {focused ? (
            <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          ) : (
            <kbd className="hidden items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

CommandSearch.displayName = "CommandSearch";
