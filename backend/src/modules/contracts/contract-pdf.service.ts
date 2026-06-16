import { PassThrough } from "node:stream";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { FileStorageService } from "../files/file-storage.service.js";

type ContractPdfData = Prisma.ContractGetPayload<{
  include: {
    agency: true;
    reservation: {
      include: {
        client: true;
        createdBy: { select: { firstName: true; lastName: true } };
        car: { include: { photos: true } };
      };
    };
  };
}>;

const colors = {
  graphite: "#1f242b",
  ink: "#101418",
  muted: "#626b76",
  line: "#d8dde3",
  soft: "#f4f6f8",
  copper: "#b86b2b",
  copperSoft: "#fff4ea"
};

function clean(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function money(value: unknown) {
  return `${Number(value ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

function date(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function time(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fuel(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : `${value}%`;
}

function contractUrl(contractId: string) {
  return `${env.FRONTEND_APP_URL.replace(/\/$/, "")}/contracts/${contractId}`;
}

function section(doc: PDFKit.PDFDocument, title: string, x: number, y: number, width: number) {
  doc.roundedRect(x, y, width, 18, 3).fill(colors.soft);
  doc.rect(x, y, 3, 18).fill(colors.copper);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8.8).text(title.toUpperCase(), x + 10, y + 5, { width: width - 16 });
}

function labelValue(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number, options?: { highlight?: boolean; large?: boolean }) {
  if (options?.highlight) {
    doc.roundedRect(x - 6, y - 5, width + 12, options.large ? 38 : 32, 4).fill(colors.copperSoft).stroke(colors.copper);
  }
  doc.fillColor(colors.muted).font("Helvetica").fontSize(6.8).text(label.toUpperCase(), x, y, { width });
  doc.fillColor(options?.highlight ? colors.copper : colors.ink)
    .font("Helvetica-Bold")
    .fontSize(options?.large ? 12 : 8.4)
    .text(value, x, y + 9, { width, height: options?.large ? 22 : 16 });
}

function rule(doc: PDFKit.PDFDocument, x: number, y: number, width: number) {
  doc.strokeColor(colors.line).lineWidth(0.6).moveTo(x, y).lineTo(x + width, y).stroke();
}

function box(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number) {
  doc.roundedRect(x, y, width, height, 4).strokeColor(colors.line).lineWidth(0.7).stroke();
}

function checkItem(doc: PDFKit.PDFDocument, label: string, x: number, y: number, width: number) {
  doc.rect(x, y + 1, 8, 8).strokeColor(colors.muted).lineWidth(0.7).stroke();
  doc.fillColor(colors.ink).font("Helvetica").fontSize(7.8).text(label, x + 13, y, { width: width - 13 });
}

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function getPrimaryCarPhoto(contract: ContractPdfData) {
  const photo = contract.reservation.car.photos.find((item) => item.isPrimary) ?? contract.reservation.car.photos[0];
  if (!photo?.storageKey) return null;
  try {
    return streamToBuffer(await FileStorageService.getFileStream(photo.storageKey));
  } catch {
    return null;
  }
}

function addFooter(doc: PDFKit.PDFDocument, contract: ContractPdfData) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    rule(doc, 40, 782, 515);
    doc.fillColor(colors.muted).font("Helvetica").fontSize(7).text("Document genere automatiquement par Rentora", 40, 790, { width: 210, lineBreak: false });
    doc.text(`ID contrat: ${contract.id}`, 245, 790, { width: 180, align: "center", lineBreak: false });
    doc.text(`Page ${i + 1 - range.start}/${range.count}`, 470, 790, { width: 85, align: "right", lineBreak: false });
  }
}

export async function generateContractPdf(contract: ContractPdfData) {
  const doc = new PDFDocument({ size: "A4", margin: 36, bufferPages: true, compress: false, info: { Title: `Contrat ${contract.contractNumber}` } });
  const output = new PassThrough();
  const pdfBufferPromise = streamToBuffer(output);
  doc.pipe(output);

  const reservation = contract.reservation;
  const agency = contract.agency;
  const agencyDisplayName = clean(agency.tradeName ?? agency.name);
  const client = reservation.client;
  const car = reservation.car;
  const digitalUrl = contractUrl(contract.id);
  const qrBuffer = await QRCode.toBuffer(digitalUrl, { margin: 1, width: 92, errorCorrectionLevel: "M" });
  const carPhoto = await getPrimaryCarPhoto(contract);
  const agentName = reservation.createdBy ? `${reservation.createdBy.firstName} ${reservation.createdBy.lastName}` : "-";

  doc.rect(0, 0, 595, 92).fill(colors.graphite);
  doc.roundedRect(36, 22, 46, 46, 6).fill("#ffffff");
  doc.fillColor(colors.graphite).font("Helvetica-Bold").fontSize(14).text(agencyDisplayName.slice(0, 2).toUpperCase(), 48, 38);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text(agencyDisplayName, 94, 20, { width: 250 });
  doc.fillColor("#d8dde3").font("Helvetica").fontSize(7.6).text([agency.phone, agency.email, agency.address, agency.city].filter(Boolean).join("  |  ") || "-", 94, 40, { width: 280, height: 24 });
  doc.fillColor("#d8dde3").fontSize(7).text(`ICE: ${clean(agency.ice)}   RC: ${clean(agency.rc)}   IF: ${clean(agency.ifNumber)}`, 94, 66, { width: 250 });

  doc.roundedRect(395, 18, 160, 54, 5).strokeColor("#69727d").lineWidth(0.8).stroke();
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9).text("CONTRAT DE LOCATION", 407, 26, { width: 136, align: "right" });
  doc.fillColor("#f0b27a").fontSize(11).text(contract.contractNumber, 407, 41, { width: 136, align: "right" });
  doc.fillColor("#d8dde3").font("Helvetica").fontSize(7).text(`Genere le ${date(contract.generatedAt)} a ${time(contract.generatedAt)}`, 407, 58, { width: 136, align: "right" });

  section(doc, "Client", 36, 106, 252);
  labelValue(doc, "Nom complet", `${client.firstName} ${client.lastName}`, 46, 134, 100);
  labelValue(doc, "CIN / Passeport", clean(client.cinOrPassport), 154, 134, 70);
  labelValue(doc, "Permis", clean(client.drivingLicense), 232, 134, 46);
  labelValue(doc, "Telephone", clean(client.phone), 46, 164, 78);
  labelValue(doc, "Email", clean(client.email), 132, 164, 86);
  labelValue(doc, "Adresse", [client.address, client.city].filter(Boolean).join(", ") || "-", 226, 164, 52);

  section(doc, "Location", 307, 106, 252);
  labelValue(doc, "Depart", `${date(reservation.startDate)} ${time(reservation.startDate)}`, 317, 134, 85);
  labelValue(doc, "Retour prevu", `${date(reservation.endDate)} ${time(reservation.endDate)}`, 410, 134, 85);
  labelValue(doc, "Duree", `${reservation.totalDays} jour(s)`, 503, 134, 44);
  labelValue(doc, "Prise vehicule", clean(agency.city), 317, 164, 78);
  labelValue(doc, "Retour vehicule", clean(agency.city), 403, 164, 78);
  labelValue(doc, "Agent", agentName, 489, 164, 58);

  section(doc, "Vehicule", 36, 210, 252);
  if (carPhoto) {
    try {
      doc.roundedRect(46, 238, 78, 55, 5).strokeColor(colors.line).stroke();
      doc.image(carPhoto, 48, 240, { fit: [74, 51], align: "center", valign: "center" });
    } catch {
      doc.roundedRect(46, 238, 78, 55, 5).fill(colors.soft);
    }
  } else {
    doc.roundedRect(46, 238, 78, 55, 5).fill(colors.soft);
    doc.fillColor(colors.muted).font("Helvetica-Bold").fontSize(8).text("PHOTO", 72, 261);
  }
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(13).text(`${car.brand} ${car.model}`, 136, 237, { width: 140 });
  doc.roundedRect(136, 257, 122, 22, 4).fill(colors.graphite);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text(car.registrationNumber, 144, 263, { width: 106, align: "center" });
  labelValue(doc, "Annee", String(car.year), 46, 306, 42);
  labelValue(doc, "Couleur", clean(car.color), 94, 306, 54);
  labelValue(doc, "Transmission", car.transmission, 154, 306, 60);
  labelValue(doc, "Carburant", car.fuelType, 220, 306, 58);
  labelValue(doc, "Km depart", clean(reservation.pickupMileage), 46, 336, 72);
  labelValue(doc, "Carburant depart", fuel(reservation.pickupFuelLevel), 126, 336, 72);

  section(doc, "Paiement", 307, 210, 252);
  labelValue(doc, "Montant total", money(reservation.totalAmount), 317, 238, 78, { large: true });
  labelValue(doc, "Avance", money(reservation.advanceAmount), 403, 238, 64);
  labelValue(doc, "Statut", reservation.paymentStatus, 475, 238, 72);
  labelValue(doc, "Reste a payer", money(reservation.remainingAmount), 317, 286, 104, { highlight: true, large: true });
  labelValue(doc, "Caution", money(reservation.depositAmount), 440, 286, 96, { highlight: true, large: true });

  section(doc, "Etat depart", 36, 390, 252);
  const checkY = 420;
  checkItem(doc, "Carrosserie", 46, checkY, 90);
  checkItem(doc, "Pneus", 142, checkY, 58);
  checkItem(doc, "Pare-brise", 206, checkY, 72);
  checkItem(doc, "Interieur", 46, checkY + 22, 90);
  checkItem(doc, "Documents vehicule", 142, checkY + 22, 136);
  checkItem(doc, "Accessoires", 46, checkY + 44, 90);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(6.8).text("OBSERVATIONS DEPART", 46, 486);
  box(doc, 46, 498, 224, 48);
  doc.fillColor(colors.ink).font("Helvetica").fontSize(7.7).text(clean(reservation.pickupCondition ?? reservation.notes), 54, 506, { width: 208, height: 32 });

  section(doc, "Conditions", 307, 390, 252);
  const conditions = [
    "Permis valide obligatoire pendant toute la duree de location.",
    "Infractions, amendes et peages restent a la charge du client.",
    "Tout accident ou dommage doit etre declare immediatement.",
    "Restitution du vehicule dans le meme etat qu'au depart.",
    "Frais applicables en cas de retard, degats ou carburant manquant."
  ];
  doc.fillColor(colors.ink).font("Helvetica").fontSize(7.8);
  conditions.forEach((item, index) => {
    doc.text(`${index + 1}. ${item}`, 317, 420 + index * 20, { width: 228 });
  });

  section(doc, "Signatures", 36, 574, 342);
  box(doc, 46, 604, 150, 86);
  box(doc, 214, 604, 150, 86);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8).text("Agence", 54, 612, { width: 134 });
  doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text(`Nom: ${agencyDisplayName}`, 54, 630, { width: 134 });
  doc.text("Date signature: -", 54, 646, { width: 134 });
  doc.text("Signature et cachet", 54, 672, { width: 134, align: "center" });
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8).text("Client", 222, 612, { width: 134 });
  doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text(`Nom: ${client.firstName} ${client.lastName}`, 222, 630, { width: 134 });
  doc.text("Date signature: -", 222, 646, { width: 134 });
  doc.text("Signature", 222, 672, { width: 134, align: "center" });

  section(doc, "Verification", 396, 574, 163);
  doc.image(qrBuffer, 438, 602, { width: 76 });
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(7.6).text("Verifier ce contrat :", 406, 684, { width: 140, align: "center", lineBreak: false });
  doc.fillColor(colors.copper).font("Helvetica").fontSize(5.8).text(digitalUrl, 406, 698, { width: 140, align: "center", height: 34 });
  doc.fillColor(colors.muted).fontSize(6.2).text("Page numerique protegee du contrat.", 406, 736, { width: 140, align: "center", lineBreak: false });

  addFooter(doc, contract);
  doc.end();

  const pdfBuffer = await pdfBufferPromise;
  const saved = await FileStorageService.saveBuffer(pdfBuffer, {
    agencyId: contract.agencyId,
    folder: "contracts",
    entityId: contract.id,
    fileName: `${contract.contractNumber}.pdf`,
    mimeType: "application/pdf"
  });

  return saved.storageKey;
}
