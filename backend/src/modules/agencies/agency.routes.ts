import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { uploadRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { AppError } from "../../shared/errors/app-error.js";
import { isAllowedAgencyLogoFile } from "../files/file-storage.service.js";
import { updateAgencySchema } from "./agency.schemas.js";
import { updateCompanySchema } from "./agency.schemas.js";
import * as controller from "./agency.controller.js";

export const agencyRouter = Router();

const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedAgencyLogoFile(file)) {
      callback(new AppError("Format non autorise", 400, "AGENCY_LOGO_UNSUPPORTED_FORMAT"));
      return;
    }
    callback(null, true);
  }
});

agencyRouter.use(authMiddleware);
agencyRouter.get("/", controller.listAgencies);
agencyRouter.get("/:id", controller.getAgency);
agencyRouter.patch("/:id", validateBody(updateAgencySchema), controller.updateAgency);
agencyRouter.patch("/:id/company", validateBody(updateCompanySchema), controller.updateCompany);
agencyRouter.post("/:id/logo", uploadRateLimit, uploadLogo.single("file"), controller.uploadLogo);
agencyRouter.patch("/:id/enable", controller.enableAgency);
agencyRouter.patch("/:id/disable", controller.disableAgency);
agencyRouter.delete("/:id", controller.deleteAgency);
