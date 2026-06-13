import { NavLink, useLocation } from "react-router-dom";
import { LogOut, ChevronRight, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types/auth";
import { brandIcon as BrandIcon, getNavigationGroups } from "../layout/navigation";

interface CommandSidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

function roleLabel(role: string | undefined) {
  if (role === "SUPER_ADMIN") return "Platform Commander";
  if (role === "AGENCY_ADMIN") return "Agency Commander";
  return role ?? "Operator";
}

function canSeeItem(user: ReturnType<typeof useAuth>["user"], permission?: Permission) {
  if (!permission) return true;
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

export function CommandSidebar({ open = true, onClose, collapsed = false }: CommandSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigationGroups = getNavigationGroups(user?.role);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/50 bg-background/95 backdrop-blur-xl transition-all duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[84px]"
        )}
      >
        <div className="flex h-16 items-center px-4 border-b border-border/50">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
              <BrandIcon className="h-5 w-5" />
            </div>
            <div className={cn("min-w-0 transition-opacity", collapsed && "lg:opacity-0 lg:hidden")}>
              <div className="truncate text-sm font-bold uppercase text-primary">RENTORA</div>
              <div className="truncate text-[10px] uppercase text-muted-foreground">{user?.agency?.name ?? "Rentora Platform"}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6 custom-scrollbar">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <div className={cn("px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3", collapsed && "lg:sr-only")}>{group.label}</div>
              <div className="space-y-1">
                {group.items.filter((item) => canSeeItem(user, item.permission)).map((item) => {
                  const active = location.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <NavLink
                      key={item.label}
                      to={item.disabled ? "#" : item.href}
                      onClick={item.disabled ? (e) => e.preventDefault() : onClose}
                      className={cn(
                        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all",
                        item.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-primary/10 hover:text-primary",
                        active ? "bg-primary/15 text-primary" : "text-muted-foreground",
                        collapsed && "lg:justify-center lg:px-0"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-lg border border-primary/20 bg-primary/5"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className="relative flex items-center justify-center">
                        <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", active && "drop-shadow-[0_0_8px_rgba(255,102,0,0.5)]")} />
                      </div>
                      
                      <span className={cn("truncate relative z-10", collapsed && "lg:sr-only")}>{item.label}</span>
                      
                      {active && !collapsed && (
                        <ChevronRight className="absolute right-2 h-4 w-4 opacity-50" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/50 p-4">
          <div className={cn("glass-card rounded-xl p-3", collapsed && "lg:bg-transparent lg:border-0 lg:shadow-none lg:p-0")}>
            <div className={cn("flex items-center gap-3", collapsed && "lg:justify-center")}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border/50 text-sm font-bold text-foreground">
                {user?.firstName?.[0] ?? "O"}
                {user?.lastName?.[0] ?? "P"}
              </div>
              <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
                <div className="truncate text-sm font-bold text-foreground">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="truncate text-[10px] uppercase tracking-wider text-primary">{roleLabel(user?.role)}</div>
                </div>
              </div>
              <button
                type="button"
                className={cn("flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive", collapsed && "lg:hidden")}
                onClick={logout}
                title="Disconnect"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
