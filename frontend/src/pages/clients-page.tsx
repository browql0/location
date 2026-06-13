import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { ConfirmDialog } from "@/components/ui-custom/confirm-dialog";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { TableSkeleton } from "@/components/ui-custom/page-skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { deleteClient, listClients, type Client } from "@/features/clients/clients-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function fullName(client: Client) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export function ClientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<Client | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [cinFilter, setCinFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const canCreate = hasPermission(user, "clients:create");
  const canDelete = hasPermission(user, "clients:delete");

  async function load() {
    try {
      setIsLoading(true);
      setClients(await listClients({
        ...(cityFilter ? { city: cityFilter } : {}),
        ...(cinFilter ? { hasCin: cinFilter === "yes" } : {}),
        ...(licenseFilter ? { hasDrivingLicense: licenseFilter === "yes" } : {})
      }));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [cityFilter, cinFilter, licenseFilter]);

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      { header: "Nom", cell: ({ row }) => <span className="font-medium">{fullName(row.original)}</span> },
      { accessorKey: "phone", header: "Telephone", cell: ({ row }) => row.original.phone ?? "-" },
      { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email ?? "-" },
      { accessorKey: "cinOrPassport", header: "CIN/Passeport", cell: ({ row }) => row.original.cinOrPassport ?? "-" },
      { accessorKey: "drivingLicense", header: "Permis", cell: ({ row }) => row.original.drivingLicense ?? "-" },
      { accessorKey: "city", header: "Ville", cell: ({ row }) => row.original.city ?? "-" },
      { header: "Score risque", cell: () => <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Neutre</span> },
      { header: "Creation", cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex min-w-40 flex-wrap gap-2">
            <Button className="h-9 px-3" type="button" variant="outline" onClick={() => navigate(`/clients/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> Voir
            </Button>
            {canDelete ? (
              <Button className="h-9 px-3" type="button" variant="outline" onClick={() => setConfirmTarget(row.original)}>
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </Button>
            ) : null}
          </div>
        )
      }
    ],
    [canDelete, navigate]
  );

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Clients"
        title="Clients"
        description="Gestion des profils clients, documents et verification de risque."
        actions={canCreate ? (
          <Button asChild>
            <Link to="/clients/new"><Plus className="mr-2 h-4 w-4" /> Nouveau client</Link>
          </Button>
        ) : null}
      />

      <AppSection
        title="Base clients"
        description={isLoading ? "Chargement..." : `${clients.length} client(s) trouve(s).`}
        actions={
          <div className="flex flex-wrap gap-2">
            <input className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Ville" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} />
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={cinFilter} onChange={(event) => setCinFilter(event.target.value)}>
              <option value="">CIN: tous</option>
              <option value="yes">Avec CIN</option>
              <option value="no">Sans CIN</option>
            </select>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={licenseFilter} onChange={(event) => setLicenseFilter(event.target.value)}>
              <option value="">Permis: tous</option>
              <option value="yes">Avec permis</option>
              <option value="no">Sans permis</option>
            </select>
          </div>
        }
      >
        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={clients} getRowId={(row) => row.id} searchPlaceholder="Rechercher nom, telephone, email, CIN, permis..." />}
        {!isLoading && clients.length === 0 ? <EmptyState title="Aucun client" description="Les clients ajoutes a cette agence apparaitront ici." /> : null}
      </AppSection>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Supprimer le client"
        description="Le client sera masque par soft delete et restera conserve en base."
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (!confirmTarget) return;
          try {
            await deleteClient(confirmTarget.id);
            toast.success("Client supprime");
            setConfirmTarget(null);
            await load();
          } catch (error) {
            toast.error("Suppression impossible", { description: getApiErrorMessage(error) });
          }
        }}
      />
    </PageContainer>
  );
}
