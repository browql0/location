/* ═══════════════════════════════════════════════════════════════
   SECTION 9 — GROWTH ANALYTICS
   Multi-series line chart: MRR · Agences · Clients · Réservations
   Period selector: 7d · 30d · 90d · 1y
   Data is real-time from backend per selected range.
═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { C, fadeUp, money } from "./tokens";
import { GlassCard, SectionHeader } from "./ui";
import { motion } from "framer-motion";
import type { SuperAdminDashboardData, DashboardRange } from "@/features/saas/saas-api";

const RANGES: { key: DashboardRange; label: string }[] = [
  { key: "7d",  label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "90d", label: "90 jours" },
  { key: "1y",  label: "1 an" }
];

const SERIES = [
  { key: "mrr",          label: "MRR",          color: C.accent  },
  { key: "agences",      label: "Agences",       color: C.success },
  { key: "clients",      label: "Clients",       color: C.info    },
  { key: "reservations", label: "Réservations",  color: C.warning }
];

export function GrowthAnalytics({
  charts,
  range,
  setRange
}: {
  charts:    SuperAdminDashboardData["charts"];
  range:     DashboardRange;
  setRange:  (r: DashboardRange) => void;
}) {
  /* Merge all 4 series into a single array indexed by period */
  const data = useMemo(() =>
    charts.agencyGrowth.map((point, i) => ({
      month:         point.month,
      mrr:           charts.mrrEvolution[i]?.mrr          ?? 0,
      agences:       point.agencies,
      clients:       charts.clients[i]?.clients            ?? 0,
      reservations:  charts.reservations[i]?.reservations  ?? 0
    })),
    [charts]
  );

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6}>
      <GlassCard className="p-6">
        {/* Header + range selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <SectionHeader
            icon={BarChart3}
            title="Growth Analytics"
            subtitle="MRR · Agences · Clients · Réservations"
            color={C.info}
          />

          <div
            className="flex gap-1 rounded-xl p-1 self-start shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}
          >
            {RANGES.map(r => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200"
                style={{
                  background: range === r.key ? C.accent : "transparent",
                  color:      range === r.key ? "#fff"   : C.muted,
                  boxShadow:  range === r.key ? `0 0 12px ${C.accentGlow}` : "none"
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 mb-5">
          {SERIES.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div
                className="h-2 w-5 rounded-full"
                style={{ background: s.color, boxShadow: `0 0 6px ${s.color}80` }}
              />
              <span className="text-xs" style={{ color: C.muted }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: C.muted, fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: C.muted, fontSize: 10 }}
                width={46}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: C.muted, fontSize: 10 }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background:   C.surface,
                  border:       `1px solid ${C.borderLight}`,
                  borderRadius: 10,
                  color:        C.text,
                  boxShadow:    "0 20px 60px rgba(0,0,0,0.6)",
                  fontSize:     12
                }}
                cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
                formatter={(v: number, name: string) => {
                  const s = SERIES.find(s => s.label === name);
                  if (name === "MRR") return [money(v), name];
                  return [v, s?.label ?? name];
                }}
              />
              {SERIES.map(s => (
                <Line
                  key={s.key}
                  yAxisId={s.key === "mrr" ? "left" : "right"}
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  type="monotone"
                  dot={false}
                  activeDot={{ r: 4, fill: s.color, stroke: C.surface, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </motion.div>
  );
}
