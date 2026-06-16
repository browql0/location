import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { contractQuerySchema } from "./contract.schemas.js";
import * as service from "./contract.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const generateContract: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.generateContract(String(req.params.reservationId), req.auth!, requestMeta(req)) });
});

export const listContracts: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listContracts(contractQuerySchema.parse(req.query), req.auth!) });
});

export const getContract: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getContract(String(req.params.id), req.auth!) });
});

export const downloadContract: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const file = await service.downloadContract(String(req.params.id), req.auth!, requestMeta(req));
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
  file.stream.pipe(res);
});

export const signClient: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.signClient(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const signAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.signAgency(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const archiveContract: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.archiveContract(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const cancelContract: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.cancelContract(String(req.params.id), req.auth!, requestMeta(req)) });
});
