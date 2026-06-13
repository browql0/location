import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { ConfirmDialog } from "@/components/ui-custom/confirm-dialog";
import { DataTable } from "@/components/ui-custom/data-table";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { useAuth } from "@/features/auth/auth-provider";
import { listAgencies, type Agency } from "@/features/saas/saas-api";
import { defaultStaffPermissions, permissionGroups } from "@/features/users/permissions";
import { createUser, deleteUser, listUsers, setUserEnabled, updateUser, updateUserPermissions, type StaffUser } from "@/features/users/users-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission, UserRole, UserStatus } from "@/types/auth";

type StaffForm = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  agencyId: string;
};

const emptyForm: StaffForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "STAFF",
  status: "ACTIVE",
  permissions: defaultStaffPermissions,
  agencyId: ""
};

function formFromUser(user: StaffUser): StaffForm {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    password: "",
    role: user.role,
    status: user.status,
    permissions: user.permissions,
    agencyId: user.agencyId ?? ""
  };
}

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

function PermissionCheckboxes({ value, onChange }: { value: Permission[]; onChange: (permissions: Permission[]) => void }) {
  function toggle(permission: Permission) {
    onChange(value.includes(permission) ? value.filter((item) => item !== permission) : [...value, permission]);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {permissionGroups.map((group) => (
        <fieldset className="rounded-lg border p-3" key={group.label}>
          <legend className="px-1 text-sm font-medium">{group.label}</legend>
          <div className="mt-2 space-y-2">
            {group.permissions.map((permission) => (
              <label className="flex items-center gap-2 text-sm text-muted-foreground" key={permission.value}>
                <input checked={value.includes(permission.value)} className="h-4 w-4 rounded border-input" type="checkbox" onChange={() => toggle(permission.value)} />
                {permission.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [form, setForm] = useState<StaffForm | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<StaffUser | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ user: StaffUser; action: "disable" | "enable" | "delete" } | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const canCreate = hasPermission(user, "users:create");
  const canUpdate = hasPermission(user, "users:update");
  const canDisable = hasPermission(user, "users:disable");
  const canEnable = hasPermission(user, "users:enable");
  const canDelete = hasPermission(user, "users:delete");
  const canPermissions = hasPermission(user, "users:permissions");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  async function load() {
    try {
      setStaff(await listUsers({ ...(roleFilter ? { role: roleFilter } : {}), ...(statusFilter ? { status: statusFilter } : {}) }));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    }
  }

  useEffect(() => {
    void load();
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    async function loadAgencies() {
      try {
        setAgencies((await listAgencies()).filter((agency) => agency.status === "ACTIVE"));
      } catch (error) {
        toast.error("Chargement des agences impossible", { description: getApiErrorMessage(error) });
      }
    }

    void loadAgencies();
  }, [isSuperAdmin]);

  const columns = useMemo<ColumnDef<StaffUser>[]>(
    () => [
      {
        header: "Nom",
        cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span>
      },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Telephone", cell: ({ row }) => row.original.phone ?? "-" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge status={row.original.status === "SUSPENDED" ? "SUSPENDED" : row.original.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"} /> },
      { header: "Permissions", cell: ({ row }) => row.original.permissions.length },
      { header: "Derniere connexion", cell: ({ row }) => (row.original.lastLoginAt ? new Date(row.original.lastLoginAt).toLocaleString("fr-FR") : "-") },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex min-w-80 flex-wrap gap-2">
            {canUpdate ? (
              <Button type="button" variant="outline" onClick={() => setForm(formFromUser(row.original))}>
                Modifier
              </Button>
            ) : null}
            {canPermissions && row.original.role === "STAFF" && row.original.id !== user?.id ? (
              <Button type="button" variant="outline" onClick={() => setPermissionsTarget(row.original)}>
                Permissions
              </Button>
            ) : null}
            {row.original.status === "ACTIVE" && canDisable && row.original.id !== user?.id ? (
              <Button type="button" variant="outline" onClick={() => setConfirmTarget({ user: row.original, action: "disable" })}>
                Desactiver
              </Button>
            ) : null}
            {row.original.status !== "ACTIVE" && canEnable ? (
              <Button type="button" variant="outline" onClick={() => setConfirmTarget({ user: row.original, action: "enable" })}>
                Reactiver
              </Button>
            ) : null}
            {canDelete && row.original.id !== user?.id ? (
              <Button type="button" variant="outline" onClick={() => setConfirmTarget({ user: row.original, action: "delete" })}>
                Supprimer
              </Button>
            ) : null}
          </div>
        )
      }
    ],
    [canDelete, canDisable, canEnable, canPermissions, canUpdate, user?.id]
  );

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    try {
      if (!form.id && isSuperAdmin && form.role !== "SUPER_ADMIN" && !form.agencyId) {
        toast.error("Agence requise", { description: "Veuillez sélectionner une agence pour cet utilisateur." });
        return;
      }

      if (form.id) {
        await updateUser(form.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          status: form.status,
          permissions: form.permissions
        });
        toast.success("Employe modifie");
      } else {
        await createUser({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          role: isSuperAdmin ? form.role : "STAFF",
          agencyId: isSuperAdmin && form.role !== "SUPER_ADMIN" ? form.agencyId : null,
          permissions: form.permissions
        });
        toast.success("Employe cree");
      }
      setForm(null);
      await load();
    } catch (error) {
      toast.error("Enregistrement impossible", { description: getApiErrorMessage(error) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-widest text-foreground uppercase">
            Platform Operators
          </h1>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Identity & Access Management
          </p>
        </div>
        
        {canCreate && (
          <button 
            type="button"
            onClick={() => setForm({ ...emptyForm, agencyId: user?.agencyId ?? "" })}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Provision Operator
          </button>
        )}
      </div>

      {form ? (
        <div className="glass-card rounded-xl border border-border/50 p-6 shadow-lg shadow-black/50 ring-1 ring-primary/20">
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">{form.id ? "Modify Operator Identity" : "Provision New Operator"}</h2>
          </div>
          <form className="grid gap-4" onSubmit={submitForm}>
            <div className="grid gap-3 md:grid-cols-3">
              <Input aria-label="firstName" placeholder="First Name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="bg-background/50 border-border/50 focus-visible:ring-primary" />
              <Input aria-label="lastName" placeholder="Last Name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="bg-background/50 border-border/50 focus-visible:ring-primary" />
              <Input aria-label="phone" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="bg-background/50 border-border/50 focus-visible:ring-primary" />
              {!form.id ? (
                <>
                  <Input aria-label="email" placeholder="Email Address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="bg-background/50 border-border/50 focus-visible:ring-primary" />
                  <Input aria-label="password" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="bg-background/50 border-border/50 focus-visible:ring-primary" />
                  <select
                    className="h-10 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    value={form.role}
                    disabled={!isSuperAdmin}
                    onChange={(event) => {
                      const role = event.target.value as UserRole;
                      setForm({ ...form, role, agencyId: role === "SUPER_ADMIN" ? "" : form.agencyId });
                    }}
                  >
                    <option value="STAFF">OPERATOR (STAFF)</option>
                    {isSuperAdmin ? (
                      <>
                        <option value="AGENCY_ADMIN">AGENCY COMMANDER (AGENCY_ADMIN)</option>
                        <option value="SUPER_ADMIN">PLATFORM COMMANDER (SUPER_ADMIN)</option>
                      </>
                    ) : null}
                  </select>
                  {isSuperAdmin && form.role !== "SUPER_ADMIN" ? (
                    <select
                      className="h-10 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      value={form.agencyId}
                      required
                      aria-label="Agence"
                      onChange={(event) => setForm({ ...form, agencyId: event.target.value })}
                    >
                      <option value="">Assign to Rentora Agency</option>
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </>
              ) : (
                <select className="h-10 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UserStatus })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              )}
            </div>
            
            <div className="mt-4 rounded-lg bg-background/30 p-4 border border-border/50">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Rights</h3>
              <PermissionCheckboxes value={form.permissions} onChange={(permissions) => setForm({ ...form, permissions })} />
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Execute Provisioning</Button>
              <Button type="button" variant="outline" className="border-border/50 bg-transparent" onClick={() => setForm(null)}>Abort</Button>
            </div>
          </form>
        </div>
      ) : null}

      {permissionsTarget ? (
        <div className="glass-card rounded-xl border border-border/50 p-6 shadow-lg shadow-black/50 ring-1 ring-primary/20">
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Modify Access Rights: {permissionsTarget.firstName} {permissionsTarget.lastName}</h2>
          </div>
          <div className="rounded-lg bg-background/30 p-4 border border-border/50">
            <PermissionCheckboxes value={permissionsTarget.permissions} onChange={(permissions) => setPermissionsTarget({ ...permissionsTarget, permissions })} />
          </div>
          <div className="mt-6 flex gap-2">
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={async () => {
                try {
                  await updateUserPermissions(permissionsTarget.id, permissionsTarget.permissions);
                  toast.success("Rights updated");
                  setPermissionsTarget(null);
                  await load();
                } catch (error) {
                  toast.error("Modification failed", { description: getApiErrorMessage(error) });
                }
              }}
            >
              Commit Changes
            </Button>
            <Button type="button" variant="outline" className="border-border/50 bg-transparent" onClick={() => setPermissionsTarget(null)}>Abort</Button>
          </div>
        </div>
      ) : null}

      <div className="glass-card rounded-xl border border-border/50 p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Personnel Database</h2>
            <p className="text-xs text-muted-foreground">{staff.length} active operators.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" aria-label="Filtrer role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">All Ranks</option>
              <option value="SUPER_ADMIN">Platform Commander</option>
              <option value="AGENCY_ADMIN">Agency Commander</option>
              <option value="STAFF">Operator</option>
            </select>
            <select className="h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" aria-label="Filtrer statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <DataTable columns={columns} data={staff} getRowId={(row) => row.id} searchPlaceholder="Search personnel..." />
        {staff.length === 0 ? <EmptyState title="No Operators" description="Identity records will appear here." /> : null}
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Confirm Administrative Action"
        description="This action will be permanently logged in the audit trail."
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (!confirmTarget) return;
          try {
            if (confirmTarget.action === "delete") await deleteUser(confirmTarget.user.id);
            else await setUserEnabled(confirmTarget.user.id, confirmTarget.action === "enable");
            toast.success("Action Executed");
            setConfirmTarget(null);
            await load();
          } catch (error) {
            toast.error("Execution failed", { description: getApiErrorMessage(error) });
          }
        }}
      />
    </div>
  );
}
