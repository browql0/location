import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { attachmentDisposition } from "../../shared/utils/http.js";
import { completeMaintenanceSchema, createMaintenanceSchema, maintenanceQuerySchema, updateMaintenanceSchema } from "./maintenance.schemas.js";
import * as service from "./maintenance.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listMaintenance(maintenanceQuerySchema.parse(req.query), req.auth!) });
});

export const createMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createMaintenance(createMaintenanceSchema.parse(req.body), req.auth!, requestMeta(req)) });
});

export const getMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getMaintenance(String(req.params.id), req.auth!) });
});

export const updateMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updateMaintenance(String(req.params.id), updateMaintenanceSchema.parse(req.body), req.auth!, requestMeta(req)) });
});

export const startMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.startMaintenance(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const completeMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.completeMaintenance(String(req.params.id), completeMaintenanceSchema.parse(req.body), req.auth!, requestMeta(req)) });
});

export const cancelMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.cancelMaintenance(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const deleteMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.deleteMaintenance(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const calendar: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.calendar(maintenanceQuerySchema.parse(req.query), req.auth!) });
});

export const addDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.addDocument(String(req.params.id), req.file, req.auth!, requestMeta(req)) });
});

export const downloadDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { document, stream } = await service.downloadDocument(String(req.params.id), req.auth!);
  res.setHeader("Content-Type", document.mimeType);
  res.setHeader("Content-Disposition", attachmentDisposition(document.fileName, "maintenance-document"));
  stream.pipe(res);
});

export const deleteDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.deleteDocument(String(req.params.id), req.auth!) });
});
