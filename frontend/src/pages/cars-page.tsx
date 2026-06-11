import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { ConfirmDialog } from "@/components/ui-custom/confirm-dialog";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { TableSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { useAuth } from "@/features/auth/auth-provider";
import { deleteCar, listCars, setCarStatus, type Car, type CarStatus } from "@/features/cars/cars-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";

const placeholder = "https://placehold.co/96x64?text=Auto";

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("fr-FR")} MAD`;
}

export function CarsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<Car | null>(null);
  const canCreate = hasPermission(user, "cars:create");
  const canUpdate = hasPermission(user, "cars:update");
  const canDelete = hasPermission(user, "cars:delete");

  async function load() {
    try {
      setIsLoading(true);
      setCars(await listCars({ ...(statusFilter ? { status: statusFilter } : {}) }));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter]);

  async function changeStatus(car: Car, status: Exclude<CarStatus, "RENTED">) {
    try {
      await setCarStatus(car.id, status);
      toast.success("Statut modifie");
      await load();
    } catch (error) {
      toast.error("Modification impossible", { description: getApiErrorMessage(error) });
    }
  }

  const columns = useMemo<ColumnDef<Car>[]>(
    () => [
      {
        header: "Photo",
        cell: ({ row }) => <img alt="" className="h-12 w-16 rounded-md object-cover ring-1 ring-border" src={row.original.photos[0]?.url ?? placeholder} />
      },
      { accessorKey: "registrationNumber", header: "Immatriculation", cell: ({ row }) => <span className="font-medium">{row.original.registrationNumber}</span> },
      { accessorKey: "brand", header: "Marque" },
      { accessorKey: "model", header: "Modele" },
      { accessorKey: "year", header: "Annee" },
      { header: "Prix/jour", cell: ({ row }) => formatMoney(row.original.dailyPrice) },
      { header: "Kilometrage", cell: ({ row }) => `${row.original.mileage.toLocaleString("fr-FR")} km` },
      { header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Assurance", cell: ({ row }) => formatDate(row.original.insuranceExpiryDate) },
      { header: "Visite technique", cell: ({ row }) => formatDate(row.original.technicalVisitExpiryDate) },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex min-w-72 flex-wrap gap-2">
            <Button className="h-9 px-3" type="button" variant="outline" onClick={() => navigate(`/cars/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> Voir
            </Button>
            {canUpdate ? (
              <>
                <Button className="h-9 px-3" type="button" variant="outline" onClick={() => changeStatus(row.original, "AVAILABLE")}>Disponible</Button>
                <Button className="h-9 px-3" type="button" variant="outline" onClick={() => changeStatus(row.original, "MAINTENANCE")}>
                  <Wrench className="mr-2 h-4 w-4" /> Maintenance
                </Button>
                <Button className="h-9 px-3" type="button" variant="outline" onClick={() => changeStatus(row.original, "INACTIVE")}>Inactive</Button>
              </>
            ) : null}
            {canDelete ? (
              <Button className="h-9 px-3" type="button" variant="outline" onClick={() => setConfirmTarget(row.original)}>
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </Button>
            ) : null}
          </div>
        )
      }
    ],
    [canDelete, canUpdate, navigate]
  );

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Flotte"
        title="Vehicules"
        description="Gestion des voitures, statuts, echeances et documents de flotte."
        actions={canCreate ? (
          <Button asChild>
            <Link to="/cars/new"><Plus className="mr-2 h-4 w-4" /> Nouveau vehicule</Link>
          </Button>
        ) : null}
      />

      <AppSection
        title="Parc automobile"
        description={isLoading ? "Chargement..." : `${cars.length} vehicule(s) trouve(s).`}
        actions={
          <select className="h-9 rounded-md border bg-background px-3 text-sm" aria-label="Filtrer statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tous statuts</option>
            <option value="AVAILABLE">Disponible</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        }
      >
        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={cars} getRowId={(row) => row.id} searchPlaceholder="Rechercher immatriculation, marque, modele..." />}
        {!isLoading && cars.length === 0 ? <EmptyState title="Aucun vehicule" description="Les voitures ajoutees a cette agence apparaitront ici." /> : null}
      </AppSection>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Supprimer le vehicule"
        description="Le vehicule sera masque par soft delete et restera conserve en base."
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (!confirmTarget) return;
          try {
            await deleteCar(confirmTarget.id);
            toast.success("Vehicule supprime");
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
