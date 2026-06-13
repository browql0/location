import { NavLink, useLocation } from "react-router-dom";
import { LogOut, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types/auth";
import { brandIcon as BrandIcon, getNavigationGroups } from "./navigation";

type AppSidebarProps = {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
};

function roleLabel(role: string | undefined) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "AGENCY_ADMIN") return "Admin agence";
  return role ?? "Utilisateur";
}

function canSeeItem(user: ReturnType<typeof useAuth>["user"], permission?: Permission) {
  if (!permission) return true;
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

export function AppSidebar({ open = true, onClose, collapsed = false }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigationGroups = getNavigationGroups(user?.role);

  return (
    <>
      <div
        aria-hidden="true"
        className={cn("fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={onClose}
      />
      <aside
        aria-label="Navigation principale"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[84px]"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BrandIcon className="h-5 w-5" />
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <div className="truncate text-sm font-semibold">RENTORA</div>
              <div className="truncate text-xs text-muted-foreground">{user?.agency?.name ?? "Rentora Platform"}</div>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Fermer la navigation" onClick={onClose}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <div className={cn("px-2 text-[11px] font-medium uppercase tracking-normal text-muted-foreground", collapsed && "lg:sr-only")}>{group.label}</div>
              <div className="mt-2 space-y-1">
                {group.items.filter((item) => canSeeItem(user, item.permission)).map((item) => {
                  const active = location.pathname === item.href;
                  const Icon = item.icon;
                  const content = (
                    <>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className={cn("truncate", collapsed && "lg:sr-only")}>{item.label}</span>
                    </>
                  );

                  if (item.disabled) {
                    return (
                      <button
                        aria-disabled="true"
                        className={cn("flex h-9 w-full cursor-not-allowed items-center gap-3 rounded-md px-2 text-sm text-muted-foreground opacity-75", collapsed && "lg:justify-center")}
                        key={item.label}
                        type="button"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      className={cn(
                        "flex h-9 items-center gap-3 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        active && "bg-accent text-accent-foreground",
                        collapsed && "lg:justify-center"
                      )}
                      key={item.label}
                      onClick={onClose}
                      to={item.href}
                    >
                      {content}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className={cn("rounded-lg border bg-background p-3", collapsed && "lg:border-0 lg:bg-transparent lg:p-0")}>
            <div className={cn("flex items-center gap-3", collapsed && "lg:justify-center")}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
                {user?.firstName?.[0] ?? "U"}
                {user?.lastName?.[0] ?? ""}
              </div>
              <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
                <div className="truncate text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">{roleLabel(user?.role)}</div>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Se deconnecter" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
