import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusBeacon } from "./StatusBeacon";

interface FleetShellProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export { containerVariants, itemVariants };

export function FleetShell({
  children,
  className,
  title,
  subtitle,
  headerRight,
}: FleetShellProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative space-y-6", className)}
    >
      {/* Page Header */}
      {(title || subtitle || headerRight) && (
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            {title && (
              <div className="flex items-center gap-3">
                <StatusBeacon status="active" size="md" />
                <h1 className="text-2xl font-black tracking-[0.15em] text-foreground uppercase md:text-3xl">
                  {title}
                </h1>
              </div>
            )}
            {subtitle && (
              <p className="pl-5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="shrink-0">{headerRight}</div>
          )}
        </motion.div>
      )}

      {/* Ambient top glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent blur-2xl"
      />

      {/* Content */}
      {children}
    </motion.div>
  );
}
