import { z } from "zod";

export const contractQuerySchema = z.object({
  agencyId: z.string().cuid().optional(),
  search: z.string().trim().optional()
});

export type ContractQueryInput = z.infer<typeof contractQuerySchema>;
