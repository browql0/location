import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { sensitiveDownloadRateLimit, uploadRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { AppError } from "../../shared/errors/app-error.js";
import { isAllowedCarPhotoFile, isAllowedClientDocumentFile } from "../files/file-storage.service.js";
import { createCarDocumentSchema, createCarSchema, updateCarSchema } from "./car.schemas.js";
import * as controller from "./car.controller.js";

export const carRouter = Router();

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedCarPhotoFile(file)) {
      callback(new AppError("Format non autorise", 400, "CAR_PHOTO_UNSUPPORTED_FORMAT"));
      return;
    }
    callback(null, true);
  }
});

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedClientDocumentFile(file)) {
      callback(new AppError("Format non autorise", 400, "CAR_DOCUMENT_UNSUPPORTED_FORMAT"));
      return;
    }
    callback(null, true);
  }
});

carRouter.use(authMiddleware);
carRouter.use(requireActiveSubscription);
carRouter.get("/", controller.listCars);
carRouter.post("/", validateBody(createCarSchema), controller.createCar);
carRouter.get("/:id", controller.getCar);
carRouter.patch("/:id", validateBody(updateCarSchema), controller.updateCar);
carRouter.delete("/:id", controller.deleteCar);
carRouter.patch("/:id/available", controller.setAvailable);
carRouter.patch("/:id/maintenance", controller.setMaintenance);
carRouter.patch("/:id/inactive", controller.setInactive);
carRouter.get("/:id/photos", controller.listPhotos);
carRouter.post("/:id/photos", uploadRateLimit, uploadPhoto.single("file"), controller.addPhoto);
carRouter.get("/photos/:photoId/download", sensitiveDownloadRateLimit, controller.downloadPhoto);
carRouter.patch("/photos/:photoId/primary", controller.setPrimaryPhoto);
carRouter.delete("/photos/:photoId", controller.deletePhoto);
carRouter.get("/:id/documents", controller.listDocuments);
carRouter.post("/:id/documents", uploadRateLimit, uploadDocument.single("file"), controller.addDocument);
carRouter.get("/documents/:id/download", sensitiveDownloadRateLimit, controller.downloadDocument);
carRouter.delete("/documents/:id", controller.deleteDocument);
