import bcrypt from "bcrypt";
import { AgencyStatus, AuditAction, SubscriptionStatus, UserRole, UserStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { prisma } from "../../prisma/prisma.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import { mergeUserPermissions } from "../../shared/utils/permissions.js";
import type { ChangePasswordInput, LoginInput, RegisterAgencyInput } from "./auth.schemas.js";
import { generateRefreshToken, generateTokenFamily, hashRefreshToken, refreshTokenExpiryDate, signAccessToken } from "./token.service.js";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

function publicUser(user: {
  id: string;
  agencyId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  agency?: { id: string; name: string; status: AgencyStatus } | null;
}) {
  return {
    id: user.id,
    agencyId: user.agencyId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    permissions: mergeUserPermissions(user.role, user.permissions),
    agency: user.agency
  };
}

async function getCurrentSubscriptionStatus(agencyId: string | null) {
  if (!agencyId) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    select: { status: true }
  });

  return subscription?.status ?? null;
}

async function assertAccountCanAuthenticate(user: {
  id: string;
  role: UserRole;
  status: UserStatus;
  agencyId: string | null;
  agency: { status: AgencyStatus } | null;
}, meta: RequestMeta) {
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError("User account is not active", 403, "USER_BLOCKED");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    return;
  }

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
      ...meta
    });
    throw new AppError("Agency is not active", 403, "AGENCY_BLOCKED");
  }

  const subscriptionStatus = await getCurrentSubscriptionStatus(user.agencyId);
  if (subscriptionStatus === SubscriptionStatus.EXPIRED || subscriptionStatus === SubscriptionStatus.SUSPENDED) {
    await createAuditLog({
      action: AuditAction.DISABLE,
      entity: "Subscription",
      userId: user.id,
      agencyId: user.agencyId,
      metadata: { event: "auth.denied.subscription_status", subscriptionStatus },
      ...meta
    });
    throw new AppError("Subscription is not active", 403, "SUBSCRIPTION_BLOCKED");
  }
}

async function issueSessionToken(
  user: { id: string; role: UserRole; agencyId: string | null },
  meta: RequestMeta,
  tokenFamily = generateTokenFamily()
) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    agencyId: user.agencyId
  });
  const refreshToken = generateRefreshToken();
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      tokenFamily,
      expiresAt: refreshTokenExpiryDate(),
      lastUsedAt: new Date(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    }
  });

  return { accessToken, refreshToken, sessionId: session.id, tokenFamily };
}

export async function login(input: LoginInput, meta: RequestMeta) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { agency: { select: { id: true, name: true, status: true } } }
  });

  if (!user) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  await assertAccountCanAuthenticate(user, meta);
  const tokenPair = await issueSessionToken(user, meta);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await createAuditLog({
    action: AuditAction.LOGIN,
    entity: "User",
    entityId: user.id,
    userId: user.id,
    agencyId: user.agencyId,
    metadata: { event: "auth.login" },
    ...meta
  });

  return {
    ...tokenPair,
    user: publicUser(user),
    subscriptionStatus: await getCurrentSubscriptionStatus(user.agencyId)
  };
}

export async function refresh(refreshToken: string, meta: RequestMeta) {
  const tokenHash = hashRefreshToken(refreshToken);
  const storedSession = await prisma.userSession.findUnique({
    where: { refreshTokenHash: tokenHash },
    include: {
      user: {
        include: { agency: { select: { id: true, name: true, status: true } } }
      }
    }
  });

  if (!storedSession) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  const now = new Date();
  if (storedSession.revokedAt) {
    await prisma.userSession.updateMany({
      where: { tokenFamily: storedSession.tokenFamily, revokedAt: null },
      data: { revokedAt: now }
    });
    await createAuditLog({
      action: AuditAction.DISABLE,
      entity: "UserSession",
      entityId: storedSession.id,
      userId: storedSession.userId,
      agencyId: storedSession.user.agencyId,
      metadata: { event: "auth.refresh.reuse_detected", tokenFamily: storedSession.tokenFamily },
      ...meta
    });
    throw new AppError("Refresh token has been revoked", 401, "REFRESH_TOKEN_REUSED");
  }

  if (storedSession.expiresAt <= now) {
    await prisma.userSession.update({ where: { id: storedSession.id }, data: { revokedAt: now, lastUsedAt: now } });
    throw new AppError("Refresh token has expired", 401, "REFRESH_TOKEN_EXPIRED");
  }

  await assertAccountCanAuthenticate(storedSession.user, meta);
  const tokenPair = await issueSessionToken(storedSession.user, meta, storedSession.tokenFamily);

  await prisma.userSession.update({
    where: { id: storedSession.id },
    data: { revokedAt: now, lastUsedAt: now }
  });

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "UserSession",
    entityId: storedSession.id,
    userId: storedSession.userId,
    agencyId: storedSession.user.agencyId,
    metadata: { event: "auth.refresh.rotated", newSessionId: tokenPair.sessionId, tokenFamily: storedSession.tokenFamily },
    ...meta
  });

  return {
    ...tokenPair,
    user: publicUser(storedSession.user),
    subscriptionStatus: await getCurrentSubscriptionStatus(storedSession.user.agencyId)
  };
}

