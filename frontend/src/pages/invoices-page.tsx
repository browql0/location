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
import { downloadInvoicePdf, listInvoices, type Invoice } from "@/features/invoices/invoices-api";
import { getApiErrorMessage } from "@/lib/api-error";

const date = (value: string) => new Date(value).toLocaleDateString("fr-FR");
const money = (value: string, currency: string) => `${Number(value ?? 0).toLocaleString("fr-FR")} ${currency}`;

function recipient(invoice: Invoice) {
  if (invoice.type === "SAAS_INVOICE") return invoice.subscription?.agency.name ?? invoice.agency?.name ?? "-";
  const client = invoice.reservation?.client;
  return client ? `${client.firstName} ${client.lastName}` : "-";
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    try {
      setIsLoading(true);
      setInvoices(await listInvoices());
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { header: "Numero", cell: ({ row }) => <span className="font-medium">{row.original.invoiceNumber}</span> },
      { header: "Type", cell: ({ row }) => <StatusBadge status={row.original.type} /> },
      { header: "Agence / Client", cell: ({ row }) => recipient(row.original) },
      { header: "Montant", cell: ({ row }) => money(row.original.totalAmount, row.original.currency) },
      { header: "Paye", cell: ({ row }) => money(row.original.paidAmount, row.original.currency) },
      { header: "Reste", cell: ({ row }) => money(row.original.remainingAmount, row.original.currency) },
      { header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Date", cell: ({ row }) => date(row.original.issuedAt) },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex min-w-48 flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(`/invoices/${row.original.id}`)}><Eye className="mr-2 h-4 w-4" /> Voir</Button>
            <Button type="button" variant="outline" disabled={!row.original.pdfStorageKey} onClick={() => downloadInvoicePdf(row.original.id, row.original.invoiceNumber)}>
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
        eyebrow="Factures"
        title="Factures PDF"
        description="Factures location et SaaS avec PDF securise."
        actions={<Button type="button" variant="outline" onClick={load}><FileText className="mr-2 h-4 w-4" /> Actualiser</Button>}
      />
      <AppSection title="Liste" description={isLoading ? "Chargement..." : `${invoices.length} facture(s).`}>
        {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={invoices} getRowId={(row) => row.id} searchPlaceholder="Rechercher numero, agence ou client..." />}
        {!isLoading && invoices.length === 0 ? <EmptyState title="Aucune facture" description="Les factures generees depuis les reservations ou abonnements apparaitront ici." /> : null}
      </AppSection>
    </PageContainer>
  );
}
