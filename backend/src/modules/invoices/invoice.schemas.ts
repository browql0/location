import { InvoiceStatus, InvoiceType } from "@prisma/client";
import { z } from "zod";

export const invoiceQuerySchema = z.object({
  agencyId: z.string().cuid().optional(),
  type: z.nativeEnum(InvoiceType).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().optional()
});

export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
