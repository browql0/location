import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Ban, CheckCircle2, Download, Edit, FileText, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { useAuth } from "@/features/auth/auth-provider";
import { downloadContractPdf, generateContract } from "@/features/contracts/contracts-api";
import { downloadInvoicePdf, generateRentalInvoice, sendInvoiceToClient } from "@/features/invoices/invoices-api";
import { cancelReservation, completeReservation, getReservation, startReservation, type Reservation } from "@/features/reservations/reservations-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

const money = (value: string | null) => `${Number(value ?? 0).toLocaleString("fr-FR")} MAD`;
const date = (value: string) => new Date(value).toLocaleDateString("fr-FR");

export function ReservationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canUpdate = hasPermission(user, "reservations:update");
  const canCreateContract = hasPermission(user, "contracts:create");
  const canReadContract = hasPermission(user, "contracts:read");
  const canCreateInvoice = hasPermission(user, "invoices:create");
  const canReadInvoice = hasPermission(user, "invoices:read");

  async function load() {
    if (!id) return;
    try {
      setIsLoading(true);
      setReservation(await getReservation(id));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  if (isLoading) return <PageContainer><PageSkeleton /></PageContainer>;
  if (!reservation) return <PageContainer><EmptyState title="Reservation introuvable" description="Cette reservation n'est pas accessible." /></PageContainer>;

  async function runAction(action: "cancel" | "start" | "complete") {
    if (!reservation) return;
    try {
      if (action === "cancel") await cancelReservation(reservation.id);
      if (action === "start") {
        await startReservation(reservation.id, {
          pickupMileage: Number(window.prompt("Kilometrage depart", String(reservation.pickupMileage ?? "")) || 0),
          pickupFuelLevel: Number(window.prompt("Carburant depart 0-100", String(reservation.pickupFuelLevel ?? "")) || 0),
          pickupCondition: window.prompt("Etat depart", reservation.pickupCondition ?? "") || null
        });
      }
      if (action === "complete") {
        await completeReservation(reservation.id, {
          returnMileage: Number(window.prompt("Kilometrage retour", String(reservation.returnMileage ?? "")) || 0),
          returnFuelLevel: Number(window.prompt("Carburant retour 0-100", String(reservation.returnFuelLevel ?? "")) || 0),
          returnCondition: window.prompt("Etat retour", reservation.returnCondition ?? "") || null
        });
      }
      toast.success("Reservation mise a jour");
      await load();
    } catch (error) {
      toast.error("Action impossible", { description: getApiErrorMessage(error) });
    }
  }

  async function runGenerateContract() {
    if (!reservation) return;
    try {
      const contract = await generateContract(reservation.id);
      toast.success("Contrat genere", { description: contract.contractNumber });
      await load();
    } catch (error) {
      toast.error("Generation impossible", { description: getApiErrorMessage(error) });
    }
  }

  async function runGenerateInvoice() {
    if (!reservation) return;
    try {
      const invoice = await generateRentalInvoice(reservation.id);
      toast.success("Facture generee", { description: invoice.invoiceNumber });
      await load();
    } catch (error) {
      toast.error("Generation impossible", { description: getApiErrorMessage(error) });
    }
  }

  async function runSendInvoice(invoiceId: string) {
    try {
      await sendInvoiceToClient(invoiceId);
      toast.success("Envoi facture prepare");
      await load();
    } catch (error) {
      toast.error("Envoi impossible", { description: getApiErrorMessage(error) });
    }
  }

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Reservation"
        title={`${reservation.car.registrationNumber} - ${reservation.client.firstName} ${reservation.client.lastName}`}
        description={`${date(reservation.startDate)} au ${date(reservation.endDate)}`}
        actions={<div className="flex flex-wrap gap-2"><StatusBadge status={reservation.status} />{canUpdate ? <Button asChild variant="outline"><Link to={`/reservations/${reservation.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Modifier</Link></Button> : null}</div>}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AppSection className="rounded-lg border bg-card p-5" title="Client et voiture">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Client</dt><dd className="font-medium">{reservation.client.firstName} {reservation.client.lastName}</dd></div>
            <div><dt className="text-muted-foreground">Voiture</dt><dd className="font-medium">{reservation.car.brand} {reservation.car.model} - {reservation.car.registrationNumber}</dd></div>
            <div><dt className="text-muted-foreground">Statut paiement</dt><dd><StatusBadge status={reservation.paymentStatus} /></dd></div>
          </dl>
        </AppSection>
        <AppSection className="rounded-lg border bg-card p-5" title="Prix">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Jours</span><strong>{reservation.totalDays}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Prix/jour</span><strong>{money(reservation.dailyPrice)}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><strong>{money(reservation.totalAmount)}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avance</span><strong>{money(reservation.advanceAmount)}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Reste</span><strong>{money(reservation.remainingAmount)}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Caution</span><strong>{money(reservation.depositAmount)}</strong></div>
          </dl>
        </AppSection>
      </div>

      {reservation.notes ? <AppSection className="rounded-lg border bg-card p-5" title="Notes"><p className="text-sm text-muted-foreground">{reservation.notes}</p></AppSection> : null}

      <AppSection className="rounded-lg border bg-card p-5" title="Contrat">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{reservation.contract ? reservation.contract.contractNumber : "Aucun contrat genere"}</p>
            <p className="text-sm text-muted-foreground">{reservation.contract ? `Genere le ${date(reservation.contract.generatedAt)}` : "Generez le PDF professionnel depuis cette reservation."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {reservation.contract && canReadContract ? <Button asChild variant="outline"><Link to={`/contracts/${reservation.contract.id}`}><FileText className="mr-2 h-4 w-4" /> Voir contrat</Link></Button> : null}
            {reservation.contract?.pdfStorageKey ? <Button type="button" variant="outline" onClick={() => downloadContractPdf(reservation.contract!.id, reservation.contract!.contractNumber)}><Download className="mr-2 h-4 w-4" /> Télécharger PDF</Button> : null}
            {!reservation.contract && canCreateContract ? <Button type="button" onClick={runGenerateContract}><FileText className="mr-2 h-4 w-4" /> Générer contrat</Button> : null}
          </div>
        </div>
      </AppSection>

      <AppSection className="rounded-lg border bg-card p-5" title="Facture">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{reservation.invoices?.[0] ? reservation.invoices[0].invoiceNumber : "Aucune facture generee"}</p>
            <p className="text-sm text-muted-foreground">{reservation.invoices?.[0] ? `Emise le ${date(reservation.invoices[0].issuedAt)}` : "Generez la facture PDF depuis cette reservation."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {reservation.invoices?.[0] && canReadInvoice ? <Button asChild variant="outline"><Link to={`/invoices/${reservation.invoices[0].id}`}><FileText className="mr-2 h-4 w-4" /> Voir facture</Link></Button> : null}
            {reservation.invoices?.[0]?.pdfStorageKey ? <Button type="button" variant="outline" onClick={() => downloadInvoicePdf(reservation.invoices![0].id, reservation.invoices![0].invoiceNumber)}><Download className="mr-2 h-4 w-4" /> Télécharger PDF</Button> : null}
            {reservation.invoices?.[0] ? <Button type="button" variant="outline" onClick={() => runSendInvoice(reservation.invoices![0].id)}><FileText className="mr-2 h-4 w-4" /> Envoyer au client</Button> : null}
            {!reservation.invoices?.[0] && canCreateInvoice ? <Button type="button" onClick={runGenerateInvoice}><FileText className="mr-2 h-4 w-4" /> Générer facture</Button> : null}
          </div>
        </div>
      </AppSection>

      {canUpdate ? (
        <AppSection className="rounded-lg border bg-card p-5" title="Actions">
          <div className="flex flex-wrap gap-2">
            {reservation.status === "CONFIRMED" ? <Button type="button" onClick={() => runAction("start")}><Play className="mr-2 h-4 w-4" /> Demarrer</Button> : null}
            {reservation.status === "IN_PROGRESS" ? <Button type="button" onClick={() => runAction("complete")}><CheckCircle2 className="mr-2 h-4 w-4" /> Terminer</Button> : null}
            {reservation.status !== "CANCELLED" && reservation.status !== "COMPLETED" ? <Button type="button" variant="outline" onClick={() => runAction("cancel")}><Ban className="mr-2 h-4 w-4" /> Annuler</Button> : null}
            <Button type="button" variant="outline" onClick={() => navigate("/reservations")}>Retour</Button>
          </div>
        </AppSection>
      ) : null}
    </PageContainer>
  );
}
