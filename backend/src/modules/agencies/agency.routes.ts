import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { updateAgencySchema } from "./agency.schemas.js";
import * as controller from "./agency.controller.js";

export const agencyRouter = Router();

agencyRouter.use(authMiddleware);
agencyRouter.get("/", controller.listAgencies);
agencyRouter.get("/:id", controller.getAgency);
agencyRouter.patch("/:id", validateBody(updateAgencySchema), controller.updateAgency);
agencyRouter.patch("/:id/enable", controller.enableAgency);
agencyRouter.patch("/:id/disable", controller.disableAgency);
