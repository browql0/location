import type { RequestHandler } from "express";

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: "NOT_FOUND"
  });
};
