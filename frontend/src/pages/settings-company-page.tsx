import { useEffect, useState } from "react";
import { Building2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { getAgency, listAgencies, updateAgencyCompany, uploadAgencyLogo, type Agency } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";

const emptyCompany = {
  name: "",
  tradeName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  country: "Morocco",
  ice: "",
  ifNumber: "",
  rc: "",
  patente: "",
  bankName: "",
  rib: "",
  website: ""
};

type CompanyForm = typeof emptyCompany;

function resolveLogoUrl(value: string | null) {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  const apiOrigin = new URL(import.meta.env.VITE_API_URL ?? window.location.origin).origin;
  return `${apiOrigin}${value}`;
}

function toForm(agency: Agency): CompanyForm {
  return {
    name: agency.name ?? "",
    tradeName: agency.tradeName ?? "",
    phone: agency.phone ?? "",
    email: agency.email ?? "",
    address: agency.address ?? "",
    city: agency.city ?? "",
    country: agency.country ?? "Morocco",
    ice: agency.ice ?? "",
    ifNumber: agency.ifNumber ?? "",
    rc: agency.rc ?? "",
    patente: agency.patente ?? "",
    bankName: agency.bankName ?? "",
    rib: agency.rib ?? "",
    website: agency.website ?? ""
  };
}

export function SettingsCompanyPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN";
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyId, setAgencyId] = useState(user?.agencyId ?? "");
  const [agency, setAgency] = useState<Agency | null>(null);
  const [form, setForm] = useState<CompanyForm>({ ...emptyCompany });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    async function loadAgencies() {
      try {
        const rows = await listAgencies();
        setAgencies(rows);
        if (!agencyId && rows[0]) setAgencyId(rows[0].id);
      } catch (error) {
        toast.error("Chargement des agences impossible", { description: getApiErrorMessage(error) });
      }
    }
    void loadAgencies();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!agencyId) {
      setIsLoading(false);
      return;
    }
    async function loadAgency() {
      try {
        setIsLoading(true);
        const nextAgency = await getAgency(agencyId);
        setAgency(nextAgency);
        setForm(toForm(nextAgency));
        setLogoPreview(resolveLogoUrl(nextAgency.logoUrl));
      } catch (error) {
        toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }
    void loadAgency();
  }, [agencyId]);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!agencyId || !canEdit) return;
    setIsSubmitting(true);
    try {
      let updated = await updateAgencyCompany(agencyId, {
        ...form,
        tradeName: form.tradeName || null,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        country: form.country || null,
        ice: form.ice || null,
        ifNumber: form.ifNumber || null,
        rc: form.rc || null,
        patente: form.patente || null,
        bankName: form.bankName || null,
        rib: form.rib || null,
        website: form.website || null
      });
      if (logoFile) updated = await uploadAgencyLogo(agencyId, logoFile);
      setAgency(updated);
      setForm(toForm(updated));
      setLogoPreview(resolveLogoUrl(updated.logoUrl));
      setLogoFile(null);
      toast.success("Parametres entreprise enregistres");
    } catch (error) {
      toast.error("Enregistrement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!agencyId && !isSuperAdmin) {
    return <PageContainer><EmptyState title="Agence introuvable" description="Aucun contexte agence n'est associe a votre compte." /></PageContainer>;
  }

  return (
    <PageContainer>
      <AppPageHeader eyebrow="Parametres" title="Entreprise" description="Informations commerciales, legales et bancaires utilisees par les documents Rentora." />
      {isSuperAdmin ? (
        <AppSection className="rounded-lg border bg-card p-5" title="Agence">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={agencyId} onChange={(event) => setAgencyId(event.target.value)}>
            <option value="">Selectionner une agence</option>
            {agencies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </AppSection>
      ) : null}

      {isLoading ? <PageSkeleton /> : (
        <form className="grid gap-5" onSubmit={submit}>
          <AppSection className="rounded-lg border bg-card p-5" title="Logo">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border bg-muted">
                {logoPreview ? <img alt="Logo agence" className="h-full w-full object-contain" src={logoPreview} /> : <Building2 className="h-9 w-9 text-muted-foreground" />}
              </div>
              <div className="grid gap-2">
                <input disabled={!canEdit} accept="image/png,image/jpeg,image/jpg,image/webp" className="h-10 rounded-md border bg-background px-3 py-2 text-sm" type="file" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG ou WEBP. Taille max 5 MB.</p>
              </div>
            </div>
          </AppSection>

          <AppSection className="rounded-lg border bg-card p-5" title="Informations societe">
            <div className="grid gap-3 md:grid-cols-2">
              <Input required disabled={!canEdit} placeholder="Nom legal" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <Input disabled={!canEdit} placeholder="Nom commercial" value={form.tradeName} onChange={(event) => setForm({ ...form, tradeName: event.target.value })} />
              <Input required disabled={!canEdit} type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <Input disabled={!canEdit} placeholder="Telephone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <Input disabled={!canEdit} placeholder="Adresse" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              <Input disabled={!canEdit} placeholder="Ville" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
              <Input disabled={!canEdit} placeholder="Pays" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            </div>
          </AppSection>

          <AppSection className="rounded-lg border bg-card p-5" title="Informations legales">
            <div className="grid gap-3 md:grid-cols-4">
              <Input disabled={!canEdit} placeholder="ICE" value={form.ice} onChange={(event) => setForm({ ...form, ice: event.target.value })} />
              <Input disabled={!canEdit} placeholder="IF" value={form.ifNumber} onChange={(event) => setForm({ ...form, ifNumber: event.target.value })} />
              <Input disabled={!canEdit} placeholder="RC" value={form.rc} onChange={(event) => setForm({ ...form, rc: event.target.value })} />
              <Input disabled={!canEdit} placeholder="Patente" value={form.patente} onChange={(event) => setForm({ ...form, patente: event.target.value })} />
            </div>
          </AppSection>

          <AppSection className="rounded-lg border bg-card p-5" title="Informations bancaires">
            <div className="grid gap-3 md:grid-cols-2">
              <Input disabled={!canEdit} placeholder="Banque" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} />
              <Input disabled={!canEdit} placeholder="RIB" value={form.rib} onChange={(event) => setForm({ ...form, rib: event.target.value })} />
            </div>
          </AppSection>

          <AppSection className="rounded-lg border bg-card p-5" title="Autres">
            <Input disabled={!canEdit} type="url" placeholder="Site web" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
          </AppSection>

          {canEdit ? (
            <div className="flex gap-2">
              <Button disabled={isSubmitting || !agency} type="submit"><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
              {logoFile ? <Button type="button" variant="outline" onClick={() => setLogoFile(null)}><Upload className="mr-2 h-4 w-4" /> Annuler logo</Button> : null}
            </div>
          ) : null}
        </form>
      )}
    </PageContainer>
  );
}
