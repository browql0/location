import { PassThrough } from "node:stream";
import { InvoiceType, type InvoiceStatus, type Prisma } from "@prisma/client";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { env } from "../../config/env.js";
import { FileStorageService } from "../files/file-storage.service.js";

type InvoicePdfData = Prisma.InvoiceGetPayload<{
  include: {
    agency: true;
    reservation: { include: { client: true; car: true; agency: true } };
    subscription: { include: { agency: true; plan: true } };
  };
}>;

const page = {
  width: 595,
  height: 842,
  margin: 36,
  bottom: 786
};

const colors = {
  graphite: "#20242a",
  graphite2: "#303640",
  ink: "#101418",
  muted: "#65707c",
  line: "#d9dee5",
  soft: "#f5f7f9",
  orange: "#bf6f2f",
  orangeDark: "#8d4a1d",
  orangeSoft: "#fff4ea",
  green: "#168a56",
  red: "#b42318",
  amber: "#a15c07"
};

function clean(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function money(value: unknown, currency = "MAD") {
  return `${Number(value ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function date(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function invoiceUrl(invoiceId: string) {
  return `${env.FRONTEND_APP_URL.replace(/\/$/, "")}/invoices/${invoiceId}`;
}

function statusLabel(status: InvoiceStatus) {
  if (status === "PAID") return "PAYE";
  if (status === "PARTIAL" || status === "SENT" || status === "ISSUED") return "PARTIEL";
  if (status === "CANCELLED") return "ANNULE";
  return "NON PAYE";
}

function statusColor(status: InvoiceStatus) {
  if (status === "PAID") return colors.green;
  if (status === "CANCELLED") return colors.red;
  if (status === "PARTIAL" || status === "SENT" || status === "ISSUED") return colors.amber;
  return colors.muted;
}

function agencyName(agency?: InvoicePdfData["agency"] | null) {
  return clean(agency?.tradeName ?? agency?.name, "Agence");
}

function agencyLegal(agency?: InvoicePdfData["agency"] | null) {
  return [
    agency?.ice ? `ICE ${agency.ice}` : null,
    agency?.rc ? `RC ${agency.rc}` : null,
    agency?.ifNumber ? `IF ${agency.ifNumber}` : null,
    agency?.patente ? `Patente ${agency.patente}` : null
  ].filter(Boolean).join("  |  ");
}

function agencyAddress(agency?: InvoicePdfData["agency"] | null) {
  return [agency?.address, agency?.city, agency?.country].filter(Boolean).join(", ") || "-";
}

function drawLogoOrInitials(doc: PDFKit.PDFDocument, x: number, y: number, size: number, name: string, logoUrl?: string | null) {
  doc.roundedRect(x, y, size, size, 7).fill("#ffffff");
  doc.fillColor(colors.graphite).font("Helvetica-Bold").fontSize(14).text(name.slice(0, 2).toUpperCase(), x, y + size / 2 - 7, { width: size, align: "center" });
}

function line(doc: PDFKit.PDFDocument, x: number, y: number, width: number) {
  doc.strokeColor(colors.line).lineWidth(0.6).moveTo(x, y).lineTo(x + width, y).stroke();
}

function section(doc: PDFKit.PDFDocument, title: string, x: number, y: number, width: number) {
  doc.roundedRect(x, y, width, 20, 3).fill(colors.soft);
  doc.rect(x, y, 3, 20).fill(colors.orange);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8.5).text(title.toUpperCase(), x + 10, y + 6, { width: width - 16 });
}

function field(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc.fillColor(colors.muted).font("Helvetica").fontSize(6.8).text(label.toUpperCase(), x, y, { width });
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8.4).text(value, x, y + 9, { width, height: 18 });
}

function badge(doc: PDFKit.PDFDocument, text: string, color: string, x: number, y: number, width = 70) {
  doc.roundedRect(x, y, width, 18, 9).fill(`${color}18`).strokeColor(color).lineWidth(0.6).stroke();
  doc.fillColor(color).font("Helvetica-Bold").fontSize(7.6).text(text, x + 6, y + 5, { width: width - 12, align: "center" });
}

function metaBox(doc: PDFKit.PDFDocument, invoice: InvoicePdfData, title: string) {
  doc.roundedRect(374, 22, 184, 76, 6).strokeColor("#737b86").lineWidth(0.8).stroke();
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text(title, 388, 31, { width: 156, align: "right" });
  doc.fillColor("#f2b27a").fontSize(11).text(invoice.invoiceNumber, 388, 48, { width: 156, align: "right" });
  doc.fillColor("#d8dde3").font("Helvetica").fontSize(7).text(`Date: ${date(invoice.issuedAt)}`, 388, 65, { width: 156, align: "right" });
  doc.text(`Echeance: ${date(invoice.dueDate)}`, 388, 78, { width: 156, align: "right" });
}

function header(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfData,
  title: string,
  issuer: { name: string; logoUrl?: string | null; phone?: string | null; email?: string | null; address?: string | null; legal?: string; rib?: string | null }
) {
  doc.rect(0, 0, page.width, 112).fill(colors.graphite);
  drawLogoOrInitials(doc, 36, 25, 52, issuer.name, issuer.logoUrl);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text(issuer.name, 102, 25, { width: 245 });
  doc.fillColor("#d8dde3").font("Helvetica").fontSize(7.8).text([issuer.phone, issuer.email].filter(Boolean).join("  |  ") || "-", 102, 48, { width: 250 });
  doc.text(clean(issuer.address), 102, 62, { width: 250 });
  doc.fontSize(7).text(issuer.legal || "Informations legales: -", 102, 76, { width: 250 });
  if (issuer.rib) doc.text(`RIB: ${issuer.rib}`, 102, 90, { width: 250 });
  metaBox(doc, invoice, title);
  badge(doc, statusLabel(invoice.status), statusColor(invoice.status), 456, 105, 86);
}

function tableHeader(doc: PDFKit.PDFDocument, x: number, y: number, widths: number[], labels: string[]) {
  doc.roundedRect(x, y, widths.reduce((a, b) => a + b, 0), 24, 4).fill(colors.graphite2);
  let cursor = x;
  labels.forEach((label, index) => {
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), cursor + 8, y + 8, { width: widths[index] - 16 });
    cursor += widths[index];
  });
}

function tableRow(doc: PDFKit.PDFDocument, x: number, y: number, widths: number[], values: string[], shaded = false) {
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  if (shaded) doc.rect(x, y, totalWidth, 27).fill("#fbfcfd");
  doc.rect(x, y, totalWidth, 27).strokeColor(colors.line).lineWidth(0.5).stroke();
  let cursor = x;
  values.forEach((value, index) => {
    if (index > 0) doc.moveTo(cursor, y).lineTo(cursor, y + 27).strokeColor(colors.line).lineWidth(0.5).stroke();
    doc.fillColor(colors.ink).font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(7.8).text(value, cursor + 8, y + 8, {
      width: widths[index] - 16,
      align: index >= values.length - 2 ? "right" : "left",
      height: 12
    });
    cursor += widths[index];
  });
}

function totalsPanel(doc: PDFKit.PDFDocument, x: number, y: number, invoice: InvoicePdfData, deposit?: unknown) {
  const width = 214;
  doc.roundedRect(x, y, width, 128, 6).fill(colors.orangeSoft).strokeColor(colors.orange).lineWidth(0.8).stroke();
  const rows = [
    ["Sous-total", money(invoice.totalAmount, invoice.currency)],
    ["Avance payee", money(invoice.paidAmount, invoice.currency)],
    ["Reste a payer", money(invoice.remainingAmount, invoice.currency)],
    ["Caution", money(deposit ?? 0, invoice.currency)],
    ["Total du", money(invoice.remainingAmount, invoice.currency)]
  ];
  rows.forEach(([label, value], index) => {
    const top = y + 12 + index * 22;
    const highlight = label === "Reste a payer";
    if (highlight) doc.roundedRect(x + 8, top - 4, width - 16, 20, 4).fill("#ffffff").strokeColor(colors.orange).lineWidth(0.5).stroke();
    doc.fillColor(highlight ? colors.orangeDark : colors.muted).font(highlight ? "Helvetica-Bold" : "Helvetica").fontSize(highlight ? 8.8 : 7.5).text(label, x + 16, top, { width: 86 });
    doc.fillColor(highlight ? colors.orangeDark : colors.ink).font("Helvetica-Bold").fontSize(highlight ? 9.4 : 8).text(value, x + 103, top, { width: 92, align: "right" });
  });
}

function footer(doc: PDFKit.PDFDocument, invoice: InvoicePdfData, qrBuffer: Buffer) {
  line(doc, page.margin, 756, page.width - page.margin * 2);
  doc.image(qrBuffer, 452, 642, { width: 78 });
  doc.fillColor(colors.muted).font("Helvetica").fontSize(7).text("Document genere par Rentora", page.margin, 766, { width: 190 });
  doc.text(`Facture ID: ${invoice.id}`, 214, 766, { width: 150, align: "center" });
  doc.text("Page 1/1", 500, 766, { width: 58, align: "right" });
  doc.fillColor(colors.orange).fontSize(5.8).text(invoiceUrl(invoice.id), 410, 725, { width: 142, align: "center" });
}

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function writePdf(doc: PDFKit.PDFDocument, invoice: InvoicePdfData) {
  const output = new PassThrough();
  const pdfBufferPromise = streamToBuffer(output);
  doc.pipe(output);
  doc.end();
  const pdfBuffer = await pdfBufferPromise;
  const saved = await FileStorageService.saveBuffer(pdfBuffer, {
    agencyId: invoice.agencyId ?? "rentora",
    folder: "invoices",
    entityId: invoice.id,
    fileName: `${invoice.invoiceNumber}.pdf`,
    mimeType: "application/pdf"
  });
  return saved.storageKey;
}

export async function generateRentalInvoicePdf(invoice: InvoicePdfData) {
  const doc = new PDFDocument({ size: "A4", margin: page.margin, compress: false, info: { Title: `Facture ${invoice.invoiceNumber}` } });

  const reservation = invoice.reservation;
  const client = reservation?.client;
  const car = reservation?.car;
  const agency = reservation?.agency ?? invoice.agency;
  const qrBuffer = await QRCode.toBuffer(invoiceUrl(invoice.id), { margin: 1, width: 92, errorCorrectionLevel: "M" });

  header(doc, invoice, "FACTURE LOCATION VEHICULE", {
    name: agencyName(agency),
    logoUrl: agency?.logoUrl,
    phone: agency?.phone,
    email: agency?.email,
    address: agencyAddress(agency),
    legal: agencyLegal(agency),
    rib: agency?.rib
  });

  section(doc, "Destinataire", 36, 132, 250);
  field(doc, "Client", client ? `${client.firstName} ${client.lastName}` : "-", 48, 164, 110);
  field(doc, "Telephone", clean(client?.phone), 166, 164, 72);
  field(doc, "Email", clean(client?.email), 48, 195, 110);
  field(doc, "CIN / Passeport", clean(client?.cinOrPassport), 166, 195, 72);
  field(doc, "Permis", clean(client?.drivingLicense), 48, 226, 72);
  field(doc, "Adresse", [client?.address, client?.city].filter(Boolean).join(", ") || "-", 128, 226, 112);

  section(doc, "Reservation", 310, 132, 248);
  field(doc, "Numero", clean(reservation?.id), 322, 164, 96);
  field(doc, "Statut", clean(reservation?.status), 426, 164, 72);
  field(doc, "Debut", date(reservation?.startDate), 322, 195, 72);
  field(doc, "Retour prevu", date(reservation?.endDate), 402, 195, 86);
  field(doc, "Nombre jours", clean(reservation?.totalDays), 496, 195, 50);

  section(doc, "Vehicule", 36, 272, 522);
  field(doc, "Marque", clean(car?.brand), 48, 304, 70);
  field(doc, "Modele", clean(car?.model), 126, 304, 78);
  field(doc, "Annee", clean(car?.year), 212, 304, 48);
  field(doc, "Immatriculation", clean(car?.registrationNumber), 268, 304, 86);
  field(doc, "Couleur", clean(car?.color), 362, 304, 58);
  field(doc, "Carburant", clean(car?.fuelType), 428, 304, 58);
  field(doc, "Transmission", clean(car?.transmission), 494, 304, 54);

  section(doc, "Detail de facturation", 36, 354, 522);
  const widths = [230, 72, 102, 118];
  tableHeader(doc, 36, 386, widths, ["Description", "Quantite", "Prix unitaire", "Total"]);
  tableRow(doc, 36, 410, widths, [
    `Location ${clean(car?.brand)} ${clean(car?.model)} ${clean(car?.registrationNumber)}`,
    `${clean(reservation?.totalDays)} jour(s)`,
    money(reservation?.dailyPrice, invoice.currency),
    money(reservation?.totalAmount, invoice.currency)
  ]);
  tableRow(doc, 36, 437, widths, ["Caution vehicule", "1", money(reservation?.depositAmount, invoice.currency), money(reservation?.depositAmount, invoice.currency)], true);
  tableRow(doc, 36, 464, widths, ["Frais supplementaires / remise / carburant / retard / degats", "-", "-", "-"]);

  section(doc, "Paiement", 36, 522, 250);
  field(doc, "Methode", agency?.rib ? "Virement bancaire" : "-", 48, 554, 90);
  field(doc, "Montant paye", money(invoice.paidAmount, invoice.currency), 146, 554, 88);
  field(doc, "Montant restant", money(invoice.remainingAmount, invoice.currency), 48, 586, 90);
  field(doc, "Banque", clean(agency?.bankName), 146, 586, 88);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(7).text("Coordonnees bancaires", 48, 622, { width: 210 });
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8.2).text(agency?.rib ? `RIB: ${agency.rib}` : "RIB: -", 48, 635, { width: 220 });

  totalsPanel(doc, 334, 526, invoice, reservation?.depositAmount);

  section(doc, "Notes", 36, 680, 522);
  doc.fillColor(colors.ink).font("Helvetica").fontSize(8.2).text(
    "Merci pour votre confiance. Toute infraction, amende, retard, carburant manquant ou dommage constate reste a la charge du locataire selon les conditions de location.",
    48,
    713,
    { width: 490, height: 34 }
  );

  footer(doc, invoice, qrBuffer);
  return writePdf(doc, invoice);
}

export async function generateSaasInvoicePdf(invoice: InvoicePdfData) {
  const doc = new PDFDocument({ size: "A4", margin: page.margin, compress: false, info: { Title: `Facture ${invoice.invoiceNumber}` } });

  const subscription = invoice.subscription;
  const agency = subscription?.agency ?? invoice.agency;
  const plan = subscription?.plan;
  const qrBuffer = await QRCode.toBuffer(invoiceUrl(invoice.id), { margin: 1, width: 92, errorCorrectionLevel: "M" });

  header(doc, invoice, "FACTURE ABONNEMENT RENTORA", {
    name: "Rentora",
    email: env.EMAIL_FROM || "support@rentora.local",
    address: "Plateforme SaaS de gestion de location automobile",
    legal: "Facture SaaS Rentora"
  });

  section(doc, "Destinataire", 36, 132, 250);
  field(doc, "Agence", agencyName(agency), 48, 164, 112);
  field(doc, "Email", clean(agency?.email), 168, 164, 82);
  field(doc, "Telephone", clean(agency?.phone), 48, 195, 82);
  field(doc, "Adresse", agencyAddress(agency), 138, 195, 112);
  field(doc, "ICE / RC / IF", agencyLegal(agency) || "-", 48, 226, 202);

  section(doc, "Abonnement", 310, 132, 248);
  field(doc, "Plan", clean(plan?.name), 322, 164, 92);
  field(doc, "Statut", clean(subscription?.status), 422, 164, 80);
  field(doc, "Periode facturee", `${date(subscription?.startsAt)} - ${date(subscription?.endsAt)}`, 322, 195, 142);
  field(doc, "Debut", date(subscription?.startsAt), 322, 226, 72);
  field(doc, "Fin", date(subscription?.endsAt), 402, 226, 72);
  field(doc, "Intervalle", clean(subscription?.billingInterval), 482, 226, 60);

  section(doc, "Detail de facturation", 36, 292, 522);
  const widths = [230, 130, 78, 84];
  tableHeader(doc, 36, 324, widths, ["Description", "Periode", "Prix", "Total"]);
  tableRow(doc, 36, 348, widths, [
    `Abonnement Rentora ${clean(plan?.name)}`,
    `${date(subscription?.startsAt)} - ${date(subscription?.endsAt)}`,
    money(invoice.totalAmount, invoice.currency),
    money(invoice.totalAmount, invoice.currency)
  ]);
  tableRow(doc, 36, 375, widths, ["Acces plateforme, support et modules actifs du plan", clean(subscription?.billingInterval), "-", "-"], true);

  section(doc, "Synthese", 36, 444, 250);
  field(doc, "Sous-total", money(invoice.totalAmount, invoice.currency), 48, 476, 82);
  field(doc, "Montant paye", money(invoice.paidAmount, invoice.currency), 138, 476, 86);
  field(doc, "Reste a payer", money(invoice.remainingAmount, invoice.currency), 48, 508, 94);
  field(doc, "Total du", money(invoice.remainingAmount, invoice.currency), 150, 508, 74);

  totalsPanel(doc, 334, 454, invoice, 0);

  section(doc, "Notes", 36, 622, 522);
  doc.fillColor(colors.ink).font("Helvetica").fontSize(8.4).text(
    "Cette facture concerne l'acces a la plateforme Rentora. Le paiement valide l'acces au service selon les conditions du plan et la periode indiquee.",
    48,
    654,
    { width: 490, height: 38 }
  );

  footer(doc, invoice, qrBuffer);
  return writePdf(doc, invoice);
}

export async function generateInvoicePdf(invoice: InvoicePdfData) {
  return invoice.type === InvoiceType.SAAS_INVOICE ? generateSaasInvoicePdf(invoice) : generateRentalInvoicePdf(invoice);
}
