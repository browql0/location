import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { listCars, type Car } from "@/features/cars/cars-api";
import { createMaintenance, getMaintenance, updateMaintenance, type MaintenancePayload, type MaintenanceType } from "@/features/maintenance/maintenance-api";
import { getApiErrorMessage } from "@/lib/api-error";

const types: MaintenanceType[] = ["OIL_CHANGE", "TIRES", "BRAKES", "BATTERY", "INSURANCE", "TECHNICAL_INSPECTION", "AIR_CONDITIONING", "ENGINE", "TRANSMISSION", "BODYWORK", "CLEANING", "OTHER"];

const initialForm: MaintenancePayload = {
  carId: "",
  type: "OIL_CHANGE",
  title: "",
  scheduledDate: "",
  description: "",
  mileageAtService: null,
  cost: null,
  vendor: "",
  notes: ""
};

function asNumberOrNull(value: string) {
  return value === "" ? null : Number(value);
}

export function MaintenanceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const carIdParam = searchParams.get("carId");
  const [form, setForm] = useState<MaintenancePayload>({ ...initialForm });
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing || !carIdParam) return;
    setForm((current) => ({ ...current, carId: carIdParam }));
  }, [carIdParam, isEditing]);

  useEffect(() => {
    async function loadOptions() {
      try {
        setCars(await listCars());
      } catch (error) {
        toast.error("Chargement voitures impossible", { description: getApiErrorMessage(error) });
      }
    }
    void loadOptions();
  }, []);

  useEffect(() => {
    if (!id) return;
    const maintenanceId = id;
    async function loadRecord() {
      try {
        setIsLoading(true);
        const record = await getMaintenance(maintenanceId);
        setForm({
          carId: record.carId,
          type: record.type,
          status: record.status,
          title: record.title,
          description: record.description ?? "",
          scheduledDate: record.scheduledDate.slice(0, 10),
          completedDate: record.completedDate?.slice(0, 10) ?? null,
          mileageAtService: record.mileageAtService,
          cost: record.cost ? Number(record.cost) : null,
          vendor: record.vendor ?? "",
          notes: record.notes ?? ""
        });
      } catch (error) {
        toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }
    void loadRecord();
  }, [id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...form, description: form.description || null, vendor: form.vendor || null, notes: form.notes || null };
      const record = isEditing && id ? await updateMaintenance(id, payload) : await createMaintenance(payload);
      toast.success(isEditing ? "Maintenance modifiee" : "Maintenance creee");
      navigate(`/maintenance/${record.id}`);
    } catch (error) {
      toast.error("Enregistrement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <AppPageHeader eyebrow="Maintenance" title={isEditing ? "Modifier maintenance" : "Nouvelle maintenance"} description="Planifiez les operations preventives et correctives." />
      {isLoading ? <PageSkeleton /> : (
        <AppSection className="rounded-lg border bg-card p-5" title="Operation">
          <form className="grid gap-5" onSubmit={submit}>
            <div className="grid gap-3 md:grid-cols-2">
              <select required className="h-10 rounded-md border bg-background px-3 text-sm" value={form.carId} onChange={(event) => setForm({ ...form, carId: event.target.value })}>
                <option value="">Selectionner vehicule</option>
                {cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model} - {car.registrationNumber}</option>)}
              </select>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as MaintenanceType })}>
                {types.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <Input required placeholder="Titre" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <Input required type="date" value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} />
              <Input min={0} type="number" placeholder="Kilometrage service" value={form.mileageAtService ?? ""} onChange={(event) => setForm({ ...form, mileageAtService: asNumberOrNull(event.target.value) })} />
              <Input min={0} step="0.01" type="number" placeholder="Cout" value={form.cost ?? ""} onChange={(event) => setForm({ ...form, cost: asNumberOrNull(event.target.value) })} />
              <Input placeholder="Fournisseur / atelier" value={form.vendor ?? ""} onChange={(event) => setForm({ ...form, vendor: event.target.value })} />
            </div>
            <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Description" value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Notes" value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <div className="flex gap-2">
              <Button disabled={isSubmitting} type="submit">Enregistrer</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/maintenance")}>Annuler</Button>
            </div>
          </form>
        </AppSection>
      )}
    </PageContainer>
  );
}
