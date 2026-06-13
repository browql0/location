import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, XCircle, Info, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AlertStripProps {
  variant: "critical" | "warning" | "info" | "success";
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const config = {
  critical: {
    icon: XCircle,
    bar: "bg-red-500",
    classes:
      "bg-red-500/10 text-red-400 border-red-500/20 border-l-4 border-l-red-500",
    iconWrap: "bg-red-500/15 text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-500",
    classes:
      "bg-amber-500/10 text-amber-400 border-amber-500/20 border-l-4 border-l-amber-500",
    iconWrap: "bg-amber-500/15 text-amber-400",
  },
  info: {
    icon: Info,
    bar: "bg-blue-500",
    classes:
      "bg-blue-500/10 text-blue-400 border-blue-500/20 border-l-4 border-l-blue-500",
    iconWrap: "bg-blue-500/15 text-blue-400",
  },
  success: {
    icon: CheckCircle2,
    bar: "bg-emerald-500",
    classes:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border-l-4 border-l-emerald-500",
    iconWrap: "bg-emerald-500/15 text-emerald-400",
  },
} as const;

export function AlertStrip({ variant, message, className, onDismiss }: AlertStripProps) {
  const [dismissed, setDismissed] = useState(false);
  const { icon: Icon, classes, iconWrap } = config[variant];

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-center gap-3 rounded-md border px-4 py-3",
            classes,
            className
          )}
        >
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", iconWrap)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="flex-1 text-sm font-medium leading-snug">{message}</span>
          {onDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
