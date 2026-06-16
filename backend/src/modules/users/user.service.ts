import bcrypt from "bcrypt";
import { AgencyStatus, AuditAction, SubscriptionStatus, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, canAccessAgency, isSuperAdmin, requireAgencyScope } from "../../shared/utils/authz.js";
import { paginationArgs } from "../../shared/utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";
import type { CreateUserInput, UpdatePermissionsInput, UpdateUserInput, UserQueryInput } from "./user.schemas.js";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

const publicUserSelect = {
  id: true,
  agencyId: true,
  agency: { select: { id: true, name: true, status: true } },
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  permissions: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
};

async function assertAgencyOperational(agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } }
  });
  if (!agency || agency.deletedAt) throw new AppError("Agency not found", 404, "AGENCY_NOT_FOUND");
  if (agency.status !== AgencyStatus.ACTIVE) throw new AppError("Agency is not active", 403, "AGENCY_BLOCKED");
  const status = agency.subscriptions[0]?.status;
  if (status === SubscriptionStatus.EXPIRED || status === SubscriptionStatus.SUSPENDED) {
    throw new AppError("Subscription is not active", 403, "SUBSCRIPTION_BLOCKED");
  }
}

function scopedAgencyId(auth: AuthContext, requestedAgencyId?: string | null) {
  return requireAgencyScope(auth, requestedAgencyId);
}

function resolveCreateAgencyId(auth: AuthContext, input: CreateUserInput) {
  if (input.role === UserRole.SUPER_ADMIN) {
    return null;
  }

  if (auth.role === UserRole.SUPER_ADMIN) {
    if (!input.agencyId) {
      throw new AppError("Agency is required for this user", 400, "USER_AGENCY_REQUIRED");
    }
    return input.agencyId;
  }

  if (!auth.agencyId) {
    throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  }

  return auth.agencyId;
}

async function getTargetUser(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: publicUserSelect });
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return user;
}

function assertCanAccessTarget(auth: AuthContext, target: { id: string; agencyId: string | null; role: UserRole }) {
  if (isSuperAdmin(auth)) return;
  if (!canAccessAgency(auth, target.agencyId)) {
    throw new AppError("User is outside agency scope", 403, "USER_SCOPE_FORBIDDEN");
  }
  if (target.role !== UserRole.STAFF) {
    throw new AppError("Agency admins can only manage staff users", 403, "STAFF_ONLY");
  }
}

function assertCanCreateRole(auth: AuthContext, input: CreateUserInput) {
  if (isSuperAdmin(auth)) return;
  if (input.role !== UserRole.STAFF) {
    throw new AppError("Agency admins can only create staff users", 403, "STAFF_ONLY");
  }
}

export async function listUsers(query: UserQueryInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "users:read");
  const agencyId = scopedAgencyId(auth, query.agencyId);
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(agencyId ? { agencyId } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    select: publicUserSelect,
    orderBy: { createdAt: "desc" },
    ...paginationArgs(query)
  });
}

export async function createUser(input: CreateUserInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "users:create");
  assertCanCreateRole(auth, input);

  const agencyId = resolveCreateAgencyId(auth, input);
  if (agencyId) await assertAgencyOperational(agencyId);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError("Email is already used", 409, "EMAIL_ALREADY_USED");

  const user = await prisma.user.create({
    data: {
      agencyId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      status: UserStatus.ACTIVE,
      permissions: input.role === UserRole.STAFF ? input.permissions : []
    },
    select: publicUserSelect
  });

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "User",
    entityId: user.id,
    userId: auth.userId,
    agencyId: user.agencyId,
    metadata: { event: "staff.created", targetUserId: user.id, targetUserEmail: user.email, role: user.role },
    ...meta
  });
  return user;
}

export async function getUser(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "users:read");
  const user = await getTargetUser(id);
  assertCanAccessTarget(auth, user);
  return user;
}

export async function updateUser(id: string, input: UpdateUserInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "users:update");
  const target = await getTargetUser(id);
  assertCanAccessTarget(auth, target);

  const data: UpdateUserInput = { ...input };
  if (auth.role !== UserRole.SUPER_ADMIN && id === auth.userId && "status" in data) {
    throw new AppError("Cannot change your own status", 403, "SELF_STATUS_FORBIDDEN");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      status: data.status,
      ...(data.permissions && target.role === UserRole.STAFF ? { permissions: data.permissions } : {})
    },
    select: publicUserSelect
  });

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "User",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: {
      event: "staff.updated",
      targetUserId: id,
      targetUserEmail: updated.email,
      oldStatus: target.status,
      newStatus: updated.status
    },
    ...meta
  });
  return updated;
}

export async function setUserStatus(id: string, status: typeof UserStatus.ACTIVE | typeof UserStatus.SUSPENDED, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, status === UserStatus.ACTIVE ? "users:enable" : "users:disable");
  const target = await getTargetUser(id);
  assertCanAccessTarget(auth, target);
  if (id === auth.userId) throw new AppError("Cannot change your own status", 403, "SELF_STATUS_FORBIDDEN");

  const updated = await prisma.user.update({ where: { id }, data: { status }, select: publicUserSelect });
  await createAuditLog({
    action: status === UserStatus.ACTIVE ? AuditAction.ENABLE : AuditAction.DISABLE,
    entity: "User",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: {
      event: status === UserStatus.ACTIVE ? "staff.enabled" : "staff.disabled",
      targetUserId: id,
      targetUserEmail: updated.email,
      oldStatus: target.status,
      newStatus: updated.status
    },
    ...meta
  });
  return updated;
}

export async function updatePermissions(id: string, input: UpdatePermissionsInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "users:permissions");
  const target = await getTargetUser(id);
  assertCanAccessTarget(auth, target);
  if (target.role !== UserRole.STAFF) throw new AppError("Only staff permissions can be edited", 403, "STAFF_ONLY");
  if (id === auth.userId) throw new AppError("Cannot change your own permissions", 403, "SELF_PERMISSIONS_FORBIDDEN");

  const updated = await prisma.user.update({ where: { id }, data: { permissions: input.permissions }, select: publicUserSelect });
  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "User",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: {
      event: "staff.permissions_updated",
      targetUserId: id,
      targetUserEmail: updated.email,
      oldPermissions: target.permissions,
      newPermissions: updated.permissions
    },
    ...meta
  });
  return updated;
}

export async function softDeleteUser(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "users:delete");
  const target = await getTargetUser(id);
  assertCanAccessTarget(auth, target);
  if (id === auth.userId) throw new AppError("Cannot delete your own account", 403, "SELF_DELETE_FORBIDDEN");

  const updated = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
    select: publicUserSelect
  });
  await createAuditLog({
    action: AuditAction.DELETE,
    entity: "User",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: { event: "staff.soft_deleted", targetUserId: id, targetUserEmail: updated.email, oldStatus: target.status, newStatus: updated.status },
    ...meta
  });
  return updated;
}
