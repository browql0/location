import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Menu, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui-custom/search-input";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "super-admin": "Super Admin",
  agency: "Agence",
  agencies: "Agences",
  subscriptions: "Abonnements",
  plans: "Plans",
  staff: "Staff",
  cars: "Voitures",
  clients: "Clients",
  reservations: "Reservations",
  invoices: "Factures",
  payments: "Paiements",
  expenses: "Depenses",
  incidents: "Incidents",
  blacklist: "Blacklist",
  settings: "Parametres",
  profile: "Profil"
};

type AppHeaderProps = {
  onOpenSidebar: () => void;
  onToggleCollapse: () => void;
  sidebarCollapsed: boolean;
};

export function AppHeader({ onOpenSidebar, onToggleCollapse, sidebarCollapsed }: AppHeaderProps) {
  const location = useLocation();
  const { user } = useAuth();
  const segments = location.pathname.split("/").filter(Boolean);
  const currentSegments = segments.length ? segments : ["dashboard"];

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur transition-all lg:px-6",
        sidebarCollapsed ? "lg:left-[84px]" : "lg:left-72"
      )}
    >
      <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir la navigation" onClick={onOpenSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label="Reduire la sidebar" onClick={onToggleCollapse}>
        <Menu className="h-5 w-5" />
      </Button>

      <nav aria-label="Fil d'Ariane" className="hidden min-w-0 flex-1 items-center text-sm text-muted-foreground md:flex">
        <Link className="rounded-sm hover:text-foreground" to="/dashboard">
          Voiture SaaS
        </Link>
        {currentSegments.map((segment, index) => (
          <span className="flex min-w-0 items-center" key={`${segment}-${index}`}>
            <ChevronRight className="mx-2 h-4 w-4 shrink-0" />
            <span className={cn("truncate", index === currentSegments.length - 1 && "font-medium text-foreground")}>{breadcrumbLabels[segment] ?? segment}</span>
          </span>
        ))}
      </nav>

      <div className="hidden flex-1 justify-center md:flex">
        <SearchInput className="w-full max-w-md" aria-label="Recherche globale" placeholder="Recherche globale..." />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Button type="button" variant="ghost" className="hidden h-9 gap-2 px-2 sm:inline-flex" aria-label="Profil utilisateur" asChild>
          <Link to="/profile">
            <UserCircle className="h-4 w-4" />
            <span className="max-w-28 truncate text-sm">{user?.firstName ?? "Profil"}</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
