import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import * as controller from "./vehicle-anomaly.controller.js";

export const vehicleAnomalyRouter = Router();

vehicleAnomalyRouter.use(authMiddleware);
vehicleAnomalyRouter.use(requireActiveSubscription);
vehicleAnomalyRouter.get("/", controller.listAnomalies);
vehicleAnomalyRouter.get("/:id", controller.getAnomaly);
vehicleAnomalyRouter.patch("/:id/resolve", controller.resolveAnomaly);
