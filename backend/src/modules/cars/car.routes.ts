import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createCarDocumentSchema, createCarPhotoSchema, createCarSchema, updateCarSchema } from "./car.schemas.js";
import * as controller from "./car.controller.js";

export const carRouter = Router();

carRouter.use(authMiddleware);
carRouter.use(requireActiveSubscription);
carRouter.get("/", controller.listCars);
carRouter.post("/", validateBody(createCarSchema), controller.createCar);
carRouter.get("/:id", controller.getCar);
carRouter.patch("/:id", validateBody(updateCarSchema), controller.updateCar);
carRouter.delete("/:id", controller.deleteCar);
carRouter.patch("/:id/available", controller.setAvailable);
carRouter.patch("/:id/maintenance", controller.setMaintenance);
carRouter.patch("/:id/inactive", controller.setInactive);
carRouter.get("/:id/photos", controller.listPhotos);
carRouter.post("/:id/photos", validateBody(createCarPhotoSchema), controller.addPhoto);
carRouter.delete("/photos/:id", controller.deletePhoto);
carRouter.get("/:id/documents", controller.listDocuments);
carRouter.post("/:id/documents", validateBody(createCarDocumentSchema), controller.addDocument);
carRouter.delete("/documents/:id", controller.deleteDocument);
