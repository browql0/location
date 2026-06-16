import { AgencyStatus, AuditAction, BillingInterval, CarStatus, IncidentStatus, InvoiceStatus, InvoiceType, MaintenanceStatus, PaymentStatus, ReservationStatus, SubscriptionStatus, UserRole, VehicleAnomalySeverity, VehicleAnomalyType } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";

const activeSubscriptionStatuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE];
const revenueReservationStatuses = [ReservationStatus.CONFIRMED, ReservationStatus.IN_PROGRESS, ReservationStatus.COMPLETED];
const activeReservationStatuses = [ReservationStatus.CONFIRMED, ReservationStatus.IN_PROGRESS];
const failedPaymentStatuses = [SubscriptionStatus.PAST_DUE, SubscriptionStatus.SUSPENDED];

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("fr-MA", { month: "short", year: "2-digit" });
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDayLabel(date: Date) {
  return date.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
}

function resolveAnalyticsRange(range: string) {
  if (range === "7d") return { unit: "day" as const, count: 7, start: addDays(startOfDay(new Date()), -6) };
  if (range === "90d") return { unit: "month" as const, count: 3, start: addMonths(startOfMonth(new Date()), -2) };
  if (range === "1y") return { unit: "month" as const, count: 12, start: addMonths(startOfMonth(new Date()), -11) };
  return { unit: "day" as const, count: 30, start: addDays(startOfDay(new Date()), -29) };
}

function getPeriodKey(date: Date, unit: "day" | "month") {
  return unit === "day" ? getDayKey(date) : getMonthKey(date);
}

function buildPeriodSeries<T extends Record<string, number>>(range: ReturnType<typeof resolveAnalyticsRange>, createValue: (period: Date) => T) {
  const today = startOfDay(new Date());
  const currentMonth = startOfMonth(today);
  return Array.from({ length: range.count }, (_, index) => {
    const period = range.unit === "day" ? addDays(today, index - range.count + 1) : addMonths(currentMonth, index - range.count + 1);
    return {
      month: range.unit === "day" ? getDayLabel(period) : getMonthLabel(period),
      monthKey: getPeriodKey(period, range.unit),
      ...createValue(period)
    };
  });
}

function buildMonthSeries<T extends Record<string, number>>(monthsBack: number, createValue: (month: Date) => T) {
  const currentMonth = startOfMonth(new Date());
  return Array.from({ length: monthsBack }, (_, index) => {
    const month = addMonths(currentMonth, index - monthsBack + 1);
    return {
      month: getMonthLabel(month),
      monthKey: getMonthKey(month),
      ...createValue(month)
    };
  });
}

