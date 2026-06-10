import { api } from "@/lib/axios";
import type { AgencyStatus, Permission, UserRole, UserStatus } from "@/types/auth";

export type StaffUser = {
  id: string;
  agencyId: string | null;
  agency?: { id: string; name: string; status: AgencyStatus } | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateUserPayload = {
  agencyId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  password: string;
  role: UserRole;
  permissions: Permission[];
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  status?: UserStatus;
  permissions?: Permission[];
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function listUsers(params?: { agencyId?: string; search?: string; role?: string; status?: string }) {
  const response = await api.get<ApiList<StaffUser>>("/users", { params });
  return response.data.data;
}

export async function createUser(input: CreateUserPayload) {
  const response = await api.post<ApiItem<StaffUser>>("/users", input);
  return response.data.data;
}

export async function updateUser(id: string, input: UpdateUserPayload) {
  const response = await api.patch<ApiItem<StaffUser>>(`/users/${id}`, input);
  return response.data.data;
}

export async function setUserEnabled(id: string, enabled: boolean) {
  const response = await api.patch<ApiItem<StaffUser>>(`/users/${id}/${enabled ? "enable" : "disable"}`);
  return response.data.data;
}

export async function updateUserPermissions(id: string, permissions: Permission[]) {
  const response = await api.patch<ApiItem<StaffUser>>(`/users/${id}/permissions`, { permissions });
  return response.data.data;
}

export async function deleteUser(id: string) {
  const response = await api.delete<ApiItem<StaffUser>>(`/users/${id}`);
  return response.data.data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.patch("/auth/change-password", { currentPassword, newPassword });
}
