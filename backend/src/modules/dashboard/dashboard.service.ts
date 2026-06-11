import { CarStatus, SubscriptionStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";

export async function getSuperAdminDashboard() {
  const [agencyCount, subscriptionCount, userCount, activeSubscriptions] = await Promise.all([
    prisma.agency.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE] } } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.subscription.findMany({
      where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] } },
      select: { amount: true }
    })
  ]);

  const revenueSaas = activeSubscriptions.reduce((sum, subscription) => sum + Number(subscription.amount ?? 0), 0);

  return {
    agencies: agencyCount,
    subscriptions: subscriptionCount,
    users: userCount,
    revenueSaas
  };
}

export async function getAgencyDashboard(auth: AuthContext) {
  const agencyId = auth.role === UserRole.SUPER_ADMIN ? null : auth.agencyId;
  if (!agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");

  const [vehicles, available, maintenance, inactive] = await Promise.all([
    prisma.car.count({ where: { agencyId, deletedAt: null } }),
    prisma.car.count({ where: { agencyId, deletedAt: null, status: CarStatus.AVAILABLE } }),
    prisma.car.count({ where: { agencyId, deletedAt: null, status: CarStatus.MAINTENANCE } }),
    prisma.car.count({ where: { agencyId, deletedAt: null, status: CarStatus.INACTIVE } })
  ]);

  return { vehicles, available, maintenance, inactive };
}
