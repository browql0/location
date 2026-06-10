import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { changePlanSchema } from "./subscription.schemas.js";
import * as controller from "./subscription.controller.js";

export const subscriptionRouter = Router();

subscriptionRouter.use(authMiddleware);
subscriptionRouter.get("/", controller.listSubscriptions);
subscriptionRouter.get("/current", controller.getCurrentSubscription);
subscriptionRouter.post("/check-expired", requireRole(UserRole.SUPER_ADMIN), controller.checkExpiredSubscriptions);
subscriptionRouter.get("/:id", controller.getSubscription);
subscriptionRouter.get("/:id/history", controller.getHistory);
subscriptionRouter.patch("/:id/change-plan", requireRole(UserRole.SUPER_ADMIN), validateBody(changePlanSchema), controller.changePlan);
subscriptionRouter.patch("/:id/suspend", requireRole(UserRole.SUPER_ADMIN), controller.suspendSubscription);
subscriptionRouter.patch("/:id/reactivate", requireRole(UserRole.SUPER_ADMIN), controller.reactivateSubscription);
