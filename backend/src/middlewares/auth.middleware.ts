import type { RequestHandler } from "express";
import { AgencyStatus, SubscriptionStatus, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../prisma/prisma.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { mergeUserPermissions } from "../shared/utils/permissions.js";
import { verifyAccessToken } from "../modules/auth/token.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import { AuditAction } from "@prisma/client";
import "../shared/types/auth.js";

function getBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.get("authorization"));
    if (!token) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        agency: { select: { id: true, status: true } }
      }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppError("User account is not active", 403, "USER_BLOCKED");
    }

    let subscriptionStatus: SubscriptionStatus | null = null;

    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.agencyId || !user.agency) {
        throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
      }

      if (user.agency.status !== AgencyStatus.ACTIVE) {
        await createAuditLog({
          action: AuditAction.DISABLE,
          entity: "Agency",
          entityId: user.agencyId,
          userId: user.id,
          agencyId: user.agencyId,
          metadata: { event: "auth.denied.agency_status", agencyStatus: user.agency.status },
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
        throw new AppError("Agency is not active", 403, "AGENCY_BLOCKED");
      }

      const subscription = await prisma.subscription.findFirst({
        where: { agencyId: user.agencyId },
        orderBy: { createdAt: "desc" },
        select: { status: true }
      });
      subscriptionStatus = subscription?.status ?? null;

      if (subscriptionStatus === SubscriptionStatus.EXPIRED || subscriptionStatus === SubscriptionStatus.SUSPENDED) {
        await createAuditLog({
          action: AuditAction.DISABLE,
          entity: "Subscription",
          userId: user.id,
          agencyId: user.agencyId,
          metadata: { event: "auth.denied.subscription_status", subscriptionStatus },
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
        throw new AppError("Subscription is not active", 403, "SUBSCRIPTION_BLOCKED");
      }
    }

    req.auth = {
      userId: user.id,
      role: user.role,
      agencyId: user.agencyId,
      permissions: mergeUserPermissions(user.role, user.permissions),
      agencyStatus: user.agency?.status ?? null,
      subscriptionStatus
    };

    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Invalid access token", 401, "INVALID_ACCESS_TOKEN"));
  }
};
