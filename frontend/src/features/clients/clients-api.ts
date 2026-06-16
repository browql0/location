import { api } from "@/lib/axios";

export type ClientDocumentType =
  | "CIN_FRONT"
  | "CIN_BACK"
  | "DRIVER_LICENSE_FRONT"
  | "DRIVER_LICENSE_BACK"
  | "PASSPORT"
  | "SIGNED_CONTRACT"
  | "OTHER";

export type ClientDocument = {
  id: string;
  clientId: string;
  type: ClientDocumentType;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: string;
};

export type Client = {
  id: string;
  agencyId: string;
  agency?: { id: string; name: string };
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  cinOrPassport: string | null;
  drivingLicense: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  notes: string | null;
  normalizedIdentity: string | null;
  documents: ClientDocument[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ClientPayload = {
  agencyId?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  cinOrPassport?: string | null;
  drivingLicense?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
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

export async function listClients(params?: { agencyId?: string; search?: string; city?: string; hasCin?: boolean; hasDrivingLicense?: boolean }) {
  const response = await api.get<ApiList<Client>>("/clients", { params });
  return response.data.data;
}

export async function createClient(input: ClientPayload) {
  const response = await api.post<ApiItem<Client>>("/clients", input);
  return response.data.data;
}

export async function getClient(id: string) {
  const response = await api.get<ApiItem<Client>>(`/clients/${id}`);
  const client = unwrapItem<Client>(response.data);
  client.documents = Array.isArray(client.documents) ? client.documents : [];
  return client;
}

export async function updateClient(id: string, input: Partial<ClientPayload>) {
  const response = await api.patch<ApiItem<Client>>(`/clients/${id}`, input);
  return response.data.data;
}

export async function deleteClient(id: string) {
  const response = await api.delete<ApiItem<Client>>(`/clients/${id}`);
  return response.data.data;
}

export async function riskCheck(identity: string) {
  const response = await api.get<ApiItem<{ normalizedIdentity: string; riskScore: number; trustScore: number; trustLevel: "TRUSTED" | "WATCHLIST" | "RISKY"; validatedIncidentCount: number; trustedClient: boolean }>>(
    "/clients/risk-check",
    { params: { identity } }
  );
  return response.data.data;
}

export async function uploadClientDocument(clientId: string, input: { type: ClientDocumentType; file: File }) {
  const formData = new FormData();
  formData.append("type", input.type);
  formData.append("file", input.file);
  const response = await api.post<ApiItem<ClientDocument>>(`/clients/${clientId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return unwrapItem<ClientDocument>(response.data);
}

export async function listClientDocuments(clientId: string) {
  const response = await api.get<ApiList<ClientDocument> | ClientDocument[]>(`/clients/${clientId}/documents`);
  return unwrapList<ClientDocument>(response.data);
}

export async function downloadClientDocument(document: ClientDocument) {
  const response = await api.get<Blob>(`/clients/documents/${document.id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = document.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function deleteClientDocument(id: string) {
  const response = await api.delete<ApiItem<ClientDocument>>(`/clients/documents/${id}`);
  return response.data.data;
}
