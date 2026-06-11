import { api } from "@/lib/axios";

export type CarStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE" | "INACTIVE";
export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC";
export type TransmissionType = "MANUAL" | "AUTOMATIC";
export type DocumentType = "REGISTRATION" | "INSURANCE" | "TECHNICAL_VISIT" | "OTHER";

export type CarPhoto = {
  id: string;
  carId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
};

export type CarDocument = {
  id: string;
  carId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
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
  mileage: number;
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
  mileage: number;
  status?: CarStatus;
  insuranceExpiryDate?: string | null;
  technicalVisitExpiryDate?: string | null;
  notes?: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

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
  const response = await api.get<ApiList<CarPhoto>>(`/cars/${carId}/photos`);
  return response.data.data;
}

export async function addCarPhoto(carId: string, input: { url: string; isPrimary: boolean }) {
  const response = await api.post<ApiItem<CarPhoto>>(`/cars/${carId}/photos`, input);
  return response.data.data;
}

export async function deleteCarPhoto(id: string) {
  const response = await api.delete<ApiItem<CarPhoto>>(`/cars/photos/${id}`);
  return response.data.data;
}

export async function listCarDocuments(carId: string) {
  const response = await api.get<ApiList<CarDocument>>(`/cars/${carId}/documents`);
  return response.data.data;
}

export async function addCarDocument(carId: string, input: { type: DocumentType; fileName: string; fileUrl: string }) {
  const response = await api.post<ApiItem<CarDocument>>(`/cars/${carId}/documents`, input);
  return response.data.data;
}

export async function deleteCarDocument(id: string) {
  const response = await api.delete<ApiItem<CarDocument>>(`/cars/documents/${id}`);
  return response.data.data;
}
