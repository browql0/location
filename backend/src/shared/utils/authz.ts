import { UserRole } from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import type { AuthContext } from "../types/auth.js";
import type { Permission } from "./permissions.js";

export function isSuperAdmin(auth: AuthContext) {
  return auth.role === UserRole.SUPER_ADMIN;
}

export function isAgencyAdmin(auth: AuthContext) {
  return auth.role === UserRole.AGENCY_ADMIN;
}

export function isStaff(auth: AuthContext) {
  return auth.role === UserRole.STAFF;
}

export function requireAgencyScope(auth: AuthContext, requestedAgencyId?: string | null) {
  if (isSuperAdmin(auth)) return requestedAgencyId ?? null;
  if (!auth.agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  return auth.agencyId;
}

export function requireAgencyForCreate(auth: AuthContext, requestedAgencyId: string | null | undefined, code = "AGENCY_REQUIRED") {
  if (isSuperAdmin(auth)) {
    if (!requestedAgencyId) throw new AppError("Agency is required", 400, code);
    return requestedAgencyId;
  }

  if (!auth.agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  return auth.agencyId;
}

export function canAccessAgency(auth: AuthContext, agencyId: string | null | undefined) {
  if (isSuperAdmin(auth)) return true;
  return Boolean(auth.agencyId && agencyId && auth.agencyId === agencyId);
}

export function assertSameAgency(entityAgencyId: string | null | undefined, auth: AuthContext, code = "FORBIDDEN") {
  if (canAccessAgency(auth, entityAgencyId)) return;
  throw new AppError("Access to another agency is forbidden", 403, code);
}

export function assertPermissionOrOwner(auth: AuthContext, permission: Permission) {
  if (isSuperAdmin(auth) || isAgencyAdmin(auth)) return;
  if (!auth.permissions.includes(permission)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }
}
