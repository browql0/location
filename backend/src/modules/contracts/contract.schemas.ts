import { z } from "zod";
import { paginationQueryFields } from "../../shared/utils/pagination.js";

export const contractQuerySchema = z.object({
  agencyId: z.string().cuid().optional(),
  search: z.string().trim().optional(),
  ...paginationQueryFields
});

export type ContractQueryInput = z.infer<typeof contractQuerySchema>;
