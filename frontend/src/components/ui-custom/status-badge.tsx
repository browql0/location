import { cn } from "@/lib/utils";

export type StatusBadgeValue =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "TRIALING"
  | "PAST_DUE"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED"
  | "AVAILABLE"
  | "RENTED"
  | "MAINTENANCE";

const statusStyles: Record<StatusBadgeValue, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300",
  INACTIVE: "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20 dark:text-zinc-300",
  PENDING: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300",
  TRIALING: "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:text-sky-300",
  PAST_DUE: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300",
  SUSPENDED: "bg-orange-500/10 text-orange-700 ring-orange-600/20 dark:text-orange-300",
  EXPIRED: "bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:text-rose-300",
  CANCELLED: "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20 dark:text-zinc-300",
  AVAILABLE: "bg-teal-500/10 text-teal-700 ring-teal-600/20 dark:text-teal-300",
  RENTED: "bg-indigo-500/10 text-indigo-700 ring-indigo-600/20 dark:text-indigo-300",
  MAINTENANCE: "bg-violet-500/10 text-violet-700 ring-violet-600/20 dark:text-violet-300"
};

export function StatusBadge({ status, className }: { status: StatusBadgeValue; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", statusStyles[status], className)}>
      {status}
    </span>
  );
}
