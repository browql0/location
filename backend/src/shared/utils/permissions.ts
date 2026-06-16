import { UserRole } from "@prisma/client";

export const permissions = [
  "users:read",
  "users:create",
  "users:update",
  "users:disable",
  "users:enable",
  "users:delete",
  "users:permissions",
  "agencies:read",
  "agencies:update",
  "subscriptions:read",
  "subscriptions:update",
  "cars:read",
  "cars:create",
  "cars:update",
  "cars:delete",
  "clients:read",
  "clients:create",
  "clients:update",
  "clients:delete",
  "reservations:read",
  "reservations:create",
  "reservations:update",
  "reservations:delete",
  "payments:read",
  "payments:create",
  "payments:update",
  "payments:delete",
  "invoices:read",
  "invoices:create",
  "invoices:update",
  "contracts:read",
  "contracts:create",
  "contracts:update",
  "maintenance:read",
  "maintenance:create",
  "maintenance:update",
  "maintenance:delete",
  "incidents:read",
  "incidents:create",
  "dashboard:read"
] as const;

export type Permission = (typeof permissions)[number];

const agencyAdminPermissions: Permission[] = [
  "users:read",
  "users:create",
  "users:update",
  "users:disable",
  "users:enable",
  "users:delete",
  "users:permissions",
  "agencies:read",
  "agencies:update",
  "subscriptions:read",
  "cars:read",
  "cars:create",
  "cars:update",
  "cars:delete",
  "clients:read",
  "clients:create",
  "clients:update",
  "clients:delete",
  "reservations:read",
  "reservations:create",
  "reservations:update",
  "reservations:delete",
  "payments:read",
  "payments:create",
  "payments:update",
  "payments:delete",
  "invoices:read",
  "invoices:create",
  "invoices:update",
  "contracts:read",
  "contracts:create",
  "contracts:update",
  "maintenance:read",
  "maintenance:create",
  "maintenance:update",
  "maintenance:delete",
  "incidents:read",
  "incidents:create",
  "dashboard:read"
];

export function getRolePermissions(role: UserRole): Permission[] {
  if (role === UserRole.SUPER_ADMIN) {
    return [...permissions];
  }

  if (role === UserRole.AGENCY_ADMIN) {
    return agencyAdminPermissions;
  }

  return [];
}

export function mergeUserPermissions(role: UserRole, userPermissions: string[]): Permission[] {
  if (role !== UserRole.STAFF) {
    return getRolePermissions(role);
  }

  const allowed = new Set<Permission>(permissions);
  const custom = userPermissions.filter((permission): permission is Permission => allowed.has(permission as Permission));
  return Array.from(new Set(custom));
}
