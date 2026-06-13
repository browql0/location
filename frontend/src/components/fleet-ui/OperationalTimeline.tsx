import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  Navigation,
  CalendarClock,
  ArrowRight,
  Car,
  User,
  Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  listReservations,
  type Reservation,
} from "@/features/reservations/reservations-api";

interface OperationalTimelineProps {
  className?: string;
}

/* ─── helpers ─────────────────────────────────────────────── */

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string | number): string {
  return Number(amount).toLocaleString("fr-FR");
}

/* ─── sub-components ─────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="relative flex gap-4">
      {/* node */}
      <div className="relative z-10 h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted/60" />
      {/* card */}
      <div className="flex-1 animate-pulse space-y-2 rounded-xl border border-border/30 bg-muted/20 p-3">
        <div className="h-3 w-1/3 rounded bg-muted/60" />
        <div className="h-3 w-2/3 rounded bg-muted/40" />
        <div className="h-3 w-1/2 rounded bg-muted/40" />
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────── */

export function OperationalTimeline({ className }: OperationalTimelineProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState<string>("");

  /* live clock */
  useEffect(() => {
    function tick() {
      setClock(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* fetch today's reservations */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listReservations({ date: todayISO() })
      .then((data) => {
        if (cancelled) return;
        const filtered = data.filter(
          (r) => r.status === "IN_PROGRESS" || r.status === "CONFIRMED",
        );
        setReservations(filtered);
      })
      .catch(() => {
        if (!cancelled) setReservations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayed = reservations.slice(0, 6);
  const hasMore = reservations.length > 6;

  /* per-status appearance config */
  const statusConfig = {
    IN_PROGRESS: {
      icon: Navigation,
      nodeBg: "bg-blue-500/15 border-blue-500/40",
      iconColor: "text-blue-400",
      pillBg: "bg-blue-500/15 border-blue-500/30 text-blue-400",
      pillLabel: "En cours",
      cardAccent: "border-l-blue-500/50",
    },
    CONFIRMED: {
      icon: CalendarClock,
      nodeBg: "bg-emerald-500/15 border-emerald-500/40",
      iconColor: "text-emerald-400",
      pillBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      pillLabel: "Confirmé",
      cardAccent: "border-l-emerald-500/50",
    },
  } as const;

  return (
    <div className={cn("glass-card flex flex-col rounded-xl p-6", className)}>
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/40">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Operational Timeline
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Today's Schedule
            </p>
          </div>
        </div>

        {/* live clock */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5">
          <Clock className="h-3 w-3 text-primary" />
          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
            {clock}
          </span>
        </div>
      </div>

      {/* ── Timeline body ── */}
      <div className="relative flex-1">
        {/* vertical rail */}
        {!loading && displayed.length > 0 && (
          <div className="absolute bottom-0 left-[19px] top-0 w-px bg-border/40" />
        )}

        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {loading ? (
              /* skeleton */
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </motion.div>
            ) : displayed.length === 0 ? (
              /* empty state */
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-3 py-12 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/40 bg-muted/30">
                  <CalendarCheck className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No operations scheduled for today
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  Check back later or add a reservation
                </p>
              </motion.div>
            ) : (
              /* reservation items */
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {displayed.map((res, idx) => {
                  const cfg =
                    statusConfig[res.status as keyof typeof statusConfig];
                  const Icon = cfg.icon;

                  return (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { delay: idx * 0.06 },
                      }}
                      className="relative flex gap-4"
                    >
                      {/* icon node */}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm",
                          cfg.nodeBg,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", cfg.iconColor)} />
                      </div>

                      {/* frosted glass mini card */}
                      <div
                        className={cn(
                          "flex-1 overflow-hidden rounded-xl border border-border/30 border-l-2 bg-card/40 p-3 backdrop-blur-sm",
                          cfg.cardAccent,
                        )}
                      >
                        {/* top row: pill + dates */}
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              cfg.pillBg,
                            )}
                          >
                            {res.status === "IN_PROGRESS" ? (
                              <Navigation className="h-2.5 w-2.5" />
                            ) : (
                              <CalendarClock className="h-2.5 w-2.5" />
                            )}
                            {cfg.pillLabel}
                          </span>
                          <span className="text-[10px] tabular-nums text-muted-foreground">
                            {formatDate(res.startDate)}
                            <ArrowRight className="mx-0.5 inline h-2.5 w-2.5 opacity-50" />
                            {formatDate(res.endDate)}
                          </span>
                        </div>

                        {/* car */}
                        <div className="mb-1 flex items-center gap-1.5">
                          <Car className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span className="text-sm font-semibold leading-none text-foreground">
                            {res.car.brand} {res.car.model}
                          </span>
                          <span className="ml-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground ring-1 ring-border/40">
                            {res.car.registrationNumber}
                          </span>
                        </div>

                        {/* client + amount */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                            <span className="text-xs text-muted-foreground">
                              {res.client.firstName} {res.client.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Banknote className="h-3 w-3 text-muted-foreground/70" />
                            <span className="text-xs font-bold text-foreground">
                              {formatAmount(res.totalAmount)}{" "}
                              <span className="font-normal text-muted-foreground">
                                MAD
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ── */}
      {!loading && (displayed.length > 0 || hasMore) && (
        <div className="mt-5 border-t border-border/40 pt-4">
          <Link
            to="/reservations"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            View all reservations
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
