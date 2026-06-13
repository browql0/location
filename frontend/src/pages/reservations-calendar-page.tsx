import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { PageContainer } from "@/components/ui-custom/page-container";
import { getReservationCalendar, type ReservationStatus } from "@/features/reservations/reservations-api";
import { getApiErrorMessage } from "@/lib/api-error";

const eventColors: Record<ReservationStatus, string> = {
  CONFIRMED: "#2563eb",
  IN_PROGRESS: "#7c3aed",
  COMPLETED: "#16a34a",
  CANCELLED: "#71717a"
};

export function ReservationsCalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Array<{ id: string; title: string; start: string; end: string; backgroundColor: string; borderColor: string }>>([]);

  useEffect(() => {
    async function load() {
      try {
        const items = await getReservationCalendar();
        setEvents(items.map((item) => ({ ...item, backgroundColor: eventColors[item.status], borderColor: eventColors[item.status] })));
      } catch (error) {
        toast.error("Chargement calendrier impossible", { description: getApiErrorMessage(error) });
      }
    }
    void load();
  }, []);

  return (
    <PageContainer>
      <AppPageHeader eyebrow="Reservations" title="Calendrier" description="Vue calendrier des reservations par voiture et client." />
      <AppSection className="rounded-lg border bg-card p-5">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={(info) => navigate(`/reservations/${info.event.id}`)}
          height="auto"
        />
      </AppSection>
    </PageContainer>
  );
}
