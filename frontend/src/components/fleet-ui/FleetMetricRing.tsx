import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface FleetMetricRingProps {
  value: number;
  total: number;
  label: string;
  sublabel?: string;
  colorClass?: string;
  glowColor?: string;
  size?: number;
  strokeWidth?: number;
  trend?: "up" | "down" | "neutral";
}

export function FleetMetricRing({
  value,
  total,
  label,
  sublabel,
  colorClass = "text-primary",
  glowColor = "#f97316",
  size = 110,
  strokeWidth = 9,
  trend,
}: FleetMetricRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  const offset = circumference - (percent / 100) * circumference;
  const filterId = `glow-${label.replace(/\s+/g, "-").toLowerCase()}`;

  // Spring-animated counter
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  const display = useTransform(spring, (v) => Math.round(v).toString());

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${value} sur ${total}`}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          className="stroke-current text-muted/20"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Animated progress arc */}
        <motion.circle
          className={cn("stroke-current", colorClass)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            strokeDasharray: circumference,
            filter: `url(#${filterId})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span className="text-xl font-black tracking-tighter text-foreground tabular-nums">
          {display}
        </motion.span>
        {sublabel && (
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
            {sublabel}
          </span>
        )}
        {trend && (
          <span
            className={cn(
              "mt-0.5 text-[9px] font-bold",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-red-400",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>
    </div>
  );
}
