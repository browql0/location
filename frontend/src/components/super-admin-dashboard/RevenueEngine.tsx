/* ═══════════════════════════════════════════════════════════════
   SECTION 3 — REVENUE ENGINE
   Consolidated financial health view.
   Left: metric bars (MRR / ARR / Croissance / Conversion / Churn)
   Right: MRR area chart
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { C, fadeUp, money } from "./tokens";
import { GlassCard, SectionHeader, ProgressBar } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type HealthData = SuperAdminDashboardData["businessHealth"];
type MrrChart   = SuperAdminDashboardData["charts"]["mrrEvolution"];

function MetricRow({
  label,
  value,
  pct,
  color,
  index
}: {
  label:  string;
  value:  string;
  pct:    number;
  color:  string;
  index:  number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: C.muted }}
        >
          {label}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
      </div>
      <ProgressBar value={pct} color={color} delay={0.2 + index * 0.08} />
    </div>
  );
}

export function RevenueEngine({
  health,
  mrrChart
}: {
  health:   HealthData;
  mrrChart: MrrChart;
}) {
  /* Compute a safe max for % bars */
  const maxMrr = Math.max(health.arr / 12, health.mrr, 1);

  const metrics = [
    {
      label: "MRR",
      value: money(health.mrr),
      pct:   Math.min(100, Math.round((health.mrr / maxMrr) * 100)),
      color: C.accent   /* Orange — revenue */
    },
    {
      label: "ARR",
      value: money(health.arr),
      pct:   100,
      color: C.info
    },
    {
      label: "Croissance Mensuelle",
      value: `${health.monthlyGrowth}%`,
      pct:   Math.min(100, Math.abs(health.monthlyGrowth)),
      color: health.monthlyGrowth >= 0 ? C.success : C.danger
    },
    {
      label: "Conversion Trials",
      value: `${health.trialConversionRate}%`,
      pct:   health.trialConversionRate,
      color: C.purple
    },
    {
      label: "Churn Rate",
      value: `${health.churnRate}%`,
      pct:   Math.min(100, health.churnRate * 5),   /* amplify for visibility */
      color: C.danger
    }
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
      <GlassCard className="p-6">
        <SectionHeader
          icon={TrendingUp}
          title="Revenue Engine"
          subtitle="Santé financière en temps réel"
          color={C.accent}
        />

        <div className="grid gap-8 xl:grid-cols-[1fr_1.6fr]">
          {/* Metric bars */}
          <div className="space-y-5">
            {metrics.map((m, i) => (
              <MetricRow key={m.label} {...m} index={i} />
            ))}
          </div>

          {/* MRR area chart */}
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: C.muted }}
            >
              Évolution MRR
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={mrrChart}
                  margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mrrGradRE" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%"   stopColor={C.accent} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={C.accent} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
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
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: C.muted, fontSize: 10 }}
                    width={42}
                    tickFormatter={v => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background:   C.surface,
                      border:       `1px solid ${C.borderLight}`,
                      borderRadius: 10,
                      color:        C.text,
                      boxShadow:    "0 16px 48px rgba(0,0,0,0.6)",
                      fontSize:     12
                    }}
                    cursor={{ stroke: `${C.accent}30`, strokeWidth: 1 }}
                    formatter={(v: number) => [`${money(v)}`, "MRR"]}
                  />
                  <Area
                    dataKey="mrr"
                    fill="url(#mrrGradRE)"
                    name="MRR"
                    stroke={C.accent}
                    strokeWidth={2.5}
                    type="monotone"
                    dot={false}
                    activeDot={{ r: 4, fill: C.accent, stroke: C.surface, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
