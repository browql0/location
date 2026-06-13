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

export type MonthlyNumberPoint = {
  month: string;
  monthKey: string;
  [key: string]: string | number;
};

export type DashboardRange = "7d" | "30d" | "90d" | "1y";

export type SuperAdminDashboardData = {
  insights: string[];
  header: {
    mrr: number;
    arr: number;
    activeAgencies: number;
    churnRate: number;
    expiringSoon: number;
    mrrChange: number;
    arrChange: number;
    activeAgenciesChange: number;
    churnChange: number;
  };
  kpis: {
    totalAgencies: number;
    activeAgencies: number;
    suspendedAgencies: number;
    activeSubscriptions: number;
    mrr: number;
    arr: number;
    revenueSaas: number;
    totalVehicles: number;
    totalClients: number;
    totalReservations: number;
    trialSubscriptions: number;
    expiringSoon: number;
  };
  businessHealth: {
    mrr: number;
    arr: number;
    monthlyGrowth: number;
    trialConversionRate: number;
    churnRate: number;
    suspendedAgencies: number;
  };
  topAgencies: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    plan: string;
    mrr: number;
    revenueTotal: number;
    reservations: number;
    clients: number;
    growth: number;
    revenueShare: number;
    badges: Array<"FAST_GROWING" | "STABLE" | "RISK" | "CRITICAL">;
  }>;
  risk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH";
    label: string;
    drivers: Array<{ label: string; value: number; impact: number }>;
  };
  alerts: {
    expiringSubscriptions: number;
    failedPayments: number;
    suspendedAgencies: number;
    openIncidents: number;
    plansAtLimit: number;
    items: Array<{
      id: string;
      level: "CRITICAL" | "WARNING" | "INFO";
      title: string;
      detail: string;
      count: number;
    }>;
  };
  expirations: Array<{
    id: string;
    agencyName: string;
    plan: string;
    endsAt: string;
    daysLeft: number;
  }>;
  activity: Array<{
    id: string;
    title: string;
    action: string;
    entity: string;
    agencyName: string | null;
    actorName: string | null;
    createdAt: string;
  }>;
  predictive: {
    nextMonthMrr: number;
    nextMonthArr: number;
    expectedRenewals: number;
    likelyConversions: number;
    estimatedGrowth: number;
    basis: string[];
  };
  charts: {
    agencyGrowth: Array<MonthlyNumberPoint & { agencies: number }>;
    mrrEvolution: Array<MonthlyNumberPoint & { mrr: number }>;
    reservations: Array<MonthlyNumberPoint & { reservations: number }>;
    clients: Array<MonthlyNumberPoint & { clients: number }>;
    monthComparison: {
      agencies: { current: number; previous: number; change: number };
      reservations: { current: number; previous: number; change: number };
      clients: { current: number; previous: number; change: number };
      mrr: { current: number; previous: number; change: number };
    };
    planDistribution: Array<{ name: string; value: number; percentage: number; mrr: number }>;
  };
};

export type SuperAdminSearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

export type AgencyDashboardData = {
  kpis: {
    availableVehicles: number;
    rentedVehicles: number;
    maintenanceVehicles: number;
    reservationsToday: number;
    reservationsMonth: number;
    revenueMonth: number;
    revenueYear: number;
    activeClients: number;
    fleetOccupancyRate: number;
  };
  alerts: {
    upcomingReservations: Array<{
      id: string;
      startDate: string;
      endDate: string;
      clientName: string;
      vehicle: string;
      registrationNumber: string;
    }>;
    contractsToSign: number;
    overduePayments: number;
    expiredDocuments: number;
    maintenanceAlerts: number;
  };
  charts: {
    monthlyRevenue: Array<MonthlyNumberPoint & { revenue: number }>;
    fleetOccupancy: Array<MonthlyNumberPoint & { occupancy: number }>;
    topVehicles: Array<{ name: string; registrationNumber: string; revenue: number }>;
  };
};

export type StaffDashboardData = {
  kpis: {
    reservationsCreated: number;
    contractsCreated: number;
    activeRentals: number;
  };
  work: {
    myReservations: number;
    myContracts: number;
    myClients: number;
    calendar: Array<{
      id: string;
      startDate: string;
      endDate: string;
      status: string;
      clientName: string;
      vehicle: string;
      registrationNumber: string;
    }>;
  };
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

export async function getSuperAdminDashboard(range: DashboardRange = "30d") {
  const response = await api.get<ApiItem<SuperAdminDashboardData>>("/dashboard/super-admin", { params: { range } });
  return response.data.data;
}

export async function searchSuperAdminDashboard(query: string) {
  const response = await api.get<ApiList<SuperAdminSearchResult>>("/dashboard/super-admin/search", { params: { q: query } });
  return response.data.data;
}

export async function getAgencyDashboard() {
  const response = await api.get<ApiItem<AgencyDashboardData>>("/dashboard/agency");
  return response.data.data;
}

export async function getStaffDashboard() {
  const response = await api.get<ApiItem<StaffDashboardData>>("/dashboard/staff");
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
