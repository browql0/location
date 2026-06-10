import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";

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
