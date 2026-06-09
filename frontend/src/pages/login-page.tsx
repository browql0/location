import { ThemeToggle } from "@/components/layout/theme-toggle";

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-xl font-semibold">Connexion</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page de connexion prête pour la phase Auth.</p>
      </section>
    </main>
  );
}
