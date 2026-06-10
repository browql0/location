import type { Request, RequestHandler, Response } from "express";
import { SubscriptionStatus } from "@prisma/client";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { subscriptionQuerySchema } from "./subscription.schemas.js";
import { SubscriptionExpirationService } from "./subscription-expiration.service.js";
import * as service from "./subscription.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listSubscriptions: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listSubscriptions(subscriptionQuerySchema.parse(req.query), req.auth!) });
});

export const getSubscription: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getSubscription(String(req.params.id), req.auth!) });
});

export const getCurrentSubscription: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getCurrentAgencySubscription(req.auth!) });
});

export const changePlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.changePlan(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const suspendSubscription: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setSubscriptionStatus(String(req.params.id), SubscriptionStatus.SUSPENDED, req.auth!, requestMeta(req)) });
});

export const reactivateSubscription: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setSubscriptionStatus(String(req.params.id), SubscriptionStatus.ACTIVE, req.auth!, requestMeta(req)) });
});

export const getHistory: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getSubscriptionHistory(String(req.params.id), req.auth!) });
});

export const checkExpiredSubscriptions: RequestHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await SubscriptionExpirationService.checkExpiredSubscriptions() });
});
