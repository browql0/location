import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { AppError } from "../shared/errors/app-error.js";

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.auth.role)) {
      return next(new AppError("Insufficient role", 403, "INSUFFICIENT_ROLE"));
    }

    next();
  };
}
