import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-provider";

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN") {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  return <Navigate to="/agency/dashboard" replace />;
}
