import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { PageContainer } from "@/components/ui-custom/page-container";
import { useAuth } from "@/features/auth/auth-provider";
import { changePassword } from "@/features/users/users-api";
import { getApiErrorMessage } from "@/lib/api-error";

export function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <PageContainer>
      <AppPageHeader title="Profil" description="Informations du compte connecte et permissions actives." eyebrow="Compte" />
      <AppSection className="rounded-lg border bg-card p-5" title="Identite">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-muted-foreground">Nom</div>
            <div className="mt-1 font-medium">{user?.firstName} {user?.lastName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="mt-1 font-medium">{user?.email}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Role</div>
            <div className="mt-1 font-medium">{user?.role}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Agence</div>
            <div className="mt-1 font-medium">{user?.agency?.name ?? "Administration globale"}</div>
          </div>
        </div>
      </AppSection>
      <AppSection className="rounded-lg border bg-card p-5" title="Permissions">
        <div className="flex flex-wrap gap-2">
          {user?.permissions.map((permission) => (
            <span className="inline-flex rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:text-emerald-300" key={permission}>
              {permission}
            </span>
          ))}
        </div>
      </AppSection>
      <AppSection className="rounded-lg border bg-card p-5" title="Changer mot de passe">
        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await changePassword(currentPassword, newPassword);
              setCurrentPassword("");
              setNewPassword("");
              toast.success("Mot de passe modifie");
            } catch (error) {
              toast.error("Modification impossible", { description: getApiErrorMessage(error) });
            }
          }}
        >
          <Input aria-label="Mot de passe actuel" placeholder="Mot de passe actuel" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <Input aria-label="Nouveau mot de passe" placeholder="Nouveau mot de passe" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          <Button type="submit">Changer</Button>
        </form>
      </AppSection>
    </PageContainer>
  );
}
