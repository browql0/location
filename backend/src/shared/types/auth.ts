import type { AgencyStatus, SubscriptionStatus, UserRole } from "@prisma/client";
import type { Permission } from "../utils/permissions.js";

export type AuthContext = {
  userId: string;
  role: UserRole;
  agencyId: string | null;
  permissions: Permission[];
  agencyStatus: AgencyStatus | null;
  subscriptionStatus: SubscriptionStatus | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
