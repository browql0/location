import { CalendarClock, Car, Users, Wallet } from "lucide-react";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatCard } from "@/components/ui-custom/stat-card";
import { useAuth } from "@/features/auth/auth-provider";

export function AgencyDashboard() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow={user?.role === "STAFF" ? "Staff" : "Agence"}
        title="Dashboard agence"
        description={`Vue operationnelle de ${user?.agency?.name ?? "votre agence"}. Les modules metier seront branches dans les prochaines phases.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Module bientôt disponible" icon={Car} title="Voitures" value="-" />
        <StatCard description="Module bientôt disponible" icon={Users} title="Clients" value="-" />
        <StatCard description="Module bientôt disponible" icon={CalendarClock} title="Reservations" value="-" />
        <StatCard description="Module bientôt disponible" icon={Wallet} title="Revenus" value="-" />
      </div>

      <AppSection className="rounded-lg border bg-card p-5" title="Modules agence">
        <EmptyState
          icon={CalendarClock}
          title="Module bientôt disponible"
          description="Les donnees voitures, clients, reservations et revenus seront connectees quand les modules metier seront developpes."
        />
      </AppSection>
    </PageContainer>
  );
}
