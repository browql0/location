import { BillingInterval, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";

export const subscriptionQuerySchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  agencyId: z.string().optional()
});

export const changePlanSchema = z.object({
  planId: z.string().min(1),
  billingInterval: z.nativeEnum(BillingInterval).default(BillingInterval.MONTHLY)
});

export type SubscriptionQueryInput = z.infer<typeof subscriptionQuerySchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
