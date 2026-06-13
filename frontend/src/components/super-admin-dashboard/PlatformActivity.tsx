/* ═══════════════════════════════════════════════════════════════
   SECTION 11 — PLATFORM ACTIVITY
   Audit log timeline with entity-specific icons and colors.
   Shows: action · actor · agency · timestamp
═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  User,
  Calendar,
  CreditCard,
  Settings,
  Trash2,
  Clock,
  Plus
} from "lucide-react";
import { C, fTime, stagger, fadeUp } from "./tokens";
import { GlassCard, SectionHeader, EmptyState } from "./ui";
import type { SuperAdminDashboardData } from "@/features/saas/saas-api";

type ActivityItem = SuperAdminDashboardData["activity"][number];

/* ─── Entity → icon + color mapping ─────────────────────────── */
function entityConfig(entity: string, action: string) {
  if (entity === "Agency")           return { icon: Building2, color: C.success };
  if (entity === "Client")           return { icon: User,      color: C.info    };
  if (entity === "Reservation")      return { icon: Calendar,  color: C.warning };
  if (entity === "Subscription")     return { icon: CreditCard, color: C.accent };
  if (entity === "SubscriptionPlan") return { icon: Settings,  color: C.purple  };
  if (action === "DELETE")           return { icon: Trash2,    color: C.danger  };
  if (action === "CREATE")           return { icon: Plus,      color: C.success };
  return { icon: Activity, color: C.muted };
}

function TimelineItem({ item, index, isFirst }: { item: ActivityItem; index: number; isFirst: boolean }) {
  const { icon: Icon, color } = entityConfig(item.entity, item.action);

  return (
    <motion.div custom={index} variants={fadeUp} className="relative flex gap-4">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl z-10"
          style={{
            background: `${color}18`,
            border:     `1px solid ${color}35`,
            boxShadow:  isFirst ? `0 0 10px ${color}60` : "none"
          }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        {/* Connector line — will overlap next item's dot */}
        <div
          className="w-px flex-1 mt-1"
          style={{ background: `linear-gradient(to bottom, ${C.border}, transparent)`, minHeight: 16 }}
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 rounded-xl px-4 py-3 mb-2 transition-colors hover:bg-white/[0.025]"
        style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className="font-semibold text-sm leading-snug"
            style={{ color: C.text }}
          >
            {item.title}
          </div>
          <div
            className="flex items-center gap-1 shrink-0 text-[11px]"
            style={{ color: C.mutedLight }}
          >
            <Clock className="h-3 w-3" />
            {fTime(item.createdAt)}
          </div>
        </div>
        <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
          {item.actorName ?? "Système"}
          {item.agencyName && (
            <>
              <span className="mx-1.5" style={{ color: C.border }}>·</span>
              {item.agencyName}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PlatformActivity({
  activity
}: {
  activity: SuperAdminDashboardData["activity"];
}) {
  return (
    <GlassCard className="p-6">
      <SectionHeader
        icon={Activity}
        title="Activité Plateforme"
        subtitle="Journal d'audit en temps réel"
        color={C.info}
      />

      {activity.length === 0 ? (
        <EmptyState message="Aucune activité récente." />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show">
          {activity.map((item, i) => (
            <TimelineItem
              key={item.id}
              item={item}
              index={i}
              isFirst={i === 0}
            />
          ))}
        </motion.div>
      )}
    </GlassCard>
  );
}
