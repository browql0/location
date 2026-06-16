import { z } from "zod";

export const paginationQueryFields = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
};

export type PaginationInput = {
  page?: number;
  limit?: number;
};

export function paginationArgs(input: PaginationInput): { skip?: number; take?: number } {
  if (input.page === undefined && input.limit === undefined) return {};

  const page = input.page ?? 1;
  const limit = input.limit ?? 25;
  return {
    skip: (page - 1) * limit,
    take: limit
  };
}
