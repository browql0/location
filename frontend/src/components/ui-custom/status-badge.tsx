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
  | "GENERATED"
  | "SIGNED"
  | "ARCHIVED"
  | "ISSUED"
  | "DRAFT"
  | "SENT"
  | "SAAS_INVOICE"
  | "RENTAL_INVOICE"
  | "PLANNED"
  | "AVAILABLE"
  | "RENTED"
  | "MAINTENANCE"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "REFUNDED"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

const statusStyles: Record<StatusBadgeValue, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300",
  INACTIVE: "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20 dark:text-zinc-300",
  PENDING: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300",
  TRIALING: "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:text-sky-300",
  PAST_DUE: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300",
  SUSPENDED: "bg-orange-500/10 text-orange-700 ring-orange-600/20 dark:text-orange-300",
  EXPIRED: "bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:text-rose-300",
  CANCELLED: "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20 dark:text-zinc-300",
  GENERATED: "bg-blue-500/10 text-blue-700 ring-blue-600/20 dark:text-blue-300",
  SIGNED: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300",
  ARCHIVED: "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20 dark:text-zinc-300",
  ISSUED: "bg-blue-500/10 text-blue-700 ring-blue-600/20 dark:text-blue-300",
  DRAFT: "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20 dark:text-zinc-300",
  SENT: "bg-indigo-500/10 text-indigo-700 ring-indigo-600/20 dark:text-indigo-300",
  SAAS_INVOICE: "bg-violet-500/10 text-violet-700 ring-violet-600/20 dark:text-violet-300",
  RENTAL_INVOICE: "bg-teal-500/10 text-teal-700 ring-teal-600/20 dark:text-teal-300",
  AVAILABLE: "bg-teal-500/10 text-teal-700 ring-teal-600/20 dark:text-teal-300",
  RENTED: "bg-indigo-500/10 text-indigo-700 ring-indigo-600/20 dark:text-indigo-300",
  MAINTENANCE: "bg-violet-500/10 text-violet-700 ring-violet-600/20 dark:text-violet-300",
  CONFIRMED: "bg-blue-500/10 text-blue-700 ring-blue-600/20 dark:text-blue-300",
  IN_PROGRESS: "bg-violet-500/10 text-violet-700 ring-violet-600/20 dark:text-violet-300",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300",
  UNPAID: "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20 dark:text-zinc-300",
  PARTIAL: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300",
  PAID: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300",
  REFUNDED: "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:text-sky-300",
  PLANNED: "bg-orange-500/10 text-orange-700 ring-orange-600/20 dark:text-orange-300",
  LOW: "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:text-sky-300",
  MEDIUM: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300",
  HIGH: "bg-orange-500/10 text-orange-700 ring-orange-600/20 dark:text-orange-300",
  CRITICAL: "bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:text-rose-300"
};

export function StatusBadge({ status, className }: { status: StatusBadgeValue; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", statusStyles[status], className)}>
      {status}
    </span>
  );
}