function normalizeMonthlyAmount(amount: unknown, interval: unknown) {
  const value = Number(amount ?? 0);
  return interval === BillingInterval.YEARLY ? value / 12 : value;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function ratioPercent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function formatAuditTitle(action: AuditAction, entity: string) {
  if (entity === "Agency" && action === AuditAction.CREATE) return "Nouvelle agence creee";
  if (entity === "Subscription" && action === AuditAction.CREATE) return "Nouvel abonnement";
  if (entity === "Subscription" && action === AuditAction.UPDATE) return "Plan modifie";
  if (entity === "Agency" && action === AuditAction.DISABLE) return "Agence suspendue";
  if (entity === "Reservation" && action === AuditAction.CREATE) return "Reservation creee";
  if (entity === "Client" && action === AuditAction.CREATE) return "Client cree";
  return `${entity} ${action.toLowerCase()}`;
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

function riskLevel(score: number) {
  if (score >= 75) return { level: "LOW" as const, label: "Risque Faible" };
  if (score >= 50) return { level: "MEDIUM" as const, label: "Risque Moyen" };
  return { level: "HIGH" as const, label: "Risque Eleve" };
}

export async function getSuperAdminDashboard(rangeInput = "30d") {
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysFromNow = new Date(todayStart.getTime() + 7 * 86_400_000);
  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(monthStart, 1);
  const previousMonthStart = addMonths(monthStart, -1);
  const analyticsRange = resolveAnalyticsRange(rangeInput);

  const [
    totalAgencies,
    activeAgencies,
    suspendedAgencies,
    trialSubscriptions,
    expiringSoon,
    activeSubscriptionsCount,
    activeSubscriptions,
    totalVehicles,
    totalClients,
    totalReservations,
    currentMonthAgencies,
    previousMonthAgencies,
    currentMonthReservations,
    previousMonthReservations,
    currentMonthClients,
    previousMonthClients,
    completedSubscriptions,
    trialRows,
    suspendedAgencyRows,
    failedPayments,
    openIncidents,
    plans,
    expiringSubscriptionsRows,
    topAgencyRows,
    auditRows,
    agencyGrowthRows,
    subscriptionTrendRows,
    reservationGrowthRows,
    clientGrowthRows,
    planRows
  ] = await Promise.all([
    prisma.agency.count({ where: { deletedAt: null } }),
    prisma.agency.count({ where: { deletedAt: null, status: AgencyStatus.ACTIVE } }),
    prisma.agency.count({ where: { deletedAt: null, status: AgencyStatus.SUSPENDED } }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.TRIALING } }),
    prisma.subscription.count({ where: { status: { in: activeSubscriptionStatuses }, endsAt: { gte: todayStart, lte: sevenDaysFromNow } } }),
    prisma.subscription.count({ where: { status: { in: activeSubscriptionStatuses } } }),
    prisma.subscription.findMany({
      where: { status: { in: activeSubscriptionStatuses } },
      select: { agencyId: true, planId: true, amount: true, billingInterval: true, status: true, endsAt: true }
    }),
    prisma.car.count({ where: { deletedAt: null } }),
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.reservation.count({ where: { status: { not: ReservationStatus.CANCELLED } } }),
    prisma.agency.count({ where: { deletedAt: null, createdAt: { gte: monthStart, lt: nextMonthStart } } }),
    prisma.agency.count({ where: { deletedAt: null, createdAt: { gte: previousMonthStart, lt: monthStart } } }),
    prisma.reservation.count({ where: { createdAt: { gte: monthStart, lt: nextMonthStart }, status: { not: ReservationStatus.CANCELLED } } }),
    prisma.reservation.count({ where: { createdAt: { gte: previousMonthStart, lt: monthStart }, status: { not: ReservationStatus.CANCELLED } } }),
    prisma.client.count({ where: { deletedAt: null, createdAt: { gte: monthStart, lt: nextMonthStart } } }),
    prisma.client.count({ where: { deletedAt: null, createdAt: { gte: previousMonthStart, lt: monthStart } } }),
    prisma.subscription.count({ where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] } } }),
    prisma.subscription.findMany({ where: { status: SubscriptionStatus.TRIALING }, select: { agencyId: true } }),
    prisma.agency.findMany({ where: { deletedAt: null, status: AgencyStatus.SUSPENDED }, select: { id: true, name: true } }),
    prisma.subscription.count({ where: { status: { in: failedPaymentStatuses } } }),
    prisma.incident.count({ where: { status: IncidentStatus.PENDING } }),
    prisma.subscriptionPlan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }], select: { id: true, name: true, maxUsers: true, maxCars: true, maxClients: true, maxReservations: true } }),
    prisma.subscription.findMany({
      where: { status: { in: activeSubscriptionStatuses }, endsAt: { gte: todayStart, lte: addDays(todayStart, 30) } },
      orderBy: { endsAt: "asc" },
      take: 12,
      select: { id: true, endsAt: true, agency: { select: { name: true } }, plan: { select: { name: true } } }
    }),
    prisma.agency.findMany({
      where: { deletedAt: null },
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        status: true,
        createdAt: true,
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1, select: { amount: true, billingInterval: true, status: true, plan: { select: { name: true } } } },
        _count: { select: { reservations: true, users: true, cars: true, clients: true } }
      }
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: "Agency" },
          { entity: "Subscription" },
          { entity: "SubscriptionPlan" },
          { entity: "Reservation" },
          { entity: "Client" }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { agency: { select: { name: true } }, user: { select: { firstName: true, lastName: true } } }
    }),
    prisma.agency.findMany({
      where: { deletedAt: null, createdAt: { gte: analyticsRange.start } },
      select: { createdAt: true }
    }),
    prisma.subscription.findMany({
      where: { createdAt: { gte: analyticsRange.start }, status: { in: activeSubscriptionStatuses } },
      select: { createdAt: true, amount: true, billingInterval: true }
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: analyticsRange.start }, status: { not: ReservationStatus.CANCELLED } },
      select: { createdAt: true }
    }),
    prisma.client.findMany({
      where: { deletedAt: null, createdAt: { gte: analyticsRange.start } },
      select: { createdAt: true }
    }),
    prisma.subscription.groupBy({
      by: ["planId"],
      where: { status: { in: activeSubscriptionStatuses } },
      _count: { _all: true },
      _sum: { amount: true }
    })
  ]);

  const planNames = new Map(plans.map((plan) => [plan.id, plan.name]));

  const mrr = activeSubscriptions.reduce((sum, subscription) => sum + normalizeMonthlyAmount(subscription.amount, subscription.billingInterval), 0);
  const arr = mrr * 12;
  const revenueSaas = activeSubscriptions.reduce((sum, subscription) => sum + Number(subscription.amount ?? 0), 0);
  const [saasInvoicesIssued, saasInvoiceSums, agenciesWithUnpaidSaasInvoice] = await Promise.all([
    prisma.invoice.count({ where: { type: InvoiceType.SAAS_INVOICE, status: { not: InvoiceStatus.CANCELLED } } }),
    prisma.invoice.aggregate({
      where: { type: InvoiceType.SAAS_INVOICE, status: { not: InvoiceStatus.CANCELLED } },
      _sum: { totalAmount: true, paidAmount: true }
    }),
    prisma.invoice.findMany({
      where: { type: InvoiceType.SAAS_INVOICE, status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.SENT, InvoiceStatus.PARTIAL] }, remainingAmount: { gt: 0 } },
      distinct: ["agencyId"],
      select: { agencyId: true }
    })
  ]);
  const monthlyGrowth = percentChange(currentMonthAgencies, previousMonthAgencies);
  const conversionRate = ratioPercent(completedSubscriptions, completedSubscriptions + trialRows.length);
  const churnRate = ratioPercent(suspendedAgencies, Math.max(totalAgencies, 1));
  const previousChurnRate = ratioPercent(await prisma.agency.count({ where: { deletedAt: null, status: AgencyStatus.SUSPENDED, updatedAt: { lt: monthStart } } }), Math.max(totalAgencies, 1));
  const previousMonthSubscriptionRows = await prisma.subscription.findMany({
    where: { createdAt: { lt: monthStart }, status: { in: activeSubscriptionStatuses } },
    select: { amount: true, billingInterval: true }
  });
  const previousMrr = previousMonthSubscriptionRows.reduce((sum, subscription) => sum + normalizeMonthlyAmount(subscription.amount, subscription.billingInterval), 0);
  const previousArr = previousMrr * 12;

  const agencyGrowthCounts = new Map<string, number>();
  for (const agency of agencyGrowthRows) {
    const key = getPeriodKey(agency.createdAt, analyticsRange.unit);
    agencyGrowthCounts.set(key, (agencyGrowthCounts.get(key) ?? 0) + 1);
  }

  const mrrByMonth = new Map<string, number>();
  for (const subscription of subscriptionTrendRows) {
    const key = getPeriodKey(subscription.createdAt, analyticsRange.unit);
    mrrByMonth.set(key, (mrrByMonth.get(key) ?? 0) + normalizeMonthlyAmount(subscription.amount, subscription.billingInterval));
  }

  const reservationCounts = new Map<string, number>();
  for (const reservation of reservationGrowthRows) {
    const key = getPeriodKey(reservation.createdAt, analyticsRange.unit);
    reservationCounts.set(key, (reservationCounts.get(key) ?? 0) + 1);
  }

  const clientCounts = new Map<string, number>();
  for (const client of clientGrowthRows) {
    const key = getPeriodKey(client.createdAt, analyticsRange.unit);
    clientCounts.set(key, (clientCounts.get(key) ?? 0) + 1);
  }

  const currentMonthReservationCounts = await prisma.reservation.groupBy({
    by: ["agencyId"],
    where: { createdAt: { gte: monthStart, lt: nextMonthStart }, status: { not: ReservationStatus.CANCELLED } },
    _count: { _all: true }
  });
  const previousMonthReservationCounts = await prisma.reservation.groupBy({
    by: ["agencyId"],
    where: { createdAt: { gte: previousMonthStart, lt: monthStart }, status: { not: ReservationStatus.CANCELLED } },
    _count: { _all: true }
  });
  const currentByAgency = new Map(currentMonthReservationCounts.map((row) => [row.agencyId, row._count._all]));
  const previousByAgency = new Map(previousMonthReservationCounts.map((row) => [row.agencyId, row._count._all]));
  const totalRevenueRows = await prisma.reservation.groupBy({
    by: ["agencyId"],
    where: { status: { in: revenueReservationStatuses } },
    _sum: { totalAmount: true }
  });
  const revenueByAgency = new Map(totalRevenueRows.map((row) => [row.agencyId, Number(row._sum.totalAmount ?? 0)]));
  const totalPortfolioRevenue = [...revenueByAgency.values()].reduce((sum, value) => sum + value, 0);

  const topAgencies = topAgencyRows
    .map((agency) => {
      const latestSubscription = agency.subscriptions[0];
      const mrrValue = normalizeMonthlyAmount(latestSubscription?.amount, latestSubscription?.billingInterval);
      const growth = percentChange(currentByAgency.get(agency.id) ?? 0, previousByAgency.get(agency.id) ?? 0);
      const isCritical = agency.status === AgencyStatus.SUSPENDED || latestSubscription?.status === SubscriptionStatus.SUSPENDED;
      const isRisk = latestSubscription?.status === SubscriptionStatus.PAST_DUE;
      const badges = isCritical ? ["CRITICAL" as const] : isRisk ? ["RISK" as const] : growth >= 30 ? ["FAST_GROWING" as const] : ["STABLE" as const];
      const revenueTotal = revenueByAgency.get(agency.id) ?? 0;
      return {
        id: agency.id,
        name: agency.name,
        logoUrl: agency.logoUrl,
        plan: latestSubscription?.plan.name ?? "Sans plan",
        mrr: mrrValue,
        revenueTotal,
        reservations: agency._count.reservations,
        clients: agency._count.clients,
        growth,
        revenueShare: ratioPercent(revenueTotal, totalPortfolioRevenue),
        badges
      };
    })
    .sort((a, b) => b.mrr - a.mrr || b.reservations - a.reservations)
    .slice(0, 5);

  const plansAtLimit = plans.reduce((count, plan) => {
    const agencyOnPlan = topAgencyRows.filter((agency) => agency.subscriptions[0]?.plan.name === plan.name);
    const limited = agencyOnPlan.some((agency) => {
      const userLimit = plan.maxUsers ? agency._count.users / plan.maxUsers >= 0.9 : false;
      const carLimit = plan.maxCars ? agency._count.cars / plan.maxCars >= 0.9 : false;
      const clientLimit = plan.maxClients ? agency._count.clients / plan.maxClients >= 0.9 : false;
      const reservationLimit = plan.maxReservations ? agency._count.reservations / plan.maxReservations >= 0.9 : false;
      return userLimit || carLimit || clientLimit || reservationLimit;
    });
    return limited ? count + 1 : count;
  }, 0);

  const planDistribution = planRows.map((row) => {
    const planMrr = activeSubscriptions
      .filter((subscription) => subscription.planId === row.planId)
      .reduce((sum, subscription) => sum + normalizeMonthlyAmount(subscription.amount, subscription.billingInterval), 0);
    return {
      name: planNames.get(row.planId) ?? "Plan inconnu",
      value: row._count._all,
      percentage: ratioPercent(row._count._all, activeSubscriptionsCount),
      mrr: planMrr
    };
  });

  const riskAgencyIds = new Set([
    ...suspendedAgencyRows.map((agency) => agency.id),
    ...activeSubscriptions.filter((subscription) => subscription.status === SubscriptionStatus.PAST_DUE || subscription.endsAt <= sevenDaysFromNow).map((subscription) => subscription.agencyId)
  ]);
  const riskDrivers = [
    { label: "Agences suspendues", value: suspendedAgencies, impact: suspendedAgencies * 8 },
    { label: "Paiements echoues", value: failedPayments, impact: failedPayments * 6 },
    { label: "Expirations sous 7 jours", value: expiringSoon, impact: expiringSoon * 4 },
    { label: "Churn", value: churnRate, impact: Math.round(churnRate * 1.5) },
    { label: "Incidents ouverts", value: openIncidents, impact: openIncidents * 5 }
  ];
  const riskScore = Math.max(0, Math.min(100, 100 - riskDrivers.reduce((sum, driver) => sum + driver.impact, 0)));
  const risk = riskLevel(riskScore);
  const bestAgency = topAgencies[0];
  const insights = [
    `MRR ${percentChange(mrr, previousMrr) >= 0 ? "en hausse" : "en baisse"} de ${Math.abs(percentChange(mrr, previousMrr))}%.`,
    bestAgency ? `${bestAgency.name} genere ${bestAgency.revenueShare}% du revenu total.` : "Aucune agence revenue leader detectee.",
    `${expiringSoon} abonnements expirent cette semaine.`,
    risk.level === "HIGH" ? `${riskAgencyIds.size} agences necessitent une action prioritaire.` : "Aucune agence critique detectee."
  ];
  const alertItems = [
    { id: "expiring", level: expiringSoon > 0 ? ("WARNING" as const) : ("INFO" as const), title: "Abonnements expirant sous 7 jours", detail: "Renouvellements a securiser", count: expiringSoon },
    { id: "failed-payments", level: failedPayments > 0 ? ("CRITICAL" as const) : ("INFO" as const), title: "Paiements echoues", detail: "Facturation a relancer", count: failedPayments },
    { id: "suspended", level: suspendedAgencies > 0 ? ("CRITICAL" as const) : ("INFO" as const), title: "Agences suspendues", detail: "Risque revenu immediat", count: suspendedAgencies },
    { id: "limits", level: plansAtLimit > 0 ? ("WARNING" as const) : ("INFO" as const), title: "Plans atteignant leurs limites", detail: "Opportunites upsell", count: plansAtLimit },
    { id: "incidents", level: openIncidents > 0 ? ("WARNING" as const) : ("INFO" as const), title: "Incidents ouverts", detail: "Litiges en attente", count: openIncidents }
  ].sort((a, b) => ({ CRITICAL: 0, WARNING: 1, INFO: 2 }[a.level] - { CRITICAL: 0, WARNING: 1, INFO: 2 }[b.level]));
  const expectedRenewals = expiringSubscriptionsRows.filter((subscription) => subscription.endsAt <= addDays(todayStart, 30)).length;
  const likelyConversions = Math.max(0, Math.round(trialRows.length * (conversionRate / 100)));
  const nextMonthMrr = Math.round(mrr * (1 + Math.max(percentChange(mrr, previousMrr), 0) / 100) + likelyConversions * (mrr / Math.max(activeSubscriptionsCount, 1)));

  return {
    insights,
    header: {
      mrr,
      arr,
      activeAgencies,
      churnRate,
      expiringSoon,
      mrrChange: percentChange(mrr, previousMrr),
      arrChange: percentChange(arr, previousArr),
      activeAgenciesChange: monthlyGrowth,
      churnChange: churnRate - previousChurnRate
    },
    kpis: {
      totalAgencies,
      activeAgencies,
      suspendedAgencies,
      activeSubscriptions: activeSubscriptionsCount,
      mrr,
      arr,
      revenueSaas,
      saasInvoicesIssued,
      saasRevenueInvoiced: Number(saasInvoiceSums._sum.totalAmount ?? 0),
      saasRevenuePaid: Number(saasInvoiceSums._sum.paidAmount ?? 0),
      agenciesWithUnpaidSaasInvoice: agenciesWithUnpaidSaasInvoice.length,
      totalVehicles,
      totalClients,
      totalReservations,
      trialSubscriptions,
      expiringSoon
    },
    businessHealth: {
      mrr,
      arr,
      monthlyGrowth,
      trialConversionRate: conversionRate,
      churnRate,
      suspendedAgencies
    },
    topAgencies,
    risk: {
      score: riskScore,
      level: risk.level,
      label: risk.label,
      drivers: riskDrivers
    },
    alerts: {
      expiringSubscriptions: expiringSoon,
      failedPayments,
      suspendedAgencies,
      openIncidents,
      plansAtLimit,
      items: alertItems
    },
    expirations: expiringSubscriptionsRows.map((subscription) => ({
      id: subscription.id,
      agencyName: subscription.agency.name,
      plan: subscription.plan.name,
      endsAt: subscription.endsAt,
      daysLeft: daysBetween(todayStart, subscription.endsAt)
    })),
    activity: auditRows.map((log) => ({
      id: log.id,
      title: formatAuditTitle(log.action, log.entity),
      action: log.action,
      entity: log.entity,
      agencyName: log.agency?.name ?? null,
      actorName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
      createdAt: log.createdAt
    })),
    predictive: {
      nextMonthMrr,
      nextMonthArr: nextMonthMrr * 12,
      expectedRenewals,
      likelyConversions,
      estimatedGrowth: percentChange(nextMonthMrr, mrr),
      basis: [
        `${trialRows.length} trials actifs`,
        `${expectedRenewals} renouvellements attendus`,
        `${percentChange(mrr, previousMrr)}% de tendance MRR actuelle`
      ]
    },
    charts: {
      agencyGrowth: buildPeriodSeries(analyticsRange, (period) => ({ agencies: agencyGrowthCounts.get(getPeriodKey(period, analyticsRange.unit)) ?? 0 })),
      mrrEvolution: buildPeriodSeries(analyticsRange, (period) => ({ mrr: mrrByMonth.get(getPeriodKey(period, analyticsRange.unit)) ?? 0 })),
      reservations: buildPeriodSeries(analyticsRange, (period) => ({ reservations: reservationCounts.get(getPeriodKey(period, analyticsRange.unit)) ?? 0 })),
      clients: buildPeriodSeries(analyticsRange, (period) => ({ clients: clientCounts.get(getPeriodKey(period, analyticsRange.unit)) ?? 0 })),
      monthComparison: {
        agencies: { current: currentMonthAgencies, previous: previousMonthAgencies, change: monthlyGrowth },
        reservations: { current: currentMonthReservations, previous: previousMonthReservations, change: percentChange(currentMonthReservations, previousMonthReservations) },
        clients: { current: currentMonthClients, previous: previousMonthClients, change: percentChange(currentMonthClients, previousMonthClients) },
        mrr: { current: mrr, previous: previousMrr, change: percentChange(mrr, previousMrr) }
      },
      planDistribution
    }
  };
}

