import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { listAgencies, setAgencyEnabled, type Agency } from "@/features/saas/saas-api";

export function SuperAdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      setAgencies(await listAgencies(status ? { status } : undefined));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  const columns = useMemo<ColumnDef<Agency>[]>(
    () => [
      { accessorKey: "name", header: "Agence", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Plan actuel", cell: ({ row }) => row.original.subscriptions[0]?.plan.name ?? "-" },
      { header: "Utilisateurs", cell: ({ row }) => row.original._count.users },
      { header: "Vehicules", cell: ({ row }) => row.original._count.cars },
      { header: "Clients", cell: ({ row }) => row.original._count.clients },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await setAgencyEnabled(row.original.id, row.original.status !== "ACTIVE");
              toast.success(row.original.status === "ACTIVE" ? "Agence suspendue" : "Agence reactivee");
              await load();
            }}
          >
            {row.original.status === "ACTIVE" ? "Suspendre" : "Reactiver"}
          </Button>
        )
      }
    ],
    [status]
  );

  return (
    <PageContainer>
      <AppPageHeader title="Agences" description="Liste reelle des agences, leur plan courant, statut et volumes operationnels." eyebrow="Super Admin" />
      <AppSection
        title="Toutes les agences"
        description={isLoading ? "Chargement..." : `${agencies.length} agence(s) trouvee(s).`}
        actions={
          <select className="h-9 rounded-md border bg-background px-3 text-sm" aria-label="Filtrer par statut" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tous statuts</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        }
      >
        <DataTable columns={columns} data={agencies} getRowId={(row) => row.id} searchPlaceholder="Rechercher une agence..." />
      </AppSection>
    </PageContainer>
  );
}
