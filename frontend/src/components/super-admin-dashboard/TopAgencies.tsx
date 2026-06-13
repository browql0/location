/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — TOP AGENCES
   Top 5 agencies sorted by MRR (backend pre-sorted).
   Shows: logo/avatar · name · plan · MRR · growth · total revenue
          · reservations · clients · badges · progress bars
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { C, fadeUp, money, stagger } from "./tokens";
import { GlassCard, SectionHeader, StatusBadge, ProgressBar, EmptyState } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type Agency = SuperAdminDashboardData["topAgencies"][number];

/* ─── Badge configuration ───────────────────────────────────── */
const BADGE_MAP = {
  FAST_GROWING: { label: "🔥 Fast Growing", variant: "success" as const },
  STABLE:       { label: "💎 Stable",       variant: "info"    as const },
  RISK:         { label: "⚠ Risk",          variant: "warning" as const },
  CRITICAL:     { label: "🔴 Critical",      variant: "danger"  as const }
} as const;

/* ─── Single agency row ─────────────────────────────────────── */
function AgencyRow({ agency, rank, maxMrr }: { agency: Agency; rank: number; maxMrr: number }) {
  const badgeKey = agency.badges[0] ?? "STABLE";
  const badge    = BADGE_MAP[badgeKey];
  const isCrit   = badgeKey === "CRITICAL";
  const mrrPct   = maxMrr > 0 ? (agency.mrr / maxMrr) * 100 : 0;
  const growthPct = Math.min(100, Math.abs(agency.growth));
  const growthColor = agency.growth >= 0 ? C.success : C.danger;

  return (
    <motion.div
      variants={fadeUp}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.025]"
      style={{
        border:     `1px solid ${isCrit ? `${C.danger}40` : C.border}`,
        background: isCrit ? `${C.danger}06` : "rgba(255,255,255,0.015)"
      }}
    >
      {/* LEFT: Rank, Avatar, Name */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Rank badge */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
          style={{
            background: rank === 1
              ? `linear-gradient(135deg, ${C.accent}, #F97316)`
              : "rgba(255,255,255,0.07)",
            color: rank === 1 ? "#fff" : C.muted
          }}
        >
          {rank}
        </div>

        {/* Avatar */}
        {agency.logoUrl ? (
          <img
            alt={agency.name}
            src={agency.logoUrl}
            className="h-10 w-10 rounded-xl object-cover shrink-0"
            style={{ border: `1px solid ${C.border}` }}
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black"
            style={{
              background: `linear-gradient(135deg, ${C.accent}25, ${C.info}25)`,
              color:      C.text,
              border:     `1px solid ${C.border}`
            }}
          >
            {agency.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Name + plan + badge */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-bold text-sm truncate" style={{ color: C.text }}>
              {agency.name}
            </span>
            <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
          </div>
          <span className="text-xs" style={{ color: C.muted }}>
            {agency.plan}
          </span>
        </div>
      </div>

      {/* RIGHT: Stats & Progress Bars */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 lg:gap-8 justify-between sm:justify-end shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
        {/* MRR + Portfolio Share */}
        <div className="w-28 sm:w-32">
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>
              MRR
            </span>
            <span className="text-sm font-black leading-none" style={{ color: C.accent, fontVariantNumeric: "tabular-nums" }}>
              {money(agency.mrr)}
            </span>
          </div>
          <ProgressBar value={mrrPct} color={C.accent} delay={0.1 * rank} />
          <div className="text-[9px] mt-1 text-right" style={{ color: C.muted }}>
            {agency.revenueShare}% du revenu
          </div>
        </div>

        {/* Growth */}
        <div className="w-24 sm:w-28">
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>
              Croissance
            </span>
            <span className="text-sm font-bold leading-none" style={{ color: growthColor }}>
              {agency.growth > 0 ? "+" : ""}{agency.growth}%
            </span>
          </div>
          <ProgressBar value={growthPct} color={growthColor} delay={0.1 * rank + 0.05} />
          <div className="text-[9px] mt-1 text-right" style={{ color: C.muted }}>
            vs mois précédent
          </div>
        </div>

        {/* Extra text stats */}
        <div className="hidden lg:block text-[11px] text-right" style={{ color: C.muted }}>
          <div className="font-bold mb-0.5" style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>
            {money(agency.revenueTotal)}
          </div>
          <div>{agency.reservations} rés. · {agency.clients} cli.</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────────── */
export function TopAgencies({ agencies }: { agencies: SuperAdminDashboardData["topAgencies"] }) {
  const maxMrr = Math.max(...agencies.map(a => a.mrr), 1);

  return (
    <GlassCard className="p-6">
      <SectionHeader
        icon={Building2}
        title="Top Agences"
        subtitle="Classées automatiquement par MRR — Top 5"
        color={C.success}
      />
      {agencies.length === 0 ? (
        <EmptyState message="Aucune agence active pour le moment." />
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {agencies.map((agency, i) => (
            <AgencyRow
              key={agency.id}
              agency={agency}
              rank={i + 1}
              maxMrr={maxMrr}
            />
          ))}
        </motion.div>
      )}
    </GlassCard>
  );
}
