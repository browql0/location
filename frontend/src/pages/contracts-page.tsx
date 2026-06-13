import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { Download, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { TableSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { downloadContractPdf, listContracts, type Contract } from "@/features/contracts/contracts-api";
import { getApiErrorMessage } from "@/lib/api-error";

const date = (value: string) => new Date(value).toLocaleDateString("fr-FR");
const money = (value: string | null) => `${Number(value ?? 0).toLocaleString("fr-FR")} MAD`;
const clientName = (contract: Contract) => `${contract.reservation.client.firstName} ${contract.reservation.client.lastName}`;
const vehicleName = (contract: Contract) => `${contract.reservation.car.brand} ${contract.reservation.car.model} (${contract.reservation.car.registrationNumber})`;

export function ContractsPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    try {
      setIsLoading(true);
      setContracts(await listContracts());
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      { header: "Numero", cell: ({ row }) => <span className="font-medium">{row.original.contractNumber}</span> },
      { header: "Client", cell: ({ row }) => clientName(row.original) },
      { header: "Vehicule", cell: ({ row }) => vehicleName(row.original) },
      { header: "Genere le", cell: ({ row }) => date(row.original.generatedAt) },
      { header: "Montant", cell: ({ row }) => money(row.original.reservation.totalAmount) },
      { header: "Paiement", cell: ({ row }) => <StatusBadge status={row.original.reservation.paymentStatus} /> },
      { header: "PDF", cell: ({ row }) => <StatusBadge status={row.original.pdfPath ? "ACTIVE" : "PENDING"} /> },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex min-w-48 flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(`/contracts/${row.original.id}`)}><Eye className="mr-2 h-4 w-4" /> Voir</Button>
            <Button type="button" variant="outline" disabled={!row.original.pdfPath} onClick={() => downloadContractPdf(row.original.id, row.original.contractNumber)}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        )
      }
    ],
    [navigate]
  );

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Contrats"
        title="Contrats de location"
        description="Documents PDF professionnels generes depuis les reservations."
        actions={<Button type="button" variant="outline" onClick={load}><FileText className="mr-2 h-4 w-4" /> Actualiser</Button>}
      />
      <AppSection title="Liste" description={isLoading ? "Chargement..." : `${contracts.length} contrat(s).`}>
        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={contracts} getRowId={(row) => row.id} searchPlaceholder="Rechercher numero, client ou immatriculation..." />}
        {!isLoading && contracts.length === 0 ? <EmptyState title="Aucun contrat" description="Les contrats generes depuis les reservations apparaitront ici." /> : null}
      </AppSection>
    </PageContainer>
  );
}
