import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import * as controller from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get("/super-admin", requireRole(UserRole.SUPER_ADMIN), controller.getSuperAdminDashboard);
dashboardRouter.get("/super-admin/search", requireRole(UserRole.SUPER_ADMIN), controller.searchSuperAdminDashboard);
dashboardRouter.get("/agency", requireRole(UserRole.AGENCY_ADMIN), requirePermission("dashboard:read"), controller.getAgencyDashboard);
dashboardRouter.get("/staff", requireRole(UserRole.STAFF), requirePermission("dashboard:read"), controller.getStaffDashboard);