export async function searchSuperAdminDashboard(query: string) {
  const search = query.trim();
  if (search.length < 2) {
    return [];
  }

  const [agencies, clients, cars, reservations, users] = await Promise.all([
    prisma.agency.findMany({
      where: { deletedAt: null, OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { city: { contains: search, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, name: true, email: true }
    }),
    prisma.client.findMany({
      where: { deletedAt: null, OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { phone: { contains: search, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true }
    }),
    prisma.car.findMany({
      where: { deletedAt: null, OR: [{ brand: { contains: search, mode: "insensitive" } }, { model: { contains: search, mode: "insensitive" } }, { registrationNumber: { contains: search, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, brand: true, model: true, registrationNumber: true }
    }),
    prisma.reservation.findMany({
      where: { OR: [{ id: { contains: search, mode: "insensitive" } }, { client: { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] } }, { car: { registrationNumber: { contains: search, mode: "insensitive" } } }] },
      take: 5,
      select: { id: true, startDate: true, client: { select: { firstName: true, lastName: true } } }
    }),
    prisma.user.findMany({
      where: { deletedAt: null, OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true }
    })
  ]);

  return [
    ...agencies.map((agency) => ({ type: "Agence", id: agency.id, title: agency.name, subtitle: agency.email, href: `/super-admin/agencies` })),
    ...clients.map((client) => ({ type: "Client", id: client.id, title: `${client.firstName} ${client.lastName}`, subtitle: client.email, href: `/clients/${client.id}` })),
    ...cars.map((car) => ({ type: "Vehicule", id: car.id, title: `${car.brand} ${car.model}`, subtitle: car.registrationNumber, href: `/cars/${car.id}` })),
    ...reservations.map((reservation) => ({ type: "Reservation", id: reservation.id, title: `${reservation.client.firstName} ${reservation.client.lastName}`, subtitle: reservation.startDate.toISOString(), href: `/reservations/${reservation.id}` })),
    ...users.map((user) => ({ type: "Utilisateur", id: user.id, title: `${user.firstName} ${user.lastName}`, subtitle: user.email, href: `/staff` }))
  ].slice(0, 12);
}

export async function getAgencyDashboard(auth: AuthContext) {
  const agencyId = auth.role === UserRole.SUPER_ADMIN ? null : auth.agencyId;
  if (!agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");

  const todayStart = startOfDay(new Date());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const monthStart = startOfMonth(todayStart);
  const nextMonthStart = addMonths(monthStart, 1);
  const yearStart = new Date(todayStart.getFullYear(), 0, 1);
  const nextYearStart = new Date(todayStart.getFullYear() + 1, 0, 1);
  const sixMonthsAgo = addMonths(monthStart, -5);
  const thirtyDaysFromNow = new Date(todayStart.getTime() + 30 * 86_400_000);

  const [
    vehicles,
    available,
    rented,
    maintenance,
    reservationsToday,
    reservationsMonth,
    revenueMonthAggregate,
    revenueYearAggregate,
    activeClients,
    upcomingReservations,
    contractsToSign,
    overduePayments,
    expiredDocuments,
    maintenanceAlerts,
    monthlyRevenueRows,
    occupancyRows,
    topVehicleRows,
    vehiclesNeedingMaintenance,
    overdueOilChanges,
    plannedMaintenanceCount,
    criticalAnomalies,
    expiredInsurances,
    expiredTechnicalInspections
  ] = await Promise.all([
    prisma.car.count({ where: { agencyId, deletedAt: null, status: { not: CarStatus.INACTIVE } } }),
    prisma.car.count({ where: { agencyId, deletedAt: null, status: CarStatus.AVAILABLE } }),
    prisma.car.count({ where: { agencyId, deletedAt: null, status: CarStatus.RENTED } }),
    prisma.car.count({ where: { agencyId, deletedAt: null, status: CarStatus.MAINTENANCE } }),
    prisma.reservation.count({ where: { agencyId, startDate: { lt: todayEnd }, endDate: { gt: todayStart }, status: { in: activeReservationStatuses } } }),
    prisma.reservation.count({ where: { agencyId, startDate: { gte: monthStart, lt: nextMonthStart }, status: { not: ReservationStatus.CANCELLED } } }),
    prisma.reservation.aggregate({ where: { agencyId, startDate: { gte: monthStart, lt: nextMonthStart }, status: { in: revenueReservationStatuses } }, _sum: { totalAmount: true } }),
    prisma.reservation.aggregate({ where: { agencyId, startDate: { gte: yearStart, lt: nextYearStart }, status: { in: revenueReservationStatuses } }, _sum: { totalAmount: true } }),
    prisma.client.count({ where: { agencyId, deletedAt: null, reservations: { some: { status: { in: activeReservationStatuses } } } } }),
    prisma.reservation.findMany({
      where: { agencyId, startDate: { gte: todayStart }, status: ReservationStatus.CONFIRMED },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { id: true, startDate: true, endDate: true, client: { select: { firstName: true, lastName: true } }, car: { select: { brand: true, model: true, registrationNumber: true } } }
    }),
    prisma.contract.count({ where: { agencyId, signedAt: null } }),
    prisma.reservation.count({ where: { agencyId, paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] }, endDate: { lt: todayStart }, status: { not: ReservationStatus.CANCELLED } } }),
    prisma.car.count({
      where: {
        agencyId,
        deletedAt: null,
        OR: [
          { insuranceExpiryDate: { lt: todayStart } },
          { technicalVisitExpiryDate: { lt: todayStart } }
        ]
      }
    }),
    prisma.car.count({ where: { agencyId, deletedAt: null, status: CarStatus.MAINTENANCE } }),
    prisma.reservation.findMany({ where: { agencyId, startDate: { gte: sixMonthsAgo }, status: { in: revenueReservationStatuses } }, select: { startDate: true, totalAmount: true } }),
    prisma.reservation.findMany({ where: { agencyId, endDate: { gte: sixMonthsAgo }, startDate: { lt: addMonths(monthStart, 1) }, status: { in: activeReservationStatuses } }, select: { startDate: true, endDate: true } }),
    prisma.reservation.groupBy({
      by: ["carId"],
      where: { agencyId, startDate: { gte: yearStart }, status: { in: revenueReservationStatuses } },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5
    }),
    prisma.car.count({ where: { agencyId, deletedAt: null, nextMaintenanceKm: { not: null }, currentMileage: { gt: prisma.car.fields.nextMaintenanceKm } } }),
    prisma.car.count({ where: { agencyId, deletedAt: null, nextOilChangeKm: { not: null }, currentMileage: { gt: prisma.car.fields.nextOilChangeKm } } }),
    prisma.maintenanceRecord.count({ where: { agencyId, deletedAt: null, status: MaintenanceStatus.PLANNED } }),
    prisma.vehicleAnomaly.count({ where: { agencyId, resolved: false, severity: VehicleAnomalySeverity.CRITICAL } }),
    prisma.vehicleAnomaly.count({ where: { agencyId, resolved: false, type: VehicleAnomalyType.INSURANCE_EXPIRED } }),
    prisma.vehicleAnomaly.count({ where: { agencyId, resolved: false, type: VehicleAnomalyType.TECHNICAL_INSPECTION_EXPIRED } })
  ]);

  const cars = await prisma.car.findMany({
    where: { id: { in: topVehicleRows.map((row) => row.carId) } },
    select: { id: true, brand: true, model: true, registrationNumber: true }
  });
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const revenueMonth = Number(revenueMonthAggregate._sum.totalAmount ?? 0);
  const revenueYear = Number(revenueYearAggregate._sum.totalAmount ?? 0);
  const [rentalInvoicesIssued, rentalInvoiceSums] = await Promise.all([
    prisma.invoice.count({ where: { agencyId, type: InvoiceType.RENTAL_INVOICE, status: { not: InvoiceStatus.CANCELLED } } }),
    prisma.invoice.aggregate({
      where: { agencyId, type: InvoiceType.RENTAL_INVOICE, status: { not: InvoiceStatus.CANCELLED } },
      _sum: { totalAmount: true, paidAmount: true, remainingAmount: true }
    })
  ]);
  const occupancyRate = vehicles > 0 ? Math.round((rented / vehicles) * 100) : 0;

  const monthlyRevenue = new Map<string, number>();
  for (const reservation of monthlyRevenueRows) {
    const key = getMonthKey(reservation.startDate);
    monthlyRevenue.set(key, (monthlyRevenue.get(key) ?? 0) + Number(reservation.totalAmount));
  }

  const monthlyOccupancy = buildMonthSeries(6, (month) => {
    const monthStartDate = startOfMonth(month);
    const monthEndDate = addMonths(monthStartDate, 1);
    const monthDays = Math.max(1, Math.round((monthEndDate.getTime() - monthStartDate.getTime()) / 86_400_000));
    const occupiedDays = occupancyRows.reduce((sum, reservation) => {
      const start = reservation.startDate > monthStartDate ? reservation.startDate : monthStartDate;
      const end = reservation.endDate < monthEndDate ? reservation.endDate : monthEndDate;
      return sum + Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
    }, 0);
    return { occupancy: vehicles > 0 ? Math.round((occupiedDays / (vehicles * monthDays)) * 100) : 0 };
  });

  return {
    kpis: {
      availableVehicles: available,
      rentedVehicles: rented,
      maintenanceVehicles: maintenance,
      reservationsToday,
      reservationsMonth,
      revenueMonth,
      revenueYear,
      rentalInvoicesIssued,
      rentalAmountInvoiced: Number(rentalInvoiceSums._sum.totalAmount ?? 0),
      rentalAmountPaid: Number(rentalInvoiceSums._sum.paidAmount ?? 0),
      rentalAmountRemaining: Number(rentalInvoiceSums._sum.remainingAmount ?? 0),
      vehiclesNeedingMaintenance,
      overdueOilChanges,
      plannedMaintenance: plannedMaintenanceCount,
      criticalAnomalies,
      expiredTechnicalInspections,
      expiredInsurances,
      activeClients,
      fleetOccupancyRate: occupancyRate
    },
    alerts: {
      upcomingReservations: upcomingReservations.map((reservation) => ({
        id: reservation.id,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
        vehicle: `${reservation.car.brand} ${reservation.car.model}`,
        registrationNumber: reservation.car.registrationNumber
      })),
      contractsToSign,
      overduePayments,
      expiredDocuments,
      maintenanceAlerts
    },
    charts: {
      monthlyRevenue: buildMonthSeries(6, (month) => ({ revenue: monthlyRevenue.get(getMonthKey(month)) ?? 0 })),
      fleetOccupancy: monthlyOccupancy,
      topVehicles: topVehicleRows.map((row) => {
        const car = carsById.get(row.carId);
        return {
          name: car ? `${car.brand} ${car.model}` : "Vehicule inconnu",
          registrationNumber: car?.registrationNumber ?? "",
          revenue: Number(row._sum.totalAmount ?? 0)
        };
      })
    }
  };
}

export async function getStaffDashboard(auth: AuthContext) {
  if (!auth.agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");

  const todayStart = startOfDay(new Date());
  const nextMonthStart = addMonths(startOfMonth(todayStart), 1);

  const [myReservations, myContracts, myClients, calendar, reservationsCreated, contractsCreated, activeRentals] = await Promise.all([
    prisma.reservation.count({ where: { agencyId: auth.agencyId, createdById: auth.userId, status: { not: ReservationStatus.CANCELLED } } }),
    prisma.contract.count({ where: { agencyId: auth.agencyId, reservation: { createdById: auth.userId } } }),
    prisma.client.count({ where: { agencyId: auth.agencyId, deletedAt: null, reservations: { some: { createdById: auth.userId } } } }),
    prisma.reservation.findMany({
      where: { agencyId: auth.agencyId, createdById: auth.userId, startDate: { lt: nextMonthStart }, endDate: { gte: todayStart }, status: { in: activeReservationStatuses } },
      orderBy: { startDate: "asc" },
      take: 10,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        client: { select: { firstName: true, lastName: true } },
        car: { select: { brand: true, model: true, registrationNumber: true } }
      }
    }),
    prisma.reservation.count({ where: { agencyId: auth.agencyId, createdById: auth.userId, createdAt: { gte: startOfMonth(todayStart) } } }),
    prisma.contract.count({ where: { agencyId: auth.agencyId, reservation: { createdById: auth.userId }, createdAt: { gte: startOfMonth(todayStart) } } }),
    prisma.reservation.count({ where: { agencyId: auth.agencyId, createdById: auth.userId, status: ReservationStatus.IN_PROGRESS } })
  ]);

  return {
    kpis: {
      reservationsCreated,
      contractsCreated,
      activeRentals
    },
    work: {
      myReservations,
      myContracts,
      myClients,
      calendar: calendar.map((reservation) => ({
        id: reservation.id,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        status: reservation.status,
        clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
        vehicle: `${reservation.car.brand} ${reservation.car.model}`,
        registrationNumber: reservation.car.registrationNumber
      }))
    }
  };
}
