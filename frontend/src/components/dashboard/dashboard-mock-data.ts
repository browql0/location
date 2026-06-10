import type { StatusBadgeValue } from "@/components/ui-custom/status-badge";

export const revenueData = [
  { month: "Jan", revenue: 18400 },
  { month: "Fev", revenue: 22600 },
  { month: "Mar", revenue: 24800 },
  { month: "Avr", revenue: 29100 },
  { month: "Mai", revenue: 32700 },
  { month: "Jun", revenue: 38400 }
];

export const subscriptionData = [
  { name: "Trial", value: 18 },
  { name: "Basic", value: 34 },
  { name: "Pro", value: 26 },
  { name: "Enterprise", value: 8 }
];

export type AgencyPreview = {
  id: string;
  agency: string;
  plan: string;
  status: StatusBadgeValue;
  mrr: string;
  users: number;
};

export const agencyPreviewData: AgencyPreview[] = [
  { id: "1", agency: "Atlas Rent", plan: "Pro", status: "ACTIVE", mrr: "599 MAD", users: 12 },
  { id: "2", agency: "Casa Drive", plan: "Trial", status: "TRIALING", mrr: "0 MAD", users: 3 },
  { id: "3", agency: "Marrakech Mobility", plan: "Basic", status: "PENDING", mrr: "299 MAD", users: 5 },
  { id: "4", agency: "Nord Auto", plan: "Enterprise", status: "ACTIVE", mrr: "1 499 MAD", users: 28 }
];
