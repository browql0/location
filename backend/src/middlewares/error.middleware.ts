import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/app-error.js";
import { env } from "../config/env.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      code: "VALIDATION_ERROR",
      details: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details
    });
  }

  return res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(env.NODE_ENV !== "production" ? { details: String(error) } : {})
  });
};
