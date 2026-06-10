import { AgencyStatus } from "@prisma/client";
import { z } from "zod";

export const agencyQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(AgencyStatus).optional()
});

export const updateAgencySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(250).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  status: z.nativeEnum(AgencyStatus).optional()
});

export type AgencyQueryInput = z.infer<typeof agencyQuerySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
