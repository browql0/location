/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — EXPIRATIONS CENTER
   Subscriptions expiring within 30 days.
   Color-coded: red < 3d · orange < 7d · green otherwise
═══════════════════════════════════════════════════════════════ */
import { CalendarClock } from "lucide-react";
import { C, fDate } from "./tokens";
import { GlassCard, SectionHeader, EmptyState } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type ExpirationRow = SuperAdminDashboardData["expirations"][number];

function urgencyColor(daysLeft: number): string {
  if (daysLeft < 3) return C.danger;
  if (daysLeft < 7) return C.warning;
  return C.success;
}

function urgencyBorder(daysLeft: number): string {
  if (daysLeft < 3) return `${C.danger}40`;
  if (daysLeft < 7) return `${C.warning}30`;
  return `${C.border}`;
}

function DaysChip({ days }: { days: number }) {
  const color = urgencyColor(days);
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black"
      style={{
        background:          `${color}18`,
        color,
        border:              `1px solid ${color}35`,
        fontVariantNumeric:  "tabular-nums",
        textShadow:          days < 3 ? `0 0 10px ${color}` : "none"
      }}
    >
      {days}j
    </span>
  );
}

function ExpirationEntry({ row }: { row: ExpirationRow }) {
  return (
    <div
      className="grid gap-x-4 gap-y-1 rounded-xl px-4 py-3 text-sm
                 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
      style={{
        background: "rgba(255,255,255,0.02)",
        border:     `1px solid ${urgencyBorder(row.daysLeft)}`
      }}
    >
      <span className="font-bold truncate" style={{ color: C.text }}>
        {row.agencyName}
      </span>
      <span
        className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase w-fit"
        style={{
          background: C.purpleGlow,
          color:      C.purple,
          border:     `1px solid ${C.purple}30`
        }}
      >
        {row.plan}
      </span>
      <span className="text-xs" style={{ color: C.muted }}>
        {fDate(row.endsAt)}
      </span>
      <DaysChip days={row.daysLeft} />
    </div>
  );
}

export function ExpirationsCenter({
  expirations
}: {
  expirations: SuperAdminDashboardData["expirations"];
}) {
  /* Group urgency counts for header context */
  const critical = expirations.filter(e => e.daysLeft < 3).length;
  const warning  = expirations.filter(e => e.daysLeft < 7).length;
  const headerColor = critical > 0 ? C.danger : warning > 0 ? C.warning : C.success;

  return (
    <GlassCard className="p-6">
      <SectionHeader
        icon={CalendarClock}
        title="Expirations Center"
        subtitle="Abonnements expirant dans les 30 prochains jours"
        color={headerColor}
        action={
          expirations.length > 0 ? (
            <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
              <span
                className="font-bold rounded-lg px-2 py-0.5"
                style={{ background: C.dangerGlow, color: C.danger, border: `1px solid ${C.danger}30` }}
              >
                {critical} &lt; 3j
              </span>
              <span
                className="font-bold rounded-lg px-2 py-0.5"
                style={{ background: C.warningGlow, color: C.warning, border: `1px solid ${C.warning}30` }}
              >
                {warning} &lt; 7j
              </span>
            </div>
          ) : null
        }
      />

      {expirations.length === 0 ? (
        <EmptyState message="✅ Aucune expiration dans les 30 prochains jours" />
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div
            className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: C.mutedLight }}
          >
            <span>Agence</span>
            <span>Plan</span>
            <span>Date</span>
            <span>Reste</span>
          </div>
          {expirations.map(row => (
            <ExpirationEntry key={row.id} row={row} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
