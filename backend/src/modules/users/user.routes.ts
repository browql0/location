import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createUserSchema, updatePermissionsSchema, updateUserSchema } from "./user.schemas.js";
import * as controller from "./user.controller.js";

export const userRouter = Router();

userRouter.use(authMiddleware);
userRouter.use(requireActiveSubscription);
userRouter.get("/", controller.listUsers);
userRouter.post("/", validateBody(createUserSchema), controller.createUser);
userRouter.get("/:id", controller.getUser);
userRouter.patch("/:id", validateBody(updateUserSchema), controller.updateUser);
userRouter.patch("/:id/disable", controller.disableUser);
userRouter.patch("/:id/enable", controller.enableUser);
userRouter.patch("/:id/permissions", validateBody(updatePermissionsSchema), controller.updatePermissions);
userRouter.delete("/:id", controller.deleteUser);
