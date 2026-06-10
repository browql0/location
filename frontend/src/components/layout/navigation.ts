import type { LucideIcon } from "lucide-react";
import type { Permission, UserRole } from "@/types/auth";
import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  Car,
  CreditCard,
  FileText,
  Gauge,
  Settings,
  ShieldCheck,
  Users,
  WalletCards
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
    label: "Administration globale",
    items: [
      { label: "Dashboard", href: "/super-admin/dashboard", icon: Gauge },
      { label: "Agences", href: "/super-admin/agencies", icon: Building2 },
      { label: "Abonnements", href: "/super-admin/subscriptions", icon: CreditCard },
      { label: "Plans", href: "/super-admin/plans", icon: BadgeDollarSign }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", href: "/staff", icon: ShieldCheck, permission: "users:read" },
      { label: "Voitures", href: "/cars", icon: Car, permission: "cars:read", disabled: true },
      { label: "Clients", href: "/clients", icon: Users, permission: "clients:read", disabled: true },
      { label: "Reservations", href: "/reservations", icon: CalendarClock, permission: "reservations:read", disabled: true }
    ]
  },
  {
    label: "Finance",
    items: [
      { label: "Factures", href: "/invoices", icon: FileText, permission: "invoices:read", disabled: true },
      { label: "Contrats", href: "/contracts", icon: FileText, permission: "contracts:read", disabled: true }
    ]
  },
  {
    label: "Systeme",
    items: [{ label: "Profil", href: "/profile", icon: Settings }]
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
      { label: "Voitures", href: "/cars", icon: Car, permission: "cars:read", disabled: true },
      { label: "Clients", href: "/clients", icon: Users, permission: "clients:read", disabled: true },
      { label: "Reservations", href: "/reservations", icon: CalendarClock, permission: "reservations:read", disabled: true }
    ]
  },
  {
    label: "Finance",
    items: [
      { label: "Factures", href: "/invoices", icon: FileText, permission: "invoices:read", disabled: true },
      { label: "Contrats", href: "/contracts", icon: FileText, permission: "contracts:read", disabled: true }
    ]
  },
  {
    label: "Systeme",
    items: [
      { label: "Parametres", href: "/settings/subscription", icon: Settings, permission: "subscriptions:read" },
      { label: "Profil", href: "/profile", icon: Settings }
    ]
  }
];

export function getNavigationGroups(role: UserRole | undefined) {
  return role === "SUPER_ADMIN" ? superAdminNavigationGroups : agencyNavigationGroups;
}

export const brandIcon = WalletCards;
