import { motion } from "framer-motion";
import { CarFront, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";
import type { Permission } from "@/types/auth";

interface QuickActionDockProps {
  className?: string;
}

export function QuickActionDock({ className }: QuickActionDockProps) {
  const { user } = useAuth();
  const actions = [
    { label: "Nouveau Vehicule", icon: CarFront, href: "/cars/new", color: "text-primary", permission: "cars:create" as Permission },
    { label: "Nouveau Client", icon: Users, href: "/clients/new", color: "text-emerald-500", permission: "clients:create" as Permission },
    { label: "Nouvelle Reservation", icon: FileText, href: "/reservations/new", color: "text-blue-500", permission: "reservations:create" as Permission }
  ].filter((action) => {
    if (user?.role === "SUPER_ADMIN") return false;
    if (user?.role === "AGENCY_ADMIN") return true;
    return Boolean(user?.permissions.includes(action.permission));
  });

  if (actions.length === 0) return null;

  return (
    <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:flex", className)}>
      <motion.div
        className="glass-panel flex items-center gap-2 rounded-full p-2"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
      >
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-transparent transition-colors hover:bg-muted"
            aria-label={action.label}
          >
            <action.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", action.color)} />
            <span className="absolute -top-10 scale-0 rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm transition-all group-hover:scale-100">
              {action.label}
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
