import { UserRole } from "@prisma/client";

export const permissions = [
  "users:create",
  "users:update",
  "users:delete",
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
  "invoices:read",
  "contracts:read",
  "incidents:read",
  "incidents:create",
  "dashboard:read"
] as const;

export type Permission = (typeof permissions)[number];

const agencyAdminPermissions: Permission[] = [
  "users:create",
  "users:update",
  "users:delete",
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
  "invoices:read",
  "contracts:read",
  "incidents:read",
  "incidents:create",
  "dashboard:read"
];

const staffDefaultPermissions: Permission[] = [
  "cars:read",
  "clients:read",
  "clients:create",
  "clients:update",
  "reservations:read",
  "reservations:create",
  "reservations:update",
  "invoices:read",
  "contracts:read",
  "dashboard:read"
];

export function getRolePermissions(role: UserRole): Permission[] {
  if (role === UserRole.SUPER_ADMIN) {
    return [...permissions];
  }

  if (role === UserRole.AGENCY_ADMIN) {
    return agencyAdminPermissions;
  }

  return staffDefaultPermissions;
}

export function mergeUserPermissions(role: UserRole, userPermissions: string[]): Permission[] {
  if (role !== UserRole.STAFF) {
    return getRolePermissions(role);
  }

  const allowed = new Set<Permission>(permissions);
  const custom = userPermissions.filter((permission): permission is Permission => allowed.has(permission as Permission));
  return Array.from(new Set([...getRolePermissions(role), ...custom]));
}
