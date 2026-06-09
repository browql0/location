import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="text-center">
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <Link className="mt-4 inline-block text-sm text-primary hover:underline" to="/">
          Retour au dashboard
        </Link>
      </section>
    </main>
  );
}
