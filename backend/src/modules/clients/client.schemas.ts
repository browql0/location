import { ClientDocumentType } from "@prisma/client";
import { z } from "zod";
import { paginationQueryFields } from "../../shared/utils/pagination.js";

const emptyToNull = (schema: z.ZodString) =>
  z
    .union([schema, z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value.trim() : null));

const optionalDate = z
  .union([z.string().datetime(), z.string().date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? new Date(value) : null));

export const clientQuerySchema = z.object({
  agencyId: z.string().optional(),
  search: z.string().trim().optional(),
  city: z.string().trim().optional(),
  hasCin: z.coerce.boolean().optional(),
  hasDrivingLicense: z.coerce.boolean().optional(),
  ...paginationQueryFields
});

export const createClientSchema = z.object({
  agencyId: z.string().optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: emptyToNull(z.string().min(3).max(40)),
  email: emptyToNull(z.string().email().max(120)),
  cinOrPassport: emptyToNull(z.string().max(80)),
  drivingLicense: emptyToNull(z.string().max(80)),
  address: emptyToNull(z.string().max(240)),
  city: emptyToNull(z.string().max(80)),
  country: emptyToNull(z.string().max(80)),
  dateOfBirth: optionalDate,
  nationality: emptyToNull(z.string().max(80)),
  notes: emptyToNull(z.string().max(2000))
});

export const updateClientSchema = createClientSchema.partial().omit({ agencyId: true });

export const createClientDocumentSchema = z.object({
  type: z.nativeEnum(ClientDocumentType)
});

export type ClientQueryInput = z.infer<typeof clientQuerySchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateClientDocumentInput = z.infer<typeof createClientDocumentSchema>;
