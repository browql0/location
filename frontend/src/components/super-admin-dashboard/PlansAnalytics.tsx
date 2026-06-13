/* ═══════════════════════════════════════════════════════════════
   SECTION 10 — PLANS ANALYTICS
   Per-plan breakdown: agency count · MRR · revenue share
   Premium progress bars, no donuts.
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { Layers3 } from "lucide-react";
import { C, money, fadeUp, stagger } from "./tokens";
import { GlassCard, SectionHeader, ProgressBar, EmptyState } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type PlanDist = SuperAdminDashboardData["charts"]["planDistribution"];

const PLAN_COLORS = [C.accent, C.info, C.success, C.purple, C.warning];

function PlanRow({
  plan,
  color,
  maxMrr,
  index
}: {
  plan:   PlanDist[number];
  color:  string;
  maxMrr: number;
  index:  number;
}) {
  const mrrPct = maxMrr > 0 ? (plan.mrr / maxMrr) * 100 : 0;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}` }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Count badge */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black shrink-0"
            style={{
              background:          `${color}18`,
              color,
              border:              `1px solid ${color}35`,
              fontVariantNumeric:  "tabular-nums"
            }}
          >
            {plan.value}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: C.text }}>
              {plan.name}
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
              {plan.value} agence{plan.value > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="text-right">
          <div
            className="font-bold text-sm"
            style={{ color, fontVariantNumeric: "tabular-nums" }}
          >
            {money(plan.mrr)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>
            {plan.percentage}% du revenu
          </div>
        </div>
      </div>

      {/* MRR bar */}
      <ProgressBar value={mrrPct} color={color} delay={0.15 + index * 0.08} />
    </motion.div>
  );
}

export function PlansAnalytics({
  plans
}: {
  plans: PlanDist;
}) {
  const maxMrr = Math.max(...plans.map(p => p.mrr), 1);

  return (
    <GlassCard className="p-6">
      <SectionHeader
        icon={Layers3}
        title="Plans Analytics"
        subtitle="Distribution des agences et MRR par plan"
        color={C.purple}
      />

      {plans.length === 0 ? (
        <EmptyState message="Aucun abonnement actif par plan." />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {plans.map((plan, i) => (
            <PlanRow
              key={plan.name}
              plan={plan}
              color={PLAN_COLORS[i % PLAN_COLORS.length]}
              maxMrr={maxMrr}
              index={i}
            />
          ))}
        </motion.div>
      )}
    </GlassCard>
  );
}
