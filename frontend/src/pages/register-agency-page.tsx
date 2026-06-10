import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-provider";
import { registerAgencySchema, type RegisterAgencyFormValues } from "@/features/auth/auth.schemas";
import { getApiErrorMessage } from "@/lib/api-error";

export function RegisterAgencyPage() {
  const { registerAgency } = useAuth();
  const form = useForm<RegisterAgencyFormValues>({
    resolver: zodResolver(registerAgencySchema),
    defaultValues: {
      agencyName: "",
      agencyEmail: "",
      agencyPhone: "",
      agencyAddress: "",
      agencyCity: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerAgency(values);
    } catch (error) {
      toast.error("Création impossible", { description: getApiErrorMessage(error) });
    }
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Créer une agence</CardTitle>
          <CardDescription>Un essai gratuit de 30 jours sera activé automatiquement.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom agence" error={form.formState.errors.agencyName?.message}>
                <Input {...form.register("agencyName")} autoComplete="organization" />
              </Field>
              <Field label="Email agence" error={form.formState.errors.agencyEmail?.message}>
                <Input {...form.register("agencyEmail")} type="email" autoComplete="email" />
              </Field>
              <Field label="Téléphone agence">
                <Input {...form.register("agencyPhone")} />
              </Field>
              <Field label="Ville">
                <Input {...form.register("agencyCity")} />
              </Field>
            </div>
            <Field label="Adresse">
              <Input {...form.register("agencyAddress")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom admin" error={form.formState.errors.firstName?.message}>
                <Input {...form.register("firstName")} autoComplete="given-name" />
              </Field>
              <Field label="Nom admin" error={form.formState.errors.lastName?.message}>
                <Input {...form.register("lastName")} autoComplete="family-name" />
              </Field>
              <Field label="Email admin" error={form.formState.errors.email?.message}>
                <Input {...form.register("email")} type="email" autoComplete="email" />
              </Field>
              <Field label="Téléphone admin">
                <Input {...form.register("phone")} />
              </Field>
            </div>
            <Field label="Mot de passe" error={form.formState.errors.password?.message}>
              <Input {...form.register("password")} type="password" autoComplete="new-password" />
            </Field>
            {form.formState.errors.root?.message ? (
              <Alert>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            ) : null}
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? "Création..." : "Créer l'agence"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link className="text-primary hover:underline" to="/login">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
