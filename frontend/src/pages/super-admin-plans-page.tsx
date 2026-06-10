import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { createPlan, listPlans, setPlanActive, updatePlan, type SubscriptionPlan } from "@/features/saas/saas-api";

type PlanForm = {
  id?: string;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  trialDays: string;
  maxUsers: string;
  maxCars: string;
  maxClients: string;
  maxReservations: string;
};

const emptyForm: PlanForm = {
  name: "",
  description: "",
  priceMonthly: "0",
  priceYearly: "",
  trialDays: "0",
  maxUsers: "",
  maxCars: "",
  maxClients: "",
  maxReservations: ""
};

function formFromPlan(plan: SubscriptionPlan): PlanForm {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? "",
    priceMonthly: String(plan.priceMonthly),
    priceYearly: plan.priceYearly ? String(plan.priceYearly) : "",
    trialDays: String(plan.trialDays),
    maxUsers: plan.maxUsers ? String(plan.maxUsers) : "",
    maxCars: plan.maxCars ? String(plan.maxCars) : "",
    maxClients: plan.maxClients ? String(plan.maxClients) : "",
    maxReservations: plan.maxReservations ? String(plan.maxReservations) : ""
  };
}

function payload(form: PlanForm) {
  return {
    name: form.name,
    description: form.description || null,
    priceMonthly: Number(form.priceMonthly),
    priceYearly: form.priceYearly ? Number(form.priceYearly) : null,
    trialDays: Number(form.trialDays),
    maxUsers: form.maxUsers ? Number(form.maxUsers) : null,
    maxCars: form.maxCars ? Number(form.maxCars) : null,
    maxClients: form.maxClients ? Number(form.maxClients) : null,
    maxReservations: form.maxReservations ? Number(form.maxReservations) : null,
    canUseInvoices: true,
    canUseContracts: true,
    canUseIncidents: false,
    canUseAdvancedReports: false,
    canUseApiAccess: false,
    isActive: true
  };
}

export function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyForm);

  async function load() {
    setPlans(await listPlans());
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo<ColumnDef<SubscriptionPlan>[]>(
    () => [
      { accessorKey: "name", header: "Plan", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      { accessorKey: "priceMonthly", header: "Mensuel", cell: ({ row }) => `${row.original.priceMonthly} MAD` },
      { accessorKey: "priceYearly", header: "Annuel", cell: ({ row }) => (row.original.priceYearly ? `${row.original.priceYearly} MAD` : "-") },
      { accessorKey: "trialDays", header: "Trial" },
      { header: "Limites", cell: ({ row }) => `${row.original.maxUsers ?? "∞"} users / ${row.original.maxCars ?? "∞"} cars` },
      { header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.isActive ? "ACTIVE" : "INACTIVE"} /> },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(formFromPlan(row.original))}>
              Modifier
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await setPlanActive(row.original.id, !row.original.isActive);
                toast.success(row.original.isActive ? "Plan desactive" : "Plan reactive");
                await load();
              }}
            >
              {row.original.isActive ? "Desactiver" : "Reactiver"}
            </Button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <PageContainer>
      <AppPageHeader title="Plans SaaS" description="Configuration reelle des plans commerciaux et limites associees." eyebrow="Super Admin" />
      <AppSection className="rounded-lg border bg-card p-5" title={form.id ? "Modifier un plan" : "Creer un plan"}>
        <form
          className="grid gap-3 md:grid-cols-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (form.id) await updatePlan(form.id, payload(form));
            else await createPlan(payload(form));
            toast.success(form.id ? "Plan modifie" : "Plan cree");
            setForm(emptyForm);
            await load();
          }}
        >
          {(["name", "priceMonthly", "priceYearly", "trialDays", "maxUsers", "maxCars", "maxClients", "maxReservations"] as const).map((key) => (
            <Input key={key} aria-label={key} placeholder={key} value={form[key]} onChange={(event) => setForm((value) => ({ ...value, [key]: event.target.value }))} />
          ))}
          <Input className="md:col-span-2" aria-label="description" placeholder="description" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
          <Button type="submit">{form.id ? "Enregistrer" : "Creer"}</Button>
          {form.id ? (
            <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
              Annuler
            </Button>
          ) : null}
        </form>
      </AppSection>
      <AppSection title="Plans existants">
        <DataTable columns={columns} data={plans} getRowId={(row) => row.id} searchPlaceholder="Rechercher un plan..." />
      </AppSection>
    </PageContainer>
  );
}
