import { api } from "@/lib/axios";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "PAYPAL" | "CARD_MANUAL" | "CHECK" | "OTHER";
export type PaymentRecordStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";

export type Payment = {
  id: string;
  agencyId: string;
  reservationId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  paidAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  reference: string | null;
  notes: string | null;
  proofStorageKey: string | null;
  proofFileName: string | null;
  proofMimeType: string | null;
  proofSize: number | null;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  createdAt: string;
  updatedAt: string;
  reservation: {
    id: string;
    startDate: string;
    endDate: string;
    totalAmount: string;
    remainingAmount: string;
    paymentStatus: string;
    client: { id: string; firstName: string; lastName: string };
    car: { id: string; brand: string; model: string; registrationNumber: string };
  };
};

export type CreatePaymentPayload = {
  amount: number;
  method: PaymentMethod;
  status?: PaymentRecordStatus;
  paidAt?: string | null;
  reference?: string | null;
  notes?: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function listPayments(params?: { reservationId?: string; method?: string; status?: string; search?: string }) {
  const response = await api.get<ApiList<Payment>>("/payments", { params });
  return response.data.data;
}

export async function createReservationPayment(reservationId: string, input: CreatePaymentPayload) {
  const response = await api.post<ApiItem<Payment>>(`/payments/reservation/${reservationId}`, input);
  return response.data.data;
}

export async function confirmManualPayment(id: string) {
  const response = await api.patch<ApiItem<Payment>>(`/payments/${id}/confirm-manual`, {});
  return response.data.data;
}

export async function cancelPayment(id: string) {
  const response = await api.patch<ApiItem<Payment>>(`/payments/${id}/cancel`, {});
  return response.data.data;
}

export async function refundPayment(id: string) {
  const response = await api.patch<ApiItem<Payment>>(`/payments/${id}/refund`, {});
  return response.data.data;
}

export async function uploadPaymentProof(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<ApiItem<Payment>>(`/payments/${id}/proof`, formData);
  return response.data.data;
}

export async function downloadPaymentProof(id: string, fileName = "payment-proof") {
  const response = await api.get<Blob>(`/payments/${id}/proof/download`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function createPaypalOrder(id: string) {
  const response = await api.post<ApiItem<{ payment: Payment; orderId: string; approvalUrl: string | null; status: string | null }>>(`/payments/${id}/paypal/create-order`, {});
  return response.data.data;
}

export async function capturePaypalPayment(id: string) {
  const response = await api.post<ApiItem<Payment>>(`/payments/${id}/paypal/capture`, {});
  return response.data.data;
}
