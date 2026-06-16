import { VehicleAnomalySeverity, VehicleAnomalyType } from "@prisma/client";
import { z } from "zod";

export const anomalyQuerySchema = z.object({
  agencyId: z.string().optional(),
  carId: z.string().optional(),
  type: z.nativeEnum(VehicleAnomalyType).optional(),
  severity: z.nativeEnum(VehicleAnomalySeverity).optional(),
  resolved: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true"))
});
