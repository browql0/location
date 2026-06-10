import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";

type FeatureKey =
  | "canUseInvoices"
  | "canUseContracts"
  | "canUseIncidents"
  | "canUseAdvancedReports"
  | "canUseApiAccess";

async function getPlanWithCounts(agencyId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      agency: { include: { _count: { select: { users: true, cars: true, clients: true, reservations: true } } } }
    }
  });
  if (!subscription) throw new AppError("Subscription is required", 403, "SUBSCRIPTION_REQUIRED");
  return subscription;
}

function assertBelowLimit(current: number, limit: number | null, code: string, message: string) {
  if (limit !== null && current >= limit) {
    throw new AppError(message, 403, code, { current, limit });
  }
}

export const PlanLimitService = {
  async assertCanCreateUser(agencyId: string) {
    const subscription = await getPlanWithCounts(agencyId);
    assertBelowLimit(subscription.agency._count.users, subscription.plan.maxUsers, "PLAN_USER_LIMIT_REACHED", "User limit reached for current plan");
  },

  async assertCanCreateCar(agencyId: string) {
    const subscription = await getPlanWithCounts(agencyId);
    assertBelowLimit(subscription.agency._count.cars, subscription.plan.maxCars, "PLAN_CAR_LIMIT_REACHED", "Car limit reached for current plan");
  },

  async assertCanCreateClient(agencyId: string) {
    const subscription = await getPlanWithCounts(agencyId);
    assertBelowLimit(subscription.agency._count.clients, subscription.plan.maxClients, "PLAN_CLIENT_LIMIT_REACHED", "Client limit reached for current plan");
  },

  async assertCanCreateReservation(agencyId: string) {
    const subscription = await getPlanWithCounts(agencyId);
    assertBelowLimit(
      subscription.agency._count.reservations,
      subscription.plan.maxReservations,
      "PLAN_RESERVATION_LIMIT_REACHED",
      "Reservation limit reached for current plan"
    );
  },

  async assertFeatureEnabled(agencyId: string, feature: FeatureKey) {
    const subscription = await getPlanWithCounts(agencyId);
    if (!subscription.plan[feature]) {
      throw new AppError("Feature is not enabled for current plan", 403, "PLAN_FEATURE_DISABLED", { feature });
    }
  }
};
