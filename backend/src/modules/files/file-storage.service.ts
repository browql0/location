import { randomBytes } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";

export type StoredFile = {
  storageKey: string;
};

export type SaveFileOptions = {
  agencyId: string;
  clientId?: string;
  carId?: string;
  maintenanceId?: string;
  expenseId?: string;
  agencyLogo?: boolean;
  file: Express.Multer.File;
};

export type SaveBufferOptions = {
  agencyId: string;
  folder: "contracts" | "invoices";
  entityId: string;
  fileName: string;
  mimeType: string;
};

export interface FileStorageProvider {
  saveFile(file: Express.Multer.File, options: Omit<SaveFileOptions, "file">): Promise<StoredFile>;
  saveBuffer(buffer: Buffer, options: SaveBufferOptions): Promise<StoredFile>;
  deleteFile(storageKey: string): Promise<void>;
  getFileStream(storageKey: string): Promise<Readable>;
}

const allowedDocumentExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
const allowedPhotoExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const allowedStoragePrefixes = ["clients/", "cars/", "agency-logos/", "maintenance/", "expenses/", "contracts/", "invoices/"];

const maxBytesByMimeType = new Map([
  ["application/pdf", 10 * 1024 * 1024],
  ["image/png", 5 * 1024 * 1024],
  ["image/jpeg", 5 * 1024 * 1024],
  ["image/jpg", 5 * 1024 * 1024],
  ["image/webp", 5 * 1024 * 1024]
]);

function extensionFor(originalName: string) {
  return path.extname(originalName).toLowerCase();
}

function safeFileName(originalName: string) {
  const ext = extensionFor(originalName);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9._-]+/g, "-") || "file";
  return `${Date.now()}-${randomBytes(8).toString("hex")}-${baseName}${ext}`;
}

function storageKeyFor(options: Omit<SaveFileOptions, "file">, originalName: string) {
  if (options.agencyLogo) return `agency-logos/${options.agencyId}/${safeFileName(originalName)}`;
  if (options.expenseId) return `expenses/${options.agencyId}/${options.expenseId}/${safeFileName(originalName)}`;
  if (options.maintenanceId) return `maintenance/${options.agencyId}/${options.maintenanceId}/${safeFileName(originalName)}`;
  if (options.carId) return `cars/${options.agencyId}/${options.carId}/${safeFileName(originalName)}`;
  if (options.clientId) return `clients/${options.agencyId}/${options.clientId}/${safeFileName(originalName)}`;
  throw new AppError("Storage entity id is required", 400, "STORAGE_ENTITY_REQUIRED");
}

function storageKeyForBuffer(options: SaveBufferOptions) {
  if (options.folder === "contracts") return `contracts/${options.agencyId}/${options.entityId}.pdf`;
  if (options.folder === "invoices") return `invoices/${options.agencyId}/${options.entityId}.pdf`;
  throw new AppError("Unsupported generated file folder", 400, "STORAGE_FOLDER_UNSUPPORTED");
}

function assertSafeStorageKey(storageKey: string) {
  if (storageKey.includes("..") || path.isAbsolute(storageKey) || !allowedStoragePrefixes.some((prefix) => storageKey.startsWith(prefix))) {
    throw new AppError("Invalid storage key", 400, "INVALID_STORAGE_KEY");
  }
}

function hasMagicBytes(file: Express.Multer.File) {
  const bytes = file.buffer.subarray(0, 12);
  if (file.mimetype === "application/pdf") return bytes.subarray(0, 4).equals(Buffer.from("%PDF"));
  if (file.mimetype === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === "image/webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

function assertAllowedUploadedFile(file: Express.Multer.File) {
  const maxBytes = maxBytesByMimeType.get(file.mimetype);
  if (!maxBytes) throw new AppError("Unsupported file type", 400, "FILE_UNSUPPORTED_TYPE");
  if (file.size <= 0 || file.size > maxBytes) {
    throw new AppError("Invalid file size", 400, "FILE_INVALID_SIZE", { maxBytes });
  }
  if (!hasMagicBytes(file)) {
    throw new AppError("File content does not match its declared type", 400, "FILE_SIGNATURE_MISMATCH");
  }
}

class R2StorageProvider implements FileStorageProvider {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
      }
    });
  }

  async saveFile(file: Express.Multer.File, options: Omit<SaveFileOptions, "file">) {
    assertAllowedUploadedFile(file);
    const storageKey = storageKeyFor(options, file.originalname);
    await this.putObject(storageKey, file.buffer, file.mimetype, file.size);
    return { storageKey };
  }

  async saveBuffer(buffer: Buffer, options: SaveBufferOptions) {
    const storageKey = storageKeyForBuffer(options);
    await this.putObject(storageKey, buffer, options.mimeType, buffer.length);
    return { storageKey };
  }

  async deleteFile(storageKey: string) {
    assertSafeStorageKey(storageKey);
    await this.client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: storageKey }));
  }

  async getFileStream(storageKey: string) {
    assertSafeStorageKey(storageKey);
    const response = await this.client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: storageKey }));
    if (!(response.Body instanceof Readable)) {
      throw new AppError("Stored file is not readable", 500, "FILE_STREAM_UNAVAILABLE");
    }
    return response.Body;
  }

  private async putObject(storageKey: string, body: Buffer, contentType: string, contentLength: number) {
    assertSafeStorageKey(storageKey);
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: storageKey,
        Body: body,
        ContentType: contentType,
        ContentLength: contentLength
      })
    );
  }
}

const r2StorageProvider = new R2StorageProvider();

export const FileStorageService: FileStorageProvider = {
  saveFile(file, options) {
    return r2StorageProvider.saveFile(file, options);
  },
  saveBuffer(buffer, options) {
    return r2StorageProvider.saveBuffer(buffer, options);
  },
  deleteFile(storageKey) {
    return r2StorageProvider.deleteFile(storageKey);
  },
  getFileStream(storageKey) {
    return r2StorageProvider.getFileStream(storageKey);
  }
};

export function isAllowedClientDocumentFile(file: Pick<Express.Multer.File, "mimetype" | "originalname">) {
  const allowedMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg"]);
  const ext = extensionFor(file.originalname);
  if (!file.mimetype || !allowedMimeTypes.has(file.mimetype)) return false;
  if (!allowedDocumentExtensions.has(ext)) return false;
  if (file.mimetype === "application/pdf") return ext === ".pdf";
  if (file.mimetype === "image/png") return ext === ".png";
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") return ext === ".jpg" || ext === ".jpeg";
  return false;
}

export function isAllowedCarPhotoFile(file: Pick<Express.Multer.File, "mimetype" | "originalname">) {
  const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
  const ext = extensionFor(file.originalname);
  if (!file.mimetype || !allowedMimeTypes.has(file.mimetype)) return false;
  if (!allowedPhotoExtensions.has(ext)) return false;
  if (file.mimetype === "image/png") return ext === ".png";
  if (file.mimetype === "image/webp") return ext === ".webp";
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") return ext === ".jpg" || ext === ".jpeg";
  return false;
}

export function isAllowedAgencyLogoFile(file: Pick<Express.Multer.File, "mimetype" | "originalname">) {
  return isAllowedCarPhotoFile(file);
}

export function isAllowedMaintenanceDocumentFile(file: Pick<Express.Multer.File, "mimetype" | "originalname">) {
  return isAllowedClientDocumentFile(file);
}
