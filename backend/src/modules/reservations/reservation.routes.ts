import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createReservationSchema, updateReservationSchema } from "./reservation.schemas.js";
import * as controller from "./reservation.controller.js";

export const reservationRouter = Router();

reservationRouter.use(authMiddleware);
reservationRouter.use(requireActiveSubscription);
reservationRouter.get("/", controller.listReservations);
reservationRouter.post("/", validateBody(createReservationSchema), controller.createReservation);
reservationRouter.post("/check-availability", controller.checkAvailability);
reservationRouter.get("/calendar", controller.calendar);
reservationRouter.get("/:id", controller.getReservation);
reservationRouter.patch("/:id", validateBody(updateReservationSchema), controller.updateReservation);
reservationRouter.delete("/:id", controller.deleteReservation);
reservationRouter.patch("/:id/cancel", controller.cancelReservation);
reservationRouter.patch("/:id/start", controller.startReservation);
reservationRouter.patch("/:id/complete", controller.completeReservation);
