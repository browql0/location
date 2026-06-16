import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { generateSaasInvoice } from "@/features/invoices/invoices-api";
import { changeSubscriptionPlan, listPlans, listSubscriptions, setSubscriptionActive, type Subscription, type SubscriptionPlan } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";

export function SuperAdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    try {
      const [subscriptionData, planData] = await Promise.all([listSubscriptions(status ? { status } : undefined), listPlans()]);
      setSubscriptions(subscriptionData);
      setPlans(planData.filter((plan) => plan.isActive));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  const columns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      { header: "Agence", cell: ({ row }) => <span className="font-medium">{row.original.agency?.name ?? row.original.agencyId}</span> },
      { header: "Plan", cell: ({ row }) => row.original.plan.name },
      { header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Debut", cell: ({ row }) => new Date(row.original.startsAt).toLocaleDateString("fr-FR") },
      { header: "Expiration", cell: ({ row }) => new Date(row.original.endsAt).toLocaleDateString("fr-FR") },
      { header: "Montant", cell: ({ row }) => `${row.original.amount ?? 0} ${row.original.currency}` },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex min-w-72 flex-wrap gap-2">
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              aria-label="Changer plan"
              defaultValue=""
              onChange={async (event) => {
                if (!event.target.value) return;
                try {
                  await changeSubscriptionPlan(row.original.id, event.target.value);
                  toast.success("Plan change");
                  await load();
                } catch (error) {
                  toast.error("Changement impossible", { description: getApiErrorMessage(error) });
                }
              }}
            >
              <option value="">Changer plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await setSubscriptionActive(row.original.id, row.original.status === "SUSPENDED");
                  toast.success(row.original.status === "SUSPENDED" ? "Abonnement reactive" : "Abonnement suspendu");
                  await load();
                } catch (error) {
                  toast.error("Action impossible", { description: getApiErrorMessage(error) });
                }
              }}
            >
              {row.original.status === "SUSPENDED" ? "Reactiver" : "Suspendre"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  const invoice = await generateSaasInvoice(row.original.id);
                  toast.success("Facture SaaS generee", { description: invoice.invoiceNumber });
                } catch (error) {
                  toast.error("Generation impossible", { description: getApiErrorMessage(error) });
                }
              }}
            >
              Facture SaaS
            </Button>
          </div>
        )
      }
    ],
    [plans, status]
  );

  return (
    <PageContainer>
      <AppPageHeader title="Abonnements" description="Gestion reelle des abonnements, changements de plans et suspensions." eyebrow="Super Admin" />
      <AppSection
        title="Tous les abonnements"
        actions={
          <select className="h-9 rounded-md border bg-background px-3 text-sm" aria-label="Filtrer par statut" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tous statuts</option>
            <option value="TRIALING">TRIALING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAST_DUE">PAST_DUE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        }
      >
        <DataTable columns={columns} data={subscriptions} getRowId={(row) => row.id} searchPlaceholder="Rechercher un abonnement..." />
      </AppSection>
    </PageContainer>
  );
}
