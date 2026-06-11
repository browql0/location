import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, Image, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { useAuth } from "@/features/auth/auth-provider";
import {
  addCarDocument,
  addCarPhoto,
  deleteCarDocument,
  deleteCarPhoto,
  getCar,
  setCarStatus,
  type Car,
  type DocumentType
} from "@/features/cars/cars-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("fr-FR")} MAD`;
}

export function CarDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState("https://placehold.co/800x500?text=Voiture");
  const [documentForm, setDocumentForm] = useState<{ type: DocumentType; fileName: string; fileUrl: string }>({
    type: "REGISTRATION",
    fileName: "",
    fileUrl: ""
  });
  const canUpdate = hasPermission(user, "cars:update");

  async function load() {
    if (!id) return;
    try {
      setIsLoading(true);
      setCar(await getCar(id));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    );
  }

  if (!car) {
    return (
      <PageContainer>
        <EmptyState title="Vehicule introuvable" description="Ce vehicule n'existe pas ou n'est pas accessible." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Fiche vehicule"
        title={`${car.brand} ${car.model}`}
        description={`${car.registrationNumber} - ${car.year}`}
        actions={<StatusBadge status={car.status} />}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AppSection className="rounded-lg border bg-card p-5" title="Informations generales">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Agence</dt><dd className="font-medium">{car.agency?.name ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">VIN</dt><dd className="font-medium">{car.vin ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Couleur</dt><dd className="font-medium">{car.color ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Carburant</dt><dd className="font-medium">{car.fuelType}</dd></div>
            <div><dt className="text-muted-foreground">Transmission</dt><dd className="font-medium">{car.transmission}</dd></div>
            <div><dt className="text-muted-foreground">Places</dt><dd className="font-medium">{car.seats}</dd></div>
            <div><dt className="text-muted-foreground">Assurance</dt><dd className="font-medium">{formatDate(car.insuranceExpiryDate)}</dd></div>
            <div><dt className="text-muted-foreground">Visite technique</dt><dd className="font-medium">{formatDate(car.technicalVisitExpiryDate)}</dd></div>
          </dl>
          {car.notes ? <p className="mt-5 rounded-md bg-muted p-3 text-sm text-muted-foreground">{car.notes}</p> : null}
        </AppSection>

        <AppSection className="rounded-lg border bg-card p-5" title="Prix et kilometrage">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Prix/jour</span><strong>{formatMoney(car.dailyPrice)}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Prix/semaine</span><strong>{formatMoney(car.weeklyPrice)}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Prix/mois</span><strong>{formatMoney(car.monthlyPrice)}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Kilometrage</span><strong>{car.mileage.toLocaleString("fr-FR")} km</strong></div>
          </div>
          {canUpdate ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={async () => { await setCarStatus(car.id, "AVAILABLE"); await load(); }}>Disponible</Button>
              <Button type="button" variant="outline" onClick={async () => { await setCarStatus(car.id, "MAINTENANCE"); await load(); }}><Wrench className="mr-2 h-4 w-4" /> Maintenance</Button>
              <Button type="button" variant="outline" onClick={async () => { await setCarStatus(car.id, "INACTIVE"); await load(); }}>Inactive</Button>
            </div>
          ) : null}
        </AppSection>
      </div>

      <AppSection className="rounded-lg border bg-card p-5" title="Photos">
        {canUpdate ? (
          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await addCarPhoto(car.id, { url: photoUrl, isPrimary: car.photos.length === 0 });
                setPhotoUrl("https://placehold.co/800x500?text=Voiture");
                await load();
              } catch (error) {
                toast.error("Ajout photo impossible", { description: getApiErrorMessage(error) });
              }
            }}
          >
            <Input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} />
            <Button type="submit"><Image className="mr-2 h-4 w-4" /> Ajouter</Button>
          </form>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {car.photos.map((photo) => (
            <div className="rounded-lg border p-2" key={photo.id}>
              <img alt="" className="aspect-video w-full rounded-md object-cover" src={photo.url} />
              {canUpdate ? <Button className="mt-2 w-full" type="button" variant="outline" onClick={async () => { await deleteCarPhoto(photo.id); await load(); }}>Supprimer</Button> : null}
            </div>
          ))}
        </div>
        {car.photos.length === 0 ? <EmptyState title="Aucune photo" description="Les URLs de photos seront remplacees plus tard par l'upload R2/S3." /> : null}
      </AppSection>

      <AppSection className="rounded-lg border bg-card p-5" title="Documents">
        {canUpdate ? (
          <form
            className="mb-4 grid gap-2 md:grid-cols-[180px_1fr_1fr_auto]"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await addCarDocument(car.id, documentForm);
                setDocumentForm({ type: "REGISTRATION", fileName: "", fileUrl: "" });
                await load();
              } catch (error) {
                toast.error("Ajout document impossible", { description: getApiErrorMessage(error) });
              }
            }}
          >
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={documentForm.type} onChange={(event) => setDocumentForm({ ...documentForm, type: event.target.value as DocumentType })}>
              <option value="REGISTRATION">Carte grise</option>
              <option value="INSURANCE">Assurance</option>
              <option value="TECHNICAL_VISIT">Visite technique</option>
              <option value="OTHER">Autre</option>
            </select>
            <Input required placeholder="Nom fichier" value={documentForm.fileName} onChange={(event) => setDocumentForm({ ...documentForm, fileName: event.target.value })} />
            <Input required placeholder="URL fichier" value={documentForm.fileUrl} onChange={(event) => setDocumentForm({ ...documentForm, fileUrl: event.target.value })} />
            <Button type="submit"><FileText className="mr-2 h-4 w-4" /> Ajouter</Button>
          </form>
        ) : null}
        <div className="divide-y rounded-md border">
          {car.documents.map((document) => (
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
              <div>
                <p className="font-medium">{document.fileName}</p>
                <p className="text-sm text-muted-foreground">{document.type} - {formatDate(document.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild type="button" variant="outline"><a href={document.fileUrl} rel="noreferrer" target="_blank">Ouvrir</a></Button>
                {canUpdate ? <Button type="button" variant="outline" onClick={async () => { await deleteCarDocument(document.id); await load(); }}>Supprimer</Button> : null}
              </div>
            </div>
          ))}
        </div>
        {car.documents.length === 0 ? <EmptyState title="Aucun document" description="Les documents vehicule seront stockes plus tard via R2/S3." /> : null}
      </AppSection>

      <AppSection className="rounded-lg border bg-card p-5" title="Historique">
        <EmptyState title="Historique futur" description="Les evenements de reservation, maintenance et kilometrage seront affiches ici dans les prochaines phases." />
      </AppSection>
    </PageContainer>
  );
}
