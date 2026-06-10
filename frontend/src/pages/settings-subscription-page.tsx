import { useEffect, useState } from "react";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { getCurrentSubscription, type Subscription } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";

function daysRemaining(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function SettingsSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      try {
        setSubscription(await getCurrentSubscription());
      } catch (error) {
        setSubscription(null);
        toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
      }
    }

    void loadSubscription();
  }, []);

  return (
    <PageContainer>
      <AppPageHeader title="Abonnement" description="Plan actuel, statut, dates et limites de votre agence." eyebrow="Parametres" />
      {subscription ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Plan actuel" value={subscription.plan.name} />
            <StatCard title="Statut" value={subscription.status} />
            <StatCard title="Expiration" value={new Date(subscription.endsAt).toLocaleDateString("fr-FR")} />
            <StatCard title="Jours restants" value={String(daysRemaining(subscription.endsAt))} />
          </div>
          <AppSection className="rounded-lg border bg-card p-5" title="Limites">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Utilisateurs" value={String(subscription.plan.maxUsers ?? "Illimite")} />
              <StatCard title="Voitures" value={String(subscription.plan.maxCars ?? "Illimite")} />
              <StatCard title="Clients" value={String(subscription.plan.maxClients ?? "Illimite")} />
              <StatCard title="Reservations" value={String(subscription.plan.maxReservations ?? "Illimite")} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status={subscription.plan.canUseInvoices ? "ACTIVE" : "INACTIVE"} />
              <span className="text-sm text-muted-foreground">Factures</span>
              <StatusBadge status={subscription.plan.canUseContracts ? "ACTIVE" : "INACTIVE"} />
              <span className="text-sm text-muted-foreground">Contrats</span>
              <StatusBadge status={subscription.plan.canUseIncidents ? "ACTIVE" : "INACTIVE"} />
              <span className="text-sm text-muted-foreground">Incidents</span>
            </div>
          </AppSection>
        </>
      ) : (
        <AppSection className="rounded-lg border bg-card p-5" title="Aucun abonnement">
          <p className="muted-text">Aucun abonnement actif n'a ete trouve pour cette agence.</p>
        </AppSection>
      )}
    </PageContainer>
  );
}
