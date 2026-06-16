import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Ban, CheckCircle2, Download, Mail, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { cancelInvoice, downloadInvoicePdf, getInvoice, markInvoicePaid, sendInvoiceToAgency, sendInvoiceToClient, type Invoice } from "@/features/invoices/invoices-api";
import { getApiErrorMessage } from "@/lib/api-error";

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("fr-FR") : "-";
const money = (value: string | null, currency: string) => `${Number(value ?? 0).toLocaleString("fr-FR")} ${currency}`;

export function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    if (!id) return;
    try {
      setIsLoading(true);
      setInvoice(await getInvoice(id));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function run(action: "paid" | "cancel" | "send") {
    if (!invoice) return;
    try {
      if (action === "paid") await markInvoicePaid(invoice.id);
      if (action === "cancel") await cancelInvoice(invoice.id);
      if (action === "send") {
        if (invoice.type === "SAAS_INVOICE") await sendInvoiceToAgency(invoice.id);
        else await sendInvoiceToClient(invoice.id);
      }
      toast.success("Facture mise a jour");
      await load();
    } catch (error) {
      toast.error("Action impossible", { description: getApiErrorMessage(error) });
    }
  }

  if (isLoading) return <PageContainer><PageSkeleton /></PageContainer>;
  if (!invoice) return <PageContainer><EmptyState title="Facture introuvable" description="Cette facture n'est pas accessible." /></PageContainer>;

  const isRental = invoice.type === "RENTAL_INVOICE";
  const client = invoice.reservation?.client;
  const agency = invoice.subscription?.agency ?? invoice.agency;

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Facture"
        title={invoice.invoiceNumber}
        description={`${isRental ? "Location" : "Abonnement Rentora"} emise le ${date(invoice.issuedAt)}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={invoice.status} />
            <Button type="button" disabled={!invoice.pdfStorageKey} onClick={() => downloadInvoicePdf(invoice.id, invoice.invoiceNumber)}><Download className="mr-2 h-4 w-4" /> Telecharger PDF</Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AppSection className="rounded-lg border bg-card p-5" title={isRental ? "Client" : "Agence"}>
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Nom</dt><dd className="font-medium">{isRental ? `${client?.firstName ?? ""} ${client?.lastName ?? ""}` : agency?.name ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd>{isRental ? client?.email ?? "-" : agency?.email ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Telephone</dt><dd>{isRental ? client?.phone ?? "-" : agency?.phone ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Identifiant</dt><dd>{isRental ? client?.cinOrPassport ?? "-" : agency?.id ?? "-"}</dd></div>
          </dl>
        </AppSection>
        <AppSection className="rounded-lg border bg-card p-5" title={isRental ? "Location" : "Abonnement"}>
          <dl className="grid gap-3 text-sm">
            {isRental ? (
              <>
                <div><dt className="text-muted-foreground">Reservation</dt><dd>{invoice.reservationId ? <Link className="font-medium underline" to={`/reservations/${invoice.reservationId}`}>{invoice.reservationId}</Link> : "-"}</dd></div>
                <div><dt className="text-muted-foreground">Vehicule</dt><dd>{invoice.reservation ? `${invoice.reservation.car.brand} ${invoice.reservation.car.model} - ${invoice.reservation.car.registrationNumber}` : "-"}</dd></div>
                <div><dt className="text-muted-foreground">Periode</dt><dd>{date(invoice.reservation?.startDate ?? null)} au {date(invoice.reservation?.endDate ?? null)}</dd></div>
              </>
            ) : (
              <>
                <div><dt className="text-muted-foreground">Plan</dt><dd className="font-medium">{invoice.subscription?.plan.name ?? "-"}</dd></div>
                <div><dt className="text-muted-foreground">Periode</dt><dd>{date(invoice.subscription?.startsAt ?? null)} au {date(invoice.subscription?.endsAt ?? null)}</dd></div>
                <div><dt className="text-muted-foreground">Echeance</dt><dd>{date(invoice.dueDate)}</dd></div>
              </>
            )}
          </dl>
        </AppSection>
      </div>

      <AppSection className="rounded-lg border bg-card p-5" title="Montants">
        <dl className="grid gap-3 text-sm md:grid-cols-4">
          <div><dt className="text-muted-foreground">Total</dt><dd className="font-medium">{money(invoice.totalAmount, invoice.currency)}</dd></div>
          <div><dt className="text-muted-foreground">Paye</dt><dd>{money(invoice.paidAmount, invoice.currency)}</dd></div>
          <div><dt className="text-muted-foreground">Reste</dt><dd>{money(invoice.remainingAmount, invoice.currency)}</dd></div>
          <div><dt className="text-muted-foreground">Statut</dt><dd><StatusBadge status={invoice.status} /></dd></div>
        </dl>
      </AppSection>

      <AppSection className="rounded-lg border bg-card p-5" title="Actions">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => run("send")} disabled={invoice.status === "CANCELLED"}><Mail className="mr-2 h-4 w-4" /> {isRental ? "Envoyer au client" : "Envoyer a l'agence"}</Button>
          <Button type="button" variant="outline" onClick={() => run("paid")} disabled={invoice.status === "PAID" || invoice.status === "CANCELLED"}><CheckCircle2 className="mr-2 h-4 w-4" /> Marquer payee</Button>
          <Button type="button" variant="outline" onClick={() => run("cancel")} disabled={invoice.status === "CANCELLED"}><Ban className="mr-2 h-4 w-4" /> Annuler</Button>
          <Button asChild variant="outline"><Link to="/invoices"><ReceiptText className="mr-2 h-4 w-4" /> Liste</Link></Button>
        </div>
      </AppSection>
    </PageContainer>
  );
}
