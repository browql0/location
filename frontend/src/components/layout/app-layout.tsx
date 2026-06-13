import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CommandHeader } from "../fleet-ui/CommandHeader";
import { CommandSidebar } from "../fleet-ui/CommandSidebar";
import { QuickActionDock } from "../fleet-ui/QuickActionDock";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Force dark mode globally for the Command Center aesthetic
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background via-background to-black selection:bg-primary/30">
      <CommandSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
      <CommandHeader
        onOpenSidebar={() => setSidebarOpen(true)}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      {/* Premium ambient glow effect */}
      <div className="pointer-events-none fixed left-0 top-0 z-0 h-[500px] w-full bg-primary/5 blur-[120px]" />
      
      <main className={cn("relative z-10 min-h-screen pt-16 transition-all duration-300 lg:pl-72", sidebarCollapsed && "lg:pl-[84px]")}>
        <div className="h-full w-full p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      
      <QuickActionDock />
    </div>
  );
}
