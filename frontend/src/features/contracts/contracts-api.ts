import { api } from "@/lib/axios";
import type { PaymentStatus, ReservationStatus } from "@/features/reservations/reservations-api";

export type Contract = {
  id: string;
  agencyId: string;
  reservationId: string;
  contractNumber: string;
  status: "GENERATED" | "SIGNED" | "ARCHIVED" | "CANCELLED";
  generatedAt: string;
  pdfStorageKey: string | null;
  signedByClient: boolean;
  signedByAgency: boolean;
  signedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  agency: { id: string; name: string; email: string; phone: string | null; address: string | null; city?: string | null };
  reservation: {
    id: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    dailyPrice: string;
    totalAmount: string;
    advanceAmount: string;
    remainingAmount: string;
    depositAmount: string | null;
    status: ReservationStatus;
    paymentStatus: PaymentStatus;
    pickupMileage: number | null;
    returnMileage: number | null;
    pickupFuelLevel: number | null;
    returnFuelLevel: number | null;
    pickupCondition: string | null;
    returnCondition: string | null;
    client: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null; cinOrPassport: string | null; drivingLicense: string | null; address: string | null; city: string | null };
    car: { id: string; brand: string; model: string; year: number; registrationNumber: string; color: string | null; transmission: string; fuelType: string; status: string };
  };
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function listContracts(params?: { search?: string }) {
  const response = await api.get<ApiList<Contract>>("/contracts", { params });
  return response.data.data;
}

export async function getContract(id: string) {
  const response = await api.get<ApiItem<Contract>>(`/contracts/${id}`);
  return response.data.data;
}

export async function generateContract(reservationId: string) {
  const response = await api.post<ApiItem<Contract>>(`/contracts/generate/${reservationId}`);
  return response.data.data;
}

export async function downloadContractPdf(id: string, contractNumber: string) {
  const response = await api.get<Blob>(`/contracts/${id}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${contractNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function signContractClient(id: string) {
  const response = await api.patch<ApiItem<Contract>>(`/contracts/${id}/sign-client`);
  return response.data.data;
}

export async function signContractAgency(id: string) {
  const response = await api.patch<ApiItem<Contract>>(`/contracts/${id}/sign-agency`);
  return response.data.data;
}

export async function archiveContract(id: string) {
  const response = await api.patch<ApiItem<Contract>>(`/contracts/${id}/archive`);
  return response.data.data;
}

export async function cancelContract(id: string) {
  const response = await api.patch<ApiItem<Contract>>(`/contracts/${id}/cancel`);
  return response.data.data;
}
