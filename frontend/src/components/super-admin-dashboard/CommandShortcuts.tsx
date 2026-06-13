import { Link } from "react-router-dom";
import { Building2, BadgeCheck, Layers3, Plus, Zap } from "lucide-react";
import { C, fadeUp, stagger } from "./tokens";
import { GlassCard, SectionHeader } from "./ui";
import { motion } from "framer-motion";

const ACTIONS = [
  { label: "Nouvelle Agence",       href: "/super-admin/agencies",      icon: Plus,       primary: true },
  { label: "Gérer les Agences",     href: "/super-admin/agencies",      icon: Building2,  primary: false },
  { label: "Abonnements & Limites", href: "/super-admin/subscriptions", icon: BadgeCheck, primary: false },
  { label: "Plans & Tarification",  href: "/super-admin/plans",         icon: Layers3,    primary: false },
];

export function CommandShortcuts() {
  return (
    <GlassCard className="p-6">
      <SectionHeader 
        icon={Zap} 
        title="Actions Rapides" 
        subtitle="Raccourcis d'administration" 
        color={C.accent} 
      />
      <motion.div 
        variants={stagger} 
        initial="hidden" 
        animate="show" 
        className="grid sm:grid-cols-2 gap-3 mt-4"
      >
        {ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div key={i} variants={fadeUp}>
              <Link
                to={a.href}
                className="group relative flex items-center justify-between gap-4 rounded-xl p-4 transition-all duration-300 overflow-hidden"
                style={{
                  background: a.primary ? "rgba(255, 122, 0, 0.04)" : "rgba(255,255,255,0.015)",
                  border: `1px solid ${a.primary ? "rgba(255, 122, 0, 0.15)" : C.border}`
                }}
              >
                {/* Subtle background gradient on hover */}
                <div 
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                  style={{ 
                    background: a.primary 
                      ? `linear-gradient(135deg, rgba(255,122,0,0.08), transparent)` 
                      : `linear-gradient(135deg, rgba(255,255,255,0.04), transparent)` 
                  }}
                />

                <div className="flex items-center gap-3 relative z-10">
                  <div 
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ 
                      background: a.primary ? `linear-gradient(135deg, ${C.accent}, #F97316)` : "rgba(255,255,255,0.04)", 
                      color: a.primary ? "#fff" : C.mutedLight,
                      boxShadow: a.primary ? `0 8px 16px ${C.accentGlow}` : "inset 0 1px 0 rgba(255,255,255,0.05)",
                      border: a.primary ? "none" : `1px solid ${C.borderLight}`
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span 
                    className="text-sm font-bold tracking-wide transition-colors duration-200" 
                    style={{ color: a.primary ? C.accent : C.text }}
                  >
                    {a.label}
                  </span>
                </div>

                {/* Arrow icon sliding in */}
                <div className="relative z-10 shrink-0 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: a.primary ? C.accent : C.muted }}>
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </GlassCard>
  );
}
