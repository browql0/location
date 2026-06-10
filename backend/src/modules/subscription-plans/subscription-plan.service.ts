import { AuditAction, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import { createAuditLog } from "../audit/audit.service.js";
import type { AuthContext } from "../../shared/types/auth.js";
import type { CreateSubscriptionPlanInput, UpdateSubscriptionPlanInput } from "./subscription-plan.schemas.js";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

function assertSuperAdmin(auth: AuthContext) {
  if (auth.role !== UserRole.SUPER_ADMIN) {
    throw new AppError("Super admin role is required", 403, "SUPER_ADMIN_REQUIRED");
  }
}

export async function listPlans() {
  return prisma.subscriptionPlan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }, { name: "asc" }] });
}

export async function createPlan(input: CreateSubscriptionPlanInput, auth: AuthContext, meta: RequestMeta) {
  assertSuperAdmin(auth);
  const plan = await prisma.subscriptionPlan.create({ data: input });
  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "SubscriptionPlan",
    entityId: plan.id,
    userId: auth.userId,
    metadata: { event: "subscription_plan.create", name: plan.name },
    ...meta
  });
  return plan;
}

export async function updatePlan(id: string, input: UpdateSubscriptionPlanInput, auth: AuthContext, meta: RequestMeta) {
  assertSuperAdmin(auth);
  const plan = await prisma.subscriptionPlan.update({ where: { id }, data: input }).catch(() => null);
  if (!plan) {
    throw new AppError("Subscription plan not found", 404, "PLAN_NOT_FOUND");
  }
  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "SubscriptionPlan",
    entityId: plan.id,
    userId: auth.userId,
    metadata: { event: "subscription_plan.update", name: plan.name },
    ...meta
  });
  return plan;
}

export async function setPlanActive(id: string, isActive: boolean, auth: AuthContext, meta: RequestMeta) {
  assertSuperAdmin(auth);
  const plan = await prisma.subscriptionPlan.update({ where: { id }, data: { isActive } }).catch(() => null);
  if (!plan) {
    throw new AppError("Subscription plan not found", 404, "PLAN_NOT_FOUND");
  }
  await createAuditLog({
    action: isActive ? AuditAction.ENABLE : AuditAction.DISABLE,
    entity: "SubscriptionPlan",
    entityId: plan.id,
    userId: auth.userId,
    metadata: { event: isActive ? "subscription_plan.enable" : "subscription_plan.disable", name: plan.name },
    ...meta
  });
  return plan;
}
