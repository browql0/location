import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import * as controller from "./invoice.controller.js";

export const invoiceRouter = Router();

invoiceRouter.use(authMiddleware);
invoiceRouter.use(requireActiveSubscription);

invoiceRouter.get("/", controller.listInvoices);
invoiceRouter.post("/rental/reservation/:reservationId", controller.generateRentalInvoice);
invoiceRouter.post("/saas/subscription/:subscriptionId", controller.generateSaasInvoice);
invoiceRouter.get("/:id", controller.getInvoice);
invoiceRouter.get("/:id/download", controller.downloadInvoice);
invoiceRouter.patch("/:id/mark-paid", controller.markPaid);
invoiceRouter.patch("/:id/cancel", controller.cancelInvoice);
invoiceRouter.post("/:id/send-client", controller.sendClient);
invoiceRouter.post("/:id/send-agency", controller.sendAgency);
