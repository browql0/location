import { AgencyStatus } from "@prisma/client";
import { z } from "zod";

export const agencyQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(AgencyStatus).optional()
});

export const updateAgencySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  tradeName: z.string().min(2).max(120).optional().nullable(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(250).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  ice: z.string().max(80).optional().nullable(),
  ifNumber: z.string().max(80).optional().nullable(),
  rc: z.string().max(80).optional().nullable(),
  patente: z.string().max(80).optional().nullable(),
  bankName: z.string().max(120).optional().nullable(),
  rib: z.string().max(80).optional().nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.nativeEnum(AgencyStatus).optional()
});

export const updateCompanySchema = updateAgencySchema.omit({ status: true });

export type AgencyQueryInput = z.infer<typeof agencyQuerySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
