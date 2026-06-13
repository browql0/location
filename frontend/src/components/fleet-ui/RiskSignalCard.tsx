import { motion } from "framer-motion";
import { ShieldAlert, Shield, AlertOctagon, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskSignalCardProps {
  className?: string;
  clientsCount?: number;
  reservationsToday?: number;
}

export function RiskSignalCard({
  className,
  clientsCount = 0,
  reservationsToday = 0,
}: RiskSignalCardProps) {
  // Trust score position: 90% along the bar (A+ rating)
  const trustScorePosition = 90;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "glass-card flex flex-col rounded-xl p-6",
        className
      )}
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-foreground">
              Risk & Trust
            </h2>
            {/* Live ping */}
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Rentora Intelligence
          </p>
        </div>
      </div>

      {/* 3 metric panels */}
      <div className="mb-5 grid grid-cols-1 gap-3 flex-1">
        {/* Verified Clients */}
        <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-background/40 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Verified Clients
            </div>
            <div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
              {clientsCount}
            </div>
          </div>
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
            Active
          </div>
        </div>

        {/* Today's Activity */}
        <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-background/40 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Today's Activity
            </div>
            <div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
              {reservationsToday}
            </div>
          </div>
          <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400">
            Today
          </div>
        </div>

        {/* Blacklisted */}
        <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-background/40 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Blacklisted
            </div>
            <div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
              0
            </div>
          </div>
          <div className="rounded-full border border-border/40 bg-muted/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Bientôt
          </div>
        </div>
      </div>

      {/* Network Trust Score */}
      <div className="mt-auto rounded-lg border border-border/40 bg-background/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              Network Trust Score
            </span>
          </div>
          <span className="text-sm font-black text-emerald-400">A+</span>
        </div>
        {/* Gradient bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-50% to-emerald-500" />
          {/* Marker */}
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            style={{ left: `${trustScorePosition}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
          <span>High Risk</span>
          <span>Trusted</span>
        </div>
      </div>
    </motion.div>
  );
}
