import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Eye, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { TableSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { listMaintenance, maintenanceCalendar, type MaintenanceRecord } from "@/features/maintenance/maintenance-api";
import { getApiErrorMessage } from "@/lib/api-error";

const date = (value: string) => new Date(value).toLocaleDateString("fr-FR");
const money = (value: string | null) => `${Number(value ?? 0).toLocaleString("fr-FR")} MAD`;
const eventColor = (status: string) => status === "COMPLETED" ? "#168a56" : status === "IN_PROGRESS" ? "#2563eb" : status === "CANCELLED" ? "#b42318" : "#bf6f2f";

export function MaintenancePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string; start: string; end: string; backgroundColor: string; borderColor: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    try {
      setIsLoading(true);
      const [rows, calendarRows] = await Promise.all([listMaintenance(), maintenanceCalendar()]);
      setRecords(rows);
      setEvents(calendarRows.map((item) => ({ id: item.id, title: item.title, start: item.start, end: item.end, backgroundColor: eventColor(item.status), borderColor: eventColor(item.status) })));
    } catch (error) {
      toast.error("Chargement maintenance impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const columns = useMemo<ColumnDef<MaintenanceRecord>[]>(
    () => [
      { header: "Titre", cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
      { header: "Vehicule", cell: ({ row }) => `${row.original.car.brand} ${row.original.car.model} - ${row.original.car.registrationNumber}` },
      { header: "Type", cell: ({ row }) => row.original.type },
      { header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Planifie", cell: ({ row }) => date(row.original.scheduledDate) },
      { header: "Cout", cell: ({ row }) => money(row.original.cost) },
      { id: "actions", header: "Actions", cell: ({ row }) => <Button asChild variant="outline"><Link to={`/maintenance/${row.original.id}`}><Eye className="mr-2 h-4 w-4" /> Voir</Link></Button> }
    ],
    []
  );

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Maintenance"
        title="Maintenance et kilometrage"
        description="Planification, suivi atelier et calendrier des operations vehicules."
        actions={<Button asChild><Link to="/maintenance/new"><Plus className="mr-2 h-4 w-4" /> Nouvelle maintenance</Link></Button>}
      />
      <AppSection title="Calendrier" description="Orange: planifie, bleu: en cours, vert: termine.">
        <div className="rounded-lg border bg-card p-3">
          <FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" height="auto" events={events} eventClick={(info) => navigate(`/maintenance/${info.event.id}`)} />
        </div>
      </AppSection>
      <AppSection title="Historique" description={isLoading ? "Chargement..." : `${records.length} operation(s).`} actions={<Button variant="outline" onClick={load}><CalendarDays className="mr-2 h-4 w-4" /> Actualiser</Button>}>
        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={records} getRowId={(row) => row.id} searchPlaceholder="Rechercher titre, vehicule, fournisseur..." />}
        {!isLoading && records.length === 0 ? <EmptyState icon={Wrench} title="Aucune maintenance" description="Planifiez le premier entretien de la flotte." /> : null}
      </AppSection>
    </PageContainer>
  );
}
