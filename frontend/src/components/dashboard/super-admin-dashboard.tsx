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

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Super Admin"
        title="Dashboard"
        description={`Vue de pilotage temporaire pour ${user?.firstName ?? "l'equipe"}: revenus, abonnements et activite SaaS. Donnees mockees pour la fondation UI.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Agences actives et en essai" icon={Building2} title="Agences" trend={{ direction: "up", value: "+12%" }} value="86" />
        <StatCard description="Plans payants et trials" icon={CreditCard} title="Abonnements" trend={{ direction: "up", value: "+8%" }} value="68" />
        <StatCard description="Tous roles confondus" icon={Users} title="Utilisateurs" trend={{ direction: "up", value: "+21" }} value="412" />
        <StatCard description="Revenu mensuel recurrent" icon={Wallet} title="Revenus SaaS" trend={{ direction: "up", value: "+18%" }} value="38.4k MAD" />
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
