/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — BUSINESS RISK SCORE
   Circular SVG gauge + risk drivers breakdown.
   Color: green ≥ 75 · orange 50-74 · red < 50
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { C } from "./tokens";
import { GlassCard, SectionHeader } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type RiskData = SuperAdminDashboardData["risk"];

/* ─── SVG Gauge ─────────────────────────────────────────────── */
function RiskGauge({ score, color }: { score: number; color: string }) {
  const radius       = 50;
  const stroke       = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset    = circumference * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
      <svg width="130" height="130" className="-rotate-90">
        {/* Track */}
        <circle
          cx="65" cy="65" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Value arc */}
        <motion.circle
          cx="65" cy="65" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-black leading-none"
          style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}
        >
          {score}
        </span>
        <span className="text-[10px] font-bold mt-0.5" style={{ color: C.muted }}>/ 100</span>
      </div>
    </div>
  );
}

/* ─── Driver row ─────────────────────────────────────────────── */
function DriverRow({ label, value }: { label: string; value: number }) {
  const isOk    = value === 0;
  const color   = isOk ? C.success : C.danger;
  const bg      = isOk ? C.successGlow : C.dangerGlow;
  const border  = isOk ? `${C.success}30` : `${C.danger}30`;
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm"
      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}` }}
    >
      <span style={{ color: C.muted }}>{label}</span>
      <span
        className="font-bold rounded-lg px-2 py-0.5 text-xs"
        style={{ background: bg, color, border: `1px solid ${border}`, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────── */
export function BusinessRiskScore({ risk }: { risk: RiskData }) {
  const color = risk.level === "LOW"
    ? C.success
    : risk.level === "MEDIUM"
    ? C.warning
    : C.danger;

  return (
    <GlassCard className="p-6" glow={`${color}40`}>
      <SectionHeader
        icon={ShieldCheck}
        title="Business Risk Score"
        subtitle="Santé globale de la plateforme"
        color={color}
      />

      {/* Gauge + label */}
      <div className="flex items-center gap-6 mb-5">
        <RiskGauge score={risk.score} color={color} />
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold mb-2"
            style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
          >
            <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
            {risk.label}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
            Basé sur suspensions,<br />
            paiements, expirations,<br />
            churn et incidents
          </p>
        </div>
      </div>

      {/* Risk drivers */}
      <div className="space-y-2">
        {risk.drivers.map(d => (
          <DriverRow key={d.label} label={d.label} value={d.value} />
        ))}
      </div>
    </GlassCard>
  );
}
