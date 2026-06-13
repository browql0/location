import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { TableSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { useAuth } from "@/features/auth/auth-provider";
import { deleteReservation, listReservations, type Reservation } from "@/features/reservations/reservations-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

const money = (value: string) => `${Number(value).toLocaleString("fr-FR")} MAD`;
const date = (value: string) => new Date(value).toLocaleDateString("fr-FR");
const clientName = (r: Reservation) => `${r.client.firstName} ${r.client.lastName}`;
const carName = (r: Reservation) => `${r.car.brand} ${r.car.model} (${r.car.registrationNumber})`;

export function ReservationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const canCreate = hasPermission(user, "reservations:create");
  const canDelete = hasPermission(user, "reservations:delete");

  async function load() {
    try {
      setIsLoading(true);
      setReservations(await listReservations({ ...(status ? { status } : {}), ...(paymentStatus ? { paymentStatus } : {}), ...(filterDate ? { date: filterDate } : {}) }));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status, paymentStatus, filterDate]);

  const columns = useMemo<ColumnDef<Reservation>[]>(
    () => [
      { header: "Client", cell: ({ row }) => clientName(row.original) },
      { header: "Voiture", cell: ({ row }) => carName(row.original) },
      { header: "Date debut", cell: ({ row }) => date(row.original.startDate) },
      { header: "Date fin", cell: ({ row }) => date(row.original.endDate) },
      { header: "Total", cell: ({ row }) => money(row.original.totalAmount) },
      { header: "Avance", cell: ({ row }) => money(row.original.advanceAmount) },
      { header: "Reste", cell: ({ row }) => money(row.original.remainingAmount) },
      { header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Paiement", cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} /> },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex min-w-40 flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(`/reservations/${row.original.id}`)}><Eye className="mr-2 h-4 w-4" /> Voir</Button>
            {canDelete ? <Button type="button" variant="outline" onClick={async () => { await deleteReservation(row.original.id); toast.success("Reservation annulee"); await load(); }}><Trash2 className="mr-2 h-4 w-4" /> Annuler</Button> : null}
          </div>
        )
      }
    ],
    [canDelete, navigate]
  );

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Reservations"
        title="Reservations"
        description="Planning client, voiture, dates et paiements."
        actions={<div className="flex gap-2"><Button asChild variant="outline"><Link to="/reservations/calendar"><CalendarDays className="mr-2 h-4 w-4" /> Calendrier</Link></Button>{canCreate ? <Button asChild><Link to="/reservations/new"><Plus className="mr-2 h-4 w-4" /> Nouvelle reservation</Link></Button> : null}</div>}
      />
      <AppSection
        title="Liste"
        description={isLoading ? "Chargement..." : `${reservations.length} reservation(s).`}
        actions={
          <div className="flex flex-wrap gap-2">
            <input className="h-9 rounded-md border bg-background px-3 text-sm" type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Tous statuts</option><option value="CONFIRMED">Confirmees</option><option value="IN_PROGRESS">En cours</option><option value="COMPLETED">Terminees</option><option value="CANCELLED">Annulees</option>
            </select>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
              <option value="">Tous paiements</option><option value="UNPAID">Non paye</option><option value="PARTIAL">Partiel</option><option value="PAID">Paye</option><option value="REFUNDED">Rembourse</option>
            </select>
          </div>
        }
      >
        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={reservations} getRowId={(row) => row.id} searchPlaceholder="Rechercher client, voiture, immatriculation..." />}
        {!isLoading && reservations.length === 0 ? <EmptyState title="Aucune reservation" description="Les reservations creees apparaitront ici." /> : null}
      </AppSection>
    </PageContainer>
  );
}
