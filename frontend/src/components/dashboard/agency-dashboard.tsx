import { useEffect, useState } from "react";
import { AlertTriangle, Car, CheckCircle2, PauseCircle, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatCard } from "@/components/ui-custom/stat-card";
import { useAuth } from "@/features/auth/auth-provider";
import { getAgencyDashboardKpis, type AgencyDashboardKpis } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";

export function AgencyDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<AgencyDashboardKpis | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setKpis(await getAgencyDashboardKpis());
      } catch (error) {
        toast.error("Chargement des KPIs impossible", { description: getApiErrorMessage(error) });
      }
    }

    void load();
  }, []);

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow={user?.role === "STAFF" ? "Staff" : "Agence"}
        title="Dashboard agence"
        description={`Vue operationnelle de ${user?.agency?.name ?? "votre agence"}. Donnees flotte issues de PostgreSQL.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Vehicules actifs en flotte" icon={Car} title="Vehicules" value={String(kpis?.vehicles ?? "-")} />
        <StatCard description="Prets a louer" icon={CheckCircle2} title="Disponibles" value={String(kpis?.available ?? "-")} />
        <StatCard description="En intervention" icon={Wrench} title="Maintenance" value={String(kpis?.maintenance ?? "-")} />
        <StatCard description="Hors service" icon={PauseCircle} title="Inactifs" value={String(kpis?.inactive ?? "-")} />
      </div>

      <AppSection className="rounded-lg border bg-card p-5" title="Modules agence">
        <EmptyState
          icon={AlertTriangle}
          title="Historique futur"
          description="Les clients, reservations, contrats, factures et paiements resteront vides jusqu'aux prochaines phases."
        />
      </AppSection>
    </PageContainer>
  );
}
