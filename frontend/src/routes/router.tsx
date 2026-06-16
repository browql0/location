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
import { ContractDetailPage } from "@/pages/contract-detail-page";
import { ContractsPage } from "@/pages/contracts-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { InvoiceDetailPage } from "@/pages/invoice-detail-page";
import { InvoicesPage } from "@/pages/invoices-page";
import { LoginPage } from "@/pages/login-page";
import { MaintenanceDetailPage } from "@/pages/maintenance-detail-page";
import { MaintenanceFormPage } from "@/pages/maintenance-form-page";
import { MaintenancePage } from "@/pages/maintenance-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProfilePage } from "@/pages/profile-page";
import { RegisterAgencyPage } from "@/pages/register-agency-page";
import { ReservationDetailPage } from "@/pages/reservation-detail-page";
import { ReservationFormPage } from "@/pages/reservation-form-page";
import { ReservationsCalendarPage } from "@/pages/reservations-calendar-page";
import { ReservationsPage } from "@/pages/reservations-page";
import { SettingsCompanyPage } from "@/pages/settings-company-page";
import { SettingsSubscriptionPage } from "@/pages/settings-subscription-page";
import { StaffPage } from "@/pages/staff-page";
import { StaffDashboardPage } from "@/pages/staff-dashboard-page";
import { SuperAdminAgenciesPage } from "@/pages/super-admin-agencies-page";
import { SuperAdminDashboardPage } from "@/pages/super-admin-dashboard-page";
import { SuperAdminPlansPage } from "@/pages/super-admin-plans-page";
import { SuperAdminSubscriptionsPage } from "@/pages/super-admin-subscriptions-page";
import { UnauthorizedPage } from "@/pages/unauthorized-page";
import { VehicleAlertsPage } from "@/pages/vehicle-alerts-page";
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
                element: <RoleGuard roles={["AGENCY_ADMIN"]} />,
                children: [
                  {
                    path: "agency/dashboard",
                    element: <AgencyDashboardPage />
                  }
                ]
              },
              {
                element: <RoleGuard roles={["STAFF"]} />,
                children: [
                  {
                    element: <PermissionGuard permissions={["dashboard:read"]} />,
                    children: [
                      {
                        path: "staff/dashboard",
                        element: <StaffDashboardPage />
                      }
                    ]
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
                element: <PermissionGuard permissions={["reservations:read"]} />,
                children: [
                  { path: "reservations", element: <ReservationsPage /> },
                  { path: "reservations/calendar", element: <ReservationsCalendarPage /> },
                  { path: "reservations/:id", element: <ReservationDetailPage /> }
                ]
              },
              {
                element: <PermissionGuard permissions={["reservations:create"]} />,
                children: [
                  { path: "reservations/new", element: <ReservationFormPage /> }
                ]
              },
              {
                element: <PermissionGuard permissions={["reservations:update"]} />,
                children: [
                  { path: "reservations/:id/edit", element: <ReservationFormPage /> }
                ]
              },
              {
                element: <PermissionGuard permissions={["maintenance:read"]} />,
                children: [
                  { path: "maintenance", element: <MaintenancePage /> },
                  { path: "maintenance/:id", element: <MaintenanceDetailPage /> },
                  { path: "vehicle-alerts", element: <VehicleAlertsPage /> }
                ]
              },
              {
                element: <PermissionGuard permissions={["maintenance:create"]} />,
                children: [
                  { path: "maintenance/new", element: <MaintenanceFormPage /> }
                ]
              },
              {
                element: <PermissionGuard permissions={["maintenance:update"]} />,
                children: [
                  { path: "maintenance/:id/edit", element: <MaintenanceFormPage /> }
                ]
              },
              {
                element: <PermissionGuard permissions={["invoices:read"]} />,
                children: [
                  { path: "invoices", element: <InvoicesPage /> },
                  { path: "invoices/:id", element: <InvoiceDetailPage /> }
                ]
              },
              {
                element: <PermissionGuard permissions={["contracts:read"]} />,
                children: [
                  { path: "contracts", element: <ContractsPage /> },
                  { path: "contracts/:id", element: <ContractDetailPage /> }
                ]
              },
              {
                element: <RoleGuard roles={["SUPER_ADMIN", "AGENCY_ADMIN"]} />,
                children: [
                  {
                    path: "settings/company",
                    element: <SettingsCompanyPage />
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
