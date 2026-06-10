import type { Permission } from "@/types/auth";

export const permissionGroups: Array<{ label: string; permissions: Array<{ value: Permission; label: string }> }> = [
  { label: "Dashboard", permissions: [{ value: "dashboard:read", label: "Lire dashboard" }] },
  {
    label: "Staff",
    permissions: [
      { value: "users:read", label: "Lire staff" },
      { value: "users:create", label: "Creer staff" },
      { value: "users:update", label: "Modifier staff" },
      { value: "users:disable", label: "Desactiver staff" },
      { value: "users:enable", label: "Reactiver staff" },
      { value: "users:delete", label: "Supprimer staff" },
      { value: "users:permissions", label: "Gerer permissions" }
    ]
  },
  {
    label: "Voitures",
    permissions: [
      { value: "cars:read", label: "Lire voitures" },
      { value: "cars:create", label: "Creer voitures" },
      { value: "cars:update", label: "Modifier voitures" },
      { value: "cars:delete", label: "Supprimer voitures" }
    ]
  },
  {
    label: "Clients",
    permissions: [
      { value: "clients:read", label: "Lire clients" },
      { value: "clients:create", label: "Creer clients" },
      { value: "clients:update", label: "Modifier clients" },
      { value: "clients:delete", label: "Supprimer clients" }
    ]
  },
  {
    label: "Reservations",
    permissions: [
      { value: "reservations:read", label: "Lire reservations" },
      { value: "reservations:create", label: "Creer reservations" },
      { value: "reservations:update", label: "Modifier reservations" },
      { value: "reservations:delete", label: "Supprimer reservations" }
    ]
  },
  {
    label: "Finance",
    permissions: [
      { value: "invoices:read", label: "Lire factures" },
      { value: "contracts:read", label: "Lire contrats" }
    ]
  },
  {
    label: "Securite",
    permissions: [
      { value: "incidents:read", label: "Lire incidents" },
      { value: "incidents:create", label: "Creer incidents" }
    ]
  }
];

export const defaultStaffPermissions: Permission[] = ["dashboard:read", "cars:read", "clients:read", "clients:create", "reservations:read", "reservations:create"];
