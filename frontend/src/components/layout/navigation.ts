import type { LucideIcon } from "lucide-react";
import type { Permission, UserRole } from "@/types/auth";
import {
  BadgeDollarSign,
  AlertTriangle,
  Building2,
  CalendarClock,
  Car,
  CreditCard,
  FileText,
  Gauge,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  Wrench
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  permission?: Permission;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const superAdminNavigationGroups: NavGroup[] = [
  {
    label: "SaaS",
    items: [
      { label: "Dashboard", href: "/super-admin/dashboard", icon: Gauge },
      { label: "Agences", href: "/super-admin/agencies", icon: Building2 },
      { label: "Abonnements", href: "/super-admin/subscriptions", icon: CreditCard },
      { label: "Factures", href: "/invoices", icon: FileText, permission: "invoices:read" },
      { label: "Plans", href: "/super-admin/plans", icon: BadgeDollarSign }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Maintenance", href: "/maintenance", icon: Wrench, permission: "maintenance:read" },
      { label: "Alertes vehicules", href: "/vehicle-alerts", icon: AlertTriangle, permission: "maintenance:read" }
    ]
  },
  {
    label: "Systeme",
    items: [
      { label: "Entreprise", href: "/settings/company", icon: Building2 },
      { label: "Profil", href: "/profile", icon: Settings }
    ]
  }
];

const agencyNavigationGroups: NavGroup[] = [
  {
    label: "Agence",
    items: [{ label: "Dashboard", href: "/agency/dashboard", icon: Gauge, permission: "dashboard:read" }]
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", href: "/staff", icon: ShieldCheck, permission: "users:read" },
      { label: "Voitures", href: "/cars", icon: Car, permission: "cars:read" },
      { label: "Clients", href: "/clients", icon: Users, permission: "clients:read" },
      { label: "Reservations", href: "/reservations", icon: CalendarClock, permission: "reservations:read" },
      { label: "Maintenance", href: "/maintenance", icon: Wrench, permission: "maintenance:read" },
      { label: "Alertes vehicules", href: "/vehicle-alerts", icon: AlertTriangle, permission: "maintenance:read" }
    ]
  },
  {
    label: "Finance",
    items: [
      { label: "Factures", href: "/invoices", icon: FileText, permission: "invoices:read" },
      { label: "Contrats", href: "/contracts", icon: FileText, permission: "contracts:read" }
    ]
  },
  {
    label: "Systeme",
    items: [
      { label: "Entreprise", href: "/settings/company", icon: Building2, permission: "agencies:update" },
      { label: "Parametres", href: "/settings/subscription", icon: Settings, permission: "subscriptions:read" },
      { label: "Profil", href: "/profile", icon: Settings }
    ]
  }
];

const staffNavigationGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/staff/dashboard", icon: Gauge, permission: "dashboard:read" },
      { label: "Reservations", href: "/reservations", icon: CalendarClock, permission: "reservations:read" },
      { label: "Calendrier", href: "/reservations/calendar", icon: CalendarClock, permission: "reservations:read" },
      { label: "Clients", href: "/clients", icon: Users, permission: "clients:read" },
      { label: "Maintenance", href: "/maintenance", icon: Wrench, permission: "maintenance:read" },
      { label: "Alertes vehicules", href: "/vehicle-alerts", icon: AlertTriangle, permission: "maintenance:read" },
      { label: "Factures", href: "/invoices", icon: FileText, permission: "invoices:read" },
      { label: "Contrats", href: "/contracts", icon: FileText, permission: "contracts:read" }
    ]
  },
  {
    label: "Systeme",
    items: [{ label: "Profil", href: "/profile", icon: Settings }]
  }
];

export function getNavigationGroups(role: UserRole | undefined) {
  if (role === "SUPER_ADMIN") return superAdminNavigationGroups;
  if (role === "STAFF") return staffNavigationGroups;
  return agencyNavigationGroups;
}

export const brandIcon = WalletCards;
