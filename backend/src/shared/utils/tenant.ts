import { UserRole } from "@prisma/client";
import type { AuthContext } from "../types/auth.js";

type AgencyScopedWhere = {
  agencyId?: string;
  [key: string]: unknown;
};

export function applyAgencyScope<TWhere extends AgencyScopedWhere>(auth: AuthContext, where: TWhere = {} as TWhere): TWhere {
  if (auth.role === UserRole.SUPER_ADMIN) {
    return where;
  }

  return {
    ...where,
    agencyId: auth.agencyId
  };
}

export function requireAgencyId(auth: AuthContext): string {
  if (!auth.agencyId) {
    throw new Error("Agency context is required");
  }

  return auth.agencyId;
}
