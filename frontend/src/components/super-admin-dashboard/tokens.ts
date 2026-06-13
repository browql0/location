/* ═══════════════════════════════════════════════════════════════
   RENTORA EXECUTIVE COMMAND CENTER — DESIGN TOKENS
   Single source of truth for colors, typography and formatters.
═══════════════════════════════════════════════════════════════ */

export const C = {
  /* Backgrounds */
  bg:           "#09090B",
  surface:      "#111827",
  surfaceAlt:   "#0F1623",
  surfaceHover: "#161f2e",

  /* Borders */
  border:       "#1F2937",
  borderLight:  "#263348",

  /* Text */
  text:         "#F8FAFC",
  muted:        "#94A3B8",
  mutedLight:   "#64748B",

  /* Semantic colours — use intentionally */
  success:      "#10B981",   /* Agences actives, croissance positive, risque faible */
  successGlow:  "rgba(16,185,129,0.15)",
  warning:      "#F59E0B",   /* Expirations < 7j, risque moyen */
  warningGlow:  "rgba(245,158,11,0.15)",
  danger:       "#EF4444",   /* CRITICAL, suspension, churn élevé */
  dangerGlow:   "rgba(239,68,68,0.15)",
  info:         "#3B82F6",
  infoGlow:     "rgba(59,130,246,0.15)",
  purple:       "#8B5CF6",
  purpleGlow:   "rgba(139,92,246,0.15)",

  /* Rentora Accent — orange, rare, stratégique */
  accent:       "#FF7A00",   /* MRR, revenus, CTA, croissance */
  accentGlow:   "rgba(255,122,0,0.12)",
  accentStrong: "rgba(255,122,0,0.25)",
  accentMid:    "#F97316",
} as const;

/* ─── Typography scale ─────────────────────────────────────── */
export const FONT = {
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
} as const;

/* ─── Framer Motion variants ────────────────────────────────── */
import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   (i: number = 0) => ({
    opacity:    1,
    y:          0,
    transition: {
      delay:    i * 0.06,
      duration: 0.45,
      ease:     "easeOut"
    }
  })
};

export const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } }
};

/* ─── Formatters ────────────────────────────────────────────── */
export function money(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return `${Math.round(v).toLocaleString("fr-MA")} MAD`;
}

export function compact(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return Math.round(v).toLocaleString("fr-MA");
}

export function fDate(v: string | null | undefined): string {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("fr-MA", {
      day:   "2-digit",
      month: "short",
      year:  "numeric"
    });
  } catch {
    return "—";
  }
}

export function fTime(v: string | null | undefined): string {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("fr-MA", {
      day:    "2-digit",
      month:  "short",
      hour:   "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

export function pct(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return `${v}%`;
}
