import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { changePasswordSchema, loginSchema, registerAgencySchema } from "./auth.schemas.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/register-agency", validateBody(registerAgencySchema), authController.registerAgency);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authMiddleware, authController.me);
authRouter.patch("/change-password", authMiddleware, validateBody(changePasswordSchema), authController.changePassword);
