import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, CreditCard, Users, Wallet } from "lucide-react";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { moduleEmptyStates } from "@/components/shared/module-empty-states";
import { useAuth } from "@/features/auth/auth-provider";
import { getDashboardKpis, type DashboardKpis } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
import { agencyPreviewData, type AgencyPreview } from "./dashboard-mock-data";
import { RevenueChart } from "./revenue-chart";
import { SubscriptionsChart } from "./subscriptions-chart";

const columns: ColumnDef<AgencyPreview>[] = [
  {
    accessorKey: "agency",
    header: "Agence",
    cell: ({ row }) => <span className="font-medium">{row.original.agency}</span>
  },
  {
    accessorKey: "plan",
    header: "Plan"
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    accessorKey: "users",
    header: "Utilisateurs"
  },
  {
    accessorKey: "mrr",
    header: "MRR"
  }
];

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);

  useEffect(() => {
    async function loadKpis() {
      try {
        setKpis(await getDashboardKpis());
      } catch (error) {
        setKpis(null);
        toast.error("Chargement des KPIs impossible", { description: getApiErrorMessage(error) });
      }
    }

    void loadKpis();
  }, []);

  const revenue = `${(kpis?.revenueSaas ?? 0).toLocaleString("fr-MA")} MAD`;

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Super Admin"
        title="Dashboard"
        description={`Vue de pilotage temporaire pour ${user?.firstName ?? "l'equipe"}: revenus, abonnements et activite SaaS. Donnees mockees pour la fondation UI.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Agences en base PostgreSQL" icon={Building2} title="Agences" value={String(kpis?.agencies ?? "-")} />
        <StatCard description="Abonnements actifs, trial et past due" icon={CreditCard} title="Abonnements" value={String(kpis?.subscriptions ?? "-")} />
        <StatCard description="Utilisateurs reels" icon={Users} title="Utilisateurs" value={String(kpis?.users ?? "-")} />
        <StatCard description="MRR calcule depuis les abonnements actifs" icon={Wallet} title="Revenus SaaS" value={revenue} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <AppSection className="rounded-lg border bg-card p-5 shadow-sm" title="Evolution revenus" description="Revenus mensuels recurrents mockes.">
          <RevenueChart />
        </AppSection>
        <AppSection className="rounded-lg border bg-card p-5 shadow-sm" title="Abonnements" description="Repartition temporaire des plans.">
          <SubscriptionsChart />
        </AppSection>
      </div>

      <AppSection title="Apercu agences" description="Table TanStack reusable avec recherche, tri, pagination et selection multiple.">
        <DataTable columns={columns} data={agencyPreviewData} getRowId={(row) => row.id} searchPlaceholder="Rechercher une agence..." />
      </AppSection>

      <AppSection title="Etats vides modules" description="Modeles reutilisables pour les prochaines phases.">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState {...moduleEmptyStates.agencies} />
          <EmptyState {...moduleEmptyStates.cars} />
          <EmptyState {...moduleEmptyStates.clients} />
          <EmptyState {...moduleEmptyStates.reservations} />
        </div>
      </AppSection>
    </PageContainer>
  );
}
