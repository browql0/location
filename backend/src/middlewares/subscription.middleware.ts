import type { RequestHandler } from "express";
import { SubscriptionStatus, UserRole } from "@prisma/client";
import { AppError } from "../shared/errors/app-error.js";

export const requireActiveSubscription: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
  }

  if (req.auth.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  if (req.auth.subscriptionStatus === SubscriptionStatus.EXPIRED || req.auth.subscriptionStatus === SubscriptionStatus.SUSPENDED) {
    return next(new AppError("Subscription is not active", 403, "SUBSCRIPTION_BLOCKED"));
  }

  next();
};
