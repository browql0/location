import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider } from "@/features/auth/auth-provider";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { RegisterAgencyPage } from "@/pages/register-agency-page";
import { UnauthorizedPage } from "@/pages/unauthorized-page";
import { PermissionGuard } from "./permission-guard";
import { ProtectedRoute } from "./protected-route";

export const router = createBrowserRouter([
  {
    element: <AuthProvider><ProtectedShell /></AuthProvider>,
    children: [
      {
        path: "/login",
        element: <LoginPage />
      },
      {
        path: "/register-agency",
        element: <RegisterAgencyPage />
      },
      {
        path: "/unauthorized",
        element: <UnauthorizedPage />
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/",
            element: <AppLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/dashboard" replace />
              },
              {
                element: <PermissionGuard permissions={["dashboard:read"]} />,
                children: [
                  {
                    path: "dashboard",
                    element: <DashboardPage />
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);

function ProtectedShell() {
  return <Outlet />;
}
