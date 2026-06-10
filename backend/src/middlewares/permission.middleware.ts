import type { RequestHandler } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../shared/errors/app-error.js";
import type { Permission } from "../shared/utils/permissions.js";
import { getRolePermissions } from "../shared/utils/permissions.js";

export function requirePermission(...permissions: Permission[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
    }

    if (req.auth.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (req.auth.role === UserRole.AGENCY_ADMIN) {
      const agencyAdminCanBypass = Boolean(req.auth.agencyId) && permissions.every((permission) => getRolePermissions(UserRole.AGENCY_ADMIN).includes(permission));
      if (agencyAdminCanBypass) {
        return next();
      }
    }

    const hasPermission = permissions.every((permission) => req.auth!.permissions.includes(permission));
    if (!hasPermission) {
      return next(new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS"));
    }

    next();
  };
}
