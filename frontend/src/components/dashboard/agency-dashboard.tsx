import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CalendarClock, Car, FileSignature, Gauge, Users, Wallet, Wrench } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/ui-custom/stat-card";
import { getAgencyDashboard, type AgencyDashboardData } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { RevenueChart } from "./revenue-chart";

function money(value: number) {
  return `${Math.round(value).toLocaleString("fr-MA")} MAD`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
}

export function AgencyDashboard() {
  const [dashboard, setDashboard] = useState<AgencyDashboardData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setDashboard(await getAgencyDashboard());
      } catch (error) {
        toast.error("Chargement du dashboard agence impossible", { description: getApiErrorMessage(error) });
      }
    }

    void load();
  }, []);

  const kpis = dashboard?.kpis;
  const alerts = dashboard?.alerts;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold uppercase text-foreground">Pilotage agence</h1>
        <p className="text-sm text-muted-foreground">Flotte, reservations, revenus et alertes operationnelles.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Vehicules disponibles" value={String(kpis?.availableVehicles ?? "-")} icon={Car} />
        <StatCard title="Vehicules loues" value={String(kpis?.rentedVehicles ?? "-")} icon={Car} />
        <StatCard title="Vehicules maintenance" value={String(kpis?.maintenanceVehicles ?? "-")} icon={AlertTriangle} />
        <StatCard title="Entretien requis" value={String(kpis?.vehiclesNeedingMaintenance ?? "-")} icon={Wrench} />
        <StatCard title="Vidanges en retard" value={String(kpis?.overdueOilChanges ?? "-")} icon={Gauge} />
        <StatCard title="Reservations du jour" value={String(kpis?.reservationsToday ?? "-")} icon={CalendarClock} />
        <StatCard title="Reservations du mois" value={String(kpis?.reservationsMonth ?? "-")} icon={CalendarClock} />
        <StatCard title="Revenus du mois" value={kpis ? money(kpis.revenueMonth) : "-"} icon={Wallet} />
        <StatCard title="Revenus annuels" value={kpis ? money(kpis.revenueYear) : "-"} icon={Wallet} />
        <StatCard title="Total encaisse" value={kpis ? money(kpis.totalCollected) : "-"} icon={Wallet} />
        <StatCard title="Reste a encaisser" value={kpis ? money(kpis.totalOutstanding) : "-"} icon={Wallet} />
        <StatCard title="Paiements pending" value={String(kpis?.pendingPayments ?? "-")} icon={Wallet} />
        <StatCard title="Paiements confirmes" value={String(kpis?.confirmedPayments ?? "-")} icon={Wallet} />
        <StatCard title="Paiements PayPal" value={String(kpis?.paypalPayments ?? "-")} icon={Wallet} />
        <StatCard title="Virements a valider" value={String(kpis?.pendingBankTransfers ?? "-")} icon={Wallet} />
        <StatCard title="Clients actifs" value={String(kpis?.activeClients ?? "-")} icon={Users} />
        <StatCard title="Occupation flotte" value={kpis ? `${kpis.fleetOccupancyRate}%` : "-"} icon={Gauge} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <StatCard title="Contrats a signer" value={String(alerts?.contractsToSign ?? "-")} icon={FileSignature} />
        <StatCard title="Paiements en retard" value={String(alerts?.overduePayments ?? "-")} icon={Wallet} />
        <StatCard title="Documents expires" value={String(alerts?.expiredDocuments ?? "-")} icon={AlertTriangle} />
        <StatCard title="Alertes maintenance" value={String(alerts?.maintenanceAlerts ?? "-")} icon={AlertTriangle} />
        <StatCard title="Maintenances planifiees" value={String(kpis?.plannedMaintenance ?? "-")} icon={CalendarClock} />
        <StatCard title="Anomalies critiques" value={String(kpis?.criticalAnomalies ?? "-")} icon={AlertTriangle} />
        <StatCard title="Visites expirees" value={String(kpis?.expiredTechnicalInspections ?? "-")} icon={AlertTriangle} />
        <StatCard title="Assurances expirees" value={String(kpis?.expiredInsurances ?? "-")} icon={AlertTriangle} />
        <StatCard title="Reservations a venir" value={String(alerts?.upcomingReservations.length ?? "-")} icon={CalendarClock} />
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-sm font-semibold uppercase text-foreground">Reservations a venir</h2>
          <p className="text-sm text-muted-foreground">Prochains departs confirmes.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(alerts?.upcomingReservations ?? []).map((reservation) => (
            <div className="rounded-lg border bg-background p-4" key={reservation.id}>
              <div className="text-sm font-semibold text-foreground">{reservation.clientName}</div>
              <div className="mt-1 text-sm text-muted-foreground">{reservation.vehicle} · {reservation.registrationNumber}</div>
              <div className="mt-3 text-xs uppercase text-muted-foreground">{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</div>
            </div>
          ))}
          {alerts?.upcomingReservations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Aucune reservation a venir.</div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold uppercase text-foreground">Revenus mensuels</h2>
            <p className="text-sm text-muted-foreground">Reservations confirmees, en cours et terminees.</p>
          </div>
          <RevenueChart data={dashboard?.charts.monthlyRevenue ?? []} />
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold uppercase text-foreground">Occupation flotte</h2>
            <p className="text-sm text-muted-foreground">Taux mensuel estime.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={dashboard?.charts.fleetOccupancy ?? []} margin={{ left: 0, right: 8, top: 12 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="month" tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis axisLine={false} tickFormatter={(value) => `${value}%`} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={42} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(value) => [`${value}%`, "Occupation"]} />
                <Line dataKey="occupancy" dot={false} stroke="#10b981" strokeWidth={2} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-sm font-semibold uppercase text-foreground">Top vehicules rentables</h2>
          <p className="text-sm text-muted-foreground">Classement annuel par revenu de reservation.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={dashboard?.charts.topVehicles ?? []} layout="vertical" margin={{ left: 8, right: 24, top: 8 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
              <XAxis axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} tickLine={false} type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis axisLine={false} dataKey="name" tickLine={false} type="category" width={140} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(value) => [`${Number(value).toLocaleString("fr-MA")} MAD`, "Revenu"]} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
