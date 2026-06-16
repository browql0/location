import type { CorsOptions } from "cors";
import { env } from "./env.js";

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (env.NODE_ENV === "production" && (!origin || allowedOrigins.includes("*"))) {
      return callback(new Error("CORS origin is not allowed"));
    }

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
};
