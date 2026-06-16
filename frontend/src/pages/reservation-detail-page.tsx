import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Ban, CheckCircle2, CreditCard, Download, Edit, FileText, Play, Upload, Wallet } from "lucide-react";
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
import {
  cancelPayment,
  capturePaypalPayment,
  confirmManualPayment,
  createPaypalOrder,
  createReservationPayment,
  downloadPaymentProof,
  listPayments,
  type Payment,
  type PaymentMethod,
  uploadPaymentProof
} from "@/features/payments/payments-api";
import { cancelReservation, completeReservation, getReservation, startReservation, type Reservation } from "@/features/reservations/reservations-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

const money = (value: string | null) => `${Number(value ?? 0).toLocaleString("fr-FR")} MAD`;
const date = (value: string) => new Date(value).toLocaleDateString("fr-FR");
const paymentMethods: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "PAYPAL", "CARD_MANUAL", "CHECK", "OTHER"];

export function ReservationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentForm, setPaymentForm] = useState<{ amount: string; method: PaymentMethod; paidAt: string; reference: string; notes: string }>({ amount: "", method: "CASH", paidAt: "", reference: "", notes: "" });
  const [isLoading, setIsLoading] = useState(true);
  const canUpdate = hasPermission(user, "reservations:update");
  const canCreateContract = hasPermission(user, "contracts:create");
  const canReadContract = hasPermission(user, "contracts:read");
  const canCreateInvoice = hasPermission(user, "invoices:create");
  const canReadInvoice = hasPermission(user, "invoices:read");
  const canReadPayments = hasPermission(user, "payments:read");
  const canCreatePayments = hasPermission(user, "payments:create");
  const canUpdatePayments = hasPermission(user, "payments:update");
  const canDeletePayments = hasPermission(user, "payments:delete");

  async function load() {
    if (!id) return;
    try {
      setIsLoading(true);
      const loadedReservation = await getReservation(id);
      setReservation(loadedReservation);
      setPaymentForm((current) => ({ ...current, amount: String(Number(loadedReservation.remainingAmount || 0)) }));
      setPayments(canReadPayments ? await listPayments({ reservationId: id }) : []);
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

  async function runCreatePayment() {
    if (!reservation) return;
    try {
      await createReservationPayment(reservation.id, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        paidAt: paymentForm.paidAt || null,
        reference: paymentForm.reference || null,
        notes: paymentForm.notes || null
      });
      toast.success("Paiement ajoute");
      await load();
    } catch (error) {
      toast.error("Paiement impossible", { description: getApiErrorMessage(error) });
    }
  }

  async function runPaymentAction(action: "confirm" | "cancel" | "paypal-order" | "paypal-capture", payment: Payment) {
    try {
      if (action === "confirm") await confirmManualPayment(payment.id);
      if (action === "cancel") await cancelPayment(payment.id);
      if (action === "paypal-order") {
        const order = await createPaypalOrder(payment.id);
        if (order.approvalUrl) window.open(order.approvalUrl, "_blank", "noopener,noreferrer");
      }
      if (action === "paypal-capture") await capturePaypalPayment(payment.id);
      toast.success("Paiement mis a jour");
      await load();
    } catch (error) {
      toast.error("Action paiement impossible", { description: getApiErrorMessage(error) });
    }
  }

  async function runProofUpload(payment: Payment) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/png,image/jpeg";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await uploadPaymentProof(payment.id, file);
        toast.success("Justificatif ajoute");
        await load();
      } catch (error) {
        toast.error("Upload impossible", { description: getApiErrorMessage(error) });
      }
    };
    input.click();
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

      {canReadPayments ? (
        <AppSection className="rounded-lg border bg-card p-5" title="Paiements">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md border bg-background p-3 text-sm"><div className="text-muted-foreground">Total reservation</div><strong>{money(reservation.totalAmount)}</strong></div>
            <div className="rounded-md border bg-background p-3 text-sm"><div className="text-muted-foreground">Total paye</div><strong>{money(String(Number(reservation.totalAmount) - Number(reservation.remainingAmount)))}</strong></div>
            <div className="rounded-md border bg-background p-3 text-sm"><div className="text-muted-foreground">Reste</div><strong>{money(reservation.remainingAmount)}</strong></div>
            <div className="rounded-md border bg-background p-3 text-sm"><div className="text-muted-foreground">Statut</div><StatusBadge status={reservation.paymentStatus} /></div>
          </div>

          {canCreatePayments ? (
            <div className="mt-4 grid gap-3 rounded-md border bg-background p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <input className="h-9 rounded-md border bg-background px-3 text-sm" min="0" step="0.01" type="number" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} />
              <select className="h-9 rounded-md border bg-background px-3 text-sm" value={paymentForm.method} onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value as PaymentMethod }))}>
                {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
              <input className="h-9 rounded-md border bg-background px-3 text-sm" type="date" value={paymentForm.paidAt} onChange={(event) => setPaymentForm((current) => ({ ...current, paidAt: event.target.value }))} />
              <input className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Reference" value={paymentForm.reference} onChange={(event) => setPaymentForm((current) => ({ ...current, reference: event.target.value }))} />
              <Button type="button" onClick={runCreatePayment}><Wallet className="mr-2 h-4 w-4" /> Ajouter</Button>
              {Number(paymentForm.amount) > Number(reservation.remainingAmount) ? <p className="text-xs text-amber-600 lg:col-span-5">Montant superieur au reste a payer.</p> : null}
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Date</th><th>Methode</th><th>Montant</th><th>Statut</th><th>Reference</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr className="border-t" key={payment.id}>
                    <td className="py-3">{payment.paidAt ? date(payment.paidAt) : date(payment.createdAt)}</td>
                    <td>{payment.method}</td>
                    <td className="font-medium">{money(payment.amount)}</td>
                    <td><StatusBadge status={payment.status} /></td>
                    <td>{payment.reference ?? "-"}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        {payment.status === "PENDING" && payment.method !== "PAYPAL" && canUpdatePayments ? <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => runPaymentAction("confirm", payment)}>Confirmer</Button> : null}
                        {payment.status === "PENDING" && payment.method === "PAYPAL" && canUpdatePayments ? <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => runPaymentAction("paypal-order", payment)}><CreditCard className="mr-1 h-3.5 w-3.5" /> PayPal</Button> : null}
                        {payment.status === "PENDING" && payment.method === "PAYPAL" && payment.paypalOrderId && canUpdatePayments ? <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => runPaymentAction("paypal-capture", payment)}>Capturer</Button> : null}
                        {payment.method === "BANK_TRANSFER" && canUpdatePayments ? <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => runProofUpload(payment)}><Upload className="mr-1 h-3.5 w-3.5" /> Preuve</Button> : null}
                        {payment.proofStorageKey ? <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => downloadPaymentProof(payment.id, payment.proofFileName ?? "proof")}>Preuve</Button> : null}
                        {payment.status !== "CANCELLED" && canDeletePayments ? <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => runPaymentAction("cancel", payment)}>Annuler</Button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 ? <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">Aucun paiement enregistre.</div> : null}
          </div>
        </AppSection>
      ) : null}

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
