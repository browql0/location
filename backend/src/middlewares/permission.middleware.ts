import type { RequestHandler } from "express";
import { AppError } from "../shared/errors/app-error.js";
import type { Permission } from "../shared/utils/permissions.js";

export function requirePermission(...permissions: Permission[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
    }

    const hasPermission = permissions.every((permission) => req.auth!.permissions.includes(permission));
    if (!hasPermission) {
      return next(new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS"));
    }

    next();
  };
}
