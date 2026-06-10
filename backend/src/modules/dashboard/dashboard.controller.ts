import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import * as service from "./dashboard.service.js";

export const getSuperAdminDashboard: RequestHandler = asyncHandler(async (_req, res: Response) => {
  res.json({ data: await service.getSuperAdminDashboard() });
});
