import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { attachmentDisposition } from "../../shared/utils/http.js";
import { invoiceQuerySchema } from "./invoice.schemas.js";
import * as service from "./invoice.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listInvoices: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listInvoices(invoiceQuerySchema.parse(req.query), req.auth!) });
});

export const getInvoice: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getInvoice(String(req.params.id), req.auth!) });
});

export const generateRentalInvoice: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.generateRentalInvoice(String(req.params.reservationId), req.auth!, requestMeta(req)) });
});

export const generateSaasInvoice: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.generateSaasInvoice(String(req.params.subscriptionId), req.auth!, requestMeta(req)) });
});

export const downloadInvoice: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const file = await service.downloadInvoice(String(req.params.id), req.auth!, requestMeta(req));
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", attachmentDisposition(file.fileName, "invoice.pdf"));
  file.stream.pipe(res);
});

export const markPaid: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.markPaid(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const cancelInvoice: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.cancelInvoice(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const sendClient: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.sendClient(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const sendAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.sendAgency(String(req.params.id), req.auth!, requestMeta(req)) });
});
