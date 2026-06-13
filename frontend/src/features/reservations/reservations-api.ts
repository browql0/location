import { api } from "@/lib/axios";

export type ReservationStatus = "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

export type Reservation = {
  id: string;
  agencyId: string;
  clientId: string;
  carId: string;
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
  notes: string | null;
  pickupMileage: number | null;
  returnMileage: number | null;
  pickupFuelLevel: number | null;
  returnFuelLevel: number | null;
  pickupCondition: string | null;
  returnCondition: string | null;
  cancelledAt: string | null;
  client: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null };
  car: { id: string; brand: string; model: string; registrationNumber: string; status: string; dailyPrice: string };
  contract?: { id: string; contractNumber: string; generatedAt: string; pdfPath: string | null; signedAt: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type ReservationPayload = {
  agencyId?: string;
  clientId: string;
  carId: string;
  startDate: string;
  endDate: string;
  dailyPrice?: number;
  advanceAmount: number;
  depositAmount?: number | null;
  notes?: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function listReservations(params?: { search?: string; status?: string; paymentStatus?: string; date?: string }) {
  const response = await api.get<ApiList<Reservation>>("/reservations", { params });
  return response.data.data;
}

export async function createReservation(input: ReservationPayload) {
  const response = await api.post<ApiItem<Reservation>>("/reservations", input);
  return response.data.data;
}

export async function getReservation(id: string) {
  const response = await api.get<ApiItem<Reservation>>(`/reservations/${id}`);
  return response.data.data;
}

export async function updateReservation(id: string, input: Partial<ReservationPayload>) {
  const response = await api.patch<ApiItem<Reservation>>(`/reservations/${id}`, input);
  return response.data.data;
}

export async function deleteReservation(id: string) {
  const response = await api.delete<ApiItem<Reservation>>(`/reservations/${id}`);
  return response.data.data;
}

export async function checkAvailability(input: { carId: string; startDate: string; endDate: string; excludeReservationId?: string }) {
  const response = await api.post<ApiItem<{ available: boolean; reason: string | null; message?: string }>>("/reservations/check-availability", input);
  return response.data.data;
}

export async function cancelReservation(id: string) {
  const response = await api.patch<ApiItem<Reservation>>(`/reservations/${id}/cancel`, {});
  return response.data.data;
}

export async function startReservation(id: string, input: { pickupMileage?: number | null; pickupFuelLevel?: number | null; pickupCondition?: string | null }) {
  const response = await api.patch<ApiItem<Reservation>>(`/reservations/${id}/start`, input);
  return response.data.data;
}

export async function completeReservation(id: string, input: { returnMileage?: number | null; returnFuelLevel?: number | null; returnCondition?: string | null }) {
  const response = await api.patch<ApiItem<Reservation>>(`/reservations/${id}/complete`, input);
  return response.data.data;
}

export async function getReservationCalendar() {
  const response = await api.get<ApiList<{ id: string; title: string; start: string; end: string; status: ReservationStatus }>>("/reservations/calendar");
  return response.data.data;
}
