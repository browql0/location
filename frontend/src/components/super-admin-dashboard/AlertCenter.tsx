/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — ALERT CENTER
   Sorted by severity: CRITICAL → WARNING → INFO
   Shows count + detail for each alert category
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { C, fadeUp, stagger } from "./tokens";
import { GlassCard, SectionHeader, EmptyState } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type AlertItem = SuperAdminDashboardData["alerts"]["items"][number];

const LEVEL_CONF = {
  CRITICAL: {
    icon:       AlertCircle,
    color:      C.danger,
    glow:       C.dangerGlow,
    border:     `${C.danger}40`,
    bg:         `${C.danger}08`,
    labelColor: C.danger
  },
  WARNING: {
    icon:       AlertTriangle,
    color:      C.warning,
    glow:       C.warningGlow,
    border:     `${C.warning}30`,
    bg:         `${C.warning}06`,
    labelColor: C.warning
  },
  INFO: {
    icon:       Info,
    color:      C.info,
    glow:       C.infoGlow,
    border:     `${C.info}20`,
    bg:         "rgba(255,255,255,0.02)",
    labelColor: C.muted
  }
} as const;

function AlertRow({ item, index }: { item: AlertItem; index: number }) {
  const conf = LEVEL_CONF[item.level];
  const Icon = conf.icon;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      className="flex items-start gap-4 rounded-xl p-4"
      style={{
        background: conf.bg,
        border:     `1px solid ${conf.border}`
      }}
    >
      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
        style={{ background: `${conf.color}18`, border: `1px solid ${conf.color}30` }}
      >
        <Icon className="h-4 w-4" style={{ color: conf.color }} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="text-[10px] font-black uppercase tracking-widest rounded-md px-1.5 py-0.5"
            style={{
              background:  `${conf.color}18`,
              color:        conf.color,
              border:      `1px solid ${conf.color}30`
            }}
          >
            {item.level}
          </span>
        </div>
        <div className="font-semibold text-sm" style={{ color: C.text }}>
          {item.title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: C.muted }}>
          {item.detail}
        </div>
      </div>

      {/* Count badge */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black"
        style={{
          background:           item.count === 0 ? "rgba(255,255,255,0.04)" : `${conf.color}18`,
          color:                item.count === 0 ? C.muted : conf.color,
          fontVariantNumeric:   "tabular-nums",
          border:               `1px solid ${item.count === 0 ? C.border : conf.color + "30"}`
        }}
      >
        {item.count}
      </div>
    </motion.div>
  );
}

export function AlertCenter({ alerts }: { alerts: SuperAdminDashboardData["alerts"] }) {
  const hasCritical = alerts.items.some(i => i.level === "CRITICAL" && i.count > 0);

  return (
    <GlassCard className="p-6" glow={hasCritical ? `${C.danger}30` : undefined}>
      <SectionHeader
        icon={AlertTriangle}
        title="Alert Center"
        subtitle="Urgences triées par niveau d'impact"
        color={hasCritical ? C.danger : C.warning}
      />

      {alerts.items.length === 0 ? (
        <EmptyState message="✅ Aucune alerte active" />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
          {alerts.items.map((item, i) => (
            <AlertRow key={item.id} item={item} index={i} />
          ))}
        </motion.div>
      )}
    </GlassCard>
  );
}
