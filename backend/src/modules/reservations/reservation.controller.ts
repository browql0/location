import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import {
  cancelReservationSchema,
  checkAvailabilitySchema,
  completeReservationSchema,
  reservationQuerySchema,
  startReservationSchema
} from "./reservation.schemas.js";
import * as service from "./reservation.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listReservations: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listReservations(reservationQuerySchema.parse(req.query), req.auth!) });
});

export const createReservation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createReservation(req.body, req.auth!, requestMeta(req)) });
});

export const getReservation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getReservation(String(req.params.id), req.auth!) });
});

export const updateReservation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updateReservation(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const deleteReservation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.deleteReservation(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const checkAvailability: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.checkAvailability(checkAvailabilitySchema.parse(req.body), req.auth!) });
});

export const cancelReservation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.cancelReservation(String(req.params.id), cancelReservationSchema.parse(req.body), req.auth!, requestMeta(req)) });
});

export const startReservation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.startReservation(String(req.params.id), startReservationSchema.parse(req.body), req.auth!, requestMeta(req)) });
});

export const completeReservation: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.completeReservation(String(req.params.id), completeReservationSchema.parse(req.body), req.auth!, requestMeta(req)) });
});

export const calendar: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.calendar(reservationQuerySchema.parse(req.query), req.auth!) });
});
