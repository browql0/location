import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Building2, Mail, MapPin, Phone, Car, Users, Calendar, ShieldAlert, X, Loader2, CheckCircle2, Zap, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { deleteAgency, listAgencies, setAgencyEnabled, type Agency } from "@/features/saas/saas-api";
import { getApiErrorMessage } from "@/lib/api-error";

import { C, fadeUp, stagger, fDate } from "@/components/super-admin-dashboard/tokens";
import { GlassCard } from "@/components/super-admin-dashboard/ui";

/* ─── Helpers ───────────────────────────────────────────────── */
function getStatusVariant(status: string) {
  if (status === "ACTIVE") return { bg: C.successGlow, color: C.success, border: `${C.success}40` };
  if (status === "SUSPENDED") return { bg: C.dangerGlow, color: C.danger, border: `${C.danger}40` };
  return { bg: "rgba(255,255,255,0.05)", color: C.muted, border: C.borderLight };
}

/* ─── Agency Detail Panel ───────────────────────────────────── */
function AgencyDetailPanel({
  agency,
  onClose,
  onToggleStatus,
  onDelete,
  isToggling
}: {
  agency: Agency;
  onClose: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isToggling: boolean;
}) {
  const isSuspended = agency.status === "SUSPENDED";
  const st = getStatusVariant(agency.status);
  const plan = agency.subscriptions[0]?.plan.name ?? "Aucun";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l shadow-2xl overflow-y-auto custom-scrollbar flex flex-col"
        style={{ borderColor: C.border, background: "rgba(10, 15, 25, 0.95)", backdropFilter: "blur(40px)" }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: C.borderLight }}>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Détails de l'agence</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: C.muted }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-8">
          {/* Header */}
          <div className="flex gap-4 items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${C.accent}20, ${C.info}20)`,
                color: C.text,
                border: `1px solid ${C.borderLight}`
              }}
            >
              {agency.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black mb-1" style={{ color: C.text }}>{agency.name}</h1>
              <div
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
              >
                {agency.status}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <GlassCard className="p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Contact & Infos</h3>
            <div className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
              <Mail className="h-4 w-4" style={{ color: C.mutedLight }} />
              {agency.email}
            </div>
            {agency.phone && (
              <div className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
                <Phone className="h-4 w-4" style={{ color: C.mutedLight }} />
                {agency.phone}
              </div>
            )}
            {agency.city && (
              <div className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
                <MapPin className="h-4 w-4" style={{ color: C.mutedLight }} />
                {agency.city}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
              <Calendar className="h-4 w-4" style={{ color: C.mutedLight }} />
              Créée le {fDate(agency.createdAt)}
            </div>
          </GlassCard>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: C.muted }}>
                <Users className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Utilisateurs</span>
              </div>
              <div className="text-2xl font-black" style={{ color: C.text }}>{agency._count.users}</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: C.muted }}>
                <Car className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Véhicules</span>
              </div>
              <div className="text-2xl font-black" style={{ color: C.text }}>{agency._count.cars}</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: C.muted }}>
                <Building2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Clients</span>
              </div>
              <div className="text-2xl font-black" style={{ color: C.text }}>{agency._count.clients}</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: C.muted }}>
                <Zap className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Plan</span>
              </div>
              <div className="text-lg font-bold truncate" style={{ color: C.accent }}>{plan}</div>
            </GlassCard>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t mt-auto" style={{ borderColor: C.borderLight, background: "rgba(0,0,0,0.2)" }}>
          <button
            disabled={isToggling}
            onClick={onToggleStatus}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50"
            style={{
              background: isSuspended ? C.success : "transparent",
              color: isSuspended ? "#fff" : C.danger,
              border: isSuspended ? "none" : `1px solid ${C.danger}50`,
              boxShadow: isSuspended ? `0 4px 16px ${C.successGlow}` : "none"
            }}
          >
            {isToggling ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSuspended ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Réactiver l'agence
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5" />
                Suspendre l'agence
              </>
            )}
          </button>
          {!isSuspended && (
            <p className="text-xs text-center mt-3" style={{ color: C.muted }}>
              La suspension bloquera immédiatement l'accès à tous les utilisateurs de cette agence.
            </p>
          )}
          <button
            disabled={isToggling}
            onClick={onDelete}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50"
            style={{ background: "transparent", color: C.danger, border: `1px solid ${C.danger}50` }}
          >
            <Trash2 className="h-5 w-5" />
            Supprimer l'agence
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export function SuperAdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      setAgencies(await listAgencies(status ? { status } : undefined));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, [status]);

  const filteredAgencies = useMemo(() => {
    if (!search) return agencies;
    const q = search.toLowerCase();
    return agencies.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.email.toLowerCase().includes(q)
    );
  }, [agencies, search]);

  async function handleToggleStatus() {
    if (!selectedAgency) return;
    setIsToggling(true);
    try {
      const willSuspend = selectedAgency.status === "ACTIVE";
      await setAgencyEnabled(selectedAgency.id, !willSuspend);
      toast.success(willSuspend ? "Agence suspendue avec succès" : "Agence réactivée avec succès");
      
      const newStatus = willSuspend ? "SUSPENDED" : "ACTIVE";
      setAgencies(prev => prev.map(a => a.id === selectedAgency.id ? { ...a, status: newStatus } : a));
      setSelectedAgency({ ...selectedAgency, status: newStatus });
    } catch (error) {
      toast.error("Action impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDeleteAgency() {
    if (!selectedAgency) return;
    if (!window.confirm(`Supprimer l'agence ${selectedAgency.name} ?`)) return;
    setIsToggling(true);
    try {
      await deleteAgency(selectedAgency.id);
      toast.success("Agence supprimee");
      setAgencies((current) => current.filter((agency) => agency.id !== selectedAgency.id));
      setSelectedAgency(null);
    } catch (error) {
      toast.error("Suppression impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsToggling(false);
    }
  }

  const TABS = [
    { key: "", label: "Toutes" },
    { key: "ACTIVE", label: "Actives" },
    { key: "SUSPENDED", label: "Suspendues" }
  ];

  return (
    <div className="min-h-screen pb-32" style={{ background: C.bg, color: C.text }}>
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% -10%, ${C.accentGlow} 0%, transparent 60%)` }}
      />

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.accent }}>
              Super Admin
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Agences</h1>
            <p className="text-sm" style={{ color: C.muted }}>Gérez les agences, leurs accès et leurs volumes opérationnels.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-xl px-4 h-11 transition-all duration-300 w-full sm:w-64"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderLight}` }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: C.muted }} />
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: C.text }}
                placeholder="Rechercher une agence..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            {/* Tabs */}
            <div
              className="flex gap-1 rounded-xl p-1 shrink-0"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderLight}` }}
            >
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setStatus(t.key)}
                  className="rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200"
                  style={{
                    background: status === t.key ? C.accent : "transparent",
                    color: status === t.key ? "#fff" : C.muted,
                    boxShadow: status === t.key ? `0 0 12px ${C.accentGlow}` : "none"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <GlassCard className="min-h-[400px]">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
              <span className="text-sm font-semibold" style={{ color: C.muted }}>Chargement des agences...</span>
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <Building2 className="h-10 w-10 opacity-20 mb-2" style={{ color: C.muted }} />
              <span className="text-sm font-bold" style={{ color: C.text }}>Aucune agence trouvée</span>
              <span className="text-xs" style={{ color: C.muted }}>Modifiez vos filtres ou votre recherche.</span>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col">
              {/* Header row */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b" style={{ color: C.muted, borderColor: C.borderLight }}>
                <div className="col-span-4">Agence</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2 text-center">Plan</div>
                <div className="col-span-3 text-right">Membres & Flotte</div>
              </div>

              {/* Rows */}
              {filteredAgencies.map((agency, i) => {
                const st = getStatusVariant(agency.status);
                const plan = agency.subscriptions[0]?.plan.name ?? "Aucun";

                return (
                  <motion.div key={agency.id} variants={fadeUp}>
                    <button
                      onClick={() => setSelectedAgency(agency)}
                      className="group w-full text-left grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-b transition-colors hover:bg-white/[0.03]"
                      style={{ borderColor: C.borderLight }}
                    >
                      {/* Agence Info */}
                      <div className="col-span-4 flex items-center gap-4">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${C.accent}15, ${C.info}15)`,
                            color: C.text,
                            border: `1px solid ${C.borderLight}`
                          }}
                        >
                          {agency.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate mb-0.5 transition-colors group-hover:text-white" style={{ color: C.text }}>{agency.name}</div>
                          <div
                            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                          >
                            {agency.status}
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-span-3 text-sm truncate" style={{ color: C.mutedLight }}>
                        {agency.email}
                      </div>

                      {/* Plan */}
                      <div className="col-span-2 text-center text-sm font-semibold truncate" style={{ color: C.accent }}>
                        {plan}
                      </div>

                      {/* Stats */}
                      <div className="col-span-3 flex items-center justify-end gap-5">
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>Users</div>
                          <div className="text-sm font-bold" style={{ color: C.text }}>{agency._count.users}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>Voitures</div>
                          <div className="text-sm font-bold" style={{ color: C.text }}>{agency._count.cars}</div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </GlassCard>
      </div>

      {/* Side Panel Overlay & Component */}
      <AnimatePresence>
        {selectedAgency && (
          <AgencyDetailPanel
            agency={selectedAgency}
            onClose={() => setSelectedAgency(null)}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteAgency}
            isToggling={isToggling}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
