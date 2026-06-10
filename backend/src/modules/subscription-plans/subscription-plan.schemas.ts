import { z } from "zod";

const planBaseSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().nullable(),
  priceMonthly: z.coerce.number().min(0),
  priceYearly: z.coerce.number().min(0).optional().nullable(),
  trialDays: z.coerce.number().int().min(0).max(365).default(0),
  maxUsers: z.coerce.number().int().positive().optional().nullable(),
  maxCars: z.coerce.number().int().positive().optional().nullable(),
  maxClients: z.coerce.number().int().positive().optional().nullable(),
  maxReservations: z.coerce.number().int().positive().optional().nullable(),
  canUseInvoices: z.boolean().default(true),
  canUseContracts: z.boolean().default(true),
  canUseIncidents: z.boolean().default(false),
  canUseAdvancedReports: z.boolean().default(false),
  canUseApiAccess: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const createSubscriptionPlanSchema = planBaseSchema;
export const updateSubscriptionPlanSchema = planBaseSchema.partial();

export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>;
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>;
