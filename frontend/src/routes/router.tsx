import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider } from "@/features/auth/auth-provider";
import { AgencyDashboardPage } from "@/pages/agency-dashboard-page";
import { ClientDetailPage } from "@/pages/client-detail-page";
import { ClientFormPage } from "@/pages/client-form-page";
import { ClientsPage } from "@/pages/clients-page";
import { CarDetailPage } from "@/pages/car-detail-page";
import { CarFormPage } from "@/pages/car-form-page";
import { CarsPage } from "@/pages/cars-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProfilePage } from "@/pages/profile-page";
import { RegisterAgencyPage } from "@/pages/register-agency-page";
import { SettingsSubscriptionPage } from "@/pages/settings-subscription-page";
import { StaffPage } from "@/pages/staff-page";
import { SuperAdminAgenciesPage } from "@/pages/super-admin-agencies-page";
import { SuperAdminDashboardPage } from "@/pages/super-admin-dashboard-page";
import { SuperAdminPlansPage } from "@/pages/super-admin-plans-page";
import { SuperAdminSubscriptionsPage } from "@/pages/super-admin-subscriptions-page";
import { UnauthorizedPage } from "@/pages/unauthorized-page";
import { PermissionGuard } from "./permission-guard";
import { ProtectedRoute } from "./protected-route";
import { RoleGuard } from "./role-guard";

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
              },
              {
                element: <PermissionGuard permissions={["dashboard:read"]} />,
                children: [
                  {
                    path: "agency/dashboard",
                    element: <AgencyDashboardPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["users:read"]} />,
                children: [
                  {
                    path: "staff",
                    element: <StaffPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["cars:read"]} />,
                children: [
                  {
                    path: "cars",
                    element: <CarsPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["cars:create"]} />,
                children: [
                  {
                    path: "cars/new",
                    element: <CarFormPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["cars:read"]} />,
                children: [
                  {
                    path: "cars/:id",
                    element: <CarDetailPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["clients:read"]} />,
                children: [
                  {
                    path: "clients",
                    element: <ClientsPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["clients:create"]} />,
                children: [
                  {
                    path: "clients/new",
                    element: <ClientFormPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["clients:read"]} />,
                children: [
                  {
                    path: "clients/:id",
                    element: <ClientDetailPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["clients:update"]} />,
                children: [
                  {
                    path: "clients/:id/edit",
                    element: <ClientFormPage />
                  }
                ]
              },
              {
                path: "profile",
                element: <ProfilePage />
              },
              {
                element: <RoleGuard roles={["SUPER_ADMIN"]} />,
                children: [
                  {
                    path: "super-admin/dashboard",
                    element: <SuperAdminDashboardPage />
                  },
                  {
                    path: "super-admin/agencies",
                    element: <SuperAdminAgenciesPage />
                  },
                  {
                    path: "super-admin/plans",
                    element: <SuperAdminPlansPage />
                  },
                  {
                    path: "super-admin/subscriptions",
                    element: <SuperAdminSubscriptionsPage />
                  }
                ]
              },
              {
                element: <PermissionGuard permissions={["subscriptions:read"]} />,
                children: [
                  {
                    path: "settings/subscription",
                    element: <SettingsSubscriptionPage />
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
