import { UserRole } from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import type { AuthContext } from "../types/auth.js";

type AgencyScopedWhere = {
  agencyId?: string;
  [key: string]: unknown;
};

export function applyAgencyScope<TWhere extends AgencyScopedWhere>(auth: AuthContext, where: TWhere = {} as TWhere): TWhere {
  if (auth.role === UserRole.SUPER_ADMIN) {
    return where;
  }

  if (!auth.agencyId) {
    throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  }

  if (where.agencyId && where.agencyId !== auth.agencyId) {
    throw new AppError("Access to another agency is forbidden", 403, "FORBIDDEN");
  }

  return {
    ...where,
    agencyId: auth.agencyId
  };
}

export function requireAgencyId(auth: AuthContext): string {
  if (!auth.agencyId) {
    throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  }

  return auth.agencyId;
}
