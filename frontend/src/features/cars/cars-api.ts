import { api } from "@/lib/axios";

export type CarStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE" | "INACTIVE";
export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC";
export type TransmissionType = "MANUAL" | "AUTOMATIC";
export type DocumentType = "REGISTRATION" | "INSURANCE" | "TECHNICAL_VISIT" | "OTHER";

export type CarPhoto = {
  id: string;
  carId: string;
  url: string;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
  storageKey: string | null;
  source: string;
  isPrimary: boolean;
  createdAt: string;
};

export type CarDocument = {
  id: string;
  carId: string;
  type: DocumentType;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  storageKey: string;
  createdAt: string;
};

export type Car = {
  id: string;
  agencyId: string;
  agency?: { id: string; name: string };
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  vin: string | null;
  color: string | null;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  defaultDeposit: string;
  mileage: number;
  currentMileage: number;
  nextOilChangeKm: number | null;
  nextTireChangeKm: number | null;
  nextBrakeCheckKm: number | null;
  nextInspectionKm: number | null;
  nextMaintenanceKm: number | null;
  status: CarStatus;
  insuranceExpiryDate: string | null;
  technicalVisitExpiryDate: string | null;
  notes: string | null;
  photos: CarPhoto[];
  documents: CarDocument[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CarPayload = {
  agencyId?: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  vin?: string | null;
  color?: string | null;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  defaultDeposit: number;
  mileage: number;
  currentMileage?: number;
  nextOilChangeKm?: number | null;
  nextTireChangeKm?: number | null;
  nextBrakeCheckKm?: number | null;
  nextInspectionKm?: number | null;
  nextMaintenanceKm?: number | null;
  status?: CarStatus;
  insuranceExpiryDate?: string | null;
  technicalVisitExpiryDate?: string | null;
  notes?: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

function unwrapList<T>(payload: T[] | ApiList<T>) {
  return Array.isArray(payload) ? payload : payload.data;
}

function unwrapItem<T>(payload: T | ApiItem<T>) {
  return "data" in (payload as ApiItem<T>) ? (payload as ApiItem<T>).data : (payload as T);
}

export async function listCars(params?: { agencyId?: string; search?: string; status?: string }) {
  const response = await api.get<ApiList<Car>>("/cars", { params });
  return response.data.data;
}

export async function createCar(input: CarPayload) {
  const response = await api.post<ApiItem<Car>>("/cars", input);
  return response.data.data;
}

export async function getCar(id: string) {
  const response = await api.get<ApiItem<Car>>(`/cars/${id}`);
  return response.data.data;
}

export async function updateCar(id: string, input: Partial<CarPayload>) {
  const response = await api.patch<ApiItem<Car>>(`/cars/${id}`, input);
  return response.data.data;
}

export async function deleteCar(id: string) {
  const response = await api.delete<ApiItem<Car>>(`/cars/${id}`);
  return response.data.data;
}

export async function setCarStatus(id: string, status: Exclude<CarStatus, "RENTED">) {
  const response = await api.patch<ApiItem<Car>>(`/cars/${id}/${status.toLowerCase()}`);
  return response.data.data;
}

export async function listCarPhotos(carId: string) {
  const response = await api.get<ApiList<CarPhoto> | CarPhoto[]>(`/cars/${carId}/photos`);
  return unwrapList<CarPhoto>(response.data);
}

export async function uploadCarPhoto(carId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<ApiItem<CarPhoto>>(`/cars/${carId}/photos`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return unwrapItem<CarPhoto>(response.data);
}

export async function deleteCarPhoto(id: string) {
  const response = await api.delete<ApiItem<CarPhoto>>(`/cars/photos/${id}`);
  return unwrapItem<CarPhoto>(response.data);
}

export async function setPrimaryCarPhoto(id: string) {
  const response = await api.patch<ApiItem<CarPhoto>>(`/cars/photos/${id}/primary`);
  return unwrapItem<CarPhoto>(response.data);
}

export async function getCarPhotoObjectUrl(photo: CarPhoto) {
  if (!photo.storageKey && photo.url) return photo.url;
  const response = await api.get<Blob>(`/cars/photos/${photo.id}/download`, { responseType: "blob" });
  return URL.createObjectURL(response.data);
}

export async function listCarDocuments(carId: string) {
  const response = await api.get<ApiList<CarDocument>>(`/cars/${carId}/documents`);
  return response.data.data;
}

export async function addCarDocument(carId: string, input: { type: DocumentType; file: File }) {
  const formData = new FormData();
  formData.append("type", input.type);
  formData.append("file", input.file);
  const response = await api.post<ApiItem<CarDocument>>(`/cars/${carId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
}

export async function downloadCarDocument(document: CarDocument) {
  const response = await api.get<Blob>(`/cars/documents/${document.id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = document.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function deleteCarDocument(id: string) {
  const response = await api.delete<ApiItem<CarDocument>>(`/cars/documents/${id}`);
  return response.data.data;
}
