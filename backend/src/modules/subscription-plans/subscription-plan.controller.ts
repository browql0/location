import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import * as service from "./subscription-plan.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listPlans: RequestHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await service.listPlans() });
});

export const createPlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createPlan(req.body, req.auth!, requestMeta(req)) });
});

export const updatePlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updatePlan(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const disablePlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setPlanActive(String(req.params.id), false, req.auth!, requestMeta(req)) });
});

export const enablePlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setPlanActive(String(req.params.id), true, req.auth!, requestMeta(req)) });
});
