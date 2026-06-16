import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { attachmentDisposition } from "../../shared/utils/http.js";
import { paymentQuerySchema } from "./payment.schemas.js";
import * as service from "./payment.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listPayments: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listPayments(paymentQuerySchema.parse(req.query), req.auth!) });
});

export const createPayment: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createPayment(String(req.params.reservationId), req.body, req.auth!, requestMeta(req)) });
});

export const getPayment: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getPayment(String(req.params.id), req.auth!) });
});

export const updatePayment: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updatePayment(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const confirmManual: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.confirmManual(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const cancelPayment: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.cancelPayment(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const refundPayment: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.refundPayment(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const uploadProof: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.uploadProof(String(req.params.id), req.file, req.auth!, requestMeta(req)) });
});

export const downloadProof: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const file = await service.downloadProof(String(req.params.id), req.auth!, requestMeta(req));
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", attachmentDisposition(file.fileName, "payment-proof"));
  file.stream.pipe(res);
});

export const createPaypalOrder: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createPaypalOrder(String(req.params.paymentId), req.auth!, requestMeta(req)) });
});

export const capturePaypal: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.capturePaypal(String(req.params.paymentId), req.auth!, requestMeta(req)) });
});
