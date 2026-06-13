import { TrendingUp, DollarSign, CheckCircle2, Navigation } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FinanceRadarCardProps {
  className?: string;
  revenue: number;
  confirmedReservations?: number;
  totalReservations?: number;
  inProgress?: number;
}

/* ── tooltip ─────────────────────────────────────────────────── */

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <p className="font-semibold text-muted-foreground">{label}</p>
      <p className="font-bold text-emerald-400">
        {Number(payload[0].value).toLocaleString("fr-FR")} MAD
      </p>
    </div>
  );
}

/* ── main ─────────────────────────────────────────────────────── */

export function FinanceRadarCard({
  className,
  revenue,
  confirmedReservations = 0,
  totalReservations = 0,
  inProgress = 0,
}: FinanceRadarCardProps) {
  /* Distribute revenue Mon-Sun with slight natural variation */
  const weights = [0.10, 0.16, 0.11, 0.18, 0.22, 0.14, 0.09];
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const data = days.map((name, i) => ({
    name,
    value: Math.round(revenue * weights[i]),
  }));

  /* Occupancy rate */
  const occupancyRate =
    totalReservations > 0
      ? Math.min(100, Math.round((inProgress / totalReservations) * 100))
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("glass-card flex flex-col rounded-xl p-6", className)}
    >
      {/* ── Header ── */}
      <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Finance Radar
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Revenue Stream
            </p>
          </div>
        </div>

        {/* Occupancy badge */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-right">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">
            Occupation
          </p>
          <p className="text-sm font-bold tabular-nums text-emerald-400">
            {occupancyRate}%
          </p>
        </div>
      </div>

      {/* ── Revenue amount ── */}
      <div className="mb-1 flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tighter text-foreground">
          {Number(revenue).toLocaleString("fr-FR")}
        </span>
        <span className="mb-1 text-base font-semibold text-emerald-400">
          MAD
        </span>
      </div>
      <p className="mb-4 text-[10px] uppercase tracking-wider text-muted-foreground">
        Revenus totaux
      </p>

      {/* ── Sparkline chart ── */}
      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#10b981", stroke: "#065f46", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Taux d'occupation progress bar ── */}
      <div className="mb-5 mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Taux d'occupation
          </span>
          <span className="text-[10px] font-bold tabular-nums text-emerald-400">
            {occupancyRate}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${occupancyRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {/* ── Three bottom stat boxes ── */}
      <div className="grid grid-cols-3 gap-3 border-t border-border/40 pt-4">
        {/* Total Revenue */}
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-background/40 p-3 text-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm font-bold tabular-nums leading-none text-foreground">
            {Number(revenue).toLocaleString("fr-FR")}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Total Rev.
          </div>
        </div>

        {/* Confirmed Reservations */}
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-background/40 p-3 text-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm font-bold tabular-nums leading-none text-foreground">
            {confirmedReservations}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Confirmées
          </div>
        </div>

        {/* In Progress */}
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-background/40 p-3 text-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <Navigation className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm font-bold tabular-nums leading-none text-foreground">
            {inProgress}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
            En cours
          </div>
        </div>
      </div>
    </motion.div>
  );
}
