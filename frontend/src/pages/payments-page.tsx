import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { Button } from "@/components/ui/button";
import { listPayments, type Payment } from "@/features/payments/payments-api";
import { getApiErrorMessage } from "@/lib/api-error";

const money = (value: string | null) => `${Number(value ?? 0).toLocaleString("fr-FR")} MAD`;
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("fr-FR") : "-";

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setPayments(await listPayments());
      } catch (error) {
        toast.error("Chargement des paiements impossible", { description: getApiErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  if (isLoading) return <PageContainer><PageSkeleton /></PageContainer>;

  return (
    <PageContainer>
      <AppPageHeader eyebrow="Finance" title="Paiements" description="Encaissements clients lies aux reservations." />
      <AppSection className="rounded-lg border bg-card p-5" title="Liste des paiements">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Date</th><th>Reservation</th><th>Client</th><th>Montant</th><th>Methode</th><th>Statut</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr className="border-t" key={payment.id}>
                  <td className="py-3">{date(payment.paidAt ?? payment.createdAt)}</td>
                  <td>{payment.reservation.car.registrationNumber}</td>
                  <td>{payment.reservation.client.firstName} {payment.reservation.client.lastName}</td>
                  <td className="font-medium">{money(payment.amount)}</td>
                  <td>{payment.method}</td>
                  <td><StatusBadge status={payment.status} /></td>
                  <td className="text-right"><Button asChild className="h-8 px-3 text-xs" variant="outline"><Link to={`/reservations/${payment.reservationId}`}>Ouvrir</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 ? <EmptyState title="Aucun paiement" description="Les paiements de reservation apparaitront ici." /> : null}
        </div>
      </AppSection>
    </PageContainer>
  );
}
