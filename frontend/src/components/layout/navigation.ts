import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Ban,
  Building2,
  CalendarClock,
  Car,
  CircleDollarSign,
  CreditCard,
  FileText,
  Gauge,
  Receipt,
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
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navigationGroups: NavGroup[] = [
  { label: "Dashboard", items: [{ label: "Dashboard", href: "/dashboard", icon: Gauge }] },
  {
    label: "Administration",
    items: [
      { label: "Agences", href: "/super-admin/agencies", icon: Building2 },
      { label: "Abonnements", href: "/super-admin/subscriptions", icon: CreditCard },
      { label: "Plans", href: "/super-admin/plans", icon: BadgeDollarSign }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", href: "/staff", icon: ShieldCheck, disabled: true },
      { label: "Voitures", href: "/cars", icon: Car, disabled: true },
      { label: "Clients", href: "/clients", icon: Users, disabled: true },
      { label: "Reservations", href: "/reservations", icon: CalendarClock, disabled: true }
    ]
  },
  {
    label: "Finance",
    items: [
      { label: "Factures", href: "/invoices", icon: FileText, disabled: true },
      { label: "Paiements", href: "/payments", icon: CircleDollarSign, disabled: true },
      { label: "Depenses", href: "/expenses", icon: Receipt, disabled: true }
    ]
  },
  {
    label: "Securite",
    items: [
      { label: "Incidents", href: "/incidents", icon: AlertTriangle, disabled: true },
      { label: "Blacklist", href: "/blacklist", icon: Ban, disabled: true }
    ]
  },
  { label: "Systeme", items: [{ label: "Parametres", href: "/settings/subscription", icon: Settings }] }
];

export const brandIcon = WalletCards;
