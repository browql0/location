import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { uploadRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import { AppError } from "../../shared/errors/app-error.js";
import { isAllowedMaintenanceDocumentFile } from "../files/file-storage.service.js";
import * as controller from "./maintenance.controller.js";

export const maintenanceRouter = Router();

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedMaintenanceDocumentFile(file)) {
      callback(new AppError("Format non autorise", 400, "MAINTENANCE_DOCUMENT_UNSUPPORTED_FORMAT"));
      return;
    }
    callback(null, true);
  }
});

maintenanceRouter.use(authMiddleware);
maintenanceRouter.use(requireActiveSubscription);

maintenanceRouter.get("/", controller.listMaintenance);
maintenanceRouter.post("/", controller.createMaintenance);
maintenanceRouter.get("/calendar", controller.calendar);
maintenanceRouter.get("/documents/:id/download", controller.downloadDocument);
maintenanceRouter.delete("/documents/:id", controller.deleteDocument);
maintenanceRouter.get("/:id", controller.getMaintenance);
maintenanceRouter.patch("/:id", controller.updateMaintenance);
maintenanceRouter.patch("/:id/start", controller.startMaintenance);
maintenanceRouter.patch("/:id/complete", controller.completeMaintenance);
maintenanceRouter.patch("/:id/cancel", controller.cancelMaintenance);
maintenanceRouter.delete("/:id", controller.deleteMaintenance);
maintenanceRouter.post("/:id/documents", uploadRateLimit, uploadDocument.single("file"), controller.addDocument);
