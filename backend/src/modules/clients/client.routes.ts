import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { AppError } from "../../shared/errors/app-error.js";
import { isAllowedClientDocumentFile } from "../files/file-storage.service.js";
import { createClientSchema, updateClientSchema } from "./client.schemas.js";
import * as controller from "./client.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedClientDocumentFile(file)) {
      callback(new AppError("Format non autorise", 400, "CLIENT_DOCUMENT_UNSUPPORTED_FORMAT"));
      return;
    }
    callback(null, true);
  }
});

export const clientRouter = Router();

clientRouter.use(authMiddleware);
clientRouter.use(requireActiveSubscription);
clientRouter.get("/", controller.listClients);
clientRouter.post("/", validateBody(createClientSchema), controller.createClient);
clientRouter.get("/risk-check", controller.riskCheck);
clientRouter.get("/documents/:documentId/download", controller.downloadDocument);
clientRouter.delete("/documents/:documentId", controller.deleteDocument);
clientRouter.get("/:id/summary", controller.getClientSummary);
clientRouter.get("/:id", controller.getClient);
clientRouter.patch("/:id", validateBody(updateClientSchema), controller.updateClient);
clientRouter.delete("/:id", controller.deleteClient);
clientRouter.get("/:id/documents", controller.listDocuments);
clientRouter.post("/:id/documents", upload.single("file"), controller.addDocument);
