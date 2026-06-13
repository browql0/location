import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { downloadContractPdf, getContract, type Contract } from "@/features/contracts/contracts-api";
import { getApiErrorMessage } from "@/lib/api-error";

const date = (value: string) => new Date(value).toLocaleDateString("fr-FR");
const money = (value: string | null) => `${Number(value ?? 0).toLocaleString("fr-FR")} MAD`;

export function ContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setIsLoading(true);
        setContract(await getContract(id));
      } catch (error) {
        toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [id]);

  if (isLoading) return <PageContainer><PageSkeleton /></PageContainer>;
  if (!contract) return <PageContainer><EmptyState title="Contrat introuvable" description="Ce contrat n'est pas accessible." /></PageContainer>;

  const client = contract.reservation.client;
  const car = contract.reservation.car;

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Contrat"
        title={contract.contractNumber}
        description={`Genere le ${date(contract.generatedAt)} pour ${client.firstName} ${client.lastName}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={contract.pdfPath ? "ACTIVE" : "PENDING"} />
            <Button type="button" disabled={!contract.pdfPath} onClick={() => downloadContractPdf(contract.id, contract.contractNumber)}><Download className="mr-2 h-4 w-4" /> Télécharger PDF</Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AppSection className="rounded-lg border bg-card p-5" title="Client">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Nom complet</dt><dd className="font-medium">{client.firstName} {client.lastName}</dd></div>
            <div><dt className="text-muted-foreground">CIN</dt><dd>{client.cinOrPassport ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Telephone</dt><dd>{client.phone ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd>{client.email ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Permis</dt><dd>{client.drivingLicense ?? "-"}</dd></div>
          </dl>
        </AppSection>
        <AppSection className="rounded-lg border bg-card p-5" title="Vehicule">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Vehicule</dt><dd className="font-medium">{car.brand} {car.model} {car.year}</dd></div>
            <div><dt className="text-muted-foreground">Immatriculation</dt><dd>{car.registrationNumber}</dd></div>
            <div><dt className="text-muted-foreground">Couleur</dt><dd>{car.color ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Transmission</dt><dd>{car.transmission}</dd></div>
            <div><dt className="text-muted-foreground">Carburant</dt><dd>{car.fuelType}</dd></div>
          </dl>
        </AppSection>
      </div>

      <AppSection className="rounded-lg border bg-card p-5" title="Location et paiement">
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          <div><dt className="text-muted-foreground">Periode</dt><dd className="font-medium">{date(contract.reservation.startDate)} au {date(contract.reservation.endDate)}</dd></div>
          <div><dt className="text-muted-foreground">Jours</dt><dd>{contract.reservation.totalDays}</dd></div>
          <div><dt className="text-muted-foreground">Prix/jour</dt><dd>{money(contract.reservation.dailyPrice)}</dd></div>
          <div><dt className="text-muted-foreground">Montant location</dt><dd>{money(contract.reservation.totalAmount)}</dd></div>
          <div><dt className="text-muted-foreground">Avance</dt><dd>{money(contract.reservation.advanceAmount)}</dd></div>
          <div><dt className="text-muted-foreground">Reste</dt><dd>{money(contract.reservation.remainingAmount)}</dd></div>
          <div><dt className="text-muted-foreground">Caution</dt><dd>{money(contract.reservation.depositAmount)}</dd></div>
          <div><dt className="text-muted-foreground">Paiement</dt><dd><StatusBadge status={contract.reservation.paymentStatus} /></dd></div>
          <div><dt className="text-muted-foreground">Reservation</dt><dd><Button asChild variant="outline"><Link to={`/reservations/${contract.reservationId}`}><FileText className="mr-2 h-4 w-4" /> Voir</Link></Button></dd></div>
        </dl>
      </AppSection>
    </PageContainer>
  );
}
