export type UserRole = "SUPER_ADMIN" | "AGENCY_ADMIN" | "STAFF";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type AgencyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";

export type Permission =
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:disable"
  | "users:enable"
  | "users:delete"
  | "users:permissions"
  | "agencies:read"
  | "agencies:update"
  | "subscriptions:read"
  | "subscriptions:update"
  | "cars:read"
  | "cars:create"
  | "cars:update"
  | "cars:delete"
  | "clients:read"
  | "clients:create"
  | "clients:update"
  | "clients:delete"
  | "reservations:read"
  | "reservations:create"
  | "reservations:update"
  | "reservations:delete"
  | "payments:read"
  | "payments:create"
  | "payments:update"
  | "payments:delete"
  | "invoices:read"
  | "invoices:create"
  | "invoices:update"
  | "contracts:read"
  | "contracts:create"
  | "contracts:update"
  | "maintenance:read"
  | "maintenance:create"
  | "maintenance:update"
  | "maintenance:delete"
  | "incidents:read"
  | "incidents:create"
  | "dashboard:read";

export type AuthUser = {
  id: string;
  agencyId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  agency?: {
    id: string;
    name: string;
    status: AgencyStatus;
  } | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  subscriptionStatus: SubscriptionStatus | null;
};
