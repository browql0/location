import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const weakSecretPatterns = [/change-me/i, /changeme/i, /replace-with/i, /example/i, /placeholder/i, /dev-only/i];

function isStrongProductionSecret(value: string) {
  return value.length >= 32 && !weakSecretPatterns.some((pattern) => pattern.test(value));
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  FRONTEND_APP_URL: z.string().url().default("http://localhost:5173"),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  EMAIL_PROVIDER: z.enum(["mock", "smtp", "resend"]).default("mock"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().positive().optional()),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default(""),
  PAYPAL_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYPAL_CLIENT_ID: z.string().optional().default(""),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(""),
  PAYPAL_CURRENCY: z.string().default("MAD"),
  PAYPAL_RETURN_URL: z.string().url().default("http://localhost:5173/reservations"),
  PAYPAL_CANCEL_URL: z.string().url().default("http://localhost:5173/reservations")
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== "production") return;

  if (!isStrongProductionSecret(value.JWT_ACCESS_SECRET)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["JWT_ACCESS_SECRET"],
      message: "JWT_ACCESS_SECRET must be at least 32 characters and must not use placeholder values in production"
    });
  }

  if (!isStrongProductionSecret(value.JWT_REFRESH_SECRET)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["JWT_REFRESH_SECRET"],
      message: "JWT_REFRESH_SECRET must be at least 32 characters and must not use placeholder values in production"
    });
  }

  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["JWT_REFRESH_SECRET"],
      message: "JWT access and refresh secrets must be different in production"
    });
  }

  const origins = value.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.includes("*")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CORS_ORIGIN"],
      message: "CORS_ORIGIN must explicitly list trusted origins in production"
    });
  }

  if (!origins.includes(value.FRONTEND_APP_URL)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CORS_ORIGIN"],
      message: "CORS_ORIGIN must include FRONTEND_APP_URL in production"
    });
  }

  if (value.PAYPAL_MODE === "live" && (!value.PAYPAL_CLIENT_ID || !value.PAYPAL_CLIENT_SECRET)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["PAYPAL_CLIENT_ID"],
      message: "PayPal live mode requires PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"
    });
  }
});

export const env = envSchema.parse(process.env);
