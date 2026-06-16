import { api } from "@/lib/axios";
import type { PaymentStatus, ReservationStatus } from "@/features/reservations/reservations-api";

export type InvoiceType = "SAAS_INVOICE" | "RENTAL_INVOICE";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "SENT" | "PARTIAL" | "PAID" | "CANCELLED";

export type Invoice = {
  id: string;
  agencyId: string | null;
  reservationId: string | null;
  subscriptionId: string | null;
  type: InvoiceType;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  currency: string;
  pdfStorageKey: string | null;
  issuedAt: string;
  dueDate: string | null;
  sentToClientAt: string | null;
  sentToAgencyAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  agency: { id: string; name: string; email: string; phone: string | null; address: string | null; city?: string | null } | null;
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
    client: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null; cinOrPassport: string | null };
    car: { id: string; brand: string; model: string; registrationNumber: string };
  } | null;
  subscription: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    billingInterval: string | null;
    amount: string | null;
    currency: string;
    agency: { id: string; name: string; email: string; phone: string | null; address: string | null; city?: string | null };
    plan: { id: string; name: string; priceMonthly: string; priceYearly: string | null };
  } | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function listInvoices(params?: { type?: InvoiceType; status?: InvoiceStatus; search?: string }) {
  const response = await api.get<ApiList<Invoice>>("/invoices", { params });
  return response.data.data;
}

export async function getInvoice(id: string) {
  const response = await api.get<ApiItem<Invoice>>(`/invoices/${id}`);
  return response.data.data;
}

export async function generateRentalInvoice(reservationId: string) {
  const response = await api.post<ApiItem<Invoice>>(`/invoices/rental/reservation/${reservationId}`);
  return response.data.data;
}

export async function generateSaasInvoice(subscriptionId: string) {
  const response = await api.post<ApiItem<Invoice>>(`/invoices/saas/subscription/${subscriptionId}`);
  return response.data.data;
}

export async function markInvoicePaid(id: string) {
  const response = await api.patch<ApiItem<Invoice>>(`/invoices/${id}/mark-paid`);
  return response.data.data;
}

export async function cancelInvoice(id: string) {
  const response = await api.patch<ApiItem<Invoice>>(`/invoices/${id}/cancel`);
  return response.data.data;
}

export async function sendInvoiceToClient(id: string) {
  const response = await api.post<ApiItem<Invoice>>(`/invoices/${id}/send-client`);
  return response.data.data;
}

export async function sendInvoiceToAgency(id: string) {
  const response = await api.post<ApiItem<Invoice>>(`/invoices/${id}/send-agency`);
  return response.data.data;
}

export async function downloadInvoicePdf(id: string, invoiceNumber: string) {
  const response = await api.get<Blob>(`/invoices/${id}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
