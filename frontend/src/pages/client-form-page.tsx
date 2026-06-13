import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { createClient, getClient, riskCheck, updateClient, type ClientPayload } from "@/features/clients/clients-api";
import { listAgencies, type Agency } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";

const initialForm: ClientPayload = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  cinOrPassport: "",
  drivingLicense: "",
  address: "",
  city: "",
  country: "Morocco",
  dateOfBirth: "",
  nationality: "",
  notes: ""
};

function nullable(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

export function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [form, setForm] = useState<ClientPayload>({ ...initialForm });
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [riskBadge, setRiskBadge] = useState("Client neutre");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isEditing = Boolean(id);

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

  useEffect(() => {
    if (!id) return;
    const clientId = id;
    async function loadClient() {
      try {
        setIsLoading(true);
        const client = await getClient(clientId);
        setForm({
          agencyId: client.agencyId,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone ?? "",
          email: client.email ?? "",
          cinOrPassport: client.cinOrPassport ?? "",
          drivingLicense: client.drivingLicense ?? "",
          address: client.address ?? "",
          city: client.city ?? "",
          country: client.country ?? "",
          dateOfBirth: client.dateOfBirth ? client.dateOfBirth.slice(0, 10) : "",
          nationality: client.nationality ?? "",
          notes: client.notes ?? ""
        });
      } catch (error) {
        toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }
    void loadClient();
  }, [id]);

  async function refreshRiskBadge(nextForm = form) {
    const identity = nextForm.cinOrPassport || nextForm.drivingLicense || nextForm.phone || nextForm.email;
    if (!identity) {
      setRiskBadge("Client neutre");
      return;
    }
    try {
      const risk = await riskCheck(identity);
      if (risk.trustedClient || risk.trustLevel === "TRUSTED") setRiskBadge("Client fiable");
      else if (risk.trustLevel === "RISKY" || risk.riskScore >= 70) setRiskBadge("Client a risque");
      else setRiskBadge("Client a surveiller");
    } catch {
      setRiskBadge("Client neutre");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isSuperAdmin && !form.agencyId) {
      toast.error("Agence requise");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        phone: nullable(form.phone),
        email: nullable(form.email),
        cinOrPassport: nullable(form.cinOrPassport),
        drivingLicense: nullable(form.drivingLicense),
        address: nullable(form.address),
        city: nullable(form.city),
        country: nullable(form.country),
        dateOfBirth: nullable(form.dateOfBirth),
        nationality: nullable(form.nationality),
        notes: nullable(form.notes)
      };
      await refreshRiskBadge(payload);
      const client = isEditing && id ? await updateClient(id, payload) : await createClient(payload);
      toast.success(isEditing ? "Client modifie" : "Client cree");
      navigate(`/clients/${client.id}`);
    } catch (error) {
      toast.error("Creation impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Clients"
        title={isEditing ? "Modifier client" : "Nouveau client"}
        description={isEditing ? "Mettre a jour le profil client." : "Ajouter un profil client a l'agence."}
        actions={<span className="rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground">{riskBadge}</span>}
      />
      {isLoading ? <PageSkeleton /> : (
      <AppSection className="rounded-lg border bg-card p-5" title="Informations client">
        <form className="grid gap-5" onSubmit={submit}>
          {isSuperAdmin ? (
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.agencyId ?? ""} required onChange={(event) => setForm({ ...form, agencyId: event.target.value })}>
              <option value="">Selectionner une agence</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <Input required placeholder="Prenom" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <Input required placeholder="Nom" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Telephone" value={form.phone ?? ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <Input placeholder="Email" type="email" value={form.email ?? ""} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <Input placeholder="CIN ou passeport" value={form.cinOrPassport ?? ""} onChange={(event) => setForm({ ...form, cinOrPassport: event.target.value })} />
            <Input placeholder="Permis de conduire" value={form.drivingLicense ?? ""} onChange={(event) => setForm({ ...form, drivingLicense: event.target.value })} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Adresse" value={form.address ?? ""} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            <Input placeholder="Ville" value={form.city ?? ""} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            <Input placeholder="Pays" value={form.country ?? ""} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            <Input placeholder="Nationalite" value={form.nationality ?? ""} onChange={(event) => setForm({ ...form, nationality: event.target.value })} />
            <Input type="date" value={form.dateOfBirth ?? ""} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} />
          </div>

          <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Notes" value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <div className="flex gap-2">
            <Button disabled={isSubmitting} type="submit">Enregistrer</Button>
            <Button type="button" variant="outline" onClick={() => navigate(isEditing && id ? `/clients/${id}` : "/clients")}>Annuler</Button>
          </div>
        </form>
      </AppSection>
      )}
    </PageContainer>
  );
}
