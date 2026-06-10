import { AgencyStatus, AuditAction, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { createAuditLog } from "../audit/audit.service.js";
import type { AgencyQueryInput, UpdateAgencyInput } from "./agency.schemas.js";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

function currentSubscriptionInclude() {
  return {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { plan: true }
  };
}

function assertAgencyAccess(auth: AuthContext, agencyId?: string) {
  if (auth.role === UserRole.SUPER_ADMIN) return;
  if (auth.role === UserRole.AGENCY_ADMIN && auth.agencyId && (!agencyId || auth.agencyId === agencyId)) return;
  if (!agencyId && auth.permissions.includes("agencies:read")) return;
  throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
}

export async function listAgencies(query: AgencyQueryInput, auth: AuthContext) {
  assertAgencyAccess(auth);
  const where = {
    deletedAt: null,
    ...(auth.role === UserRole.SUPER_ADMIN ? {} : { id: auth.agencyId ?? "" }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
            { city: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  return prisma.agency.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: currentSubscriptionInclude(),
      _count: { select: { users: true, cars: true, clients: true } }
    }
  });
}

export async function getAgency(id: string, auth: AuthContext) {
  assertAgencyAccess(auth, id);
  const agency = await prisma.agency.findFirst({
    where: { id, deletedAt: null },
    include: {
      subscriptions: currentSubscriptionInclude(),
      users: { select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true } },
      _count: { select: { users: true, cars: true, clients: true, reservations: true } }
    }
  });
  if (!agency) throw new AppError("Agency not found", 404, "AGENCY_NOT_FOUND");
  return agency;
}

export async function updateAgency(id: string, input: UpdateAgencyInput, auth: AuthContext, meta: RequestMeta) {
  if (auth.role !== UserRole.SUPER_ADMIN && !auth.permissions.includes("agencies:update")) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }
  assertAgencyAccess(auth, id);
  const agency = await prisma.agency.update({ where: { id }, data: input }).catch(() => null);
  if (!agency) throw new AppError("Agency not found", 404, "AGENCY_NOT_FOUND");
  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "Agency",
    entityId: agency.id,
    userId: auth.userId,
    agencyId: agency.id,
    metadata: { event: "agency.update" },
    ...meta
  });
  return getAgency(id, auth);
}

export async function setAgencyStatus(id: string, status: AgencyStatus, auth: AuthContext, meta: RequestMeta) {
  if (auth.role !== UserRole.SUPER_ADMIN) {
    throw new AppError("Super admin role is required", 403, "SUPER_ADMIN_REQUIRED");
  }
  const agency = await prisma.agency.update({ where: { id }, data: { status } }).catch(() => null);
  if (!agency) throw new AppError("Agency not found", 404, "AGENCY_NOT_FOUND");
  await createAuditLog({
    action: status === AgencyStatus.ACTIVE ? AuditAction.ENABLE : AuditAction.DISABLE,
    entity: "Agency",
    entityId: agency.id,
    userId: auth.userId,
    agencyId: agency.id,
    metadata: { event: status === AgencyStatus.ACTIVE ? "agency.enable" : "agency.disable", status },
    ...meta
  });
  return getAgency(id, auth);
}
