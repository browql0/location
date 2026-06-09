import { Outlet } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="font-semibold">Voiture SaaS</div>
        <ThemeToggle />
      </header>
      <main className="px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
