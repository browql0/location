import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/ui-custom/stat-card";
import { getStaffDashboard, type StaffDashboardData } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
}

export function StaffDashboard() {
  const [dashboard, setDashboard] = useState<StaffDashboardData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setDashboard(await getStaffDashboard());
      } catch (error) {
        toast.error("Chargement du dashboard staff impossible", { description: getApiErrorMessage(error) });
      }
    }

    void load();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold uppercase text-foreground">Operations</h1>
        <p className="text-sm text-muted-foreground">Reservations, contrats, clients et calendrier assignes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Reservations creees" value={String(dashboard?.kpis.reservationsCreated ?? "-")} icon={ClipboardList} />
        <StatCard title="Contrats crees" value={String(dashboard?.kpis.contractsCreated ?? "-")} icon={FileText} />
        <StatCard title="Locations actives" value={String(dashboard?.kpis.activeRentals ?? "-")} icon={CalendarDays} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Mes reservations" value={String(dashboard?.work.myReservations ?? "-")} icon={ClipboardList} />
        <StatCard title="Mes contrats" value={String(dashboard?.work.myContracts ?? "-")} icon={FileText} />
        <StatCard title="Mes clients" value={String(dashboard?.work.myClients ?? "-")} icon={Users} />
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase text-foreground">Calendrier</h2>
            <p className="text-sm text-muted-foreground">Reservations actives ou a venir que vous avez creees.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(dashboard?.work.calendar ?? []).map((event) => (
            <div className="rounded-lg border bg-background p-4" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{event.clientName}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{event.vehicle} · {event.registrationNumber}</div>
                </div>
                <span className="rounded-md border px-2 py-1 text-xs uppercase text-muted-foreground">{event.status}</span>
              </div>
              <div className="mt-4 text-xs uppercase text-muted-foreground">{formatDate(event.startDate)} - {formatDate(event.endDate)}</div>
            </div>
          ))}
          {dashboard?.work.calendar.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Aucun evenement planifie.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
