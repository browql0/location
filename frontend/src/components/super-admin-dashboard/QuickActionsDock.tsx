/* ═══════════════════════════════════════════════════════════════
   SECTION 12 — QUICK ACTIONS DOCK
   Fixed floating dock at bottom-center on desktop.
   Glassmorphism premium feel.
═══════════════════════════════════════════════════════════════ */
import { Link } from "react-router-dom";
import { Building2, BadgeCheck, Layers3, ShieldAlert, Download, Plus } from "lucide-react";
import { C } from "./tokens";

const ACTIONS = [
  { label: "Agences",       href: "/super-admin/agencies",      icon: Building2  },
  { label: "Abonnements",   href: "/super-admin/subscriptions", icon: BadgeCheck },
  { label: "Plans",         href: "/super-admin/plans",         icon: Layers3    },
  { label: "Incidents",     href: "/super-admin/agencies",      icon: ShieldAlert },
  { label: "Exporter",      href: "#",                          icon: Download   }
];

export function QuickActionsDock() {
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-1 rounded-2xl p-2 md:flex"
      style={{
        background:     "rgba(9,9,11,0.90)",
        border:         `1px solid ${C.borderLight}`,
        boxShadow:      "0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)"
      }}
    >
      {ACTIONS.map(a => {
        const Icon = a.icon;
        return (
          <Link
            key={a.label}
            to={a.href}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: C.muted }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = C.accentGlow;
              (e.currentTarget as HTMLElement).style.color      = C.accent;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color      = C.muted;
            }}
            title={a.label}
          >
            <Icon className="h-4.5 w-4.5" />
            {/* Tooltip */}
            <span
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[11px] font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{
                background: C.surface,
                border:     `1px solid ${C.borderLight}`,
                color:      C.text,
                boxShadow:  "0 8px 24px rgba(0,0,0,0.5)"
              }}
            >
              {a.label}
            </span>
          </Link>
        );
      })}

      {/* Divider */}
      <div className="h-6 w-px mx-1" style={{ background: C.border }} />

      {/* Primary CTA */}
      <Link
        to="/super-admin/agencies"
        className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:opacity-90 hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${C.accent}, #F97316)`,
          color:      "#fff",
          boxShadow:  `0 4px 16px ${C.accentGlow}`
        }}
        title="Nouvelle agence"
      >
        <Plus className="h-5 w-5" />
      </Link>
    </div>
  );
}
