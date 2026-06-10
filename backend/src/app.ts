import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { agencyRouter } from "./modules/agencies/agency.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { subscriptionPlanRouter } from "./modules/subscription-plans/subscription-plan.routes.js";
import { subscriptionRouter } from "./modules/subscriptions/subscription.routes.js";
import { userRouter } from "./modules/users/user.routes.js";

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(`${env.API_PREFIX}/health`, healthRouter);
app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/dashboard`, dashboardRouter);
app.use(`${env.API_PREFIX}/subscription-plans`, subscriptionPlanRouter);
app.use(`${env.API_PREFIX}/agencies`, agencyRouter);
app.use(`${env.API_PREFIX}/subscriptions`, subscriptionRouter);
app.use(`${env.API_PREFIX}/users`, userRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
