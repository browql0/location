import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/app-error.js";
import { env } from "../config/env.js";

function internalErrorDetails(error: unknown) {
  if (env.NODE_ENV === "production") return {};
  return { details: String(error) };
}

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      statusCode: 400,
      message: "Validation error",
      code: "VALIDATION_ERROR",
      details: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      ...(env.NODE_ENV !== "production" && error.details ? { details: error.details } : {})
    });
  }

  if (error instanceof multer.MulterError) {
    const isFileSize = error.code === "LIMIT_FILE_SIZE";
    return res.status(400).json({
      statusCode: 400,
      message: isFileSize ? "Taille max 5 MB depassee" : "File upload error",
      code: isFileSize ? "FILE_TOO_LARGE" : error.code
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      code: "DATABASE_ERROR",
      ...internalErrorDetails(error)
    });
  }

  return res.status(500).json({
    statusCode: 500,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
    ...internalErrorDetails(error)
  });
};
