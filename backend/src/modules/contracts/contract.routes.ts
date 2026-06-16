import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { pdfGenerationRateLimit, sensitiveDownloadRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import * as controller from "./contract.controller.js";

export const contractRouter = Router();

contractRouter.use(authMiddleware);
contractRouter.use(requireActiveSubscription);
contractRouter.post("/generate/:reservationId", pdfGenerationRateLimit, controller.generateContract);
contractRouter.get("/", controller.listContracts);
contractRouter.get("/:id", controller.getContract);
contractRouter.get("/:id/download", sensitiveDownloadRateLimit, controller.downloadContract);
contractRouter.patch("/:id/sign-client", controller.signClient);
contractRouter.patch("/:id/sign-agency", controller.signAgency);
contractRouter.patch("/:id/archive", controller.archiveContract);
contractRouter.patch("/:id/cancel", controller.cancelContract);
