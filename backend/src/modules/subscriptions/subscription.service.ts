import { AgencyStatus, AuditAction, BillingInterval, SubscriptionStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { isSuperAdmin, requireAgencyScope } from "../../shared/utils/authz.js";
import { createAuditLog } from "../audit/audit.service.js";
import type { ChangePlanInput, SubscriptionQueryInput } from "./subscription.schemas.js";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

function assertCanRead(auth: AuthContext, agencyId?: string | null) {
  if (auth.role === UserRole.SUPER_ADMIN) return;
  if (auth.role === UserRole.AGENCY_ADMIN && auth.agencyId && (!agencyId || auth.agencyId === agencyId)) return;
  if (auth.permissions.includes("subscriptions:read") && auth.agencyId && (!agencyId || auth.agencyId === agencyId)) return;
  throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
}

function assertSuperAdmin(auth: AuthContext) {
  if (!isSuperAdmin(auth)) {
    throw new AppError("Super admin role is required", 403, "SUPER_ADMIN_REQUIRED");
  }
}

const subscriptionInclude = {
  agency: { select: { id: true, name: true, email: true, status: true } },
  plan: true
};

export async function listSubscriptions(query: SubscriptionQueryInput, auth: AuthContext) {
  assertCanRead(auth, query.agencyId);
  const agencyId = requireAgencyScope(auth, query.agencyId);
  return prisma.subscription.findMany({
    where: {
      ...(agencyId ? { agencyId } : {}),
      ...(query.status ? { status: query.status } : {})
    },
    include: subscriptionInclude,
    orderBy: { createdAt: "desc" }
  });
}

export async function getSubscription(id: string, auth: AuthContext) {
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: subscriptionInclude });
  if (!subscription) throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
  assertCanRead(auth, subscription.agencyId);
  return subscription;
}

export async function getCurrentAgencySubscription(auth: AuthContext) {
  if (!auth.agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  const subscription = await prisma.subscription.findFirst({
    where: { agencyId: auth.agencyId },
    include: subscriptionInclude,
    orderBy: { createdAt: "desc" }
  });
  if (!subscription) throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
  return subscription;
}

export async function changePlan(id: string, input: ChangePlanInput, auth: AuthContext, meta: RequestMeta) {
  assertSuperAdmin(auth);
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!subscription) throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
  const plan = await prisma.subscriptionPlan.findFirst({ where: { id: input.planId, isActive: true } });
  if (!plan) throw new AppError("Active subscription plan not found", 404, "PLAN_NOT_FOUND");

  const amount = input.billingInterval === BillingInterval.YEARLY ? plan.priceYearly ?? plan.priceMonthly : plan.priceMonthly;
  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      planId: plan.id,
      previousPlanId: subscription.planId,
      billingInterval: input.billingInterval,
      status: SubscriptionStatus.ACTIVE,
      amount,
      currency: plan.currency,
      metadata: { changedFromPlanId: subscription.planId, changedAt: new Date().toISOString() }
    },
    include: subscriptionInclude
  });

  await prisma.agency.update({ where: { id: updated.agencyId }, data: { status: AgencyStatus.ACTIVE } });
  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "Subscription",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: { event: "subscription.change_plan", planId: plan.id },
    ...meta
  });
  return updated;
}

export async function setSubscriptionStatus(
  id: string,
  status: typeof SubscriptionStatus.ACTIVE | typeof SubscriptionStatus.SUSPENDED,
  auth: AuthContext,
  meta: RequestMeta
) {
  assertSuperAdmin(auth);
  const current = await prisma.subscription.findUnique({ where: { id } });
  if (!current) throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");

  const now = new Date();
  const renewedEndsAt = new Date(now);
  if (current.billingInterval === BillingInterval.YEARLY) {
    renewedEndsAt.setFullYear(renewedEndsAt.getFullYear() + 1);
  } else {
    renewedEndsAt.setMonth(renewedEndsAt.getMonth() + 1);
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status,
      suspendedAt: status === SubscriptionStatus.SUSPENDED ? now : null,
      ...(status === SubscriptionStatus.ACTIVE && current.endsAt < now ? { startsAt: now, endsAt: renewedEndsAt } : {})
    },
    include: subscriptionInclude
  });

  await prisma.agency.update({
    where: { id: updated.agencyId },
    data: { status: status === SubscriptionStatus.ACTIVE ? AgencyStatus.ACTIVE : AgencyStatus.SUSPENDED }
  });

  await createAuditLog({
    action: status === SubscriptionStatus.ACTIVE ? AuditAction.ENABLE : AuditAction.DISABLE,
    entity: "Subscription",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: { event: status === SubscriptionStatus.ACTIVE ? "subscription.reactivate" : "subscription.suspend" },
    ...meta
  });
  return updated;
}

export async function getSubscriptionHistory(id: string, auth: AuthContext) {
  const subscription = await getSubscription(id, auth);
  return prisma.auditLog.findMany({
    where: { OR: [{ entity: "Subscription", entityId: id }, { agencyId: subscription.agencyId, entity: "Agency" }] },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}
