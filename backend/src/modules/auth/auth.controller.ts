import type { Request, RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import * as authService from "./auth.service.js";

const refreshCookieName = "refreshToken";
const refreshCookiePath = `${env.API_PREFIX}/auth`;

function requestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  };
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: refreshCookiePath,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: refreshCookiePath
  });
}

export const login: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, requestMeta(req));
  setRefreshCookie(res, result.refreshToken);
  res.json({
    accessToken: result.accessToken,
    user: result.user,
    subscriptionStatus: result.subscriptionStatus
  });
});

export const registerAgency: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerAgency(req.body, requestMeta(req));
  setRefreshCookie(res, result.refreshToken);
  res.status(201).json({
    accessToken: result.accessToken,
    user: result.user,
    subscriptionStatus: result.subscriptionStatus
  });
});

export const refresh: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[refreshCookieName];
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401, "REFRESH_TOKEN_REQUIRED");
  }

  const result = await authService.refresh(refreshToken, requestMeta(req));
  setRefreshCookie(res, result.refreshToken);
  res.json({
    accessToken: result.accessToken,
    user: result.user,
    subscriptionStatus: result.subscriptionStatus
  });
});

export const logout: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[refreshCookieName];
  await authService.logout(refreshToken, req.auth?.userId, requestMeta(req));
  clearRefreshCookie(res);
  res.status(204).send();
});

export const me: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.auth!.userId);
  res.json(result);
});

export const changePassword: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.auth!.userId, req.body, requestMeta(req));
  res.status(204).send();
});
