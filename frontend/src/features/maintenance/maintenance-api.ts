import { api } from "@/lib/axios";
import type { Car } from "@/features/cars/cars-api";

export type MaintenanceType = "OIL_CHANGE" | "TIRES" | "BRAKES" | "BATTERY" | "INSURANCE" | "TECHNICAL_INSPECTION" | "AIR_CONDITIONING" | "ENGINE" | "TRANSMISSION" | "BODYWORK" | "CLEANING" | "OTHER";
export type MaintenanceStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type VehicleAnomalyType = "MILEAGE_ROLLBACK" | "EXCESSIVE_MILEAGE" | "OVERDUE_OIL_CHANGE" | "OVERDUE_MAINTENANCE" | "INSURANCE_EXPIRED" | "TECHNICAL_INSPECTION_EXPIRED" | "DOCUMENT_MISSING" | "OTHER";
export type VehicleAnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type MaintenanceDocument = {
  id: string;
  maintenanceId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: string;
};

export type MaintenanceRecord = {
  id: string;
  agencyId: string;
  carId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  title: string;
  description: string | null;
  scheduledDate: string;
  completedDate: string | null;
  mileageAtService: number | null;
  cost: string | null;
  vendor: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  agency: { id: string; name: string };
  car: Pick<Car, "id" | "brand" | "model" | "registrationNumber" | "currentMileage">;
  documents: MaintenanceDocument[];
};

export type MaintenancePayload = {
  agencyId?: string;
  carId: string;
  type: MaintenanceType;
  status?: MaintenanceStatus;
  title: string;
  description?: string | null;
  scheduledDate: string;
  completedDate?: string | null;
  mileageAtService?: number | null;
  cost?: number | null;
  vendor?: string | null;
  notes?: string | null;
};

export type VehicleAnomaly = {
  id: string;
  agencyId: string;
  carId: string;
  type: VehicleAnomalyType;
  severity: VehicleAnomalySeverity;
  title: string;
  description: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  agency: { id: string; name: string };
  car: Pick<Car, "id" | "brand" | "model" | "registrationNumber" | "currentMileage" | "status">;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function listMaintenance(params?: { carId?: string; status?: string; type?: string; search?: string }) {
  const response = await api.get<ApiList<MaintenanceRecord>>("/maintenance", { params });
  return response.data.data;
}

export async function getMaintenance(id: string) {
  const response = await api.get<ApiItem<MaintenanceRecord>>(`/maintenance/${id}`);
  return response.data.data;
}

export async function createMaintenance(input: MaintenancePayload) {
  const response = await api.post<ApiItem<MaintenanceRecord>>("/maintenance", input);
  return response.data.data;
}

export async function updateMaintenance(id: string, input: Partial<MaintenancePayload>) {
  const response = await api.patch<ApiItem<MaintenanceRecord>>(`/maintenance/${id}`, input);
  return response.data.data;
}

export async function startMaintenance(id: string) {
  const response = await api.patch<ApiItem<MaintenanceRecord>>(`/maintenance/${id}/start`);
  return response.data.data;
}

export async function completeMaintenance(id: string, input: { completedDate?: string | null; mileageAtService?: number | null; cost?: number | null; notes?: string | null }) {
  const response = await api.patch<ApiItem<MaintenanceRecord>>(`/maintenance/${id}/complete`, input);
  return response.data.data;
}

export async function cancelMaintenance(id: string) {
  const response = await api.patch<ApiItem<MaintenanceRecord>>(`/maintenance/${id}/cancel`);
  return response.data.data;
}

export async function deleteMaintenance(id: string) {
  const response = await api.delete<ApiItem<MaintenanceRecord>>(`/maintenance/${id}`);
  return response.data.data;
}

export async function maintenanceCalendar() {
  const response = await api.get<ApiList<{ id: string; title: string; start: string; end: string; status: MaintenanceStatus; maintenance: MaintenanceRecord }>>("/maintenance/calendar");
  return response.data.data;
}

export async function uploadMaintenanceDocument(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<ApiItem<MaintenanceDocument>>(`/maintenance/${id}/documents`, formData, { headers: { "Content-Type": "multipart/form-data" } });
  return response.data.data;
}

export async function downloadMaintenanceDocument(id: string, fileName: string) {
  const response = await api.get<Blob>(`/maintenance/documents/${id}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteMaintenanceDocument(id: string) {
  const response = await api.delete<ApiItem<MaintenanceDocument>>(`/maintenance/documents/${id}`);
  return response.data.data;
}

export async function listVehicleAnomalies(params?: { carId?: string; type?: string; severity?: string; resolved?: string }) {
  const response = await api.get<ApiList<VehicleAnomaly>>("/vehicle-anomalies", { params });
  return response.data.data;
}

export async function getVehicleAnomaly(id: string) {
  const response = await api.get<ApiItem<VehicleAnomaly>>(`/vehicle-anomalies/${id}`);
  return response.data.data;
}

export async function resolveVehicleAnomaly(id: string) {
  const response = await api.patch<ApiItem<VehicleAnomaly>>(`/vehicle-anomalies/${id}/resolve`);
  return response.data.data;
}
