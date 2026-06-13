/* ═══════════════════════════════════════════════════════════════
   RENTORA EXECUTIVE COMMAND CENTER V2
   Composer — assembles all 12 dashboard sections.
   All data comes from GET /dashboard/super-admin?range=...
   No mock data. If backend unavailable → graceful degradation.
═══════════════════════════════════════════════════════════════ */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSuperAdminDashboard, type DashboardRange } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { C } from "../super-admin-dashboard/tokens";

/* ─── Section components ────────────────────────────────────── */
import { ExecutiveInsights }  from "../super-admin-dashboard/ExecutiveInsights";
import { ExecutiveKpiBar }    from "../super-admin-dashboard/ExecutiveKpiBar";
import { RevenueEngine }      from "../super-admin-dashboard/RevenueEngine";
import { TopAgencies }        from "../super-admin-dashboard/TopAgencies";
import { BusinessRiskScore }  from "../super-admin-dashboard/BusinessRiskScore";
import { AlertCenter }        from "../super-admin-dashboard/AlertCenter";
import { ExpirationsCenter }  from "../super-admin-dashboard/ExpirationsCenter";
import { PredictivePanel }    from "../super-admin-dashboard/PredictivePanel";
import { GrowthAnalytics }    from "../super-admin-dashboard/GrowthAnalytics";
import { PlansAnalytics }     from "../super-admin-dashboard/PlansAnalytics";
import { PlatformActivity }   from "../super-admin-dashboard/PlatformActivity";
import { CommandShortcuts }   from "../super-admin-dashboard/CommandShortcuts";

/* ─── Skeleton loader ───────────────────────────────────────── */
function SkeletonPulse({ h }: { h: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${h}`}
      style={{ background: C.surface }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-32" style={{ background: C.bg }}>
      <SkeletonPulse h="h-52" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} h="h-36" />
        ))}
      </div>
      <SkeletonPulse h="h-64" />
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <SkeletonPulse h="h-80" />
        <div className="space-y-5">
          <SkeletonPulse h="h-36" />
          <SkeletonPulse h="h-36" />
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <SkeletonPulse h="h-48" />
        <SkeletonPulse h="h-48" />
      </div>
      <SkeletonPulse h="h-96" />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <SkeletonPulse h="h-64" />
        <SkeletonPulse h="h-64" />
      </div>
    </div>
  );
}

/* ─── Error state ────────────────────────────────────────────── */
function DashboardError({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: C.bg }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ background: C.surface, border: `1px solid ${C.danger}40` }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: C.dangerGlow, border: `1px solid ${C.danger}40` }}
        >
          <span className="text-2xl">⚠</span>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: C.text }}>
          Données indisponibles
        </h2>
        <p className="text-sm" style={{ color: C.muted }}>
          {message}
        </p>
      </div>
    </div>
  );
}

/* ─── Root component ─────────────────────────────────────────── */
export function SuperAdminDashboard() {
  const [range, setRange] = useState<DashboardRange>("30d");

  const query = useQuery({
    queryKey:  ["super-admin-dashboard", range],
    queryFn:   () => getSuperAdminDashboard(range),
    staleTime: 60_000
  });

  useEffect(() => {
    if (query.error) {
      toast.error("Chargement du command center impossible", {
        description: getApiErrorMessage(query.error)
      });
    }
  }, [query.error]);

  if (query.isLoading) return <DashboardSkeleton />;
  if (query.isError || !query.data) {
    return (
      <DashboardError
        message={
          query.error
            ? getApiErrorMessage(query.error)
            : "Le dashboard n'a pas pu être chargé."
        }
      />
    );
  }

  const d = query.data;

  return (
    <div
      className="min-h-screen pb-32"
      style={{ color: C.text }}
    >
      {/* Ambient top glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% -10%, ${C.accentGlow} 0%, transparent 55%)`
        }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Section 1: Executive Insights ── */}
        <ExecutiveInsights insights={d.insights} />

        {/* ── Section 2: Executive KPI Bar ── */}
        <ExecutiveKpiBar header={d.header} />

        {/* ── Section 3: Revenue Engine ── */}
        <RevenueEngine
          health={d.businessHealth}
          mrrChart={d.charts.mrrEvolution}
        />

        {/* ── Dashboard Content ── */}
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr] items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-5">
            <TopAgencies agencies={d.topAgencies} />
            <GrowthAnalytics charts={d.charts} range={range} setRange={setRange} />
            <PlatformActivity activity={d.activity} />
            <CommandShortcuts />
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-5">
            <BusinessRiskScore risk={d.risk} />
            <AlertCenter alerts={d.alerts} />
            <PredictivePanel predictive={d.predictive} />
            <ExpirationsCenter expirations={d.expirations} />
            <PlansAnalytics plans={d.charts.planDistribution} />
          </div>
        </div>

      </div>

    </div>
  );
}
