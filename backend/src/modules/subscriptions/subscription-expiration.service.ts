import { AgencyStatus, AuditAction, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";

export const SubscriptionExpirationService = {
  async checkExpiredSubscriptions(now = new Date()) {
    const expired = await prisma.subscription.findMany({
      where: {
        endsAt: { lt: now },
        status: { in: [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] }
      },
      include: { agency: true }
    });

    for (const subscription of expired) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED }
        }),
        prisma.agency.update({
          where: { id: subscription.agencyId },
          data: { status: AgencyStatus.SUSPENDED }
        }),
        prisma.auditLog.create({
          data: {
            action: AuditAction.DISABLE,
            entity: "Subscription",
            entityId: subscription.id,
            agencyId: subscription.agencyId,
            metadata: { event: "subscription.expired", checkedAt: now.toISOString() }
          }
        })
      ]);
    }

    return { expiredCount: expired.length, subscriptionIds: expired.map((subscription) => subscription.id) };
  }
};