export async function logout(refreshToken: string | undefined, userId: string | undefined, meta: RequestMeta) {
  if (refreshToken) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenHash: hashRefreshToken(refreshToken) },
      include: { user: true }
    });

    if (session) {
      if (!session.revokedAt) {
        await prisma.userSession.update({
          where: { id: session.id },
          data: { revokedAt: new Date(), lastUsedAt: new Date() }
        });
      }

      await createAuditLog({
        action: AuditAction.LOGOUT,
        entity: "UserSession",
        entityId: session.id,
        userId: session.userId,
        agencyId: session.user.agencyId,
        metadata: { event: "auth.logout.session_revoked", tokenFamily: session.tokenFamily },
        ...meta
      });
      return;
    }
  }

  if (userId) {
    await createAuditLog({
      action: AuditAction.LOGOUT,
      entity: "User",
      entityId: userId,
      userId,
      metadata: { event: "auth.logout" },
      ...meta
    });
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agency: { select: { id: true, name: true, status: true } } }
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return {
    user: publicUser(user),
    subscriptionStatus: await getCurrentSubscriptionStatus(user.agencyId)
  };
}

export async function changePassword(userId: string, input: ChangePasswordInput, meta: RequestMeta) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(input.newPassword, 12) }
  });

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "User",
    entityId: userId,
    userId,
    agencyId: user.agencyId,
    metadata: { event: "auth.change_password" },
    ...meta
  });
}

export async function registerAgency(input: RegisterAgencyInput, meta: RequestMeta) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.admin.email } });
  if (existingUser) {
    throw new AppError("Admin email is already used", 409, "EMAIL_ALREADY_USED");
  }

  const trialPlan = await prisma.subscriptionPlan.findUnique({ where: { name: "Free Trial" } });
  if (!trialPlan) {
    throw new AppError("Free Trial plan is missing", 500, "TRIAL_PLAN_MISSING");
  }

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + trialPlan.trialDays);

  const result = await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: {
        name: input.agency.name,
        email: input.agency.email,
        phone: input.agency.phone,
        address: input.agency.address,
        city: input.agency.city,
        status: AgencyStatus.ACTIVE,
        settings: { create: {} }
      }
    });

    const user = await tx.user.create({
      data: {
        agencyId: agency.id,
        firstName: input.admin.firstName,
        lastName: input.admin.lastName,
        email: input.admin.email,
        phone: input.admin.phone,
        passwordHash: await bcrypt.hash(input.admin.password, 12),
        role: UserRole.AGENCY_ADMIN,
        status: UserStatus.ACTIVE
      }
    });

    const subscription = await tx.subscription.create({
      data: {
        agencyId: agency.id,
        planId: trialPlan.id,
        status: SubscriptionStatus.TRIALING,
        startsAt: now,
        endsAt: trialEndsAt,
        trialEndsAt,
        amount: trialPlan.priceMonthly,
        currency: trialPlan.currency
      }
    });

    await tx.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        entity: "Agency",
        entityId: agency.id,
        userId: user.id,
        agencyId: agency.id,
        metadata: { event: "auth.register_agency", subscriptionId: subscription.id },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      }
    });

    return { agency, user, subscription };
  });

  const tokenPair = await issueSessionToken(result.user, meta);

  return {
    ...tokenPair,
    user: publicUser({ ...result.user, agency: { id: result.agency.id, name: result.agency.name, status: result.agency.status } }),
    subscriptionStatus: result.subscription.status
  };
}
