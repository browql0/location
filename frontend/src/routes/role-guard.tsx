import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-provider";
import type { UserRole } from "@/types/auth";

export function RoleGuard({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
