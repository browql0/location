import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { TableSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { listVehicleAnomalies, resolveVehicleAnomaly, type VehicleAnomaly } from "@/features/maintenance/maintenance-api";
import { getApiErrorMessage } from "@/lib/api-error";

export function VehicleAlertsPage() {
  const [rows, setRows] = useState<VehicleAnomaly[]>([]);
  const [severity, setSeverity] = useState("");
  const [resolved, setResolved] = useState("false");
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    try {
      setIsLoading(true);
      setRows(await listVehicleAnomalies({ ...(severity ? { severity } : {}), ...(resolved ? { resolved } : {}) }));
    } catch (error) {
      toast.error("Chargement alertes impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, [severity, resolved]);

  const columns = useMemo<ColumnDef<VehicleAnomaly>[]>(
    () => [
      { header: "Criticite", cell: ({ row }) => <StatusBadge status={row.original.severity} /> },
      { header: "Type", cell: ({ row }) => row.original.type },
      { header: "Titre", cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
      { header: "Vehicule", cell: ({ row }) => `${row.original.car.brand} ${row.original.car.model} - ${row.original.car.registrationNumber}` },
      { header: "Etat", cell: ({ row }) => row.original.resolved ? "Resolue" : "Ouverte" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => row.original.resolved ? null : (
          <Button type="button" variant="outline" onClick={async () => { await resolveVehicleAnomaly(row.original.id); toast.success("Anomalie resolue"); await load(); }}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Resoudre
          </Button>
        )
      }
    ],
    []
  );

  const counts = {
    CRITICAL: rows.filter((row) => row.severity === "CRITICAL").length,
    HIGH: rows.filter((row) => row.severity === "HIGH").length,
    MEDIUM: rows.filter((row) => row.severity === "MEDIUM").length,
    LOW: rows.filter((row) => row.severity === "LOW").length
  };

  return (
    <PageContainer>
      <AppPageHeader eyebrow="Alertes" title="Centre alertes vehicules" description="Anomalies kilometriques, documents expires et entretiens en retard." />
      <div className="grid gap-3 md:grid-cols-4">
        {Object.entries(counts).map(([key, value]) => <AppSection key={key} className="rounded-lg border bg-card p-4" title={key}><p className="text-2xl font-bold">{value}</p></AppSection>)}
      </div>
      <AppSection
        title="Anomalies"
        actions={
          <div className="flex flex-wrap gap-2">
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option value="">Toutes severites</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={resolved} onChange={(event) => setResolved(event.target.value)}>
              <option value="false">Non resolues</option>
              <option value="true">Resolues</option>
              <option value="">Toutes</option>
            </select>
          </div>
        }
      >
        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={rows} getRowId={(row) => row.id} searchPlaceholder="Rechercher alerte, vehicule, type..." />}
        {!isLoading && rows.length === 0 ? <EmptyState icon={AlertTriangle} title="Aucune alerte" description="Les anomalies detectees automatiquement apparaitront ici." /> : null}
      </AppSection>
    </PageContainer>
  );
}
