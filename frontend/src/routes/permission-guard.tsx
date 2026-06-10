import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-provider";
import type { Permission } from "@/types/auth";

export function PermissionGuard({ permissions }: { permissions: Permission[] }) {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") {
    return <Outlet />;
  }

  const allowed = permissions.every((permission) => user?.permissions.includes(permission));

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
