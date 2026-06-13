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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-widest text-foreground uppercase">
            Risk & Trust Network
          </h1>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Client Registry & Profiling
          </p>
        </div>
        
        {canCreate && (
          <Link 
            to="/clients/new" 
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Client Profile
          </Link>
        )}
      </div>

      <div className="glass-card rounded-xl border border-border/50 p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Registry Database</h2>
            <p className="text-xs text-muted-foreground">{isLoading ? "Loading profiles..." : `${clients.length} authenticated profiles.`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input className="h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="City Filter" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} />
            <select className="h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" value={cinFilter} onChange={(event) => setCinFilter(event.target.value)}>
              <option value="">CIN: All</option>
              <option value="yes">Verified CIN</option>
              <option value="no">Missing CIN</option>
            </select>
            <select className="h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" value={licenseFilter} onChange={(event) => setLicenseFilter(event.target.value)}>
              <option value="">License: All</option>
              <option value="yes">Verified License</option>
              <option value="no">Missing License</option>
            </select>
          </div>
        </div>

        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={clients} getRowId={(row) => row.id} searchPlaceholder="Search profiles by name, phone, email..." />}
        {!isLoading && clients.length === 0 ? <EmptyState title="No Profiles" description="Client intelligence will appear here." /> : null}
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Revoke Profile"
        description="This profile will be archived and removed from active operations."
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (!confirmTarget) return;
          try {
            await deleteClient(confirmTarget.id);
            toast.success("Profile revoked");
            setConfirmTarget(null);
            await load();
          } catch (error) {
            toast.error("Action failed", { description: getApiErrorMessage(error) });
          }
        }}
      />
    </div>
  );
}
