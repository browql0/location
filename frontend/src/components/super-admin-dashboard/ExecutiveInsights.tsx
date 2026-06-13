/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — EXECUTIVE INSIGHTS
   Hero banner. First thing the Super Admin sees.
   Answers: Quelle est la situation globale en ce moment ?
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { C, fadeUp } from "./tokens";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";
import {
  getSuperAdminDashboard,
  searchSuperAdminDashboard,
  type SuperAdminSearchResult
} from "@/features/saas/saas-api";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

/* ─── Global Search ─────────────────────────────────────────── */
function GlobalSearch() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SuperAdminSearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const h = window.setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchSuperAdminDashboard(query)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 280);
    return () => window.clearTimeout(h);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div
        className="flex items-center gap-3 rounded-xl px-4 h-11 transition-all duration-300"
        style={{
          background:  focused ? `${C.accent}0D` : "rgba(255,255,255,0.04)",
          border:      `1px solid ${focused ? C.accentStrong : C.border}`,
          boxShadow:   focused ? `0 0 0 3px ${C.accentGlow}` : "none"
        }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: focused ? C.accent : C.muted }} />
        <input
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: C.text }}
          placeholder="Rechercher agence, client, véhicule..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
        {loading && (
          <div
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: `${C.accent}40`, borderTopColor: "transparent" }}
          />
        )}
      </div>

      {query.trim().length >= 2 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-xl"
          style={{
            background: C.surfaceAlt,
            border:     `1px solid ${C.borderLight}`,
            boxShadow:  "0 24px 80px rgba(0,0,0,0.7)"
          }}
        >
          {results.length > 0 ? results.map(r => (
            <Link
              key={`${r.type}-${r.id}`}
              to={r.href}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/[0.04]"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: C.text }}>{r.title}</div>
                <div className="text-xs mt-0.5" style={{ color: C.muted }}>{r.subtitle ?? r.type}</div>
              </div>
              <span
                className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{ background: C.infoGlow, color: C.info, border: `1px solid ${C.info}30` }}
              >
                {r.type}
              </span>
            </Link>
          )) : (
            <div className="px-4 py-6 text-center text-sm" style={{ color: C.muted }}>
              Aucun résultat trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { TrendingUp, AlertCircle, AlertTriangle, Info } from "lucide-react";

/* ─── Insight chip ──────────────────────────────────────────── */
function InsightChip({ text, index }: { text: string; index: number }) {
  /* Detect type from keywords */
  const isRevenue   = /mrr|arr|revenu|hausse|baisse/i.test(text);
  const isDanger    = /critique|suspendu|bloqué|risque élevé/i.test(text);
  const isWarning   = /expire|expir|echec|attention/i.test(text);
  const accentColor = isRevenue ? C.accent : isDanger ? C.danger : isWarning ? C.warning : C.success;
  const Icon        = isRevenue ? TrendingUp : isDanger ? AlertCircle : isWarning ? AlertTriangle : Info;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative flex flex-col justify-between gap-4 rounded-xl p-4 overflow-hidden"
      style={{
        background:   "rgba(255,255,255,0.03)",
        border:       `1px solid ${C.border}`,
        backdropFilter: "blur(8px)"
      }}
    >
      {/* Background watermark icon */}
      <Icon
        className="absolute -bottom-3 -right-3 h-16 w-16 opacity-[0.07] pointer-events-none"
        style={{ color: accentColor }}
      />

      <div className="flex items-center gap-3 relative z-10">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div
          className="h-1 w-full rounded-full opacity-40"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />
      </div>

      <p className="text-sm leading-relaxed font-medium relative z-10" style={{ color: C.text }}>
        {text}
      </p>
    </motion.div>
  );
}

/* ─── Main Export ────────────────────────────────────────────── */
export function ExecutiveInsights({
  insights
}: {
  insights: SuperAdminDashboardData["insights"];
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: C.surfaceAlt,
        border:     `1px solid ${C.border}`,
        boxShadow:  "0 32px 80px rgba(0,0,0,0.5)"
      }}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 55% 80% at 85% 50%, ${C.accentGlow} 0%, transparent 65%),
                       radial-gradient(ellipse 40% 60% at 5% 20%, ${C.infoGlow} 0%, transparent 60%)`
        }}
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px),
                            linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
          backgroundSize: "44px 44px"
        }}
      />

      <div className="relative z-10 p-7">
        {/* Header row */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            {/* Label chip */}
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{
                background: C.accentGlow,
                border:     `1px solid ${C.accentStrong}`,
                color:      C.accent
              }}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              RENTORA INSIGHTS
              <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            </div>

            <h1
              className="text-2xl font-black tracking-tight md:text-3xl"
              style={{ color: C.text }}
            >
              Executive{" "}
              <span
                style={{
                  background:              `linear-gradient(135deg, ${C.accent}, #F97316)`,
                  WebkitBackgroundClip:    "text",
                  WebkitTextFillColor:     "transparent"
                }}
              >
                Command Center
              </span>
            </h1>
            <p className="mt-1 text-sm" style={{ color: C.muted }}>
              Données en temps réel · Analyse automatique
            </p>
          </div>

          <GlobalSearch />
        </div>

        {/* Insight chips grid */}
        {insights.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {insights.map((insight, i) => (
              <InsightChip key={insight} text={insight} index={i} />
            ))}
          </div>
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(255,255,255,0.03)", color: C.muted, border: `1px solid ${C.border}` }}
          >
            <Sparkles className="h-4 w-4" />
            Aucune donnée d'insight disponible.
          </div>
        )}
      </div>
    </motion.div>
  );
}
