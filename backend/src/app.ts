import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { globalApiRateLimit } from "./middlewares/rate-limit.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { carRouter } from "./modules/cars/car.routes.js";
import { clientRouter } from "./modules/clients/client.routes.js";
import { contractRouter } from "./modules/contracts/contract.routes.js";
import { agencyRouter } from "./modules/agencies/agency.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { invoiceRouter } from "./modules/invoices/invoice.routes.js";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes.js";
import { reservationRouter } from "./modules/reservations/reservation.routes.js";
import { subscriptionPlanRouter } from "./modules/subscription-plans/subscription-plan.routes.js";
import { subscriptionRouter } from "./modules/subscriptions/subscription.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { vehicleAnomalyRouter } from "./modules/vehicle-anomalies/vehicle-anomaly.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'", env.FRONTEND_APP_URL]
      }
    },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    noSniff: true,
    referrerPolicy: { policy: "no-referrer" }
  })
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(env.API_PREFIX, globalApiRateLimit);
app.use(`${env.API_PREFIX}/health`, healthRouter);
app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/dashboard`, dashboardRouter);
app.use(`${env.API_PREFIX}/subscription-plans`, subscriptionPlanRouter);
app.use(`${env.API_PREFIX}/agencies`, agencyRouter);
app.use(`${env.API_PREFIX}/subscriptions`, subscriptionRouter);
app.use(`${env.API_PREFIX}/users`, userRouter);
app.use(`${env.API_PREFIX}/cars`, carRouter);
app.use(`${env.API_PREFIX}/clients`, clientRouter);
app.use(`${env.API_PREFIX}/reservations`, reservationRouter);
app.use(`${env.API_PREFIX}/contracts`, contractRouter);
app.use(`${env.API_PREFIX}/invoices`, invoiceRouter);
app.use(`${env.API_PREFIX}/maintenance`, maintenanceRouter);
app.use(`${env.API_PREFIX}/vehicle-anomalies`, vehicleAnomalyRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
