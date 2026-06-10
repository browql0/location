import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="text-center">
        <h1 className="text-2xl font-semibold">Accès refusé</h1>
        <p className="mt-2 text-sm text-muted-foreground">Votre rôle ou vos permissions ne permettent pas d’ouvrir cette page.</p>
        <Button asChild className="mt-5">
          <Link to="/dashboard">Retour au dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
