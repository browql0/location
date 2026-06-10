import type { Request, RequestHandler, Response } from "express";
import { UserStatus } from "@prisma/client";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { userQuerySchema } from "./user.schemas.js";
import * as service from "./user.service.js";

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

export const listUsers: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listUsers(userQuerySchema.parse(req.query), req.auth!) });
});

export const createUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await service.createUser(req.body, req.auth!, requestMeta(req)) });
});

export const getUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.getUser(String(req.params.id), req.auth!) });
});

export const updateUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updateUser(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const disableUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setUserStatus(String(req.params.id), UserStatus.SUSPENDED, req.auth!, requestMeta(req)) });
});

export const enableUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.setUserStatus(String(req.params.id), UserStatus.ACTIVE, req.auth!, requestMeta(req)) });
});

export const updatePermissions: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.updatePermissions(String(req.params.id), req.body, req.auth!, requestMeta(req)) });
});

export const deleteUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.softDeleteUser(String(req.params.id), req.auth!, requestMeta(req)) });
});
