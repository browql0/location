/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — EXECUTIVE KPI BAR
   4 KPIs: MRR · ARR · Agences Actives · Churn
   Each shows: value · delta vs previous month · trend arrow
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { Building2, ShieldAlert, Target, Wallet } from "lucide-react";
import { C, fadeUp, money, compact } from "./tokens";
import { GlassCard, DeltaPill } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type HeaderData = SuperAdminDashboardData["header"];

function KpiCard({
  label,
  value,
  change,
  sub,
  icon: Icon,
  accentColor,
  glowColor,
  invert = false,
  index = 0,
  changeSuffix = "%"
}: {
  label:         string;
  value:         string;
  change:        number;
  sub:           string;
  icon:          React.ElementType;
  accentColor:   string;
  glowColor:     string;
  invert?:       boolean;
  index?:        number;
  changeSuffix?: string;
}) {
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="show">
      <GlassCard
        className="group p-5 cursor-default transition-all duration-300 hover:-translate-y-1"
        glow={glowColor}
      >
        {/* Top accent line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }}
        />

        {/* Icon + Delta */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `${accentColor}18`,
              border:     `1px solid ${accentColor}35`
            }}
          >
            <Icon className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <DeltaPill value={change} invert={invert} suffix={changeSuffix} />
        </div>

        {/* Label */}
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: C.muted }}
        >
          {label}
        </div>

        {/* Value */}
        <div
          className="text-3xl font-black tabular leading-none"
          style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </div>

        {/* Divider */}
        <div
          className="mt-3 h-px"
          style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }}
        />

        {/* Sub label */}
        <p className="mt-2 text-[11px]" style={{ color: C.muted }}>
          {sub}
        </p>
      </GlassCard>
    </motion.div>
  );
}

export function ExecutiveKpiBar({ header }: { header: HeaderData }) {
  const kpis = [
    {
      label:         "MRR",
      value:         money(header.mrr),
      change:        header.mrrChange,
      sub:           "vs mois précédent",
      icon:          Wallet,
      accentColor:   C.accent,      /* Orange — revenu stratégique */
      glowColor:     C.accentStrong,
      changeSuffix:  "%"
    },
    {
      label:        "ARR",
      value:        money(header.arr),
      change:       header.arrChange,
      sub:          "projection annuelle",
      icon:         Target,
      accentColor:  C.info,
      glowColor:    C.infoGlow,
      changeSuffix: "%"
    },
    {
      label:        "Agences Actives",
      value:        compact(header.activeAgencies),
      change:       header.activeAgenciesChange,
      sub:          "nouvelles ce mois",
      icon:         Building2,
      accentColor:  C.success,
      glowColor:    C.successGlow,
      changeSuffix: "%"
    },
    {
      label:        "Churn Rate",
      value:        `${header.churnRate}%`,
      change:       header.churnChange,
      sub:          "vs mois précédent",
      icon:         ShieldAlert,
      accentColor:  C.danger,
      glowColor:    C.dangerGlow,
      invert:       true,
      changeSuffix: "pt"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} {...k} index={i} />
      ))}
    </div>
  );
}
