import { api } from "@/lib/axios";
import type { StatusBadgeValue } from "@/components/ui-custom/status-badge";

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: string;
  priceYearly: string | null;
  trialDays: number;
  maxUsers: number | null;
  maxCars: number | null;
  maxClients: number | null;
  maxReservations: number | null;
  canUseInvoices: boolean;
  canUseContracts: boolean;
  canUseIncidents: boolean;
  canUseAdvancedReports: boolean;
  canUseApiAccess: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Agency = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  status: StatusBadgeValue;
  createdAt: string;
  subscriptions: Subscription[];
  _count: {
    users: number;
    cars: number;
    clients: number;
    reservations?: number;
  };
};

export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";

export type Subscription = {
  id: string;
  agencyId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: "MONTHLY" | "YEARLY" | null;
  startsAt: string;
  endsAt: string;
  trialEndsAt: string | null;
  amount: string | null;
  currency: string;
  agency?: {
    id: string;
    name: string;
    email: string;
    status: StatusBadgeValue;
  };
  plan: SubscriptionPlan;
};

export type DashboardKpis = {
  agencies: number;
  subscriptions: number;
  users: number;
  revenueSaas: number;
};

export type AgencyDashboardKpis = {
  vehicles: number;
  available: number;
  maintenance: number;
  inactive: number;
};

export type SubscriptionPlanPayload = {
  name?: string;
  description?: string | null;
  priceMonthly?: number;
  priceYearly?: number | null;
  trialDays?: number;
  maxUsers?: number | null;
  maxCars?: number | null;
  maxClients?: number | null;
  maxReservations?: number | null;
  canUseInvoices?: boolean;
  canUseContracts?: boolean;
  canUseIncidents?: boolean;
  canUseAdvancedReports?: boolean;
  canUseApiAccess?: boolean;
  isActive?: boolean;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getDashboardKpis() {
  const response = await api.get<ApiItem<DashboardKpis>>("/dashboard/super-admin");
  return response.data.data;
}

export async function getAgencyDashboardKpis() {
  const response = await api.get<ApiItem<AgencyDashboardKpis>>("/dashboard/agency");
  return response.data.data;
}

export async function listPlans() {
  const response = await api.get<ApiList<SubscriptionPlan>>("/subscription-plans");
  return response.data.data;
}

export async function createPlan(input: SubscriptionPlanPayload) {
  const response = await api.post<ApiItem<SubscriptionPlan>>("/subscription-plans", input);
  return response.data.data;
}

export async function updatePlan(id: string, input: SubscriptionPlanPayload) {
  const response = await api.patch<ApiItem<SubscriptionPlan>>(`/subscription-plans/${id}`, input);
  return response.data.data;
}

export async function setPlanActive(id: string, active: boolean) {
  const response = await api.patch<ApiItem<SubscriptionPlan>>(`/subscription-plans/${id}/${active ? "enable" : "disable"}`);
  return response.data.data;
}

export async function listAgencies(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiList<Agency>>("/agencies", { params });
  return response.data.data;
}

export async function getAgency(id: string) {
  const response = await api.get<ApiItem<Agency>>(`/agencies/${id}`);
  return response.data.data;
}

export async function updateAgency(id: string, input: Partial<Agency>) {
  const response = await api.patch<ApiItem<Agency>>(`/agencies/${id}`, input);
  return response.data.data;
}

export async function setAgencyEnabled(id: string, enabled: boolean) {
  const response = await api.patch<ApiItem<Agency>>(`/agencies/${id}/${enabled ? "enable" : "disable"}`);
  return response.data.data;
}

export async function listSubscriptions(params?: { status?: string; agencyId?: string }) {
  const response = await api.get<ApiList<Subscription>>("/subscriptions", { params });
  return response.data.data;
}

export async function getCurrentSubscription() {
  const response = await api.get<ApiItem<Subscription>>("/subscriptions/current");
  return response.data.data;
}

export async function changeSubscriptionPlan(id: string, planId: string, billingInterval: "MONTHLY" | "YEARLY" = "MONTHLY") {
  const response = await api.patch<ApiItem<Subscription>>(`/subscriptions/${id}/change-plan`, { planId, billingInterval });
  return response.data.data;
}

export async function setSubscriptionActive(id: string, active: boolean) {
  const response = await api.patch<ApiItem<Subscription>>(`/subscriptions/${id}/${active ? "reactivate" : "suspend"}`);
  return response.data.data;
}
