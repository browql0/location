import type { RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import * as service from "./dashboard.service.js";

export const getSuperAdminDashboard: RequestHandler = asyncHandler(async (req, res: Response) => {
  res.json({ data: await service.getSuperAdminDashboard(String(req.query.range ?? "30d")) });
});

export const getAgencyDashboard: RequestHandler = asyncHandler(async (req, res: Response) => {
  res.json({ data: await service.getAgencyDashboard(req.auth!) });
});

export const getStaffDashboard: RequestHandler = asyncHandler(async (req, res: Response) => {
  res.json({ data: await service.getStaffDashboard(req.auth!) });
});

export const searchSuperAdminDashboard: RequestHandler = asyncHandler(async (req, res: Response) => {
  res.json({ data: await service.searchSuperAdminDashboard(String(req.query.q ?? "")) });
});
