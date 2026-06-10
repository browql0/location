import bcrypt from "bcrypt";
import { AgencyStatus, AuditAction, SubscriptionStatus, UserRole, UserStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { prisma } from "../../prisma/prisma.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import { mergeUserPermissions } from "../../shared/utils/permissions.js";
import type { ChangePasswordInput, LoginInput, RegisterAgencyInput } from "./auth.schemas.js";
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiryDate, signAccessToken } from "./token.service.js";

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

async function issueTokenPair(user: { id: string; role: UserRole; agencyId: string | null }) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    agencyId: user.agencyId
  });
  const refreshToken = generateRefreshToken();
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiryDate()
    }
  });

  return { accessToken, refreshToken, refreshTokenId: refreshTokenRecord.id };
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
  const tokenPair = await issueTokenPair(user);

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
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        include: { agency: { select: { id: true, name: true, status: true } } }
      }
    }
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  await assertAccountCanAuthenticate(storedToken.user, meta);
  const tokenPair = await issueTokenPair(storedToken.user);

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() }
  });

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "RefreshToken",
    entityId: storedToken.id,
    userId: storedToken.userId,
    agencyId: storedToken.user.agencyId,
    metadata: { event: "auth.refresh.rotated", newRefreshTokenId: tokenPair.refreshTokenId },
    ...meta
  });

  return {
    ...tokenPair,
    user: publicUser(storedToken.user),
    subscriptionStatus: await getCurrentSubscriptionStatus(storedToken.user.agencyId)
  };
}

export async function logout(refreshToken: string | undefined, userId: string | undefined, meta: RequestMeta) {
  if (refreshToken) {
    const token = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null
      },
      include: { user: true }
    });

    if (token) {
      await prisma.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() }
      });

      await createAuditLog({
        action: AuditAction.LOGOUT,
        entity: "RefreshToken",
        entityId: token.id,
        userId: token.userId,
        agencyId: token.user.agencyId,
        metadata: { event: "auth.logout.token_revoked" },
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

  const tokenPair = await issueTokenPair(result.user);

  return {
    ...tokenPair,
    user: publicUser({ ...result.user, agency: { id: result.agency.id, name: result.agency.name, status: result.agency.status } }),
    subscriptionStatus: result.subscription.status
  };
}
