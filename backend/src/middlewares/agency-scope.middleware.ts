import type { RequestHandler } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../shared/errors/app-error.js";

export const agencyScopeMiddleware: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
  }

  if (req.auth.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  if (!req.auth.agencyId) {
    return next(new AppError("Agency context is required", 403, "AGENCY_REQUIRED"));
  }

  if (typeof req.query.agencyId === "string" && req.query.agencyId !== req.auth.agencyId) {
    return next(new AppError("Access to another agency is forbidden", 403, "FORBIDDEN"));
  }

  if (req.body && typeof req.body === "object" && "agencyId" in req.body && req.body.agencyId && req.body.agencyId !== req.auth.agencyId) {
    return next(new AppError("Access to another agency is forbidden", 403, "FORBIDDEN"));
  }

  req.query.agencyId = req.auth.agencyId;
  if (req.body && typeof req.body === "object") {
    req.body.agencyId = req.auth.agencyId;
  }

  next();
};
