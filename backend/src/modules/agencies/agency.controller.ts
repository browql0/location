import type { Request, RequestHandler, Response } from "express";
import { AgencyStatus } from "@prisma/client";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { agencyQuerySchema } from "./agency.schemas.js";
import * as service from "./agency.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listAgencies: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = agencyQuerySchema.parse(req.query);
  res.json({ data: await service.listAgencies(query, req.auth!) });
});

export const getAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getAgency(String(req.params.id), req.auth!) });
});

export const updateAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updateAgency(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const updateCompany: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updateCompany(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const uploadLogo: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.uploadLogo(String(req.params.id), req.file, req.auth!, requestMeta(req)) });
});

export const enableAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setAgencyStatus(String(req.params.id), AgencyStatus.ACTIVE, req.auth!, requestMeta(req)) });
});

export const disableAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setAgencyStatus(String(req.params.id), AgencyStatus.SUSPENDED, req.auth!, requestMeta(req)) });
});

export const deleteAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.deleteAgency(String(req.params.id), req.auth!, requestMeta(req)) });
});
