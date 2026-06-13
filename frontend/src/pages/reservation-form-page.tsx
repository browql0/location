import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { listCars, type Car } from "@/features/cars/cars-api";
import { listClients, type Client } from "@/features/clients/clients-api";
import { checkAvailability, createReservation, getReservation, updateReservation, type ReservationPayload } from "@/features/reservations/reservations-api";
import { getApiErrorMessage } from "@/lib/api-error";

const initialForm: ReservationPayload = {
  clientId: "",
  carId: "",
  startDate: "",
  endDate: "",
  dailyPrice: 0,
  advanceAmount: 0,
  depositAmount: 0,
  notes: ""
};

function days(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  return Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000));
}

export function ReservationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<ReservationPayload>({ ...initialForm });
  const [clients, setClients] = useState<Client[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [availability, setAvailability] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(id);

  const totalDays = days(form.startDate, form.endDate);
  const totalAmount = totalDays * Number(form.dailyPrice || 0);
  const remainingAmount = Math.max(0, totalAmount - Number(form.advanceAmount || 0));

  useEffect(() => {
    async function loadOptions() {
      try {
        const [nextClients, nextCars] = await Promise.all([listClients(), listCars()]);
        setClients(nextClients);
        setCars(nextCars);
      } catch (error) {
        toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
      }
    }
    void loadOptions();
  }, []);

  useEffect(() => {
    if (!id) return;
    const reservationId = id;
    async function loadReservation() {
      try {
        setIsLoading(true);
        const reservation = await getReservation(reservationId);
        setForm({
          clientId: reservation.clientId,
          carId: reservation.carId,
          startDate: reservation.startDate.slice(0, 10),
          endDate: reservation.endDate.slice(0, 10),
          dailyPrice: Number(reservation.dailyPrice),
          advanceAmount: Number(reservation.advanceAmount),
          depositAmount: reservation.depositAmount ? Number(reservation.depositAmount) : 0,
          notes: reservation.notes ?? ""
        });
      } catch (error) {
        toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }
    void loadReservation();
  }, [id]);

  const selectedCar = useMemo(() => cars.find((car) => car.id === form.carId), [cars, form.carId]);

  useEffect(() => {
    if (selectedCar && !form.dailyPrice) setForm((current) => ({ ...current, dailyPrice: Number(selectedCar.dailyPrice) }));
  }, [selectedCar]);

  async function verifyAvailability() {
    if (!form.carId || !form.startDate || !form.endDate) {
      toast.error("Voiture et dates requises");
      return;
    }
    try {
      const result = await checkAvailability({ carId: form.carId, startDate: form.startDate, endDate: form.endDate, ...(id ? { excludeReservationId: id } : {}) });
      setAvailability(result.available ? "Voiture disponible" : result.message ?? "Voiture indisponible");
      toast[result.available ? "success" : "error"](result.available ? "Voiture disponible" : result.message ?? "Voiture indisponible");
    } catch (error) {
      setAvailability(getApiErrorMessage(error));
      toast.error("Verification impossible", { description: getApiErrorMessage(error) });
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...form, depositAmount: form.depositAmount || null, notes: form.notes || null };
      const reservation = isEditing && id ? await updateReservation(id, payload) : await createReservation(payload);
      toast.success(isEditing ? "Reservation modifiee" : "Reservation creee");
      navigate(`/reservations/${reservation.id}`);
    } catch (error) {
      toast.error("Enregistrement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <AppPageHeader eyebrow="Reservations" title={isEditing ? "Modifier reservation" : "Nouvelle reservation"} description="Le calcul frontend est indicatif; le backend recalcule toujours." />
      {isLoading ? <PageSkeleton /> : (
        <AppSection className="rounded-lg border bg-card p-5" title="Informations reservation">
          <form className="grid gap-5" onSubmit={submit}>
            <div className="grid gap-3 md:grid-cols-2">
              <select required className="h-10 rounded-md border bg-background px-3 text-sm" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
                <option value="">Selectionner client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}
              </select>
              <select required className="h-10 rounded-md border bg-background px-3 text-sm" value={form.carId} onChange={(event) => setForm({ ...form, carId: event.target.value, dailyPrice: Number(cars.find((car) => car.id === event.target.value)?.dailyPrice ?? form.dailyPrice) })}>
                <option value="">Selectionner voiture</option>
                {cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model} - {car.registrationNumber}</option>)}
              </select>
              <Input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              <Input required type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              <Input min={0} step="0.01" type="number" placeholder="Prix/jour" value={form.dailyPrice ?? 0} onChange={(event) => setForm({ ...form, dailyPrice: Number(event.target.value) })} />
              <Input min={0} step="0.01" type="number" placeholder="Avance" value={form.advanceAmount} onChange={(event) => setForm({ ...form, advanceAmount: Number(event.target.value) })} />
              <Input min={0} step="0.01" type="number" placeholder="Caution" value={form.depositAmount ?? 0} onChange={(event) => setForm({ ...form, depositAmount: Number(event.target.value) })} />
            </div>
            <div className="grid gap-2 rounded-md border bg-muted p-3 text-sm md:grid-cols-3">
              <span>Jours: <strong>{totalDays}</strong></span><span>Total: <strong>{totalAmount.toLocaleString("fr-FR")} MAD</strong></span><span>Reste: <strong>{remainingAmount.toLocaleString("fr-FR")} MAD</strong></span>
            </div>
            {availability ? <p className="text-sm text-muted-foreground">{availability}</p> : null}
            <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Notes" value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={verifyAvailability}>Verifier disponibilite</Button>
              <Button disabled={isSubmitting} type="submit">Enregistrer</Button>
              <Button type="button" variant="outline" onClick={() => navigate(isEditing && id ? `/reservations/${id}` : "/reservations")}>Annuler</Button>
            </div>
          </form>
        </AppSection>
      )}
    </PageContainer>
  );
}
