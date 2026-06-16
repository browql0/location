import { PaymentMethod, PaymentRecordStatus } from "@prisma/client";
import { z } from "zod";
import { paginationQueryFields } from "../../shared/utils/pagination.js";

const optionalDate = z
  .union([z.string().datetime(), z.string().date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? new Date(value) : null));

export const paymentQuerySchema = z.object({
  agencyId: z.string().optional(),
  reservationId: z.string().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentRecordStatus).optional(),
  search: z.string().trim().optional(),
  ...paginationQueryFields
});

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  status: z.nativeEnum(PaymentRecordStatus).optional(),
  paidAt: optionalDate,
  reference: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable()
});

export const updatePaymentSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  reference: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  paidAt: optionalDate
});

export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
