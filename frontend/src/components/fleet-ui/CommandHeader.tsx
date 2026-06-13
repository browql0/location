import { Menu, Bell, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandSearch } from "./CommandSearch";
import { StatusBeacon } from "./StatusBeacon";
import { ThemeToggle } from "../layout/theme-toggle";

interface CommandHeaderProps {
  onOpenSidebar: () => void;
  onToggleCollapse: () => void;
  sidebarCollapsed: boolean;
}

export function CommandHeader({ onOpenSidebar, onToggleCollapse, sidebarCollapsed }: CommandHeaderProps) {
  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl transition-all duration-300 lg:px-6",
        sidebarCollapsed ? "lg:left-[84px]" : "lg:left-72"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary lg:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-md hover:bg-secondary lg:inline-flex"
          onClick={onToggleCollapse}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1 sm:flex">
          <StatusBeacon status="active" />
          <span className="text-xs font-medium text-muted-foreground uppercase">Rentora Online</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 md:justify-center">
        <CommandSearch containerClassName="hidden md:flex max-w-lg w-full" />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-secondary/50 transition-colors hover:bg-secondary hover:text-primary">
          <ShieldAlert className="h-4 w-4" />
        </button>
        <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-secondary/50 transition-colors hover:bg-secondary hover:text-primary">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>
        <div className="h-4 w-px bg-border/50 mx-1 hidden sm:block" />
        <ThemeToggle />
      </div>
    </header>
  );
}
