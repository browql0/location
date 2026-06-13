/* ═══════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES — used across all dashboard sections
═══════════════════════════════════════════════════════════════ */
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { C, fadeUp } from "./tokens";

/* ─── GlassCard ─────────────────────────────────────────────── */
export function GlassCard({
  children,
  className,
  glow,
  style
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{
        background:   C.surface,
        border:       `1px solid ${C.border}`,
        boxShadow:    glow
          ? `0 0 0 1px ${glow}, 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
          : "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

/* ─── SectionHeader ─────────────────────────────────────────── */
export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  color = C.muted,
  action
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  color?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `${color}1A`,
            border:     `1px solid ${color}35`
          }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        <div>
          <h2
            className="text-sm font-bold tracking-tight"
            style={{ color: C.text }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ─── StatusBadge ────────────────────────────────────────────── */
type BadgeVariant = "success" | "warning" | "danger" | "info" | "purple" | "muted";

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: C.successGlow, text: C.success, border: `${C.success}40` },
  warning: { bg: C.warningGlow, text: C.warning, border: `${C.warning}40` },
  danger:  { bg: C.dangerGlow,  text: C.danger,  border: `${C.danger}40`  },
  info:    { bg: C.infoGlow,    text: C.info,     border: `${C.info}40`   },
  purple:  { bg: C.purpleGlow,  text: C.purple,   border: `${C.purple}40` },
  muted:   { bg: "rgba(148,163,184,0.1)", text: C.muted, border: "rgba(148,163,184,0.2)" }
};

export function StatusBadge({
  children,
  variant = "muted"
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  const s = BADGE_STYLES[variant];
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

/* ─── DeltaPill ─────────────────────────────────────────────── */
export function DeltaPill({
  value,
  invert = false,
  suffix = "%"
}: {
  value: number;
  invert?: boolean;
  suffix?: string;
}) {
  const good  = invert ? value <= 0 : value >= 0;
  const Icon  = value >= 0 ? ArrowUpRight : ArrowDownRight;
  const color = good ? C.success : C.danger;
  const glow  = good ? C.successGlow : C.dangerGlow;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-bold"
      style={{
        background: glow,
        color,
        border: `1px solid ${color}30`
      }}
    >
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
}

/* ─── ProgressBar ────────────────────────────────────────────── */
export function ProgressBar({
  value,
  color,
  delay = 0
}: {
  value: number;
  color: string;
  delay?: number;
}) {
  const pct = Math.max(2, Math.min(100, value));
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          boxShadow:  `0 0 10px ${color}50`
        }}
      />
    </div>
  );
}

/* ─── Skeleton loaders ──────────────────────────────────────── */
export function SkeletonBlock({
  className,
  style
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl", className)}
      style={{ background: C.surface, ...style }}
    />
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-32 items-center justify-center text-sm"
      style={{ color: C.muted }}
    >
      {message}
    </div>
  );
}

/* ─── Animated counter item ─────────────────────────────────── */
export function FadeUpItem({
  children,
  index = 0,
  className
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}
