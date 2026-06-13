import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Edit, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import {
  deleteClientDocument,
  deleteClient,
  downloadClientDocument,
  getClient,
  listClientDocuments,
  uploadClientDocument,
  type Client,
  type ClientDocument,
  type ClientDocumentType
} from "@/features/clients/clients-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";

const documentTypeLabels: Record<ClientDocumentType, string> = {
  CIN_FRONT: "CIN recto",
  CIN_BACK: "CIN verso",
  DRIVER_LICENSE_FRONT: "Permis recto",
  DRIVER_LICENSE_BACK: "Permis verso",
  PASSPORT: "Passeport",
  SIGNED_CONTRACT: "Contrat signe",
  OTHER: "Autre"
};

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function uploadErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    if (code === "CLIENT_DOCUMENT_UNSUPPORTED_FORMAT") return "Format non autorise";
    if (code === "FILE_TOO_LARGE" || code === "CLIENT_DOCUMENT_FILE_TOO_LARGE") return "Taille max 5 MB depassee";
  }
  return getApiErrorMessage(error);
}

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentType, setDocumentType] = useState<ClientDocumentType>("CIN_FRONT");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canUpdate = hasPermission(user, "clients:update");
  const canDelete = hasPermission(user, "clients:delete");

  async function load() {
    if (!id) return;
    try {
      setIsLoading(true);
      const nextClient = await getClient(id);
      setClient(nextClient);
      setDocuments(nextClient.documents);
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function reloadDocuments(options: { silent?: boolean } = {}) {
    if (!id) return;
    try {
      setDocuments(await listClientDocuments(id));
    } catch (error) {
      console.error("Load documents error:", axios.isAxiosError(error) ? error.response?.data || error : error);
      if (!options.silent) {
        toast.error("Erreur chargement documents", { description: getApiErrorMessage(error) });
      }
    }
  }

  async function submitDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !file) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadClientDocument(client.id, { type: documentType, file });
      toast.success("Upload reussi");
      setDocuments((current) => [uploaded, ...current.filter((document) => document.id !== uploaded.id)]);
      setFile(null);
      setDocumentType("CIN_FRONT");
      if (fileInputRef.current) fileInputRef.current.value = "";
      void reloadDocuments({ silent: true });
    } catch (error) {
      console.error("Upload document error:", axios.isAxiosError(error) ? error.response?.data || error : error);
      toast.error(uploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function download(document: ClientDocument) {
    try {
      await downloadClientDocument(document);
    } catch (error) {
      toast.error("Telechargement impossible", { description: getApiErrorMessage(error) });
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    );
  }

  if (!client) {
    return (
      <PageContainer>
        <EmptyState title="Client introuvable" description="Ce client n'existe pas ou n'est pas accessible." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Fiche client"
        title={`${client.firstName} ${client.lastName}`}
        description={client.agency?.name ?? "Client agence"}
        actions={
          <div className="flex gap-2">
            {canUpdate ? <Button asChild variant="outline"><Link to={`/clients/${client.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Modifier</Link></Button> : null}
            {canDelete ? (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await deleteClient(client.id);
                    toast.success("Client supprime");
                    navigate("/clients");
                  } catch (error) {
                    toast.error("Suppression impossible", { description: getApiErrorMessage(error) });
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AppSection className="rounded-lg border bg-card p-5" title="Informations generales">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Telephone</dt><dd className="font-medium">{client.phone ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{client.email ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">CIN/Passeport</dt><dd className="font-medium">{client.cinOrPassport ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Permis</dt><dd className="font-medium">{client.drivingLicense ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Naissance</dt><dd className="font-medium">{formatDate(client.dateOfBirth)}</dd></div>
            <div><dt className="text-muted-foreground">Nationalite</dt><dd className="font-medium">{client.nationality ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Ville</dt><dd className="font-medium">{client.city ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Pays</dt><dd className="font-medium">{client.country ?? "-"}</dd></div>
          </dl>
          {client.address ? <p className="mt-5 rounded-md bg-muted p-3 text-sm text-muted-foreground">{client.address}</p> : null}
          {client.notes ? <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">{client.notes}</p> : null}
        </AppSection>

        <AppSection className="rounded-lg border bg-card p-5" title="Risque">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Identite normalisee</span><strong>{client.normalizedIdentity ?? "-"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><strong>Client neutre</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Score risque</span><strong>0</strong></div>
          </div>
        </AppSection>
      </div>

      <AppSection className="rounded-lg border bg-card p-5" title="Documents" actions={canUpdate ? <span className="text-sm text-muted-foreground">Ajouter document</span> : null}>
        {canUpdate ? (
          <form className="grid gap-2 md:grid-cols-[220px_1fr_auto]" onSubmit={submitDocument}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={documentType} onChange={(event) => setDocumentType(event.target.value as ClientDocumentType)}>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input
              required
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              className="h-10 rounded-md border bg-background px-3 py-2 text-sm"
              ref={fileInputRef}
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button disabled={isUploading} type="submit"><Upload className="mr-2 h-4 w-4" /> Ajouter</Button>
          </form>
        ) : null}

        <div className="divide-y rounded-md border">
          {documents.map((document) => (
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
              <div className="min-w-0">
                <p className="truncate font-medium"><FileText className="mr-2 inline h-4 w-4 align-[-2px]" />{document.fileName}</p>
                <p className="text-sm text-muted-foreground">{documentTypeLabels[document.type]} - {formatSize(document.size)} - {formatDate(document.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => download(document)}>
                  <Download className="mr-2 h-4 w-4" /> Telecharger
                </Button>
                {canUpdate ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!window.confirm("Supprimer ce document ?")) return;
                      try {
                        await deleteClientDocument(document.id);
                        toast.success("Document supprime");
                        await reloadDocuments();
                      } catch (error) {
                        toast.error("Suppression impossible", { description: getApiErrorMessage(error) });
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {documents.length === 0 ? <EmptyState title="Aucun document" description="Les documents clients ajoutes apparaitront ici." /> : null}
      </AppSection>

      <AppSection className="rounded-lg border bg-card p-5" title="Historique reservations">
        <EmptyState title="Historique futur" description="Les reservations, contrats et incidents seront affiches ici dans les prochaines phases." />
      </AppSection>
    </PageContainer>
  );
}
