import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { PageContainer } from "@/components/ui-custom/page-container";
import { useAuth } from "@/features/auth/auth-provider";
import { createCar, type CarPayload, type FuelType, type TransmissionType } from "@/features/cars/cars-api";
import { listAgencies, type Agency } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";

const initialForm: CarPayload = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  registrationNumber: "",
  vin: "",
  color: "",
  fuelType: "GASOLINE",
  transmission: "MANUAL",
  seats: 5,
  dailyPrice: 0,
  weeklyPrice: 0,
  monthlyPrice: 0,
  mileage: 0,
  insuranceExpiryDate: "",
  technicalVisitExpiryDate: "",
  notes: ""
};

function asNumber(value: string) {
  return Number.isNaN(Number(value)) ? 0 : Number(value);
}

export function CarFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<CarPayload>({ ...initialForm });
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isSuperAdmin) return;
    async function loadAgencies() {
      try {
        setAgencies((await listAgencies()).filter((agency) => agency.status === "ACTIVE"));
      } catch (error) {
        toast.error("Chargement des agences impossible", { description: getApiErrorMessage(error) });
      }
    }
    void loadAgencies();
  }, [isSuperAdmin]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isSuperAdmin && !form.agencyId) {
      toast.error("Agence requise");
      return;
    }
    setIsSubmitting(true);
    try {
      const car = await createCar({
        ...form,
        vin: form.vin || null,
        color: form.color || null,
        insuranceExpiryDate: form.insuranceExpiryDate || null,
        technicalVisitExpiryDate: form.technicalVisitExpiryDate || null,
        notes: form.notes || null
      });
      toast.success("Vehicule cree");
      navigate(`/cars/${car.id}`);
    } catch (error) {
      toast.error("Creation impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <AppPageHeader eyebrow="Flotte" title="Nouveau vehicule" description="Ajouter une voiture a la flotte de l'agence." />
      <AppSection className="rounded-lg border bg-card p-5" title="Informations vehicule">
        <form className="grid gap-5" onSubmit={submit}>
          {isSuperAdmin ? (
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.agencyId ?? ""} required onChange={(event) => setForm({ ...form, agencyId: event.target.value })}>
              <option value="">Selectionner une agence</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <Input required placeholder="Marque" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} />
            <Input required placeholder="Modele" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
            <Input required min={1900} type="number" placeholder="Annee" value={form.year} onChange={(event) => setForm({ ...form, year: asNumber(event.target.value) })} />
            <Input required placeholder="Immatriculation" value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} />
            <Input placeholder="VIN" value={form.vin ?? ""} onChange={(event) => setForm({ ...form, vin: event.target.value })} />
            <Input placeholder="Couleur" value={form.color ?? ""} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.fuelType} onChange={(event) => setForm({ ...form, fuelType: event.target.value as FuelType })}>
              <option value="GASOLINE">Essence</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybride</option>
              <option value="ELECTRIC">Electrique</option>
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.transmission} onChange={(event) => setForm({ ...form, transmission: event.target.value as TransmissionType })}>
              <option value="MANUAL">Manuelle</option>
              <option value="AUTOMATIC">Automatique</option>
            </select>
            <Input min={1} type="number" placeholder="Places" value={form.seats} onChange={(event) => setForm({ ...form, seats: asNumber(event.target.value) })} />
            <Input min={0} step="0.01" type="number" placeholder="Prix/jour" value={form.dailyPrice} onChange={(event) => setForm({ ...form, dailyPrice: asNumber(event.target.value) })} />
            <Input min={0} step="0.01" type="number" placeholder="Prix/semaine" value={form.weeklyPrice} onChange={(event) => setForm({ ...form, weeklyPrice: asNumber(event.target.value) })} />
            <Input min={0} step="0.01" type="number" placeholder="Prix/mois" value={form.monthlyPrice} onChange={(event) => setForm({ ...form, monthlyPrice: asNumber(event.target.value) })} />
            <Input min={0} type="number" placeholder="Kilometrage" value={form.mileage} onChange={(event) => setForm({ ...form, mileage: asNumber(event.target.value) })} />
            <Input type="date" value={form.insuranceExpiryDate ?? ""} onChange={(event) => setForm({ ...form, insuranceExpiryDate: event.target.value })} />
            <Input type="date" value={form.technicalVisitExpiryDate ?? ""} onChange={(event) => setForm({ ...form, technicalVisitExpiryDate: event.target.value })} />
          </div>
          <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Notes" value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <div className="flex gap-2">
            <Button disabled={isSubmitting} type="submit">Enregistrer</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/cars")}>Annuler</Button>
          </div>
        </form>
      </AppSection>
    </PageContainer>
  );
}
