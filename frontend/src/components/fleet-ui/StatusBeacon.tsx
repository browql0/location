import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusBeaconProps {
  status: "active" | "warning" | "error" | "inactive";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  animate?: boolean;
}

const dotSize = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
} as const;

const wrapperSize = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

const colors = {
  active: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  inactive: "bg-slate-500",
} as const;

export function StatusBeacon({
  status,
  size = "sm",
  label,
  className,
  animate = true,
}: StatusBeaconProps) {
  const shouldAnimate = animate && (status === "active" || status === "warning");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0",
          wrapperSize[size]
        )}
      >
        {shouldAnimate && (
          <motion.div
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className={cn("absolute inset-0 rounded-full", colors[status])}
          />
        )}
        <div
          className={cn(
            "relative rounded-full",
            dotSize[size],
            colors[status]
          )}
        />
      </div>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
