import { MaintenanceStatus, MaintenanceType } from "@prisma/client";
import { z } from "zod";
import { paginationQueryFields } from "../../shared/utils/pagination.js";

const optionalDate = z.union([z.string().datetime(), z.string().date(), z.literal(""), z.null()]).optional().transform((value) => (value ? new Date(value) : null));
const requiredDate = z.union([z.string().datetime(), z.string().date()]).transform((value) => new Date(value));
const optionalMoney = z.coerce.number().min(0).optional().nullable();
const optionalInt = z.coerce.number().int().min(0).optional().nullable();

export const maintenanceQuerySchema = z.object({
  agencyId: z.string().optional(),
  carId: z.string().optional(),
  type: z.nativeEnum(MaintenanceType).optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().optional(),
  ...paginationQueryFields
});

export const createMaintenanceSchema = z.object({
  agencyId: z.string().optional(),
  carId: z.string().min(1),
  type: z.nativeEnum(MaintenanceType),
  status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.PLANNED),
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional().nullable(),
  scheduledDate: requiredDate,
  completedDate: optionalDate,
  mileageAtService: optionalInt,
  cost: optionalMoney,
  vendor: z.string().max(160).optional().nullable(),
  notes: z.string().max(2000).optional().nullable()
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial().omit({ agencyId: true });

export const completeMaintenanceSchema = z.object({
  completedDate: optionalDate,
  mileageAtService: optionalInt,
  cost: optionalMoney,
  notes: z.string().max(2000).optional().nullable()
});

export type MaintenanceQueryInput = z.infer<typeof maintenanceQuerySchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;
