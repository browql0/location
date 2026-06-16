import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { anomalyQuerySchema } from "./vehicle-anomaly.schemas.js";
import * as service from "./vehicle-anomaly.service.js";

export const listAnomalies: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listAnomalies(anomalyQuerySchema.parse(req.query), req.auth!) });
});

export const getAnomaly: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getAnomaly(String(req.params.id), req.auth!) });
});

export const resolveAnomaly: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.resolveAnomaly(String(req.params.id), req.auth!) });
});
