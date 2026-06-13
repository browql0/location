import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, Image, Star, Trash2, Upload, Wrench } from "lucide-react";
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
  deleteCarDocument,
  deleteCarPhoto,
  getCarPhotoObjectUrl,
  getCar,
  listCarPhotos,
  setCarStatus,
  setPrimaryCarPhoto,
  uploadCarPhoto,
  type Car,
  type CarPhoto,
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
  const [photos, setPhotos] = useState<CarPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
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
      const nextCar = await getCar(id);
      setCar(nextCar);
      setPhotos(nextCar.photos);
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    const ownedUrls: string[] = [];
    let cancelled = false;
    async function loadPhotoUrls() {
      const entries = await Promise.all(
        photos.map(async (photo) => {
          try {
            const url = await getCarPhotoObjectUrl(photo);
            if (photo.storageKey) ownedUrls.push(url);
            return [photo.id, url] as const;
          } catch (error) {
            console.error("Load car photo error:", axios.isAxiosError(error) ? error.response?.data || error : error);
            return [photo.id, "https://placehold.co/800x500?text=Voiture"] as const;
          }
        })
      );
      if (!cancelled) setPhotoUrls(Object.fromEntries(entries));
    }
    void loadPhotoUrls();
    return () => {
      cancelled = true;
      ownedUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  async function reloadPhotos(options: { silent?: boolean } = {}) {
    if (!id) return;
    try {
      setPhotos(await listCarPhotos(id));
    } catch (error) {
      console.error("Load car photos error:", axios.isAxiosError(error) ? error.response?.data || error : error);
      if (!options.silent) toast.error("Chargement photos impossible", { description: getApiErrorMessage(error) });
    }
  }

  function photoUploadError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const code = error.response?.data?.code;
      if (code === "CAR_PHOTO_UNSUPPORTED_FORMAT") return "Format non autorise";
      if (code === "FILE_TOO_LARGE" || code === "CLIENT_DOCUMENT_FILE_TOO_LARGE") return "Taille max 5 MB depassee";
    }
    return getApiErrorMessage(error);
  }

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
        {photos[0] ? (
          <img alt="" className="aspect-[16/7] w-full rounded-md object-cover ring-1 ring-border" src={photoUrls[photos[0].id] ?? "https://placehold.co/1200x520?text=Voiture"} />
        ) : null}
        {canUpdate ? (
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!photoFile) return;
              setIsUploadingPhoto(true);
              try {
                const uploaded = await uploadCarPhoto(car.id, photoFile);
                toast.success("Upload reussi");
                setPhotos((current) => [uploaded, ...current.filter((photo) => photo.id !== uploaded.id)]);
                setPhotoFile(null);
                if (photoInputRef.current) photoInputRef.current.value = "";
                void reloadPhotos({ silent: true });
              } catch (error) {
                console.error("Upload car photo error:", axios.isAxiosError(error) ? error.response?.data || error : error);
                toast.error(photoUploadError(error));
              } finally {
                setIsUploadingPhoto(false);
              }
            }}
          >
            <div className="grid gap-2">
              <input
                ref={photoInputRef}
                required
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="h-10 rounded-md border bg-background px-3 py-2 text-sm"
                type="file"
                onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
              />
              {photoPreview ? <img alt="" className="h-32 w-48 rounded-md object-cover ring-1 ring-border" src={photoPreview} /> : null}
            </div>
            <Button disabled={isUploadingPhoto} type="submit"><Upload className="mr-2 h-4 w-4" /> Ajouter photo</Button>
          </form>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {photos.map((photo) => (
            <div className="rounded-lg border p-2" key={photo.id}>
              <img alt="" className="aspect-video w-full rounded-md object-cover" src={photoUrls[photo.id] ?? "https://placehold.co/800x500?text=Voiture"} />
              <div className="mt-2 flex flex-col gap-2">
                {photo.isPrimary ? <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Principale</span> : null}
                {canUpdate ? (
                  <>
                    {!photo.isPrimary ? (
                      <Button type="button" variant="outline" onClick={async () => { await setPrimaryCarPhoto(photo.id); await reloadPhotos(); }}>
                        <Star className="mr-2 h-4 w-4" /> Definir principale
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={async () => { if (!window.confirm("Supprimer cette photo ?")) return; await deleteCarPhoto(photo.id); toast.success("Photo supprimee"); await reloadPhotos(); }}>
                      <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {photos.length === 0 ? <EmptyState icon={Image} title="Aucune photo" description="Les photos ajoutees apparaitront ici." /> : null}
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
