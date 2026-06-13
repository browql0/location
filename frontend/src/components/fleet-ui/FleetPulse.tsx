import { motion } from "framer-motion";
import { FleetMetricRing } from "./FleetMetricRing";
import { AlertStrip } from "./AlertStrip";
import { Cpu, Activity } from "lucide-react";

type LegacyFleetPulseKpis = {
  vehicles?: number;
  available?: number;
  maintenance?: number;
  inactive?: number;
  totalReservations?: number;
  reservationsToday?: number;
  confirmedReservations?: number;
  inProgressReservations?: number;
};

interface FleetPulseProps {
  kpis: LegacyFleetPulseKpis | null;
}

export function FleetPulse({ kpis }: FleetPulseProps) {
  if (!kpis) return null;

  const total = kpis.vehicles || 1;
  const available = kpis.available || 0;
  const inUse = Math.max(0, kpis.inProgressReservations || 0);
  const maintenance = kpis.maintenance || 0;
  const inactive = kpis.inactive || 0;

  const availabilityRate = Math.round((available / total) * 100);
  const maintenanceAlert = maintenance > total * 0.2;

  const rings = [
    {
      value: available,
      label: "Available",
      sublabel: "READY",
      colorClass: "text-emerald-500",
      glowColor: "#10b981",
      size: 104,
      strokeWidth: 9,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      value: inUse,
      label: "Rented",
      sublabel: "DEPLOYED",
      colorClass: "text-blue-400",
      glowColor: "#3b82f6",
      size: 134,
      strokeWidth: 12,
      accent: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      value: maintenance,
      label: "Service",
      sublabel: "MAINT.",
      colorClass: "text-amber-400",
      glowColor: "#f59e0b",
      size: 104,
      strokeWidth: 9,
      accent: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      value: inactive,
      label: "Offline",
      sublabel: "INACT.",
      colorClass: "text-slate-500",
      glowColor: "#64748b",
      size: 84,
      strokeWidth: 7,
      accent: "text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
      {/* Top gradient accent bar */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40 shadow-[0_0_16px_rgba(251,146,60,0.2)]">
            <Cpu className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Asset Telemetry
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Real-time fleet status
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Availability rate */}
          <div className="hidden flex-col items-end sm:flex">
            <div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
              {availabilityRate}
              <span className="text-sm font-bold text-muted-foreground">%</span>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Availability
            </div>
          </div>

          {/* Total assets */}
          <div className="flex flex-col items-end">
            <div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
              {kpis.vehicles}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Total Assets
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-border/40" />

      {/* Rings section */}
      <div className="flex items-end justify-around gap-4 px-6 py-8">
        {rings.map((ring, i) => (
          <motion.div
            key={ring.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-3"
          >
            <FleetMetricRing
              value={ring.value}
              total={total}
              label={ring.label}
              sublabel={ring.sublabel}
              colorClass={ring.colorClass}
              glowColor={ring.glowColor}
              size={ring.size}
              strokeWidth={ring.strokeWidth}
            />
            <div className="flex flex-col items-center gap-1">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${ring.accent}`}
              >
                {ring.label}
              </span>
              <div
                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${ring.bg} ${ring.accent}`}
              >
                {ring.value} unit{ring.value !== 1 ? "s" : ""}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom stats bar */}
      <div className="mx-6 mb-5 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 sm:grid-cols-4">
        {[
          {
            label: "Total Rés.",
            value: kpis.totalReservations,
            color: "text-foreground",
          },
          {
            label: "Aujourd'hui",
            value: kpis.reservationsToday,
            color: "text-primary",
          },
          {
            label: "Confirmées",
            value: kpis.confirmedReservations,
            color: "text-emerald-400",
          },
          {
            label: "En cours",
            value: kpis.inProgressReservations,
            color: "text-blue-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {stat.label}
            </div>
            <div className={`text-lg font-black tabular-nums ${stat.color}`}>
              {stat.value ?? 0}
            </div>
          </div>
        ))}
      </div>

      {/* Alert if too many in maintenance */}
      {maintenanceAlert && (
        <div className="px-6 pb-5">
          <AlertStrip
            variant="warning"
            message="High maintenance volume — more than 20% of fleet currently in service."
          />
        </div>
      )}

      {/* Subtle animated scan line at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] overflow-hidden">
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
        />
      </div>

      {/* Activity indicator */}
      <div className="absolute right-5 top-5 flex items-center gap-1.5 opacity-50">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Activity className="h-3 w-3 text-primary" />
        </motion.div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
          Live
        </span>
      </div>
    </div>
  );
}
