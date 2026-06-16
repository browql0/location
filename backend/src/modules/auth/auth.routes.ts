import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { changePasswordSchema, loginSchema, registerAgencySchema } from "./auth.schemas.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", authRateLimit, validateBody(loginSchema), authController.login);
authRouter.post("/register-agency", authRateLimit, validateBody(registerAgencySchema), authController.registerAgency);
authRouter.post("/refresh", authRateLimit, authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authMiddleware, authController.me);
authRouter.patch("/change-password", authMiddleware, validateBody(changePasswordSchema), authController.changePassword);
