import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { sensitiveDownloadRateLimit, uploadRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { AppError } from "../../shared/errors/app-error.js";
import { isAllowedPaymentProofFile } from "../files/file-storage.service.js";
import { createPaymentSchema, updatePaymentSchema } from "./payment.schemas.js";
import * as controller from "./payment.controller.js";

export const paymentRouter = Router();

const uploadProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedPaymentProofFile(file)) {
      callback(new AppError("Format non autorise", 400, "PAYMENT_PROOF_UNSUPPORTED_FORMAT"));
      return;
    }
    callback(null, true);
  }
});

paymentRouter.use(authMiddleware);
paymentRouter.use(requireActiveSubscription);

paymentRouter.get("/", controller.listPayments);
paymentRouter.post("/reservation/:reservationId", validateBody(createPaymentSchema), controller.createPayment);
paymentRouter.get("/:id", controller.getPayment);
paymentRouter.patch("/:id", validateBody(updatePaymentSchema), controller.updatePayment);
paymentRouter.patch("/:id/confirm-manual", controller.confirmManual);
paymentRouter.patch("/:id/cancel", controller.cancelPayment);
paymentRouter.patch("/:id/refund", controller.refundPayment);
paymentRouter.post("/:id/proof", uploadRateLimit, uploadProof.single("file"), controller.uploadProof);
paymentRouter.get("/:id/proof/download", sensitiveDownloadRateLimit, controller.downloadProof);
paymentRouter.post("/:paymentId/paypal/create-order", controller.createPaypalOrder);
paymentRouter.post("/:paymentId/paypal/capture", controller.capturePaypal);
