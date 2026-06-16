import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Download, FileText, Play, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPageHeader } from "@/components/ui-custom/app-page-header";
import { AppSection } from "@/components/ui-custom/app-section";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { PageContainer } from "@/components/ui-custom/page-container";
import { PageSkeleton } from "@/components/ui-custom/page-skeleton";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { cancelMaintenance, completeMaintenance, deleteMaintenanceDocument, downloadMaintenanceDocument, getMaintenance, startMaintenance, uploadMaintenanceDocument, type MaintenanceRecord } from "@/features/maintenance/maintenance-api";
import { getApiErrorMessage } from "@/lib/api-error";

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("fr-FR") : "-";
const money = (value: string | null) => `${Number(value ?? 0).toLocaleString("fr-FR")} MAD`;

export function MaintenanceDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    if (!id) return;
    try {
      setIsLoading(true);
      setRecord(await getMaintenance(id));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function run(action: "start" | "complete" | "cancel") {
    if (!record) return;
    try {
      if (action === "start") await startMaintenance(record.id);
      if (action === "cancel") await cancelMaintenance(record.id);
      if (action === "complete") {
        const mileage = window.prompt("Kilometrage au service", String(record.mileageAtService ?? record.car.currentMileage ?? ""));
        await completeMaintenance(record.id, { completedDate: new Date().toISOString(), mileageAtService: mileage ? Number(mileage) : null });
      }
      toast.success("Maintenance mise a jour");
      await load();
    } catch (error) {
      toast.error("Action impossible", { description: getApiErrorMessage(error) });
    }
  }

  if (isLoading) return <PageContainer><PageSkeleton /></PageContainer>;
  if (!record) return <PageContainer><EmptyState title="Maintenance introuvable" description="Cette operation n'est pas accessible." /></PageContainer>;

  return (
    <PageContainer>
      <AppPageHeader
        eyebrow="Maintenance"
        title={record.title}
        description={`${record.car.brand} ${record.car.model} - ${record.car.registrationNumber}`}
        actions={<div className="flex flex-wrap gap-2"><StatusBadge status={record.status} /><Button asChild variant="outline"><Link to={`/maintenance/${record.id}/edit`}>Modifier</Link></Button></div>}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <AppSection className="rounded-lg border bg-card p-5" title="Operation">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{record.type}</dd></div>
            <div><dt className="text-muted-foreground">Planifie</dt><dd>{date(record.scheduledDate)}</dd></div>
            <div><dt className="text-muted-foreground">Termine</dt><dd>{date(record.completedDate)}</dd></div>
            <div><dt className="text-muted-foreground">Kilometrage</dt><dd>{record.mileageAtService?.toLocaleString("fr-FR") ?? "-"} km</dd></div>
          </dl>
        </AppSection>
        <AppSection className="rounded-lg border bg-card p-5" title="Cout et fournisseur">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Cout</dt><dd className="font-medium">{money(record.cost)}</dd></div>
            <div><dt className="text-muted-foreground">Fournisseur</dt><dd>{record.vendor ?? "-"}</dd></div>
            <div><dt className="text-muted-foreground">Notes</dt><dd>{record.notes ?? "-"}</dd></div>
          </dl>
        </AppSection>
      </div>

      <AppSection className="rounded-lg border bg-card p-5" title="Actions">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={record.status !== "PLANNED"} onClick={() => run("start")}><Play className="mr-2 h-4 w-4" /> Demarrer</Button>
          <Button type="button" variant="outline" disabled={record.status === "COMPLETED" || record.status === "CANCELLED"} onClick={() => run("complete")}><CheckCircle2 className="mr-2 h-4 w-4" /> Terminer</Button>
          <Button type="button" variant="outline" disabled={record.status === "CANCELLED"} onClick={() => run("cancel")}><XCircle className="mr-2 h-4 w-4" /> Annuler</Button>
        </div>
      </AppSection>

      <AppSection className="rounded-lg border bg-card p-5" title="Documents">
        <form
          className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!file) return;
            try {
              await uploadMaintenanceDocument(record.id, file);
              setFile(null);
              toast.success("Document ajoute");
              await load();
            } catch (error) {
              toast.error("Upload impossible", { description: getApiErrorMessage(error) });
            }
          }}
        >
          <Input accept="application/pdf,image/png,image/jpeg,image/jpg" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <Button type="submit"><Upload className="mr-2 h-4 w-4" /> Ajouter</Button>
        </form>
        <div className="divide-y rounded-md border">
          {record.documents.map((document) => (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3" key={document.id}>
              <div><p className="font-medium">{document.fileName}</p><p className="text-sm text-muted-foreground">{Math.round(document.size / 1024)} KB</p></div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => downloadMaintenanceDocument(document.id, document.fileName)}><Download className="mr-2 h-4 w-4" /> Download</Button>
                <Button type="button" variant="outline" onClick={async () => { await deleteMaintenanceDocument(document.id); await load(); }}><FileText className="mr-2 h-4 w-4" /> Supprimer</Button>
              </div>
            </div>
          ))}
        </div>
        {record.documents.length === 0 ? <EmptyState title="Aucun document" description="Ajoutez devis, factures atelier ou photos." /> : null}
      </AppSection>
    </PageContainer>
  );
}
