/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — PREDICTIVE PANEL
   Next-month projections with calculation basis explanation.
   Answers: Combien vais-je gagner le mois prochain ?
═══════════════════════════════════════════════════════════════ */
import { Zap, TrendingUp, RefreshCcw, UserCheck } from "lucide-react";
import { C, money, compact } from "./tokens";
import { GlassCard, SectionHeader, DeltaPill } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type PredictiveData = SuperAdminDashboardData["predictive"];

function PredictionCard({
  label,
  value,
  highlight = false,
  delta,
  icon: Icon,
  color
}: {
  label:      string;
  value:      string;
  highlight?: boolean;
  delta?:     number;
  icon:       React.ElementType;
  color:      string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${color}18, ${color}08)`
          : "rgba(255,255,255,0.03)",
        border:     `1px solid ${highlight ? color + "40" : C.border}`
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: C.muted }}
        >
          {label}
        </span>
      </div>
      <div
        className="text-2xl font-black leading-none mb-1"
        style={{
          color:              highlight ? color : C.text,
          fontVariantNumeric: "tabular-nums"
        }}
      >
        {value}
      </div>
      {delta !== undefined && <DeltaPill value={delta} />}
    </div>
  );
}

export function PredictivePanel({ predictive }: { predictive: PredictiveData }) {
  return (
    <GlassCard className="p-6">
      <SectionHeader
        icon={Zap}
        title="Predictive Panel"
        subtitle="Projections basées sur les données réelles actuelles"
        color={C.purple}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <PredictionCard
          label="Prévision MRR"
          value={money(predictive.nextMonthMrr)}
          highlight
          delta={predictive.estimatedGrowth}
          icon={TrendingUp}
          color={C.accent}
        />
        <PredictionCard
          label="Prévision ARR"
          value={money(predictive.nextMonthArr)}
          icon={TrendingUp}
          color={C.info}
        />
        <PredictionCard
          label="Renouvellements attendus"
          value={compact(predictive.expectedRenewals)}
          icon={RefreshCcw}
          color={C.success}
        />
        <PredictionCard
          label="Trials → Conversion"
          value={compact(predictive.likelyConversions)}
          icon={UserCheck}
          color={C.purple}
        />
      </div>

      {/* Calculation basis */}
      {predictive.basis.length > 0 && (
        <div
          className="mt-4 rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: C.muted }}
          >
            Base de calcul
          </div>
          <div className="flex flex-wrap gap-2">
            {predictive.basis.map(b => (
              <span
                key={b}
                className="rounded-lg px-2.5 py-1 text-[11px]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color:      C.muted,
                  border:     `1px solid ${C.border}`
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
