import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema } from "./subscription-plan.schemas.js";
import * as controller from "./subscription-plan.controller.js";

export const subscriptionPlanRouter = Router();

subscriptionPlanRouter.use(authMiddleware);
subscriptionPlanRouter.get("/", controller.listPlans);
subscriptionPlanRouter.post("/", requireRole(UserRole.SUPER_ADMIN), validateBody(createSubscriptionPlanSchema), controller.createPlan);
subscriptionPlanRouter.patch("/:id", requireRole(UserRole.SUPER_ADMIN), validateBody(updateSubscriptionPlanSchema), controller.updatePlan);
subscriptionPlanRouter.patch("/:id/disable", requireRole(UserRole.SUPER_ADMIN), controller.disablePlan);
subscriptionPlanRouter.patch("/:id/enable", requireRole(UserRole.SUPER_ADMIN), controller.enablePlan);
