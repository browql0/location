import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
      <AppHeader
        onOpenSidebar={() => setSidebarOpen(true)}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main className={cn("min-h-screen pt-16 transition-all lg:pl-72", sidebarCollapsed && "lg:pl-[84px]")}>
        <Outlet />
      </main>
    </div>
  );
}
