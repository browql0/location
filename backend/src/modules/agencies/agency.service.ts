import { AgencyStatus, AuditAction } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, isAgencyAdmin, isStaff, isSuperAdmin } from "../../shared/utils/authz.js";
import { createAuditLog } from "../audit/audit.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
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
  if (isSuperAdmin(auth)) return;
  if (isAgencyAdmin(auth) && auth.agencyId && (!agencyId || auth.agencyId === agencyId)) return;
  if (!agencyId && auth.permissions.includes("agencies:read")) return;
  throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
}

export async function listAgencies(query: AgencyQueryInput, auth: AuthContext) {
  assertAgencyAccess(auth);
  const where = {
    deletedAt: null,
    ...(isSuperAdmin(auth) ? {} : { id: auth.agencyId ?? "" }),
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
  assertPermissionOrOwner(auth, "agencies:update");
  assertAgencyAccess(auth, id);
  const normalized = { ...input, website: input.website === "" ? null : input.website };
  const agency = await prisma.agency.update({ where: { id }, data: normalized }).catch(() => null);
  if (!agency) throw new AppError("Agency not found", 404, "AGENCY_NOT_FOUND");
  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "Agency",
    entityId: agency.id,
    userId: auth.userId,
    agencyId: agency.id,
    metadata: { event: "agency_company_updated" },
    ...meta
  });
  return getAgency(id, auth);
}

export async function updateCompany(id: string, input: UpdateAgencyInput, auth: AuthContext, meta: RequestMeta) {
  if (isStaff(auth)) throw new AppError("Company settings are read-only for staff", 403, "COMPANY_READ_ONLY");
  return updateAgency(id, input, auth, meta);
}

export async function uploadLogo(id: string, file: Express.Multer.File | undefined, auth: AuthContext, meta: RequestMeta) {
  if (isStaff(auth)) throw new AppError("Company settings are read-only for staff", 403, "COMPANY_READ_ONLY");
  assertPermissionOrOwner(auth, "agencies:update");
  assertAgencyAccess(auth, id);
  if (!file) throw new AppError("Logo file is required", 400, "AGENCY_LOGO_REQUIRED");
  const agency = await prisma.agency.findFirst({ where: { id, deletedAt: null } });
  if (!agency) throw new AppError("Agency not found", 404, "AGENCY_NOT_FOUND");
  const saved = await FileStorageService.saveFile(file, { agencyId: id, agencyLogo: true });
  const updated = await prisma.agency.update({ where: { id }, data: { logoStorageKey: saved.storageKey, logoUrl: null } });
  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "Agency",
    entityId: id,
    userId: auth.userId,
    agencyId: id,
    metadata: { event: "agency_logo_updated", storageKey: saved.storageKey },
    ...meta
  });
  return updated;
}

export async function setAgencyStatus(id: string, status: AgencyStatus, auth: AuthContext, meta: RequestMeta) {
  if (!isSuperAdmin(auth)) {
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

export async function deleteAgency(id: string, auth: AuthContext, meta: RequestMeta) {
  if (!isSuperAdmin(auth)) {
    throw new AppError("Super admin role is required", 403, "SUPER_ADMIN_REQUIRED");
  }
  const agency = await prisma.agency.update({ where: { id }, data: { deletedAt: new Date(), status: AgencyStatus.INACTIVE } }).catch(() => null);
  if (!agency) throw new AppError("Agency not found", 404, "AGENCY_NOT_FOUND");
  await createAuditLog({
    action: AuditAction.DELETE,
    entity: "Agency",
    entityId: id,
    userId: auth.userId,
    agencyId: id,
    metadata: { event: "agency_deleted" },
    ...meta
  });
  return agency;
}
