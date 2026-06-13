import type { Request, RequestHandler, Response } from "express";
import { CarStatus } from "@prisma/client";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { carQuerySchema } from "./car.schemas.js";
import * as service from "./car.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listCars: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listCars(carQuerySchema.parse(req.query), req.auth!) });
});

export const createCar: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createCar(req.body, req.auth!, requestMeta(req)) });
});

export const getCar: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getCar(String(req.params.id), req.auth!) });
});

export const updateCar: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updateCar(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const deleteCar: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.softDeleteCar(String(req.params.id), req.auth!, requestMeta(req)) });
});

export const setAvailable: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setCarStatus(String(req.params.id), CarStatus.AVAILABLE, req.auth!, requestMeta(req)) });
});

export const setMaintenance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setCarStatus(String(req.params.id), CarStatus.MAINTENANCE, req.auth!, requestMeta(req)) });
});

export const setInactive: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setCarStatus(String(req.params.id), CarStatus.INACTIVE, req.auth!, requestMeta(req)) });
});

export const listPhotos: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listPhotos(String(req.params.id), req.auth!) });
});

export const addPhoto: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.addPhoto(String(req.params.id), req.file, req.auth!, requestMeta(req)) });
});

export const deletePhoto: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.deletePhoto(String(req.params.photoId), req.auth!) });
});

export const setPrimaryPhoto: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setPrimaryPhoto(String(req.params.photoId), req.auth!) });
});

export const downloadPhoto: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { photo, stream } = await service.getPhotoDownload(String(req.params.photoId), req.auth!);
  if (!stream) {
    res.redirect(photo.url);
    return;
  }
  res.setHeader("Content-Type", photo.mimeType ?? "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(photo.fileName ?? "car-photo")}"`);
  stream.pipe(res);
});

export const listDocuments: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listDocuments(String(req.params.id), req.auth!) });
});

export const addDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.addDocument(String(req.params.id), req.body, req.auth!) });
});

export const deleteDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.deleteDocument(String(req.params.id), req.auth!) });
});
