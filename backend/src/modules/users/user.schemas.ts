import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { permissions } from "../../shared/utils/permissions.js";

const permissionSchema = z.enum(permissions);

export const userQuerySchema = z.object({
  agencyId: z.string().optional(),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional()
});

export const createUserSchema = z.object({
  agencyId: z.string().optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole),
  permissions: z.array(permissionSchema).default([])
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(40).optional().nullable(),
  status: z.nativeEnum(UserStatus).optional(),
  permissions: z.array(permissionSchema).optional()
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(permissionSchema)
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
